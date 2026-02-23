import { useState, useEffect } from 'react';
import { ShoppingCart, History } from 'lucide-react';
import { Product, CartItem, Transaction as TransactionType } from '../types';
import { formatIDR } from '../utils/currency';
import { Button } from '../components/ui/button';
import { API_BASE_URL } from '../config';
import {
  exportToExcel,
  exportToPDF,
  printReceipt,
  type TransactionExport,
  type TransactionDetail,
  type StoreProfile,
} from '../utils/export';
import { useToast } from '../components/ui/toast';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from '../components/ui/confirmdialog';

// Modular components
import { POSView, HistoryView } from '../components/transaction';

export function Transaction() {
  const { showToast } = useToast();
  const { getAuthToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [orderType, setOrderType] = useState<string>('dine-in');

  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pendingReceiptData, setPendingReceiptData] = useState<TransactionDetail | null>(null);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);

  useEffect(() => {
    fetchStoreProfile();
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions();
    }
  }, [activeTab, page, startDate, endDate]);

  const fetchStoreProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/store`);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          setStoreProfile(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching store profile:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`);
      const data = await response.json();
      setCategories(['All', ...data.categories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products?limit=100`);
      const data = await response.json();
      const productData = data.data || data;
      setProducts(
        productData.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          category: p.category,
          costPrice: parseFloat(p.cost_price),
          sellingPrice: parseFloat(p.selling_price),
          stock: p.stock,
          imageUrl: p.image_url || '',
          description: p.description || '',
        }))
      );
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setHistoryLoading(true);
    try {
      const token = await getAuthToken();
      let url = `${API_BASE_URL}/transactions?page=${page}&limit=${limit}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTransactions(data.data || []);
      setTotalPages(data.total_pages);
      setTotalItems(data.total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (transactions.length === 0) return showToast('Tidak ada data', 'warning');
    exportToExcel(transactions as TransactionExport[]);
    showToast('Data diekspor ke Excel', 'success');
  };

  const handleExportPDF = () => {
    if (transactions.length === 0) return showToast('Tidak ada data', 'warning');
    exportToPDF(transactions as TransactionExport[]);
    showToast('Laporan PDF dibuat', 'success');
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const transactionData = {
        total_amount: total,
        payment_method: paymentMethod,
        order_types: orderType,
        items_count: cart.reduce((sum, item) => sum + item.quantity, 0),
        items: cart.map((item) => ({
          product_id: parseInt(item.product.id),
          quantity: item.quantity,
          unit_price: item.product.sellingPrice,
          subtotal: item.product.sellingPrice * item.quantity,
        })),
      };

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) throw new Error('Gagal menyimpan transaksi');

      const result = await response.json();
      showToast(`Transaksi berhasil!`, 'success');

      setPendingReceiptData({
        id: result.transaction_id || 'TRX-TEMP',
        date: new Date().toISOString(),
        total_amount: total,
        payment_method: paymentMethod,
        order_types: orderType,
        items: cart.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.sellingPrice,
          subtotal: item.product.sellingPrice * item.quantity,
        })),
      });
      setShowPrintDialog(true);
      setCart([]);
      fetchProducts();
    } catch (error) {
      showToast('Gagal menyimpan transaksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-900">Manajemen Transaksi</h1>
          <p className="text-sm text-slate-500 italic">Kelola kasir dan riwayat transaksi harian</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
          <Button
            variant="ghost"
            onClick={() => setActiveTab('pos')}
            className={`h-10 rounded-lg px-6 font-bold transition-all ${
              activeTab === 'pos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Kasir
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('history')}
            className={`h-10 rounded-lg px-6 font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            <History className="mr-2 h-4 w-4" />
            Riwayat
          </Button>
        </div>
      </div>

      {activeTab === 'pos' ? (
        <POSView
          products={products}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          cart={cart}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          subtotal={subtotal}
          tax={tax}
          total={total}
          handleCheckout={handleCheckout}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          orderType={orderType}
          setOrderType={setOrderType}
        />
      ) : (
        <HistoryView
          transactions={transactions}
          loading={historyLoading}
          page={page}
          setPage={setPage}
          limit={limit}
          totalPages={totalPages}
          totalItems={totalItems}
          formatDate={(d) =>
            new Date(d).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          }
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      )}

      <ConfirmDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        title="Cetak Struk?"
        description="Apakah Anda ingin mencetak struk transaksi ini?"
        confirmText="Cetak Struk"
        cancelText="Nanti Saja"
        onConfirm={() => {
          if (pendingReceiptData) printReceipt(pendingReceiptData, storeProfile || undefined);
        }}
      />
    </div>
  );
}
