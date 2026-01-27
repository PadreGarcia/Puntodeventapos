# 📋 Reglas de Negocio - Sistema de Promociones

## 🎯 Tipos de Promociones

### 1. **Descuento Porcentual** (`percentage_discount`)
**Ícono:** BarChart3 📊  
**Descripción:** Aplica un porcentaje de descuento sobre productos seleccionados

**Campos:**
- `discountValue`: Porcentaje de descuento (ej: 15 = 15%)
- `productIds`: IDs de productos aplicables (o `applyToAll: true`)
- `minAmount`: (opcional) Monto mínimo de compra

**Ejemplo:**
- 15% de descuento en toda la tienda
- 20% de descuento en productos de categoría "Bebidas"

**Cálculo:**
```
descuento = (precio_producto × cantidad × discountValue) / 100
```

---

### 2. **Descuento Fijo** (`fixed_discount`)
**Ícono:** DollarSign 💵  
**Descripción:** Descuento de cantidad fija en pesos

**Campos:**
- `discountValue`: Cantidad fija de descuento (ej: 100 = $100)
- `minAmount`: Monto mínimo de compra para activar
- `productIds`: (opcional) Productos sobre los que aplica

**Ejemplo:**
- $50 de descuento en compras mayores a $300
- $100 de descuento en tu primera compra

**Cálculo:**
```
if (total_compra >= minAmount) {
  descuento = discountValue
}
```

---

### 3. **Compra X Lleva Y** (`buy_x_get_y`)
**Ícono:** Gift 🎁  
**Descripción:** Al comprar X unidades, recibes Y unidades adicionales gratis

**Campos:**
- `buyQuantity`: Cantidad que debes comprar (ej: 2)
- `getQuantity`: Cantidad que recibes gratis (ej: 1)
- `productIds`: Productos aplicables

**Ejemplos:**
- **2x1:** Compra 2, paga 1 → `buyQuantity: 2, getQuantity: 1`
- **3x2:** Compra 3, paga 2 → `buyQuantity: 3, getQuantity: 1`
- **Lleva 3 por 2:** Compra 2, lleva 3 → `buyQuantity: 2, getQuantity: 1`

**Cálculo:**
```
sets_completos = floor(cantidad_en_carrito / buyQuantity)
items_gratis = sets_completos × getQuantity
descuento = items_gratis × precio_unitario
```

---

### 4. **Combo/Paquete** (`combo`)
**Ícono:** Package 📦  
**Descripción:** Conjunto de productos específicos a precio especial

**Campos:**
- `productIds`: Array de IDs de productos que conforman el combo (TODOS son requeridos)
- `discountValue`: Precio final del combo completo

**Ejemplo:**
- Combo Desayuno: café + pan + jugo = $50 (normalmente $80)
- Combo Familiar: 2 pizzas + refresco 2L = $200 (normalmente $280)

**Cálculo:**
```
precio_normal = suma(precios_productos_del_combo)
descuento = precio_normal - discountValue
```

**Validación:** Solo aplica si TODOS los productos del combo están en el carrito

---

### 5. **Descuento por Volumen** (`volume_discount`)
**Ícono:** TrendingUp 📈  
**Descripción:** Descuento al comprar cantidades grandes del mismo producto

**Campos:**
- `minQuantity`: Cantidad mínima para activar (ej: 5)
- `discountValue`: Porcentaje de descuento (ej: 10 = 10%)
- `productIds`: Productos aplicables

**Ejemplo:**
- Compra 5+ unidades y recibe 10% de descuento
- Mayoreo: 12+ piezas = 15% de descuento

**Cálculo:**
```
if (cantidad_producto >= minQuantity) {
  descuento = (precio × cantidad × discountValue) / 100
}
```

**Nota:** Se evalúa por producto individual, no por total de items

---

### 6. **Precio Especial** (`special_price`)
**Ícono:** Tag 🏷️  
**Descripción:** Precio temporal rebajado para productos específicos

**Campos:**
- `discountValue`: Nuevo precio por unidad (ej: 79 = $79)
- `productIds`: Productos con precio especial

