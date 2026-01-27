import { useMemo } from 'react';
import { Layers, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Sale, Product } from '@/types/pos';

interface CategoryReportsTabProps {
  sales: Sale[];
  products: Product[];
}

const COLORS = ['#EC0000', '#00C49F', '#FFBB28', '#0088FE', '#FF8042', '#8884D8', '#82CA9D'];

export function CategoryReportsTab({ sales, products }: CategoryReportsTabProps) {
  const categoryStats = useMemo(() => {
    const stats: Record<string, {
      category: string;
      sales: number;
      transactions: number;
      units: number;
      productCount: number;
    }> = {};

    // Count products per category
    products.forEach(product => {
      if (!stats[product.category]) {
        stats[product.category] = {
          category: product.category,
          sales: 0,
          transactions: 0,
          units: 0,
          productCount: 0
        };
      }
      stats[product.category].productCount++;
    });

    // Calculate sales per category
    sales.forEach(sale => {
      const categoriesInSale = new Set<string>();
      
      sale.items.forEach(item => {
        const category = item.product.category;
        if (!stats[category]) {
          stats[category] = {
            category,
            sales: 0,
            transactions: 0,
            units: 0,
            productCount: 0
          };
        }
        
        stats[category].sales += item.product.price * item.quantity;
        stats[category].units += item.quantity;
        categoriesInSale.add(category);
      });

      categoriesInSale.forEach(cat => {
        stats[cat].transactions++;
      });
    });

    const totalSales = Object.values(stats).reduce((sum, s) => sum + s.sales, 0);

    return Object.values(stats).map(stat => ({
      ...stat,
      percentage: totalSales > 0 ? (stat.sales / totalSales) * 100 : 0,
      avgTicket: stat.transactions > 0 ? stat.sales / stat.transactions : 0
    })).sort((a, b) => b.sales - a.sales);
  }, [sales, products]);

  const totalSales = categoryStats.reduce((sum, c) => sum + c.sales, 0);
  const totalTransactions = sales.length;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Categorías Activas</span>
            </div>
            <p className="text-3xl font-bold">{categoryStats.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Total Ventas</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalSales.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Categoría Líder</span>
            </div>
            <p className="text-lg font-bold text-blue-600">
              {categoryStats[0]?.category || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución de Ventas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="sales"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
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

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="category" 
                  stroke="#6B7280" 
                  style={{ fontSize: 11, fontWeight: 600 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #E5E7EB', 
                    borderRadius: 12,
                    fontWeight: 600 
                  }} 
                />
                <Bar dataKey="sales" fill="#EC0000" name="Ventas ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Detalle por Categoría</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Productos</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Unidades</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ventas</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">%</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Transacciones</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ticket Prom.</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {categoryStats.map((stat, index) => (
                  <tr key={stat.category} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-bold text-gray-900">{stat.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {stat.productCount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {stat.units}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#EC0000]">
                      ${stat.sales.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                        {stat.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {stat.transactions}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${stat.avgTicket.toFixed(2)}
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
