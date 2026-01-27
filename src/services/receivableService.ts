/**
 * Servicio de Cuentas por Cobrar (Fiado)
 * Gestión de créditos a clientes
 */

import { apiClient } from '@/lib/apiClient';

export interface AccountReceivable {
  _id: string;
  accountNumber: string;
  customerId: string;
  customerName: string;
  saleId?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  interestRate: number;
  interest: number;
  paymentTermDays: number;
  dueDate: Date;
  status: 'active' | 'paid' | 'overdue' | 'cancelled';
  isOverdue: boolean;
  paymentHistory: Array<{
    date: Date;
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

class ReceivableService {
  /**
   * Obtener todas las cuentas por cobrar
   */
  async getAll(filters?: {
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    overdue?: string;
  }) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<AccountReceivable[]>(`/receivables${query}`);
  }

  /**
   * Obtener cuenta por ID
   */
  async getById(id: string) {
    return apiClient.get<AccountReceivable>(`/receivables/${id}`);
  }

  /**
   * Crear cuenta por cobrar (fiado)
   */
  async create(data: {
    customerId: string;
    saleId?: string;
    totalAmount: number;
    paymentTermDays?: number;
    interestRate?: number;
    notes?: string;
  }) {
    return apiClient.post<AccountReceivable>('/receivables', data);
  }

  /**
   * Registrar pago
   */
  async recordPayment(id: string, payment: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    return apiClient.post<AccountReceivable>(`/receivables/${id}/payment`, payment);
  }

  /**
   * Cancelar cuenta
   */
  async cancel(id: string, reason: string) {
    return apiClient.post<AccountReceivable>(`/receivables/${id}/cancel`, { reason });
  }

  /**
   * Obtener resumen de cuentas por cobrar
   */
  async getSummary() {
    return apiClient.get<{
      totalActive: number;
      totalAmount: number;
      totalPaid: number;
      totalBalance: number;
      overdueCount: number;
      overdueAmount: number;
    }>('/receivables/summary');
  }

  /**
   * Obtener cuentas vencidas
   */
  async getOverdue() {
    return apiClient.get<AccountReceivable[]>('/receivables/overdue');
  }

  /**
   * Actualizar tasa de interés
   */
  async updateInterestRate(id: string, interestRate: number) {
    return apiClient.patch<AccountReceivable>(`/receivables/${id}/interest`, {
      interestRate,
    });
  }

  /**
   * Obtener historial de pagos del cliente
   */
  async getCustomerPaymentHistory(customerId: string) {
    return apiClient.get<any[]>(`/receivables/customer/${customerId}/history`);
  }

  /**
   * Calcular interés acumulado
   */
  calculateInterest(
    principal: number,
    rate: number,
    days: number
  ): number {
    // Interés simple: (principal * tasa * días) / 365
    return (principal * (rate / 100) * days) / 365;
  }

  /**
   * Verificar si está vencido
   */
  isOverdue(dueDate: Date): boolean {
    return new Date(dueDate) < new Date();
  }
}

export const receivableService = new ReceivableService();
