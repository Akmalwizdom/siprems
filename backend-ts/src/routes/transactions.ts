import { Router, Response } from 'express';
import { supabase, supabaseAdmin } from '../services/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { formatWibIsoTimestamp, formatWibDateString } from '../utils/wib-time';

const router = Router();

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
            const today = formatWibDateString();
            startDate = today;
            endDate = today;
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            const endDatePlusOne = new Date(endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            query = query.lt('date', endDatePlusOne.toISOString().split('T')[0]);
        }

        const { data: transactions, error: txError, count } = await query.range(from, to);

        if (txError) throw txError;

        // OPTIMIZED: Batch fetch all transaction items in a single query
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

        const transactionsWithItems = (transactions || []).map(tx => ({
            ...tx,
            items: itemsMap[tx.id] || []
        }));

        const total = count || 0;
        const total_pages = Math.ceil(total / limit);

        res.json({
            status: 'success',
            data: transactionsWithItems,
            meta: { total, total_pages, page, limit },
        });
    } catch (error: any) {
        console.error('[Transactions] Get all failed:', error);
        res.status(500).json({
            status: 'error',
            error: { code: 'TRANSACTIONS_FETCH_ERROR', message: error.message },
        });
    }
});

// Create new transaction using atomic RPC (All authenticated users can create)
// Idempotency middleware prevents duplicate transactions on retry.
router.post('/', authenticate, idempotency, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { items, payment_method, order_types, total_amount, items_count } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: { code: 'VALIDATION_ERROR', message: 'Items array is required and must not be empty' },
            });
        }

        if (total_amount === undefined || total_amount === null) {
            return res.status(400).json({
                status: 'error',
                error: { code: 'VALIDATION_ERROR', message: 'total_amount is required' },
            });
        }

        // Call atomic stored procedure via Supabase RPC.
        // This performs: insert transaction → insert items → update stock
        // in a single DB transaction with SELECT ... FOR UPDATE.
        const { data, error } = await supabaseAdmin.rpc('create_transaction_atomic', {
            p_total_amount: total_amount,
            p_payment_method: payment_method || 'Cash',
            p_order_types: order_types || 'dine-in',
            p_items_count: items_count || items.length,
            p_date: formatWibIsoTimestamp(),
            p_items: items.map((item: any) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
            })),
        });

        if (error) {
            // Handle known business errors from the stored procedure
            if (error.message?.includes('Insufficient stock')) {
                return res.status(409).json({
                    status: 'error',
                    error: { code: 'INSUFFICIENT_STOCK', message: error.message },
                });
            }
            if (error.message?.includes('not found')) {
                return res.status(404).json({
                    status: 'error',
                    error: { code: 'PRODUCT_NOT_FOUND', message: error.message },
                });
            }
            throw error;
        }

        res.json({
            status: 'success',
            data: {
                transaction_id: data.transaction_id,
                transaction: data,
            },
        });
    } catch (error: any) {
        console.error('[Transactions] Create failed:', error);
        res.status(500).json({
            status: 'error',
            error: { code: 'TRANSACTION_CREATE_ERROR', message: error.message },
        });
    }
});

export default router;
