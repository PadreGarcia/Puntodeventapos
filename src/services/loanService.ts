/**
 * Servicio de Préstamos
 * Gestión de préstamos a clientes
 */

import { apiClient } from '@/lib/apiClient';

export interface Loan {
  _id: string;
  loanNumber: string;
  customerId: string;
  customerName: string;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  balance: number;
  paidAmount: number;
  nextPaymentDate?: Date;
  nextPaymentAmount?: number;
  status: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  purpose?: string;
  collateral?: string;
  collateralValue?: number;
  paymentSchedule?: any[];
  disbursementDate?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

class LoanService {
  /**
   * Obtener todos los préstamos
   */
  async getLoans(filters?: {
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Loan[]>(`/loans${query}`);
  }

  /**
   * Obtener resumen de préstamos
   */
  async getLoansSummary() {
    return apiClient.get<any>('/loans/summary');
  }

  /**
   * Obtener préstamos en mora
   */
  async getDefaultedLoans() {
    return apiClient.get<Loan[]>('/loans/defaulted');
  }

  /**
   * Calcular préstamo (simulación)
   */
  async calculateLoan(data: {
    loanAmount: number;
    interestRate: number;
    termMonths: number;
  }) {
    return apiClient.post<any>('/loans/calculate', data);
  }

  /**
   * Obtener historial de préstamos de un cliente
   */
  async getCustomerLoanHistory(customerId: string) {
    return apiClient.get<Loan[]>(`/loans/customer/${customerId}/history`);
  }

  /**
   * Obtener préstamo por ID
   */
  async getLoanById(id: string) {
    return apiClient.get<Loan>(`/loans/${id}`);
  }

  /**
   * Obtener próximo pago
   */
  async getNextPayment(id: string) {
    return apiClient.get<any>(`/loans/${id}/next-payment`);
  }

  /**
   * Obtener tabla de amortización
   */
  async getAmortizationSchedule(id: string) {
    return apiClient.get<any[]>(`/loans/${id}/schedule`);
  }

  /**
   * Crear préstamo
   */
  async createLoan(data: {
    customerId: string;
    loanAmount: number;
    interestRate: number;
    termMonths: number;
    purpose?: string;
    collateral?: string;
    collateralValue?: number;
    lateFeePercentage?: number;
    notes?: string;
  }) {
    return apiClient.post<Loan>('/loans', data);
  }

  /**
   * Actualizar préstamo
   */
  async updateLoan(id: string, data: {
    collateral?: string;
    collateralValue?: number;
    notes?: string;
  }) {
    return apiClient.put<Loan>(`/loans/${id}`, data);
  }

  /**
   * Desembolsar préstamo
   */
  async disburseLoan(id: string, data: {
    disbursementMethod: string;
    notes?: string;
  }) {
    return apiClient.post<Loan>(`/loans/${id}/disburse`, data);
  }

  /**
   * Registrar pago de cuota
   */
  async recordLoanPayment(id: string, data: {
    paymentNumber: number;
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    return apiClient.post<Loan>(`/loans/${id}/payment`, data);
  }

  /**
   * Cancelar préstamo
   */
  async cancelLoan(id: string, reason: string) {
    return apiClient.post<Loan>(`/loans/${id}/cancel`, { reason });
  }
}

export const loanService = new LoanService();
