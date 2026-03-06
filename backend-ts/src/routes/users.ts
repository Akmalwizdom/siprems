import { Router, Response } from 'express';
import { db } from '../services/database';
import { authenticate, requireAdmin, AuthenticatedRequest, UserRole } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * GET /api/users/me
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user!.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error: any) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/users
 */
router.get('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search as string;

        let queryText = 'SELECT *, count(*) OVER() AS total_count FROM users';
        const queryParams: any[] = [];
        let whereClauses: string[] = [];

        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`(email ILIKE $${queryParams.length} OR display_name ILIKE $${queryParams.length})`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        queryParams.push(limit, offset);
        queryText += ` ORDER BY created_at DESC LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

        const { rows } = await db.query(queryText, queryParams);
        const total = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
        const total_pages = Math.ceil(total / limit);

        const data = rows.map(r => {
            const { total_count, ...rest } = r;
            return rest;
        });

        res.json({
            data,
            total,
            page,
            limit,
            total_pages,
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/users/:id
 */
router.get('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error: any) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/users/:id/role
 */
router.put('/:id/role', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body as { role: UserRole };

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
        }

        if (id === req.user!.id && role !== 'admin') {
            return res.status(400).json({ error: 'Cannot demote yourself' });
        }

        const { rows } = await db.query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [role, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Role updated successfully', user: rows[0] });
    } catch (error: any) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/users/me
 */
router.put('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { display_name, avatar_url } = req.body;
        const updates: any = {};
        if (display_name !== undefined) updates.display_name = display_name;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        const keys = Object.keys(updates);
        if (keys.length === 0) {
            const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user!.id]);
            return res.json(rows[0]);
        }

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = Object.values(updates);

        const { rows } = await db.query(
            `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [req.user!.id, ...values]
        );

        res.json(rows[0]);
    } catch (error: any) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/users/:id
 */
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (id === req.user!.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/users/avatar
 */
router.post('/avatar', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ status: 'error', error: 'Image data is required' });
        }

        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ status: 'error', error: 'Invalid image format.' });
        }

        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        const extension = contentType.split('/')[1] || 'jpg';
        const filename = `avatar-${req.user!.id}-${Date.now()}.${extension}`;
        
        const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);

        const avatarUrl = `/uploads/avatars/${filename}`;

        const { rows } = await db.query(
            'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [avatarUrl, req.user!.id]
        );

        res.json({
            status: 'success',
            avatar_url: avatarUrl,
            user: rows[0]
        });
    } catch (error: any) {
        console.error('[Users] Error uploading avatar:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

export default router;
