import { Zap, Clock, Package, CheckCircle, Megaphone, Gift, Tag, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import type { Promotion, Product } from '@/types/pos';

interface ActiveDealsTabProps {
  promotions: Promotion[];
  products: Product[];
}

export function ActiveDealsTab({ promotions, products }: ActiveDealsTabProps) {
  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    return 'Próximo a expirar';
  };

  const getDiscountPreview = (promo: Promotion) => {
    if (promo.type === 'buy_x_get_y') {
      return `Compra ${promo.buyQuantity} lleva ${promo.getQuantity} GRATIS`;
    }
    if (promo.type === 'special_price') {
      return `Precio especial: $${promo.specialPrice}`;
    }
    if (promo.discountType === 'percentage') {
      return `${promo.discountValue}% de descuento`;
    }
    return `$${promo.discountValue} de descuento`;
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Ofertas Activas</h2>
          </div>
          <p className="text-lg opacity-90">
            {promotions.length} promociones disponibles ahora
          </p>
        </div>

        {/* Active Promotions Grid */}
        {promotions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-12 text-center">
            <div className="mb-4 flex justify-center">
              <Megaphone className="w-24 h-24 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay ofertas activas</h3>
            <p className="text-gray-600 font-medium">Las promociones aparecerán aquí cuando estén activas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map(promo => {
              const productsCount = promo.applyToAll ? products.length : promo.productIds.length;

              return (
                <div
                  key={promo.id}
                  className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl transition-all"
                >
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-white">
                    <div className="mb-2">
                      {promo.type === 'buy_x_get_y' ? <Gift className="w-12 h-12" /> :
                       promo.type === 'combo' ? <Package className="w-12 h-12" /> :
                       promo.type === 'special_price' ? <Tag className="w-12 h-12" /> :
                       promo.type === 'volume_discount' ? <TrendingUp className="w-12 h-12" /> :
                       promo.type === 'percentage_discount' ? <BarChart3 className="w-12 h-12" /> :
                       <Zap className="w-12 h-12" />}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{promo.name}</h3>
                    {promo.description && (
                      <p className="text-sm opacity-90">{promo.description}</p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Discount */}
                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <div className="text-2xl font-bold text-[#EC0000] text-center">
                        {getDiscountPreview(promo)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-700">
                          {promo.applyToAll ? (
                            <span className="text-blue-600 font-bold">✨ Todos los productos</span>
                          ) : (
                            `${productsCount} producto${productsCount > 1 ? 's' : ''}`
                          )}
                        </span>
                      </div>

                      {promo.minAmount && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">
                            Compra mínima: ${promo.minAmount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {promo.minQuantity && (
                        <div className="flex items-center gap-2 text-sm">
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">
                            Cantidad mínima: {promo.minQuantity}
                          </span>
                        </div>
                      )}

                      {promo.requiresCoupon && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">🎟️</span>
                          <span className="font-bold text-purple-600">
                            Código: {promo.couponCode}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm pt-3 border-t-2 border-gray-100">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-700">
                          Termina en: <span className="font-bold text-orange-600">
                            {getTimeRemaining(promo.endDate)}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">📈</span>
                        <span className="font-medium text-gray-700">
                          Usada {promo.currentUsage} veces
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-6">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                      <div className="text-xs font-bold text-green-700 flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" /> OFERTA ACTIVA
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tips */}
        {promotions.length > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-blue-900 mb-3">💡 Consejos para tus clientes:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Las promociones se aplican automáticamente al agregar productos al carrito</li>
              <li>• Si una promoción requiere cupón, el cliente debe ingresarlo antes de pagar</li>
              <li>• Las promociones con prioridad más alta se aplican primero</li>
              <li>• Verifica las condiciones de cada oferta (monto mínimo, cantidad, etc.)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
