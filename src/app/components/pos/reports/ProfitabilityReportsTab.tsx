import { useMemo } from 'react';
import { DollarSign, TrendingUp, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { Sale, Product } from '@/types/pos';

interface ProfitabilityReportsTabProps {
  sales: Sale[];
  products: Product[];
}

export function ProfitabilityReportsTab({ sales, products }: ProfitabilityReportsTabProps) {
  const profitabilityStats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;

    sales.forEach(sale => {
      sale.items.forEach(item => {
        totalRevenue += item.product.price * item.quantity;
        totalCost += (item.product.cost || 0) * item.quantity;
      });
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, totalProfit, profitMargin };
  }, [sales]);

  const profitByDay = useMemo(() => {
    const grouped: Record<string, { revenue: number; cost: number }> = {};

    sales.forEach(sale => {
      const date = new Date(sale.timestamp).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
      if (!grouped[date]) {
        grouped[date] = { revenue: 0, cost: 0 };
      }

      sale.items.forEach(item => {
        grouped[date].revenue += item.product.price * item.quantity;
        grouped[date].cost += (item.product.cost || 0) * item.quantity;
      });
    });

    return Object.entries(grouped).map(([date, data]) => ({
      fecha: date,
      ingresos: parseFloat(data.revenue.toFixed(2)),
      costos: parseFloat(data.cost.toFixed(2)),
      utilidad: parseFloat((data.revenue - data.cost).toFixed(2)),
      margen: data.revenue > 0 ? parseFloat(((data.revenue - data.cost) / data.revenue * 100).toFixed(1)) : 0
    })).slice(-15);
  }, [sales]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Ingresos Totales</span>
            </div>
            <p className="text-3xl font-bold">${profitabilityStats.totalRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Costos Totales</span>
            </div>
            <p className="text-3xl font-bold">${profitabilityStats.totalCost.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Utilidad Total</span>
            </div>
            <p className="text-3xl font-bold">${profitabilityStats.totalProfit.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <Percent className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Margen de Utilidad</span>
            </div>
            <p className="text-3xl font-bold">{profitabilityStats.profitMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Profitability Trend */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tendencia de Utilidades</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={profitByDay}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8042" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FF8042" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="fecha" stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #E5E7EB', 
                  borderRadius: 12,
                  fontWeight: 600 
                }} 
              />
              <Legend wrapperStyle={{ fontWeight: 600 }} />
              <Area type="monotone" dataKey="ingresos" stroke="#0088FE" fillOpacity={1} fill="url(#colorRevenue)" name="Ingresos" />
              <Area type="monotone" dataKey="costos" stroke="#FF8042" fillOpacity={1} fill="url(#colorCost)" name="Costos" />
              <Area type="monotone" dataKey="utilidad" stroke="#00C49F" fillOpacity={1} fill="url(#colorProfit)" name="Utilidad" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Margin Trend */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Evolución del Margen de Utilidad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={profitByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="fecha" stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #E5E7EB', 
                  borderRadius: 12,
                  fontWeight: 600 
                }} 
              />
              <Legend wrapperStyle={{ fontWeight: 600 }} />
              <Line 
                type="monotone" 
                dataKey="margen" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                name="Margen (%)" 
                dot={{ fill: '#8B5CF6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Detalle Diario</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ingresos</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Costos</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Utilidad</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Margen %</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {profitByDay.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.fecha}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                      ${row.ingresos.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">
                      ${row.costos.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      ${row.utilidad.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-sm font-bold ${
                        row.margen >= 30 ? 'bg-green-100 text-green-700' :
                        row.margen >= 15 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {row.margen.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
