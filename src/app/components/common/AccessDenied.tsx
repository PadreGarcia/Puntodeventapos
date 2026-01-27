import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

interface AccessDeniedProps {
  moduleName: string;
  onGoBack: () => void;
  userName?: string;
}

/**
 * Componente que se muestra cuando un usuario intenta acceder a un módulo sin permisos
 */
export function AccessDenied({ moduleName, onGoBack, userName }: AccessDeniedProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-red-200">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <ShieldAlert className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Acceso Denegado</h1>
            <p className="text-red-100">No tienes permisos para acceder a este módulo</p>
          </div>

          {/* Contenido */}
          <div className="p-8 space-y-6">
            {/* Mensaje principal */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Lock className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-red-900 mb-2">
                    Módulo Restringido: {moduleName}
                  </h2>
                  <p className="text-sm text-red-700">
                    Tu rol de usuario no tiene permisos para acceder a este módulo. 
                    Si necesitas acceso, contacta a tu supervisor o administrador del sistema.
                  </p>
                </div>
              </div>
            </div>

            {/* Información del usuario */}
            {userName && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Usuario actual:</p>
                    <p className="text-lg font-bold text-gray-900">{userName}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-600">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ¿Cómo obtener acceso?
              </h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold min-w-[1.5rem]">1.</span>
                  <span>Contacta a tu supervisor o administrador del sistema</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold min-w-[1.5rem]">2.</span>
                  <span>Explica qué funciones necesitas realizar en el módulo "{moduleName}"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold min-w-[1.5rem]">3.</span>
                  <span>El administrador podrá modificar tus permisos desde el módulo de Usuarios</span>
                </li>
              </ol>
            </div>

            {/* Nota de seguridad */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                🔒 Este intento de acceso ha sido registrado en el sistema de auditoría
              </p>
            </div>
          </div>

          {/* Footer con botón */}
          <div className="bg-gray-50 px-8 py-5 border-t border-gray-200">
            <button
              onClick={onGoBack}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Si crees que esto es un error, comunícate con el administrador del sistema
          </p>
        </div>
      </div>
    </div>
  );
}
