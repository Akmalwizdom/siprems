import { Edit3, Trash2, Package, ListOrdered } from 'lucide-react';
import { Button } from '../ui/button';
import { Product } from '../../types';
import { formatNumber } from '../../utils/format';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="glass-card shadow-bronze-100/10 mb-8 overflow-hidden rounded-3xl border-white/40 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/40 bg-slate-50/50">
              <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Produk
              </th>
              <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Kategori
              </th>
              <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Harga Jual
              </th>
              <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Sisa Stok
              </th>
              <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Status
              </th>
              <th className="px-6 py-5 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((p) => (
              <tr key={p.id} className="group transition-colors hover:bg-white/40">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 transition-transform group-hover:scale-105">
                      {p.imageUrl || p.image ? (
                        <img
                          src={p.imageUrl || p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
                          <Package className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="group-hover:text-bronze-700 text-xs font-black text-slate-900 transition-colors">
                        {p.name}
                      </h4>
                      <p className="mt-0.5 font-mono text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                        #{p.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-tighter text-slate-500 uppercase">
                    {p.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-slate-900">
                    Rp {formatNumber(p.sellingPrice)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black ${p.stock <= 5 ? 'text-rose-500' : 'text-slate-900'}`}
                    >
                      {p.stock}
                    </span>
                    <span className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                      PCS
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${
                      p.stock <= 0
                        ? 'border-rose-100 bg-rose-50 text-rose-600'
                        : p.stock <= 10
                          ? 'border-amber-100 bg-amber-50 text-amber-600'
                          : 'border-emerald-100 bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        p.stock <= 0
                          ? 'bg-rose-500'
                          : p.stock <= 10
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] font-black tracking-tight uppercase">
                      {p.stock <= 0 ? 'Habis' : p.stock <= 10 ? 'Menipis' : 'Aman'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(p)}
                      className="hover:bg-bronze-50 hover:text-bronze-600 h-9 w-9 rounded-xl text-slate-400 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(p.id)}
                      className="h-9 w-9 rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 transition-transform hover:scale-110">
            <Package className="h-10 w-10 text-slate-200" />
          </div>
          <h3 className="text-base font-black text-slate-900">Tidak Ada Produk</h3>
          <p className="mt-1 p-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Mulai dengan menambahkan barang baru ke inventaris Anda
          </p>
        </div>
      )}

      {/* Simplified Pagination for Inventory */}
      <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 p-6">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          <ListOrdered className="h-3.5 w-3.5" />
          <span>Menampilkan {products.length} Barang</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-slate-100 bg-white px-4 font-bold shadow-sm"
            disabled
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-slate-100 bg-white px-4 font-bold shadow-sm"
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
