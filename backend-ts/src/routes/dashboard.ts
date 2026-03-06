import { Router, Request, Response } from 'express';
import { db } from '../services/database';
import { sendError } from '../utils/response';
import { LRUCache } from 'lru-cache';

const router = Router();

// Configure cache for dashboard endpoints (5 minute TTL)
const dashboardCache = new LRUCache<string, any>({
    max: 100,
    ttl: 1000 * 60 * 5,
});

// Helper to execute with cache
const executeWithCache = async (req: Request, res: Response, fetchFn: () => Promise<any>) => {
    const cacheKey = req.originalUrl;
    if (dashboardCache.has(cacheKey)) {
        return res.json(dashboardCache.get(cacheKey));
    }
    
    try {
        const data = await fetchFn();
        dashboardCache.set(cacheKey, data);
        res.json(data);
    } catch (error: any) {
        console.error(`[Dashboard] ${req.path} failed:`, error);
        sendError(res, 'DASHBOARD_API_ERROR', error.message);
    }
};

// Get dashboard metrics
router.get('/metrics', async (req: Request, res: Response) => {
    executeWithCache(req, res, async () => {
        const range = req.query.range as string || 'month';
        const today = new Date();
        let currentStart: string;
        let currentEnd: string;
        let previousStart: string;
        let previousEnd: string;

        // Calculate date ranges
        switch (range) {
            case 'today':
                currentStart = today.toISOString().split('T')[0];
                currentEnd = currentStart;
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                previousStart = yesterday.toISOString().split('T')[0];
                previousEnd = previousStart;
                break;
            case 'week':
                const dayOfWeek = today.getDay();
                const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const thisMonday = new Date(today);
                thisMonday.setDate(today.getDate() - mondayOffset);
                currentStart = thisMonday.toISOString().split('T')[0];
                currentEnd = today.toISOString().split('T')[0];
                const lastWeekMonday = new Date(thisMonday);
                lastWeekMonday.setDate(thisMonday.getDate() - 7);
                const lastWeekSunday = new Date(thisMonday);
                lastWeekSunday.setDate(thisMonday.getDate() - 1);
                previousStart = lastWeekMonday.toISOString().split('T')[0];
                previousEnd = lastWeekSunday.toISOString().split('T')[0];
                break;
            case 'year':
                currentStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                currentEnd = today.toISOString().split('T')[0];
                previousStart = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
                previousEnd = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
                break;
            case 'month':
            default:
                currentStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                currentEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
                previousEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
                break;
        }

        const getMetricsForPeriod = async (start: string, end: string) => {
            const { rows } = await db.query(
                'SELECT SUM(y) as revenue, SUM(transactions_count) as transactions, SUM(items_sold) as items FROM daily_sales_summary WHERE ds >= $1 AND ds <= $2',
                [start, end]
            );
            const row = rows[0];
            return {
                revenue: Number(row.revenue) || 0,
                transactions: Number(row.transactions) || 0,
                items: Number(row.items) || 0
            };
        };

        const currentMetrics = await getMetricsForPeriod(currentStart, currentEnd);
        const previousMetrics = await getMetricsForPeriod(previousStart, previousEnd);

        const revenueChange = previousMetrics.revenue > 0 ? ((currentMetrics.revenue - previousMetrics.revenue) / previousMetrics.revenue * 100) : 0;
        const transactionsChange = previousMetrics.transactions > 0 ? ((currentMetrics.transactions - previousMetrics.transactions) / previousMetrics.transactions * 100) : 0;
        const itemsChange = previousMetrics.items > 0 ? ((currentMetrics.items - previousMetrics.items) / previousMetrics.items * 100) : 0;

        return {
            totalRevenue: currentMetrics.revenue,
            totalTransactions: currentMetrics.transactions,
            totalItemsSold: currentMetrics.items,
            revenueChange: Math.round(revenueChange * 10) / 10,
            transactionsChange: Math.round(transactionsChange * 10) / 10,
            itemsChange: Math.round(itemsChange * 10) / 10
        };
    });
});

// Get sales trend (last 7 days)
router.get('/sales-trend', async (req: Request, res: Response) => {
    executeWithCache(req, res, async () => {
        const { rows } = await db.query('SELECT ds, y FROM daily_sales_summary ORDER BY ds DESC LIMIT 7');
        return {
            status: 'success',
            trend: rows.reverse()
        };
    });
});

// Get sales chart data (last 90 days)
router.get('/sales-chart', async (req: Request, res: Response) => {
    executeWithCache(req, res, async () => {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

        const { rows } = await db.query(
            'SELECT ds as date, y as sales, transactions_count FROM daily_sales_summary WHERE ds >= $1 ORDER BY ds ASC',
            [dateFilter]
        );
        return rows;
    });
});

// Get category sales breakdown
router.get('/category-sales', async (req: Request, res: Response) => {
    executeWithCache(req, res, async () => {
        const CATEGORY_COLOR_MAP: Record<string, string> = {
            'Coffee': '#3457D5', 'Tea': '#8A2BE2', 'Non-Coffee': '#7B68EE',
            'Pastry': '#4B61D1', 'Light Meals': '#6F00FF', 'Seasonal': '#4169E1'
        };

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

        const { rows } = await db.query(
            'SELECT category, SUM(revenue) as revenue FROM category_sales_summary WHERE ds >= $1 GROUP BY category',
            [dateFilter]
        );

        const formattedData = rows.map((row: any) => ({
            category: row.category,
            value: Number(row.revenue),
            color: CATEGORY_COLOR_MAP[row.category] || '#94a3b8'
        })).sort((a: any, b: any) => b.value - a.value);

        return formattedData;
    });
});

// Get today's summary
router.get('/today', async (req: Request, res: Response) => {
    executeWithCache(req, res, async () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

        const { rows: todayTx } = await db.query(
            'SELECT * FROM transactions WHERE date >= $1 AND date <= $2',
            [start, end]
        );

        const txIds = todayTx.map((t: any) => t.id);
        let productsArray: any[] = [];

        if (txIds.length > 0) {
            const { rows: todayItems } = await db.query(
                `SELECT ti.quantity, ti.subtotal, p.id, p.name, p.category 
                 FROM transaction_items ti 
                 JOIN products p ON ti.product_id = p.id 
                 WHERE ti.transaction_id = ANY($1)`,
                [txIds]
            );

            const productsSold: Record<string, any> = {};
            todayItems.forEach((item: any) => {
                if (!productsSold[item.id]) {
                    productsSold[item.id] = { name: item.name, category: item.category, quantity: 0, revenue: 0 };
                }
                productsSold[item.id].quantity += item.quantity;
                productsSold[item.id].revenue += Number(item.subtotal);
            });

            productsArray = Object.entries(productsSold)
                .map(([id, data]) => ({ id, ...data as any }))
                .sort((a, b) => b.quantity - a.quantity);
        }

        const totalTransactions = todayTx.length;
        const totalRevenue = todayTx.reduce((sum: number, t: any) => sum + Number(t.total_amount), 0);
        const totalItems = todayTx.reduce((sum: number, t: any) => sum + Number(t.items_count), 0);

        return {
            date: start.split('T')[0],
            totalTransactions,
            totalRevenue,
            totalItems,
            uniqueProducts: productsArray.length,
            products: productsArray
        };
    });
});

export default router;
