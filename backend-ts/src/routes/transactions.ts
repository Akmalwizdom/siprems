import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../services/database';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper function to get current date in local timezone (GMT+7)
// This ensures transactions are recorded with the correct local date
function getLocalISOString(): string {
    const now = new Date();
    // Get the local time components in WIB (GMT+7)
    const wibOffset = 7 * 60; // +7 hours in minutes
    const utcOffset = now.getTimezoneOffset(); // Browser's UTC offset in minutes (negative for ahead of UTC)
    const totalOffset = wibOffset + utcOffset; // Total adjustment needed

    const wibTime = new Date(now.getTime() + totalOffset * 60 * 1000);

    // Format as ISO 8601 with explicit timezone
    const year = wibTime.getUTCFullYear();
    const month = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(wibTime.getUTCDate()).padStart(2, '0');
    const hours = String(wibTime.getUTCHours()).padStart(2, '0');
    const minutes = String(wibTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(wibTime.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
}

// Helper function to get today's date in YYYY-MM-DD format (local timezone)
function getLocalDateString(): string {
    const now = new Date();
    // Get the local time components in WIB (GMT+7)
    const wibOffset = 7 * 60; // +7 hours in minutes
    const utcOffset = now.getTimezoneOffset(); // Server's UTC offset in minutes
    const totalOffset = wibOffset + utcOffset; // Total adjustment needed

    const wibTime = new Date(now.getTime() + totalOffset * 60 * 1000);

    const year = wibTime.getUTCFullYear();
    const month = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(wibTime.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Get all transactions with pagination
// Users can only see today's transactions, admins can filter by any date
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        let startDate = req.query.startDate as string;
        let endDate = req.query.endDate as string;

        // For non-admin users, restrict to today's transactions only
        if (req.user?.role !== 'admin') {
            const today = getLocalDateString();
            startDate = today;
            endDate = today;
        }

        // Build query with join to get items
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // Build query - use created_at for sorting to ensure newest transactions appear first
        // (synthetic data may have future dates but older created_at)
        let query = supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Apply date filters if provided
        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            // Add one day to include the end date fully
            const endDatePlusOne = new Date(endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            query = query.lt('date', endDatePlusOne.toISOString().split('T')[0]);
        }

        // Get transactions with count
        const { data: transactions, error: txError, count } = await query.range(from, to);

        if (txError) throw txError;

        // OPTIMIZED: Batch fetch all transaction items in a single query instead of N+1 queries
        const txIds = (transactions || []).map(tx => tx.id);
        let itemsMap: Record<string, any[]> = {};

        if (txIds.length > 0) {
            const { data: allItems, error: itemsError } = await supabase
                .from('transaction_items')
                .select(`
                    *,
                    products!transaction_items_product_id_fkey (
                        name
                    )
                `)
                .in('transaction_id', txIds);

            if (itemsError) {
                console.error('[Transactions] Error fetching items:', itemsError);
            } else {
                // Group items by transaction_id
                (allItems || []).forEach((item: any) => {
                    if (!itemsMap[item.transaction_id]) {
                        itemsMap[item.transaction_id] = [];
                    }
                    itemsMap[item.transaction_id].push({
                        ...item,
                        product_name: item.products?.name || `Product ${item.product_id}`
                    });
                });
            }
        }

        // Map transactions with their items
        const transactionsWithItems = (transactions || []).map(tx => ({
            ...tx,
            items: itemsMap[tx.id] || []
        }));

        const total = count || 0;
        const total_pages = Math.ceil(total / limit);

        res.json({
            data: transactionsWithItems,
            total,
            total_pages,
            page,
            limit
        });
    } catch (error: any) {
        console.error('[Transactions] Get all failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Create new transaction (All authenticated users can create)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { items, payment_method, order_types, total_amount, items_count } = req.body;



        if (!items || !Array.isArray(items) || items.length === 0) {

            return res.status(400).json({
                status: 'error',
                error: 'Items array is required'
            });
        }

        // Validate total_amount
        if (total_amount === undefined || total_amount === null) {

            return res.status(400).json({
                status: 'error',
                error: 'total_amount is required'
            });
        }



        // Create transaction with correct column name 'date'
        // Use supabaseAdmin to bypass RLS policies
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                total_amount,
                payment_method: payment_method || 'Cash',
                order_types: order_types || 'dine-in',
                items_count: items_count || items.length,
                date: getLocalISOString(),
            })
            .select()
            .single();

        if (txError) {
            console.error('[Transactions] Failed to insert transaction:', txError);
            console.error('[Transactions] Error details:', JSON.stringify(txError, null, 2));
            throw txError;
        }



        // Insert transaction items using supabaseAdmin
        const transactionItems = items.map((item: any) => ({
            transaction_id: transaction.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('transaction_items')
            .insert(transactionItems);

        if (itemsError) {
            console.error('[Transactions] Failed to insert transaction items:', itemsError);
            throw itemsError;
        }

        // OPTIMIZED: Batch fetch all products first, then update in parallel
        const productIds = items.map((item: any) => item.product_id);

        // Single query to get all product stocks
        const { data: products, error: getError } = await supabaseAdmin
            .from('products')
            .select('id, stock')
            .in('id', productIds);

        if (getError) {
            console.error('[Transactions] Failed to batch fetch products:', getError);
        } else if (products) {
            // Create a map of product_id to current stock
            const stockMap: Record<number, number> = {};
            products.forEach(p => { stockMap[p.id] = p.stock || 0; });

            // Prepare updates and execute in parallel
            const updatePromises = items.map(async (item: any) => {
                const currentStock = stockMap[item.product_id] || 0;
                const newStock = Math.max(0, currentStock - item.quantity);

                return supabaseAdmin
                    .from('products')
                    .update({ stock: newStock })
                    .eq('id', item.product_id);
            });

            const updateResults = await Promise.all(updatePromises);
            const failures = updateResults.filter(r => r.error);
            if (failures.length > 0) {
                console.error(`[Transactions] ${failures.length} stock updates failed`);
            }
        }



        res.json({
            status: 'success',
            transaction_id: transaction.id,
            transaction: {
                ...transaction,
                items: transactionItems,
            }
        });
    } catch (error: any) {
        console.error('[Transactions] Create failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

export default router;
