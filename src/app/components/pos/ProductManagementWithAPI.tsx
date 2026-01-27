import { useState, useEffect } from 'react';
import { usePOS } from '@/app/contexts/POSContext';
import { ProductManagement } from './ProductManagement';
import { toast } from 'sonner';
import type { Product, Supplier, User } from '@/types/pos';

interface ProductManagementWithAPIProps {
  currentUser: User | null;
  suppliers: Supplier[];
  onNavigateToInventory?: (productId?: string) => void;
}

export function ProductManagementWithAPI({ 
  currentUser, 
  suppliers, 
  onNavigateToInventory 
}: ProductManagementWithAPIProps) {
  const { 
    products, 
    loadingProducts,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct
  } = usePOS();

  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  // Sincronizar productos del contexto con estado local
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Cargar productos al montar
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Manejar actualización de productos
  const handleUpdateProducts = async (updatedProducts: Product[]) => {
    // Buscar qué producto cambió
    const changedProduct = updatedProducts.find((p, idx) => {
      const original = localProducts[idx];
      return original && (
        p.name !== original.name ||
        p.price !== original.price ||
        p.cost !== original.cost ||
        p.category !== original.category ||
        p.stock !== original.stock ||
        p.barcode !== original.barcode
      );
    });

    if (!changedProduct) {
      // Es un producto nuevo
      const newProduct = updatedProducts[updatedProducts.length - 1];
      const success = await addProduct(newProduct);
      
      if (success) {
        // El contexto ya actualizó la lista
        return;
      }
    } else {
      // Es una actualización
      const success = await updateProduct(changedProduct.id, changedProduct);
      
      if (success) {
        // El contexto ya actualizó la lista
        return;
      }
    }

    // Si falló, revertir cambios locales
    setLocalProducts(products);
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#EC0000] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <ProductManagement
      products={localProducts}
      onUpdateProducts={handleUpdateProducts}
      suppliers={suppliers}
      currentUser={currentUser}
      onNavigateToInventory={onNavigateToInventory}
    />
  );
}
