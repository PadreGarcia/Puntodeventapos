import { useState, useEffect } from 'react';
import { usePOS } from '@/app/contexts/POSContext';
import { InventoryManagement } from './InventoryManagement';
import type { Product, User } from '@/types/pos';

interface InventoryManagementWithAPIProps {
  currentUser: User | null;
}

export function InventoryManagementWithAPI({ currentUser }: InventoryManagementWithAPIProps) {
  const { 
    products, 
    loadingProducts,
    loadProducts,
    adjustInventory
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

  // Manejar actualización de productos (para ajustes de inventario)
  const handleUpdateProducts = async (updatedProducts: Product[]) => {
    // Buscar qué producto tuvo cambio de stock
    for (let i = 0; i < updatedProducts.length; i++) {
      const updated = updatedProducts[i];
      const original = localProducts[i];
      
      if (original && updated.stock !== original.stock) {
        const adjustment = updated.stock - original.stock;
        const reason = 'Ajuste manual desde inventario';
        
        const success = await adjustInventory(updated.id, adjustment, reason);
        
        if (success) {
          // El contexto ya actualizó la lista
          return;
        } else {
          // Si falló, revertir cambios locales
          setLocalProducts(products);
          return;
        }
      }
    }
    
    // Si no encontramos cambios, solo actualizar local
    setLocalProducts(updatedProducts);
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#EC0000] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <InventoryManagement
      products={localProducts}
      onUpdateProducts={handleUpdateProducts}
      currentUser={currentUser}
    />
  );
}
