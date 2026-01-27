/**
 * Servicio de Tarjetas NFC
 * Gestión de tarjetas NFC para clientes
 */

import { apiClient } from '@/lib/apiClient';

export interface NFCCard {
  _id: string;
  cardId: string; // UID de la tarjeta
  cardType: string;
  customerId?: string;
  customerName?: string;
  status: 'active' | 'inactive' | 'blocked';
  issuedDate: Date;
  linkedDate?: Date;
  lastUsedDate?: Date;
  usageCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

class NFCService {
  /**
   * Obtener todas las tarjetas NFC
   */
  async getAll(filters?: {
    status?: string;
    linked?: string;
    customerId?: string;
  }) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<NFCCard[]>(`/nfc${query}`);
  }

  /**
   * Obtener tarjeta por ID
   */
  async getById(id: string) {
    return apiClient.get<NFCCard>(`/nfc/${id}`);
  }

  /**
   * Buscar tarjeta por cardId (UID)
   */
  async getByCardId(cardId: string) {
    return apiClient.get<NFCCard>(`/nfc/card/${cardId}`);
  }

  /**
   * Crear nueva tarjeta NFC
   */
  async create(data: {
    cardId: string;
    cardType?: string;
    notes?: string;
  }) {
    return apiClient.post<NFCCard>('/nfc', data);
  }

  /**
   * Actualizar tarjeta NFC
   */
  async update(id: string, data: {
    cardType?: string;
    notes?: string;
    status?: string;
  }) {
    return apiClient.put<NFCCard>(`/nfc/${id}`, data);
  }

  /**
   * Eliminar tarjeta NFC
   */
  async delete(id: string) {
    return apiClient.delete(`/nfc/${id}`);
  }

  /**
   * Vincular tarjeta con cliente
   */
  async linkCard(id: string, customerId: string) {
    return apiClient.post<NFCCard>(`/nfc/${id}/link`, { customerId });
  }

  /**
   * Desvincular tarjeta
   */
  async unlinkCard(id: string, reason?: string) {
    return apiClient.post<NFCCard>(`/nfc/${id}/unlink`, { reason });
  }

  /**
   * Activar tarjeta
   */
  async activate(id: string) {
    return apiClient.post<NFCCard>(`/nfc/${id}/activate`);
  }

  /**
   * Bloquear tarjeta
   */
  async block(id: string, reason: string) {
    return apiClient.post<NFCCard>(`/nfc/${id}/block`, { reason });
  }

  /**
   * Registrar uso de tarjeta
   */
  async recordUsage(cardId: string, data: {
    transactionType: string;
    details?: any;
  }) {
    return apiClient.post<NFCCard>(`/nfc/card/${cardId}/usage`, data);
  }

  /**
   * Obtener estadísticas de NFC
   */
  async getStats() {
    return apiClient.get<any>('/nfc/stats');
  }
}

export const nfcService = new NFCService();
