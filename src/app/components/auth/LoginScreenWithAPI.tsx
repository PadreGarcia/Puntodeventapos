import { useState } from 'react';
import { Eye, EyeOff, LogIn, ShoppingCart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { User } from '@/types/pos';

interface LoginScreenWithAPIProps {
  onLoginSuccess: (user: User) => void;
}

export function LoginScreenWithAPI({ onLoginSuccess }: LoginScreenWithAPIProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.login(username, password);
      
      if (response.success && response.user) {
        // Mapear _id a id si es necesario
        const user: User = {
          ...response.user,
          id: response.user._id || response.user.id,
          createdAt: new Date(response.user.createdAt),
          lastLogin: response.user.lastLogin ? new Date(response.user.lastLogin) : undefined,
        };

        toast.success(`¡Bienvenido, ${user.fullName}!`, {
          duration: 2000,
        });

        onLoginSuccess(user);
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      setError(error.message || 'Usuario o contraseña incorrectos');
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EC0000] via-[#D50000] to-[#C00000] flex items-center justify-center p-4">
      {/* Fondo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Contenedor del login */}
      <div className="relative w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4 animate-bounce">
            <ShoppingCart className="w-10 h-10 text-[#EC0000]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Sistema POS
          </h1>
          <p className="text-red-100 text-lg font-medium">
            Punto de Venta Santander
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-in fade-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Usuario */}
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                placeholder="Ingresa tu usuario"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoComplete="username"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Ingresa tu contraseña"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-base pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-3.5 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Info adicional */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🔐 Credenciales de prueba:
              </p>
              <div className="space-y-1 text-sm text-blue-700">
                <p><strong>Usuario:</strong> admin</p>
                <p><strong>Contraseña:</strong> admin123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-red-100 text-sm mt-6">
          © 2026 Sistema POS - Versión 2.0
        </p>
      </div>
    </div>
  );
}
