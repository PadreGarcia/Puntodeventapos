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

// Helper para transformar _id de MongoDB a id
const transformMongoDoc = (doc: any): any => {
  if (!doc) return doc;
  
  if (Array.isArray(doc)) {
    return doc.map(transformMongoDoc);
  }
  
  if (doc._id) {
    const { _id, ...rest } = doc;
    return { id: _id, ...rest };
  }
  
  return doc;
};

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
    const response = await apiClient.get<Product[]>(`/products${query}`);
    return transformMongoDoc(response.data || []);
  }

  /**
   * Obtener producto por ID
   */
  async getById(id: string) {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return transformMongoDoc(response.data);
  }

  /**
   * Buscar producto por código de barras
   */
  async getByBarcode(barcode: string) {
    const response = await apiClient.get<Product>(`/products/barcode/${barcode}`);
    return transformMongoDoc(response.data);
  }

  /**
   * Crear nuevo producto
   */
  async create(product: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) {
    const response = await apiClient.post<Product>('/products', product);
    return transformMongoDoc(response.data);
  }

  /**
   * Actualizar producto
   */
  async update(id: string, product: Partial<Product>) {
    const response = await apiClient.put<Product>(`/products/${id}`, product);
    return transformMongoDoc(response.data);
  }

  /**
   * Eliminar producto
   */
  async delete(id: string) {
    const response = await apiClient.delete(`/products/${id}`);
    return transformMongoDoc(response.data);
  }

  /**
   * Ajustar inventario
   */
  async adjustInventory(adjustment: InventoryAdjustment) {
    const response = await apiClient.patch<Product>(`/products/${adjustment.productId}/inventory`, {
      adjustment: adjustment.adjustment,
      reason: adjustment.reason,
      notes: adjustment.notes,
    });
    return transformMongoDoc(response.data);
  }

  /**
   * Buscar productos por texto
   * Usa el filtro 'search' del endpoint GET /products
   */
  async search(query: string) {
    const response = await apiClient.get<Product[]>(`/products?search=${encodeURIComponent(query)}`);
    return transformMongoDoc(response.data || []);
  }
}

export const productService = new ProductService();
