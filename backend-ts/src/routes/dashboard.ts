import { Router, Request, Response } from 'express';
import { supabase } from '../services/database';
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

// Get dashboard metrics (matches Python backend /api/dashboard/metrics)
router.get('/metrics', async (req: Request, res: Response) => {
    executeWithCache(req, res, async () => {
        const range = req.query.range as string || 'month';
        const today = new Date();
        let currentStart: string;
        let currentEnd: string;
        let previousStart: string;
        let previousEnd: string;

        // Calculate date ranges based on selected period
        switch (range) {
            case 'today':
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                currentStart = todayStart.toISOString().split('T')[0];
                currentEnd = todayEnd.toISOString().split('T')[0];
                
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
                previousStart = yesterdayStart.toISOString().split('T')[0];
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

        // Helper function to get aggregated metrics from daily_sales_summary materialized view
        const getMetricsForPeriod = async (start: string, end: string) => {
            const { data, error } = await supabase
                .from('daily_sales_summary')
                .select('y, transactions_count, items_sold')
                .gte('ds', start)
                .lte('ds', end);

            if (error) throw error;

            return (data || []).reduce((acc, row) => ({
                revenue: acc.revenue + (Number(row.y) || 0),
                transactions: acc.transactions + (Number(row.transactions_count) || 0),
                items: acc.items + (Number(row.items_sold) || 0)
            }), { revenue: 0, transactions: 0, items: 0 });
        };

        const currentMetrics = await getMetricsForPeriod(currentStart, currentEnd);
        const previousMetrics = await getMetricsForPeriod(previousStart, previousEnd);

        // Calculate percentage changes
        const revenueChange = previousMetrics.revenue > 0
            ? ((currentMetrics.revenue - previousMetrics.revenue) / previousMetrics.revenue * 100)
            : 0;
        const transactionsChange = previousMetrics.transactions > 0
            ? ((currentMetrics.transactions - previousMetrics.transactions) / previousMetrics.transactions * 100)
            : 0;
        const itemsChange = previousMetrics.items > 0
            ? ((currentMetrics.items - previousMetrics.items) / previousMetrics.items * 100)
            : 0;

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
        const { data, error } = await supabase
            .from('daily_sales_summary')
            .select('ds, y')
            .order('ds', { ascending: false })
            .limit(7);

        if (error) throw error;

        return {
            status: 'success',
            trend: data?.reverse() || []
        };
    });
});

// Get sales chart data (last 90 days) - Required by Dashboard.tsx
router.get('/sales-chart', async (req: Request, res: Response) => {
    executeWithCache(req, res, async () => {
        // Calculate date 90 days ago
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_sales_summary')
            .select('ds, y, transactions_count')
            .gte('ds', dateFilter)
            .order('ds', { ascending: true });

        if (error) throw error;

        // Format response to match frontend expectations
        const formattedData = (data || []).map(row => ({
            date: row.ds,
            sales: row.y || 0,
            transactions_count: row.transactions_count || 0
        }));

        return formattedData;
    });
});

// Get category sales breakdown (last 90 days) - Required by Dashboard.tsx
router.get('/category-sales', async (req: Request, res: Response) => {
    executeWithCache(req, res, async () => {
        // Category color mapping (Solid Indigo/Blue Theme)
        const CATEGORY_COLOR_MAP: Record<string, string> = {
            'Coffee': '#3457D5',      // Royal Azure
            'Tea': '#8A2BE2',         // Blue Violet
            'Non-Coffee': '#7B68EE',  // Medium Slate Blue
            'Pastry': '#4B61D1',      // Slate Indigo
            'Light Meals': '#6F00FF', // Neon Violet
            'Seasonal': '#4169E1'     // Royal Blue
        };

        // Calculate date 90 days ago
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('category_sales_summary')
            .select('category, revenue')
            .gte('ds', dateFilter);

        if (error) throw error;

        // Aggregate by category
        const categoryTotals: Record<string, number> = {};
        (data || []).forEach(row => {
            const category = row.category || 'Unknown';
            categoryTotals[category] = (categoryTotals[category] || 0) + (row.revenue || 0);
        });

        // Format response with colors
        const formattedData = Object.entries(categoryTotals)
            .map(([category, revenue]) => ({
                category,
                value: revenue,
                color: CATEGORY_COLOR_MAP[category] || '#94a3b8' // Default gray for unknown categories
            }))
            .sort((a, b) => b.value - a.value); // Sort by revenue descending

        return formattedData;
    });
});

// Get today's summary - items sold, transactions, products sold
router.get('/today', async (req: Request, res: Response) => {
    executeWithCache(req, res, async () => {
        const now = new Date();
        // Get start of today (00:00:00) and end of today (23:59:59)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const todayStartISO = todayStart.toISOString();
        const todayEndISO = todayEnd.toISOString();



        // Get today's transactions using proper timestamp range
        const { data: todayTx, error: txError } = await supabase
            .from('transactions')
            .select('id, total_amount, items_count, created_at, date')
            .gte('date', todayStartISO)
            .lte('date', todayEndISO);

        if (txError) throw txError;

        // Get today's transaction items with product info
        const { data: todayItems, error: itemsError } = await supabase
            .from('transaction_items')
            .select(`
                quantity,
                subtotal,
                product:products(id, name, category)
            `)
            .in('transaction_id', (todayTx || []).map(t => t.id));

        if (itemsError) throw itemsError;

        // Calculate metrics
        const totalTransactions = (todayTx || []).length;
        const totalRevenue = (todayTx || []).reduce((sum, t) => sum + (t.total_amount || 0), 0);
        const totalItems = (todayTx || []).reduce((sum, t) => sum + (t.items_count || 0), 0);

        // Aggregate products sold
        const productsSold: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {};
        (todayItems || []).forEach((item: any) => {
            const productId = item.product?.id;
            if (productId) {
                if (!productsSold[productId]) {
                    productsSold[productId] = {
                        name: item.product.name,
                        category: item.product.category || 'Unknown',
                        quantity: 0,
                        revenue: 0
                    };
                }
                productsSold[productId].quantity += item.quantity || 0;
                productsSold[productId].revenue += item.subtotal || 0;
            }
        });

        // Convert to array and sort by quantity
        const productsArray = Object.entries(productsSold)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.quantity - a.quantity);

        return {
            date: todayStartISO.split('T')[0],
            totalTransactions,
            totalRevenue,
            totalItems,
            uniqueProducts: productsArray.length,
            products: productsArray
        };
    });
});

export default router;

