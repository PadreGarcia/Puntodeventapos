import { useMemo } from 'react';
import { Users, Award, TrendingUp, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Customer, Sale } from '@/types/pos';

interface CustomerReportsTabProps {
  customers: Customer[];
  sales: Sale[];
}

const COLORS = ['#EC0000', '#00C49F', '#FFBB28', '#0088FE', '#FF8042'];

export function CustomerReportsTab({ customers, sales }: CustomerReportsTabProps) {
  const customerStats = useMemo(() => {
    if (customers.length === 0) {
      return {
        total: 0,
        active: 0,
        totalSpent: 0,
        avgSpent: 0,
        topCustomers: [],
        segmentation: []
      };
    }

    const topCustomers = [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpent = totalSpent / customers.length;

    // Segmentation
    const vip = customers.filter(c => c.totalSpent >= avgSpent * 2).length;
    const regular = customers.filter(c => c.totalSpent >= avgSpent && c.totalSpent < avgSpent * 2).length;
    const occasional = customers.filter(c => c.totalSpent < avgSpent).length;

    const segmentation = [
      { name: 'VIP', value: vip, percentage: (vip / customers.length * 100).toFixed(1) },
      { name: 'Regular', value: regular, percentage: (regular / customers.length * 100).toFixed(1) },
      { name: 'Ocasional', value: occasional, percentage: (occasional / customers.length * 100).toFixed(1) },
    ];

    return {
      total: customers.length,
      active: customers.filter(c => {
        if (!c.lastPurchase) return false;
        const daysSinceLastPurchase = (new Date().getTime() - new Date(c.lastPurchase).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastPurchase <= 30;
      }).length,
      totalSpent,
      avgSpent,
      topCustomers,
      segmentation
    };
  }, [customers]);

  if (customers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Sin Datos de Clientes</h3>
          <p className="text-gray-600 font-medium">
            Este módulo requiere un sistema de clientes vinculado a las ventas.
            <br />
            Los datos de clientes aparecerán aquí cuando estén disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Total Clientes</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{customerStats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Clientes Activos</span>
            </div>
            <p className="text-3xl font-bold">{customerStats.active}</p>
            <p className="text-sm opacity-90 mt-1">Últimos 30 días</p>
          </div>

          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Gasto Total</span>
            </div>
            <p className="text-3xl font-bold">${customerStats.totalSpent.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Gasto Promedio</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">${customerStats.avgSpent.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Clientes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerStats.topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#6B7280" 
                  style={{ fontSize: 10, fontWeight: 600 }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #E5E7EB', 
                    borderRadius: 12,
                    fontWeight: 600 
                  }} 
                />
                <Bar dataKey="totalSpent" fill="#EC0000" name="Gasto Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Segmentation */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Segmentación de Clientes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerStats.segmentation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerStats.segmentation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value} clientes`}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #E5E7EB', 
                    borderRadius: 12,
                    fontWeight: 600 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Detalle de Clientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contacto</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Compras</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Gasto Total</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Gasto Prom.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Última Compra</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Segmento</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {customerStats.topCustomers.map((customer, index) => {
                  const avgPerPurchase = customer.purchaseCount > 0 ? customer.totalSpent / customer.purchaseCount : 0;
                  const segment = customer.totalSpent >= customerStats.avgSpent * 2 ? 'VIP' :
                                  customer.totalSpent >= customerStats.avgSpent ? 'Regular' : 'Ocasional';
                  
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-500">
                        {index + 1}
                        {index < 3 && (
                          <Award className={`inline-block w-4 h-4 ml-1 ${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            'text-amber-700'
                          }`} />
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">{customer.name}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {customer.email && <div className="text-gray-600">{customer.email}</div>}
                          {customer.phone && <div className="text-gray-600">{customer.phone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {customer.purchaseCount}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#EC0000]">
                        ${customer.totalSpent.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ${avgPerPurchase.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString('es-MX') : 'Sin compras'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${
                          segment === 'VIP' ? 'bg-yellow-100 text-yellow-700' :
                          segment === 'Regular' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {segment === 'VIP' && '👑 '}
                          {segment}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
