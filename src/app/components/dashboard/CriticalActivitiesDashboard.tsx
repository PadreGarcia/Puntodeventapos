import { AlertTriangle, CheckCircle, XCircle, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import type { AuditLog, User } from '@/types/pos';

interface CriticalActivitiesDashboardProps {
  auditLogs: AuditLog[];
  users: User[];
  onViewDetails: (log: AuditLog) => void;
}

export function CriticalActivitiesDashboard({ auditLogs, users, onViewDetails }: CriticalActivitiesDashboardProps) {
  // Filtrar solo las últimas 24 horas
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);
  
  const recentLogs = auditLogs.filter(log => new Date(log.timestamp) > last24Hours);
  
  // Agrupar por criticidad
  const criticalLogs = recentLogs.filter(log => log.criticality === 'critical');
  const warningLogs = recentLogs.filter(log => log.criticality === 'warning');
  
  // Estadísticas por tipo de acción
  const productCreated = warningLogs.filter(log => log.action === 'product_created').length;
  const productUpdated = warningLogs.filter(log => log.action === 'product_updated').length;
  const inventoryAdjusted = warningLogs.filter(log => log.action === 'inventory_adjusted').length;
  const saleCancelled = recentLogs.filter(log => log.action === 'sale_cancelled').length;
  
  // Contar descuentos grandes (desde details)
  const largeDiscounts = recentLogs.filter(log => 
    log.action === 'sale_completed' && 
    log.details?.discount && 
    log.details.discount > 20
  ).length;
  
  // Actividades por empleado (solo cajeros)
  const cashierActivities = users
    .filter(u => u.role === 'cashier')
    .map(user => {
      const userLogs = warningLogs.filter(log => log.userId === user.id);
      const userCritical = criticalLogs.filter(log => log.userId === user.id);
      
      const productsAdded = userLogs.filter(log => log.action === 'product_created').length;
      const pricesChanged = userLogs.filter(log => log.action === 'product_updated').length;
      const discounts = recentLogs.filter(log => 
        log.userId === user.id && 
        log.action === 'sale_completed' && 
        log.details?.discount && 
        log.details.discount > 15
      ).length;
      
      // Determinar estado (flag)
      let status: 'green' | 'yellow' | 'red' = 'green';
      if (userCritical.length > 0) status = 'red';
      else if (userLogs.length > 5 || discounts > 3) status = 'yellow';
      
      return {
        user,
        productsAdded,
        pricesChanged,
        discounts,
        totalWarnings: userLogs.length,
        totalCritical: userCritical.length,
        status
      };
    })
    .filter(activity => activity.totalWarnings > 0 || activity.totalCritical > 0);
  
  // Últimas 5 alertas pendientes de revisión
  const pendingAlerts = warningLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
  
  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-[#EC0000]" />
          <h2 className="text-xl font-semibold text-gray-900">Actividades Críticas - Últimas 24h</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{productCreated}</div>
            <div className="text-sm text-gray-600">Productos nuevos</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{productUpdated}</div>
            <div className="text-sm text-gray-600">Ajustes de precio</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{inventoryAdjusted}</div>
            <div className="text-sm text-gray-600">Ajustes inventario</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{largeDiscounts}</div>
            <div className="text-sm text-gray-600">Descuentos &gt;20%</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{saleCancelled}</div>
            <div className="text-sm text-gray-600">Ventas canceladas</div>
          </div>
        </div>
      </div>
      
      {/* Actividades por empleado */}
      {cashierActivities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividades del Personal (Cajeros)</h3>
          
          <div className="space-y-3">
            {cashierActivities.map(activity => (
              <div key={activity.user.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {activity.user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{activity.user.fullName}</div>
                      <div className="text-sm text-gray-500">Cajero</div>
                    </div>
                  </div>
                  
                  {/* Estado (flag) */}
                  <div className="flex items-center gap-2">
                    {activity.status === 'green' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Normal
                      </span>
                    )}
                    {activity.status === 'yellow' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Revisar
                      </span>
                    )}
                    {activity.status === 'red' && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        Urgente
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {activity.productsAdded > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">{activity.productsAdded} productos agregados</span>
                    </div>
                  )}
                  
                  {activity.pricesChanged > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-600">{activity.pricesChanged} ajustes de precio</span>
                    </div>
                  )}
                  
                  {activity.discounts > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-600">{activity.discounts} descuentos grandes</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Alertas pendientes de revisión */}
      {pendingAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔥 Alertas Pendientes de Revisión ({pendingAlerts.length})
          </h3>
          
          <div className="space-y-3">
            {pendingAlerts.map(log => {
              const actionLabels: Record<string, string> = {
                product_created: 'agregó producto',
                product_updated: 'ajustó precio de',
                inventory_adjusted: 'ajustó inventario de',
                sale_cancelled: 'canceló venta',
              };
              
              const actionLabel = actionLabels[log.action] || log.action;
              
              return (
                <div key={log.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-gray-900">
                          {log.userName} {actionLabel}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {log.description}
                      </div>
                      
                      {/* Detalles específicos */}
                      {log.details?.priceChange && (
                        <div className="text-xs text-gray-500">
                          Cambio de precio: {log.details.priceChange > 0 ? '+' : ''}{log.details.priceChange.toFixed(1)}%
                        </div>
                      )}
                      
                      {log.details?.discount && (
                        <div className="text-xs text-gray-500">
                          Descuento aplicado: {log.details.discount}%
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(log.timestamp).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onViewDetails(log)}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver detalles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {warningLogs.length > 5 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-[#EC0000] hover:underline font-medium">
                Ver todas las {warningLogs.length} alertas →
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Estado cuando no hay alertas */}
      {pendingAlerts.length === 0 && cashierActivities.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ✅ Todo en orden
          </h3>
          <p className="text-gray-600">
            No hay actividades críticas en las últimas 24 horas
          </p>
        </div>
      )}
    </div>
  );
}
