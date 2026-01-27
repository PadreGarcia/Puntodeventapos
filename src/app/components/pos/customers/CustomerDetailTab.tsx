import { ArrowLeft, ShoppingCart, CreditCard, Award, DollarSign } from 'lucide-react';
import type { Customer, Sale, CreditAccount, Loan, LoyaltyTransaction } from '@/types/pos';

interface CustomerDetailTabProps {
  customer: Customer;
  sales: Sale[];
  creditAccounts: CreditAccount[];
  loans: Loan[];
  loyaltyTransactions: LoyaltyTransaction[];
  onBack: () => void;
  onUpdateCustomer: (customer: Customer) => void;
}

export function CustomerDetailTab({ 
  customer, 
  sales, 
  creditAccounts, 
  loans, 
  loyaltyTransactions,
  onBack 
}: CustomerDetailTabProps) {
  const totalCredit = creditAccounts.reduce((sum, a) => sum + a.remainingBalance, 0);
  const totalLoan = loans.reduce((sum, l) => sum + l.remainingBalance, 0);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
            <p className="text-gray-600 font-medium">Cliente desde {new Date(customer.registeredAt).toLocaleDateString('es-MX')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm font-bold">Total Compras</span>
            </div>
            <p className="text-3xl font-bold">${customer.totalSpent.toFixed(2)}</p>
            <p className="text-sm opacity-90 mt-1">{customer.purchaseCount} transacciones</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-yellow-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-bold text-gray-600">Puntos de Lealtad</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{customer.loyaltyPoints}</p>
            <p className="text-sm text-gray-600 mt-1">Nivel: {customer.loyaltyTier.toUpperCase()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-gray-600">Crédito Pendiente</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">${totalCredit.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">{creditAccounts.length} cuentas</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-bold text-gray-600">Préstamos</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">${totalLoan.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">{loans.length} activos</p>
          </div>
        </div>

        {/* Purchase History */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Historial de Compras ({sales.length})</h3>
          </div>
          <div className="p-6">
            {sales.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay compras registradas</p>
            ) : (
              <div className="space-y-3">
                {sales.slice(0, 10).map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-bold text-gray-900">#{sale.id}</div>
                      <div className="text-sm text-gray-600">{new Date(sale.timestamp).toLocaleString('es-MX')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#EC0000]">${sale.total.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">{sale.items.length} productos</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
