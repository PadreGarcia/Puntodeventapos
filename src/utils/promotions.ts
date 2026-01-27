import type { Promotion, CartItem, Product } from '@/types/pos';

export interface PromotionResult {
  discount: number;
  description: string;
  appliedTo: string[];
}

/**
 * Aplica una promoción al carrito y calcula el descuento
 */
export function applyPromotion(
  promotion: Promotion,
  cartItems: CartItem[],
  products: Product[]
): PromotionResult {
  
  // Validar que la promoción esté activa
  if (promotion.status !== 'active') {
    return { discount: 0, description: 'Promoción inactiva', appliedTo: [] };
  }

  // Validar fechas
  const now = new Date();
  if (promotion.startDate && new Date(promotion.startDate) > now) {
    return { discount: 0, description: 'Promoción no ha iniciado', appliedTo: [] };
  }
  if (promotion.endDate && new Date(promotion.endDate) < now) {
    return { discount: 0, description: 'Promoción expirada', appliedTo: [] };
  }

  // Filtrar items elegibles
  const eligibleItems = getEligibleItems(promotion, cartItems, products);
  
  if (eligibleItems.length === 0) {
    return { discount: 0, description: 'Sin productos elegibles', appliedTo: [] };
  }

  // Aplicar según el tipo de promoción
  switch (promotion.type) {
    case 'percentage_discount':
      return applyPercentageDiscount(promotion, eligibleItems);
    
    case 'fixed_discount':
      return applyFixedDiscount(promotion, eligibleItems, cartItems);
    
    case 'buy_x_get_y':
      return applyBuyXGetY(promotion, eligibleItems);
    
    case 'combo':
      return applyCombo(promotion, eligibleItems, cartItems);
    
    case 'volume_discount':
      return applyVolumeDiscount(promotion, eligibleItems);
    
    case 'special_price':
      return applySpecialPrice(promotion, eligibleItems);
    
    default:
      return { discount: 0, description: 'Tipo de promoción desconocido', appliedTo: [] };
  }
}

/**
 * Filtra los items elegibles según la configuración de la promoción
 */
function getEligibleItems(
  promotion: Promotion,
  cartItems: CartItem[],
  products: Product[]
): CartItem[] {
  if (!promotion.productIds || promotion.productIds.length === 0) {
    return [];
  }

  return cartItems.filter(item => promotion.productIds?.includes(item.id));
}

/**
 * TIPO 1: Descuento Porcentual
 * Ejemplo: 15% de descuento en productos seleccionados
 */
function applyPercentageDiscount(
  promotion: Promotion,
  eligibleItems: CartItem[]
): PromotionResult {
  
  const discountPercent = promotion.discountValue || 0;
  let totalDiscount = 0;
  const appliedTo: string[] = [];

  eligibleItems.forEach(item => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = (itemTotal * discountPercent) / 100;
    totalDiscount += itemDiscount;
    appliedTo.push(item.name);
  });

  return {
    discount: totalDiscount,
    description: `${discountPercent}% de descuento aplicado`,
    appliedTo
  };
}

/**
 * TIPO 2: Descuento Fijo
 * Ejemplo: $100 de descuento en compras mayores a $500
 */
function applyFixedDiscount(
  promotion: Promotion,
  eligibleItems: CartItem[],
  allCartItems: CartItem[]
): PromotionResult {
  
  const fixedAmount = promotion.discountValue || 0;
  
  // Calcular total del carrito
  const cartTotal = allCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Validar monto mínimo
  if (promotion.minAmount && cartTotal < promotion.minAmount) {
    return {
      discount: 0,
      description: `Requiere compra mínima de $${promotion.minAmount}`,
      appliedTo: []
    };
  }

  // Calcular total de items elegibles
  const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // El descuento no puede ser mayor al total de items elegibles
  const discount = Math.min(fixedAmount, eligibleTotal);

  return {
    discount,
    description: `$${fixedAmount} de descuento aplicado`,
    appliedTo: eligibleItems.map(i => i.name)
  };
}

/**
 * TIPO 3: Compra X Lleva Y
 * Ejemplo: Compra 2 Coca-Colas lleva 1 Sprite gratis
 * Ejemplo: Compra 3 panes lleva 1 leche gratis
 * 
 * NOTA: Ahora soporta dos listas de productos:
 * - productIds: productos que el cliente debe comprar
 * - freeProductIds: productos que se lleva gratis
 */
