# 🔗 Guía de Integración Backend-Frontend

## ✅ Estado de la Integración

Se ha creado una integración completa entre el frontend y el backend con los siguientes componentes:

### Archivos Creados para la Integración

#### 1. Backend (MongoDB + Express)
```
/server/
├── src/
│   ├── config/database.js          ✅ Conexión MongoDB
│   ├── controllers/                ✅ Lógica de negocio
│   ├── models/                     ✅ 7 modelos de Mongoose
│   ├── routes/                     ✅ API RESTful
│   └── middleware/auth.js          ✅ JWT + Autorización
```

#### 2. Frontend (React + TypeScript)
```
/src/
├── config/api.ts                   ✅ Configuración API
├── services/api.ts                 ✅ Servicio API completo
├── app/
│   ├── contexts/POSContext.tsx     ✅ Contexto React con API
│   ├── hooks/useApi.ts             ✅ Hook para llamadas API
│   ├── AppWithAPI.tsx              ✅ App integrada con backend
│   └── components/
│       ├── auth/LoginScreenWithAPI.tsx    ✅ Login con backend
│       ├── pos/POSView.tsx                ✅ POS con backend
│       └── pos/PaymentModalWithAPI.tsx    ✅ Ventas con backend
```

## 🚀 Cómo Usar el Sistema Integrado

### Opción 1: Usar App Integrada (Recomendado)

Editar `/src/app/App.tsx` para usar `AppWithAPI`:

```tsx
// Cambiar la exportación en /src/app/App.tsx
// De:
export default function App() { ... }

// A:
export { default } from '@/app/AppWithAPI';
```

### Opción 2: Reemplazar App.tsx Completamente

1. **Respaldar el App.tsx actual:**
```bash
mv src/app/App.tsx src/app/App.backup.tsx
```

2. **Renombrar AppWithAPI.tsx:**
```bash
mv src/app/AppWithAPI.tsx src/app/App.tsx
```

3. **Actualizar la exportación en App.tsx:**
```tsx
// Cambiar:
export default function AppWithAPI() { ... }

// Por:
export default function App() { ... }
```

### Opción 3: Integración Manual en App.tsx Existente

Si quieres mantener tu App.tsx actual y solo agregar la funcionalidad del backend:

#### Paso 1: Importar el servicio API

```tsx
import { api } from '@/services/api';
```

#### Paso 2: Reemplazar función de login

```tsx
// En lugar de buscar en un array local
const handleLogin = async (user: User) => {
  try {
    const response = await api.login(username, password);
    if (response.success) {
      setCurrentUser(response.user);
      // ... resto del código
    }
  } catch (error) {
    toast.error('Error al iniciar sesión');
  }
};
```

#### Paso 3: Cargar productos desde el backend

```tsx
// Reemplazar MOCK_PRODUCTS con:
const loadProducts = async () => {
  try {
    const response = await api.getProducts();
    if (response.success) {
      setProducts(response.data);
    }
  } catch (error) {
    toast.error('Error al cargar productos');
  }
};

// Llamar en useEffect
useEffect(() => {
  if (currentUser) {
    loadProducts();
  }
}, [currentUser]);
```

#### Paso 4: Crear ventas en el backend

```tsx
const handleCompleteSale = async (
  method: PaymentMethod,
  amountReceived?: number,
  change?: number,
  customer?: Customer
) => {
  const saleData = {
    items: cartItems,
    subtotal,
    tax,
    total,
    paymentMethod: method,
    amountReceived,
    change,
    customerId: customer?.id,
    customerName: customer?.name,
    date: new Date(),
  };

  try {
    const response = await api.createSale(saleData);
    if (response.success) {
      setCurrentSale(response.data);
      setCartItems([]);
      toast.success('Venta registrada exitosamente');
    }
  } catch (error) {
    toast.error('Error al registrar la venta');
  }
};
```

## 📋 Flujo Completo de una Venta

### 1. Usuario Hace Login
```
Frontend → POST /api/auth/login
         ← JWT Token + Datos del usuario
```

### 2. Sistema Carga Productos
```
Frontend → GET /api/products (con token JWT)
         ← Lista de productos desde MongoDB
```

### 3. Usuario Agrega Productos al Carrito
```
- Se valida stock localmente
- Se agrega al estado del carrito (React)
```

### 4. Usuario Procesa el Pago
```
Frontend → POST /api/sales (con datos de venta)
Backend:
  1. Valida stock en MongoDB
  2. Crea registro de venta
  3. Actualiza stock de productos
  4. Actualiza datos del cliente (si aplica)
  5. Crea log de auditoría
Frontend ← Venta creada exitosamente
```

