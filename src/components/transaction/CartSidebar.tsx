import {
  Trash2,
  ShoppingCart,
  CreditCard,
  ChevronRight,
  Minus,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { CartItem } from '../../types';
import { formatNumber } from '../../utils/format';

interface CartSidebarProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  total: number;
}

export function CartSidebar({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  total,
}: CartSidebarProps) {
  return (
    <div className="glass-card shadow-bronze-100/10 flex h-full flex-col overflow-hidden rounded-3xl border-white/40 shadow-2xl">
      <div className="border-b border-white/40 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-bronze-500 h-5 w-5" />
            <h3 className="text-lg font-black tracking-tight text-slate-900 italic">
              Pesanan <span className="text-bronze-600 not-italic">Anda.</span>
            </h3>
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
            {cart.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        </div>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-slate-50">
              <ShoppingCart className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-xs leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
              Keranjang Anda kosong.
              <br />
              Pilih menu untuk memulai.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="group relative flex items-center gap-4 rounded-2xl border border-white/40 bg-white/40 p-3 transition-all duration-300 hover:bg-white/60"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white shadow-sm">
                  {item.product.imageUrl || item.product.image ? (
                    <img
                      src={item.product.imageUrl || item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                      <ShoppingCart className="h-6 w-6 opacity-30" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="mb-0.5 truncate text-sm font-black text-slate-900">
                    {item.product.name}
                  </h4>
                  <p className="text-bronze-600 mb-2 font-mono text-[10px] font-bold">
                    Rp {formatNumber(item.product.sellingPrice)}
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-slate-100 bg-white/80 p-0.5 shadow-sm">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-white/40 bg-white/40 p-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold tracking-widest text-slate-400 uppercase">
            <span>Subtotal</span>
            <span>Rp {formatNumber(total)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-slate-900">
            <span className="flex items-center gap-2 italic">
              Total <span className="text-bronze-500 not-italic">Penjualan.</span>
            </span>
            <span className="text-lg">Rp {formatNumber(total)}</span>
          </div>
        </div>

        <Button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="bronze-gradient shadow-bronze-200/50 flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-sm font-black tracking-widest text-white uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-50"
        >
          <CreditCard className="h-5 w-5" />
          Proses Pembayaran
          <ChevronRight className="ml-auto h-4 w-4" />
        </Button>

        <div className="bg-bronze-50/30 border-bronze-100/20 flex items-center justify-center gap-2 rounded-xl border py-2">
          <AlertCircle className="text-bronze-600 h-3 w-3" />
          <p className="text-bronze-600 text-[9px] font-bold tracking-tighter uppercase">
            Inventory Auto-Sync Enabled
          </p>
        </div>
      </div>
    </div>
  );
}
