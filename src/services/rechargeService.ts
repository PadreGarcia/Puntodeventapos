/**
 * Servicio de Recargas
 * Gestión de recargas telefónicas
 */

import { apiClient } from '@/lib/apiClient';

export interface Recharge {
  _id: string;
  phoneNumber: string;
  carrier: string;
  amount: number;
  commission: number;
  product: string;
  confirmationCode: string;
  status: 'completed' | 'pending' | 'failed';
  userId: string;
  userName: string;
  cashRegisterId?: string;
  createdAt: Date;
}

class RechargeService {
  /**
   * Obtener todos los operadores
   */
  async getAllCarriers() {
    return apiClient.get<any[]>('/recharges/carriers');
  }

  /**
   * Crear operador
   */
  async createCarrier(carrier: any) {
    return apiClient.post<any>('/recharges/carriers', carrier);
  }

  /**
   * Actualizar operador
   */
  async updateCarrier(id: string, carrier: any) {
    return apiClient.put<any>(`/recharges/carriers/${id}`, carrier);
  }

  /**
   * Obtener productos de recarga
   */
  async getProducts() {
    return apiClient.get<any[]>('/recharges/products');
  }

  /**
   * Crear producto de recarga
   */
  async createProduct(product: any) {
    return apiClient.post<any>('/recharges/products', product);
  }

  /**
   * Actualizar producto
   */
  async updateProduct(id: string, product: any) {
    return apiClient.put<any>(`/recharges/products/${id}`, product);
  }

  /**
   * Crear recarga
   */
  async createRecharge(data: {
    phoneNumber: string;
    carrierId: string;
    productId: string;
    customerId?: string;
  }) {
    return apiClient.post<Recharge>('/recharges', data);
  }

  /**
   * Obtener todas las recargas
   */
  async getAllRecharges(filters?: {
    startDate?: string;
    endDate?: string;
    carrier?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Recharge[]>(`/recharges${query}`);
  }

  /**
   * Obtener estadísticas diarias
   */
  async getDailyStats() {
    return apiClient.get<any>('/recharges/stats/daily');
  }

  /**
   * Obtener recarga por ID
   */
  async getRechargeById(id: string) {
    return apiClient.get<Recharge>(`/recharges/${id}`);
  }

  /**
   * Obtener recarga por código
   */
  async getRechargeByCode(code: string) {
    return apiClient.get<Recharge>(`/recharges/code/${code}`);
  }

  /**
   * Obtener recargas por número de teléfono
   */
  async getRechargesByPhone(phoneNumber: string) {
    return apiClient.get<Recharge[]>(`/recharges/phone/${phoneNumber}`);
  }

  /**
   * Validar número telefónico
   */
  async validatePhoneNumber(phoneNumber: string, carrierId: string) {
    return apiClient.post<{ valid: boolean; carrier?: string }>('/recharges/validate-phone', {
      phoneNumber,
      carrierId,
    });
  }

  /**
   * Cancelar recarga
   */
  async cancelRecharge(id: string, reason: string) {
    return apiClient.delete(`/recharges/${id}`, {
      body: JSON.stringify({ reason }),
    } as any);
  }
}

export const rechargeService = new RechargeService();
