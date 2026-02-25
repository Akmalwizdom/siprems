import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/database';

export type UserRole = 'user' | 'admin';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
}

/**
 * Middleware to authenticate user by Firebase ID token
 * and fetch user role from Supabase
 */
export async function authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        // Decode Firebase ID token (we'll verify on frontend, backend trusts the UID)
        // In production, you should verify the token with Firebase Admin SDK
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
        }

        try {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            const userId = payload.user_id || payload.sub;
            const email = payload.email;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }

            // Fetch user role from Supabase
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, email, role')
                .eq('firebase_uid', userId)
                .single();

            if (error || !userData) {
                // User not found in our database, create with appropriate role
                // Firebase JWT contains 'name' and 'picture' for Google accounts
                const displayName = payload.name || null;
                const avatarUrl = payload.picture || null;

                // Check if this is the first user (database is empty)
                // First user automatically becomes admin (for UMKM owner)
                const { count: userCount, error: countError } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true });

                // For demo purposes: all new users get admin role
                // In production, change 'admin' back to: isFirstUser ? 'admin' : 'user'
                const assignedRole: UserRole = 'admin';

                console.log(`[Auth] Creating new user: ${email}, role: ${assignedRole}`);

                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        firebase_uid: userId,
                        email: email,
                        role: assignedRole, // Demo: all users get admin access
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
        } catch (decodeError) {
            return res.status(401).json({ error: 'Unauthorized: Failed to decode token' });
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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continue without auth
    }

    // If token provided, validate it
    return authenticate(req, res, next);
}
