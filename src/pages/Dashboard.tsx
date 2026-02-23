import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Product, DashboardMetrics, SalesData, CategorySales, TimeRange } from '../types';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

// Import modular components
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { MetricsCards } from '../components/dashboard/MetricsCards';
import { SalesPerformanceChart } from '../components/dashboard/SalesPerformanceChart';
import { CategoryPieChart } from '../components/dashboard/CategoryPieChart';
import { TopProductsChart } from '../components/dashboard/TopProductsChart';
import { StockHealthChart } from '../components/dashboard/StockHealthChart';

export function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedRange, setSelectedRange] = useState<TimeRange>('today');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySales[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [selectedRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [metricsRes, salesRes, categoryRes, topProductsRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/metrics?range=${selectedRange}`),
        fetch(`${API_BASE_URL}/analytics/sales?range=${selectedRange}`),
        fetch(`${API_BASE_URL}/analytics/categories?range=${selectedRange}`),
        fetch(`${API_BASE_URL}/analytics/top-products?range=${selectedRange}&limit=5`),
        fetch(`${API_BASE_URL}/products?limit=100`),
      ]);

      const [metricsData, sData, catData, topPData, pData] = await Promise.all([
        metricsRes.json(),
        salesRes.json(),
        categoryRes.json(),
        topProductsRes.json(),
        productsRes.json(),
      ]);

      setMetrics(metricsData.data || metricsData);
      setSalesData(sData.data || sData);
      setCategoryData(catData.data || catData);
      setTopProducts(topPData.data || topPData);
      setProducts(pData.data || pData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-bronze-600 h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Adapter for MetricsCards
  const formattedMetrics = metrics
    ? {
        totalSales: metrics.totalRevenue,
        transactionCount: metrics.totalTransactions,
        lowStockCount: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
        salesGrowth: metrics.revenueChange,
      }
    : null;

  // Format Stock Health Data
  const stockHealthData = [
    { name: 'Good Stock', value: products.filter((p) => p.stock > 10).length },
    { name: 'Low Stock', value: products.filter((p) => p.stock > 0 && p.stock <= 10).length },
    { name: 'Out of Stock', value: products.filter((p) => p.stock <= 0).length },
  ].filter((item) => item.value > 0);

  return (
    <div className="animate-slide-up space-y-8">
      <DashboardHeader
        isAdmin={isAdmin}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        onRefresh={fetchAllData}
        isLoading={loading}
      />

      {formattedMetrics && <MetricsCards metrics={formattedMetrics} />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SalesPerformanceChart data={salesData} />
        <CategoryPieChart data={categoryData} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <TopProductsChart data={topProducts} />
        <StockHealthChart data={stockHealthData} />
      </div>
    </div>
  );
}
