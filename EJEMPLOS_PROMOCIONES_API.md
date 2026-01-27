# 📚 Ejemplos de Uso - API de Promociones y Cupones

## 🎯 Índice de Ejemplos

1. [Promociones - Operaciones Básicas](#promociones---operaciones-básicas)
2. [Promociones - Tipos Específicos](#promociones---tipos-específicos)
3. [Cupones - Operaciones Básicas](#cupones---operaciones-básicas)
4. [Cupones - Validación y Aplicación](#cupones---validación-y-aplicación)
5. [Integración con POS](#integración-con-pos)
6. [Casos de Uso Avanzados](#casos-de-uso-avanzados)

---

## 🎁 Promociones - Operaciones Básicas

### 1. Listar todas las promociones

```typescript
// Todas las promociones
const allPromotions = await api.getAllPromotions();

// Solo promociones activas
const activePromotions = await api.getAllPromotions({ 
  status: 'active' 
});

// Solo promociones activas y vigentes ahora
const currentDeals = await api.getAllPromotions({ 
  active_only: true 
});

// Por tipo específico
const percentageDeals = await api.getAllPromotions({ 
  type: 'percentage_discount' 
});

console.log(`Total de promociones: ${allPromotions.count}`);
allPromotions.data.forEach(promo => {
  console.log(`${promo.name} - ${promo.status}`);
});
```

### 2. Obtener promoción por ID

```typescript
const promotionId = "507f1f77bcf86cd799439011";
const promotion = await api.getPromotionById(promotionId);

console.log(`Promoción: ${promotion.data.name}`);
console.log(`Tipo: ${promotion.data.type}`);
console.log(`Descuento: ${promotion.data.discountValue}%`);
console.log(`Productos aplicables: ${promotion.data.productIds.length}`);
```

### 3. Crear promoción

```typescript
const newPromotion = await api.createPromotion({
  name: "Happy Hour - 20% OFF",
  description: "20% de descuento en bebidas",
  type: "percentage_discount",
  status: "active",
  priority: 5,
  
  // Aplicar solo a categoría de bebidas
  categoryIds: ["bebidas"],
  
  // Descuento del 20%
  discountType: "percentage",
  discountValue: 20,
  
  // Solo de 5pm a 8pm
  timeStart: "17:00",
  timeEnd: "20:00",
  
  // De lunes a viernes
  daysOfWeek: [1, 2, 3, 4, 5],
  
  // Vigencia
  startDate: new Date(),
  endDate: new Date("2025-12-31"),
  
  tags: ["happy-hour", "bebidas"]
});

console.log(`Promoción creada: ${newPromotion.data.name}`);
```

### 4. Actualizar promoción

```typescript
const updatedPromotion = await api.updatePromotion(promotionId, {
  discountValue: 25, // Aumentar descuento a 25%
  maxTotalUsage: 100, // Limitar a 100 usos
  status: "active"
});

console.log(`Promoción actualizada: ${updatedPromotion.message}`);
```

### 5. Cambiar estado de promoción

```typescript
// Activar
await api.togglePromotionStatus(promotionId, "active");

// Desactivar temporalmente
await api.togglePromotionStatus(promotionId, "inactive");

// Programar para el futuro
await api.togglePromotionStatus(promotionId, "scheduled");
```

### 6. Eliminar promoción

```typescript
try {
  await api.deletePromotion(promotionId);
  console.log("Promoción eliminada exitosamente");
} catch (error) {
  console.error("Error al eliminar:", error.message);
}
```

### 7. Duplicar promoción

```typescript
// Útil para crear promociones similares
const duplicated = await api.duplicatePromotion(promotionId);
console.log(`Nueva promoción: ${duplicated.data.name}`);
// Output: "Happy Hour - 20% OFF (Copia)"
```

---

## 🎯 Promociones - Tipos Específicos

### 1. Descuento Porcentual

```typescript
await api.createPromotion({
  name: "Black Friday - 50% OFF",
  description: "50% de descuento en toda la tienda",
  type: "percentage_discount",
  status: "scheduled",
  priority: 10,
  
  applyToAll: true, // Aplica a todos los productos
  
  discountType: "percentage",
  discountValue: 50,
  
  minAmount: 500, // Compra mínima de $500
  
  startDate: new Date("2025-11-29"),
  endDate: new Date("2025-11-29T23:59:59"),
  
  maxTotalUsage: 500, // Solo 500 usos
  maxUsagePerCustomer: 1 // 1 por cliente
});
```

### 2. Descuento Fijo

```typescript
await api.createPromotion({
  name: "Descuento $100 en compras mayores",
  description: "$100 de descuento en compras mayores a $1000",
  type: "fixed_discount",
  status: "active",
  priority: 5,
  
  applyToAll: true,
  
  discountType: "fixed",
  discountValue: 100,
  
  minAmount: 1000, // Compra mínima de $1000
  
  startDate: new Date(),
  endDate: new Date("2025-12-31")
});
```

### 3. 2x1 / 3x2 (Buy X Get Y)

```typescript
// 2x1 en Coca-Colas
await api.createPromotion({
  name: "2x1 Coca-Cola",
  description: "Compra 2 Coca-Colas y lleva 1 gratis",
  type: "buy_x_get_y",
  status: "active",
  priority: 8,
  
  productIds: ["coca_cola_2L_id", "coca_cola_600ml_id"],
  
  buyQuantity: 2, // Compra 2
  getQuantity: 1, // Lleva 1 gratis (el más barato)
  
  startDate: new Date(),
  endDate: new Date("2025-12-31"),
  
  daysOfWeek: [5, 6, 0], // Viernes, Sábado, Domingo
  
  maxUsagePerCustomer: 2 // Máximo 2 veces por cliente
});

// 3x2 general
await api.createPromotion({
  name: "3x2 en todos los productos",
  description: "Compra 3 productos y paga solo 2",
  type: "buy_x_get_y",
  status: "active",
  priority: 7,
  
  applyToAll: true,
  
  buyQuantity: 3,
  getQuantity: 1, // El más barato gratis
  
  startDate: new Date(),
  endDate: new Date("2025-06-30")
});
```

### 4. Combo de Productos

```typescript
await api.createPromotion({
  name: "Combo Desayuno $99",
  description: "Café + Pan + Jugo = $99",
  type: "combo",
  status: "active",
  priority: 9,
  
  comboProducts: [
    { productId: "cafe_id", quantity: 1, optional: false },
    { productId: "pan_id", quantity: 2, optional: false },
    { productId: "jugo_naranja_id", quantity: 1, optional: true }
  ],
  
  specialPrice: 99, // Precio del combo
  
  timeStart: "06:00",
  timeEnd: "11:00", // Solo en la mañana
  
  startDate: new Date(),
  endDate: new Date("2025-12-31")
});
```

### 5. Precio Especial

```typescript
await api.createPromotion({
  name: "Precio Especial - Leche a $25",
  description: "Leche Lala 1L a precio especial",
  type: "special_price",
  status: "active",
  priority: 6,
  
  productIds: ["leche_lala_1L_id"],
  
  specialPrice: 25, // Precio fijo de $25 (normal $35)
  
  startDate: new Date(),
  endDate: new Date("2025-03-31"),
  
  maxUsagePerCustomer: 3 // Máximo 3 unidades por cliente
});
```

### 6. Descuento por Categoría

```typescript
await api.createPromotion({
  name: "15% OFF en Lácteos",
  description: "15% de descuento en todos los lácteos",
  type: "category_discount",
  status: "active",
  priority: 4,
  
  categoryIds: ["lácteos"],
  
  discountType: "percentage",
  discountValue: 15,
  
  startDate: new Date(),
  endDate: new Date("2025-12-31")
});
```

### 7. Descuento por Nivel de Cliente

```typescript
await api.createPromotion({
  name: "Descuento VIP - Clientes Oro y Platino",
  description: "10% extra para clientes Gold y Platinum",
  type: "tier_discount",
  status: "active",
  priority: 10,
  
  applyToAll: true,
  
  customerTiers: ["gold", "platinum"],
  
  discountType: "percentage",
  discountValue: 10,
  
  startDate: new Date(),
  endDate: new Date("2025-12-31")
});
```

### 8. Descuento por Volumen

```typescript
await api.createPromotion({
  name: "Compra 10 o más - 20% OFF",
  description: "20% de descuento comprando 10 unidades o más",
  type: "volume_discount",
  status: "active",
  priority: 5,
  
  productIds: ["agua_600ml_id"],
  
  minQuantity: 10, // Mínimo 10 unidades
  
  discountType: "percentage",
  discountValue: 20,
  
  startDate: new Date(),
  endDate: new Date("2025-12-31")
});
```

---

## 🎫 Cupones - Operaciones Básicas

### 1. Listar cupones

```typescript
// Todos los cupones
const allCoupons = await api.getAllCoupons();

// Solo cupones activos
const activeCoupons = await api.getAllCoupons({ status: 'active' });

// Cupones para un cliente específico
const customerCoupons = await api.getAllCoupons({ 
  customer_id: 'customer_id_here' 
});

console.log(`Total de cupones: ${allCoupons.count}`);
```

### 2. Crear cupón

```typescript
const newCoupon = await api.createCoupon({
  code: "BIENVENIDO10",
  type: "percentage",
  value: 10,
  description: "10% de descuento en tu primera compra",
  
  minPurchaseAmount: 200, // Compra mínima $200
  maxDiscountAmount: 100, // Descuento máximo $100
  
  maxUsage: 100, // 100 cupones disponibles
  maxUsagePerCustomer: 1, // 1 por cliente
  
  startDate: new Date(),
  endDate: new Date("2025-12-31"),
  
  status: "active"
});

console.log(`Cupón creado: ${newCoupon.data.code}`);
```

### 3. Generar código automático

```typescript
// Código aleatorio de 8 caracteres
const code1 = await api.generateCouponCode();
console.log(code1.code); // Ej: "K7X9M2P4"

// Código con prefijo
const code2 = await api.generateCouponCode({ 
  prefix: "VIP",
  length: 10 
});
console.log(code2.code); // Ej: "VIPA8X9M2P"
```

### 4. Actualizar cupón

```typescript
await api.updateCoupon(couponId, {
  maxUsage: 200, // Aumentar disponibilidad
  endDate: new Date("2026-01-31") // Extender vigencia
});
```

### 5. Cambiar estado

```typescript
// Desactivar temporalmente
await api.toggleCouponStatus(couponId, "inactive");

// Reactivar
await api.toggleCouponStatus(couponId, "active");
```

### 6. Ver estadísticas

```typescript
const stats = await api.getCouponStats(couponId);

console.log(`Código: ${stats.data.code}`);
console.log(`Usos: ${stats.data.currentUsage} / ${stats.data.maxUsage}`);
console.log(`Usos restantes: ${stats.data.remainingUses}`);
console.log(`Descuento total dado: $${stats.data.totalDiscountGiven}`);
console.log(`Descuento promedio: $${stats.data.averageDiscount}`);
console.log(`Clientes únicos: ${stats.data.uniqueCustomers}`);
console.log(`¿Válido?: ${stats.data.isValid}`);

// Historial de usos (últimos 10)
stats.data.usageHistory.forEach(usage => {
  console.log(`${usage.customerName} - $${usage.discountAmount} - ${usage.usedAt}`);
});
```

---

## ✅ Cupones - Validación y Aplicación

### 1. Validar cupón antes de aplicar

```typescript
// En el PaymentModal o Cart
const validateAndApplyCoupon = async (code: string) => {
  try {
    const validation = await api.validateCoupon({
      code: code,
      customerId: selectedCustomer?.id,
      cartTotal: total,
      cartItems: cartItems
    });
    
    if (validation.valid) {
      // Cupón válido
      setAppliedCoupon(validation.data);
      setDiscount(validation.data.discount);
      
      toast.success(`Cupón aplicado: -$${validation.data.discount}`);
      return true;
    } else {
      // Cupón inválido
      toast.error(validation.message);
      return false;
    }
  } catch (error) {
    toast.error("Error al validar cupón");
    return false;
  }
};
```

### 2. Aplicar cupón en venta (después de confirmar pago)

```typescript
// Después de crear la venta
const handleCompleteSale = async () => {
  // 1. Crear venta
  const sale = await api.createSale({
    items: cartItems,
    total: total,
    discount: appliedDiscount,
    // ...otros datos
  });
  
  // 2. Si hay cupón aplicado, registrar uso
  if (appliedCoupon) {
    await api.applyCoupon({
      couponId: appliedCoupon.couponId,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      saleId: sale.data.id,
      discountAmount: appliedDiscount
    });
  }
  
  toast.success("Venta completada");
  clearCart();
};
```

### 3. Flujo completo en componente

```typescript
import { useState } from 'react';
import { api } from '@/services/api';

export function PaymentModalWithCoupons() {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [validating, setValidating] = useState(false);
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Ingresa un código de cupón");
      return;
    }
    
    setValidating(true);
    
    try {
      const result = await api.validateCoupon({
        code: couponCode.toUpperCase(),
        customerId: selectedCustomer?.id,
        cartTotal: subtotal,
        cartItems: cartItems.map(item => ({
          productId: item.id,
          category: item.category,
          price: item.price,
          quantity: item.quantity
        }))
      });
      
      if (result.valid) {
        setAppliedCoupon(result.data);
        setDiscount(result.data.discount);
        toast.success(`¡Cupón aplicado! Ahorras $${result.data.discount}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al validar cupón");
    } finally {
      setValidating(false);
    }
  };
  
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    toast.info("Cupón removido");
  };
  
  return (
    <div className="coupon-section">
      {!appliedCoupon ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Código de cupón"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-2 border rounded"
            maxLength={20}
          />
          <button
            onClick={handleApplyCoupon}
            disabled={validating}
            className="px-6 py-2 bg-blue-500 text-white rounded"
          >
            {validating ? 'Validando...' : 'Aplicar'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
          <div>
            <p className="font-bold text-green-700">{appliedCoupon.code}</p>
            <p className="text-sm text-green-600">{appliedCoupon.description}</p>
            <p className="text-sm font-bold text-green-700">Descuento: ${discount}</p>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🛒 Integración con POS

### 1. Obtener promociones para un producto

```typescript
// Al agregar producto al carrito
const checkPromotions = async (product: Product) => {
  const promotions = await api.getPromotionsForProduct(product.id);
  
  if (promotions.count > 0) {
    const bestPromotion = promotions.data[0]; // Ordenado por prioridad
    
    toast.success(
      `¡Oferta disponible! ${bestPromotion.name}`,
      { icon: '🎁' }
    );
    
    return bestPromotion;
  }
  
  return null;
};
```

### 2. Aplicar promoción al carrito

```typescript
const applyBestPromotion = async () => {
  if (!activePromotion) return;
  
  const result = await api.applyPromotionToCart({
    promotionId: activePromotion.id,
    cartItems: cartItems.map(item => ({
      productId: item.id,
      price: item.price,
      quantity: item.quantity,
      category: item.category
    })),
    customerId: selectedCustomer?.id
  });
  
  if (result.success && result.data.applicable) {
    setPromotionDiscount(result.data.discount);
    
    toast.success(
      `Descuento aplicado: $${result.data.discount}`,
      { icon: '✅' }
    );
  } else {
    toast.warning(result.data.reason);
  }
};
```

### 3. Mostrar ofertas activas

```typescript
// En Dashboard o Banner
export function ActiveDealsCarousel() {
  const [deals, setDeals] = useState([]);
  
  useEffect(() => {
    loadActiveDeals();
  }, []);
  
  const loadActiveDeals = async () => {
    const response = await api.getActiveDeals();
    setDeals(response.data);
  };
  
  return (
    <div className="deals-carousel">
      <h3>🔥 Ofertas Activas</h3>
      {deals.map(deal => (
        <div key={deal.promotionId} className="deal-card">
          {deal.imageUrl && <img src={deal.imageUrl} alt={deal.name} />}
          <h4>{deal.name}</h4>
          <p>{deal.description}</p>
          <span className="badge">{deal.discountPreview}</span>
          <p className="expires">
            Termina: {new Date(deal.endsAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🚀 Casos de Uso Avanzados

### 1. Sistema de Cupones Personalizados por Cliente

```typescript
// Crear cupón exclusivo para un cliente VIP
const createVIPCoupon = async (customer: Customer) => {
  const code = await api.generateCouponCode({
    prefix: "VIP",
    length: 10
  });
  
  await api.createCoupon({
    code: code.code,
    type: "fixed",
    value: 200,
    description: `Cupón exclusivo para ${customer.name}`,
    
    customerIds: [customer.id], // Solo este cliente
    
    minPurchaseAmount: 1000,
    maxUsagePerCustomer: 1,
    
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    
    status: "active"
  });
  
  // Enviar notificación al cliente
  console.log(`Cupón ${code.code} creado para ${customer.name}`);
};
```

### 2. Promoción Flash Automática

```typescript
// Crear promoción flash que se activa automáticamente
const createFlashSale = async () => {
  const now = new Date();
  const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas
  
  await api.createPromotion({
    name: "⚡ FLASH SALE - 40% OFF",
    description: "Solo por 2 horas - 40% en toda la tienda",
    type: "percentage_discount",
    status: "active",
    priority: 20, // Máxima prioridad
    
    applyToAll: true,
    
    discountType: "percentage",
    discountValue: 40,
    
    startDate: now,
    endDate: endTime,
    
    maxTotalUsage: 50, // Solo 50 clientes
    maxUsagePerCustomer: 1,
    
    tags: ["flash-sale", "urgente"]
  });
  
  // Notificar a todos los clientes
  console.log("¡Flash Sale activa!");
};
```

### 3. Sistema de Puntos Convertibles a Cupones

```typescript
// Cliente canjea puntos por cupón
const redeemPointsForCoupon = async (customer: Customer, points: number) => {
  // 100 puntos = $10 de descuento
  const discountValue = points / 10;
  
  const code = await api.generateCouponCode({
    prefix: "PTS",
    length: 8
  });
  
  const coupon = await api.createCoupon({
    code: code.code,
    type: "fixed",
    value: discountValue,
    description: `Cupón canjeado por ${points} puntos`,
    
    customerIds: [customer.id],
    
    maxUsagePerCustomer: 1,
    
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
    
    status: "active"
  });
  
  // Descontar puntos del cliente
  await api.updateCustomer(customer.id, {
    loyaltyPoints: customer.loyaltyPoints - points
  });
  
  return coupon.data;
};
```

### 4. Promoción con Múltiples Restricciones

```typescript
// Promoción compleja para clientes Gold/Platinum en días específicos
await api.createPromotion({
  name: "VIP Weekends - 25% OFF",
  description: "25% de descuento para clientes VIP los fines de semana",
  type: "tier_discount",
  status: "active",
  priority: 15,
  
  applyToAll: true,
  
  // Solo clientes Gold y Platinum
  customerTiers: ["gold", "platinum"],
  
  discountType: "percentage",
  discountValue: 25,
  
  // Solo fines de semana
  daysOfWeek: [6, 0], // Sábado y Domingo
  
  // De 10am a 8pm
  timeStart: "10:00",
  timeEnd: "20:00",
  
  // Compra mínima $500
  minAmount: 500,
  
  // Sin límite de usos
  
  startDate: new Date(),
  endDate: new Date("2025-12-31")
});
```

### 5. Reportes de Efectividad

```typescript
// Analizar efectividad de promociones
const analyzePromotionEffectiveness = async () => {
  const promotions = await api.getAllPromotions();
  
  const analysis = promotions.data.map(promo => ({
    name: promo.name,
    type: promo.type,
    status: promo.status,
    usageRate: promo.maxTotalUsage 
      ? (promo.currentUsage / promo.maxTotalUsage * 100).toFixed(2) + '%'
      : 'Sin límite',
    currentUsage: promo.currentUsage,
    priority: promo.priority,
    isActive: promo.isActive
  }));
  
  // Ordenar por más usadas
  analysis.sort((a, b) => b.currentUsage - a.currentUsage);
  
  console.table(analysis);
  
  return analysis;
};
```

---

## ✅ Mejores Prácticas

### 1. Validación en Tiempo Real

```typescript
// Validar cupón mientras el usuario escribe
const [couponCode, setCouponCode] = useState('');
const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

const debouncedValidation = useCallback(
  debounce(async (code: string) => {
    if (code.length < 4) return;
    
    setValidationStatus('checking');
    
    const result = await api.validateCoupon({
      code,
      customerId: selectedCustomer?.id,
      cartTotal: total
    });
    
    setValidationStatus(result.valid ? 'valid' : 'invalid');
  }, 500),
  [selectedCustomer, total]
);

const handleCodeChange = (code: string) => {
  setCouponCode(code.toUpperCase());
  debouncedValidation(code);
};
```

### 2. Manejo de Errores

```typescript
const handlePromotionOperation = async (operation: () => Promise<any>) => {
  try {
    const result = await operation();
    
    if (result.success) {
      toast.success(result.message);
      return result.data;
    } else {
      toast.error(result.message);
      return null;
    }
  } catch (error) {
    if (error.message.includes('401')) {
      toast.error("Sesión expirada. Por favor inicia sesión");
      // Redirigir a login
    } else if (error.message.includes('403')) {
      toast.error("No tienes permisos para esta operación");
    } else if (error.message.includes('404')) {
      toast.error("Recurso no encontrado");
    } else {
      toast.error("Error al procesar la solicitud");
    }
    
    console.error("Error:", error);
    return null;
  }
};
```

### 3. Caché de Ofertas Activas

```typescript
// Cachear ofertas activas para no consultar constantemente
const useActiveDeals = () => {
  const [deals, setDeals] = useState([]);
  const [lastFetch, setLastFetch] = useState(0);
  
  const CACHE_TIME = 5 * 60 * 1000; // 5 minutos
  
  const fetchDeals = async (force = false) => {
    const now = Date.now();
    
    if (!force && now - lastFetch < CACHE_TIME) {
      return deals; // Usar caché
    }
    
    const response = await api.getActiveDeals();
    setDeals(response.data);
    setLastFetch(now);
    
    return response.data;
  };
  
  useEffect(() => {
    fetchDeals();
  }, []);
  
  return { deals, refresh: () => fetchDeals(true) };
};
```

---

## 🎯 Checklist de Integración

- [ ] Crear componente `PromotionsManagementWithAPI.tsx`
- [ ] Integrar validación de cupones en `PaymentModal`
- [ ] Mostrar ofertas activas en `Dashboard`
- [ ] Aplicar promociones automáticamente en `Cart`
- [ ] Agregar banner de ofertas flash
- [ ] Implementar notificaciones de nuevas promociones
- [ ] Crear reportes de efectividad
- [ ] Agregar indicadores visuales en productos con promoción
- [ ] Sistema de cupones personalizados por cliente
- [ ] Integración con programa de lealtad

---

¡El sistema de promociones está listo para aumentar tus ventas! 🚀💰
