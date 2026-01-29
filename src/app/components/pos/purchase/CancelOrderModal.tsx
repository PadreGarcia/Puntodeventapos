import { XCircle, AlertTriangle } from 'lucide-react';
import type { PurchaseOrder } from '@/types/pos';

interface CancelOrderModalProps {
  isOpen: boolean;
  order: PurchaseOrder | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelOrderModal({ isOpen, order, onConfirm, onCancel }: CancelOrderModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header con gradiente de advertencia */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 relative overflow-hidden">
          {/* Patrón decorativo */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>
          
          <div className="relative flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white drop-shadow-sm">
                Cancelar Orden
              </h2>
              <p className="text-white/90 text-sm mt-1">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Información de la orden */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-600 font-bold uppercase mb-1">
                  Orden de Compra
                </p>
                <p className="text-lg font-bold text-gray-900 break-words">
                  {order.orderNumber}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {order.supplierName}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Mensaje de advertencia */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <span className="font-bold">⚠️ Advertencia:</span> Al cancelar esta orden, 
              el proveedor será notificado y no podrás recuperar esta información. 
              Los productos seguirán disponibles para crear una nueva orden.
            </p>
          </div>

          {/* Pregunta de confirmación */}
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              ¿Estás seguro de que deseas cancelar esta orden?
            </p>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl font-bold transition-all active:scale-95 border-2 border-gray-200 shadow-sm"
          >
            No, mantener orden
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-red-500/30"
          >
            Sí, cancelar orden
          </button>
        </div>
      </div>
    </div>
  );
}
