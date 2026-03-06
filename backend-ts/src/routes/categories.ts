import { Router, Request, Response } from 'express';
import { db } from '../services/database';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all categories - Public access
router.get('/', async (req: Request, res: Response) => {
    try {
        const { rows } = await db.query('SELECT * FROM categories ORDER BY name ASC');

        res.json({
            status: 'success',
            categories: rows || []
        });
    } catch (error: any) {
        console.error('[Categories] Get all failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Create category - Admin only
router.post('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                status: 'error',
                error: 'Category name is required'
            });
        }

        const { rows } = await db.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name.trim(), description?.trim() || null]
        );

        res.json({
            status: 'success',
            category: rows[0]
        });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({
                status: 'error',
                error: 'Category already exists'
            });
        }
        console.error('[Categories] Create failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Update category - Admin only
router.patch('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const { rows: checkRows } = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (checkRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                error: 'Category not found'
            });
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description?.trim() || null;

        const keys = Object.keys(updates);
        if (keys.length === 0) {
            return res.json({ status: 'success', category: checkRows[0] });
        }

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = Object.values(updates);

        const { rows } = await db.query(
            `UPDATE categories SET ${setClause}, created_at = created_at WHERE id = $1 RETURNING *`,
            [id, ...values]
        );

        res.json({
            status: 'success',
            category: rows[0]
        });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({
                status: 'error',
                error: 'Category name already exists'
            });
        }
        console.error('[Categories] Update failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Delete category - Admin only
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Get category name
        const { rows: catRows } = await db.query('SELECT name FROM categories WHERE id = $1', [id]);
        if (catRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                error: 'Category not found'
            });
        }
        const categoryName = catRows[0].name;

        // Check if category is in use by products
        const { rows: products } = await db.query(
            'SELECT id FROM products WHERE category = $1 LIMIT 1',
            [categoryName]
        );

        if (products && products.length > 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Cannot delete category that is in use by products'
            });
        }

        await db.query('DELETE FROM categories WHERE id = $1', [id]);

        res.json({
            status: 'success',
            message: 'Category deleted successfully'
        });
    } catch (error: any) {
        console.error('[Categories] Delete failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

export default router;
