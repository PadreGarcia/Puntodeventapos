import { useMemo, useState } from 'react';
import { Package, TrendingUp, TrendingDown, Search, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Sale, Product } from '@/types/pos';

interface ProductReportsTabProps {
  sales: Sale[];
  products: Product[];
}

export function ProductReportsTab({ sales, products }: ProductReportsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'profit'>('revenue');

  const productStats = useMemo(() => {
    const stats: Record<string, {
      productId: string;
      productName: string;
      category: string;
      unitsSold: number;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    }> = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.product.id;
        if (!stats[key]) {
          stats[key] = {
            productId: item.product.id,
            productName: item.product.name,
            category: item.product.category,
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0
          };
        }
        
        const itemRevenue = item.product.price * item.quantity;
        const itemCost = (item.product.cost || 0) * item.quantity;
        
        stats[key].unitsSold += item.quantity;
        stats[key].revenue += itemRevenue;
        stats[key].cost += itemCost;
        stats[key].profit += (itemRevenue - itemCost);
      });
    });

    // Calculate margins
    Object.values(stats).forEach(stat => {
      stat.margin = stat.revenue > 0 ? (stat.profit / stat.revenue) * 100 : 0;
    });

    return Object.values(stats);
  }, [sales]);

  const filteredStats = useMemo(() => {
    let filtered = productStats.filter(stat =>
      stat.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.revenue - a.revenue;
        case 'units':
          return b.unitsSold - a.unitsSold;
        case 'profit':
          return b.profit - a.profit;
        default:
          return 0;
      }
    });

    return filtered;
  }, [productStats, searchTerm, sortBy]);

  const topProducts = filteredStats.slice(0, 10);
  const totalRevenue = productStats.reduce((sum, p) => sum + p.revenue, 0);
  const totalUnits = productStats.reduce((sum, p) => sum + p.unitsSold, 0);
  const totalProfit = productStats.reduce((sum, p) => sum + p.profit, 0);
  const avgMargin = productStats.length > 0 
    ? productStats.reduce((sum, p) => sum + p.margin, 0) / productStats.length 
    : 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Productos Vendidos</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{productStats.length}</p>
          </div>

          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Ingresos Totales</span>
            </div>
            <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Utilidad Total</span>
            </div>
            <p className="text-3xl font-bold text-green-600">${totalProfit.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Margen Promedio</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{avgMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o categoría..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
              />
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
              >
                <option value="revenue">Ordenar por: Ingresos</option>
                <option value="units">Ordenar por: Unidades Vendidas</option>
                <option value="profit">Ordenar por: Utilidad</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Productos por Ingresos</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" style={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis 
                type="category" 
                dataKey="productName" 
                stroke="#6B7280" 
                style={{ fontSize: 11, fontWeight: 600 }}
                width={150}
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
              <Legend wrapperStyle={{ fontWeight: 600 }} />
              <Bar dataKey="revenue" fill="#EC0000" name="Ingresos ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Detalle de Productos ({filteredStats.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Unidades</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ingresos</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Costo</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Utilidad</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Margen %</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500 font-medium">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((stat, index) => (
                    <tr key={stat.productId} className="hover:bg-gray-50">
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
                      <td className="px-4 py-3 font-bold text-gray-900">{stat.productName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                          {stat.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {stat.unitsSold}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#EC0000]">
                        ${stat.revenue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-600">
                        ${stat.cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        ${stat.profit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-sm font-bold ${
                          stat.margin >= 30 ? 'bg-green-100 text-green-700' :
                          stat.margin >= 15 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {stat.margin >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {stat.margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
