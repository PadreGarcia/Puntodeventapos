import { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Sale, User } from '@/types/pos';
import { canCancelSale } from '@/utils/securityValidation';

interface SaleCancellationModalProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (saleId: string, reason: string) => void;
  currentUser: User | null;
}

export function SaleCancellationModal({
  sale,
  isOpen,
  onClose,
  onConfirm,
  currentUser,
}: SaleCancellationModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Validar permisos
  const validation = canCancelSale(currentUser, sale);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error('Debes proporcionar un motivo para la cancelación');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres');
      return;
    }

    setLoading(true);
    
    try {
      onConfirm(sale.id, reason);
      toast.success('Venta cancelada correctamente');
      setReason('');
      onClose();
    } catch (error) {
      toast.error('Error al cancelar la venta');
    } finally {
      setLoading(false);
    }
  };

  // Calcular tiempo transcurrido
  const now = new Date();
  const saleTime = new Date(sale.timestamp);
  const minutesElapsed = Math.floor((now.getTime() - saleTime.getTime()) / (1000 * 60));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Cancelar Venta</h2>
              <p className="text-red-100 text-sm">Acción irreversible - Requiere autorización</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Validación de permisos */}
          {!validation.allowed ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900 mb-1">Acceso Denegado</p>
                  <p className="text-sm text-red-700">{validation.message}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Información de la venta */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ID de Venta:</span>
                  <span className="font-bold text-gray-900">{sale.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="font-bold text-gray-900">${sale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Método de Pago:</span>
                  <span className="font-bold text-gray-900 capitalize">{sale.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Artículos:</span>
                  <span className="font-bold text-gray-900">{sale.items.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tiempo transcurrido:</span>
                  <span className="font-bold text-gray-900">{minutesElapsed} minutos</span>
                </div>
                {sale.customerName && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cliente:</span>
                    <span className="font-bold text-gray-900">{sale.customerName}</span>
                  </div>
                )}
              </div>

              {/* Advertencia de tiempo */}
              {minutesElapsed > 15 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-yellow-900">
                        Han transcurrido más de 15 minutos desde esta venta
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Asegúrate de que realmente necesitas cancelarla
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Productos de la venta */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-700 mb-3">Productos:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sale.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-bold text-gray-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivo de cancelación */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Motivo de Cancelación *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explica detalladamente por qué se cancela esta venta (mínimo 10 caracteres)..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reason.length}/500 caracteres {reason.length < 10 && '(mínimo 10)'}
                </p>
              </div>

              {/* Advertencia final */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900 mb-1">
                      Esta acción NO se puede deshacer
                    </p>
                    <ul className="text-xs text-red-700 space-y-1 mt-2">
                      <li>• Se restaurará el inventario de los productos</li>
                      <li>• Se registrará en el sistema de auditoría</li>
                      <li>• Se notificará al administrador</li>
                      {sale.customerName && sale.loyaltyPointsEarned && (
                        <li>• Se restarán {sale.loyaltyPointsEarned} puntos al cliente</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Nota de auditoría */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  🔒 Esta acción quedará registrada a nombre de: <strong>{currentUser?.fullName}</strong>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all active:scale-95"
          >
            Cancelar
          </button>
          
          {validation.allowed && (
            <button
              onClick={handleConfirm}
              disabled={loading || reason.trim().length < 10}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Confirmar Cancelación
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
