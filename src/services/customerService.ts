/**
 * Servicio de Clientes
 * Gestión completa de CRM, lealtad, NFC y créditos
 */

import { apiClient } from '@/lib/apiClient';

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  birthdate?: Date;
  nfcCardId?: string;
  loyaltyPoints: number;
  loyaltyTier: 'bronce' | 'plata' | 'oro' | 'platino';
  creditLimit: number;
  creditBalance: number;
  creditScore?: number;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerFilters {
  search?: string;
  loyaltyTier?: string;
  status?: string;
  hasNFC?: boolean;
  hasCredit?: boolean;
  minPoints?: number;
  maxPoints?: number;
}

class CustomerService {
  /**
   * Obtener todos los clientes
   */
  async getAll(filters?: CustomerFilters) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Customer[]>(`/customers${query}`);
  }

  /**
   * Buscar clientes
   */
  async search(filters: CustomerFilters) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ data: Customer[]; count: number }>(`/customers/search${query}`);
  }

  /**
   * Obtener cliente por ID
   */
  async getById(id: string) {
    return apiClient.get<Customer>(`/customers/${id}`);
  }

  /**
   * Obtener perfil completo del cliente
   */
  async getProfile(id: string) {
    return apiClient.get<any>(`/customers/${id}/profile`);
  }

  /**
   * Buscar cliente por tarjeta NFC
   */
  async getByNFC(nfcId: string) {
    return apiClient.get<Customer>(`/customers/nfc/${nfcId}`);
  }

  /**
   * Crear nuevo cliente
   */
  async create(customer: Omit<Customer, '_id' | 'createdAt' | 'updatedAt' | 'loyaltyPoints' | 'loyaltyTier' | 'creditBalance' | 'totalPurchases'>) {
    return apiClient.post<Customer>('/customers', customer);
  }

  /**
   * Actualizar cliente
   */
  async update(id: string, customer: Partial<Customer>) {
    return apiClient.put<Customer>(`/customers/${id}`, customer);
  }

  /**
   * Eliminar cliente
   */
  async delete(id: string) {
    return apiClient.delete(`/customers/${id}`);
  }

  /**
   * Agregar puntos de lealtad
   */
  async addLoyaltyPoints(id: string, points: number, description?: string) {
    return apiClient.post<Customer>(`/customers/${id}/loyalty/add`, {
      points,
      description,
    });
  }

  /**
   * Canjear puntos de lealtad
   */
  async redeemLoyaltyPoints(id: string, points: number, description: string) {
    return apiClient.post<Customer>(`/customers/${id}/loyalty/redeem`, {
      points,
      description,
    });
  }

  /**
   * Actualizar límite de crédito
   */
  async updateCreditLimit(id: string, creditLimit: number, creditScore?: number) {
    return apiClient.patch<Customer>(`/customers/${id}/credit`, {
      creditLimit,
      creditScore,
    });
  }

  /**
   * Obtener estadísticas de clientes
   */
  async getStats() {
    return apiClient.get<any>('/customers/stats');
  }

  /**
   * Obtener clientes por nivel de lealtad (usando filtros)
   */
  async getByLoyaltyTier(tier: string) {
    return apiClient.get<Customer[]>(`/customers?loyaltyTier=${tier}`);
  }

  /**
   * Calcular nivel de lealtad basado en puntos
   */
  calculateLoyaltyTier(points: number): 'bronce' | 'plata' | 'oro' | 'platino' {
    if (points >= 10000) return 'platino';
    if (points >= 5000) return 'oro';
    if (points >= 1000) return 'plata';
    return 'bronce';
  }

  /**
   * Calcular beneficios por nivel
   */
  getLoyaltyBenefits(tier: 'bronce' | 'plata' | 'oro' | 'platino') {
    const benefits = {
      bronce: {
        discount: 0,
        pointsMultiplier: 1,
        benefits: ['Puntos por compra'],
      },
      plata: {
        discount: 5,
        pointsMultiplier: 1.5,
        benefits: ['5% descuento', '1.5x puntos', 'Ofertas exclusivas'],
      },
      oro: {
        discount: 10,
        pointsMultiplier: 2,
        benefits: ['10% descuento', '2x puntos', 'Envío gratis', 'Acceso VIP'],
      },
      platino: {
        discount: 15,
        pointsMultiplier: 3,
        benefits: ['15% descuento', '3x puntos', 'Atención preferencial', 'Eventos exclusivos'],
      },
    };

    return benefits[tier];
  }
}

export const customerService = new CustomerService();
