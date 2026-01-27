import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types/pos';

interface SessionLockScreenProps {
  user: User;
  onUnlock: (password: string) => void;
  onLogout: () => void;
  inactiveTime: number; // en minutos
}

export function SessionLockScreen({ user, onUnlock, onLogout, inactiveTime }: SessionLockScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Ingresa tu contraseña');
      return;
    }

    setIsLoading(true);

    // Simular validación
    setTimeout(() => {
      if (password === user.password) {
        toast.success('Sesión desbloqueada');
        onUnlock(password);
      } else {
        toast.error('Contraseña incorrecta');
        setIsLoading(false);
        setPassword('');
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-[#EC0000] flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        {/* Avatar y Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Lock className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sesión Bloqueada</h1>
          <p className="text-gray-300 font-medium text-lg">{user.fullName}</p>
          <p className="text-gray-400 text-sm mt-1">@{user.username}</p>
        </div>

        {/* Alert de inactividad */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-bold">Tu sesión fue bloqueada por inactividad</p>
              <p className="mt-1">
                Estuviste inactivo por <span className="font-bold">{inactiveTime} minutos</span>. 
                Ingresa tu contraseña para continuar.
              </p>
            </div>
          </div>
        </div>

        {/* Card de Unlock */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Desbloquear Sesión</h2>

          <form onSubmit={handleUnlock} className="space-y-5">
            {/* Contraseña */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  disabled={isLoading}
                  autoFocus
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium text-lg disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Desbloqueando...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Desbloquear
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all"
              >
                Cerrar Sesión
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          <p className="opacity-75">Sistema POS v2.0</p>
          <p className="opacity-60 text-xs mt-1">Seguridad por inactividad activada</p>
        </div>
      </div>
    </div>
  );
}
