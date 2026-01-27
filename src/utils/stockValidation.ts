import type { Product, CartItem } from '@/types/pos';

/**
 * Resultado de validación de stock
 */
export interface StockValidationResult {
  isValid: boolean;
  message?: string;
  availableStock?: number;
  productName?: string;
}

/**
 * Valida si hay stock suficiente para agregar un producto al carrito
 */
export function validateStockForCart(
  product: Product,
  currentCartItems: CartItem[],
  quantityToAdd: number = 1
): StockValidationResult {
  // Verificar si el producto tiene stock
  if (product.stock <= 0) {
    return {
      isValid: false,
      message: `${product.name} está agotado`,
      availableStock: 0,
      productName: product.name,
    };
  }
  
  // Buscar si el producto ya está en el carrito
  const cartItem = currentCartItems.find(item => item.product.id === product.id);
  const currentCartQuantity = cartItem ? cartItem.quantity : 0;
  const totalQuantity = currentCartQuantity + quantityToAdd;
  
  // Validar que no exceda el stock disponible
  if (totalQuantity > product.stock) {
    const remaining = product.stock - currentCartQuantity;
    
    if (remaining <= 0) {
      return {
        isValid: false,
        message: `No hay más stock disponible de ${product.name}`,
        availableStock: 0,
        productName: product.name,
      };
    }
    
    return {
      isValid: false,
      message: `Solo quedan ${remaining} unidades de ${product.name}`,
      availableStock: remaining,
      productName: product.name,
    };
  }
  
  return {
    isValid: true,
    availableStock: product.stock - totalQuantity,
    productName: product.name,
  };
}

/**
 * Valida si una venta completa puede realizarse con el stock actual
 */
export function validateSaleStock(
  cartItems: CartItem[],
  products: Product[]
): StockValidationResult {
  for (const item of cartItems) {
    const currentProduct = products.find(p => p.id === item.product.id);
    
    if (!currentProduct) {
      return {
        isValid: false,
        message: `Producto ${item.product.name} no encontrado`,
        productName: item.product.name,
      };
    }
    
    if (currentProduct.stock < item.quantity) {
      return {
        isValid: false,
        message: `Stock insuficiente de ${currentProduct.name}. Disponible: ${currentProduct.stock}, Requerido: ${item.quantity}`,
        availableStock: currentProduct.stock,
        productName: currentProduct.name,
      };
    }
    
    if (currentProduct.stock < 0) {
      return {
        isValid: false,
        message: `Error: Stock negativo detectado en ${currentProduct.name}`,
        productName: currentProduct.name,
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Valida un ajuste de inventario para evitar stock negativo
 */
export function validateInventoryAdjustment(
  product: Product,
  adjustmentType: 'Entrada' | 'Salida',
  quantity: number
): StockValidationResult {
  if (quantity <= 0) {
    return {
      isValid: false,
      message: 'La cantidad debe ser mayor a 0',
      productName: product.name,
    };
  }
  
  if (adjustmentType === 'Salida') {
    const newStock = product.stock - quantity;
    
    if (newStock < 0) {
      return {
        isValid: false,
        message: `No se puede retirar ${quantity} unidades de ${product.name}. Stock disponible: ${product.stock}`,
        availableStock: product.stock,
        productName: product.name,
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Actualiza el stock después de una venta
 */
export function updateStockAfterSale(
  products: Product[],
  cartItems: CartItem[]
): Product[] {
  return products.map(product => {
    const cartItem = cartItems.find(item => item.product.id === product.id);
    
    if (cartItem) {
      const newStock = product.stock - cartItem.quantity;
      
      // Validación de seguridad
      if (newStock < 0) {
        console.error(`ERROR: Stock negativo detectado para ${product.name}. Stock actual: ${product.stock}, Cantidad vendida: ${cartItem.quantity}`);
        return product; // No actualizar si resulta en stock negativo
      }
      
      return {
        ...product,
        stock: newStock,
      };
    }
    
    return product;
  });
}

/**
 * Verifica si un producto necesita reorden
 */
export function needsReorder(product: Product): boolean {
  const reorderPoint = product.reorderPoint || product.minStock || 0;
  return product.stock <= reorderPoint;
}

/**
 * Obtiene productos con stock bajo
 */
export function getLowStockProducts(products: Product[]): Product[] {
  return products.filter(product => needsReorder(product));
}

/**
 * Obtiene productos agotados
 */
export function getOutOfStockProducts(products: Product[]): Product[] {
  return products.filter(product => product.stock <= 0);
}

/**
 * Calcula el valor total del inventario
 */
export function calculateInventoryValue(products: Product[]): {
  totalCost: number;
  totalRetail: number;
  potentialProfit: number;
  items: number;
} {
  const result = products.reduce(
    (acc, product) => {
      const cost = (product.cost || 0) * product.stock;
      const retail = product.price * product.stock;
      
      return {
        totalCost: acc.totalCost + cost,
        totalRetail: acc.totalRetail + retail,
        items: acc.items + product.stock,
      };
    },
    { totalCost: 0, totalRetail: 0, items: 0 }
  );
  
  return {
    ...result,
    potentialProfit: result.totalRetail - result.totalCost,
  };
}

/**
 * Valida que el stock nunca sea negativo
 */
export function ensureNonNegativeStock(stock: number): number {
  return Math.max(0, stock);
}
