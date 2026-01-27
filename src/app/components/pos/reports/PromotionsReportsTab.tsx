import { Percent, TrendingUp, Tag, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Sale, Product } from '@/types/pos';

interface PromotionsReportsTabProps {
  sales: Sale[];
  products: Product[];
}

export function PromotionsReportsTab({ sales, products }: PromotionsReportsTabProps) {
  // Simular datos de promociones (en producción vendrían de las ventas reales)
  const promotionsData = [
    { name: 'Super Oferta Verano', type: '15% Descuento', uses: 45, revenue: 12500, savings: 2200, effectiveness: 85 },
    { name: 'Promo 2x1 Bebidas', type: 'Compra 2 Lleva 3', uses: 38, revenue: 9800, savings: 1800, effectiveness: 78 },
    { name: 'Black Friday', type: '25% Descuento', uses: 67, revenue: 18900, savings: 6300, effectiveness: 92 },
    { name: 'Combo Desayuno', type: 'Paquete $55', uses: 29, revenue: 1595, savings: 870, effectiveness: 68 },
    { name: 'Descuento Volumen', type: '10% en 5+', uses: 15, revenue: 4200, savings: 467, effectiveness: 55 },
  ];

  const couponsData = [
    { code: 'VERANO2026', uses: 23, discount: 345.50, type: '15%' },
    { code: 'WELCOME10', uses: 45, discount: 450.00, type: '$10' },
    { code: 'SAVE20', uses: 12, discount: 240.00, type: '$20' },
    { code: 'BLACKFRIDAY', uses: 67, discount: 1340.00, type: '20%' },
    { code: 'PRIMAVERA', uses: 8, discount: 120.00, type: '$15' },
  ];

  // Evolución mensual de descuentos
  const monthlyDiscounts = [
    { month: 'Ene', descuentos: 2500, ventas: 45000 },
    { month: 'Feb', descuentos: 1800, ventas: 38000 },
    { month: 'Mar', descuentos: 3200, ventas: 52000 },
    { month: 'Abr', descuentos: 2900, ventas: 48000 },
    { month: 'May', descuentos: 4100, ventas: 61000 },
    { month: 'Jun', descuentos: 3500, ventas: 55000 },
  ];

  // Estadísticas
  const totalPromotions = promotionsData.length;
  const totalUses = promotionsData.reduce((sum, p) => sum + p.uses, 0);
  const totalRevenue = promotionsData.reduce((sum, p) => sum + p.revenue, 0);
  const totalSavings = promotionsData.reduce((sum, p) => sum + p.savings, 0);
  const totalCouponUses = couponsData.reduce((sum, c) => sum + c.uses, 0);
  const totalCouponDiscount = couponsData.reduce((sum, c) => sum + c.discount, 0);

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Percent className="w-6 h-6" />
              <span className="text-sm font-bold opacity-90">Promociones Activas</span>
            </div>
            <p className="text-3xl font-bold">{totalPromotions}</p>
            <p className="text-sm opacity-90 mt-1">{totalUses} usos totales</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <span className="text-sm font-bold text-gray-600">Ingresos con Promos</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">+23% vs mes anterior</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-bold text-gray-600">Descuentos Otorgados</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalSavings.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Ahorros para clientes</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-bold text-gray-600">Cupones Usados</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalCouponUses}</p>
            <p className="text-sm text-gray-600 mt-1">${totalCouponDiscount.toFixed(2)} en descuentos</p>
          </div>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Efectividad de Promociones */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Efectividad de Promociones</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={promotionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="effectiveness" fill="#22C55E" name="Efectividad %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Evolución de Descuentos */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Evolución Mensual</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyDiscounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="descuentos" stroke="#EC0000" strokeWidth={2} name="Descuentos ($)" />
                <Line type="monotone" dataKey="ventas" stroke="#22C55E" strokeWidth={2} name="Ventas ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de Promociones */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
          <div className="p-6 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#EC0000]" /> Rendimiento de Promociones
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Promoción</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Usos</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ingresos</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ahorros</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Efectividad</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {promotionsData.map((promo, index) => {
                  const roi = ((promo.revenue - promo.savings) / promo.savings * 100).toFixed(1);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{promo.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                          {promo.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-gray-900">{promo.uses}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-green-600">${promo.revenue.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-orange-600">${promo.savings.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-bold ${
                          promo.effectiveness >= 80 ? 'text-green-600' :
                          promo.effectiveness >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {promo.effectiveness}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-[#EC0000]">{roi}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Cupones */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
          <div className="p-6 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">🎟️ Cupones Más Usados</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Ranking</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Usos</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Descuento Total</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Promedio/Uso</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {couponsData.map((coupon, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {index === 0 && <span className="text-xl">🥇</span>}
                      {index === 1 && <span className="text-xl">🥈</span>}
                      {index === 2 && <span className="text-xl">🥉</span>}
                      {index > 2 && <span className="font-bold text-gray-500">#{index + 1}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{coupon.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                        {coupon.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-gray-900">{coupon.uses}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-[#EC0000]">${coupon.discount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-gray-900">${(coupon.discount / coupon.uses).toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <h4 className="text-lg font-bold text-green-900 mb-3">💡 Insights de Promociones</h4>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• <span className="font-bold">Black Friday</span> fue la promoción más efectiva con 92% de efectividad</li>
            <li>• Las promociones generaron <span className="font-bold">${totalRevenue.toLocaleString()}</span> en ingresos adicionales</li>
            <li>• Los clientes ahorraron <span className="font-bold">${totalSavings.toLocaleString()}</span> en total</li>
            <li>• El cupón <span className="font-bold">{couponsData[0].code}</span> es el más popular con {couponsData[0].uses} usos</li>
            <li>• ROI promedio de promociones: <span className="font-bold">467%</span> - Excelente retorno de inversión</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
