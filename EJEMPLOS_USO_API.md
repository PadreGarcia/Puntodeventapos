# 📚 Ejemplos de Uso - API Integrada

## 🎯 Cómo Usar POSContext en tus Componentes

### Ejemplo 1: Listar Productos

```tsx
import { usePOS } from '@/app/contexts/POSContext';

function MiComponenteProductos() {
  const { products, loadingProducts } = usePOS();

  if (loadingProducts) {
    return <div>Cargando productos...</div>;
  }

  return (
    <div>
      <h2>Productos Disponibles</h2>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>Precio: ${product.price}</p>
          <p>Stock: {product.stock} unidades</p>
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 2: Crear Producto Nuevo

```tsx
import { usePOS } from '@/app/contexts/POSContext';
import { useState } from 'react';
import { toast } from 'sonner';

function FormularioNuevoProducto() {
  const { addProduct } = usePOS();
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState(0);
  const [stock, setStock] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevoProducto = {
      name: nombre,
      price: precio,
      cost: precio * 0.6, // 40% margen
      category: 'bebidas',
      stock: stock,
      minStock: 10,
      barcode: `${Date.now()}`, // Código temporal
      image: 'https://images.unsplash.com/photo-1...'
    };

    const exito = await addProduct(nuevoProducto);

    if (exito) {
      toast.success('Producto creado exitosamente');
      setNombre('');
      setPrecio(0);
      setStock(0);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del producto"
      />
      <input
        type="number"
        value={precio}
        onChange={(e) => setPrecio(Number(e.target.value))}
        placeholder="Precio"
      />
      <input
        type="number"
        value={stock}
        onChange={(e) => setStock(Number(e.target.value))}
        placeholder="Stock inicial"
      />
      <button type="submit">Crear Producto</button>
    </form>
  );
}
```

### Ejemplo 3: Actualizar Producto

```tsx
import { usePOS } from '@/app/contexts/POSContext';

function EditarProducto({ productId }: { productId: string }) {
  const { products, updateProduct } = usePOS();
  const producto = products.find(p => p.id === productId);

  const handleCambiarPrecio = async () => {
    const nuevoPrecio = prompt('Nuevo precio:', String(producto?.price));
    
    if (nuevoPrecio && producto) {
      const exito = await updateProduct(productId, {
        ...producto,
        price: Number(nuevoPrecio)
      });

      if (exito) {
        toast.success('Precio actualizado');
      }
    }
  };

  return (
    <div>
      <h3>{producto?.name}</h3>
      <p>Precio actual: ${producto?.price}</p>
      <button onClick={handleCambiarPrecio}>
        Cambiar Precio
      </button>
    </div>
  );
}
```

### Ejemplo 4: Ajustar Inventario

```tsx
import { usePOS } from '@/app/contexts/POSContext';

function AjustarStock({ productId }: { productId: string }) {
  const { adjustInventory, products } = usePOS();
  const producto = products.find(p => p.id === productId);

  const handleAjuste = async () => {
    const cantidadStr = prompt('Cantidad (+/-):', '0');
    const motivo = prompt('Motivo del ajuste:');
    
    if (cantidadStr && motivo) {
      const cantidad = Number(cantidadStr);
      
      const exito = await adjustInventory(
        productId,
        cantidad,
        motivo
      );

      if (exito) {
        toast.success(`Inventario ajustado: ${cantidad > 0 ? '+' : ''}${cantidad}`);
      }
    }
  };

  return (
    <div>
      <h3>{producto?.name}</h3>
      <p>Stock actual: {producto?.stock}</p>
      <button onClick={handleAjuste}>
        Ajustar Inventario
      </button>
    </div>
  );
}
```

### Ejemplo 5: Proceso de Venta Completo

```tsx
import { usePOS } from '@/app/contexts/POSContext';
import { useState } from 'react';

