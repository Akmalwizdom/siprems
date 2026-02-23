import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Product } from '../types';
import { API_BASE_URL } from '../config';
import { ConfirmDialog } from '../components/ui/confirmdialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/toast';
import { useProducts, useCategoryNames } from '../hooks';
import { useCategories, useCategoryMutations, Category } from '../hooks/useCategories';
import { useQueryClient } from '@tanstack/react-query';
import { productKeys } from '../hooks/useProducts';

// Modular components
import {
  ProductTable,
  ProductFilters,
  ProductModal,
  CategoryManagerModal,
} from '../components/products';

export function Products() {
  const { getAuthToken } = useAuth();
  const { showToast } = useToast();

  const queryClient = useQueryClient();
  const { data: allProducts = [], isLoading } = useProducts();
  const categoryNames = useCategoryNames();

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: productKeys.all });
  };

  const categories = ['All', ...categoryNames];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    description: '',
  });

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data: allCategories = [], isLoading: categoriesLoading } = useCategories();
  const { createCategory, updateCategory, deleteCategory } = useCategoryMutations();
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });
  const [categoryError, setCategoryError] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const filteredProducts = useMemo(() => {
    let result = allProducts;
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }
    return result;
  }, [allProducts, searchTerm, selectedCategory]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredProducts.slice(startIndex, startIndex + limit);
  }, [filteredProducts, page, limit]);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        costPrice: 0,
        sellingPrice: 0,
        stock: 0,
        description: '',
      });
      setSelectedFile(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      description: '',
    });
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let productId: string;
      if (editingProduct) {
        const response = await fetch(`${API_BASE_URL}/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            stock: formData.stock,
            selling_price: formData.sellingPrice,
            cost_price: formData.costPrice,
            name: formData.name,
            category: formData.category,
            description: formData.description,
          }),
        });
        if (!response.ok) throw new Error('Failed to update product');
        productId = editingProduct.id;
      } else {
        const response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            selling_price: formData.sellingPrice,
            cost_price: formData.costPrice,
            stock: formData.stock,
            description: formData.description,
          }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create product');
        }
        const result = await response.json();
        productId = result.product.id.toString();
      }

      if (selectedFile && imagePreview) {
        await fetch(`${API_BASE_URL}/products/${productId}/image`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ image: imagePreview }),
        });
      }

      showToast(
        editingProduct ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan',
        'success'
      );
      invalidateProducts();
      closeModal();
    } catch (error: any) {
      showToast(error.message || 'Gagal menyimpan produk', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        const token = await getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        await fetch(`${API_BASE_URL}/products/${productToDelete.id}`, {
          method: 'DELETE',
          headers,
        });
        invalidateProducts();
        showToast('Produk berhasil dihapus', 'success');
      } catch (error) {
        showToast('Gagal menghapus produk', 'error');
      }
      setProductToDelete(null);
    }
  };

  if (isLoading && allProducts.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-bronze-600 h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-6">
      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        setPage={setPage}
        onOpenCategoryManager={() => setShowCategoryManager(true)}
        onOpenAddProduct={() => openModal()}
      />

      <ProductTable
        products={paginatedProducts}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        limit={limit}
        totalItems={totalItems}
        totalPages={totalPages}
        onEdit={openModal}
        onDelete={setProductToDelete}
      />

      <ProductModal
        isOpen={showModal}
        onClose={closeModal}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        categoryNames={categoryNames}
        isSubmitting={isSubmitting}
        handleSubmit={handleSubmit}
        handleFileChange={handleFileChange}
        imagePreview={imagePreview}
        selectedFile={selectedFile}
      />

      <CategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => {
          setShowCategoryManager(false);
          setShowCategoryForm(false);
        }}
        isLoading={categoriesLoading}
        allCategories={allCategories}
        showForm={showCategoryForm}
        setShowForm={setShowCategoryForm}
        categoryFormData={categoryFormData}
        setCategoryFormData={setCategoryFormData}
        categoryError={categoryError}
        setCategoryError={setCategoryError}
        editingCategory={editingCategory}
        setEditingCategory={setEditingCategory}
        isCreating={createCategory.isPending}
        isUpdating={updateCategory.isPending}
        isDeleting={deleteCategory.isPending}
        onCreate={async () => {
          setCategoryError('');
          if (!categoryFormData.name.trim()) return setCategoryError('Nama kategori harus diisi');
          try {
            await createCategory.mutateAsync(categoryFormData);
            showToast('Kategori berhasil ditambahkan', 'success');
            setShowCategoryForm(false);
            setCategoryFormData({ name: '', description: '' });
          } catch (error: any) {
            setCategoryError(error.message || 'Gagal menyimpan kategori');
          }
        }}
        onUpdate={async () => {
          if (!editingCategory) return;
          setCategoryError('');
          try {
            await updateCategory.mutateAsync({ id: editingCategory.id, data: categoryFormData });
            showToast('Kategori berhasil diperbarui', 'success');
            setShowCategoryForm(false);
            setEditingCategory(null);
            setCategoryFormData({ name: '', description: '' });
          } catch (error: any) {
            setCategoryError(error.message || 'Gagal menyimpan kategori');
          }
        }}
        onDelete={setCategoryToDelete}
      />

      <ConfirmDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        title="Hapus Produk?"
        description={`Apakah Anda yakin ingin menghapus produk "${productToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Hapus Kategori?"
        description={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={async () => {
          if (categoryToDelete) {
            try {
              await deleteCategory.mutateAsync(categoryToDelete.id);
              showToast('Kategori berhasil dihapus', 'success');
            } catch (error: any) {
              showToast(error.message || 'Gagal menghapus kategori', 'error');
            }
            setCategoryToDelete(null);
          }
        }}
        variant="destructive"
      />
    </div>
  );
}
