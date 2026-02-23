import { X, Tag, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Category } from '../../hooks/useCategories';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  allCategories: Category[];
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  categoryFormData: { name: string; description: string };
  setCategoryFormData: (data: { name: string; description: string }) => void;
  categoryError: string;
  setCategoryError: (error: string) => void;
  editingCategory: Category | null;
  setEditingCategory: (cat: Category | null) => void;
  onCreate: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onDelete: (cat: Category) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  isLoading,
  allCategories,
  showForm,
  setShowForm,
  categoryFormData,
  setCategoryFormData,
  categoryError,
  setCategoryError,
  editingCategory,
  setEditingCategory,
  onCreate,
  onUpdate,
  onDelete,
  isCreating,
  isUpdating,
  isDeleting,
}: CategoryManagerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Tag className="h-5 w-5 text-indigo-600" />
            Kelola Kategori
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {showForm ? (
            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
              {categoryError && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {categoryError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 ml-1 block text-xs font-bold text-slate-500 uppercase">
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, name: e.target.value })
                    }
                    placeholder="Contoh: Minuman, Makanan"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 ml-1 block text-xs font-bold text-slate-500 uppercase">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.description}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, description: e.target.value })
                    }
                    placeholder="Opsional - beri sedikit info..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-11 flex-1 rounded-xl"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategory(null);
                      setCategoryError('');
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    className="h-11 flex-1 rounded-xl bg-indigo-600 shadow-md hover:bg-indigo-700"
                    disabled={isCreating || isUpdating}
                    onClick={editingCategory ? onUpdate : onCreate}
                  >
                    {isCreating || isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingCategory ? (
                      'Simpan'
                    ) : (
                      'Tambah'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-b border-slate-100 p-4">
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-dashed border-slate-300 transition-all hover:border-indigo-500 hover:bg-indigo-50/50 hover:text-indigo-600"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryFormData({ name: '', description: '' });
                  setCategoryError('');
                  setShowForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat Kategori Baru
              </Button>
            </div>
          )}

          <div className="divide-y divide-slate-50 px-2 pb-2">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-300" />
              </div>
            ) : allCategories.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-medium text-slate-400">Belum ada kategori terdaftar.</p>
              </div>
            ) : (
              allCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{cat.name}</p>
                    {cat.description && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryFormData({ name: cat.name, description: cat.description || '' });
                        setCategoryError('');
                        setShowForm(true);
                      }}
                      className="text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isDeleting}
                      onClick={() => onDelete(cat)}
                      className="text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-4 text-center">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            💡 Tips: Kategori digunakan untuk mempermudah pencarian produk.
          </p>
        </div>
      </div>
    </div>
  );
}
