import { useState } from 'react';
import { Search, Package, CheckCircle, X, Save, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { purchaseService } from '@/services';
import type { ProductReceipt, ReceiptItem, PurchaseOrder, Product } from '@/types/pos';

interface ReceiptsTabProps {
  receipts: ProductReceipt[];
  onUpdateReceipts: (receipts: ProductReceipt[]) => void;
  purchaseOrders: PurchaseOrder[];
  onUpdatePurchaseOrders: (orders: PurchaseOrder[]) => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export function ReceiptsTab({ 
  receipts, 
  onUpdateReceipts,
  purchaseOrders,
  onUpdatePurchaseOrders,
  products,
  onUpdateProducts
}: ReceiptsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
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

    // Crear el recibo con los nombres de campos correctos para el backend
    // NOTA: El backend asigna automáticamente receivedBy (ID) y receivedByName (nombre)
    // desde req.userId y req.user.fullName
    const newReceipt = {
      purchaseOrderId: selectedOrder.id,
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

  return (
    <div className="flex-1 flex flex-row h-full overflow-hidden">
      {/* ÁREA PRINCIPAL - Órdenes Pendientes (4/5 de la pantalla) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header del área principal */}
        <div className="p-4 bg-white border-b border-gray-200">
          {/* Alerta de órdenes pendientes */}
          {pendingOrders.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-bold text-blue-900">
                  {pendingOrders.length} orden{pendingOrders.length !== 1 ? 'es' : ''} pendiente{pendingOrders.length !== 1 ? 's' : ''} de recibir
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content - Órdenes pendientes */}
        <div className="flex-1 overflow-auto p-4">
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <CheckCircle className="w-20 h-20 text-green-300 mb-4" />
              <p className="text-xl font-bold text-gray-900 mb-2">¡Todo recibido!</p>
              <p className="text-gray-500">No hay órdenes pendientes de recibir</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Órdenes Pendientes de Recibir</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pendingOrders.map(order => {
                  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  
                  return (
                    <div
                      key={order.id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-blue-300"
                    >
                      {/* Header con gradiente azul */}
                      <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-5 overflow-hidden">
                        {/* Patrón decorativo */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                        </div>
                        
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl flex-shrink-0 group-hover:bg-white/30 transition-colors">
                              <Package className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-lg truncate drop-shadow-sm">{order.supplierName}</h3>
                              <p className="text-sm text-white/90 truncate mt-0.5">{order.orderNumber}</p>
                            </div>
                          </div>
                          
                          {/* Badge de items */}
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm bg-white/90 text-blue-700">
                              {order.items.length} items
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        {/* Unidades totales */}
                        <div className="mb-4">
                          <div className="flex items-center gap-3 bg-green-50/50 rounded-xl p-3 border border-green-100">
                            <div className="flex-shrink-0 w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-green-600 font-bold uppercase mb-0.5">Total a recibir</p>
                              <p className="text-lg text-gray-900 font-bold">{totalUnits} unidades</p>
                            </div>
                          </div>
                        </div>

                        {/* Botón de acción */}
                        <button
                          onClick={() => handleOpenModal(order)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-green-500/30"
                        >
                          <Package className="w-5 h-5" />
                          Capturar Mercancía
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR DERECHA - Historial de Recepciones (1/5 de la pantalla) */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-l border-gray-200 bg-gray-50">
        {/* Header del sidebar */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-[#8600C0]" />
            <h3 className="font-bold text-gray-900">Historial</h3>
          </div>
          <div className="text-xs text-gray-600 font-medium mb-3">
            {filteredReceipts.length} de {receipts.length} recepciones
          </div>
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar recepción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8600C0] focus:border-[#8600C0] outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Lista de recepciones */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Package className="w-16 h-16 text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-900 mb-1">Sin recepciones</p>
              <p className="text-xs text-gray-500">El historial aparecerá aquí</p>
            </div>
          ) : (
            filteredReceipts.map(receipt => {
              const totalItems = receipt.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
              const completeItems = receipt.items.filter(item => item.isComplete).length;
              const isFullyComplete = completeItems === receipt.items.length;

              return (
                <div
                  key={receipt.id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-[#8600C0]/30 cursor-pointer"
                >
                  {/* Header con gradiente morado */}
                  <div className="relative bg-gradient-to-br from-[#9D00E8] to-[#8600C0] p-3 overflow-hidden">
                    {/* Patrón decorativo */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-12 translate-x-12"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-8 -translate-x-8"></div>
                    </div>
                    
                    <div className="relative flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg flex-shrink-0 group-hover:bg-white/30 transition-colors">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-white truncate drop-shadow-sm">{receipt.supplierName}</h4>
                          <p className="text-xs text-white/90 truncate mt-0.5">{receipt.receiptNumber}</p>
                        </div>
                      </div>
                      
                      {/* Badge de estado */}
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                          isFullyComplete 
                            ? 'bg-green-500/90 text-white' 
                            : 'bg-yellow-500/90 text-white'
                        }`}>
                          {isFullyComplete ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              100%
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              Parcial
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    {/* Fecha */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 mb-3 border border-gray-100">
                      <div className="flex-shrink-0 w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-600 font-bold uppercase mb-0.5">Recibido</p>
                        <p className="text-xs text-gray-900 font-medium truncate">{formatDate(receipt.receivedAt)}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-blue-50/50 rounded-lg px-2 py-1.5 border border-blue-100">
                        <div className="text-[10px] text-blue-600 uppercase font-bold mb-0.5">Items</div>
                        <div className="text-lg font-bold text-blue-900">{totalItems}</div>
                      </div>
                      <div className="bg-green-50/50 rounded-lg px-2 py-1.5 border border-green-100">
                        <div className="text-[10px] text-green-600 uppercase font-bold mb-0.5">Completo</div>
                        <div className="text-lg font-bold text-green-900">{completeItems}/{receipt.items.length}</div>
                      </div>
                    </div>

                    {/* Recibido por */}
                    <div className="pt-2 border-t-2 border-gray-100">
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Recibido por</div>
                      <div className="text-xs font-bold text-gray-900 truncate">{receipt.receivedBy}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
