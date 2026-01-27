/**
 * Servicio de Caja
 * Gestión de turnos, movimientos y arqueos
 */

import { apiClient } from '@/lib/apiClient';

export interface CashRegister {
  _id: string;
  userId: string;
  userName: string;
  openingDate: Date;
  closingDate?: Date;
  openingBalance: number;
  closingBalance?: number;
  expectedClosingBalance?: number;
  actualClosingBalance?: number;
  difference?: number;
  status: 'open' | 'closed';
  salesCount?: number;
  totalSales?: number;
  totalCash?: number;
  totalCard?: number;
  totalTransfer?: number;
  movements?: CashMovement[];
  denominations?: Denomination[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashMovement {
  _id: string;
  type: 'income' | 'withdrawal';
  amount: number;
  reason: string;
  category: string;
  userId: string;
  userName: string;
  notes?: string;
  createdAt: Date;
}

export interface Denomination {
  value: number;
  quantity: number;
  total: number;
}

export interface CashCount {
  _id: string;
  shiftId: string;
  userId: string;
  userName: string;
  denominations: Denomination[];
  total: number;
  type: 'opening' | 'intermediate' | 'closing';
  notes?: string;
  createdAt: Date;
}

class CashRegisterService {
  /**
   * Obtener turno de caja actual (abierto)
   */
  async getCurrent() {
    return apiClient.get<CashRegister>('/cash/current');
  }

  /**
   * Abrir turno de caja
   */
  async open(data: {
    openingBalance: number;
    denominations?: Denomination[];
    notes?: string;
  }) {
    return apiClient.post<CashRegister>('/cash/open', data);
  }

  /**
   * Cerrar turno de caja
   */
  async close(data: {
    actualClosingBalance: number;
    denominations?: Denomination[];
    notes?: string;
  }) {
    return apiClient.post<CashRegister>('/cash/close', data);
  }

  /**
   * Obtener movimientos de efectivo del turno actual
   */
  async getMovements() {
    return apiClient.get<CashMovement[]>('/cash/movements');
  }

  /**
   * Registrar movimiento de efectivo (ingreso o retiro)
   */
  async addMovement(movement: {
    type: 'income' | 'withdrawal';
    amount: number;
    reason: string;
    category: string;
    notes?: string;
  }) {
    return apiClient.post<CashMovement>('/cash/movements', movement);
  }

  /**
   * Obtener arqueos de caja
   */
  async getCounts(shiftId?: string) {
    const query = shiftId ? `?shiftId=${shiftId}` : '';
    return apiClient.get<CashCount[]>(`/cash/counts${query}`);
  }

  /**
   * Crear arqueo de caja
   */
  async createCount(count: {
    shiftId?: string;
    denominations: Denomination[];
    type?: 'opening' | 'intermediate' | 'closing';
    notes?: string;
  }) {
    return apiClient.post<CashCount>('/cash/counts', count);
  }

  /**
   * Obtener historial de turnos
   */
  async getHistory(filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    status?: 'open' | 'closed';
  }) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<CashRegister[]>(`/cash/history${query}`);
  }

  /**
   * Obtener turno por ID
   */
  async getById(id: string) {
    return apiClient.get<CashRegister>(`/cash/${id}`);
  }

  /**
   * Obtener resumen de caja
   */
  async getSummary() {
    return apiClient.get<any>('/cash/summary');
  }

  /**
   * Actualizar ventas del turno (uso interno)
   */
  async updateSales(data: {
    saleId: string;
    paymentMethod: string;
    amount: number;
  }) {
    return apiClient.patch('/cash/update-sales', data);
  }

  /**
   * Calcular denominaciones sugeridas
   */
  calculateDenominations(amount: number): Denomination[] {
    const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5];
    const result: Denomination[] = [];
    let remaining = amount;

    for (const value of denominations) {
      if (remaining >= value) {
        const quantity = Math.floor(remaining / value);
        result.push({
          value,
          quantity,
          total: value * quantity,
        });
        remaining = Math.round((remaining - value * quantity) * 100) / 100;
      }
    }

    return result;
  }

  /**
   * Calcular total de denominaciones
   */
  calculateTotal(denominations: Denomination[]): number {
    return denominations.reduce((sum, d) => sum + d.total, 0);
  }
}

export const cashRegisterService = new CashRegisterService();
