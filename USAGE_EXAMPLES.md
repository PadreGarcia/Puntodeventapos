# 📚 EJEMPLOS DE USO - Sistema de Seguridad POS

## 🔒 SISTEMA DE PERMISOS

### Ejemplo 1: Validar permiso antes de una acción

```typescript
import { hasPermission, MODULES } from '@/utils/permissions';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';

function MyComponent({ currentUser }: { currentUser: User | null }) {
  
  const handleDeleteProduct = (productId: string) => {
    // ✅ VALIDAR PERMISOS PRIMERO
    if (!hasPermission(currentUser, MODULES.PRODUCTS, 'delete')) {
      toast.error('No tienes permisos para eliminar productos', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return; // ⚠️ DETENER EJECUCIÓN
    }
    
    // ✅ CONTINUAR CON LA ACCIÓN
    // ... código para eliminar producto
  };
  
  return (
    <button onClick={() => handleDeleteProduct('prod-123')}>
      Eliminar Producto
    </button>
  );
}
```

---

### Ejemplo 2: Mostrar/ocultar botones según permisos

```typescript
import { hasPermission, MODULES } from '@/utils/permissions';

function ProductCard({ product, currentUser }: ProductCardProps) {
  const canEdit = hasPermission(currentUser, MODULES.PRODUCTS, 'edit');
  const canDelete = hasPermission(currentUser, MODULES.PRODUCTS, 'delete');
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      
      <div className="actions">
        {/* ✅ Solo mostrar botón si tiene permiso */}
        {canEdit && (
          <button onClick={() => handleEdit(product)}>
            Editar
          </button>
        )}
        
        {/* ✅ Solo mostrar botón si tiene permiso */}
        {canDelete && (
          <button onClick={() => handleDelete(product.id)}>
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### Ejemplo 3: Obtener todos los permisos de un módulo

```typescript
import { getPermittedActions, MODULES } from '@/utils/permissions';

function InventoryModule({ currentUser }: { currentUser: User | null }) {
  const permissions = getPermittedActions(currentUser, MODULES.INVENTORY);
  
  console.log(permissions);
  // {
  //   canView: true,
  //   canCreate: true,
  //   canEdit: true,
  //   canDelete: false
  // }
  
  return (
    <div>
      {permissions.canView && <InventoryList />}
      {permissions.canEdit && <AdjustmentButton />}
      {permissions.canDelete && <DeleteButton />}
    </div>
  );
}
```

---

### Ejemplo 4: Validar acceso a un módulo completo

```typescript
import { canAccessModule, MODULES } from '@/utils/permissions';
import { toast } from 'sonner';

function App({ currentUser }: { currentUser: User | null }) {
  
  const handleNavigate = (view: string) => {
    // ✅ VALIDAR ACCESO AL MÓDULO
    if (view === 'reports' && !canAccessModule(currentUser, MODULES.REPORTS)) {
      toast.error('No tienes acceso al módulo de Reportes');
      return;
    }
    
    if (view === 'users' && !canAccessModule(currentUser, MODULES.USERS)) {
      toast.error('No tienes acceso al módulo de Usuarios');
      return;
    }
    
    // ✅ NAVEGAR
    setCurrentView(view);
  };
  
  return (
    <div>
      <button onClick={() => handleNavigate('reports')}>Reportes</button>
      <button onClick={() => handleNavigate('users')}>Usuarios</button>
    </div>
  );
}
```

---

## 📦 SISTEMA DE VALIDACIÓN DE STOCK

### Ejemplo 1: Validar stock antes de agregar al carrito

```typescript
import { validateStockForCart } from '@/utils/stockValidation';
import { toast } from 'sonner';

