import { ShoppingCart, CreditCard } from 'lucide-react';
import type { CartItem } from '@/types/pos';

interface CheckoutFooterProps {
  items: CartItem[];
  onCheckout: () => void;
  onToggleCart: () => void;
}

export function CheckoutFooter({ items, onCheckout, onToggleCart }: CheckoutFooterProps) {
  const TAX_RATE = 0.16;

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:right-96 bg-white border-t-2 border-gray-200 shadow-2xl z-30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Botón carrito móvil */}
          <button
            onClick={onToggleCart}
            className="lg:hidden relative p-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors active:scale-95 border border-gray-200"
          >
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                {totalItems}
              </span>
            )}
          </button>

          {/* Información de total */}
          <div className="flex-1 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Total a pagar</p>
              <p className="font-bold text-3xl lg:text-4xl text-gray-900 tabular-nums">
                ${total.toFixed(2)}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm text-gray-700 font-semibold">
                {totalItems} artículo{totalItems !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                + ${tax.toFixed(2)} IVA
              </p>
            </div>
          </div>

          {/* Botón cobrar */}
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className={`
              flex items-center gap-2 px-6 lg:px-10 py-4 lg:py-5 rounded-xl font-bold text-base lg:text-xl
              shadow-xl transition-all duration-200 min-h-[56px] min-w-[140px] lg:min-w-[180px]
              ${items.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white hover:from-[#D50000] hover:to-[#C00000] active:scale-95 hover:shadow-2xl shadow-red-500/30'
              }
            `}
          >
            <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" />
            <span>COBRAR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
