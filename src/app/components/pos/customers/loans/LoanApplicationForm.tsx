import { useState } from 'react';
import { X, DollarSign, Calendar, Percent, User, AlertCircle, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import type { Customer, Loan, AmortizationEntry } from '@/types/pos';

interface LoanApplicationFormProps {
  customers: Customer[];
  onClose: () => void;
  onSubmit: (loan: Loan) => void;
}

const TERM_OPTIONS = [
  { months: 6, label: '6 meses' },
  { months: 12, label: '12 meses (1 año)' },
  { months: 24, label: '24 meses (2 años)' },
  { months: 36, label: '36 meses (3 años)' },
];

const INTEREST_RATES = {
  6: 18,  // 18% anual para 6 meses
  12: 24, // 24% anual para 12 meses
  24: 28, // 28% anual para 24 meses
  36: 32, // 32% anual para 36 meses
};

export function LoanApplicationForm({ customers, onClose, onSubmit }: LoanApplicationFormProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    principal: '',
    termMonths: 12,
    interestRate: INTEREST_RATES[12],
    lateFeeRate: 5, // 5% mensual de interés moratorio
  });

  const [showCalculation, setShowCalculation] = useState(false);

  const activeCustomers = customers.filter(c => c.status === 'active');
  const selectedCustomer = activeCustomers.find(c => c.id === formData.customerId);

  // Calcular valores del préstamo
  const principal = parseFloat(formData.principal) || 0;
  const monthlyRate = formData.interestRate / 100 / 12;
  const termMonths = formData.termMonths;

  // Fórmula de amortización francesa (cuota fija)
  const monthlyPayment = principal > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1)
    : 0;

  const totalAmount = monthlyPayment * termMonths;
  const totalInterest = totalAmount - principal;
  const minimumPayment = monthlyPayment * 0.3; // 30% del pago mensual

  // Generar tabla de amortización
  const generateAmortizationSchedule = (): AmortizationEntry[] => {
    const schedule: AmortizationEntry[] = [];
    let balance = principal;
    const startDate = new Date();

    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      const endingBalance = balance - principalPayment;

      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        paymentNumber: i,
        dueDate,
        beginningBalance: balance,
        monthlyPayment,
        principalPayment,
        interestPayment,
        endingBalance: Math.max(0, endingBalance),
        status: 'pending'
      });

      balance = endingBalance;
    }

    return schedule;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error('Selecciona un cliente');
      return;
    }

    if (principal <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    // Verificar límite de crédito
    if (principal > selectedCustomer.creditLimit) {
      toast.error(`El monto excede el límite de crédito del cliente ($${selectedCustomer.creditLimit.toFixed(2)})`);
      return;
    }

    // Verificar deuda actual
    const availableCredit = selectedCustomer.creditLimit - selectedCustomer.currentCredit;
    if (principal > availableCredit) {
      toast.error(`El cliente solo tiene $${availableCredit.toFixed(2)} de crédito disponible`);
      return;
    }

    const loanNumber = `LOAN-${Date.now().toString().slice(-8)}`;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + termMonths);

    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      loanNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      principal,
      interestRate: formData.interestRate,
      monthlyInterestRate: monthlyRate,
      totalAmount,
      remainingBalance: totalAmount,
      paidAmount: 0,
      termMonths,
      monthlyPayment,
      minimumPayment,
      startDate,
      endDate,
      nextPaymentDate,
      status: 'pending', // Requiere aprobación
      amortizationSchedule: generateAmortizationSchedule(),
      payments: [],
      lateFeeRate: formData.lateFeeRate,
      daysOverdue: 0,
      lateFees: 0,
      createdAt: new Date(),
    };

    onSubmit(newLoan);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Nueva Solicitud de Préstamo</h2>
              <p className="text-sm opacity-90 mt-1">
                Complete los datos para generar el préstamo
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
          {/* Customer Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Cliente *
            </label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
            >
              <option value="">Seleccionar cliente...</option>
              {activeCustomers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - Límite: ${customer.creditLimit.toFixed(2)} - Disponible: ${(customer.creditLimit - customer.currentCredit).toFixed(2)}
                </option>
              ))}
            </select>
            
            {selectedCustomer && (
              <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 font-medium">Límite de Crédito</div>
                    <div className="font-bold text-gray-900">
                      ${selectedCustomer.creditLimit.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-medium">Deuda Actual</div>
                    <div className="font-bold text-orange-600">
                      ${selectedCustomer.currentCredit.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-medium">Disponible</div>
                    <div className="font-bold text-green-600">
                      ${(selectedCustomer.creditLimit - selectedCustomer.currentCredit).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-medium">Score Crediticio</div>
                    <div className={`font-bold ${
                      selectedCustomer.creditScore >= 700 ? 'text-green-600' :
                      selectedCustomer.creditScore >= 600 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedCustomer.creditScore}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Principal Amount */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Monto del Préstamo *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={formData.principal}
                onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                placeholder="0.00"
              />
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Plazo *
              </label>
              <select
                required
                value={formData.termMonths}
                onChange={(e) => {
                  const months = parseInt(e.target.value);
                  setFormData({ 
                    ...formData, 
                    termMonths: months,
                    interestRate: INTEREST_RATES[months as keyof typeof INTEREST_RATES]
                  });
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
              >
                {TERM_OPTIONS.map(option => (
                  <option key={option.months} value={option.months}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Tasa de Interés Anual (%)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tasa mensual: {(formData.interestRate / 12).toFixed(2)}%
              </p>
            </div>

            {/* Late Fee Rate */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Interés Moratorio Mensual (%)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.lateFeeRate}
                onChange={(e) => setFormData({ ...formData, lateFeeRate: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Calculation Preview */}
          {principal > 0 && (
            <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#EC0000]" />
                  Resumen del Préstamo
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCalculation(!showCalculation)}
                  className="text-sm font-bold text-[#EC0000] hover:underline"
                >
                  {showCalculation ? 'Ocultar' : 'Ver'} Tabla de Amortización
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                  <div className="text-xs font-bold text-gray-600 mb-1">Monto Prestado</div>
                  <div className="text-xl font-bold text-gray-900">
                    ${principal.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                  <div className="text-xs font-bold text-gray-600 mb-1">Total a Pagar</div>
                  <div className="text-xl font-bold text-[#EC0000]">
                    ${totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                  <div className="text-xs font-bold text-gray-600 mb-1">Intereses</div>
                  <div className="text-xl font-bold text-orange-600">
                    ${totalInterest.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                  <div className="text-xs font-bold text-gray-600 mb-1">Pago Mensual</div>
                  <div className="text-xl font-bold text-blue-600">
                    ${monthlyPayment.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex-1 bg-white p-3 rounded-lg border-2 border-gray-200">
                  <span className="font-bold text-gray-600">Pago Mínimo:</span>
                  <span className="ml-2 font-bold text-gray-900">
                    ${minimumPayment.toFixed(2)}
                  </span>
                </div>
                <div className="flex-1 bg-white p-3 rounded-lg border-2 border-gray-200">
                  <span className="font-bold text-gray-600">CAT:</span>
                  <span className="ml-2 font-bold text-gray-900">
                    {((totalInterest / principal) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Amortization Table Preview */}
              {showCalculation && (
                <div className="mt-4 bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-gray-700">#</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-700">Fecha</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-700">Saldo Inicial</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-700">Pago Mensual</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-700">Capital</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-700">Interés</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-700">Saldo Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generateAmortizationSchedule().map(entry => (
                          <tr key={entry.paymentNumber} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 font-bold text-gray-900">{entry.paymentNumber}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {entry.dueDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              ${entry.beginningBalance.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              ${entry.monthlyPayment.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-600">
                              ${entry.principalPayment.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-orange-600">
                              ${entry.interestPayment.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              ${entry.endingBalance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-red-500/30 transition-all active:scale-95"
            >
              Crear Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