### 5. Sistema Actualiza UI
```
- Limpia carrito
- Recarga productos (con stock actualizado)
- Muestra confirmación
```

## 🔧 Configuración Requerida

### 1. Variables de Entorno

**Backend** (`/server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pos_db
JWT_SECRET=tu_clave_secreta_aqui
NODE_ENV=development
```

**Frontend** (`/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Iniciar Servicios

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm run seed      # Primera vez
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

## 🎯 Componentes Disponibles

### POSContext
Proporciona acceso global a:
- `products` - Lista de productos
- `cartItems` - Items en el carrito
- `addToCart()` - Agregar producto al carrito
- `createSale()` - Crear venta en el backend
- `loadProducts()` - Recargar productos
- Y más...

**Uso:**
```tsx
import { usePOS } from '@/app/contexts/POSContext';

function MyComponent() {
  const { products, addToCart, createSale } = usePOS();
  
  // ... usar los métodos
}
```

### Hook useApi
Para llamadas API personalizadas:

```tsx
import { useApi } from '@/app/hooks/useApi';
import { api } from '@/services/api';

function MyComponent() {
  const { data, loading, execute } = useApi(api.getProducts, {
    showSuccessToast: false,
    showErrorToast: true
  });

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Cargando...</div>;
  return <div>{/* Mostrar datos */}</div>;
}
```

## 🔄 Sincronización de Datos

### Productos
```tsx
// Cargar productos
await api.getProducts();

// Crear producto
await api.createProduct({ name: 'Nuevo', price: 100, ... });

// Actualizar producto
await api.updateProduct(id, { price: 120 });

// Eliminar producto
await api.deleteProduct(id);
```

### Ventas
```tsx
// Listar ventas
await api.getSales({ startDate: '2026-01-01', endDate: '2026-01-31' });

// Crear venta
await api.createSale({ items: [...], total: 100, ... });

// Cancelar venta
await api.deleteSale(saleId);
```

### Clientes
```tsx
// Listar clientes
await api.getCustomers();

// Buscar por NFC
await api.getCustomerByNFC('12345');

// Crear cliente
await api.createCustomer({ name: 'Juan', ... });
```

## 🛡️ Seguridad

### Token JWT
- Se guarda automáticamente en `localStorage` al hacer login
- Se incluye automáticamente en todas las peticiones
- Expira después de 24 horas

### Validación de Permisos
El backend valida permisos por rol:
- **Admin**: Acceso total
- **Supervisor**: No puede eliminar usuarios
- **Cajero**: Solo ventas y consultas

## ⚠️ Consideraciones Importantes

### 1. Stock Management
El stock se maneja en el backend. Después de cada venta:
```tsx
await createSale(saleData);
await loadProducts(); // Recargar para obtener stock actualizado
```

### 2. Manejo de Errores
```tsx
try {
  await api.createSale(saleData);
} catch (error: any) {
  // error.message contiene el mensaje del backend
  toast.error(error.message);
}
```

### 3. Estados de Carga
```tsx
const { loading, data, error } = useApi(api.getProducts);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <ProductList products={data} />;
```

## 🎨 Mantener el Diseño Actual

La integración con el backend **NO afecta el diseño actual**. Solo cambia:

- ✅ De dónde vienen los datos (MongoDB en lugar de arrays locales)
- ✅ Cómo se guardan los datos (Backend API en lugar de estado local)
- ✅ Validaciones en el servidor (seguridad adicional)

El diseño y la UI permanecen **exactamente igual**.

## 📝 Ejemplo Completo

```tsx
import { usePOS } from '@/app/contexts/POSContext';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';

export function POSView() {
  const { 
    products, 
    cartItems, 
    addToCart, 
    createSale 
  } = usePOS();

  const handleCheckout = async () => {
    const saleData = {
      items: cartItems,
      total: calculateTotal(cartItems),
      paymentMethod: 'cash'
    };

    const sale = await createSale(saleData);
    
    if (sale) {
      // Venta exitosa, mostrar confirmación
      showConfirmation(sale);
    }
  };

  return (
    <div>
      <ProductGrid 
        products={products}
        onAddToCart={addToCart}
      />
      <Cart 
        items={cartItems}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
```

## ✅ Checklist de Integración

- [ ] Backend corriendo en puerto 5000
- [ ] MongoDB corriendo
- [ ] Base de datos inicializada (`npm run seed`)
- [ ] Frontend configurado con `VITE_API_URL`
- [ ] Login funciona con backend
- [ ] Productos se cargan desde MongoDB
- [ ] Ventas se guardan en MongoDB
- [ ] Stock se actualiza correctamente
- [ ] Tokens JWT se manejan automáticamente

---

**¡Todo listo para producción!** 🎉
