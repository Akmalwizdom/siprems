import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/database';
import { verifyFirebaseIdToken } from '../services/firebase-auth';

export type UserRole = 'user' | 'admin';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
}

function extractBearerToken(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
}

/**
 * Middleware to authenticate user by Firebase ID token and
 * fetch user role from Supabase.
 */
export async function authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const token = extractBearerToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        try {
            const verifiedUser = await verifyFirebaseIdToken(token);
            const userId = verifiedUser.uid;
            const email = verifiedUser.email || `${userId}@firebase.local`;

            // Fetch user role from Supabase
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, email, role')
                .eq('firebase_uid', userId)
                .single();

            if (error || !userData) {
                const displayName = verifiedUser.name || null;
                const avatarUrl = verifiedUser.picture || null;

                // Default role for new users (Phase 2 security hardening).
                // Admins must be promoted explicitly via user management.
                const assignedRole: UserRole = 'user';

                console.log(`[Auth] Creating new user: ${email}, role: ${assignedRole}`);

                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        firebase_uid: userId,
                        email,
                        role: assignedRole,
                        display_name: displayName,
                        avatar_url: avatarUrl,
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating user:', createError);
                    return res.status(500).json({ error: 'Failed to create user' });
                }

                req.user = {
                    id: newUser.id,
                    email: newUser.email,
                    role: newUser.role as UserRole,
                };
            } else {
                req.user = {
                    id: userData.id,
                    email: userData.email,
                    role: userData.role as UserRole,
                };
            }

            next();
        } catch (verifyError) {
            console.error('[Auth] Token verification failed:', verifyError);
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Middleware factory to require specific role(s)
 */
export function requireRole(...allowedRoles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: Not authenticated' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden: Insufficient permissions',
                required: allowedRoles,
                current: req.user.role,
            });
        }

        next();
    };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
        return next(); // Continue without auth
    }

    // If token provided, validate it
    return authenticate(req, res, next);
}
