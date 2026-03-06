import { Router, Request, Response } from 'express';
import { db } from '../services/database';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../schemas';
import { sendSuccess, sendError } from '../utils/response';
import fs from 'fs';
import path from 'path';

const router = Router();

// Get all products with pagination
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const category = req.query.category as string;
        const offset = (page - 1) * limit;

        let queryText = 'SELECT *, count(*) OVER() AS total_count FROM products';
        const queryParams: any[] = [];
        let whereClauses: string[] = [];

        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`(name ILIKE $${queryParams.length} OR category ILIKE $${queryParams.length} OR sku ILIKE $${queryParams.length})`);
        }

        if (category && category !== 'All') {
            queryParams.push(category);
            whereClauses.push(`category = $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        queryParams.push(limit, offset);
        queryText += ` ORDER BY name ASC LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

        const { rows } = await db.query(queryText, queryParams);
        
        const total = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
        const total_pages = Math.ceil(total / limit);

        // Hapus total_count dari setiap baris data
        const data = rows.map(r => {
            const { total_count, ...rest } = r;
            return rest;
        });

        res.json({
            data: data || [],
            total,
            total_pages,
            page,
            limit
        });
    } catch (error: any) {
        console.error('[Products] Get all failed:', error);
        sendError(res, 'PRODUCTS_FETCH_ERROR', error.message);
    }
});

// Get product categories
router.get('/categories', async (req: Request, res: Response) => {
    try {
        const { rows } = await db.query('SELECT name FROM categories ORDER BY name ASC');
        const categories = rows.map(c => c.name);
        res.json({ categories });
    } catch (error: any) {
        console.error('[Products] Get categories failed:', error);
        sendError(res, 'CATEGORIES_FETCH_ERROR', error.message);
    }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const product = await db.products.getById(req.params.id);
        if (!product) {
            return sendError(res, 'PRODUCT_NOT_FOUND', 'Product not found', 404);
        }
        sendSuccess(res, { product });
    } catch (error: any) {
        console.error('[Products] Get by ID failed:', error);
        sendError(res, 'PRODUCT_FETCH_ERROR', error.message);
    }
});

// Update product
router.patch('/:id', authenticate, requireAdmin, validate(updateProductSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { stock, price, ...rest } = req.body;

        const updates: any = { ...rest };
        if (stock !== undefined) updates.stock = stock;
        if (price !== undefined) updates.selling_price = price;

        const product = await db.products.update(id, updates);
        sendSuccess(res, { product });
    } catch (error: any) {
        console.error('[Products] Update failed:', error);
        sendError(res, 'PRODUCT_UPDATE_ERROR', error.message);
    }
});

// Create product
router.post('/', authenticate, requireAdmin, validate(createProductSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, category, sku, stock, selling_price, cost_price, image_url, description } = req.body;

        const { rows } = await db.query(
            'INSERT INTO products (name, category, sku, stock, selling_price, cost_price, image_url, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, category || 'Uncategorized', sku || null, stock || 0, selling_price, cost_price || 0, image_url || null, description || null]
        );

        sendSuccess(res, { product: rows[0] });
    } catch (error: any) {
        console.error('[Products] Create failed:', error);
        sendError(res, 'PRODUCT_CREATE_ERROR', error.message);
    }
});

// Delete product
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        sendSuccess(res, { message: 'Product deleted successfully' });
    } catch (error: any) {
        console.error('[Products] Delete failed:', error);
        sendError(res, 'PRODUCT_DELETE_ERROR', error.message);
    }
});

// Upload product image
router.post('/:id/image', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { image } = req.body;

        if (!image) {
            return sendError(res, 'VALIDATION_ERROR', 'Image data is required', 400);
        }

        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return sendError(res, 'VALIDATION_ERROR', 'Invalid image format.', 400);
        }

        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        const extension = contentType.split('/')[1] || 'jpg';
        const filename = `product-${id}-${Date.now()}.${extension}`;
        
        // Simpan ke direktori lokal
        const uploadDir = path.join(__dirname, '../../public/uploads/products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);

        // URL lokal (relatif ke backend)
        const imageUrl = `/uploads/products/${filename}`;

        const { rows } = await db.query(
            'UPDATE products SET image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [imageUrl, id]
        );

        sendSuccess(res, { image_url: imageUrl, product: rows[0] });
    } catch (error: any) {
        console.error('[Products] Image upload failed:', error);
        sendError(res, 'IMAGE_UPLOAD_ERROR', error.message);
    }
});

export default router;
