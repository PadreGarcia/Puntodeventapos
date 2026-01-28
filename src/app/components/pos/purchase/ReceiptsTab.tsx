import { useState } from 'react';
import { Search, Package, CheckCircle, X, Save, AlertTriangle, Grid3x3, List, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { purchaseService } from '@/services';
import { apiClient } from '@/lib/apiClient';
import type { ProductReceipt, ReceiptItem, PurchaseOrder, Product } from '@/types/pos';

interface ReceiptsTabProps {
  receipts: ProductReceipt[];
  onUpdateReceipts: (receipts: ProductReceipt[]) => void;
  purchaseOrders: PurchaseOrder[];
  onUpdatePurchaseOrders: (orders: PurchaseOrder[]) => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

type ViewMode = 'grid' | 'table';

export function ReceiptsTab({ 
  receipts, 
  onUpdateReceipts,
  purchaseOrders,
  onUpdatePurchaseOrders,
  products,
  onUpdateProducts
}: ReceiptsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [receivedItems, setReceivedItems] = useState<ReceiptItem[]>([]);
  const [notes, setNotes] = useState('');

  const filteredReceipts = receipts.filter(receipt =>
    receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Órdenes que han sido enviadas pero no recibidas
  const pendingOrders = purchaseOrders.filter(order => order.status === 'sent');

  const handleOpenModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    // Inicializar items con cantidad recibida = 0 y precio unitario desde la orden
    const items: ReceiptItem[] = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      orderedQuantity: item.quantity,
      receivedQuantity: 0,
      isComplete: false,
      unitCost: item.unitPrice || 0,
    }));
    setReceivedItems(items);
    setNotes('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleUpdateReceivedQuantity = (productId: string, quantity: number) => {
    setReceivedItems(receivedItems.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, quantity);
        return {
          ...item,
          receivedQuantity: newQuantity,
          isComplete: newQuantity === item.orderedQuantity,
        };
      }
      return item;
    }));
  };

  const handleUpdateUnitCost = (productId: string, cost: number) => {
    setReceivedItems(receivedItems.map(item =>
      item.productId === productId
        ? { ...item, unitCost: Math.max(0, cost) }
        : item
    ));
  };

  const handleMarkComplete = (productId: string) => {
    setReceivedItems(receivedItems.map(item =>
      item.productId === productId
        ? { ...item, receivedQuantity: item.orderedQuantity, isComplete: true }
        : item
    ));
  };

  const handleReceiveAll = () => {
    setReceivedItems(receivedItems.map(item => ({
      ...item,
      receivedQuantity: item.orderedQuantity,
      isComplete: true,
    })));
  };

  const handleSaveReceipt = async () => {
    if (!selectedOrder) return;

    const hasReceivedItems = receivedItems.some(item => item.receivedQuantity > 0);
    if (!hasReceivedItems) {
      toast.error('Debes recibir al menos un producto');
      return;
    }

    const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;

    // Obtener información del usuario actual
    const currentUser = apiClient.getStoredUser();
    const receivedByName = currentUser?.name || currentUser?.username || 'Usuario';

    // Crear el recibo con los nombres de campos correctos para el backend
    const newReceipt = {
      receiptNumber,
      purchaseOrderId: selectedOrder.id,
      purchaseOrderNumber: selectedOrder.orderNumber,
      supplierId: selectedOrder.supplierId,
      supplierName: selectedOrder.supplierName,
      items: receivedItems.map(item => {
        const unitCost = item.unitCost || 0;
        const total = unitCost * item.receivedQuantity;
        return {
          productId: item.productId,
          productName: item.productName,
          quantityOrdered: item.orderedQuantity,      // Backend usa quantityOrdered
          quantityReceived: item.receivedQuantity,    // Backend usa quantityReceived
          unitCost: unitCost,
          total: total,                               // Campo calculado requerido
          isComplete: item.isComplete
        };
      }),
      receivedAt: new Date().toISOString(),
      receivedBy: receivedByName,                     // Nombre del usuario actual
      notes: notes || '',
    };

    try {
      // Guardar recibo en backend
      const savedReceipt = await purchaseService.createReceipt(newReceipt);
      onUpdateReceipts([...receipts, savedReceipt]);

      // Actualizar stock de productos
      const updatedProducts = products.map(product => {
        const receivedItem = receivedItems.find(item => item.productId === product.id);
        if (receivedItem && receivedItem.receivedQuantity > 0) {
          return {
            ...product,
            stock: product.stock + receivedItem.receivedQuantity,
          };
        }
        return product;
      });
      onUpdateProducts(updatedProducts);

      // Marcar la orden como recibida
      await purchaseService.updatePurchaseOrderStatus(selectedOrder.id, 'received');
      
      const updatedOrders = purchaseOrders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, status: 'received' as const, receivedAt: new Date() }
          : order
      );
      onUpdatePurchaseOrders(updatedOrders);

      toast.success(`Recepción ${receiptNumber} registrada. Inventario actualizado.`);
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar recepción:', error);
      toast.error('Error al guardar la recepción');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTotalReceived = () => {
    return receivedItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
  };

  const getTotalOrdered = () => {
    return receivedItems.reduce((sum, item) => sum + item.orderedQuantity, 0);
  };

  // Componente de Card de Recibo
  const ReceiptCard = ({ receipt }: { receipt: ProductReceipt }) => {
    const totalItems = receipt.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
    const completeItems = receipt.items.filter(item => item.isComplete).length;

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 border-b border-green-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{receipt.receiptNumber}</h3>
              <p className="text-sm text-gray-600 mt-1">{receipt.supplierName}</p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border-2 border-green-300">
              <CheckCircle className="w-3 h-3" />
              Recibida
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Orden de compra */}
          <div className="text-sm">
            <span className="text-gray-600">Orden:</span>
            <span className="font-bold text-gray-900 ml-2">{receipt.purchaseOrderNumber}</span>
          </div>

          {/* Fecha */}
          <div className="text-sm text-gray-600">
            <span className="font-bold">Recibido:</span> {formatDate(receipt.receivedAt)}
          </div>

          {/* Items */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-bold uppercase mb-1">Total Items</div>
              <div className="text-2xl font-bold text-blue-900">{totalItems}</div>
              <div className="text-xs text-blue-600">productos</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600 font-bold uppercase mb-1">Completos</div>
              <div className="text-2xl font-bold text-green-900">{completeItems}/{receipt.items.length}</div>
              <div className="text-xs text-green-600">artículos</div>
            </div>
          </div>

          {/* Recibido por */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-bold uppercase mb-1">Recibido por</div>
            <div className="text-sm font-bold text-gray-900">{receipt.receivedBy}</div>
          </div>

          {/* Notas */}
          {receipt.notes && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="text-xs text-yellow-700 font-bold uppercase mb-1">Notas</div>
              <div className="text-sm text-yellow-900">{receipt.notes}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b border-gray-200">
        {/* Alerta de órdenes pendientes */}
        {pendingOrders.length > 0 && (
          <div className="mb-3 bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-bold text-blue-900">
                {pendingOrders.length} orden{pendingOrders.length !== 1 ? 'es' : ''} pendiente{pendingOrders.length !== 1 ? 's' : ''} de recibir
              </p>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-gray-600 font-medium">
            {filteredReceipts.length} de {receipts.length} recepciones
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
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar recepción, orden o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Órdenes pendientes de recibir */}
        {pendingOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Órdenes Pendientes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pendingOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{order.orderNumber}</h4>
                      <p className="text-sm text-gray-600">{order.supplierName}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                      {order.items.length} items
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenModal(order)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold transition-all active:scale-95"
                  >
                    <Package className="w-4 h-4" />
                    Capturar mercancía
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recepciones */}
        {filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="w-20 h-20 text-gray-300 mb-4" />
            <p className="text-xl font-bold text-gray-900 mb-2">No hay recepciones registradas</p>
            <p className="text-gray-500">Las recepciones de mercancía aparecerán aquí</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Historial de Recepciones</h3>

            {/* Vista de Cards - Móvil/Tablet o seleccionada en Desktop */}
            <div className={`${viewMode === 'table' ? 'hidden lg:hidden' : 'block'} ${viewMode === 'grid' && 'lg:block'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredReceipts.map(receipt => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
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
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Recibo</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Orden</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Proveedor</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Items</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Completos</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Fecha</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Recibido por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredReceipts.map(receipt => {
                        const totalItems = receipt.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
                        const completeItems = receipt.items.filter(item => item.isComplete).length;

                        return (
                          <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900">{receipt.receiptNumber}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{receipt.purchaseOrderNumber}</td>
                            <td className="px-6 py-4 text-gray-700">{receipt.supplierName}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-bold text-blue-600">{totalItems}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-bold text-green-600">{completeItems}/{receipt.items.length}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {formatDate(receipt.receivedAt)}
                            </td>
                            <td className="px-6 py-4 text-gray-700">{receipt.receivedBy}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de capturar mercancía */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-2 sm:my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-6 flex items-center justify-between rounded-t-2xl sticky top-0 z-10">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold">Capturar mercancía</h3>
                <p className="text-green-100 mt-0.5 sm:mt-1 text-xs sm:text-sm">
                  {selectedOrder.orderNumber} - {selectedOrder.supplierName}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 sm:p-2.5 hover:bg-white/15 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-3 sm:p-6 space-y-3 max-h-[calc(100vh-140px)] sm:max-h-[calc(90vh-100px)] overflow-y-auto">
              {/* Tabla compacta */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header - solo desktop */}
                <div className="hidden md:grid md:grid-cols-[1fr_80px_140px_100px_100px] gap-2 bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase sticky top-0">
                  <div>Producto</div>
                  <div className="text-center">Ord.</div>
                  <div className="text-center">Recibido</div>
                  <div className="text-center">Precio C/U</div>
                  <div className="text-right">Total</div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {receivedItems.map(item => {
                    const totalCost = (item.unitCost || 0) * item.receivedQuantity;
                    
                    return (
                      <div key={item.productId}>
                        {/* Móvil - diseño compacto */}
                        <div className="md:hidden p-2.5 space-y-2">
                          {/* Nombre producto */}
                          <div className="font-semibold text-gray-900 text-sm">{item.productName}</div>
                          
                          {/* Grid 2x2 */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* Ordenado */}
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase mb-1">Ordenado</div>
                              <div className="bg-gray-50 rounded px-2 py-1.5 text-center font-bold text-sm text-gray-700">
                                {item.orderedQuantity}
                              </div>
                            </div>

                            {/* Recibido */}
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase mb-1">Recibido</div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleUpdateReceivedQuantity(item.productId, Math.max(0, item.receivedQuantity - 1))}
                                  className="w-7 h-7 bg-gray-100 hover:bg-[#EC0000] hover:text-white rounded font-bold transition-colors"
                                >
                                  -
                                </button>
                                <div className="flex-1 bg-gray-50 rounded flex items-center justify-center font-bold text-sm">
                                  {item.receivedQuantity}
                                </div>
                                <button
                                  onClick={() => handleUpdateReceivedQuantity(item.productId, item.receivedQuantity + 1)}
                                  className="w-7 h-7 bg-gray-100 hover:bg-[#EC0000] hover:text-white rounded font-bold transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Precio C/U */}
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase mb-1">Precio C/U</div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={item.unitCost || 0}
                                  onChange={(e) => handleUpdateUnitCost(item.productId, parseFloat(e.target.value) || 0)}
                                  className="w-full h-7 pl-5 pr-2 bg-gray-50 border border-gray-200 rounded text-right text-sm font-semibold focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000] outline-none"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            {/* Total */}
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase mb-1">Total</div>
                              <div className="bg-gray-50 rounded px-2 py-1.5 text-right font-bold text-sm text-gray-900">
                                ${totalCost.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop - diseño tabla */}
                        <div className="hidden md:grid md:grid-cols-[1fr_80px_140px_100px_100px] gap-2 items-center px-3 py-2 hover:bg-gray-50">
                          {/* Producto */}
                          <div className="font-semibold text-gray-900 text-sm truncate" title={item.productName}>
                            {item.productName}
                          </div>

                          {/* Ordenado */}
                          <div className="text-center font-bold text-sm text-gray-700">
                            {item.orderedQuantity}
                          </div>

                          {/* Recibido */}
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleUpdateReceivedQuantity(item.productId, Math.max(0, item.receivedQuantity - 1))}
                              className="w-7 h-7 bg-gray-100 hover:bg-[#EC0000] hover:text-white rounded font-bold transition-colors"
                            >
                              -
                            </button>
                            <div className="w-12 bg-gray-50 rounded flex items-center justify-center font-bold text-sm">
                              {item.receivedQuantity}
                            </div>
                            <button
                              onClick={() => handleUpdateReceivedQuantity(item.productId, item.receivedQuantity + 1)}
                              className="w-7 h-7 bg-gray-100 hover:bg-[#EC0000] hover:text-white rounded font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>

                          {/* Precio C/U */}
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.unitCost || 0}
                              onChange={(e) => handleUpdateUnitCost(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-full h-8 pl-6 pr-2 bg-gray-50 border border-gray-200 rounded text-right font-semibold text-sm focus:border-[#EC0000] focus:ring-1 focus:ring-[#EC0000] outline-none"
                              placeholder="0.00"
                            />
                          </div>

                          {/* Total */}
                          <div className="text-right font-bold text-sm text-gray-900">
                            ${totalCost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total General */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="text-gray-700 font-bold text-sm sm:text-base">
                  Total Mercancía
                </div>
                <div className="text-gray-900 font-bold text-xl sm:text-2xl">
                  ${receivedItems.reduce((sum, item) => sum + ((item.unitCost || 0) * item.receivedQuantity), 0).toFixed(2)}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 sm:gap-3 pt-2 sticky bottom-0 bg-white pb-2">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 bg-gray-100 active:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveReceipt}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-green-600 to-green-700 active:from-green-700 active:to-green-800 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all active:scale-95 text-sm sm:text-base"
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
