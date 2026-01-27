import { useState } from 'react';
import { Search, Package, CheckCircle, X, Save, AlertTriangle, Grid3x3, List, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductReceipt, ReceivedItem, PurchaseOrder, Product } from '@/types/pos';

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
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
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
    // Inicializar items con cantidad recibida = 0
    const items: ReceivedItem[] = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      orderedQuantity: item.quantity,
      receivedQuantity: 0,
      isComplete: false,
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

  const handleSaveReceipt = () => {
    if (!selectedOrder) return;

    const hasReceivedItems = receivedItems.some(item => item.receivedQuantity > 0);
    if (!hasReceivedItems) {
      toast.error('Debes recibir al menos un producto');
      return;
    }

    const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;

    // Crear el recibo
    const newReceipt: ProductReceipt = {
      id: Math.random().toString(36).substr(2, 9),
      receiptNumber,
      purchaseOrderId: selectedOrder.id,
      purchaseOrderNumber: selectedOrder.orderNumber,
      supplierId: selectedOrder.supplierId,
      supplierName: selectedOrder.supplierName,
      items: receivedItems,
      receivedAt: new Date(),
      receivedBy: 'Usuario',
      notes,
    };

    onUpdateReceipts([...receipts, newReceipt]);

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
    const updatedOrders = purchaseOrders.map(order =>
      order.id === selectedOrder.id
        ? { ...order, status: 'received' as const, receivedAt: new Date() }
        : order
    );
    onUpdatePurchaseOrders(updatedOrders);

    toast.success(`Recepción ${receiptNumber} registrada. Inventario actualizado.`);
    handleCloseModal();
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
                    Recibir Mercancía
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

      {/* Modal de recibir mercancía */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between rounded-t-2xl sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-bold">Recibir Mercancía</h3>
                <p className="text-green-100 mt-1">Orden: {selectedOrder.orderNumber} - {selectedOrder.supplierName}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2.5 hover:bg-white/15 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
              {/* Botón recibir todo */}
              <button
                onClick={handleReceiveAll}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95"
              >
                <CheckCircle className="w-5 h-5" />
                Marcar Todo Como Recibido
              </button>

              {/* Items */}
              <div className="space-y-2">
                {receivedItems.map(item => (
                  <div
                    key={item.productId}
                    className={`bg-white rounded-lg p-4 border-2 transition-all ${
                      item.isComplete
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-600">
                          Ordenado: <span className="font-bold">{item.orderedQuantity}</span>
                        </p>
                      </div>
                      {item.isComplete && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Completo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Cantidad Recibida
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.orderedQuantity}
                          value={item.receivedQuantity}
                          onChange={(e) => handleUpdateReceivedQuantity(item.productId, parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-center font-bold text-lg"
                        />
                      </div>
                      <button
                        onClick={() => handleMarkComplete(item.productId)}
                        className="mt-6 flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Completo
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 font-bold uppercase mb-1">Total Ordenado</div>
                    <div className="text-2xl font-bold text-gray-900">{getTotalOrdered()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-600 font-bold uppercase mb-1">Total Recibido</div>
                    <div className="text-2xl font-bold text-green-600">{getTotalReceived()}</div>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none font-medium resize-none"
                  placeholder="Observaciones sobre la recepción..."
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
                  onClick={handleSaveReceipt}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  Guardar Recepción
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
