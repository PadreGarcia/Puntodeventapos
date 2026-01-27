import { useState, useMemo } from 'react';
import { Shield, Search, Download, Filter, Calendar, User, Activity, Lock, Database, Unlock, DollarSign, XCircle, Package, Edit, Trash, BarChart3, ShoppingCart, Banknote, Settings, UserPlus, Gift, Tag, CreditCard, Wifi, TrendingUp, FileText, Building, Zap, Phone, Award, AlertCircle, CheckCircle, Clock, Eye, RefreshCw, FileSpreadsheet, AlertTriangle, History, Key } from 'lucide-react';
import { toast } from 'sonner';
import type { AuditLog, User as UserType } from '@/types/pos';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
  users: UserType[];
  onExportLogs: () => void;
  onBackupSystem: () => void;
  onRestoreBackup: () => void;
}

const ACTION_LABELS: Record<string, { label: string; color: string; category: string; Icon: React.FC<{ className?: string }> }> = {
  // Autenticación y Seguridad
  login: { label: 'Inicio de Sesión', color: 'from-green-500 to-green-600', category: 'Seguridad', Icon: Unlock },
  logout: { label: 'Cierre de Sesión', color: 'from-gray-500 to-gray-600', category: 'Seguridad', Icon: Lock },
  session_locked: { label: 'Sesión Bloqueada', color: 'from-yellow-500 to-yellow-600', category: 'Seguridad', Icon: Lock },
  failed_login: { label: 'Intento de Acceso Fallido', color: 'from-red-500 to-red-600', category: 'Seguridad', Icon: AlertTriangle },
  password_changed: { label: 'Cambio de Contraseña', color: 'from-purple-500 to-purple-600', category: 'Seguridad', Icon: Key },
  
  // Ventas
  sale_created: { label: 'Venta Realizada', color: 'from-blue-500 to-blue-600', category: 'Ventas', Icon: DollarSign },
  sale_deleted: { label: 'Venta Cancelada', color: 'from-red-500 to-red-600', category: 'Ventas', Icon: XCircle },
  
  // Productos
  product_created: { label: 'Producto Creado', color: 'from-purple-500 to-purple-600', category: 'Productos', Icon: Package },
  product_updated: { label: 'Producto Modificado', color: 'from-yellow-500 to-yellow-600', category: 'Productos', Icon: Edit },
  product_deleted: { label: 'Producto Eliminado', color: 'from-red-500 to-red-600', category: 'Productos', Icon: Trash },
  
  // Inventario
  inventory_adjusted: { label: 'Ajuste de Inventario', color: 'from-orange-500 to-orange-600', category: 'Inventario', Icon: BarChart3 },
  
  // Compras
  purchase_created: { label: 'Compra Registrada', color: 'from-indigo-500 to-indigo-600', category: 'Compras', Icon: ShoppingCart },
  purchase_updated: { label: 'Compra Modificada', color: 'from-yellow-500 to-yellow-600', category: 'Compras', Icon: Edit },
  purchase_deleted: { label: 'Compra Eliminada', color: 'from-red-500 to-red-600', category: 'Compras', Icon: Trash },
  
  // Caja
  cash_opened: { label: 'Apertura de Caja', color: 'from-green-500 to-green-600', category: 'Caja', Icon: Banknote },
  cash_closed: { label: 'Cierre de Caja', color: 'from-red-500 to-red-600', category: 'Caja', Icon: Lock },
  cash_adjustment: { label: 'Ajuste de Caja', color: 'from-yellow-500 to-yellow-600', category: 'Caja', Icon: Settings },
  shift_closed: { label: 'Cierre de Turno', color: 'from-gray-500 to-gray-600', category: 'Caja', Icon: Clock },
  
  // Clientes
  customer_created: { label: 'Cliente Creado', color: 'from-blue-500 to-blue-600', category: 'Clientes', Icon: UserPlus },
  customer_updated: { label: 'Cliente Modificado', color: 'from-yellow-500 to-yellow-600', category: 'Clientes', Icon: Edit },
  customer_deleted: { label: 'Cliente Eliminado', color: 'from-red-500 to-red-600', category: 'Clientes', Icon: Trash },
  
  // Promociones
  promotion_created: { label: 'Promoción Creada', color: 'from-pink-500 to-pink-600', category: 'Promociones', Icon: Gift },
  promotion_updated: { label: 'Promoción Modificada', color: 'from-yellow-500 to-yellow-600', category: 'Promociones', Icon: Edit },
  promotion_deleted: { label: 'Promoción Eliminada', color: 'from-red-500 to-red-600', category: 'Promociones', Icon: Trash },
  
  // Cupones
  coupon_created: { label: 'Cupón Creado', color: 'from-pink-500 to-pink-600', category: 'Promociones', Icon: Tag },
  coupon_updated: { label: 'Cupón Modificado', color: 'from-yellow-500 to-yellow-600', category: 'Promociones', Icon: Edit },
  coupon_redeemed: { label: 'Cupón Canjeado', color: 'from-green-500 to-green-600', category: 'Promociones', Icon: Gift },
  
  // Usuarios
  user_created: { label: 'Usuario Creado', color: 'from-green-500 to-green-600', category: 'Usuarios', Icon: UserPlus },
  user_updated: { label: 'Usuario Modificado', color: 'from-yellow-500 to-yellow-600', category: 'Usuarios', Icon: Edit },
  user_deleted: { label: 'Usuario Eliminado', color: 'from-red-500 to-red-600', category: 'Usuarios', Icon: Trash },
  
  // Proveedores
  supplier_created: { label: 'Proveedor Creado', color: 'from-blue-500 to-blue-600', category: 'Proveedores', Icon: Building },
  supplier_updated: { label: 'Proveedor Modificado', color: 'from-yellow-500 to-yellow-600', category: 'Proveedores', Icon: Edit },
  supplier_deleted: { label: 'Proveedor Eliminado', color: 'from-red-500 to-red-600', category: 'Proveedores', Icon: Trash },
  
  // NFC Cards
  nfc_card_created: { label: 'Tarjeta NFC Creada', color: 'from-purple-500 to-purple-600', category: 'NFC', Icon: CreditCard },
  nfc_card_activated: { label: 'Tarjeta NFC Activada', color: 'from-green-500 to-green-600', category: 'NFC', Icon: Wifi },
  nfc_card_blocked: { label: 'Tarjeta NFC Bloqueada', color: 'from-red-500 to-red-600', category: 'NFC', Icon: Lock },
  nfc_card_recharged: { label: 'Tarjeta NFC Recargada', color: 'from-blue-500 to-blue-600', category: 'NFC', Icon: TrendingUp },
  
  // Programa de Lealtad
  loyalty_points_added: { label: 'Puntos Agregados', color: 'from-yellow-500 to-yellow-600', category: 'Lealtad', Icon: Award },
  loyalty_points_redeemed: { label: 'Puntos Canjeados', color: 'from-orange-500 to-orange-600', category: 'Lealtad', Icon: Gift },
  loyalty_tier_upgraded: { label: 'Nivel de Lealtad Actualizado', color: 'from-green-500 to-green-600', category: 'Lealtad', Icon: TrendingUp },
  
  // Créditos y Préstamos
  credit_account_created: { label: 'Cuenta de Crédito Creada', color: 'from-blue-500 to-blue-600', category: 'Créditos', Icon: FileText },
  credit_payment_received: { label: 'Pago de Crédito Recibido', color: 'from-green-500 to-green-600', category: 'Créditos', Icon: DollarSign },
  loan_created: { label: 'Préstamo Creado', color: 'from-purple-500 to-purple-600', category: 'Préstamos', Icon: Banknote },
  loan_payment_received: { label: 'Pago de Préstamo Recibido', color: 'from-green-500 to-green-600', category: 'Préstamos', Icon: DollarSign },
  
  // Servicios
  service_payment_created: { label: 'Pago de Servicio Procesado', color: 'from-cyan-500 to-cyan-600', category: 'Servicios', Icon: Zap },
  phone_recharge_created: { label: 'Recarga Telefónica Realizada', color: 'from-indigo-500 to-indigo-600', category: 'Servicios', Icon: Phone },
  
  // Facturas y Cuentas por Pagar
  invoice_created: { label: 'Factura Creada', color: 'from-blue-500 to-blue-600', category: 'Facturas', Icon: FileText },
  invoice_paid: { label: 'Factura Pagada', color: 'from-green-500 to-green-600', category: 'Facturas', Icon: DollarSign },
  payable_created: { label: 'Cuenta por Pagar Creada', color: 'from-orange-500 to-orange-600', category: 'Cuentas por Pagar', Icon: FileText },
  payable_paid: { label: 'Cuenta por Pagar Pagada', color: 'from-green-500 to-green-600', category: 'Cuentas por Pagar', Icon: DollarSign },
  
  // Sistema
  system_backup: { label: 'Respaldo del Sistema', color: 'from-purple-500 to-purple-600', category: 'Sistema', Icon: Database },
  backup_created: { label: 'Respaldo Creado', color: 'from-purple-500 to-purple-600', category: 'Sistema', Icon: Database },
  backup_restored: { label: 'Respaldo Restaurado', color: 'from-orange-500 to-orange-600', category: 'Sistema', Icon: Activity },
  system_restore: { label: 'Restauración del Sistema', color: 'from-orange-500 to-orange-600', category: 'Sistema', Icon: Activity },
  settings_updated: { label: 'Configuración Actualizada', color: 'from-gray-500 to-gray-600', category: 'Sistema', Icon: Settings },
};

