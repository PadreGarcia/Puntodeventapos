import { useMemo } from 'react';
import { Package, AlertTriangle, TrendingUp, Activity, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Product, Sale } from '@/types/pos';

interface InventoryReportsTabProps {
  products: Product[];
  sales: Sale[];
}

export function InventoryReportsTab({ products, sales }: InventoryReportsTabProps) {
  const inventoryStats = useMemo(() => {
    const soldUnits: Record<string, number> = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        soldUnits[item.product.id] = (soldUnits[item.product.id] || 0) + item.quantity;
      });
    });

    return products.map(product => {
      const sold = soldUnits[product.id] || 0;
      const stockValue = product.stock * product.price;
      const costValue = product.stock * (product.cost || 0);
      const rotation = product.stock > 0 ? sold / product.stock : 0;
      const daysOfStock = sold > 0 ? (product.stock / sold) * 30 : 999; // Estimated days

      return {
        ...product,
        sold,
        stockValue,
        costValue,
        rotation,
        daysOfStock,
        status: product.stock <= (product.minStock || 5) ? 'low' : 
                product.stock === 0 ? 'out' : 'ok'
      };
    });
  }, [products, sales]);

  const lowStock = inventoryStats.filter(p => p.status === 'low');
  const outOfStock = inventoryStats.filter(p => p.status === 'out');
  const totalValue = inventoryStats.reduce((sum, p) => sum + p.stockValue, 0);
  const totalUnits = inventoryStats.reduce((sum, p) => sum + p.stock, 0);

  const topRotation = [...inventoryStats].sort((a, b) => b.rotation - a.rotation).slice(0, 10);

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
              <span className="text-sm font-bold text-gray-600">Total Productos</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{products.length}</p>
          </div>

          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold opacity-90">Valor Inventario</span>
            </div>
            <p className="text-3xl font-bold">${totalValue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-yellow-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Stock Bajo</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{lowStock.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-bold text-gray-600">Sin Stock</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{outOfStock.length}</p>
          </div>
        </div>

        {/* Rotation Chart */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 - Mayor Rotación</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topRotation} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#6B7280" 
                style={{ fontSize: 10, fontWeight: 600 }}
                width={120}
              />
              <Tooltip 
                formatter={(value: number) => value.toFixed(2)}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #E5E7EB', 
                  borderRadius: 12,
                  fontWeight: 600 
                }} 
              />
              <Bar dataKey="rotation" fill="#00C49F" name="Índice de Rotación" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        {(lowStock.length > 0 || outOfStock.length > 0) && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-bold text-yellow-900">Alertas de Inventario</h3>
            </div>
            {outOfStock.length > 0 && (
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ⛔ <span className="font-bold">{outOfStock.length} productos sin stock</span>: {outOfStock.map(p => p.name).join(', ')}
              </p>
            )}
            {lowStock.length > 0 && (
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ <span className="font-bold">{lowStock.length} productos con stock bajo</span>: {lowStock.slice(0, 5).map(p => p.name).join(', ')}
                {lowStock.length > 5 && '...'}
              </p>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Estado del Inventario</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Vendidos</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Rotación</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Valor Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {inventoryStats.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {item.stock}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-600">
                      {item.sold}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {item.rotation.toFixed(2)}x
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#EC0000]">
                      ${item.stockValue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${
                        item.status === 'out' ? 'bg-red-100 text-red-700' :
                        item.status === 'low' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.status === 'out' ? (
                          <><XCircle className="w-4 h-4 inline" /> Sin Stock</>
                        ) : item.status === 'low' ? (
                          <><AlertTriangle className="w-4 h-4 inline" /> Stock Bajo</>
                        ) : (
                          <><CheckCircle className="w-4 h-4 inline" /> Normal</>
                        )}
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
