import { useMemo } from 'react';
import { Users, Award, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ShiftSummary, Sale } from '@/types/pos';

interface CashierReportsTabProps {
  shifts: ShiftSummary[];
  sales: Sale[];
}

export function CashierReportsTab({ shifts, sales }: CashierReportsTabProps) {
  const cashierStats = useMemo(() => {
    const stats: Record<string, {
      cashier: string;
      sales: number;
      transactions: number;
      shifts: number;
      totalHours: number;
    }> = {};

    shifts.forEach(shift => {
      const cashier = shift.openedBy;
      if (!stats[cashier]) {
        stats[cashier] = {
          cashier,
          sales: 0,
          transactions: 0,
          shifts: 0,
          totalHours: 0
        };
      }
      
      stats[cashier].sales += shift.totalSales;
      stats[cashier].transactions += shift.salesCount;
      stats[cashier].shifts++;
      stats[cashier].totalHours += shift.duration / 60;
    });

    return Object.values(stats).map(stat => ({
      ...stat,
      avgTicket: stat.transactions > 0 ? stat.sales / stat.transactions : 0,
      salesPerHour: stat.totalHours > 0 ? stat.sales / stat.totalHours : 0,
      transPerHour: stat.totalHours > 0 ? stat.transactions / stat.totalHours : 0
    })).sort((a, b) => b.sales - a.sales);
  }, [shifts]);

  const totalSales = cashierStats.reduce((sum, c) => sum + c.sales, 0);
  const totalShifts = cashierStats.reduce((sum, c) => sum + c.shifts, 0);

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
              <span className="text-sm font-bold text-gray-600">Cajeros Activos</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{cashierStats.length}</p>
          </div>

          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Total Ventas</span>
            </div>
            <p className="text-3xl font-bold">${totalSales.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Total Turnos</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalShifts}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Mejor Cajero</span>
            </div>
            <p className="text-lg font-bold text-yellow-600">
              {cashierStats[0]?.cashier || 'N/A'}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas por Cajero</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashierStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="cashier" stroke="#6B7280" style={{ fontSize: 12, fontWeight: 600 }} />
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
              <Legend wrapperStyle={{ fontWeight: 600 }} />
              <Bar dataKey="sales" fill="#EC0000" name="Ventas ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Desempeño Detallado</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cajero</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ventas</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Transacciones</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ticket Prom.</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Turnos</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Horas Trabajadas</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ventas/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {cashierStats.map((stat, index) => (
                  <tr key={stat.cashier} className="hover:bg-gray-50">
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
                    <td className="px-4 py-3 font-bold text-gray-900">{stat.cashier}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#EC0000]">
                      ${stat.sales.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {stat.transactions}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${stat.avgTicket.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {stat.shifts}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {stat.totalHours.toFixed(1)}h
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      ${stat.salesPerHour.toFixed(2)}
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
