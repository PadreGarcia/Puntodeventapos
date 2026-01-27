import { BarChart3, DollarSign, Gift, Package, TrendingUp, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import type { Promotion, Product } from '@/types/pos';

interface PromotionSummaryProps {
  promotion: Partial<Promotion>;
  products: Product[];
}

export function PromotionSummary({ promotion, products }: PromotionSummaryProps) {
  
  const getTypeIcon = () => {
    switch (promotion.type) {
      case 'percentage_discount': return <BarChart3 className="w-8 h-8" />;
      case 'fixed_discount': return <DollarSign className="w-8 h-8" />;
      case 'buy_x_get_y': return <Gift className="w-8 h-8" />;
      case 'combo': return <Package className="w-8 h-8" />;
      case 'volume_discount': return <TrendingUp className="w-8 h-8" />;
      case 'special_price': return <Tag className="w-8 h-8" />;
      default: return null;
    }
  };

  const getTypeName = () => {
    switch (promotion.type) {
      case 'percentage_discount': return 'Descuento Porcentual';
      case 'fixed_discount': return 'Descuento Fijo';
      case 'buy_x_get_y': return 'Compra X Lleva Y';
      case 'combo': return 'Combo/Paquete';
      case 'volume_discount': return 'Descuento por Volumen';
      case 'special_price': return 'Precio Especial';
      default: return 'Desconocido';
    }
  };

  const getBenefitDescription = () => {
    switch (promotion.type) {
      case 'percentage_discount':
        return `${promotion.discountValue}% de descuento`;
      
      case 'fixed_discount':
        return `$${promotion.discountValue} de descuento`;
      
      case 'buy_x_get_y':
        return `Compra ${promotion.buyQuantity} y lleva ${(promotion.buyQuantity || 0) + (promotion.getQuantity || 0)} (${promotion.getQuantity} gratis)`;
      
      case 'combo':
        return `Precio especial del combo: $${promotion.discountValue}`;
      
      case 'volume_discount':
        return `${promotion.discountValue}% al comprar ${promotion.minQuantity}+ unidades`;
      
      case 'special_price':
        return `Precio especial: $${promotion.specialPrice}`;
      
      default:
        return 'Sin beneficio definido';
    }
  };

  const getHowItWorks = () => {
    switch (promotion.type) {
      case 'percentage_discount':
        return `El cliente recibirá un ${promotion.discountValue}% de descuento sobre los productos seleccionados.`;
      
      case 'fixed_discount':
        return `Se descontarán $${promotion.discountValue} del total de la compra${promotion.minAmount ? ` cuando supere los $${promotion.minAmount}` : ''}.`;
      
      case 'buy_x_get_y':
        return `Por cada ${promotion.buyQuantity} unidades compradas, el cliente recibirá ${promotion.getQuantity} adicionales sin costo. Ejemplo: si compra 4 en una promoción 2x1, pagará solo 2 y recibirá 2 gratis.`;
      
      case 'combo':
        return `El cliente debe agregar todos los productos del combo al carrito. El precio total será de $${promotion.discountValue} en lugar del precio normal.`;
      
      case 'volume_discount':
        return `Cuando el cliente compre ${promotion.minQuantity} o más unidades del mismo producto, recibirá ${promotion.discountValue}% de descuento en ese producto.`;
      
      case 'special_price':
        return `Durante la promoción, los productos seleccionados tendrán un precio de $${promotion.specialPrice} por unidad, sin importar su precio original.`;
      
      default:
        return 'No se ha configurado cómo funciona esta promoción.';
    }
  };

  const selectedProducts = products.filter(p => promotion.productIds?.includes(p.id));
  const freeProducts = products.filter(p => promotion.freeProductIds?.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] text-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4 mb-3">
          <div className="bg-white/20 p-3 rounded-xl">
            {getTypeIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">{promotion.name || 'Sin nombre'}</h3>
            <p className="text-red-100 font-medium">{getTypeName()}</p>
          </div>
        </div>
        {promotion.description && (
          <p className="text-red-50 font-medium mt-2">{promotion.description}</p>
        )}
      </div>

      {/* Beneficio Principal */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg font-bold text-green-900 mb-1">Beneficio</h4>
            <p className="text-2xl font-black text-green-700">{getBenefitDescription()}</p>
          </div>
        </div>
      </div>

      {/* Cómo Funciona */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg font-bold text-blue-900 mb-2">¿Cómo funciona?</h4>
            <p className="text-sm font-medium text-blue-800 leading-relaxed">{getHowItWorks()}</p>
          </div>
        </div>
      </div>

      {/* Productos Aplicables */}
      {promotion.type === 'buy_x_get_y' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Productos a Comprar */}
          <div className="bg-white border-2 border-red-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-red-700 mb-3">
              🛒 Productos a Comprar ({selectedProducts.length})
            </h4>
            
            {selectedProducts.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedProducts.slice(0, 10).map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {selectedProducts.length > 10 && (
                  <p className="text-sm text-gray-500 font-medium text-center pt-2">
                    + {selectedProducts.length - 10} productos más
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Productos Gratis */}
          <div className="bg-white border-2 border-green-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-green-700 mb-3">
              🎁 Productos Gratis ({freeProducts.length})
            </h4>
            
            {freeProducts.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {freeProducts.slice(0, 10).map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 line-through">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {freeProducts.length > 10 && (
                  <p className="text-sm text-gray-500 font-medium text-center pt-2">
                    + {freeProducts.length - 10} productos más
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-3">
            📦 Productos incluidos ({selectedProducts.length})
          </h4>
          
          {selectedProducts.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedProducts.slice(0, 10).map(product => (
                <div key={product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {selectedProducts.length > 10 && (
                <p className="text-sm text-gray-500 font-medium text-center pt-2">
                  + {selectedProducts.length - 10} productos más
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Condiciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotion.minAmount && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-xs font-bold text-yellow-700 mb-1">Compra mínima</p>
            <p className="text-lg font-black text-yellow-900">${promotion.minAmount}</p>
          </div>
        )}
        
        {promotion.minQuantity && promotion.type !== 'volume_discount' && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <p className="text-xs font-bold text-purple-700 mb-1">Cantidad mínima</p>
            <p className="text-lg font-black text-purple-900">{promotion.minQuantity} unidades</p>
          </div>
        )}

        {promotion.startDate && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-700 mb-1">Inicia</p>
            <p className="text-sm font-black text-blue-900">
              {new Date(promotion.startDate).toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        )}

        {promotion.endDate && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-xs font-bold text-red-700 mb-1">Termina</p>
            <p className="text-sm font-black text-red-900">
              {new Date(promotion.endDate).toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        )}
      </div>

      {/* Ejemplo Visual */}
      {renderExample()}
    </div>
  );

  function renderExample() {
    switch (promotion.type) {
      case 'percentage_discount':
        const exampleProduct = selectedProducts[0];
        if (!exampleProduct) return null;
        const discountAmount = (exampleProduct.price * (promotion.discountValue || 0)) / 100;
        const finalPrice = exampleProduct.price - discountAmount;
        
        return (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3">💡 Ejemplo:</h4>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                {exampleProduct.name}: <span className="line-through text-gray-500">${exampleProduct.price.toFixed(2)}</span>
                {' → '}
                <span className="text-green-600 font-bold text-lg">${finalPrice.toFixed(2)}</span>
                <span className="text-xs text-gray-500 ml-2">(ahorras ${discountAmount.toFixed(2)})</span>
              </p>
            </div>
          </div>
        );

      case 'buy_x_get_y':
        const product2x1 = selectedProducts[0];
        if (!product2x1) return null;
        const buyQty = promotion.buyQuantity || 2;
        const getQty = promotion.getQuantity || 1;
        const totalItems = buyQty + getQty;
        const normalPrice = product2x1.price * totalItems;
        const promoPrice = product2x1.price * buyQty;
        
        return (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3">💡 Ejemplo:</h4>
            <p className="text-sm font-medium text-gray-900 mb-2">
              Cliente compra {totalItems} {product2x1.name}:
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                Precio normal: <span className="line-through">${normalPrice.toFixed(2)}</span>
              </p>
              <p className="text-green-600 font-bold text-lg">
                Con promoción: ${promoPrice.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                ({getQty} {getQty === 1 ? 'unidad' : 'unidades'} gratis • ahorro de ${(normalPrice - promoPrice).toFixed(2)})
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}
