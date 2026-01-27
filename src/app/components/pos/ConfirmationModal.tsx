import { CheckCircle, Printer, RotateCcw, Award, Wifi } from 'lucide-react';
import type { Sale } from '@/types/pos';

interface ConfirmationModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onNewSale: () => void;
  onPrint: () => void;
}

export function ConfirmationModal({ isOpen, sale, onNewSale, onPrint }: ConfirmationModalProps) {
  if (!isOpen || !sale) return null;

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    nfc: 'NFC / Lealtad'
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Animación de éxito */}
        <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] text-white p-8 text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 animate-in zoom-in duration-500 border-2 border-white/30">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight">¡Venta Exitosa!</h2>
          <p className="text-red-50 font-medium">Transacción completada correctamente</p>
        </div>

        {/* Detalles de la venta */}
        <div className="p-6 space-y-4">
          {/* Ticket number */}
          <div className="text-center pb-4 border-b">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Ticket No.</p>
            <p className="text-2xl font-bold text-gray-800 font-mono">#{sale.id}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(sale.timestamp).toLocaleString('es-ES', {
                dateStyle: 'short',
                timeStyle: 'short'
              })}
            </p>
          </div>

          {/* Resumen de pago */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Método de pago:</span>
              <span className="font-semibold text-gray-800">
                {paymentMethodLabels[sale.paymentMethod]}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold tabular-nums">${sale.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA (16%):</span>
              <span className="font-semibold tabular-nums">${sale.tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg pt-2 border-t">
              <span className="font-bold text-gray-800">Total:</span>
              <span className="font-bold text-[#EC0000] tabular-nums">
                ${sale.total.toFixed(2)}
              </span>
            </div>

            {/* Detalles de efectivo */}
            {sale.paymentMethod === 'cash' && sale.amountReceived !== undefined && (
              <>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Recibido:</span>
                  <span className="font-semibold tabular-nums">${sale.amountReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cambio:</span>
                  <span className="font-semibold text-[#EC0000] tabular-nums">
                    ${(sale.change || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}

            {/* Detalles de NFC / Lealtad */}
            {sale.paymentMethod === 'nfc' && sale.customerName && (
              <div className="pt-2 border-t">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-900">Pago con NFC</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-semibold text-gray-900">{sale.customerName}</span>
                    </div>
                    {sale.nfcCardId && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Tarjeta:</span>
                        <span className="font-mono text-gray-700">{sale.nfcCardId}</span>
                      </div>
                    )}
                    {sale.loyaltyPointsEarned && sale.loyaltyPointsEarned > 0 && (
                      <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                        <span className="text-blue-700 flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          Puntos ganados:
                        </span>
                        <span className="font-bold text-green-600">
                          +{sale.loyaltyPointsEarned}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Artículos vendidos */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Artículos vendidos
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {sale.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-semibold tabular-nums">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={onPrint}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-700 hover:bg-gray-800 text-white rounded-xl font-bold text-lg transition-colors active:scale-95 shadow-lg"
          >
            <Printer className="w-5 h-5" />
            Imprimir Ticket
          </button>

          <button
            onClick={onNewSale}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold text-lg transition-all active:scale-95 shadow-xl hover:shadow-2xl shadow-red-500/30"
          >
            <RotateCcw className="w-5 h-5" />
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
}
