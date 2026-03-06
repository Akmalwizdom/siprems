import { Request, Response, NextFunction } from 'express';
import { db } from '../services/database';
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
            const firebaseUid = verifiedUser.uid;
            
            // Fetch user from PostgreSQL
            const { rows } = await db.query(
                'SELECT id, email, role FROM users WHERE firebase_uid = $1',
                [firebaseUid]
            );

            if (rows.length === 0) {
                const email = verifiedUser.email || `${firebaseUid}@firebase.local`;
                const displayName = verifiedUser.name || null;
                const avatarUrl = verifiedUser.picture || null;
                const assignedRole: UserRole = 'user';

                console.log(`[Auth] Creating new user: ${email}, role: ${assignedRole}`);

                const { rows: newRows } = await db.query(
                    `INSERT INTO users (firebase_uid, email, role, display_name, avatar_url) 
                     VALUES ($1, $2, $3, $4, $5) 
                     RETURNING id, email, role`,
                    [firebaseUid, email, assignedRole, displayName, avatarUrl]
                );

                const newUser = newRows[0];
                req.user = {
                    id: newUser.id,
                    email: newUser.email,
                    role: newUser.role as UserRole,
                };
            } else {
                const userData = rows[0];
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

export const requireAdmin = requireRole('admin');

export async function optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
        return next();
    }
    return authenticate(req, res, next);
}
