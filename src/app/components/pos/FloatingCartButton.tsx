import { ShoppingCart } from 'lucide-react';
import type { CartItem } from '@/types/pos';

interface FloatingCartButtonProps {
  items: CartItem[];
  onToggleCart: () => void;
}

export function FloatingCartButton({ items, onToggleCart }: FloatingCartButtonProps) {
  const TAX_RATE = 0.16;

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={onToggleCart}
      className="lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-2xl shadow-2xl hover:shadow-red-500/50 active:scale-95 transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4">
        {/* Icono con badge */}
        <div className="relative">
          <ShoppingCart className="w-7 h-7" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-[#EC0000] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
              {totalItems}
            </span>
          )}
        </div>

        {/* Total */}
        {items.length > 0 && (
          <div className="border-l border-white/30 pl-3">
            <p className="text-xs opacity-90 font-semibold">Total</p>
            <p className="text-lg font-bold tabular-nums">
              ${total.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