**Ejemplo:**
- Producto normalmente $100 ahora $79
- Oferta Flash: $50 (precio regular $85)

**Cálculo:**
```
descuento_por_unidad = precio_original - discountValue
descuento_total = descuento_por_unidad × cantidad
```

---

## 🔧 Configuración General

### Campos Comunes a Todas las Promociones:

- **`name`**: Nombre de la promoción (ej: "Super Descuento de Verano")
- **`description`**: Descripción detallada
- **`type`**: Tipo de promoción (ver arriba)
- **`status`**: `'active'` | `'paused'` | `'scheduled'`
- **`startDate`**: Fecha/hora de inicio (opcional)
- **`endDate`**: Fecha/hora de fin (opcional)
- **`applyToAll`**: Si aplica a todos los productos (boolean)
- **`productIds`**: Array de IDs de productos específicos

### Validaciones:

✅ **Una promoción a la vez**: Solo se puede aplicar UNA promoción por venta  
✅ **Mejor descuento**: El sistema debe sugerir la promoción con mayor beneficio  
✅ **Fechas activas**: Solo aplican promociones dentro de su rango de fechas  
✅ **Status activo**: Solo promociones con `status: 'active'`  

---

## 📊 Ejemplos Prácticos

### Ejemplo 1: Black Friday - 30% en todo
```typescript
{
  name: "Black Friday 2025",
  type: "percentage_discount",
  discountValue: 30,
  applyToAll: true,
  startDate: "2025-11-29T00:00",
  endDate: "2025-11-29T23:59"
}
```

### Ejemplo 2: 2x1 en Refrescos
```typescript
{
  name: "2x1 Refrescos",
  type: "buy_x_get_y",
  buyQuantity: 2,
  getQuantity: 1,
  productIds: ["refresco-cola", "refresco-naranja"],
  endDate: "2025-12-31"
}
```

### Ejemplo 3: Combo Familiar
```typescript
{
  name: "Combo Familiar",
  type: "combo",
  discountValue: 200,
  productIds: ["pizza-grande", "pizza-mediana", "refresco-2l"],
  description: "2 pizzas + refresco 2L por solo $200"
}
```

### Ejemplo 4: Mayoreo Cerveza
```typescript
{
  name: "Descuento Mayoreo Cerveza",
  type: "volume_discount",
  minQuantity: 12,
  discountValue: 15,
  productIds: ["cerveza-corona", "cerveza-modelo"],
  description: "15% de descuento al comprar 12 o más"
}
```

---

## 🎨 Visualización en UI

### Badges de Estado:
- ✅ **Activa** (verde) - Promoción actualmente aplicable
- ⏰ **Programada** (azul) - Iniciará en el futuro
- ⏸️ **Pausada** (gris) - Temporalmente desactivada
- ❌ **Expirada** (rojo) - Ya venció

### Iconos por Tipo:
- 📊 Descuento % → `BarChart3`
- 💵 Descuento Fijo → `DollarSign`
- 🎁 Compra X Lleva Y → `Gift`
- 📦 Combo → `Package`
- 📈 Volumen → `TrendingUp`
- 🏷️ Precio Especial → `Tag`

---

## ⚠️ Notas Importantes

1. **Prioridad**: Si múltiples promociones son aplicables, se muestra la de MAYOR descuento
2. **Acumulación**: Las promociones NO son acumulables (solo una a la vez)
3. **Validación de Stock**: Verificar que haya inventario suficiente para promociones tipo "Compra X Lleva Y"
4. **Límites**: Se puede configurar un límite de usos por cliente (futuro feature)
5. **Reportes**: Todas las promociones aplicadas se registran para análisis

---

## 🚀 Roadmap Futuro

- [ ] Promociones acumulables con reglas de prioridad
- [ ] Límite de usos por cliente
- [ ] Códigos de cupón únicos
- [ ] Promociones por nivel de lealtad
- [ ] Descuentos escalonados (ej: 5-9 unidades = 5%, 10+ = 10%)
- [ ] Happy hour (horarios específicos del día)
- [ ] Descuentos por forma de pago