type TabType = 'all' | 'security' | 'transactions' | 'system';

export function AuditLogView({ auditLogs, users, onExportLogs, onBackupSystem, onRestoreBackup }: AuditLogViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Estadísticas simples de auditoría
  const stats = useMemo(() => {
    const today = new Date();
    const todayLogs = auditLogs.filter(log => 
      new Date(log.timestamp).toDateString() === today.toDateString()
    );
    
    const securityEvents = auditLogs.filter(log => 
      ACTION_LABELS[log.action]?.category === 'Seguridad'
    );
    
    const criticalActions = auditLogs.filter(log => 
      log.action.includes('deleted') || 
      log.action.includes('failed') || 
      log.action === 'cash_adjustment'
    );

    const uniqueUsers = new Set(auditLogs.map(log => log.userId)).size;
    const activeUsersToday = new Set(todayLogs.map(log => log.userId)).size;

    return {
      total: auditLogs.length,
      todayCount: todayLogs.length,
      securityEvents: securityEvents.length,
      criticalActions: criticalActions.length,
      uniqueUsers,
      activeUsersToday
    };
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    let filtered = [...auditLogs];

    // Filtro por tab
    if (activeTab === 'security') {
      filtered = filtered.filter(log => ACTION_LABELS[log.action]?.category === 'Seguridad');
    } else if (activeTab === 'transactions') {
      filtered = filtered.filter(log => 
        ['Ventas', 'Caja', 'Servicios'].includes(ACTION_LABELS[log.action]?.category)
      );
    } else if (activeTab === 'system') {
      filtered = filtered.filter(log => 
        ['Sistema', 'Usuarios', 'Configuración'].includes(ACTION_LABELS[log.action]?.category)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm))
      );
    }

    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.userId === selectedUser);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        switch (dateFilter) {
          case 'today':
            return logDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return logDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return logDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [auditLogs, activeTab, searchTerm, selectedAction, selectedUser, dateFilter]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const handleExport = () => {
    onExportLogs();
    toast.success('Registros de auditoría exportados');
  };

  const handleBackup = () => {
    onBackupSystem();
    toast.success('Respaldo del sistema creado');
  };

  const tabs = [
    {
      id: 'all' as TabType,
      label: 'Todos los Eventos',
      icon: History,
      count: auditLogs.length
    },
    {
      id: 'security' as TabType,
      label: 'Seguridad',
      icon: Shield,
      count: stats.securityEvents
    },
    {
      id: 'transactions' as TabType,
      label: 'Transacciones',
      icon: DollarSign,
      count: auditLogs.filter(log => 
        ['Ventas', 'Caja', 'Servicios'].includes(ACTION_LABELS[log.action]?.category)
      ).length
    },
    {
      id: 'system' as TabType,
      label: 'Sistema',
      icon: Settings,
      count: auditLogs.filter(log => 
        ['Sistema', 'Usuarios', 'Configuración'].includes(ACTION_LABELS[log.action]?.category)
      ).length
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-40">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#EC0000] to-[#D50000] flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Auditoría del Sistema</h2>
                <p className="text-sm text-gray-500">Registro de eventos y trazabilidad</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              <button
                onClick={handleBackup}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all shadow-md"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Respaldar</span>
              </button>
              <button
                onClick={onRestoreBackup}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Restaurar</span>
              </button>
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Total Eventos</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3">
              <p className="text-xs text-purple-600 font-medium mb-1">Hoy</p>
              <p className="text-2xl font-bold text-purple-900">{stats.todayCount}</p>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-600 font-medium mb-1">Seguridad</p>
              <p className="text-2xl font-bold text-red-900">{stats.securityEvents}</p>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3">
              <p className="text-xs text-yellow-600 font-medium mb-1">Críticos</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.criticalActions}</p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3">
              <p className="text-xs text-green-600 font-medium mb-1">Usuarios Totales</p>
              <p className="text-2xl font-bold text-green-900">{stats.uniqueUsers}</p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3">
              <p className="text-xs text-orange-600 font-medium mb-1">Activos Hoy</p>
              <p className="text-2xl font-bold text-orange-900">{stats.activeUsersToday}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Filtros */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por descripción, usuario, módulo o IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">Todas las acciones</option>
              {Object.entries(ACTION_LABELS).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>

            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">Todos los usuarios</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.fullName} (@{user.username})</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
          </div>
        </div>

        {/* Logs */}
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center shadow-sm">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-900 mb-2">No se encontraron registros</p>
            <p className="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">
                Mostrando {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredLogs.map((log) => {
              const actionInfo = ACTION_LABELS[log.action] || {
                label: log.action,
                color: 'from-gray-500 to-gray-600',
                category: 'Sistema',
                Icon: Activity
              };
              const Icon = actionInfo.Icon;
              const isExpanded = selectedLog?.id === log.id;
              const isCritical = log.action.includes('deleted') || log.action.includes('failed');
              const isSuccess = log.success !== false;

              return (
                <div
                  key={log.id}
                  className={`bg-white rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
                    isCritical 
                      ? 'border-red-300 bg-red-50/30' 
                      : isSuccess 
                      ? 'border-gray-200 hover:border-gray-300' 
                      : 'border-yellow-300 bg-yellow-50/30'
                  }`}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setSelectedLog(isExpanded ? null : log)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${actionInfo.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${actionInfo.color} text-white`}>
                              {actionInfo.label}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              {actionInfo.category}
                            </span>
                            {isCritical && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Crítico
                              </span>
                            )}
                            {!isSuccess && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Fallido
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-900 font-medium mb-2">{log.description}</p>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.userName}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">
                            {log.userRole}
                          </span>
                          {log.ipAddress && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-mono font-medium">
                              IP: {log.ipAddress}
                            </span>
                          )}
                          <button className="ml-auto text-[#EC0000] font-bold flex items-center gap-1 hover:underline">
                            <Eye className="w-3 h-3" />
                            {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && log.details && (
                      <div className="mt-3 pt-3 border-t-2 border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Detalles Técnicos
                          </p>
                          <span className="text-xs text-gray-500">ID: {log.id}</span>
                        </div>
                        <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto font-mono">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
