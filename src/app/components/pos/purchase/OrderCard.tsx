import { Eye, Send, XCircle, Clock, Package, FileText } from 'lucide-react';
import type { PurchaseOrder } from '@/types/pos';

interface OrderCardProps {
  order: PurchaseOrder;
  onViewOrder: (order: PurchaseOrder) => void;
  onSendOrder: (order: PurchaseOrder) => void;
  onCancelOrder: (order: PurchaseOrder) => void;
  formatDate: (date: Date | string) => string;
  getStatusBadge: (status: string) => JSX.Element;
}

export function OrderCard({ 
  order, 
  onViewOrder, 
  onSendOrder, 
  onCancelOrder,
  formatDate,
  getStatusBadge 
}: OrderCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-[#EC0000] hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header con gradiente corporativo */}
      <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] p-5 relative overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        
        <div className="relative inline-flex items-start justify-between gap-3 w-full">
          <div className="inline-flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl flex-shrink-0 group-hover:bg-white/30 transition-colors">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg truncate drop-shadow-sm">{order.supplierName}</h3>
              <p className="text-sm text-white/90 truncate mt-0.5">{order.orderNumber}</p>
            </div>
          </div>
          
          {/* Badge de estado */}
          <div className="flex-shrink-0">
            {getStatusBadge(order.status)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Info de la orden */}
        <div className="space-y-3 mb-4">
          {/* Fecha - Línea completa */}
          <div className="inline-flex items-center gap-3 bg-blue-50/50 rounded-xl p-3 border border-blue-100 w-full">
            <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-lg inline-flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600 font-bold uppercase mb-0.5">Fecha de creación</p>
              <p className="text-sm text-gray-900 font-medium truncate">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Productos y Notas - Dos columnas (Oculto en móvil) */}
          <div className="hidden md:grid grid-cols-2 gap-3">
            {/* Total de productos */}
            <div className="inline-flex items-center gap-2 bg-green-50/50 rounded-xl p-3 border border-green-100">
              <div className="flex-shrink-0 w-9 h-9 bg-green-100 rounded-lg inline-flex items-center justify-center">
                <Package className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-600 font-bold uppercase mb-0.5">Productos</p>
                <p className="text-sm text-gray-900 font-bold truncate">{order.items.length}</p>
              </div>
            </div>

            {/* Notas (placeholder si no hay) */}
            <div className="inline-flex items-center gap-2 bg-orange-50/50 rounded-xl p-3 border border-orange-100">
              <div className="flex-shrink-0 w-9 h-9 bg-orange-100 rounded-lg inline-flex items-center justify-center">
                <FileText className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-orange-600 font-bold uppercase mb-0.5">Notas</p>
                <p className="text-sm text-gray-900 font-medium truncate italic">
                  {order.notes || 'Sin notas'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones de acción */}
        <div className="pt-4 border-t-2 border-gray-100">
          <div className="inline-flex gap-2 w-full">
            <button
              onClick={() => onViewOrder(order)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/30"
            >
              <Eye className="w-4 h-4" />
              Ver detalle
            </button>
            {order.status === 'draft' && (
              <button
                onClick={() => onSendOrder(order)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-green-500/30"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            )}
            {(order.status === 'draft' || order.status === 'sent') && (
              <button
                onClick={() => onCancelOrder(order)}
                className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-bold transition-all active:scale-95"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
