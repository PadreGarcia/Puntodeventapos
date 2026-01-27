/**
 * Servicio de Auditoría
 * Registro y consulta de logs de auditoría
 */

import { apiClient } from '@/lib/apiClient';

export interface AuditLog {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  description: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  createdAt: Date;
}

class AuditService {
  /**
   * Obtener logs de auditoría
   */
  async getAuditLogs(filters?: {
    startDate?: string;
    endDate?: string;
    module?: string;
    action?: string;
    userId?: string;
    success?: boolean;
    limit?: number;
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
    return apiClient.get<AuditLog[]>(`/audit${query}`);
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getAuditStats(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<any>(`/audit/stats${query}`);
  }

  /**
   * Obtener actividades por usuario
   */
  async getUserActivity(userId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ userId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<AuditLog[]>(`/audit${query}`);
  }

  /**
   * Obtener actividades por módulo
   */
  async getModuleActivity(module: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ module });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<AuditLog[]>(`/audit${query}`);
  }

  /**
   * Obtener actividades críticas recientes
   */
  async getCriticalActivities(limit: number = 50) {
    const criticalActions = [
      'delete_user',
      'delete_product',
      'cancel_sale',
      'adjust_inventory',
      'close_cash',
      'delete_customer',
    ];

    const params = new URLSearchParams();
    criticalActions.forEach((action) => params.append('action', action));
    params.append('limit', limit.toString());

    return apiClient.get<AuditLog[]>(`/audit?${params.toString()}`);
  }

  /**
   * Obtener errores recientes
   */
  async getRecentErrors(limit: number = 50) {
    return apiClient.get<AuditLog[]>(`/audit?success=false&limit=${limit}`);
  }

  /**
   * Exportar logs de auditoría
   */
  async exportAuditLogs(filters?: {
    startDate?: string;
    endDate?: string;
    module?: string;
  }) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/audit/export${query}`);
  }

  /**
   * Crear log de auditoría manualmente
   */
  async createAuditLog(log: {
    action: string;
    module: string;
    description: string;
    details?: any;
    success?: boolean;
  }) {
    return apiClient.post<AuditLog>('/audit', log);
  }

  /**
   * Obtener módulos disponibles
   */
  getAvailableModules() {
    return [
      'auth',
      'sales',
      'products',
      'inventory',
      'customers',
      'cash',
      'users',
      'promotions',
      'coupons',
      'recharges',
      'services',
      'loans',
      'purchases',
      'suppliers',
      'settings',
    ];
  }

  /**
   * Obtener acciones por módulo
   */
  getActionsByModule(module: string): string[] {
    const actions: Record<string, string[]> = {
      auth: ['login', 'logout', 'failed_login'],
      sales: ['create_sale', 'cancel_sale', 'view_sale'],
      products: ['create_product', 'update_product', 'delete_product', 'view_product'],
      inventory: ['adjust_inventory', 'low_stock_alert'],
      customers: ['create_customer', 'update_customer', 'delete_customer'],
      cash: ['open_cash', 'close_cash', 'cash_movement', 'cash_count'],
      users: ['create_user', 'update_user', 'delete_user', 'change_password'],
    };

    return actions[module] || [];
  }
}

export const auditService = new AuditService();
