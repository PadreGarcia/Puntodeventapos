/**
 * Hook para gestión de productos
 */

import { useApiQuery, useApiMutation } from './useApiQuery';
import { productService, Product, ProductFilters, InventoryAdjustment } from '@/services/productService';

export function useProducts(filters?: ProductFilters, enabled: boolean = true) {
  return useApiQuery<Product[]>(
    () => productService.getAll(filters),
    { enabled }
  );
}

export function useProduct(id: string, enabled: boolean = true) {
  return useApiQuery<Product>(
    () => productService.getById(id),
    { enabled: enabled && !!id }
  );
}

export function useProductByBarcode(barcode: string, enabled: boolean = true) {
  return useApiQuery<Product>(
    () => productService.getByBarcode(barcode),
    { enabled: enabled && !!barcode }
  );
}

export function useCreateProduct(options?: { onSuccess?: () => void }) {
  return useApiMutation<Product, Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>(
    (product) => productService.create(product),
    {
      ...options,
      successMessage: 'Producto creado exitosamente',
    }
  );
}

export function useUpdateProduct(options?: { onSuccess?: () => void }) {
  return useApiMutation<Product, { id: string; product: Partial<Product> }>(
    ({ id, product }) => productService.update(id, product),
    {
      ...options,
      successMessage: 'Producto actualizado exitosamente',
    }
  );
}

export function useDeleteProduct(options?: { onSuccess?: () => void }) {
  return useApiMutation<void, string>(
    (id) => productService.delete(id),
    {
      ...options,
      successMessage: 'Producto eliminado exitosamente',
    }
  );
}

export function useAdjustInventory(options?: { onSuccess?: () => void }) {
  return useApiMutation<Product, InventoryAdjustment>(
    (adjustment) => productService.adjustInventory(adjustment),
    {
      ...options,
      successMessage: 'Inventario ajustado exitosamente',
    }
  );
}

export function useLowStockProducts(enabled: boolean = true) {
  return useApiQuery<Product[]>(
    () => productService.getLowStock(),
    { enabled }
  );
}

export function useProductCategories(enabled: boolean = true) {
  return useApiQuery<string[]>(
    () => productService.getCategories(),
    { enabled }
  );
}

export function useSearchProducts(query: string, enabled: boolean = true) {
  return useApiQuery<Product[]>(
    () => productService.search(query),
    { enabled: enabled && !!query }
  );
}
