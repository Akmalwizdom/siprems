import { Router, Response } from 'express';
import { db } from '../services/database';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

// GET /api/settings/store
router.get('/store', async (req, res: Response) => {
    try {
        const { rows } = await db.query('SELECT * FROM store_settings WHERE id = 1');
        
        if (rows.length === 0) {
            return res.json({
                status: 'success',
                data: { name: '', address: '', phone: '', logo_url: '' }
            });
        }

        const data = rows[0];
        res.json({
            status: 'success',
            data: {
                name: data.name || '',
                address: data.address || '',
                phone: data.phone || '',
                logo_url: data.logo_url || ''
            }
        });
    } catch (error: any) {
        console.error('[Settings] Error fetching store settings:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// PUT /api/settings/store
router.put('/store', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, address, phone, logo_url } = req.body;

        const { rows } = await db.query(
            `INSERT INTO store_settings (id, name, address, phone, logo_url) 
             VALUES (1, $1, $2, $3, $4) 
             ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name, 
                address = EXCLUDED.address, 
                phone = EXCLUDED.phone, 
                logo_url = EXCLUDED.logo_url,
                updated_at = NOW()
             RETURNING *`,
            [name || '', address || '', phone || '', logo_url || '']
        );

        const data = rows[0];
        res.json({
            status: 'success',
            message: 'Store settings updated successfully',
            data: {
                name: data.name || '',
                address: data.address || '',
                phone: data.phone || '',
                logo_url: data.logo_url || ''
            }
        });
    } catch (error: any) {
        console.error('[Settings] Error updating store settings:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// POST /api/settings/store/logo
router.post('/store/logo', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
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
        const filename = `store-logo-${Date.now()}.${extension}`;
        
        const uploadDir = path.join(__dirname, '../../public/uploads/logos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);

        const logoUrl = `/uploads/logos/${filename}`;

        const { rows } = await db.query(
            'UPDATE store_settings SET logo_url = $1, updated_at = NOW() WHERE id = 1 RETURNING *',
            [logoUrl]
        );

        res.json({
            status: 'success',
            logo_url: logoUrl,
            data: rows[0]
        });
    } catch (error: any) {
        console.error('[Settings] Error uploading store logo:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

export default router;