function ProductGrid({ products, cartItems }: ProductGridProps) {
  
  const handleAddToCart = (product: Product) => {
    // ✅ VALIDAR STOCK ANTES DE AGREGAR
    const validation = validateStockForCart(product, cartItems, 1);
    
    if (!validation.isValid) {
      // ❌ MOSTRAR ERROR ESPECÍFICO
      toast.error(validation.message, {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }
    
    // ✅ AGREGAR AL CARRITO
    setCartItems([...cartItems, { product, quantity: 1 }]);
    
    // ✅ MOSTRAR STOCK RESTANTE
    toast.success(
      `${product.name} agregado. Quedan ${validation.availableStock} unidades`,
      { duration: 2000 }
    );
  };
  
  return (
    <div>
      {products.map(product => (
        <button 
          key={product.id}
          onClick={() => handleAddToCart(product)}
          disabled={product.stock === 0}
        >
          Agregar {product.name}
        </button>
      ))}
    </div>
  );
}
```

---

### Ejemplo 2: Validar venta completa antes de procesar

```typescript
import { validateSaleStock, updateStockAfterSale } from '@/utils/stockValidation';
import { toast } from 'sonner';

function PaymentModal({ cartItems, products, onComplete }: PaymentModalProps) {
  
  const handleCompleteSale = () => {
    // ✅ VALIDAR TODO EL CARRITO
    const validation = validateSaleStock(cartItems, products);
    
    if (!validation.isValid) {
      // ❌ MOSTRAR ERROR Y DETENER
      toast.error(validation.message, {
        duration: 4000,
        position: 'top-center',
      });
      
      // Opcional: Registrar en auditoría
      logAudit(
        'sale_created',
        'pos',
        `Venta fallida: ${validation.message}`,
        { cartItems, reason: 'stock_insufficient' },
        false // success = false
      );
      
      return;
    }
    
    // ✅ COMPLETAR VENTA
    const sale = createSale(cartItems);
    
    // ✅ ACTUALIZAR STOCK AUTOMÁTICAMENTE
    const updatedProducts = updateStockAfterSale(products, cartItems);
    setProducts(updatedProducts);
    
    onComplete(sale);
  };
  
  return (
    <button onClick={handleCompleteSale}>
      Completar Venta
    </button>
  );
}
```

---

### Ejemplo 3: Validar ajustes de inventario

```typescript
import { validateInventoryAdjustment } from '@/utils/stockValidation';
import { toast } from 'sonner';

function InventoryAdjustment({ product }: { product: Product }) {
  const [adjustmentType, setAdjustmentType] = useState<'Entrada' | 'Salida'>('Entrada');
  const [quantity, setQuantity] = useState(0);
  
  const handleSaveAdjustment = () => {
    // ✅ VALIDAR AJUSTE
    const validation = validateInventoryAdjustment(
      product,
      adjustmentType,
      quantity
    );
    
    if (!validation.isValid) {
      // ❌ MOSTRAR ERROR
      toast.error(validation.message, {
        duration: 4000,
      });
      return;
    }
    
    // ✅ APLICAR AJUSTE
    const newStock = adjustmentType === 'Entrada' 
      ? product.stock + quantity 
      : product.stock - quantity;
    
    updateProduct({ ...product, stock: newStock });
    
    toast.success(
      `Ajuste aplicado. Nuevo stock: ${newStock} unidades`
    );
  };
  
  return (
    <form onSubmit={handleSaveAdjustment}>
      <select 
        value={adjustmentType} 
        onChange={(e) => setAdjustmentType(e.target.value as any)}
      >
        <option value="Entrada">Entrada</option>
        <option value="Salida">Salida</option>
      </select>
      
      <input 
        type="number" 
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        min="1"
      />
      
      <button type="submit">Guardar Ajuste</button>
    </form>
  );
}
```

---

### Ejemplo 4: Verificar productos con stock bajo

```typescript
import { getLowStockProducts, getOutOfStockProducts } from '@/utils/stockValidation';
import { toast } from 'sonner';

function Dashboard({ products }: { products: Product[] }) {
  
  // ✅ OBTENER PRODUCTOS CON STOCK BAJO
  const lowStock = getLowStockProducts(products);
  const outOfStock = getOutOfStockProducts(products);
  
  // ✅ MOSTRAR ALERTA SI HAY PRODUCTOS CRÍTICOS
  useEffect(() => {
    if (outOfStock.length > 0) {
      toast.error(
        `¡Atención! ${outOfStock.length} producto(s) agotado(s)`,
        { duration: 5000 }
      );
    } else if (lowStock.length > 0) {
      toast.warning(
        `${lowStock.length} producto(s) con stock bajo`,
        { duration: 4000 }
      );
    }
  }, [products]);
  
  return (
    <div>
      <h2>Dashboard</h2>
      
      {/* ✅ MOSTRAR ALERTAS VISUALES */}
      {outOfStock.length > 0 && (
        <div className="alert alert-error">
          <h3>Productos Agotados</h3>
          <ul>
            {outOfStock.map(p => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
      )}
      
      {lowStock.length > 0 && (
        <div className="alert alert-warning">
          <h3>Stock Bajo</h3>
          <ul>
            {lowStock.map(p => (
              <li key={p.id}>
                {p.name} - {p.stock} unidades 
                (Mínimo: {p.minStock})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

### Ejemplo 5: Actualizar cantidad en el carrito con validación

```typescript
import { validateStockForCart } from '@/utils/stockValidation';

function CartItem({ item, cartItems, onUpdateQuantity }: CartItemProps) {
  
  const handleQuantityChange = (newQuantity: number) => {
    // ✅ VALIDAR CANTIDAD
    if (newQuantity < 1) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    
    if (newQuantity > item.product.stock) {
      toast.error(
        `Solo hay ${item.product.stock} unidades disponibles de ${item.product.name}`
      );
      return;
    }
    
    // ✅ ACTUALIZAR
    onUpdateQuantity(item.product.id, newQuantity);
  };
  
  return (
    <div className="cart-item">
      <h4>{item.product.name}</h4>
      
      <div className="quantity-controls">
        <button 
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          -
        </button>
        
        <input 
          type="number"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(Number(e.target.value))}
          min="1"
          max={item.product.stock}
        />
        
        <button 
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={item.quantity >= item.product.stock}
        >
          +
        </button>
      </div>
      
      <p className="stock-info">
        Stock disponible: {item.product.stock - item.quantity}
      </p>
    </div>
  );
}
```

---

## 🔄 SINCRONIZACIÓN DE DATOS

### Ejemplo 1: Actualizar múltiples estados después de una venta

```typescript
function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  
  const handleCompleteSale = (
    cartItems: CartItem[],
    customer?: Customer,
    paymentMethod: PaymentMethod
  ) => {
    const total = calculateTotal(cartItems);
    const pointsEarned = Math.floor(total / 10);
    
    // 1️⃣ ACTUALIZAR STOCK
    const updatedProducts = updateStockAfterSale(products, cartItems);
    setProducts(updatedProducts);
    
    // 2️⃣ ACTUALIZAR PUNTOS DEL CLIENTE
    if (customer && pointsEarned > 0) {
      const updatedCustomers = customers.map(c =>
        c.id === customer.id
          ? { ...c, loyaltyPoints: c.loyaltyPoints + pointsEarned }
          : c
      );
      setCustomers(updatedCustomers);
      
      toast.success(`¡${customer.name} ganó ${pointsEarned} puntos!`);
    }
    
    // 3️⃣ ACTUALIZAR TURNO ACTIVO
    if (activeShift) {
      setActiveShift(prev => ({
        ...prev!,
        totalSales: prev!.totalSales + total,
        salesCount: prev!.salesCount + 1,
        salesCash: paymentMethod === 'cash' 
          ? prev!.salesCash + total 
          : prev!.salesCash,
        salesCard: paymentMethod === 'card' 
          ? prev!.salesCard + total 
          : prev!.salesCard,
      }));
    }
    
    // 4️⃣ GUARDAR VENTA
    const sale = createSale(cartItems, customer, paymentMethod);
    setSales([sale, ...sales]);
    
    // 5️⃣ REGISTRAR EN AUDITORÍA
    logAudit(
      'sale_created',
      'pos',
      `Venta por $${total} - ${cartItems.length} artículos`,
      { saleId: sale.id, total, customer: customer?.id }
    );
  };
}
```

---

### Ejemplo 2: Pasar currentUser a componentes hijos

```typescript
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  return (
    <div>
      {currentView === 'products' && (
        <ProductManagement
          products={products}
          onUpdateProducts={setProducts}
          suppliers={suppliers}
          currentUser={currentUser} // ✅ PASAR currentUser
        />
      )}
      
      {currentView === 'inventory' && (
        <InventoryManagement
          products={products}
          onUpdateProducts={setProducts}
          currentUser={currentUser} // ✅ PASAR currentUser
        />
      )}
      
      {currentView === 'cash' && (
        <CashRegisterManagement
          sales={sales}
          onSaveShift={handleSaveShift}
          currentUser={currentUser} // ✅ PASAR currentUser
        />
      )}
    </div>
  );
}
```

---

## 🎨 COMPONENTE DE ALERTA DE PERMISOS

### Uso del componente PermissionAlert

```typescript
import { PermissionAlert } from '@/app/components/common/PermissionAlert';

function MyComponent({ currentUser }: { currentUser: User | null }) {
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  
  const handleDeleteProduct = () => {
    if (!hasPermission(currentUser, MODULES.PRODUCTS, 'delete')) {
      setShowPermissionAlert(true);
      return;
    }
    
    // ... eliminar producto
  };
  
  return (
    <div>
      <button onClick={handleDeleteProduct}>
        Eliminar
      </button>
      
      {/* ✅ MODAL DE ALERTA */}
      {showPermissionAlert && (
        <PermissionAlert
          action="eliminar productos"
          module="Productos"
          userName={currentUser?.fullName}
        />
      )}
    </div>
  );
}
```

---

## 📝 REGISTRO EN AUDITORÍA

### Ejemplo: Registrar eventos con success/failure

```typescript
// ✅ EVENTO EXITOSO
logAudit(
  'product_created',
  'products',
  `Producto "${product.name}" creado correctamente`,
  { productId: product.id, price: product.price },
  true // ← success
);

// ❌ EVENTO FALLIDO
logAudit(
  'product_deleted',
  'products',
  `Intento de eliminación bloqueado - Sin permisos`,
  { productId, userId: currentUser?.id },
  false // ← failure
);

// ❌ VENTA FALLIDA POR STOCK
logAudit(
  'sale_created',
  'pos',
  `Venta fallida: Stock insuficiente de ${product.name}`,
  { items: cartItems.length, reason: 'stock_insufficient' },
  false // ← failure
);
```

---

## 🎯 MEJORES PRÁCTICAS

### ✅ DO (Hacer)
```typescript
// ✅ Siempre validar permisos ANTES de la acción
if (!hasPermission(user, module, action)) {
  toast.error('Sin permisos');
  return;
}

// ✅ Validar stock ANTES de agregar al carrito
const validation = validateStockForCart(product, cart, qty);
if (!validation.isValid) {
  toast.error(validation.message);
  return;
}

// ✅ Actualizar stock DESPUÉS de completar venta
const updatedProducts = updateStockAfterSale(products, cartItems);
setProducts(updatedProducts);

// ✅ Registrar TODOS los eventos importantes
logAudit(action, module, description, details, success);
```

### ❌ DON'T (No hacer)
```typescript
// ❌ NO validar permisos después de la acción
deleteProduct(id);
if (!hasPermission(user, 'products', 'delete')) { // Tarde!
  console.log('Oops');
}

// ❌ NO asumir que hay stock disponible
cartItems.push({ product, quantity: 999 }); // Peligro!

// ❌ NO olvidar actualizar el stock
completeSale(cartItems);
// ... pero el stock sigue igual

// ❌ NO usar datos hardcodeados
const mockUser = { role: 'admin' }; // Usar currentUser real!
```

---

## 🔧 UTILIDADES DISPONIBLES

### Módulos de constantes:
```typescript
MODULES.SALES         // 'sales'
MODULES.PRODUCTS      // 'products'
MODULES.INVENTORY     // 'inventory'
MODULES.CUSTOMERS     // 'customers'
MODULES.PROMOTIONS    // 'promotions'
MODULES.REPORTS       // 'reports'
MODULES.CASH          // 'cash'
MODULES.SERVICES      // 'services'
MODULES.PURCHASES     // 'purchases'
MODULES.USERS         // 'users'
MODULES.AUDIT         // 'audit'
MODULES.DASHBOARD     // 'dashboard'
```

### Funciones de stock:
```typescript
validateStockForCart(product, cartItems, quantity)
validateSaleStock(cartItems, products)
validateInventoryAdjustment(product, type, quantity)
updateStockAfterSale(products, cartItems)
getLowStockProducts(products)
getOutOfStockProducts(products)
calculateInventoryValue(products)
ensureNonNegativeStock(stock)
```

### Funciones de permisos:
```typescript
hasPermission(user, module, action)
canAccessModule(user, module)
getPermittedActions(user, module)
```

---

**Última actualización:** 27 de enero de 2026  
**Versión:** 2.0.0-security
