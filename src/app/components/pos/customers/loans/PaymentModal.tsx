import { useState } from 'react';
import { X, DollarSign, CreditCard, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Loan, LoanPayment, Customer } from '@/types/pos';

interface PaymentModalProps {
  loan: Loan;
  customers: Customer[];
  onClose: () => void;
  onSubmit: (updatedLoan: Loan, customer?: Customer) => void;
}

type PaymentType = 'minimum' | 'monthly' | 'advance' | 'payoff';

export function PaymentModal({ loan, customers, onClose, onSubmit }: PaymentModalProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>('monthly');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [notes, setNotes] = useState('');

  const customer = customers.find(c => c.id === loan.customerId);

  // Calcular intereses moratorios
  const calculateLateFees = () => {
    if (loan.daysOverdue <= 0) return 0;
    const monthsOverdue = Math.ceil(loan.daysOverdue / 30);
    return loan.monthlyPayment * (loan.lateFeeRate / 100) * monthsOverdue;
  };

  const lateFees = calculateLateFees();

  // Determinar monto según tipo de pago
  const getPaymentAmount = (): number => {
    switch (paymentType) {
      case 'minimum':
        return loan.minimumPayment + lateFees;
      case 'monthly':
        return loan.monthlyPayment + lateFees;
      case 'advance':
        return parseFloat(customAmount) || 0;
      case 'payoff':
        return loan.remainingBalance;
      default:
        return 0;
    }
  };

  const paymentAmount = getPaymentAmount();

  // Calcular desglose del pago
  const calculatePaymentBreakdown = (amount: number) => {
    // Primero pagar intereses moratorios
    let remaining = amount;
    const lateFeePayment = Math.min(remaining, lateFees);
    remaining -= lateFeePayment;

    // Encontrar próxima cuota pendiente
    const nextPendingPayment = loan.amortizationSchedule.find(
      e => e.status === 'pending' || e.status === 'partial' || e.status === 'overdue'
    );

    if (!nextPendingPayment) {
      return {
        principal: 0,
        interest: 0,
        lateFee: lateFeePayment,
        paymentsCompleted: 0
      };
    }

    // Calcular cuántas cuotas se pueden pagar
    let paymentsCompleted = 0;
    let totalPrincipal = 0;
    let totalInterest = 0;
    let tempRemaining = remaining;

    for (const entry of loan.amortizationSchedule) {
      if (entry.status === 'paid') continue;
      if (tempRemaining <= 0) break;

      const entryAmount = entry.monthlyPayment;
      if (tempRemaining >= entryAmount) {
        totalPrincipal += entry.principalPayment;
        totalInterest += entry.interestPayment;
        tempRemaining -= entryAmount;
        paymentsCompleted++;
      } else {
        // Pago parcial - calcular proporcionalmente
        const proportion = tempRemaining / entryAmount;
        totalPrincipal += entry.principalPayment * proportion;
        totalInterest += entry.interestPayment * proportion;
        tempRemaining = 0;
        break;
      }
    }

    return {
      principal: totalPrincipal,
      interest: totalInterest,
      lateFee: lateFeePayment,
      paymentsCompleted
    };
  };

  const breakdown = calculatePaymentBreakdown(paymentAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (paymentAmount > loan.remainingBalance) {
      toast.error('El monto excede el saldo pendiente');
      return;
    }

    if (paymentType === 'minimum' && paymentAmount < loan.minimumPayment) {
      toast.error(`El pago mínimo es ${loan.minimumPayment.toFixed(2)}`);
      return;
    }

    // Crear registro de pago
    const nextPaymentNumber = loan.payments.length + 1;
    const newPayment: LoanPayment = {
      id: `payment-${Date.now()}`,
      loanId: loan.id,
      paymentNumber: nextPaymentNumber,
      amount: paymentAmount,
      principal: breakdown.principal,
      interest: breakdown.interest,
      lateFee: breakdown.lateFee,
      date: new Date(),
      method: paymentMethod,
      receivedBy: 'Usuario', // En producción vendría del sistema de usuarios
      notes: notes.trim() || undefined,
      remainingBalanceAfter: loan.remainingBalance - paymentAmount
    };

    // Actualizar tabla de amortización
    const updatedSchedule = [...loan.amortizationSchedule];
    let remainingPayment = paymentAmount - breakdown.lateFee;

    for (let i = 0; i < updatedSchedule.length; i++) {
      const entry = updatedSchedule[i];
      if (entry.status === 'paid') continue;
      if (remainingPayment <= 0) break;

      if (remainingPayment >= entry.monthlyPayment) {
        updatedSchedule[i] = {
          ...entry,
          status: 'paid',
          paidAmount: entry.monthlyPayment,
          paidDate: new Date()
        };
        remainingPayment -= entry.monthlyPayment;
      } else {
        updatedSchedule[i] = {
          ...entry,
          status: 'partial',
          paidAmount: remainingPayment,
          paidDate: new Date()
        };
        remainingPayment = 0;
      }
    }

    // Calcular próxima fecha de pago
    const nextPendingEntry = updatedSchedule.find(
      e => e.status === 'pending' || e.status === 'partial' || e.status === 'overdue'
    );

    const newRemainingBalance = loan.remainingBalance - paymentAmount;
    const newPaidAmount = loan.paidAmount + paymentAmount;
    const newStatus = newRemainingBalance <= 0.01 ? 'completed' : loan.status;

    // Actualizar préstamo
    const updatedLoan: Loan = {
      ...loan,
      remainingBalance: Math.max(0, newRemainingBalance),
      paidAmount: newPaidAmount,
      payments: [...loan.payments, newPayment],
      amortizationSchedule: updatedSchedule,
      nextPaymentDate: nextPendingEntry ? nextPendingEntry.dueDate : loan.endDate,
      daysOverdue: 0, // Reset después de pagar
      lateFees: 0,
      status: newStatus
    };

    // Actualizar crédito del cliente si se completa el préstamo
    let updatedCustomer: Customer | undefined;
    if (newStatus === 'completed' && customer) {
      updatedCustomer = {
        ...customer,
        currentCredit: Math.max(0, customer.currentCredit - loan.principal),
        creditScore: Math.min(850, customer.creditScore + 10) // Bonus por completar préstamo
      };
    }

    onSubmit(updatedLoan, updatedCustomer);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-2xl sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Registrar Pago</h2>
              <p className="text-sm opacity-90 mt-1">
                {loan.loanNumber} - {loan.customerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Loan Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 font-medium">Saldo Pendiente</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(loan.remainingBalance)}
                </div>
              </div>
              <div>
                <div className="text-gray-600 font-medium">Próximo Pago</div>
                <div className="text-lg font-bold text-gray-900">
                  {new Date(loan.nextPaymentDate).toLocaleDateString('es-MX')}
                </div>
              </div>
            </div>
          </div>

          {/* Late Fees Warning */}
          {lateFees > 0 && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-900 mb-1">Intereses Moratorios</h4>
                <p className="text-sm text-red-800">
                  Se aplicarán {formatCurrency(lateFees)} por {loan.daysOverdue} días de atraso
                </p>
              </div>
            </div>
          )}

          {/* Payment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Tipo de Pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType('minimum')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === 'minimum'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-700 shadow-lg'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold mb-1">Pago Mínimo</div>
                <div className="text-sm opacity-90">
                  {formatCurrency(loan.minimumPayment + lateFees)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('monthly')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === 'monthly'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700 shadow-lg'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold mb-1">Mensualidad</div>
                <div className="text-sm opacity-90">
                  {formatCurrency(loan.monthlyPayment + lateFees)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('advance')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === 'advance'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-700 shadow-lg'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold mb-1">Pago Adelantado</div>
                <div className="text-sm opacity-90">Monto personalizado</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('payoff')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === 'payoff'
                    ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white border-[#D50000] shadow-lg'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold mb-1">Liquidación Total</div>
                <div className="text-sm opacity-90">
                  {formatCurrency(loan.remainingBalance)}
                </div>
              </button>
            </div>
          </div>

          {/* Custom Amount Input */}
          {paymentType === 'advance' && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Monto a Pagar
              </label>
              <input
                type="number"
                required
                min={loan.minimumPayment}
                max={loan.remainingBalance}
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium text-lg"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo: {formatCurrency(loan.minimumPayment)} | Máximo: {formatCurrency(loan.remainingBalance)}
              </p>
            </div>
          )}

          {/* Payment Breakdown */}
          <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl">
            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Desglose del Pago
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Capital:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(breakdown.principal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Intereses:</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(breakdown.interest)}
                </span>
              </div>
              {breakdown.lateFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Intereses Moratorios:</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(breakdown.lateFee)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t-2 border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Total a Pagar:</span>
                  <span className="text-2xl font-bold text-green-900">
                    {formatCurrency(paymentAmount)}
                  </span>
                </div>
              </div>
              {breakdown.paymentsCompleted > 0 && (
                <div className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Este pago cubrirá <span className="font-bold">{breakdown.paymentsCompleted}</span> cuota(s)
                </div>
              )}
              <div className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg">
                Nuevo saldo: <span className="font-bold">
                  {formatCurrency(Math.max(0, loan.remainingBalance - paymentAmount))}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Método de Pago
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'cash' as const, label: '💵 Efectivo' },
                { value: 'card' as const, label: '💳 Tarjeta' },
                { value: 'transfer' as const, label: '🏦 Transferencia' }
              ].map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-3 rounded-xl border-2 font-bold transition-all ${
                    paymentMethod === method.value
                      ? 'bg-[#EC0000] text-white border-[#EC0000] shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium resize-none"
              placeholder="Notas sobre el pago..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-green-500/30 transition-all active:scale-95"
            >
              <CheckCircle className="w-5 h-5" />
              Confirmar Pago - {formatCurrency(paymentAmount)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
