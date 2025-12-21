import { Router, Response } from 'express';
import { supabase, supabaseAdmin } from '../services/database';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/settings/store - Get store profile
router.get('/store', async (req, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            // If table doesn't exist or no row, return empty defaults
            if (error.code === 'PGRST116') {
                return res.json({
                    status: 'success',
                    data: {
                        name: '',
                        address: '',
                        phone: '',
                        logo_url: ''
                    }
                });
            }
            throw error;
        }

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
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// PUT /api/settings/store - Update store profile (Admin only)
router.put('/store', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, address, phone, logo_url } = req.body;

        const { data, error } = await supabase
            .from('store_settings')
            .upsert({
                id: 1,
                name: name || '',
                address: address || '',
                phone: phone || '',
                logo_url: logo_url || ''
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;

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
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// POST /api/settings/store/logo - Upload store logo (Admin only)
router.post('/store/logo', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { image } = req.body; // Base64 encoded image

        if (!image) {
            return res.status(400).json({
                status: 'error',
                error: 'Image data is required'
            });
        }

        // Extract base64 data and content type
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({
                status: 'error',
                error: 'Invalid image format. Expected base64 data URL.'
            });
        }

        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate filename
        const extension = contentType.split('/')[1] || 'jpg';
        const filename = `store-logo-${Date.now()}.${extension}`;
        const filePath = `logos/${filename}`;

        // Upload to Supabase Storage (using admin client to bypass RLS)
        const { error: uploadError } = await supabaseAdmin.storage
            .from('store-assets')
            .upload(filePath, buffer, {
                contentType,
                upsert: true
            });

        if (uploadError) {
            console.error('[Settings] Logo upload error:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('store-assets')
            .getPublicUrl(filePath);

        const logoUrl = urlData.publicUrl;

        // Update store_settings with new logo URL
        const { data, error } = await supabase
            .from('store_settings')
            .update({ logo_url: logoUrl })
            .eq('id', 1)
            .select()
            .single();

        if (error) throw error;

        res.json({
            status: 'success',
            logo_url: logoUrl,
            data
        });
    } catch (error: any) {
        console.error('[Settings] Error uploading store logo:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

export default router;
