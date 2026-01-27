import { useState } from 'react';
import { Lock, AlertCircle, CheckCircle, DollarSign, TrendingUp, TrendingDown, ShoppingCart, Clock, Banknote, CreditCard, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import type { CashRegister, CashMovement, Sale, CashCount, ShiftSummary } from '@/types/pos';

interface CashClosingTabProps {
  register: CashRegister;
  movements: CashMovement[];
  sales: Sale[];
  lastCount: CashCount | undefined;
  onCloseRegister: (summary: ShiftSummary) => void;
}

export function CashClosingTab({ 
  register, 
  movements, 
  sales, 
  lastCount,
  onCloseRegister 
}: CashClosingTabProps) {
  const [notes, setNotes] = useState('');

  // Calculate totals
  const salesCash = sales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0);

  const salesCard = sales
    .filter(s => s.paymentMethod === 'card')
    .reduce((sum, s) => sum + s.total, 0);

  const salesTransfer = sales
    .filter(s => s.paymentMethod === 'transfer')
    .reduce((sum, s) => sum + s.total, 0);

  const totalSales = salesCash + salesCard + salesTransfer;

  const totalIncome = movements
    .filter(m => m.type === 'income')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalWithdrawals = movements
    .filter(m => m.type === 'withdrawal')
    .reduce((sum, m) => sum + m.amount, 0);

  const expectedClosing = register.openingBalance + salesCash + totalIncome - totalWithdrawals;
  const actualClosing = lastCount?.totalCounted || 0;
  const difference = actualClosing - expectedClosing;

  const duration = Math.floor((new Date().getTime() - register.openedAt.getTime()) / 60000);

  const handleClose = () => {
    if (!lastCount) {
      toast.error('Debes realizar un arqueo antes de cerrar la caja');
      return;
    }

    if (!confirm('¿Confirmas el cierre de caja? Esta acción no se puede deshacer.')) {
      return;
    }

    const summary: ShiftSummary = {
      id: `shift-${Date.now()}`,
      shiftNumber: register.shiftNumber,
      openedBy: register.openedBy,
      closedBy: register.openedBy,
      openedAt: register.openedAt,
      closedAt: new Date(),
      duration,
      openingBalance: register.openingBalance,
      salesCash,
      salesCard,
      salesTransfer,
      totalSales,
      salesCount: sales.length,
      incomes: totalIncome,
      withdrawals: totalWithdrawals,
      expectedClosing,
      actualClosing,
      difference,
      status: difference === 0 ? 'balanced' : difference > 0 ? 'overage' : 'shortage'
    };

    onCloseRegister(summary);
    toast.success('Caja cerrada exitosamente');
  };

  const getDifferenceStatus = () => {
    if (!lastCount) return null;
    if (difference === 0) {
      return { icon: CheckCircle, color: 'green', text: 'Cuadrado', bg: 'bg-green-50', border: 'border-green-200', textColor: 'text-green-700' };
    } else if (difference > 0) {
      return { icon: AlertCircle, color: 'blue', text: 'Sobrante', bg: 'bg-blue-50', border: 'border-blue-200', textColor: 'text-blue-700' };
    } else {
      return { icon: AlertCircle, color: 'red', text: 'Faltante', bg: 'bg-red-50', border: 'border-red-200', textColor: 'text-red-700' };
    }
  };

  const status = getDifferenceStatus();

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Alert */}
        {!lastCount && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-yellow-900 mb-1">Arqueo Requerido</h4>
              <p className="text-sm text-yellow-800">
                Debes realizar un arqueo de caja antes de poder cerrar el turno. Ve a la pestaña "Arqueo" para contar el efectivo.
              </p>
            </div>
          </div>
        )}

        {/* Shift Info */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 mb-6">
          <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-[#EC0000] to-[#D50000]">
            <h3 className="text-2xl font-bold text-white mb-2">Resumen del Turno</h3>
            <p className="text-white/90 font-medium">{register.shiftNumber}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-sm font-bold text-gray-600 mb-1">Cajero</div>
                <div className="text-lg font-bold text-gray-900">{register.openedBy}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-600 mb-1">Inicio del Turno</div>
                <div className="text-lg font-bold text-gray-900">
                  {new Date(register.openedAt).toLocaleString('es-MX', { 
                    dateStyle: 'short', 
                    timeStyle: 'short' 
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-600 mb-1 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Duración
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {Math.floor(duration / 60)}h {duration % 60}m
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="text-xs font-bold text-gray-600 mb-1">Fondo Inicial</div>
                <div className="text-xl font-bold text-gray-900">
                  ${register.openingBalance.toFixed(2)}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" />
                  Ventas
                </div>
                <div className="text-xl font-bold text-green-700">
                  ${totalSales.toFixed(2)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {sales.length} transacciones
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Ingresos
                </div>
                <div className="text-xl font-bold text-blue-700">
                  ${totalIncome.toFixed(2)}
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                <div className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Retiros
                </div>
                <div className="text-xl font-bold text-red-700">
                  ${totalWithdrawals.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 mb-6">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Desglose de Ventas por Método de Pago</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-medium text-gray-600 flex items-center gap-2">
                  <Banknote className="w-4 h-4" /> Efectivo
                </span>
                <span className="text-lg font-bold text-gray-900">${salesCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-medium text-gray-600 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Tarjeta
                </span>
                <span className="text-lg font-bold text-gray-900">${salesCard.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-medium text-gray-600 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4" /> Transferencia
                </span>
                <span className="text-lg font-bold text-gray-900">${salesTransfer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total General</span>
                <span className="text-2xl font-bold text-[#EC0000]">${totalSales.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Reconciliation */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 mb-6">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Conciliación de Efectivo</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">Fondo Inicial</span>
                <span className="font-bold text-gray-900">${register.openingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">Ventas en Efectivo</span>
                <span className="font-bold text-green-600">+${salesCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">Ingresos Extra</span>
                <span className="font-bold text-green-600">+${totalIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">Retiros</span>
                <span className="font-bold text-red-600">-${totalWithdrawals.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900">Esperado en Caja</span>
                <span className="text-lg font-bold text-gray-900">${expectedClosing.toFixed(2)}</span>
              </div>
              
              {lastCount && (
                <>
                  <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg border-2 border-blue-200">
                    <span className="font-bold text-blue-900">Efectivo Contado (Arqueo)</span>
                    <span className="text-lg font-bold text-blue-900">${actualClosing.toFixed(2)}</span>
                  </div>
                  
                  {status && (
                    <div className={`flex justify-between items-center py-4 px-4 rounded-lg border-2 ${status.border} ${status.bg}`}>
                      <div className="flex items-center gap-2">
                        <status.icon className={`w-5 h-5 ${status.textColor}`} />
                        <span className={`font-bold ${status.textColor}`}>Diferencia - {status.text}</span>
                      </div>
                      <span className={`text-xl font-bold ${status.textColor}`}>
                        {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 mb-6">
          <div className="p-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Notas de Cierre (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre el turno..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium resize-none"
            />
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={!lastCount}
          className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-5 rounded-xl font-bold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Lock className="w-5 h-5" />
          Cerrar Caja y Finalizar Turno
        </button>

        {!lastCount && (
          <p className="text-center text-sm text-gray-500 font-medium mt-3">
            Realiza un arqueo en la pestaña correspondiente para habilitar el cierre
          </p>
        )}
      </div>
    </div>
  );
}
