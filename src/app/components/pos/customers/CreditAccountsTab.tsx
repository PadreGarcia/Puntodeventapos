import { useState } from 'react';
import { CreditCard, Plus, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { CreditAccount, CreditPayment, Customer } from '@/types/pos';

interface CreditAccountsTabProps {
  accounts: CreditAccount[];
  customers: Customer[];
  onUpdateAccounts: (accounts: CreditAccount[]) => void;
  onUpdateCustomers: (customers: Customer[]) => void;
}

export function CreditAccountsTab({ accounts, customers, onUpdateAccounts, onUpdateCustomers }: CreditAccountsTabProps) {
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handlePayment = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (amount > account.remainingBalance) {
      toast.error('El monto excede el saldo pendiente');
      return;
    }

    const payment: CreditPayment = {
      id: `pay-${Date.now()}`,
      amount,
      date: new Date(),
      method: 'cash',
      receivedBy: 'Admin'
    };

    const updatedAccount: CreditAccount = {
      ...account,
      remainingBalance: account.remainingBalance - amount,
      payments: [...account.payments, payment],
      status: account.remainingBalance - amount === 0 ? 'paid' :
              account.remainingBalance - amount < account.amount ? 'partial' : 'pending'
    };

    // Update customer credit
    const customer = customers.find(c => c.id === account.customerId);
    if (customer) {
      onUpdateCustomers(customers.map(c =>
        c.id === customer.id ? { ...c, currentCredit: c.currentCredit - amount } : c
      ));
    }

    onUpdateAccounts(accounts.map(a => a.id === accountId ? updatedAccount : a));
    toast.success('Pago registrado');
    setShowPaymentForm(null);
    setPaymentAmount('');
  };

  const totalPending = accounts.reduce((sum, a) => sum + a.remainingBalance, 0);
  const overdueAccounts = accounts.filter(a => a.status === 'overdue').length;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm font-bold opacity-90 mb-1">Total Pendiente</div>
            <div className="text-3xl font-bold">${totalPending.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="text-sm font-bold text-gray-600 mb-1">Cuentas Activas</div>
            <div className="text-3xl font-bold text-gray-900">{accounts.filter(a => a.status !== 'paid').length}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-lg border-2 border-yellow-200 p-6">
            <div className="text-sm font-bold text-yellow-700 mb-1">Vencidas</div>
            <div className="text-3xl font-bold text-yellow-600">{overdueAccounts}</div>
          </div>
        </div>

        {/* Accounts */}
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No hay cuentas por cobrar</p>
            </div>
          ) : (
            accounts.map(account => (
              <div key={account.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{account.customerName}</h3>
                    <p className="text-sm text-gray-600">Creado: {new Date(account.createdAt).toLocaleDateString('es-MX')}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    account.status === 'paid' ? 'bg-green-100 text-green-700' :
                    account.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    account.status === 'partial' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {account.status === 'paid' ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Pagado
                      </span>
                    ) : account.status === 'overdue' ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Vencido
                      </span>
                    ) : account.status === 'partial' ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Parcial
                      </span>
                    ) : 'Pendiente'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-bold text-gray-600 mb-1">Monto Original</div>
                    <div className="text-xl font-bold text-gray-900">${account.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-600 mb-1">Saldo Pendiente</div>
                    <div className="text-xl font-bold text-[#EC0000]">${account.remainingBalance.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-600 mb-1">Vencimiento</div>
                    <div className="text-xl font-bold text-gray-900">{new Date(account.dueDate).toLocaleDateString('es-MX')}</div>
                  </div>
                </div>

                {account.remainingBalance > 0 && (
                  <>
                    {showPaymentForm === account.id ? (
                      <div className="flex gap-3">
                        <input
                          type="number"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Monto del pago"
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                        />
                        <button
                          onClick={() => handlePayment(account.id)}
                          className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white px-6 py-2 rounded-xl font-bold"
                        >
                          Registrar
                        </button>
                        <button
                          onClick={() => setShowPaymentForm(null)}
                          className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPaymentForm(account.id)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <DollarSign className="w-5 h-5" />
                        Registrar Pago
                      </button>
                    )}
                  </>
                )}

                {account.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <h4 className="text-sm font-bold text-gray-600 mb-2">Pagos ({account.payments.length})</h4>
                    <div className="space-y-2">
                      {account.payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{new Date(p.date).toLocaleDateString('es-MX')}</span>
                          <span className="font-bold text-green-600">${p.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
