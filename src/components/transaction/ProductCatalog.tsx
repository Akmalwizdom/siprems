import { AlertTriangle, Package, Filter, ShoppingCart, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { formatNumber } from '../../utils/format';

interface ProductCatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export function ProductCatalog({
  products,
  onAddToCart,
  selectedCategory,
  onCategoryChange,
  categories,
}: ProductCatalogProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-bronze-500" />
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Katalog <span className="text-bronze-600">Produk.</span>
          </h2>
        </div>

        <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-white/40 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => onCategoryChange('All')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${
              selectedCategory === 'All' ? 'bronze-gradient text-white shadow-md' : 'text-slate-500 hover:text-bronze-600'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${
                selectedCategory === cat ? 'bronze-gradient text-white shadow-md' : 'text-slate-500 hover:text-bronze-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="relative group/card h-full flex flex-col glass-card rounded-3xl overflow-hidden border-white/40 hover:translate-y-[-4px] transition-all duration-300 shadow-lg shadow-bronze-100/10 cursor-pointer active:scale-95"
          >
            <div className="absolute top-3 right-3 z-10">
              {product.stock <= 5 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> Limited
                </div>
              )}
            </div>
            
            <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
              {product.imageUrl || product.image ? (
                <img src={product.imageUrl || product.image} alt={product.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200">
                  <Package className="w-10 h-10 text-slate-300" />
                </div>
              )}
              <div className="bg-bronze-900/0 group-hover/card:bg-bronze-900/5 absolute inset-0 transition-colors duration-300"></div>
            </div>

            <div className="flex-1 space-y-1 p-4">
              <p className="text-bronze-600 text-[10px] font-bold tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                {product.category}
              </p>
              <h4 className="text-[11px] font-black text-slate-900 group-hover/card:text-bronze-700 transition-colors leading-tight line-clamp-2">
                {product.name}
              </h4>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[13px] font-black text-slate-900">
                  Rp {formatNumber(product.sellingPrice)}
                </span>
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center group-hover/card:bg-bronze-500 group-hover/card:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="py-20 text-center glass-card rounded-3xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
            <Filter className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Tidak ada produk yang ditemukan.
          </p>
        </div>
      )}
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
