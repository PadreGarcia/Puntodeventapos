/**
 * Servicio de Ventas
 * Gestión completa del punto de venta
 */

import { apiClient } from '@/lib/apiClient';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount?: number;
  tax?: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  saleNumber: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed';
  paymentDetails?: {
    cash?: number;
    card?: number;
    transfer?: number;
    change?: number;
  };
  status: 'completed' | 'pending' | 'cancelled';
  cashRegisterId?: string;
  userId: string;
  userName: string;
  notes?: string;
  promotionApplied?: string;
  couponApplied?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSaleData {
  customerId?: string;
  customerName?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price?: number;
    discount?: number;
  }>;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed';
  paymentDetails?: any;
  promotionId?: string;
  couponCode?: string;
  loyaltyPointsToRedeem?: number;
  notes?: string;
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  customerId?: string;
  userId?: string;
  status?: string;
  minTotal?: number;
  maxTotal?: number;
}

class SaleService {
  /**
   * Obtener todas las ventas
   */
  async getAll(filters?: SaleFilters) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Sale[]>(`/sales${query}`);
  }

  /**
   * Obtener venta por ID
   */
  async getById(id: string) {
    return apiClient.get<Sale>(`/sales/${id}`);
  }

  /**
   * Crear nueva venta
   */
  async create(saleData: CreateSaleData) {
    return apiClient.post<Sale>('/sales', saleData);
  }

  /**
   * Cancelar venta (soft delete)
   */
  async cancel(id: string, reason?: string) {
    return apiClient.delete(`/sales/${id}`, {
      body: JSON.stringify({ reason }),
    } as any);
  }

  /**
   * Obtener ventas del día
   */
  async getToday() {
    const today = new Date().toISOString().split('T')[0];
    return apiClient.get<Sale[]>(`/sales?startDate=${today}`);
  }

  /**
   * Obtener ventas por cliente
   */
  async getByCustomer(customerId: string) {
    return apiClient.get<Sale[]>(`/sales?customerId=${customerId}`);
  }

  /**
   * Obtener ventas por usuario/cajero
   */
  async getByCashier(userId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ userId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return apiClient.get<Sale[]>(`/sales?${params.toString()}`);
  }

  /**
   * Obtener ventas por método de pago
   */
  async getByPaymentMethod(paymentMethod: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ paymentMethod });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return apiClient.get<Sale[]>(`/sales?${params.toString()}`);
  }
}

export const saleService = new SaleService();