function ProcesoVenta() {
  const {
    products,
    cartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    createSale,
    clearCart
  } = usePOS();

  const [mostrarPago, setMostrarPago] = useState(false);

  // Calcular totales
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleProcesarVenta = async () => {
    const venta = {
      items: cartItems,
      subtotal,
      tax,
      total,
      paymentMethod: 'cash' as const,
      date: new Date()
    };

    const ventaCreada = await createSale(venta);

    if (ventaCreada) {
      toast.success('Venta procesada exitosamente');
      setMostrarPago(false);
    }
  };

  return (
    <div>
      {/* Lista de productos */}
      <div>
        <h3>Productos Disponibles</h3>
        {products.map(product => (
          <div key={product.id}>
            <span>{product.name} - ${product.price}</span>
            <button onClick={() => addToCart(product)}>
              Agregar
            </button>
          </div>
        ))}
      </div>

      {/* Carrito */}
      <div>
        <h3>Carrito ({cartItems.length} items)</h3>
        {cartItems.map(item => (
          <div key={item.product.id}>
            <span>{item.product.name}</span>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateCartQuantity(
                item.product.id,
                Number(e.target.value)
              )}
              min="1"
              max={item.product.stock}
            />
            <button onClick={() => removeFromCart(item.product.id)}>
              Eliminar
            </button>
          </div>
        ))}
        
        <div>
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>IVA (16%): ${tax.toFixed(2)}</p>
          <p><strong>Total: ${total.toFixed(2)}</strong></p>
        </div>

        <button
          onClick={() => setMostrarPago(true)}
          disabled={cartItems.length === 0}
        >
          Procesar Venta
        </button>
      </div>

      {/* Modal de pago */}
      {mostrarPago && (
        <div>
          <h3>Confirmar Venta</h3>
          <p>Total a cobrar: ${total.toFixed(2)}</p>
          <button onClick={handleProcesarVenta}>
            Confirmar
          </button>
          <button onClick={() => setMostrarPago(false)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
```

### Ejemplo 6: Buscar Cliente por NFC

```tsx
import { usePOS } from '@/app/contexts/POSContext';
import { useState } from 'react';

function LectorNFC() {
  const { getCustomerByNFC } = usePOS();
  const [nfcId, setNfcId] = useState('');
  const [cliente, setCliente] = useState(null);

  const handleEscanear = async () => {
    const clienteEncontrado = await getCustomerByNFC(nfcId);
    
    if (clienteEncontrado) {
      setCliente(clienteEncontrado);
      toast.success(`Cliente encontrado: ${clienteEncontrado.name}`);
    } else {
      toast.error('Tarjeta NFC no registrada');
    }
  };

  return (
    <div>
      <h3>Escanear Tarjeta NFC</h3>
      <input
        value={nfcId}
        onChange={(e) => setNfcId(e.target.value)}
        placeholder="ID de tarjeta NFC"
      />
      <button onClick={handleEscanear}>
        Escanear
      </button>

      {cliente && (
        <div>
          <h4>Cliente: {cliente.name}</h4>
          <p>Puntos: {cliente.loyaltyPoints}</p>
          <p>Nivel: {cliente.loyaltyTier}</p>
          <p>Total gastado: ${cliente.totalSpent}</p>
        </div>
      )}
    </div>
  );
}
```

### Ejemplo 7: Usar Hook useApi Directamente

```tsx
import { useApi } from '@/app/hooks/useApi';
import { api } from '@/services/api';
import { useEffect } from 'react';

function ReporteVentas() {
  const { 
    data: ventas, 
    loading, 
    error, 
    execute 
  } = useApi(api.getSales, {
    showSuccessToast: false
  });

  useEffect(() => {
    execute({
      startDate: '2026-01-01',
      endDate: '2026-01-31'
    });
  }, [execute]);

  if (loading) return <div>Cargando ventas...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Ventas del Mes</h3>
      <p>Total de ventas: {ventas?.data.length}</p>
      {ventas?.data.map(venta => (
        <div key={venta.id}>
          <p>Venta #{venta.id}</p>
          <p>Total: ${venta.total}</p>
          <p>Fecha: {new Date(venta.date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 8: Componente de Dashboard Personalizado

```tsx
import { usePOS } from '@/app/contexts/POSContext';
import { useEffect, useMemo } from 'react';

function DashboardPersonalizado() {
  const { 
    products, 
    sales, 
    loadProducts, 
    loadSales 
  } = usePOS();

  useEffect(() => {
    loadProducts();
    loadSales();
  }, [loadProducts, loadSales]);

  // Calcular métricas
  const metricas = useMemo(() => {
    const totalProductos = products.length;
    const productosSinStock = products.filter(p => p.stock === 0).length;
    const productosStockBajo = products.filter(
      p => p.minStock && p.stock <= p.minStock
    ).length;
    
    const totalVentas = sales.reduce((sum, s) => sum + s.total, 0);
    const ventasHoy = sales.filter(s => {
      const hoy = new Date().toDateString();
      const fechaVenta = new Date(s.date).toDateString();
      return hoy === fechaVenta;
    }).length;

    return {
      totalProductos,
      productosSinStock,
      productosStockBajo,
      totalVentas,
      ventasHoy
    };
  }, [products, sales]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3>Productos</h3>
        <p className="text-3xl font-bold">{metricas.totalProductos}</p>
        <p className="text-red-600">{metricas.productosSinStock} sin stock</p>
        <p className="text-orange-600">{metricas.productosStockBajo} stock bajo</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3>Ventas Totales</h3>
        <p className="text-3xl font-bold">${metricas.totalVentas.toFixed(2)}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3>Ventas Hoy</h3>
        <p className="text-3xl font-bold">{metricas.ventasHoy}</p>
      </div>
    </div>
  );
}
```

## 🔧 Ejemplos de Llamadas API Directas

### Ejemplo 9: Crear Producto sin Contexto

```tsx
import { api } from '@/services/api';

async function crearProductoManual() {
  try {
    const response = await api.createProduct({
      name: 'Coca Cola 600ml',
      price: 15,
      cost: 10,
      category: 'bebidas',
      stock: 50,
      minStock: 10,
      barcode: '7501234567890',
      image: 'https://...'
    });

    if (response.success) {
      console.log('Producto creado:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Ejemplo 10: Buscar Producto por Barcode

```tsx
import { api } from '@/services/api';

async function buscarPorCodigoBarras(codigo: string) {
  try {
    const response = await api.getProductByBarcode(codigo);
    
    if (response.success) {
      console.log('Producto encontrado:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Producto no encontrado:', error.message);
    return null;
  }
}

// Uso
const producto = await buscarPorCodigoBarras('7501234567890');
```

### Ejemplo 11: Crear Venta Completa

```tsx
import { api } from '@/services/api';

async function crearVenta() {
  const venta = {
    items: [
      {
        product: {
          id: 'producto-123',
          name: 'Coca Cola',
          price: 15,
          image: '...',
          category: 'bebidas'
        },
        quantity: 2
      },
      {
        product: {
          id: 'producto-456',
          name: 'Sabritas',
          price: 12,
          image: '...',
          category: 'snacks'
        },
        quantity: 1
      }
    ],
    subtotal: 42,
    tax: 6.72,
    total: 48.72,
    paymentMethod: 'cash',
    amountReceived: 50,
    change: 1.28
  };

  try {
    const response = await api.createSale(venta);
    
    if (response.success) {
      console.log('Venta creada:', response.data);
      // El backend ya actualizó el stock automáticamente
      return response.data;
    }
  } catch (error) {
    console.error('Error al crear venta:', error.message);
  }
}
```

### Ejemplo 12: Ajustar Inventario Manual

```tsx
import { api } from '@/services/api';

async function ajustarInventario(
  productId: string,
  cantidad: number,
  motivo: string
) {
  try {
    const response = await api.adjustInventory(
      productId,
      cantidad,
      motivo
    );
    
    if (response.success) {
      console.log('Stock ajustado:', response.data);
      console.log('Stock nuevo:', response.data.stock);
      return response.data;
    }
  } catch (error) {
    console.error('Error al ajustar:', error.message);
  }
}

// Ejemplos de uso:
await ajustarInventario('prod-123', +50, 'Recepción de mercancía');
await ajustarInventario('prod-456', -5, 'Producto dañado');
await ajustarInventario('prod-789', +100, 'Corrección de inventario');
```

## 🎨 Patrón Recomendado

### Layout del Sistema

```tsx
import { POSProvider } from '@/app/contexts/POSContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <POSProvider>
      <MiAplicacion />
      <Toaster position="top-center" richColors />
    </POSProvider>
  );
}

function MiAplicacion() {
  // Aquí todos los componentes tienen acceso a usePOS()
  return (
    <div>
      <Header />
      <Main />
      <Footer />
    </div>
  );
}
```

### Componente Reutilizable

```tsx
import { usePOS } from '@/app/contexts/POSContext';

interface ProductCardProps {
  productId: string;
  onAddToCart?: () => void;
}

function ProductCard({ productId, onAddToCart }: ProductCardProps) {
  const { products, addToCart } = usePOS();
  const product = products.find(p => p.id === productId);

  if (!product) return null;

  const handleClick = () => {
    addToCart(product);
    onAddToCart?.();
  };

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <p>Stock: {product.stock}</p>
      <button
        onClick={handleClick}
        disabled={product.stock === 0}
      >
        {product.stock > 0 ? 'Agregar' : 'Sin stock'}
      </button>
    </div>
  );
}
```

## 📚 Recursos Adicionales

### TypeScript Types

```typescript
import type { Product, Sale, Customer, CartItem } from '@/types/pos';

// Todos los tipos están disponibles
const producto: Product = { ... };
const venta: Sale = { ... };
const cliente: Customer = { ... };
```

### Helpers y Utilidades

```typescript
import { validateStockForCart } from '@/utils/stockValidation';
import { hasPermission, MODULES } from '@/utils/permissions';

// Validar stock antes de agregar
const validation = validateStockForCart(product, cartItems, quantity);
if (!validation.isValid) {
  console.log(validation.message);
}

// Verificar permisos
const canEdit = hasPermission(currentUser, MODULES.PRODUCTS, 'edit');
```

---

## 🎯 Mejores Prácticas

1. **Siempre usar POSContext** para operaciones con productos, ventas y clientes
2. **Manejar estados de carga** con `loadingProducts`, `loadingSales`, etc.
3. **Capturar errores** en bloques try/catch
4. **Mostrar feedback** al usuario con toasts
5. **Validar permisos** antes de operaciones críticas
6. **Recargar datos** después de cambios importantes (ventas, ajustes)

**¡El sistema está listo para usar!** 🚀
