/**
 * Servicio de Productos
 * Gestión completa de productos e inventario
 */

import { apiClient } from '@/lib/apiClient';

export interface Product {
  _id: string;
  name: string;
  barcode: string;
  sku?: string;
  category: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  supplier?: string;
  image?: string;
  isActive: boolean;
  tax?: number;
  discount?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  category?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
  search?: string;
  lowStock?: boolean;
}

export interface InventoryAdjustment {
  productId: string;
  adjustment: number; // positivo para aumentar, negativo para disminuir
  reason: string;
  notes?: string;
}

class ProductService {
  /**
   * Obtener todos los productos
   */
  async getAll(filters?: ProductFilters) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Product[]>(`/products${query}`);
  }

  /**
   * Obtener producto por ID
   */
  async getById(id: string) {
    return apiClient.get<Product>(`/products/${id}`);
  }

  /**
   * Buscar producto por código de barras
   */
  async getByBarcode(barcode: string) {
    return apiClient.get<Product>(`/products/barcode/${barcode}`);
  }

  /**
   * Crear nuevo producto
   */
  async create(product: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) {
    return apiClient.post<Product>('/products', product);
  }

  /**
   * Actualizar producto
   */
  async update(id: string, product: Partial<Product>) {
    return apiClient.put<Product>(`/products/${id}`, product);
  }

  /**
   * Eliminar producto
   */
  async delete(id: string) {
    return apiClient.delete(`/products/${id}`);
  }

  /**
   * Ajustar inventario
   */
  async adjustInventory(adjustment: InventoryAdjustment) {
    return apiClient.patch<Product>(`/products/${adjustment.productId}/inventory`, {
      adjustment: adjustment.adjustment,
      reason: adjustment.reason,
      notes: adjustment.notes,
    });
  }

  /**
   * Buscar productos por texto
   * Usa el filtro 'search' del endpoint GET /products
   */
  async search(query: string) {
    return apiClient.get<Product[]>(`/products?search=${encodeURIComponent(query)}`);
  }
}

export const productService = new ProductService();
