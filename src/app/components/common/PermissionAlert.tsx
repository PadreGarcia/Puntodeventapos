import { ShieldAlert, Lock, AlertTriangle } from 'lucide-react';

interface PermissionAlertProps {
  action: string;
  module?: string;
  userName?: string;
}

/**
 * Componente visual para mostrar alertas de permisos insuficientes
 * Uso: <PermissionAlert action="eliminar productos" module="Productos" userName="Juan Pérez" />
 */
export function PermissionAlert({ action, module, userName }: PermissionAlertProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header con gradiente rojo */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldAlert className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-red-100 text-sm">Permisos Insuficientes</p>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {/* Mensaje principal */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">
                  No tienes permisos para {action}
                </p>
                {module && (
                  <p className="text-xs text-red-700">
                    Módulo: <span className="font-bold">{module}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información del usuario */}
          {userName && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Usuario actual:</p>
              <p className="text-sm font-bold text-gray-900">{userName}</p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-yellow-900 mb-1">¿Necesitas acceso?</p>
                <p className="text-xs text-yellow-700">
                  Contacta a tu supervisor o administrador del sistema para solicitar los permisos necesarios.
                </p>
              </div>
            </div>
          </div>

          {/* Nota de seguridad */}
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 text-center">
              🔒 Este intento ha sido registrado en el sistema de auditoría
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <button
            className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
