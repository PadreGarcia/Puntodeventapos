/**
 * Cliente API mejorado con interceptores y manejo de errores
 * Integración completa con el backend auditado
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  timeout?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number = 30000;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Obtener token JWT del localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Guardar token JWT en localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Eliminar token JWT del localStorage
   */
  private removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Construir headers para las peticiones
   */
  private buildHeaders(config?: RequestConfig): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Agregar token JWT si existe y no se está saltando auth
    if (!config?.skipAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Manejar respuesta de la API
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: any;

    try {
      data = await response.json();
    } catch (error) {
      // Si no se puede parsear JSON, la respuesta está vacía o corrupta
      data = { success: false, message: 'Respuesta inválida del servidor' };
    }

    // Si la respuesta no es exitosa
    if (!response.ok) {
      // 401 Unauthorized - Token inválido o expirado
      if (response.status === 401) {
        this.removeToken();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error(data.message || 'Sesión expirada. Por favor inicia sesión nuevamente');
      }

      // 403 Forbidden - Sin permisos
      if (response.status === 403) {
        throw new Error(data.message || 'No tienes permisos para realizar esta acción');
      }

      // 404 Not Found
      if (response.status === 404) {
        throw new Error(data.message || 'Recurso no encontrado');
      }

      // 500 Server Error
      if (response.status === 500) {
        throw new Error(data.message || 'Error interno del servidor');
      }

      // Otros errores
      throw new Error(data.message || data.error || 'Error en la petición');
    }

    return data;
  }

  /**
   * Método genérico para hacer peticiones
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = this.defaultTimeout, skipAuth, ...restConfig } = config;

    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...restConfig,
        headers: this.buildHeaders(config),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Timeout error
      if (error.name === 'AbortError') {
        throw new Error('La petición tardó demasiado tiempo. Intenta de nuevo');
      }

      // Network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión');
      }

      // Re-throw other errors
      throw error;
    }
  }

  // ==========================================
  // Métodos de conveniencia
  // ==========================================

  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // ==========================================
  // Métodos de autenticación
  // ==========================================

  async login(username: string, password: string): Promise<ApiResponse<any>> {
    const response = await this.post('/auth/login', { username, password }, { skipAuth: true });

    // Guardar token si el login fue exitoso
    if (response.success && response.token) {
      this.setToken(response.token);
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }

    return response;
  }

  logout(): void {
    this.removeToken();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.get('/auth/me');
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getStoredUser(): any | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient(API_BASE_URL);

// Export para testing
export { ApiClient };
