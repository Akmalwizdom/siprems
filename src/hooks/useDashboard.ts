import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../config';
import { TimeRange, DashboardMetrics, CategorySales } from '../types';

// ============================================
// QUERY KEYS
// ============================================
export const dashboardKeys = {
    all: ['dashboard'] as const,
    metrics: (range: TimeRange) => [...dashboardKeys.all, 'metrics', range] as const,
    salesChart: () => [...dashboardKeys.all, 'sales-chart'] as const,
    categorySales: () => [...dashboardKeys.all, 'category-sales'] as const,
    today: () => [...dashboardKeys.all, 'today'] as const,
    products: () => [...dashboardKeys.all, 'products'] as const,
};

// ============================================
// TYPES
// ============================================
interface TopProduct {
    id: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
}

interface TodaySummary {
    products: TopProduct[];
}

// ============================================
// FETCH FUNCTIONS
// ============================================
const fetchMetrics = async (range: TimeRange): Promise<DashboardMetrics> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/metrics?range=${range}`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
};

const fetchSalesChart = async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/sales-chart`);
    if (!response.ok) throw new Error('Failed to fetch sales chart');
    return response.json();
};

const fetchCategorySales = async (): Promise<CategorySales[]> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/category-sales`);
    if (!response.ok) throw new Error('Failed to fetch category sales');
    return response.json();
};

const fetchTodaySummary = async (): Promise<TodaySummary> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/today`);
    if (!response.ok) throw new Error('Failed to fetch today summary');
    return response.json();
};

const fetchProducts = async () => {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.data || data;
};

// ============================================
// HOOKS
// ============================================

/**
 * Hook for dashboard metrics based on time range
 */
export function useDashboardMetrics(range: TimeRange) {
    return useQuery({
        queryKey: dashboardKeys.metrics(range),
        queryFn: () => fetchMetrics(range),
        staleTime: 2 * 60 * 1000, // Metrics fresh for 2 minutes
    });
}

/**
 * Hook for sales chart data
 */
export function useSalesChart() {
    return useQuery({
        queryKey: dashboardKeys.salesChart(),
        queryFn: fetchSalesChart,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook for category sales pie chart
 */
export function useCategorySales() {
    return useQuery({
        queryKey: dashboardKeys.categorySales(),
        queryFn: fetchCategorySales,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook for today's summary (top products)
 */
export function useTodaySummary() {
    return useQuery({
        queryKey: dashboardKeys.today(),
        queryFn: fetchTodaySummary,
        staleTime: 1 * 60 * 1000, // More frequent updates for today's data
    });
}

/**
 * Hook for products list (used in dashboard for stock alerts)
 */
export function useDashboardProducts() {
    return useQuery({
        queryKey: dashboardKeys.products(),
        queryFn: fetchProducts,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Combined hook for all dashboard data
 * Returns all dashboard queries in parallel
 */
export function useDashboardData(range: TimeRange) {
    const metrics = useDashboardMetrics(range);
    const salesChart = useSalesChart();
    const categorySales = useCategorySales();
    const todaySummary = useTodaySummary();
    const products = useDashboardProducts();

    return {
        metrics,
        salesChart,
        categorySales,
        todaySummary,
        products,
        isLoading: metrics.isLoading || salesChart.isLoading ||
            categorySales.isLoading || todaySummary.isLoading ||
            products.isLoading,
        isError: metrics.isError || salesChart.isError ||
            categorySales.isError || todaySummary.isError ||
            products.isError,
    };
}
