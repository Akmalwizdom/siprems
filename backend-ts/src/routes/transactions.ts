import { Router, Request, Response } from 'express';
import { supabase } from '../services/database';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

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
            const today = new Date().toISOString().split('T')[0];
            startDate = today;
            endDate = today;
        }

        // Build query with join to get items
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // Build query
        let query = supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .order('date', { ascending: false });

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

        // For each transaction, get its items with product names
        const transactionsWithItems = await Promise.all(
            (transactions || []).map(async (tx) => {
                // Get items and join with products to get product names
                const { data: items } = await supabase
                    .from('transaction_items')
                    .select(`
                        *,
                        products!transaction_items_product_id_fkey (
                            name
                        )
                    `)
                    .eq('transaction_id', tx.id);

                // Format items to include product_name
                const formattedItems = (items || []).map((item: any) => ({
                    ...item,
                    product_name: item.products?.name || `Product ${item.product_id}`
                }));

                return {
                    ...tx,
                    items: formattedItems
                };
            })
        );

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

        // Create transaction with correct column name 'date'
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
                total_amount,
                payment_method: payment_method || 'Cash',
                order_types: order_types || 'dine-in',
                items_count: items_count || items.length,
                date: new Date().toISOString(),
            })
            .select()
            .single();

        if (txError) throw txError;

        // Insert transaction items
        const transactionItems = items.map((item: any) => ({
            transaction_id: transaction.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
        }));

        const { error: itemsError } = await supabase
            .from('transaction_items')
            .insert(transactionItems);

        if (itemsError) throw itemsError;

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
