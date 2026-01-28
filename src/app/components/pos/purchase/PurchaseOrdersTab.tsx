import { useState } from 'react';
import { Search, Plus, Eye, Send, X, Save, AlertTriangle, CheckCircle, XCircle, Clock, Grid3x3, List, Package } from 'lucide-react';
import { toast } from 'sonner';
import { purchaseService } from '@/services';
import type { PurchaseOrder, PurchaseOrderItem, Supplier, Product, PurchaseOrderStatus } from '@/types/pos';

interface PurchaseOrdersTabProps {
  purchaseOrders: PurchaseOrder[];
  onUpdatePurchaseOrders: (orders: PurchaseOrder[]) => void;
  suppliers: Supplier[];
  products: Product[];
}

type ViewMode = 'grid' | 'table';

export function PurchaseOrdersTab({ 
  purchaseOrders, 
  onUpdatePurchaseOrders, 
  suppliers,
  products 
}: PurchaseOrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showModal, setShowModal] = useState(false);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [notes, setNotes] = useState('');

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sugerir productos con stock bajo
  const getLowStockProducts = () => {
    return products.filter(p => {
      const reorderPoint = p.reorderPoint || p.minStock || 0;
      return p.stock <= reorderPoint;
    });
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setSelectedSupplier('');
    setOrderItems([]);
    setNotes('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setViewOrder(null);
  };

  const handleViewOrder = (order: PurchaseOrder) => {
    setViewOrder(order);
  };

  const handleAddProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = orderItems.find(item => item.productId === productId);
    if (existingItem) {
      toast.error('Este producto ya está en la orden');
      return;
    }

    const newItem: PurchaseOrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unit: 'pieza', // Unidad por defecto
      unitEquivalence: undefined,
      equivalenceUnit: undefined,
    };

    setOrderItems([...orderItems, newItem]);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setOrderItems(orderItems.map(item => 
      item.productId === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const handleUpdateUnit = (productId: string, unit: string) => {
    setOrderItems(orderItems.map(item => 
      item.productId === productId
        ? { ...item, unit }
        : item
    ));
  };

  const handleUpdateEquivalence = (productId: string, equivalence: number, equivalenceUnit: string) => {
    setOrderItems(orderItems.map(item => 
      item.productId === productId
        ? { ...item, unitEquivalence: equivalence, equivalenceUnit }
        : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const getTotalItems = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedSupplier) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplier);
    if (!supplier) return;

    const orderNumber = `OC-${Date.now().toString().slice(-8)}`;

    const newOrder: PurchaseOrder = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: 'draft',
      items: orderItems,
      notes,
      createdAt: new Date(),
      createdBy: 'Usuario',
    };

    try {
      const savedOrder = await purchaseService.createPurchaseOrder(newOrder);
      onUpdatePurchaseOrders([...purchaseOrders, savedOrder]);
      toast.success(`Orden de compra ${orderNumber} creada`);
      handleCloseModal();
    } catch (error) {
      console.error('Error al crear orden:', error);
      toast.error('Error al crear la orden de compra');
    }
  };

  const handleSendOrder = async (order: PurchaseOrder) => {
    try {
      console.log('📤 Intentando enviar orden:', order.orderNumber);
      console.log('🔑 Token existe:', !!localStorage.getItem('token'));
      console.log('👤 Usuario guardado:', localStorage.getItem('user'));
      
      await purchaseService.updatePurchaseOrderStatus(order.id, 'sent');
      
      const updated = purchaseOrders.map(o =>
        o.id === order.id
          ? { ...o, status: 'sent' as PurchaseOrderStatus, sentAt: new Date() }
          : o
      );
      onUpdatePurchaseOrders(updated);
      toast.success(`Orden ${order.orderNumber} enviada al proveedor`);
    } catch (error: any) {
      console.error('Error al enviar orden:', error);
      if (error.message?.includes('permisos')) {
        toast.error('No tienes permisos para enviar órdenes. Contacta al administrador.');
      } else {
        toast.error(error.message || 'Error al enviar la orden');
      }
    }
  };

  const handleCancelOrder = async (order: PurchaseOrder) => {
    if (window.confirm(`¿Cancelar la orden ${order.orderNumber}?`)) {
      try {
        await purchaseService.updatePurchaseOrderStatus(order.id, 'cancelled');
        
        const updated = purchaseOrders.map(o =>
          o.id === order.id
            ? { ...o, status: 'cancelled' as PurchaseOrderStatus }
            : o
        );
        onUpdatePurchaseOrders(updated);
        toast.success(`Orden ${order.orderNumber} cancelada`);
      } catch (error: any) {
        console.error('Error al cancelar orden:', error);
        if (error.message?.includes('permisos')) {
          toast.error('No tienes permisos para cancelar órdenes. Contacta al administrador.');
        } else {
          toast.error(error.message || 'Error al cancelar la orden');
        }
      }
    }
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    const badges = {
      draft: { label: 'Borrador', bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
      sent: { label: 'Enviada', bg: 'bg-blue-100', text: 'text-blue-700', icon: Send },
      received: { label: 'Recibida', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      cancelled: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Sin fecha';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Fecha inválida';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(dateObj);
  };

  const lowStockProducts = getLowStockProducts();
  const supplierProducts = selectedSupplier 
    ? products.filter(p => p.supplierId === selectedSupplier)
    : [];

  // Componente de Card de Orden
  const OrderCard = ({ order }: { order: PurchaseOrder }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 active:scale-[0.98]">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{order.orderNumber}</h3>
            <p className="text-sm text-gray-600 mt-1">{order.supplierName}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Fecha */}
        <div className="text-sm text-gray-600">
          <span className="font-bold">Creada:</span> {formatDate(order.createdAt)}
        </div>

        {/* Items */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-bold uppercase mb-1">Productos</div>
          <div className="text-2xl font-bold text-blue-900">{order.items.length}</div>
          <div className="text-xs text-blue-600">{order.items.reduce((sum, item) => sum + item.quantity, 0)} unidades totales</div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => handleViewOrder(order)}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all active:scale-95"
          >
            <Eye className="w-4 h-4" />
            Ver
          </button>
          {order.status === 'draft' && (
            <button
              onClick={() => handleSendOrder(order)}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          )}
          {(order.status === 'draft' || order.status === 'sent') && (
            <button
              onClick={() => handleCancelOrder(order)}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b border-gray-200">
        {/* Alerta de Stock Bajo */}
        {lowStockProducts.length > 0 && (
          <div className="mb-3 bg-orange-50 border-l-4 border-orange-400 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <p className="text-sm font-bold text-orange-900">
                {lowStockProducts.length} producto{lowStockProducts.length !== 1 ? 's' : ''} con stock bajo
              </p>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-gray-600 font-medium">
            {filteredOrders.length} de {purchaseOrders.length} órdenes
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle vista - Solo desktop */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#EC0000] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#EC0000] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Orden</span>
            </button>
          </div>
        </div>

        {/* Filtros compactos */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar orden o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | 'all')}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white min-w-[140px]"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="received">Recibida</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-4">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="w-20 h-20 text-gray-300 mb-4" />
            <p className="text-xl font-bold text-gray-900 mb-2">No hay órdenes de compra</p>
            <p className="text-gray-500 mb-6">Crea una nueva orden para comenzar</p>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30"
            >
              <Plus className="w-5 h-5" />
              Nueva Orden
            </button>
          </div>
        ) : (
          <>
            {/* Vista de Cards - Móvil/Tablet o seleccionada en Desktop */}
            <div className={`${viewMode === 'table' ? 'hidden lg:hidden' : 'block'} ${viewMode === 'grid' && 'lg:block'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>

            {/* Vista de Tabla - Solo Desktop cuando está seleccionada */}
            {viewMode === 'table' && (
              <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Número</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Proveedor</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Estado</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Items</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Unidades</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Fecha</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">{order.orderNumber}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{order.supplierName}</td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-gray-900">{order.items.length}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-gray-900">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewOrder(order)}
                                className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {order.status === 'draft' && (
                                <button
                                  onClick={() => handleSendOrder(order)}
                                  className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                                  title="Enviar"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                              {(order.status === 'draft' || order.status === 'sent') && (
                                <button
                                  onClick={() => handleCancelOrder(order)}
                                  className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                  title="Cancelar"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de crear orden */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between rounded-t-2xl sticky top-0 z-10">
              <h3 className="text-2xl font-bold">Nueva Orden de Compra</h3>
              <button
                onClick={handleCloseModal}
                className="p-2.5 hover:bg-white/15 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
              {/* Seleccionar proveedor */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Proveedor *</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-medium"
                >
                  <option value="">Selecciona un proveedor</option>
                  {suppliers.filter(s => s.status === 'active').map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>

              {/* Productos */}
              {selectedSupplier && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Agregar Productos</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProduct(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-medium"
                  >
                    <option value="">Selecciona un producto</option>
                    {supplierProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - Stock: {product.stock}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Items de la orden */}
              {orderItems.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-3">Productos en la Orden</h4>
                  <div className="space-y-3">
                    {orderItems.map(item => (
                      <div key={item.productId} className="bg-white rounded-lg p-4 space-y-3">
                        {/* Nombre del producto */}
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-gray-900 text-lg">{item.productName}</div>
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Cantidad y Unidad */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Cantidad</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none text-center font-bold text-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Unidad</label>
                            <select
                              value={item.unit}
                              onChange={(e) => handleUpdateUnit(item.productId, e.target.value)}
                              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-bold"
                            >
                              <option value="pieza">Pieza(s)</option>
                              <option value="caja">Caja(s)</option>
                              <option value="paquete">Paquete(s)</option>
                              <option value="botella">Botella(s)</option>
                              <option value="litro">Litro(s)</option>
                              <option value="kilogramo">Kilogramo(s)</option>
                              <option value="costal">Costal(es)</option>
                              <option value="garrafon">Garrafón(es)</option>
                              <option value="display">Display(s)</option>
                            </select>
                          </div>
                        </div>

                        {/* Equivalencia opcional */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <label className="block text-xs font-bold text-blue-700 mb-2">
                            Equivalencia (Opcional)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-blue-900">1 {item.unit} =</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="24"
                              value={item.unitEquivalence || ''}
                              onChange={(e) => handleUpdateEquivalence(
                                item.productId, 
                                parseInt(e.target.value) || 0,
                                item.equivalenceUnit || 'pieza'
                              )}
                              className="w-20 px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center font-bold"
                            />
                            <select
                              value={item.equivalenceUnit || 'pieza'}
                              onChange={(e) => handleUpdateEquivalence(
                                item.productId,
                                item.unitEquivalence || 0,
                                e.target.value
                              )}
                              className="flex-1 px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-bold text-sm"
                            >
                              <option value="pieza">pieza(s)</option>
                              <option value="botella">botella(s)</option>
                              <option value="unidad">unidad(es)</option>
                              <option value="lata">lata(s)</option>
                            </select>
                          </div>
                          {item.unitEquivalence && item.unitEquivalence > 0 && (
                            <div className="mt-2 text-xs font-bold text-blue-600">
                              Total: {item.quantity} {item.unit}(s) = {item.quantity * item.unitEquivalence} {item.equivalenceUnit}(s)
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen */}
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">Total de productos:</span>
                      <span className="font-bold text-2xl text-[#EC0000]">{orderItems.length}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-gray-700">Total de unidades:</span>
                      <span className="font-bold text-2xl text-[#EC0000]">{getTotalItems()}</span>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-bold text-blue-700 text-center">
                        💡 Los costos se registrarán al recibir la mercancía
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-medium resize-none"
                  placeholder="Notas adicionales sobre la orden..."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateOrder}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  Crear Orden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ver orden */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-2xl font-bold">{viewOrder.orderNumber}</h3>
                <p className="text-red-100 mt-1">{viewOrder.supplierName}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2.5 hover:bg-white/15 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Estado y fecha */}
              <div className="flex items-center justify-between">
                {getStatusBadge(viewOrder.status)}
                <div className="text-sm text-gray-600">
                  <span className="font-bold">Creada:</span> {formatDate(viewOrder.createdAt)}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Productos</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {viewOrder.items.map(item => (
                    <div key={item.productId} className="bg-white rounded-lg p-4">
                      <div className="font-bold text-gray-900 text-lg mb-3">{item.productName}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-xs text-blue-600 font-bold uppercase mb-1">Cantidad</div>
                          <div className="text-2xl font-bold text-blue-900">{item.quantity}</div>
                          <div className="text-xs text-blue-600">{item.unit}</div>
                        </div>
                        {item.unitEquivalence && item.unitEquivalence > 0 && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-xs text-green-600 font-bold uppercase mb-1">Equivalencia</div>
                            <div className="text-xl font-bold text-green-900">
                              {item.quantity * item.unitEquivalence}
                            </div>
                            <div className="text-xs text-green-600">{item.equivalenceUnit}(s)</div>
                          </div>
                        )}
                      </div>
                      {item.unitEquivalence && item.unitEquivalence > 0 && (
                        <div className="mt-3 text-sm text-gray-600 font-medium bg-gray-50 rounded-lg p-2 text-center">
                          1 {item.unit} = {item.unitEquivalence} {item.equivalenceUnit}(s)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 font-bold uppercase mb-1">Productos</div>
                    <div className="text-3xl font-bold text-gray-900">{viewOrder.items.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 font-bold uppercase mb-1">Unidades Totales</div>
                    <div className="text-3xl font-bold text-[#EC0000]">
                      {viewOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {viewOrder.notes && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Notas</h4>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{viewOrder.notes}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3">
                {viewOrder.status === 'draft' && (
                  <button
                    onClick={() => {
                      handleSendOrder(viewOrder);
                      handleCloseModal();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                    Enviar al Proveedor
                  </button>
                )}
                {(viewOrder.status === 'draft' || viewOrder.status === 'sent') && (
                  <button
                    onClick={() => {
                      handleCancelOrder(viewOrder);
                      handleCloseModal();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancelar Orden
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
