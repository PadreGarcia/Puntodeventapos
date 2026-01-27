import { ShoppingCart, Plus, Minus, Trash2, X, CreditCard } from 'lucide-react';
import type { CartItem } from '@/types/pos';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, isOpen, onClose, onCheckout }: CartProps) {
  const TAX_RATE = 0.16; // 16% IVA

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel del carrito */}
      <div className={`
        fixed lg:relative top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 lg:z-auto
        flex flex-col transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Header del carrito */}
        <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-2.5 rounded-xl border border-white/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-tight">Carrito</h2>
              <p className="text-sm text-red-50 font-medium">{totalItems} artículo{totalItems !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2.5 hover:bg-white/15 rounded-xl transition-colors border border-transparent hover:border-white/20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Lista de items */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-20 h-20 mb-4" />
              <p className="text-lg font-medium">Carrito vacío</p>
              <p className="text-sm text-center mt-2">Agrega productos para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div 
                  key={item.product.id}
                  className="bg-white rounded-lg shadow-sm p-3 flex gap-3 hover:shadow-md transition-shadow"
                >
                  {/* Imagen */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Información */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-2">
                      {item.product.name}
                    </h3>
                    <p className="text-[#EC0000] font-bold">
                      ${item.product.price.toFixed(2)}
                    </p>

                    {/* Controles de cantidad */}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          key={`minus-${item.product.id}`}
                          onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors active:scale-95"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span key={`quantity-${item.product.id}`} className="w-10 text-center font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          key={`plus-${item.product.id}`}
                          onClick={() => onUpdateQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                          disabled={item.quantity >= item.product.stock}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        key={`remove-${item.product.id}`}
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal del item */}
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen de totales y botón de cobro */}
        {items.length > 0 && (
          <div className="border-t bg-white p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA (16%):</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-[#EC0000]">${total.toFixed(2)}</span>
            </div>
            
            {/* Botón de cobrar */}
            <button
              onClick={onCheckout}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white hover:from-[#D50000] hover:to-[#C00000] active:scale-95 shadow-xl hover:shadow-2xl shadow-red-500/30 transition-all duration-200"
            >
              <CreditCard className="w-6 h-6" />
              <span>COBRAR</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
