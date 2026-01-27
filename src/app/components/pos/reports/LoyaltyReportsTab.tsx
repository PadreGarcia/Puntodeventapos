import { Award, TrendingUp, Users, Star, Trophy } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Customer, Sale } from '@/types/pos';

interface LoyaltyReportsTabProps {
  customers: Customer[];
  sales: Sale[];
}

const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2'
};

export function LoyaltyReportsTab({ customers, sales }: LoyaltyReportsTabProps) {
  // Distribución por tier
  const tierDistribution = [
    { name: 'Bronze', value: customers.filter(c => c.loyaltyTier === 'bronze').length, color: TIER_COLORS.bronze },
    { name: 'Silver', value: customers.filter(c => c.loyaltyTier === 'silver').length, color: TIER_COLORS.silver },
    { name: 'Gold', value: customers.filter(c => c.loyaltyTier === 'gold').length, color: TIER_COLORS.gold },
    { name: 'Platinum', value: customers.filter(c => c.loyaltyTier === 'platinum').length, color: TIER_COLORS.platinum },
  ];

  // Puntos por tier
  const pointsByTier = [
    { 
      tier: 'Bronze', 
      puntos: customers.filter(c => c.loyaltyTier === 'bronze').reduce((sum, c) => sum + c.loyaltyPoints, 0),
      clientes: customers.filter(c => c.loyaltyTier === 'bronze').length
    },
    { 
      tier: 'Silver', 
      puntos: customers.filter(c => c.loyaltyTier === 'silver').reduce((sum, c) => sum + c.loyaltyPoints, 0),
      clientes: customers.filter(c => c.loyaltyTier === 'silver').length
    },
    { 
      tier: 'Gold', 
      puntos: customers.filter(c => c.loyaltyTier === 'gold').reduce((sum, c) => sum + c.loyaltyPoints, 0),
      clientes: customers.filter(c => c.loyaltyTier === 'gold').length
    },
    { 
      tier: 'Platinum', 
      puntos: customers.filter(c => c.loyaltyTier === 'platinum').reduce((sum, c) => sum + c.loyaltyPoints, 0),
      clientes: customers.filter(c => c.loyaltyTier === 'platinum').length
    },
  ];

  // Top clientes por puntos
  const topCustomers = [...customers]
    .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
    .slice(0, 10);

  // Estadísticas
  const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
  const avgPoints = customers.length > 0 ? totalPoints / customers.length : 0;
  const customersWithNFC = customers.filter(c => c.nfcCardId).length;

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6" />
              <span className="text-sm font-bold opacity-90">Puntos Totales</span>
            </div>
            <p className="text-3xl font-bold">{totalPoints.toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-1">Acumulados en el sistema</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-bold text-gray-600">Promedio por Cliente</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{Math.round(avgPoints)}</p>
            <p className="text-sm text-gray-600 mt-1">puntos</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-bold text-gray-600">Clientes con NFC</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{customersWithNFC}</p>
            <p className="text-sm text-gray-600 mt-1">
              {customers.length > 0 ? ((customersWithNFC / customers.length) * 100).toFixed(1) : 0}% del total
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-yellow-600" />
              <span className="text-sm font-bold text-gray-600">Clientes VIP</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {customers.filter(c => c.loyaltyTier === 'gold' || c.loyaltyTier === 'platinum').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Gold + Platinum</p>
          </div>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución por Nivel */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución por Nivel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Puntos por Tier */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Puntos Acumulados por Nivel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pointsByTier}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="puntos" fill="#FFD700" name="Puntos Totales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clientes */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
          <div className="p-6 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#EC0000]" /> Top 10 Clientes por Puntos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Ranking</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Nivel</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Puntos</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Compras</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Total Gastado</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">NFC</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {topCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-2xl">🥇</span>}
                        {index === 1 && <span className="text-2xl">🥈</span>}
                        {index === 2 && <span className="text-2xl">🥉</span>}
                        {index > 2 && <span className="font-bold text-gray-500">#{index + 1}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.email || 'Sin email'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold`}
                        style={{ 
                          backgroundColor: `${TIER_COLORS[customer.loyaltyTier]}20`,
                          color: TIER_COLORS[customer.loyaltyTier]
                        }}
                      >
                        <Award className="w-3 h-3" />
                        {customer.loyaltyTier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-bold text-yellow-600">
                        {customer.loyaltyPoints.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-gray-900">{customer.purchaseCount}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-[#EC0000]">${customer.totalSpent.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.nfcCardId ? (
                        <span className="text-purple-600 font-bold">📡 Sí</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-bold text-blue-900 mb-3">💡 Insights del Programa de Lealtad</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <span className="font-bold">{tierDistribution[3].value}</span> clientes Platinum generan el mayor valor de negocio</li>
            <li>• El programa tiene un promedio de <span className="font-bold">{Math.round(avgPoints)}</span> puntos por cliente</li>
            <li>• <span className="font-bold">{customersWithNFC}</span> clientes usan tarjetas NFC para compras rápidas</li>
            <li>• Los clientes Gold y Platinum representan el <span className="font-bold">
              {customers.length > 0 ? (((tierDistribution[2].value + tierDistribution[3].value) / customers.length) * 100).toFixed(1) : 0}%
            </span> del total</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
