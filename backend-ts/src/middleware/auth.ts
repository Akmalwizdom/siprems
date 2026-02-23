import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
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
 * Middleware to authenticate user by Firebase ID token.
 * 
 * SECURITY: Uses Firebase Admin SDK to cryptographically verify
 * the JWT signature, expiration, audience, and issuer.
 * This replaces the previous insecure base64-decode approach.
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

        // SECURITY FIX: Verify token cryptographically with Firebase Admin SDK
        // This validates the signature, expiration, audience, and issuer
        let decodedToken;
        try {
            decodedToken = await firebaseAuth.verifyIdToken(token);
        } catch (verifyError) {
            console.warn('[Auth] Token verification failed:', (verifyError as Error).message);
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        }

        const userId = decodedToken.uid;
        const email = decodedToken.email || '';

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Token missing user ID' });
        }

        // Look up user in Supabase by Firebase UID
        const { data: userData, error } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('firebase_uid', userId)
            .single();

        if (error || !userData) {
            // New user — auto-provision with correct role assignment
            const displayName = decodedToken.name || null;
            const avatarUrl = decodedToken.picture || null;

            // SECURITY FIX: Only the FIRST user gets admin role (business owner).
            // All subsequent users get 'user' role by default.
            const { count: userCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            const isFirstUser = userCount === 0;
            const assignedRole: UserRole = isFirstUser ? 'admin' : 'user';

            console.log(`[Auth] Creating new user: ${email}, role: ${assignedRole}, isFirst: ${isFirstUser}`);

            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    firebase_uid: userId,
                    email: email,
                    role: assignedRole,
                    display_name: displayName,
                    avatar_url: avatarUrl,
                })
                .select()
                .single();

            if (createError) {
                console.error('[Auth] Failed to create user:', createError);
                return res.status(500).json({ error: 'Failed to create user record' });
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
    } catch (error) {
        console.error('[Auth] Unexpected error:', error);
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
