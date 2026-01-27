import { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { LoanApplicationForm } from '@/app/components/pos/customers/loans/LoanApplicationForm';
import { LoanDetail } from '@/app/components/pos/customers/loans/LoanDetail';
import { PaymentModal } from '@/app/components/pos/customers/loans/PaymentModal';
import type { Loan, Customer } from '@/types/pos';

interface LoansTabProps {
  loans: Loan[];
  customers: Customer[];
  onUpdateLoans: (loans: Loan[]) => void;
  onUpdateCustomers: (customers: Customer[]) => void;
}

type FilterType = 'all' | 'pending' | 'active' | 'completed' | 'defaulted';

export function LoansTab({ loans, customers, onUpdateLoans, onUpdateCustomers }: LoansTabProps) {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Filtrar préstamos
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || loan.status === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Calcular estadísticas
  const stats = {
    total: loans.length,
    active: loans.filter(l => l.status === 'active').length,
    pending: loans.filter(l => l.status === 'pending').length,
    completed: loans.filter(l => l.status === 'completed').length,
    defaulted: loans.filter(l => l.status === 'defaulted').length,
    totalLent: loans.reduce((sum, l) => sum + l.principal, 0),
    totalOutstanding: loans
      .filter(l => l.status === 'active' || l.status === 'pending')
      .reduce((sum, l) => sum + l.remainingBalance, 0),
    totalCollected: loans.reduce((sum, l) => sum + l.paidAmount, 0),
    overdue: loans.filter(l => 
      l.status === 'active' && 
      new Date(l.nextPaymentDate) < new Date() &&
      l.daysOverdue > 0
    ).length,
  };

  const getStatusConfig = (status: Loan['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente Aprobación',
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          border: 'border-yellow-300',
          icon: Clock
        };
      case 'active':
        return {
          label: 'Activo',
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-300',
          icon: TrendingUp
        };
      case 'completed':
        return {
          label: 'Completado',
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-300',
          icon: CheckCircle
        };
      case 'defaulted':
        return {
          label: 'Incumplido',
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-300',
          icon: AlertTriangle
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-300',
          icon: X
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Préstamos</h2>
            <p className="text-sm text-gray-600 font-medium mt-1">
              Sistema completo de crédito con tabla de amortización
            </p>
          </div>
          <button
            onClick={() => setShowApplicationForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-red-500/30 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nueva Solicitud
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600">Total Prestado</span>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalLent)}
            </div>
            <div className="text-xs text-gray-500 mt-1">{stats.total} préstamos</div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600">Por Cobrar</span>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.totalOutstanding)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.active + stats.pending} activos
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600">Cobrado</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalCollected)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.completed} completados
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600">Vencidos</span>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.defaulted} incumplidos
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por número de préstamo o cliente..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {[
                { id: 'all' as FilterType, label: 'Todos', count: stats.total },
                { id: 'pending' as FilterType, label: 'Pendientes', count: stats.pending },
                { id: 'active' as FilterType, label: 'Activos', count: stats.active },
                { id: 'completed' as FilterType, label: 'Completados', count: stats.completed },
                { id: 'defaulted' as FilterType, label: 'Incumplidos', count: stats.defaulted },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterType(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    filterType === filter.id
                      ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filterType === filter.id
                      ? 'bg-white/20'
                      : 'bg-gray-200'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loans List */}
        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' 
                ? 'No se encontraron préstamos'
                : 'No hay préstamos registrados'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all'
                ? 'Intenta con otros filtros de búsqueda'
                : 'Crea una nueva solicitud de préstamo para comenzar'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-red-500/30 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Nueva Solicitud
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLoans.map(loan => {
              const statusConfig = getStatusConfig(loan.status);
              const StatusIcon = statusConfig.icon;
              const isOverdue = loan.status === 'active' && 
                new Date(loan.nextPaymentDate) < new Date() &&
                loan.daysOverdue > 0;
              const progress = ((loan.paidAmount / loan.totalAmount) * 100).toFixed(1);

              return (
                <div
                  key={loan.id}
                  className={`bg-white rounded-xl shadow-md border-2 ${
                    isOverdue ? 'border-red-300' : 'border-gray-200'
                  } overflow-hidden hover:shadow-lg transition-all`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {loan.loanNumber}
                          </h3>
                          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                          {isOverdue && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 bg-red-100 text-red-700 border-red-300">
                              <AlertTriangle className="w-3 h-3" />
                              {loan.daysOverdue} días vencido
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 font-medium">{loan.customerName}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(loan.startDate).toLocaleDateString('es-MX')}
                          </span>
                          <span>•</span>
                          <span>{loan.termMonths} meses</span>
                          <span>•</span>
                          <span>{loan.interestRate}% anual</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedLoan(loan)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalle
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-gray-700">Progreso de Pago</span>
                        <span className="font-bold text-gray-900">{progress}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#EC0000] to-[#D50000] transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-1">Monto Prestado</div>
                        <div className="text-base font-bold text-gray-900">
                          {formatCurrency(loan.principal)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-1">Total a Pagar</div>
                        <div className="text-base font-bold text-gray-900">
                          {formatCurrency(loan.totalAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-1">Pagado</div>
                        <div className="text-base font-bold text-green-600">
                          {formatCurrency(loan.paidAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-1">Saldo Pendiente</div>
                        <div className={`text-base font-bold ${
                          isOverdue ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {formatCurrency(loan.remainingBalance)}
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    {loan.status === 'active' && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-100 flex items-center justify-between">
                        <div className="flex gap-6">
                          <div>
                            <div className="text-xs font-bold text-gray-600 mb-1">
                              Pago Mensual
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {formatCurrency(loan.monthlyPayment)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-600 mb-1">
                              Próximo Pago
                            </div>
                            <div className={`text-sm font-bold ${
                              isOverdue ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {new Date(loan.nextPaymentDate).toLocaleDateString('es-MX')}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowPaymentModal(true);
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-green-500/30 transition-all active:scale-95"
                        >
                          <CreditCard className="w-5 h-5" />
                          Registrar Pago
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loan Application Form Modal */}
        {showApplicationForm && (
          <LoanApplicationForm
            customers={customers}
            onClose={() => setShowApplicationForm(false)}
            onSubmit={(newLoan) => {
              onUpdateLoans([...loans, newLoan]);
              setShowApplicationForm(false);
              toast.success('Solicitud de préstamo creada exitosamente');
            }}
          />
        )}

        {/* Loan Detail Modal */}
        {selectedLoan && !showPaymentModal && (
          <LoanDetail
            loan={selectedLoan}
            onClose={() => setSelectedLoan(null)}
            onMakePayment={() => setShowPaymentModal(true)}
            onUpdateLoan={(updatedLoan) => {
              onUpdateLoans(loans.map(l => l.id === updatedLoan.id ? updatedLoan : l));
              setSelectedLoan(updatedLoan);
            }}
          />
        )}

        {/* Payment Modal */}
        {selectedLoan && showPaymentModal && (
          <PaymentModal
            loan={selectedLoan}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedLoan(null);
            }}
            onSubmit={(updatedLoan, customer) => {
              onUpdateLoans(loans.map(l => l.id === updatedLoan.id ? updatedLoan : l));
              if (customer) {
                onUpdateCustomers(customers.map(c => c.id === customer.id ? customer : c));
              }
              setShowPaymentModal(false);
              setSelectedLoan(null);
              toast.success('Pago registrado exitosamente');
            }}
            customers={customers}
          />
        )}
      </div>
    </div>
  );
}
