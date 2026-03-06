import { Router, Response } from 'express';
import { db } from '../services/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { formatWibIsoTimestamp, formatWibDateString } from '../utils/wib-time';

const router = Router();

// Get all transactions with pagination
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        let startDate = req.query.startDate as string;
        let endDate = req.query.endDate as string;
        const offset = (page - 1) * limit;

        if (req.user?.role !== 'admin') {
            const today = formatWibDateString();
            startDate = today;
            endDate = today;
        }

        let queryText = 'SELECT *, count(*) OVER() AS total_count FROM transactions';
        const queryParams: any[] = [];
        let whereClauses: string[] = [];

        if (startDate) {
            queryParams.push(startDate);
            whereClauses.push(`date >= $${queryParams.length}`);
        }
        if (endDate) {
            const endDatePlusOne = new Date(endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            queryParams.push(endDatePlusOne.toISOString().split('T')[0]);
            whereClauses.push(`date < $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        queryParams.push(limit, offset);
        queryText += ` ORDER BY created_at DESC LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

        const { rows: transactions } = await db.query(queryText, queryParams);
        const total = transactions.length > 0 ? parseInt(transactions[0].total_count) : 0;
        const total_pages = Math.ceil(total / limit);

        const txIds = transactions.map(tx => tx.id);
        let itemsMap: Record<string, any[]> = {};

        if (txIds.length > 0) {
            const { rows: allItems } = await db.query(
                `SELECT ti.*, p.name as product_name 
                 FROM transaction_items ti 
                 JOIN products p ON ti.product_id = p.id 
                 WHERE ti.transaction_id = ANY($1)`,
                [txIds]
            );

            allItems.forEach((item: any) => {
                if (!itemsMap[item.transaction_id]) {
                    itemsMap[item.transaction_id] = [];
                }
                itemsMap[item.transaction_id].push(item);
            });
        }

        const transactionsWithItems = transactions.map(tx => {
            const { total_count, ...rest } = tx;
            return {
                ...rest,
                items: itemsMap[tx.id] || []
            };
        });

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

// Create new transaction
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

        const data = await db.transactions.create({
            total_amount,
            payment_method,
            order_types,
            items_count,
            date: formatWibIsoTimestamp(),
            items
        });

        res.json({
            status: 'success',
            data: {
                transaction_id: data.transaction_id,
                transaction: data,
            },
        });
    } catch (error: any) {
        console.error('[Transactions] Create failed:', error);
        
        if (error.message?.includes('Insufficient stock') || error.message?.includes('Stok tidak mencukupi')) {
            return res.status(409).json({
                status: 'error',
                error: { code: 'INSUFFICIENT_STOCK', message: error.message },
            });
        }
        if (error.message?.includes('not found') || error.message?.includes('tidak ditemukan')) {
            return res.status(404).json({
                status: 'error',
                error: { code: 'PRODUCT_NOT_FOUND', message: error.message },
            });
        }

        res.status(500).json({
            status: 'error',
            error: { code: 'TRANSACTION_CREATE_ERROR', message: error.message },
        });
    }
});

export default router;
