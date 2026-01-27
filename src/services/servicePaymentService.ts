/**
 * Servicio de Pago de Servicios
 * Gestión de pagos de luz, agua, teléfono, etc.
 */

import { apiClient } from '@/lib/apiClient';

export interface ServicePayment {
  _id: string;
  serviceType: string;
  provider: string;
  reference: string;
  amount: number;
  commission: number;
  total: number;
  confirmationCode: string;
  status: 'completed' | 'pending' | 'failed';
  userId: string;
  userName: string;
  customerId?: string;
  cashRegisterId?: string;
  createdAt: Date;
}

class ServicePaymentService {
  /**
   * Obtener todos los proveedores
   */
  async getAllProviders() {
    return apiClient.get<any[]>('/service-payments/providers');
  }

  /**
   * Obtener proveedor por ID
   */
  async getProviderById(id: string) {
    return apiClient.get<any>(`/service-payments/providers/${id}`);
  }

  /**
   * Crear proveedor
   */
  async createProvider(provider: any) {
    return apiClient.post<any>('/service-payments/providers', provider);
  }

  /**
   * Actualizar proveedor
   */
  async updateProvider(id: string, provider: any) {
    return apiClient.put<any>(`/service-payments/providers/${id}`, provider);
  }

  /**
   * Procesar pago de servicio
   */
  async createServicePayment(data: {
    serviceType: string;
    providerId: string;
    reference: string;
    amount: number;
    customerId?: string;
    customerName?: string;
  }) {
    return apiClient.post<ServicePayment>('/service-payments', data);
  }

  /**
   * Obtener todos los pagos
   */
  async getAllPayments(filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    provider?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<ServicePayment[]>(`/service-payments${query}`);
  }

  /**
   * Obtener estadísticas diarias
   */
  async getDailyStats() {
    return apiClient.get<any>('/service-payments/stats/daily');
  }

  /**
   * Obtener reporte de comisiones
   */
  async getCommissionsReport(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<any>(`/service-payments/stats/commissions${query}`);
  }

  /**
   * Obtener pago por ID
   */
  async getPaymentById(id: string) {
    return apiClient.get<ServicePayment>(`/service-payments/${id}`);
  }

  /**
   * Obtener pago por código
   */
  async getPaymentByCode(code: string) {
    return apiClient.get<ServicePayment>(`/service-payments/code/${code}`);
  }

  /**
   * Obtener pagos por referencia
   */
  async getPaymentsByReference(reference: string) {
    return apiClient.get<ServicePayment[]>(`/service-payments/reference/${reference}`);
  }

  /**
   * Validar referencia
   */
  async validateReference(reference: string, providerId: string) {
    return apiClient.post<{ valid: boolean; details?: any }>('/service-payments/validate-reference', {
      reference,
      providerId,
    });
  }

  /**
   * Cancelar pago
   */
  async cancelPayment(id: string, reason: string) {
    return apiClient.delete(`/service-payments/${id}`, {
      body: JSON.stringify({ reason }),
    } as any);
  }
}

export const servicePaymentService = new ServicePaymentService();
