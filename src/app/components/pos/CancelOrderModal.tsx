import { AlertTriangle, X } from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  orderNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelOrderModal({ isOpen, orderNumber, onConfirm, onCancel }: CancelOrderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header con gradiente de advertencia */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 animate-in zoom-in duration-500 border-2 border-white/30">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold mb-2 tracking-tight">¿Cancelar Orden?</h2>
          <p className="text-white/90 font-medium text-lg">Esta acción no se puede deshacer</p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg mb-6">
            <p className="text-sm font-bold text-orange-900 mb-2">
              Orden: <span className="font-mono">{orderNumber}</span>
            </p>
            <p className="text-sm text-orange-800">
              Al cancelar esta orden de compra, el proveedor será notificado y la orden quedará marcada como cancelada en el sistema.
            </p>
          </div>

          {/* Advertencia adicional */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-red-700 font-medium">
              ⚠️ Los productos no serán recibidos y la orden no podrá ser procesada nuevamente.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-all active:scale-95 border-2 border-gray-200"
            >
              No, Mantener Orden
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95"
            >
              Sí, Cancelar Orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
