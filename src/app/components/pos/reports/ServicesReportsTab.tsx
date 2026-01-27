import { useMemo } from 'react';
import { Receipt, DollarSign, TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ServicePayment } from '@/types/pos';

interface ServicesReportsTabProps {
  servicePayments: ServicePayment[];
}

const COLORS = ['#EC0000', '#FF6B6B', '#FFA500', '#FFD700', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

export function ServicesReportsTab({ servicePayments }: ServicesReportsTabProps) {
  const stats = useMemo(() => {
    if (servicePayments.length === 0) {
      return {
        totalRevenue: 0,
        totalCommissions: 0,
        totalServices: 0,
        averageTicket: 0,
        byProvider: [],
        byCategory: [],
        byPaymentMethod: [],
        topProviders: []
      };
    }

    const totalRevenue = servicePayments.reduce((sum, s) => sum + s.total, 0);
    const totalCommissions = servicePayments.reduce((sum, s) => sum + s.commission, 0);
    const totalServices = servicePayments.length;
    const averageTicket = totalRevenue / totalServices;

    // Por proveedor
    const providerMap = new Map<string, { count: number; revenue: number; commission: number }>();
    servicePayments.forEach(s => {
      const current = providerMap.get(s.providerName) || { count: 0, revenue: 0, commission: 0 };
      providerMap.set(s.providerName, {
        count: current.count + 1,
        revenue: current.revenue + s.total,
        commission: current.commission + s.commission
      });
    });

    const byProvider = Array.from(providerMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      commission: data.commission
    })).sort((a, b) => b.revenue - a.revenue);

    const topProviders = byProvider.slice(0, 5);

    // Por categoría
    const categoryMap = new Map<string, { count: number; revenue: number }>();
    servicePayments.forEach(s => {
      const categoryNames: Record<string, string> = {
        energy: 'Energía',
        telecom: 'Telecomunicaciones',
        water_gas: 'Agua y Gas',
        government: 'Gobierno',
        entertainment: 'Entretenimiento',
        financial: 'Financieros'
      };
      const categoryName = categoryNames[s.category] || s.category;
      const current = categoryMap.get(categoryName) || { count: 0, revenue: 0 };
      categoryMap.set(categoryName, {
        count: current.count + 1,
        revenue: current.revenue + s.total
      });
    });

    const byCategory = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      value: data.count,
      revenue: data.revenue
    }));

    // Por método de pago
    const paymentMethodMap = new Map<string, number>();
    servicePayments.forEach(s => {
      const methodNames: Record<string, string> = {
        cash: 'Efectivo',
        card: 'Tarjeta',
        transfer: 'Transferencia'
      };
      const methodName = methodNames[s.paymentMethod] || s.paymentMethod;
      paymentMethodMap.set(methodName, (paymentMethodMap.get(methodName) || 0) + 1);
    });

    const byPaymentMethod = Array.from(paymentMethodMap.entries()).map(([name, value]) => ({
      name,
      value
    }));

    return {
      totalRevenue,
      totalCommissions,
      totalServices,
      averageTicket,
      byProvider,
      byCategory,
      byPaymentMethod,
      topProviders
    };
  }, [servicePayments]);

  if (servicePayments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Sin Datos de Servicios</h3>
          <p className="text-gray-600 font-medium">
            Comienza a procesar pagos de servicios para ver estadísticas aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-600">Total Servicios</h3>
              <Receipt className="w-5 h-5 text-[#EC0000]" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalServices}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-600">Ingresos Totales</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-600">Comisiones Ganadas</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">${stats.totalCommissions.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-600">Ticket Promedio</h3>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats.averageTicket.toFixed(2)}</p>
          </div>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Proveedores */}
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Proveedores por Ingresos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topProviders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#EC0000" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por Categoría */}
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.byCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de Proveedores */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Desglose por Proveedor</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Servicios
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Ingresos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Comisiones
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Prom. Ticket
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.byProvider.map((provider, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{provider.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="font-medium text-gray-900">{provider.count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="font-bold text-[#EC0000]">${provider.revenue.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="font-bold text-green-600">${provider.commission.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="font-medium text-gray-900">
                        ${(provider.revenue / provider.count).toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribución por Método de Pago */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Métodos de Pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.byPaymentMethod.map((method, index) => {
              const percentage = ((method.value / stats.totalServices) * 100).toFixed(1);
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-700">{method.name}</span>
                    <span className="text-2xl font-bold text-[#EC0000]">{method.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#EC0000] to-[#D50000] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-right">{percentage}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
