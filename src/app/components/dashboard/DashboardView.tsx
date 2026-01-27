import { useState, useEffect } from 'react';
import { 
  TrendingUp, ShoppingCart, DollarSign, Users, Package, 
  AlertTriangle, Clock, Calendar, ArrowRight, Zap, Receipt
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CriticalActivitiesDashboard } from '@/app/components/dashboard/CriticalActivitiesDashboard';
import type { Sale, Product, Customer, ShiftSummary, AuditLog, User } from '@/types/pos';

interface DashboardViewProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  shifts: ShiftSummary[];
  auditLogs: AuditLog[];
  users: User[];
  currentUser: User | null;
  onNavigate: (view: string) => void;
}

export function DashboardView({ sales, products, customers, shifts, auditLogs, users, currentUser, onNavigate }: DashboardViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ventas de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(s => s.date >= today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayTickets = todaySales.length;
  const todayAverage = todayTickets > 0 ? todayRevenue / todayTickets : 0;

  // Ventas de ayer para comparación
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdaySales = sales.filter(s => {
    const saleDate = new Date(s.date);
    return saleDate >= yesterday && saleDate < today;
  });
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + s.total, 0);
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

  // Datos para gráfica de ventas por hora
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourSales = todaySales.filter(s => new Date(s.date).getHours() === hour);
    return {
      hour: `${hour}:00`,
      ventas: hourSales.reduce((sum, s) => sum + s.total, 0),
      tickets: hourSales.length
    };
  }).filter(h => h.ventas > 0 || h.tickets > 0);

  // Productos top del día
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  todaySales.forEach(sale => {
    sale.items.forEach(item => {
      const existing = productSales.get(item.product.id) || { name: item.product.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.quantity * item.product.price;
      productSales.set(item.product.id, existing);
    });
  });
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Alertas
  const alerts = [
    ...products.filter(p => p.stock <= p.minStock).map(p => ({
      type: 'stock' as const,
      severity: 'high' as const,
      message: `${p.name} - Stock bajo (${p.stock} unidades)`,
      action: () => onNavigate('inventory')
    })),
    ...(shifts.length > 0 && (shifts[shifts.length - 1].actualClosing ?? shifts[shifts.length - 1].expectedClosing ?? 0) < 500 ? [{
      type: 'cash' as const,
      severity: 'medium' as const,
      message: 'Caja baja - Considera agregar efectivo para cambio',
      action: () => onNavigate('cash')
    }] : []),
    ...(todayRevenue < yesterdayRevenue * 0.7 ? [{
      type: 'sales' as const,
      severity: 'medium' as const,
      message: 'Las ventas están por debajo del promedio de ayer',
      action: () => onNavigate('sales')
    }] : []),
  ];

  // Accesos rápidos
  const quickActions = [
    { label: 'Nueva Venta', icon: ShoppingCart, view: 'sales', color: 'from-[#EC0000] to-[#D50000]' },
    { label: 'Servicios', icon: Receipt, view: 'services', color: 'from-orange-500 to-orange-600' },
    { label: 'Productos', icon: Package, view: 'products', color: 'from-blue-500 to-blue-600' },
    { label: 'Clientes', icon: Users, view: 'customers', color: 'from-purple-500 to-purple-600' },
    { label: 'Caja', icon: DollarSign, view: 'cash', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con reloj */}
        <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-lg opacity-90">
                {currentTime.toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold mb-1">
                {currentTime.toLocaleTimeString('es-MX', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </div>
              <div className="text-sm opacity-75">
                {currentTime.toLocaleTimeString('es-MX', { 
                  second: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* KPIs del Día */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div className={`text-sm font-bold px-2 py-1 rounded ${
                revenueChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange || 0).toFixed(1)}%
              </div>
            </div>
            <div className="text-sm font-bold text-gray-600 mb-1">Ventas del Día</div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              ${todayRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600">
              vs ayer: ${(yesterdayRevenue || 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="text-sm font-bold text-gray-600 mb-1">Tickets Vendidos</div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {todayTickets}
            </div>
            <div className="text-sm text-gray-600">
              {todayTickets > yesterdaySales.length ? `+${todayTickets - yesterdaySales.length}` : todayTickets - yesterdaySales.length} vs ayer ({yesterdaySales.length})
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="text-sm font-bold text-gray-600 mb-1">Ticket Promedio</div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              ${(todayAverage || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              {todayTickets} transacciones
            </div>
          </div>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Alertas de Sistema ({alerts.length})
              </h3>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 flex items-center justify-between ${
                    alert.severity === 'high' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className={`font-medium ${
                      alert.severity === 'high' ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {alert.message}
                    </span>
                  </div>
                  <button
                    onClick={alert.action}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                      alert.severity === 'high'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-yellow-600 text-white hover:bg-yellow-700'
                    }`}
                  >
                    Ver <ArrowRight className="w-4 h-4 inline" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actividades Críticas - Solo visible para Admin y Supervisor */}
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
          <CriticalActivitiesDashboard
            auditLogs={auditLogs}
            users={users}
            onViewDetails={(log) => {
              // Navegar a auditoría con el log seleccionado
              onNavigate('audit');
            }}
          />
        )}

        {/* Accesos Rápidos */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-[#EC0000]" />
            <h3 className="text-lg font-bold text-gray-900">Accesos Rápidos</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.view}
                  onClick={() => onNavigate(action.view)}
                  className={`p-6 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg hover:shadow-2xl transition-all transform hover:scale-105`}
                >
                  <Icon className="w-10 h-10 mb-3" />
                  <div className="font-bold text-lg">{action.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfica de ventas por hora */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-[#EC0000]" />
              <h3 className="text-lg font-bold text-gray-900">Ventas por Hora</h3>
            </div>
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="ventas" stroke="#EC0000" fill="#EC0000" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No hay ventas registradas hoy</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Productos */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-[#EC0000]" />
              <h3 className="text-lg font-bold text-gray-900">Top 5 Productos del Día</h3>
            </div>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.quantity} vendidos</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#EC0000]">${(product.revenue || 0).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No hay productos vendidos hoy</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumen adicional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4">
            <div className="text-sm font-bold text-gray-600 mb-2">Total de Productos</div>
            <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            <div className="text-xs text-gray-500 mt-1">
              {products.filter(p => p.stock > 0).length} en stock
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4">
            <div className="text-sm font-bold text-gray-600 mb-2">Clientes Registrados</div>
            <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
            <div className="text-xs text-gray-500 mt-1">
              {customers.filter(c => c.nfcCardId).length} con tarjeta NFC
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4">
            <div className="text-sm font-bold text-gray-600 mb-2">En Caja</div>
            <div className="text-2xl font-bold text-gray-900">
              ${shifts.length > 0 ? ((shifts[shifts.length - 1].actualClosing ?? shifts[shifts.length - 1].expectedClosing) || 0).toFixed(2) : '0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Efectivo disponible
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
