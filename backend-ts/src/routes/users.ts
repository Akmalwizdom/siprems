import { Router, Response } from 'express';
import { supabase } from '../services/database';
import { authenticate, requireAdmin, AuthenticatedRequest, UserRole } from '../middleware/auth';

const router = Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user!.id)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search as string;

        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (search) {
            query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            data,
            total: count,
            page,
            limit,
            total_pages: Math.ceil((count || 0) / limit),
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/users/:id
 * Get user by ID (Admin only)
 */
router.get('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(data);
    } catch (error: any) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/users/:id/role
 * Update user role (Admin only)
 */
router.put('/:id/role', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body as { role: UserRole };

        // Validate role
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
        }

        // Prevent self-demotion
        if (id === req.user!.id && role !== 'admin') {
            return res.status(400).json({ error: 'Cannot demote yourself' });
        }

        const { data, error } = await supabase
            .from('users')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Role updated successfully', user: data });
    } catch (error: any) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { display_name, avatar_url } = req.body;

        const updates: any = { updated_at: new Date().toISOString() };
        if (display_name !== undefined) updates.display_name = display_name;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.user!.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user!.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
