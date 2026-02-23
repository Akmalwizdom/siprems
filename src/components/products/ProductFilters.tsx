import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { AdminOnly } from '../auth/RoleGuard';

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  onAddProduct: () => void;
  onManageCategories: () => void;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onAddProduct,
  onManageCategories,
}: ProductFiltersProps) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
      <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center lg:w-auto">
        <div className="group relative w-full sm:w-80">
          <Search className="group-focus-within:text-bronze-500 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="focus:ring-bronze-400/20 w-full rounded-2xl border border-white/40 bg-white/60 py-3 pr-4 pl-11 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all outline-none focus:ring-2"
          />
        </div>

        <div className="scrollbar-hide flex overflow-x-auto rounded-2xl border border-white/40 bg-slate-100/50 p-1">
          <button
            onClick={() => onCategoryChange('All')}
            className={`rounded-xl px-4 py-2 text-[10px] font-black tracking-tight whitespace-nowrap uppercase transition-all ${
              selectedCategory === 'All'
                ? 'bronze-gradient text-white shadow-md'
                : 'hover:text-bronze-600 text-slate-500'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`rounded-xl px-4 py-2 text-[10px] font-black tracking-tight whitespace-nowrap uppercase transition-all ${
                selectedCategory === cat
                  ? 'bronze-gradient text-white shadow-md'
                  : 'hover:text-bronze-600 text-slate-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full items-center gap-3 sm:w-auto">
        <AdminOnly>
          <Button
            variant="outline"
            onClick={onManageCategories}
            className="glass-card hover:text-bronze-600 h-11 flex-1 rounded-2xl border-slate-200 px-5 font-bold text-slate-600 hover:bg-white/60 sm:flex-none"
          >
            <Filter className="mr-2 h-4 w-4" />
            Kategori
          </Button>
          <Button
            onClick={onAddProduct}
            className="bronze-gradient shadow-bronze-200/50 h-11 flex-1 rounded-2xl px-6 font-black text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Barang Baru
          </Button>
        </AdminOnly>
      </div>
    </div>
  );
}
