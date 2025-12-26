import { ShoppingCart } from 'lucide-react';
import { formatIDR } from '../../utils/currency';

interface FloatingCartButtonProps {
  itemCount: number;
  total: number;
  onClick: () => void;
}

export function FloatingCartButton({ itemCount, total, onClick }: FloatingCartButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-full shadow-lg transition-all duration-200"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 40,
        paddingLeft: itemCount > 0 ? '1rem' : '0.875rem',
        paddingRight: itemCount > 0 ? '1.25rem' : '0.875rem',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
        minHeight: '56px',
        boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
      }}
    >
      {/* Cart Icon with Badge */}
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            style={{
              minWidth: '20px',
              height: '20px',
              padding: '0 4px',
              animation: 'pulse 2s infinite',
            }}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>

      {/* Total Price - Show only when items exist */}
      {itemCount > 0 && (
        <div className="flex flex-col items-start">
          <span className="text-xs text-indigo-200">Total</span>
          <span className="font-semibold text-sm whitespace-nowrap">
            {formatIDR(total)}
          </span>
        </div>
      )}

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </button>
  );
}
