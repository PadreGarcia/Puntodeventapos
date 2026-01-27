/**
 * Servicio de Promociones y Cupones
 * Gestión de descuentos, ofertas y cupones
 */

import { apiClient } from '@/lib/apiClient';

export interface Promotion {
  _id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'bulk_discount';
  status: 'active' | 'inactive' | 'scheduled';
  value: number;
  startDate: Date;
  endDate: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
  conditions?: {
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    minQuantity?: number;
    buyQuantity?: number;
    getQuantity?: number;
  };
  usageLimit?: number;
  usageCount: number;
  priority: number;
  isStackable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  status: 'active' | 'inactive';
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
  usagePerCustomer?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  restrictedCustomers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

class PromotionService {
  // ==========================================
  // PROMOCIONES
  // ==========================================

  /**
   * Obtener todas las promociones
   */
  async getAllPromotions(filters?: {
    status?: string;
    type?: string;
    active_only?: boolean;
  }) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ data: Promotion[]; count: number }>(`/promotions${query}`);
  }

  /**
   * Obtener promoción por ID
   */
  async getPromotionById(id: string) {
    return apiClient.get<Promotion>(`/promotions/${id}`);
  }

  /**
   * Crear nueva promoción
   */
  async createPromotion(promotion: Omit<Promotion, '_id' | 'createdAt' | 'updatedAt' | 'usageCount'>) {
    return apiClient.post<Promotion>('/promotions', promotion);
  }

  /**
   * Actualizar promoción
   */
  async updatePromotion(id: string, promotion: Partial<Promotion>) {
    return apiClient.put<Promotion>(`/promotions/${id}`, promotion);
  }

  /**
   * Eliminar promoción
   */
  async deletePromotion(id: string) {
    return apiClient.delete(`/promotions/${id}`);
  }

  /**
   * Cambiar estado de promoción
   */
  async togglePromotionStatus(id: string, status: 'active' | 'inactive' | 'scheduled') {
    return apiClient.patch<Promotion>(`/promotions/${id}/status`, { status });
  }

  /**
   * Obtener promociones para un producto
   */
  async getPromotionsForProduct(productId: string) {
    return apiClient.get<{ data: Promotion[]; count: number }>(`/promotions/product/${productId}`);
  }

  /**
   * Obtener ofertas activas
   */
  async getActiveDeals() {
    return apiClient.get<{ data: Promotion[]; count: number }>('/promotions/active/deals');
  }

  /**
   * Aplicar promoción al carrito
   */
  async applyPromotionToCart(data: {
    promotionId: string;
    cartItems: any[];
    customerId?: string;
  }) {
    return apiClient.post<any>('/promotions/apply', data);
  }

  /**
   * Duplicar promoción
   */
  async duplicatePromotion(id: string) {
    return apiClient.post<Promotion>(`/promotions/${id}/duplicate`);
  }

  // ==========================================
  // CUPONES
  // ==========================================

  /**
   * Obtener todos los cupones
   */
  async getAllCoupons(filters?: {
    status?: string;
    type?: string;
    customer_id?: string;
  }) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ data: Coupon[]; count: number }>(`/coupons${query}`);
  }

  /**
   * Obtener cupón por ID
   */
  async getCouponById(id: string) {
    return apiClient.get<Coupon>(`/coupons/${id}`);
  }

  /**
   * Crear nuevo cupón
   */
  async createCoupon(coupon: Omit<Coupon, '_id' | 'createdAt' | 'updatedAt' | 'usageCount'>) {
    return apiClient.post<Coupon>('/coupons', coupon);
  }

  /**
   * Actualizar cupón
   */
  async updateCoupon(id: string, coupon: Partial<Coupon>) {
    return apiClient.put<Coupon>(`/coupons/${id}`, coupon);
  }

  /**
   * Eliminar cupón
   */
  async deleteCoupon(id: string) {
    return apiClient.delete(`/coupons/${id}`);
  }

  /**
   * Validar cupón antes de aplicar
   */
  async validateCoupon(data: {
    code: string;
    customerId?: string;
    cartTotal: number;
    cartItems?: any[];
  }) {
    return apiClient.post<{
      valid: boolean;
      message: string;
      data?: any;
    }>('/coupons/validate', data);
  }

  /**
   * Aplicar cupón a venta
   */
  async applyCoupon(data: {
    couponId: string;
    customerId: string;
    customerName: string;
    saleId: string;
    discountAmount: number;
  }) {
    return apiClient.post<Coupon>('/coupons/apply', data);
  }

  /**
   * Cambiar estado de cupón
   */
  async toggleCouponStatus(id: string, status: 'active' | 'inactive') {
    return apiClient.patch<Coupon>(`/coupons/${id}/status`, { status });
  }

  /**
   * Obtener estadísticas de uso del cupón
   */
  async getCouponStats(id: string) {
    return apiClient.get<any>(`/coupons/${id}/stats`);
  }

  /**
   * Generar código de cupón aleatorio
   */
  async generateCouponCode(params?: { length?: number; prefix?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.length) queryParams.append('length', params.length.toString());
    if (params?.prefix) queryParams.append('prefix', params.prefix);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.get<{ code: string }>(`/coupons/generate/code${query}`);
  }
}

export const promotionService = new PromotionService();
