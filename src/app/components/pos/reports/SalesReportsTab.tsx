import { useState, useMemo } from 'react';
import { Calendar, TrendingUp, DollarSign, ShoppingCart, Download, Filter } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Sale, Product } from '@/types/pos';

interface SalesReportsTabProps {
  sales: Sale[];
  products: Product[];
}

type PeriodType = 'day' | 'week' | 'month' | 'year';

const COLORS = ['#EC0000', '#00C49F', '#FFBB28', '#0088FE', '#FF8042'];

export function SalesReportsTab({ sales, products }: SalesReportsTabProps) {
  const [period, setPeriod] = useState<PeriodType>('day');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      return saleDate >= start && saleDate <= end;
    });
  }, [sales, startDate, endDate]);

  // Calculate KPIs
  const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = filteredSales.length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  
  const salesByMethod = useMemo(() => {
    const cash = filteredSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
    const card = filteredSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);
    const transfer = filteredSales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.total, 0);
    
    return [
      { name: 'Efectivo', value: cash, percentage: totalSales > 0 ? (cash / totalSales * 100).toFixed(1) : 0 },
      { name: 'Tarjeta', value: card, percentage: totalSales > 0 ? (card / totalSales * 100).toFixed(1) : 0 },
      { name: 'Transferencia', value: transfer, percentage: totalSales > 0 ? (transfer / totalSales * 100).toFixed(1) : 0 },
    ];
  }, [filteredSales, totalSales]);

  // Sales by period
  const salesByPeriod = useMemo(() => {
    const grouped: Record<string, { sales: number; transactions: number }> = {};

    filteredSales.forEach(sale => {
      const date = new Date(sale.timestamp);
      let key: string;

      switch (period) {
        case 'day':
          key = date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
          break;
        case 'week':
          const weekNum = Math.ceil(date.getDate() / 7);
          key = `Sem ${weekNum} ${date.toLocaleDateString('es-MX', { month: 'short' })}`;
          break;
        case 'month':
          key = date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }

      if (!grouped[key]) {
        grouped[key] = { sales: 0, transactions: 0 };
      }
      grouped[key].sales += sale.total;
      grouped[key].transactions += 1;
    });

    return Object.entries(grouped)
      .map(([period, data]) => ({
        period,
        ventas: parseFloat(data.sales.toFixed(2)),
        transacciones: data.transactions,
        ticketPromedio: parseFloat((data.sales / data.transactions).toFixed(2))
      }))
      .slice(-15); // Last 15 periods
  }, [filteredSales, period]);

  const handleExport = () => {
    const csv = [
      ['Período', 'Ventas', 'Transacciones', 'Ticket Promedio'].join(','),
      ...salesByPeriod.map(row => 
        [row.period, row.ventas, row.transacciones, row.ticketPromedio].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas_${startDate}_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-[#EC0000]" />
            <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Período</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
              >
                <option value="day">Por Día</option>
                <option value="week">Por Semana</option>
                <option value="month">Por Mes</option>
                <option value="year">Por Año</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleExport}
                className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Total Ventas</span>
            </div>
            <p className="text-3xl font-bold">${totalSales.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Transacciones</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalTransactions}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Ticket Promedio</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">${averageTicket.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Días Analizados</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))}
            </p>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tendencia de Ventas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesByPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="period" stroke="#6B7280" style={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis stroke="#6B7280" style={{ fontSize: 12, fontWeight: 600 }} />
              <Tooltip 
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
                dataKey="ventas" 
                stroke="#EC0000" 
                strokeWidth={3}
                name="Ventas ($)" 
                dot={{ fill: '#EC0000', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transactions Chart */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transacciones por Período</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesByPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="period" stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #E5E7EB', 
                    borderRadius: 12,
                    fontWeight: 600 
                  }} 
                />
                <Bar dataKey="transacciones" fill="#0088FE" name="Transacciones" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods Chart */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas por Método de Pago</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={salesByMethod}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesByMethod.map((entry, index) => (
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
        </div>

        {/* Details Table */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Detalle por Período</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Período</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ventas</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Transacciones</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ticket Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {salesByPeriod.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.period}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#EC0000]">
                      ${row.ventas.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {row.transacciones}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${row.ticketPromedio.toFixed(2)}
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
