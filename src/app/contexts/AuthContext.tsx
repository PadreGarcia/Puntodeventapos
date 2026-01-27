import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'supervisor' | 'cashier' | 'viewer';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Cargar usuario actual al montar el componente
   */
  useEffect(() => {
    const loadUser = async () => {
      if (!apiClient.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      // Intentar cargar usuario desde localStorage primero (más rápido)
      const storedUser = apiClient.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }

      // Luego verificar con el servidor
      try {
        const response = await apiClient.getCurrentUser();
        if (response.success && response.user) {
          setUser(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
        } else {
          // Token inválido, limpiar
          apiClient.logout();
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        // Si falla, mantener usuario de localStorage temporalmente
        // El usuario será redirigido al login en la próxima petición
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Escuchar eventos de logout
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  /**
   * Iniciar sesión
   */
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(username, password);

      if (!response.success) {
        throw new Error(response.message || 'Error al iniciar sesión');
      }

      setUser(response.user);
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cerrar sesión
   */
  const logout = useCallback(() => {
    apiClient.logout();
    setUser(null);
  }, []);

  /**
   * Refrescar datos del usuario
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      
      // Admin tiene todos los permisos
      if (user.role === 'admin') return true;
      
      return user.permissions?.includes(permission) || false;
    },
    [user]
  );

  /**
   * Verificar si el usuario tiene uno de los roles especificados
   */
  const hasRole = useCallback(
    (...roles: string[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