function applyBuyXGetY(
  promotion: Promotion,
  eligibleItems: CartItem[]
): PromotionResult {
  
  const buyQuantity = promotion.buyQuantity || 2; // Cantidad que debes comprar
  const getQuantity = promotion.getQuantity || 1; // Cantidad que recibes gratis
  
  let totalDiscount = 0;
  const appliedTo: string[] = [];

  // Si hay freeProductIds, es una promoción con productos específicos gratis
  // De lo contrario, es una promoción del mismo producto (2x1 clásico)
  if (promotion.freeProductIds && promotion.freeProductIds.length > 0) {
    // Contar cuántos productos de compra hay en el carrito
    let totalBuyItems = 0;
    eligibleItems.forEach(item => {
      if (promotion.productIds?.includes(item.id)) {
        totalBuyItems += item.quantity;
      }
    });

    // Calcular cuántos sets completos de productos gratis puede llevarse
    const completeSets = Math.floor(totalBuyItems / buyQuantity);
    
    if (completeSets > 0) {
      // Buscar los productos gratis en el carrito para calcular el descuento
      // El descuento es el valor de los productos gratis que se lleva
      const freeItemsToGive = completeSets * getQuantity;
      
      // Por ahora, asumimos que el descuento es sobre el producto gratis más barato
      // o distribuido entre todos los productos gratis según disponibilidad
      appliedTo.push(`Compra ${buyQuantity} productos, lleva ${getQuantity} gratis`);
      
      // TODO: Aquí necesitarías acceso a los precios de los productos gratis
      // Por simplicidad, retornamos 0 por ahora y será calculado en el carrito
      totalDiscount = 0; // Se calculará en el carrito
    }
  } else {
    // Promoción clásica del mismo producto (2x1, 3x2, etc.)
    eligibleItems.forEach(item => {
      // Calcular cuántos sets completos hay (ej: si compra 5 en un 2x1, son 2 sets completos)
      const completeSets = Math.floor(item.quantity / buyQuantity);
      
      if (completeSets > 0) {
        // Los items gratis son los que se llevan de más
        const freeItems = completeSets * getQuantity;
        const itemDiscount = freeItems * item.price;
        totalDiscount += itemDiscount;
        appliedTo.push(`${item.name} (${freeItems} gratis)`);
      }
    });
  }

  return {
    discount: totalDiscount,
    description: `Compra ${buyQuantity} lleva ${buyQuantity + getQuantity}`,
    appliedTo
  };
}

/**
 * TIPO 4: Combo/Paquete
 * Ejemplo: Combo desayuno (café + pan + jugo) por $50 en lugar de $80
 */
function applyCombo(
  promotion: Promotion,
  eligibleItems: CartItem[],
  allCartItems: CartItem[]
): PromotionResult {
  
  const requiredProducts = promotion.productIds || [];
  const comboPrice = promotion.discountValue || 0;

  // Verificar que todos los productos del combo estén en el carrito
  const hasAllProducts = requiredProducts.every(productId =>
    allCartItems.some(item => item.id === productId)
  );

  if (!hasAllProducts) {
    return {
      discount: 0,
      description: `Requiere todos los productos del combo`,
      appliedTo: []
    };
  }

  // Calcular el precio normal del combo
  const normalPrice = eligibleItems.reduce((sum, item) => {
    const minQty = Math.min(item.quantity, 1); // Solo cuenta 1 de cada producto para el combo
    return sum + (item.price * minQty);
  }, 0);

  // El descuento es la diferencia entre el precio normal y el precio del combo
  const discount = Math.max(0, normalPrice - comboPrice);

  return {
    discount,
    description: `Combo por $${comboPrice} (ahorro de $${discount.toFixed(2)})`,
    appliedTo: eligibleItems.map(i => i.name)
  };
}

/**
 * TIPO 5: Descuento por Volumen
 * Ejemplo: Compra 5+ unidades y recibe 10% de descuento
 */
function applyVolumeDiscount(
  promotion: Promotion,
  eligibleItems: CartItem[]
): PromotionResult {
  
  const minQuantity = promotion.minQuantity || 5;
  const discountPercent = promotion.discountValue || 10;
  
  let totalDiscount = 0;
  const appliedTo: string[] = [];

  eligibleItems.forEach(item => {
    // Solo aplica si cumple la cantidad mínima
    if (item.quantity >= minQuantity) {
      const itemTotal = item.price * item.quantity;
      const itemDiscount = (itemTotal * discountPercent) / 100;
      totalDiscount += itemDiscount;
      appliedTo.push(`${item.name} (${item.quantity} unidades)`);
    }
  });

  if (totalDiscount === 0) {
    return {
      discount: 0,
      description: `Requiere mínimo ${minQuantity} unidades`,
      appliedTo: []
    };
  }

  return {
    discount: totalDiscount,
    description: `${discountPercent}% por comprar ${minQuantity}+ unidades`,
    appliedTo
  };
}

/**
 * TIPO 6: Precio Especial
 * Ejemplo: Producto normalmente $100 ahora $79
 */
function applySpecialPrice(
  promotion: Promotion,
  eligibleItems: CartItem[]
): PromotionResult {
  
  const specialPrice = promotion.discountValue || 0;
  let totalDiscount = 0;
  const appliedTo: string[] = [];

  eligibleItems.forEach(item => {
    // Calcular descuento por unidad
    const discountPerUnit = Math.max(0, item.price - specialPrice);
    const itemDiscount = discountPerUnit * item.quantity;
    totalDiscount += itemDiscount;
    appliedTo.push(`${item.name} a $${specialPrice} c/u`);
  });

  return {
    discount: totalDiscount,
    description: `Precio especial $${specialPrice}`,
    appliedTo
  };
}

/**
 * Obtiene todas las promociones aplicables al carrito actual
 */
export function getApplicablePromotions(
  promotions: Promotion[],
  cartItems: CartItem[],
  products: Product[]
): Array<Promotion & { result: PromotionResult }> {
  
  return promotions
    .map(promotion => ({
      ...promotion,
      result: applyPromotion(promotion, cartItems, products)
    }))
    .filter(p => p.result.discount > 0)
    .sort((a, b) => b.result.discount - a.result.discount); // Mayor descuento primero
}

/**
 * Calcula el mejor descuento aplicable (solo se puede usar una promoción a la vez)
 */
export function getBestPromotion(
  promotions: Promotion[],
  cartItems: CartItem[],
  products: Product[]
): (Promotion & { result: PromotionResult }) | null {
  
  const applicable = getApplicablePromotions(promotions, cartItems, products);
  return applicable.length > 0 ? applicable[0] : null;
}
