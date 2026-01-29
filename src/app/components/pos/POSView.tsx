import { useState, useEffect, useRef } from 'react';
import { usePOS } from '@/app/contexts/POSContext';
import { Header } from './Header';
import { ProductGrid, type ProductGridRef } from './ProductGrid';
import { Cart } from './Cart';
import { FloatingCartButton } from './FloatingCartButton';
import { PaymentModalWithAPI } from './PaymentModalWithAPI';
import { ConfirmationModal } from './ConfirmationModal';
import { BarcodeScanner } from './BarcodeScanner';
import { toast } from 'sonner';
import type { Sale } from '@/types/pos';

interface POSViewProps {
  currentUser: any;
  onLogout: () => void;
}

export function POSView({ currentUser, onLogout }: POSViewProps) {
  const {
    products,
    loadingProducts,
    loadProducts,
    cartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
  } = usePOS();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const productGridRef = useRef<ProductGridRef>(null);

  // Cargar productos al montar
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Buscar producto por código de barras
  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      if (product.stock > 0) {
        addToCart(product);
      } else {
        toast.error(`${product.name} sin stock disponible`, {
          duration: 3000,
          position: 'top-center',
        });
      }
    } else {
      toast.error(`Producto no encontrado: ${barcode}`, {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  // Abrir modal de pago
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  // Cuando la venta se complete exitosamente
  const handleSaleSuccess = (sale: Sale) => {
    setCurrentSale(sale);
    setIsPaymentModalOpen(false);
    setIsConfirmationModalOpen(true);
    setIsCartOpen(false);
  };

  // Nueva venta
  const handleNewSale = () => {
    setCurrentSale(null);
    setIsConfirmationModalOpen(false);
    // Regresar foco al input de búsqueda con delay para esperar que el modal se cierre
    setTimeout(() => {
      productGridRef.current?.focusSearchInput();
    }, 300);
  };

  // Imprimir ticket
  const handlePrintTicket = () => {
    window.print();
  };

  // Cerrar modal de pago (cancelar)
  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    // Regresar foco al input de búsqueda con delay para esperar que el modal se cierre
    setTimeout(() => {
      productGridRef.current?.focusSearchInput();
    }, 300);
  };

  // Calcular totales del carrito
  const TAX_RATE = 0.16;
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header 
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Escáner de código de barras */}
      <BarcodeScanner onScan={handleBarcodeScan} />

      {/* Contenido Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid de Productos */}
        <div className="flex-1 flex flex-col">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-[#EC0000] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 font-medium">Cargando productos...</p>
              </div>
            </div>
          ) : (
            <ProductGrid 
              ref={productGridRef}
              products={products}
              onAddToCart={addToCart}
            />
          )}
        </div>

        {/* Carrito (Desktop) */}
        <div className="hidden lg:block w-96 border-l border-gray-200">
          <Cart
            items={cartItems}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
            subtotal={subtotal}
            tax={tax}
            total={total}
          />
        </div>
      </div>

      {/* Botón flotante de carrito (Mobile/Tablet) */}
      <div className="lg:hidden">
        <FloatingCartButton
          itemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          total={total}
          onClick={() => setIsCartOpen(true)}
        />
      </div>

      {/* Modal de Carrito (Mobile/Tablet) */}
      {isCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <Cart
              items={cartItems}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={handleCheckout}
              subtotal={subtotal}
              tax={tax}
              total={total}
              onClose={() => setIsCartOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      <PaymentModalWithAPI
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        onSuccess={handleSaleSuccess}
        TAX_RATE={TAX_RATE}
      />

      {/* Modal de Confirmación */}
      {currentSale && (
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          sale={currentSale}
          onNewSale={handleNewSale}
          onPrint={handlePrintTicket}
        />
      )}
    </div>
  );
}
