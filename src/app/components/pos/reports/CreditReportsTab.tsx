import { CreditCard, DollarSign, AlertTriangle, TrendingUp, CheckCircle, Clock, Coins } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Customer } from '@/types/pos';

interface CreditReportsTabProps {
  customers: Customer[];
}

export function CreditReportsTab({ customers }: CreditReportsTabProps) {
  // Simular datos de crédito (en producción vendrían de las cuentas reales)
  const creditAccounts = [
    { customer: 'María López', amount: 1000, remaining: 450, status: 'partial', dueDate: new Date('2026-02-15') },
    { customer: 'Juan Pérez', amount: 500, remaining: 500, status: 'pending', dueDate: new Date('2026-02-01') },
    { customer: 'Ana García', amount: 800, remaining: 0, status: 'paid', dueDate: new Date('2026-01-20') },
    { customer: 'Carlos Ruiz', amount: 1200, remaining: 1200, status: 'overdue', dueDate: new Date('2026-01-10') },
    { customer: 'Sofia Torres', amount: 600, remaining: 200, status: 'partial', dueDate: new Date('2026-02-20') },
  ];

  const loans = [
    { customer: 'Pedro Martínez', principal: 5000, total: 5500, remaining: 3200, installments: 12, paid: 5 },
    { customer: 'Laura Sánchez', principal: 10000, total: 11200, remaining: 8400, installments: 24, paid: 6 },
    { customer: 'Diego Morales', principal: 3000, total: 3300, remaining: 1100, installments: 12, paid: 8 },
  ];

  // Estadísticas de crédito
  const totalCreditGiven = creditAccounts.reduce((sum, a) => sum + a.amount, 0);
  const totalCreditPending = creditAccounts.reduce((sum, a) => sum + a.remaining, 0);
  const totalCreditCollected = totalCreditGiven - totalCreditPending;
  const overdueAccounts = creditAccounts.filter(a => a.status === 'overdue').length;

  // Estadísticas de préstamos
  const totalLent = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalLoansPending = loans.reduce((sum, l) => sum + l.remaining, 0);
  const totalLoansCollected = loans.reduce((sum, l) => sum + (l.total - l.remaining), 0);

  // Distribución por estado
  const statusDistribution = [
    { name: 'Pagado', value: creditAccounts.filter(a => a.status === 'paid').length, color: '#22C55E' },
    { name: 'Parcial', value: creditAccounts.filter(a => a.status === 'partial').length, color: '#3B82F6' },
    { name: 'Pendiente', value: creditAccounts.filter(a => a.status === 'pending').length, color: '#EAB308' },
    { name: 'Vencido', value: creditAccounts.filter(a => a.status === 'overdue').length, color: '#EF4444' },
  ];

  // Datos para gráfica de recuperación
  const recoveryData = [
    { month: 'Ene', cobrado: 4500, pendiente: 8500 },
    { month: 'Feb', cobrado: 6200, pendiente: 7300 },
    { month: 'Mar', cobrado: 5800, pendiente: 6800 },
    { month: 'Abr', cobrado: 7100, pendiente: 5200 },
    { month: 'May', cobrado: 6900, pendiente: 4400 },
    { month: 'Jun', cobrado: 8200, pendiente: 3500 },
  ];

  // Tasa de recuperación
  const recoveryRate = totalCreditGiven > 0 ? (totalCreditCollected / totalCreditGiven * 100).toFixed(1) : 0;

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPIs Crédito */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#EC0000]" /> Cuentas por Cobrar (Fiado)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6" />
              <span className="text-sm font-bold opacity-90">Total Otorgado</span>
            </div>
            <p className="text-3xl font-bold">${totalCreditGiven.toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-1">{creditAccounts.length} cuentas</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <span className="text-sm font-bold text-gray-600">Cobrado</span>
            </div>
            <p className="text-3xl font-bold text-green-600">${totalCreditCollected.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">{recoveryRate}% recuperado</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-bold text-gray-600">Por Cobrar</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">${totalCreditPending.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Saldo pendiente</p>
          </div>

          <div className="bg-red-50 rounded-xl shadow-lg border-2 border-red-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <span className="text-sm font-bold text-red-700">Vencidas</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{overdueAccounts}</p>
            <p className="text-sm text-red-700 mt-1">Requieren seguimiento</p>
          </div>
        </div>

        {/* KPIs Préstamos */}
        <div className="mb-4 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#EC0000]" /> Préstamos
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6" />
              <span className="text-sm font-bold opacity-90">Capital Prestado</span>
            </div>
            <p className="text-3xl font-bold">${totalLent.toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-1">{loans.length} préstamos activos</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <span className="text-sm font-bold text-gray-600">Recuperado</span>
            </div>
            <p className="text-3xl font-bold text-green-600">${totalLoansCollected.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Cuotas pagadas</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-bold text-gray-600">Por Cobrar</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">${totalLoansPending.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Saldo restante</p>
          </div>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución por Estado */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Estado de Cuentas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Evolución de Recuperación */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Evolución de Cobro</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recoveryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cobrado" fill="#22C55E" name="Cobrado" />
                <Bar dataKey="pendiente" fill="#EF4444" name="Pendiente" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de Cuentas por Cobrar */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
          <div className="p-6 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">📋 Cuentas por Cobrar</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Monto Original</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Pendiente</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Pagado</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Vencimiento</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {creditAccounts.map((account, index) => {
                  const paid = account.amount - account.remaining;
                  const progress = (paid / account.amount) * 100;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{account.customer}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-gray-900">${account.amount.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-orange-600">${account.remaining.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-green-600">${paid.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{progress.toFixed(0)}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{account.dueDate ? new Date(account.dueDate).toLocaleDateString('es-MX') : 'Sin fecha'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          account.status === 'paid' ? 'bg-green-100 text-green-700' :
                          account.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          account.status === 'partial' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {account.status === 'paid' ? (
                            <><CheckCircle className="w-4 h-4 inline" /> Pagado</>
                          ) : account.status === 'overdue' ? (
                            <><Clock className="w-4 h-4 inline" /> Vencido</>
                          ) : account.status === 'partial' ? (
                            <><AlertTriangle className="w-4 h-4 inline" /> Parcial</>
                          ) : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Préstamos */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
          <div className="p-6 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#EC0000]" /> Préstamos Activos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Principal</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Total con Int.</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Saldo</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Cuotas</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Progreso</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {loans.map((loan, index) => {
                  const progress = (loan.paid / loan.installments) * 100;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{loan.customer}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-gray-900">${loan.principal.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-gray-900">${loan.total.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-blue-600">${loan.remaining.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-gray-900">{loan.paid}/{loan.installments}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-[#EC0000] to-[#D50000] h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-600">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
          <h4 className="text-lg font-bold text-yellow-900 mb-3">⚠️ Alertas y Recomendaciones</h4>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• <span className="font-bold">{overdueAccounts}</span> cuenta(s) vencida(s) requieren seguimiento urgente</li>
            <li className="flex items-center gap-1">• Tasa de recuperación actual: <span className="font-bold">{recoveryRate}%</span> - {parseFloat(recoveryRate) >= 70 ? <span className="inline-flex items-center gap-1"><CheckCircle className="w-3 h-3 inline" /> Saludable</span> : <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3 inline" /> Necesita mejorar</span>}</li>
            <li>• Saldo pendiente total: <span className="font-bold">${totalCreditPending.toLocaleString()}</span> en cuentas por cobrar</li>
            <li>• Préstamos generando intereses: <span className="font-bold">${(totalLoansCollected - totalLent).toLocaleString()}</span> en ganancias</li>
            <li>• Se recomienda contactar a clientes con cuentas vencidas para acordar pagos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
