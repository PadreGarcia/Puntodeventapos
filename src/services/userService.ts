/**
 * Servicio de Usuarios
 * Gestión de usuarios y permisos
 */

import { apiClient } from '@/lib/apiClient';

export interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'supervisor' | 'cashier' | 'viewer';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

class UserService {
  /**
   * Obtener todos los usuarios
   */
  async getAll() {
    return apiClient.get<User[]>('/users');
  }

  /**
   * Obtener ranking de usuarios
   */
  async getUsersRanking() {
    return apiClient.get<any[]>('/users/ranking');
  }

  /**
   * Obtener usuario por ID
   */
  async getById(id: string) {
    return apiClient.get<User>(`/users/${id}`);
  }

  /**
   * Crear nuevo usuario
   */
  async create(user: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    role: 'admin' | 'supervisor' | 'cashier' | 'viewer';
    permissions?: string[];
  }) {
    return apiClient.post<User>('/users', user);
  }

  /**
   * Actualizar usuario
   */
  async update(id: string, user: Partial<User> & { password?: string }) {
    return apiClient.put<User>(`/users/${id}`, user);
  }

  /**
   * Eliminar usuario
   */
  async delete(id: string) {
    return apiClient.delete(`/users/${id}`);
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    return apiClient.post<{ success: boolean; message: string }>(`/users/${id}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Activar/desactivar usuario
   */
  async toggleActive(id: string, isActive: boolean) {
    return apiClient.patch<User>(`/users/${id}/status`, { isActive });
  }

  /**
   * Obtener permisos disponibles
   */
  getAvailablePermissions() {
    return [
      'sales.create',
      'sales.cancel',
      'sales.view',
      'products.create',
      'products.edit',
      'products.delete',
      'products.view',
      'inventory.adjust',
      'customers.create',
      'customers.edit',
      'customers.delete',
      'customers.view',
      'cash.open',
      'cash.close',
      'cash.movements',
      'reports.view',
      'reports.export',
      'users.manage',
      'settings.edit',
    ];
  }

  /**
   * Obtener permisos por rol
   */
  getPermissionsByRole(role: string) {
    const permissions: Record<string, string[]> = {
      admin: this.getAvailablePermissions(),
      supervisor: [
        'sales.create',
        'sales.cancel',
        'sales.view',
        'products.create',
        'products.edit',
        'products.view',
        'inventory.adjust',
        'customers.create',
        'customers.edit',
        'customers.view',
        'cash.open',
        'cash.close',
        'cash.movements',
        'reports.view',
        'reports.export',
      ],
      cashier: [
        'sales.create',
        'sales.view',
        'products.view',
        'customers.create',
        'customers.view',
        'cash.open',
        'cash.close',
      ],
      viewer: ['sales.view', 'products.view', 'customers.view', 'reports.view'],
    };

    return permissions[role] || [];
  }
}

export const userService = new UserService();
