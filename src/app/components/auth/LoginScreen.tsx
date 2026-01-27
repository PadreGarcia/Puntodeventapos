import { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType } from '@/types/pos';

interface LoginScreenProps {
  onLogin: (user: UserType) => void;
  users: UserType[];
}

export function LoginScreen({ onLogin, users }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('Ingresa usuario y contraseña');
      return;
    }

    setIsLoading(true);

    // Simular delay de autenticación
    setTimeout(() => {
      const user = users.find(
        u => u.username === username && u.password === password && u.isActive
      );

      if (user) {
        const updatedUser = { ...user, lastLogin: new Date() };
        toast.success(`¡Bienvenido, ${user.fullName}!`);
        onLogin(updatedUser);
      } else {
        toast.error('Usuario o contraseña incorrectos');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recoveryEmail.trim()) {
      toast.error('Ingresa tu correo electrónico');
      return;
    }

    const user = users.find(u => u.email === recoveryEmail);
    
    if (user) {
      toast.success('Se envió un correo con instrucciones para recuperar tu contraseña');
      setShowRecovery(false);
      setRecoveryEmail('');
    } else {
      toast.error('No se encontró una cuenta con ese correo');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-[#EC0000] flex items-center justify-center p-4">

      <div className="w-full max-w-md">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Sistema POS</h1>
          <p className="text-gray-300 font-medium">Punto de Venta Empresarial</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!showRecovery ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Iniciar Sesión</h2>
              
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Usuario */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Usuario
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ingresa tu usuario"
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium disabled:bg-gray-100"
                    />
                  </div>
                </div>

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
                      className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium disabled:bg-gray-100"
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

                {/* Recuperar contraseña */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowRecovery(true)}
                    className="text-sm text-[#EC0000] font-bold hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Botón de login */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Iniciar Sesión
                    </>
                  )}
                </button>
              </form>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-bold mb-1">Usuarios de Prueba:</p>
                    <p>• Admin: <span className="font-mono">admin / admin123</span></p>
                    <p>• Supervisor: <span className="font-mono">supervisor / super123</span></p>
                    <p>• Cajero: <span className="font-mono">cajero / cajero123</span></p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowRecovery(false)}
                className="text-sm text-gray-600 hover:text-gray-900 font-bold mb-6 flex items-center gap-2"
              >
                ← Volver al inicio de sesión
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Contraseña</h2>
              <p className="text-sm text-gray-600 mb-6">
                Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
              </p>

              <form onSubmit={handleRecovery} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                >
                  Enviar Instrucciones
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          <p className="opacity-75">Sistema POS v2.0 © 2026</p>
          <p className="opacity-60 text-xs mt-1">Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}
