import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Product, CartItem } from '../../types';
import { ProductCatalog } from './ProductCatalog';
import { CartSidebar } from './CartSidebar';
import { MobileCartSheet } from './MobileCartSheet';
import { FloatingCartButton } from './FloatingCartButton';

interface POSViewProps {
  products: Product[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  subtotal: number;
  tax: number;
  total: number;
  handleCheckout: () => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  orderType: string;
  setOrderType: (type: string) => void;
}

export function POSView({
  products,
  loading,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  cart,
  addToCart,
  updateQuantity,
  removeFromCart,
  subtotal,
  tax,
  total,
  handleCheckout,
  paymentMethod,
  setPaymentMethod,
  orderType,
  setOrderType,
}: POSViewProps) {
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <MobileCartSheet
        isOpen={isMobileCartOpen}
        onClose={() => setIsMobileCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        orderType={orderType}
        setOrderType={setOrderType}
        handleCheckout={handleCheckout}
      />

      <div className="lg:hidden">
        <FloatingCartButton
          itemCount={totalItems}
          total={total}
          onClick={() => setIsMobileCartOpen(true)}
        />
      </div>

      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        style={{ height: 'calc(100vh - 12rem)', minHeight: '500px' }}
      >
        <ProductCatalog
          products={products}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          addToCart={addToCart}
        />

        <CartSidebar
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          subtotal={subtotal}
          tax={tax}
          total={total}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          orderType={orderType}
          setOrderType={setOrderType}
          handleCheckout={handleCheckout}
        />
      </div>
    </>
  );
}
