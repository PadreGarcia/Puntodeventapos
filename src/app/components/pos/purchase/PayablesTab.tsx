import { useState } from 'react';
import { Search, CreditCard, DollarSign, X, Save, AlertTriangle, CheckCircle, Clock, Grid3x3, List } from 'lucide-react';
import { toast } from 'sonner';
import { purchaseService } from '@/services';
import type { PayableAccount, Supplier } from '@/types/pos';

interface PayablesTabProps {
  payables: PayableAccount[];
  onUpdatePayables: (payables: PayableAccount[]) => void;
  suppliers: Supplier[];
}

type ViewMode = 'grid' | 'table';

export function PayablesTab({ payables, onUpdatePayables, suppliers }: PayablesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid' | 'overdue'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<PayableAccount | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  const filteredPayables = payables.filter(payable => {
    const matchesSearch = payable.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payable.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payable.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenPaymentModal = (payable: PayableAccount) => {
    setSelectedPayable(payable);
    setPaymentAmount(payable.balance);
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayable(null);
  };

  const handleSavePayment = async () => {
    if (!selectedPayable) return;

    if (paymentAmount <= 0) {
      toast.error('El monto del pago debe ser mayor a cero');
      return;
    }

    if (paymentAmount > selectedPayable.balance) {
      toast.error('El monto del pago no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      // Registrar pago en backend
      await purchaseService.recordPayablePayment(selectedPayable.id, {
        amount: paymentAmount,
        paymentMethod: 'cash',
        notes: paymentNotes || undefined,
      });

      const newPayment = {
        id: Math.random().toString(36).substr(2, 9),
        amount: paymentAmount,
        date: new Date(),
        method: 'cash' as const,
        notes: paymentNotes || undefined,
      };

      const newAmountPaid = selectedPayable.amountPaid + paymentAmount;
      const newBalance = selectedPayable.balance - paymentAmount;
      const newStatus = newBalance === 0 ? 'paid' : newBalance < selectedPayable.amount ? 'partial' : 'pending';

      const updated = payables.map(p =>
        p.id === selectedPayable.id
          ? {
              ...p,
              amountPaid: newAmountPaid,
              balance: newBalance,
              status: newStatus as 'pending' | 'partial' | 'paid' | 'overdue',
              notes: paymentNotes || p.notes,
              paymentHistory: [...p.paymentHistory, newPayment],
            }
          : p
      );

      onUpdatePayables(updated);

      if (newBalance === 0) {
        toast.success(`Cuenta saldada completamente - ${selectedPayable.invoiceNumber}`);
      } else {
        toast.success(`Pago registrado - Saldo restante: ${formatCurrency(newBalance)}`);
      }

      handleClosePaymentModal();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error('Error al registrar el pago');
    }
  };

  const getStatusBadge = (status: 'pending' | 'partial' | 'paid' | 'overdue', dueDate: Date) => {
    const isOverdue = (status === 'pending' || status === 'partial') && new Date() > dueDate;

    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          Vencida
        </span>
      );
    }

    const badges = {
      pending: { label: 'Pendiente', bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
      partial: { label: 'Pago Parcial', bg: 'bg-blue-100', text: 'text-blue-700', icon: CreditCard },
      paid: { label: 'Pagada', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const days = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getTotalPending = () => {
    return payables
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + p.balance, 0);
  };

  const getOverdueCount = () => {
    return payables.filter(p => p.status !== 'paid' && new Date() > p.dueDate).length;
  };

  const totalPending = getTotalPending();
  const overdueCount = getOverdueCount();

  // Componente de Card de Cuenta por Pagar
  const PayableCard = ({ payable }: { payable: PayableAccount }) => {
    const daysUntilDue = getDaysUntilDue(payable.dueDate);
    const isOverdue = payable.status !== 'paid' && daysUntilDue < 0;
    const paymentProgress = (payable.amountPaid / payable.amount) * 100;

    return (
      <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
        isOverdue ? 'border-red-300' : 'border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b ${
          isOverdue ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{payable.invoiceNumber}</h3>
              <p className="text-sm text-gray-600 mt-1">{payable.supplierName}</p>
            </div>
            {getStatusBadge(payable.status, payable.dueDate)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Montos */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 font-bold uppercase mb-1">Total</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(payable.amount)}</div>
            </div>
            <div className="bg-[#EC0000]/10 rounded-lg p-3">
              <div className="text-xs text-[#EC0000] font-bold uppercase mb-1">Saldo</div>
              <div className="text-lg font-bold text-[#EC0000]">{formatCurrency(payable.balance)}</div>
            </div>
          </div>

          {/* Progreso de pago */}
          {payable.status !== 'paid' && payable.amountPaid > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Pagado: {formatCurrency(payable.amountPaid)}</span>
                <span>{paymentProgress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Vencimiento */}
          <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
            <div className="text-xs text-orange-600 font-bold mb-1">Vencimiento</div>
            <div className="text-sm font-bold text-orange-900">{formatDate(payable.dueDate)}</div>
            {payable.status !== 'paid' && (
              <div className={`text-xs font-bold mt-1 ${
                daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {daysUntilDue < 0 
                  ? `Vencida hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) > 1 ? 's' : ''}`
                  : `Vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}`
                }
              </div>
            )}
          </div>

          {/* Notas */}
          {payable.notes && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="text-xs text-yellow-700 font-bold uppercase mb-1">Notas</div>
              <div className="text-sm text-yellow-900">{payable.notes}</div>
            </div>
          )}

          {/* Botón registrar pago */}
          {payable.status !== 'paid' && (
            <button
              onClick={() => handleOpenPaymentModal(payable)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-lg font-bold transition-all active:scale-95"
            >
              <DollarSign className="w-4 h-4" />
              Registrar Pago
            </button>
          )}

          {/* Fecha de pago */}
          {payable.status === 'paid' && payable.paidDate && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-sm text-green-600 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Pagada el {formatDate(payable.paidDate)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex flex-col gap-3">
          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-600 p-2.5 rounded-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Total Pendiente</p>
                  <p className="text-2xl font-bold text-orange-900">{formatCurrency(totalPending)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-2.5 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-700 font-medium">Cuentas Vencidas</p>
                  <p className="text-2xl font-bold text-red-900">{overdueCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 p-2.5 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Pagadas</p>
                  <p className="text-2xl font-bold text-green-900">
                    {payables.filter(p => p.status === 'paid').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600 font-medium">
              {filteredPayables.length} de {payables.length} cuentas
            </div>

            {/* Toggle vista - Solo desktop */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#EC0000] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#EC0000] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtros compactos */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar factura o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white min-w-[140px]"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pagada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredPayables.length > 0 ? (
          <>
            {/* Vista de Cards - Móvil/Tablet o seleccionada en Desktop */}
            <div className={`${viewMode === 'table' ? 'hidden lg:hidden' : 'block'} ${viewMode === 'grid' && 'lg:block'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPayables.map(payable => (
                  <PayableCard key={payable.id} payable={payable} />
                ))}
              </div>
            </div>

            {/* Vista de Tabla - Solo Desktop cuando está seleccionada */}
            {viewMode === 'table' && (
              <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Factura</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Proveedor</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Total</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Pagado</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Saldo</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Vencimiento</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Estado</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPayables.map(payable => {
                        const daysUntilDue = getDaysUntilDue(payable.dueDate);
                        const isOverdue = payable.status !== 'paid' && daysUntilDue < 0;
                        const paymentProgress = (payable.amountPaid / payable.amount) * 100;

                        return (
                          <tr key={payable.id} className={`transition-colors ${isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900">{payable.invoiceNumber}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{payable.supplierName}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-bold text-gray-900">{formatCurrency(payable.amount)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div>
                                <span className="font-bold text-green-600">{formatCurrency(payable.amountPaid)}</span>
                                {payable.status !== 'paid' && payable.amountPaid > 0 && (
                                  <div className="mt-1">
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden w-20 ml-auto">
                                      <div
                                        className="h-full bg-green-500"
                                        style={{ width: `${paymentProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-bold text-[#EC0000]">{formatCurrency(payable.balance)}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="text-sm text-gray-600">{formatDate(payable.dueDate)}</div>
                              {payable.status !== 'paid' && (
                                <div className={`text-xs font-bold mt-1 ${
                                  daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-orange-600' : 'text-gray-500'
                                }`}>
                                  {daysUntilDue < 0 
                                    ? `Vencida (${Math.abs(daysUntilDue)}d)`
                                    : `${daysUntilDue} días`
                                  }
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {getStatusBadge(payable.status, payable.dueDate)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {payable.status !== 'paid' ? (
                                <button
                                  onClick={() => handleOpenPaymentModal(payable)}
                                  className="p-2 hover:bg-[#EC0000]/10 rounded-lg text-[#EC0000] transition-colors"
                                  title="Registrar pago"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              ) : payable.paidDate && (
                                <span className="text-xs text-green-600">
                                  {formatDate(payable.paidDate)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay cuentas por pagar</h3>
            <p className="text-gray-600">Las cuentas por pagar se generan automáticamente al registrar facturas</p>
          </div>
        )}
      </div>

      {/* Modal de pago */}
      {showPaymentModal && selectedPayable && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-2xl font-bold">Registrar Pago</h3>
                <p className="text-red-100">{selectedPayable.invoiceNumber}</p>
              </div>
              <button onClick={handleClosePaymentModal} className="p-2.5 hover:bg-white/15 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Información de la cuenta */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Proveedor:</span>
                  <span className="font-bold text-gray-900">{selectedPayable.supplierName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monto Total:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(selectedPayable.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pagado:</span>
                  <span className="font-bold text-green-600">{formatCurrency(selectedPayable.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-300">
                  <span className="font-bold text-gray-900">Saldo Pendiente:</span>
                  <span className="font-bold text-[#EC0000]">{formatCurrency(selectedPayable.balance)}</span>
                </div>
              </div>

              {/* Monto del pago */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Monto del Pago *
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedPayable.balance}
                  step="0.01"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-2xl font-bold text-center"
                  placeholder="0.00"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedPayable.balance / 2)}
                    className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-bold text-sm transition-colors"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedPayable.balance)}
                    className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-bold text-sm transition-colors"
                  >
                    Pago Total
                  </button>
                </div>
              </div>

              {/* Vista previa */}
              {paymentAmount > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-blue-700">Saldo Actual:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(selectedPayable.balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-blue-700">Pago:</span>
                    <span className="font-bold text-blue-900">- {formatCurrency(paymentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t-2 border-blue-300">
                    <span className="font-bold text-blue-900">Saldo Restante:</span>
                    <span className={`font-bold text-xl ${
                      selectedPayable.balance - paymentAmount === 0 ? 'text-green-600' : 'text-blue-900'
                    }`}>
                      {formatCurrency(selectedPayable.balance - paymentAmount)}
                    </span>
                  </div>
                  {selectedPayable.balance - paymentAmount === 0 && (
                    <div className="mt-3 pt-3 border-t-2 border-blue-300">
                      <p className="text-green-700 font-bold text-center flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Cuenta saldada completamente
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notas del Pago
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium resize-none"
                  placeholder="Método de pago, referencia, etc..."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClosePaymentModal}
                  className="flex-1 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePayment}
                  disabled={paymentAmount <= 0 || paymentAmount > selectedPayable.balance}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  Registrar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
