import { X, Upload, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { Button } from '../ui/button';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  formData: Partial<Product>;
  setFormData: (data: Partial<Product>) => void;
  categoryNames: string[];
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  selectedFile: File | null;
}

export function ProductModal({
  isOpen,
  onClose,
  editingProduct,
  formData,
  setFormData,
  categoryNames,
  isSubmitting,
  handleSubmit,
  handleFileChange,
  imagePreview,
  selectedFile,
}: ProductModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl duration-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Nama Produk *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Contoh: Kopi Gayo 250g"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Kategori *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Pilih kategori</option>
                {categoryNames.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Harga Modal *
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: parseFloat(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Harga Jual *
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 font-bold text-indigo-600 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Jumlah Stok *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Gambar Produk
            </label>
            <div className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center transition-all hover:border-indigo-400 hover:bg-slate-50/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="w-full cursor-pointer">
                {imagePreview ? (
                  <div className="group/image relative mx-auto max-w-[200px]">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="aspect-square w-full rounded-xl object-cover shadow-lg ring-4 ring-white"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover/image:opacity-100">
                      <p className="text-xs font-bold tracking-widest text-white uppercase">
                        Ubah Gambar
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 transition-transform group-hover:scale-110">
                      <Upload className="h-7 w-7 text-indigo-500" />
                    </div>
                    <p className="font-bold text-slate-900">Pilih Gambar Produk</p>
                    <p className="mt-1 text-sm text-slate-500">PNG, JPG atau WebP (Maks. 5MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={3}
              placeholder="Berikan info tambahan tentang produk ini..."
            />
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="h-12 flex-1 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100 hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : editingProduct ? (
                'Simpan Perubahan'
              ) : (
                'Simpan Produk'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
