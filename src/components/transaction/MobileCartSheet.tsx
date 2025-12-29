import { useEffect, useRef } from 'react';
import { ShoppingCart, Minus, Plus, Trash2, X, Coffee } from 'lucide-react';
import { Button } from '../ui/button';
import { CartItem } from '../../types';
import { formatIDR } from '../../utils/currency';

interface MobileCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  orderType: string;
  setOrderType: (type: string) => void;
  handleCheckout: () => void;
}

export function MobileCartSheet({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  subtotal,
  tax,
  total,
  paymentMethod,
  setPaymentMethod,
  orderType,
  setOrderType,
  handleCheckout,
}: MobileCartSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckoutClick = () => {
    handleCheckout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col"
        style={{
          maxHeight: '85vh',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Keranjang</h2>
            <span className="bg-indigo-100 text-indigo-700 text-sm px-2 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} item
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 mb-1">Keranjang kosong</p>
              <p className="text-sm text-slate-400">Tambahkan produk untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Coffee className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-indigo-600 font-semibold">
                      {formatIDR(item.product.sellingPrice)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg active:bg-slate-100"
                        >
                          <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="w-10 text-center font-medium text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg active:bg-slate-100"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-slate-200 p-6 space-y-4 shrink-0 bg-white">
          {/* Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Pajak (10%)</span>
              <span>{formatIDR(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>{formatIDR(total)}</span>
            </div>
          </div>

          {/* Payment & Order Type - Compact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cash">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="Debit Card">Debit</option>
                <option value="Credit Card">Kredit</option>
                <option value="E-Wallet">E-Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Jenis Pesanan
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="dine-in">Dine In</option>
                <option value="takeaway">Take Away</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
            className="w-full h-12 text-base"
          >
            Bayar - {formatIDR(total)}
          </Button>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
