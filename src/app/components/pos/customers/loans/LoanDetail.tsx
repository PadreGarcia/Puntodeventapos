import { useState } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Download,
  Check,
  XCircle
} from 'lucide-react';
import type { Loan } from '@/types/pos';
import { toast } from 'sonner';

interface LoanDetailProps {
  loan: Loan;
  onClose: () => void;
  onMakePayment: () => void;
  onUpdateLoan: (loan: Loan) => void;
}

export function LoanDetail({ loan, onClose, onMakePayment, onUpdateLoan }: LoanDetailProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'payments'>('schedule');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getPaymentStatus = (entry: typeof loan.amortizationSchedule[0]) => {
    if (entry.status === 'paid') {
      return {
        label: 'Pagado',
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircle
      };
    } else if (entry.status === 'partial') {
      return {
        label: 'Parcial',
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: Clock
      };
    } else if (entry.status === 'overdue') {
      return {
        label: 'Vencido',
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: AlertTriangle
      };
    } else {
      return {
        label: 'Pendiente',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: Clock
      };
    }
  };

  const handleApproveLoan = () => {
    if (confirm('¿Aprobar este préstamo? El cliente podrá comenzar a realizar pagos.')) {
      const updatedLoan: Loan = {
        ...loan,
        status: 'active',
        approvedBy: 'Usuario', // En producción vendría del sistema de usuarios
        approvedAt: new Date()
      };
      onUpdateLoan(updatedLoan);
      toast.success('Préstamo aprobado exitosamente');
    }
  };

  const handleRejectLoan = () => {
    if (confirm('¿Rechazar este préstamo? Esta acción no se puede deshacer.')) {
      const updatedLoan: Loan = {
        ...loan,
        status: 'cancelled'
      };
      onUpdateLoan(updatedLoan);
      toast.success('Préstamo cancelado');
      onClose();
    }
  };

  const progress = ((loan.paidAmount / loan.totalAmount) * 100).toFixed(1);
  const paymentsCompleted = loan.amortizationSchedule.filter(e => e.status === 'paid').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{loan.loanNumber}</h2>
              <p className="text-sm opacity-90 mt-1">{loan.customerName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              loan.status === 'pending' ? 'bg-yellow-500/20 border-2 border-yellow-300' :
              loan.status === 'active' ? 'bg-blue-500/20 border-2 border-blue-300' :
              loan.status === 'completed' ? 'bg-green-500/20 border-2 border-green-300' :
              'bg-red-500/20 border-2 border-red-300'
            }`}>
              {loan.status === 'pending' ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Pendiente Aprobación
                </span>
              ) : loan.status === 'active' ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Activo
                </span>
              ) : loan.status === 'completed' ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Completado
                </span>
              ) : loan.status === 'defaulted' ? (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Incumplido
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Cancelado
                </span>
              )}
            </span>
            {loan.daysOverdue > 0 && (
              <span className="px-4 py-2 rounded-full text-sm font-bold bg-red-500/20 border-2 border-red-300 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> {loan.daysOverdue} días de atraso
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
              <div className="text-xs font-bold text-blue-700 mb-1">Monto Prestado</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(loan.principal)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border-2 border-red-200">
              <div className="text-xs font-bold text-red-700 mb-1">Total a Pagar</div>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(loan.totalAmount)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
              <div className="text-xs font-bold text-green-700 mb-1">Pagado</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(loan.paidAmount)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200">
              <div className="text-xs font-bold text-orange-700 mb-1">Saldo Pendiente</div>
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(loan.remainingBalance)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-gray-700">Progreso del Préstamo</span>
              <span className="font-bold text-gray-900">
                {paymentsCompleted} / {loan.termMonths} pagos ({progress}%)
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Loan Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">Plazo</div>
              <div className="font-bold text-gray-900">{loan.termMonths} meses</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">Tasa Anual</div>
              <div className="font-bold text-gray-900">{loan.interestRate}%</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">Pago Mensual</div>
              <div className="font-bold text-gray-900">{formatCurrency(loan.monthlyPayment)}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">Pago Mínimo</div>
              <div className="font-bold text-gray-900">{formatCurrency(loan.minimumPayment)}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">Inicio</div>
              <div className="font-bold text-gray-900">
                {new Date(loan.startDate).toLocaleDateString('es-MX')}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">
                {loan.status === 'active' ? 'Próximo Pago' : 'Finalización'}
              </div>
              <div className="font-bold text-gray-900">
                {loan.status === 'active' 
                  ? new Date(loan.nextPaymentDate).toLocaleDateString('es-MX')
                  : new Date(loan.endDate).toLocaleDateString('es-MX')
                }
              </div>
            </div>
          </div>

          {/* Pending Approval Actions */}
          {loan.status === 'pending' && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-yellow-900 mb-1">Aprobación Pendiente</h4>
                  <p className="text-sm text-yellow-800">
                    Este préstamo requiere aprobación antes de que el cliente pueda recibir el monto.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApproveLoan}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" />
                  Aprobar Préstamo
                </button>
                <button
                  onClick={handleRejectLoan}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                >
                  <X className="w-5 h-5" />
                  Rechazar
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-3 font-bold transition-all ${
                activeTab === 'schedule'
                  ? 'text-[#EC0000] border-b-2 border-[#EC0000] -mb-0.5'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Tabla de Amortización
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-3 font-bold transition-all ${
                activeTab === 'payments'
                  ? 'text-[#EC0000] border-b-2 border-[#EC0000] -mb-0.5'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Historial de Pagos ({loan.payments.length})
            </button>
          </div>

          {/* Amortization Schedule Table */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Pago</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Fecha</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700">Saldo Inicial</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700">Pago Mensual</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700">Capital</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700">Interés</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700">Saldo Final</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loan.amortizationSchedule.map(entry => {
                      const statusConfig = getPaymentStatus(entry);
                      const StatusIcon = statusConfig.icon;
                      const isOverdue = entry.status === 'overdue';

                      return (
                        <tr 
                          key={entry.paymentNumber} 
                          className={`border-t border-gray-200 ${
                            isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3 font-bold text-gray-900">
                            #{entry.paymentNumber}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {entry.dueDate.toLocaleDateString('es-MX', { 
                              day: '2-digit',
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatCurrency(entry.beginningBalance)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {formatCurrency(entry.monthlyPayment)}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-600 font-medium">
                            {formatCurrency(entry.principalPayment)}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-600 font-medium">
                            {formatCurrency(entry.interestPayment)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {formatCurrency(entry.endingBalance)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr className="font-bold">
                      <td colSpan={3} className="px-4 py-3 text-right text-gray-900">
                        TOTALES:
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatCurrency(loan.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {formatCurrency(loan.principal)}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600">
                        {formatCurrency(loan.totalAmount - loan.principal)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Payments History */}
          {activeTab === 'payments' && (
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {loan.payments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No hay pagos registrados</p>
                </div>
              ) : (
                loan.payments.map(payment => (
                  <div
                    key={payment.id}
                    className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            Pago #{payment.paymentNumber} - {formatCurrency(payment.amount)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(payment.date).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-gray-600 mb-1">
                          {payment.method === 'cash' ? '💵 Efectivo' :
                           payment.method === 'card' ? '💳 Tarjeta' :
                           '🏦 Transferencia'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Por: {payment.receivedBy}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200 text-sm">
                      <div>
                        <span className="text-gray-600">Capital:</span>
                        <span className="ml-2 font-bold text-blue-600">
                          {formatCurrency(payment.principal)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Interés:</span>
                        <span className="ml-2 font-bold text-orange-600">
                          {formatCurrency(payment.interest)}
                        </span>
                      </div>
                      {payment.lateFee > 0 && (
                        <div>
                          <span className="text-gray-600">Moratorio:</span>
                          <span className="ml-2 font-bold text-red-600">
                            {formatCurrency(payment.lateFee)}
                          </span>
                        </div>
                      )}
                    </div>
                    {payment.notes && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        Nota: {payment.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
            >
              Cerrar
            </button>
            {loan.status === 'active' && (
              <button
                onClick={onMakePayment}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-green-500/30 transition-all active:scale-95"
              >
                <CreditCard className="w-5 h-5" />
                Registrar Pago
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
