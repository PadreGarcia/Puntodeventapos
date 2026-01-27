# 🗺️ Estructura de Navegación del POS

## 📋 Opciones del Sidebar (13 módulos)

El sistema tiene **13 opciones principales** en el sidebar, organizadas según permisos de usuario:

| # | Módulo | Ícono | Label | Permisos | Descripción |
|---|--------|-------|-------|----------|-------------|
| 1 | **Dashboard** | 🏠 Home | Dashboard | Todos | Panel principal con métricas |
| 2 | **Sales** | 🛒 ShoppingCart | Punto de Venta | Todos | Ventas en mostrador |
| 3 | **Products** | 📦 Box | Productos | view | Gestión de productos |
| 4 | **Inventory** | 📦 Package | Inventario | view | Control de stock |
| 5 | **Purchases** | 🛍️ ShoppingBag | Compras | Admin/Supervisor | Compras a proveedores |
| 6 | **Cash** | 💰 Wallet | Caja | view | Control de turnos y caja |
| 7 | **Customers** | 👥 Users | Clientes | view | CRM completo |
| 8 | **Promotions** | 🏷️ Percent | Promociones | view | Descuentos y ofertas |
| 9 | **Services** | 🧾 Receipt | Servicios | view | Pago de servicios |
| 10 | **Recharges** | 📱 Smartphone | Recargas | Todos | Recargas telefónicas |
| 11 | **Reports** | 📊 BarChart3 | Reportes | Admin/Supervisor | Análisis y estadísticas |
| 12 | **Users** | ⚙️ Settings | Usuarios | Admin | Gestión de usuarios |
| 13 | **Audit** | 🛡️ Shield | Auditoría | Admin/Supervisor | Logs de seguridad |

---

## 📑 Estructura de Tabs por Módulo

### 1️⃣ Dashboard
**Sin tabs** - Vista única con métricas y gráficos

**Contenido:**
- Métricas de ventas del día
- Gráfico de ventas por hora
- Top 5 productos más vendidos
- Alertas de stock bajo
- Resumen de caja
- Ventas por método de pago

---

### 2️⃣ Punto de Venta
**Sin tabs** - Interfaz única de venta

**Componentes:**
- Header (reloj, usuario, turno)
- Barra de búsqueda y escáner
- Grid de productos
- Carrito lateral (desktop) / flotante (mobile)
- Modal de pago
- Modal de confirmación

---

### 3️⃣ Productos
**Sin tabs** - Vista única con filtros

**Características:**
- Vista en grid/tabla (toggle)
- Búsqueda por nombre/código de barras
- Filtros por categoría
- Filtros por proveedor
- Ordenamiento múltiple
- Formulario crear/editar producto
- Generador de códigos QR y barras
- Impresión de etiquetas

---

### 4️⃣ Inventario
**Sin tabs** - Vista única con controles

**Características:**
- Vista en grid/tabla (toggle)
- Búsqueda de productos
- Filtros por categoría
- Filtros por estado de stock
- Ajustes de inventario (con permisos)
- Historial de movimientos
- Alertas de stock bajo

---

### 5️⃣ Compras
**5 Tabs:**

| Tab | Label | Ícono | Descripción |
|-----|-------|-------|-------------|
| 1 | Proveedores | 👥 Users | Gestión de proveedores |
| 2 | Órdenes de Compra | 🛒 ShoppingCart | Crear y gestionar órdenes |
| 3 | Recepción | 📦 Package | Recibir mercancía |
| 4 | Facturas | 📄 FileText | Facturas de proveedores |
| 5 | Cuentas por Pagar | 💳 CreditCard | Adeudos a proveedores |

---

### 6️⃣ Caja
**5 Tabs:**

| Tab | Label | Ícono | Descripción | Estado |
|-----|-------|-------|-------------|--------|
| 1 | Apertura de Caja | 💰 DollarSign | Abrir turno | Disabled si hay caja abierta |
| 2 | Retiros/Ingresos | 📈 TrendingUp | Movimientos de efectivo | Disabled si no hay caja abierta |
| 3 | Arqueo | 🧮 Calculator | Conteo de efectivo | Disabled si no hay caja abierta |
| 4 | Corte de Caja | ✂️ Scissors | Cerrar turno | Disabled si no hay caja abierta |
| 5 | Historial de Turnos | 📜 History | Turnos anteriores | Siempre disponible |

---

### 7️⃣ Clientes (CRM)
**5 Tabs:**

| Tab | Label | Ícono | Descripción | Contador |
|-----|-------|-------|-------------|----------|
| 1 | Clientes | 👥 Users | Lista de clientes | Total de clientes |
| 2 | Tarjetas NFC | 📡 Wifi | Gestión de tarjetas | Total de tarjetas |
| 3 | Programa de Lealtad | 🏆 Award | Puntos y niveles | Total de transacciones |
| 4 | Cuentas por Cobrar | 💳 CreditCard | Sistema de fiado | Cuentas pendientes |
| 5 | Préstamos | 💵 DollarSign | Pr��stamos activos | Préstamos activos |

**Sub-vista:**
- **Detalle de Cliente** (se abre al hacer clic en un cliente)

---

### 8️⃣ Promociones
**4 Tabs:**

| Tab | Label | Ícono | Descripción | Contador |
|-----|-------|-------|-------------|----------|
| 1 | Promociones | 🏷️ Percent | Lista de promociones | Promociones activas |
| 2 | Ofertas Activas | ⚡ Zap | Ofertas en curso | Ofertas activas |
| 3 | Cupones | 🎫 Tag | Gestión de cupones | Cupones activos |
| 4 | Crear Promoción | 🎁 Gift | Wizard de creación | - |

---

### 9️⃣ Servicios
**Sin tabs** - Interfaz única de pago de servicios

**Categorías de Servicios:**
1. ⚡ **Energía** (CFE)
2. 📞 **Telecomunicaciones** (Telmex, Telcel, AT&T, Movistar, Izzi, Totalplay, Sky, Dish)
3. 💧 **Agua y Gas** (Agua Municipal, Naturgy)
4. 🏛️ **Gobierno** (Predial, Tenencia, Infracciones)
5. 🎮 **Entretenimiento** (Netflix, Spotify, Disney+, HBO Max)
6. 💳 **Financieros** (Tarjetas de Crédito)

**Total:** 18 proveedores de servicios

---

### 🔟 Recargas
**Sin tabs** - Interfaz única de recargas

**Operadores disponibles:**
- Telcel
- AT&T
- Movistar
- Unefon
- Virgin Mobile

---

### 1️⃣1️⃣ Reportes
**11 Tipos de Reportes** (selección tipo card):

| # | Reporte | Ícono | Color | Descripción |
|---|---------|-------|-------|-------------|
| 1 | **Ventas** | 📈 TrendingUp | Azul | Análisis de ventas por período |
| 2 | **Productos** | 📦 Package | Morado | Top productos más vendidos |
| 3 | **Categorías** | 📚 Layers | Índigo | Ventas por categoría |
| 4 | **Cajeros & Turnos** | 👥 Users | Cian | Desempeño de cajeros |
| 5 | **Utilidades** | 💰 DollarSign | Verde | Márgenes y rentabilidad |
| 6 | **Inventario** | 🛍️ ShoppingBag | Naranja | Stock y rotación |
| 7 | **Clientes** | 🎯 Target | Rosa | Análisis de clientes |
| 8 | **Programa de Lealtad** | 🏆 Award | Amarillo | Puntos y niveles |
| 9 | **Promociones** | 🏷️ Percent | Rojo | ROI de promociones |
| 10 | **Crédito & Préstamos** | 💳 CreditCard | Teal | Cuentas por cobrar |
| 11 | **Pago de Servicios** | 🧾 Receipt | Violeta | Comisiones generadas |

**Cada reporte se abre en vista completa con:**
- Botón de regreso
- Filtros de fecha
- Gráficos interactivos
- Tablas de datos
- Exportación a Excel/PDF

---

### 1️⃣2️⃣ Usuarios
**Sin tabs** - Vista única de gestión

**Funcionalidades:**
- Lista de usuarios
- Crear usuario
- Editar usuario
- Eliminar usuario
- Cambiar roles
- Resetear contraseña
- Activar/Desactivar

---

### 1️⃣3️⃣ Auditoría
**Sin tabs** - Vista única de logs

**Características:**
- Lista de eventos de auditoría
- Filtros por:
  - Usuario
  - Módulo
  - Acción
  - Fecha
  - Criticidad (info, warning, critical)
- Vista detallada de cada evento
- Exportación de logs

---

## 📊 Resumen de Navegación

### Por Cantidad de Tabs

| Módulo | Tabs | Tipo |
|--------|------|------|
| Compras | 5 tabs | Multi-tab |
| Caja | 5 tabs | Multi-tab |
| Clientes | 5 tabs + 1 sub-vista | Multi-tab |
| Promociones | 4 tabs | Multi-tab |
| Reportes | 11 reportes | Card selection |
| Dashboard | Vista única | Single |
| Punto de Venta | Vista única | Single |
| Productos | Vista única | Single |
| Inventario | Vista única | Single |
| Servicios | Vista única | Single |
| Recargas | Vista única | Single |
| Usuarios | Vista única | Single |
| Auditoría | Vista única | Single |

### Estadísticas

✅ **Total de módulos:** 13  
✅ **Módulos con tabs:** 4 (Compras, Caja, Clientes, Promociones)  
✅ **Módulos con reportes:** 1 (Reportes con 11 tipos)  
✅ **Módulos de vista única:** 8  
✅ **Total de tabs en el sistema:** 19 tabs  
✅ **Total de reportes:** 11 tipos  
✅ **Proveedores de servicios:** 18  
✅ **Operadores de recargas:** 5  

---

## 🎨 Estructura Visual

### Sidebar
```
┌─────────────────────┐
│  LOGO / HEADER      │
├─────────────────────┤
│  🏠 Dashboard       │
│  🛒 Punto de Venta  │
│  📦 Productos       │
│  📦 Inventario      │
│  🛍️ Compras         │ ← 5 tabs
│  💰 Caja            │ ← 5 tabs
│  👥 Clientes        │ ← 5 tabs + detalle
│  🏷️ Promociones     │ ← 4 tabs
│  🧾 Servicios       │
│  📱 Recargas        │
│  📊 Reportes        │ ← 11 reportes
│  ⚙️ Usuarios        │
│  🛡️ Auditoría       │
├─────────────────────┤
│  🚪 Cerrar Sesión   │
└─────────────────────┘
```

### Layout de Módulos con Tabs
```
┌────────────────────────────────────────────┐
│  HEADER DEL MÓDULO                         │
├────────────────────────────────────────────┤
│  [Tab 1] [Tab 2] [Tab 3] [Tab 4] [Tab 5]  │
├────────────────────────────────────────────┤
│                                            │
│  CONTENIDO DEL TAB ACTIVO                  │
│                                            │
│                                            │
└────────────────────────────────────────────┘
```

### Layout de Reportes
```
┌────────────────────────────────────────────┐
│  Reportes y Análisis                       │
│  Selecciona el tipo de reporte            │
├────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ 📈   │  │ 📦   │  │ 📚   │  │ 👥   │  │
│  │Ventas│  │Prods │  │Categ │  │Cajer │  │
│  └──────┘  └──────┘  └──────┘  └──────┘  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ 💰   │  │ 🛍️   │  │ 🎯   │  │ 🏆   │  │
│  │Utili │  │Invent│  │Client│  │Lealt │  │
│  └──────┘  └──────┘  └──────┘  └──────┘  │
│  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │ 🏷️   │  │ 💳   │  │ 🧾   │            │
│  │Promo │  │Créd  │  │Serv  │            │
│  └──────┘  └──────┘  └──────┘            │
└────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Navegación

### Navegación Principal
```
Sidebar → Módulo → [Tabs si aplica] → Contenido
```

### Navegación con Detalle (Clientes)
```
Sidebar → Clientes → Tab "Clientes" → Clic en cliente → Vista Detalle
                                                        ↓
                                                   [Botón Volver]
```

### Navegación de Reportes
```
Sidebar → Reportes → Grid de Cards → Clic en reporte → Vista del Reporte
                                                        ↓
                                                   [Botón Volver]
```

---

## 🎯 Sistema de Permisos por Módulo

| Módulo | Admin | Supervisor | Cashier |
|--------|-------|------------|---------|
| Dashboard | ✅ Full | ✅ Full | ✅ Full |
| Punto de Venta | ✅ Full | ✅ Full | ✅ Full |
| Productos | ✅ CRUD | ✅ CRUD | ✅ View* |
| Inventario | ✅ Full | ✅ Full | ✅ View |
| Compras | ✅ Full | ✅ Full | ❌ No access |
| Caja | ✅ Full | ✅ Full | ✅ Limited** |
| Clientes | ✅ Full | ✅ Full | ✅ View |
| Promociones | ✅ CRUD | ✅ CRUD | ✅ View |
| Servicios | ✅ Full | ✅ Full | ✅ Limited |
| Recargas | ✅ Full | ✅ Full | ✅ Full |
| Reportes | ✅ Full | ✅ Full | ❌ No access |
| Usuarios | ✅ Full | ❌ No access | ❌ No access |
| Auditoría | ✅ Full | ✅ View | ❌ No access |

**Notas:**
- \* Cashier puede ver productos pero con límite en cambio de precios
- \*\* Cashier puede ver caja pero no hacer retiros/cortes

---

## 🎉 Conclusión

El sistema POS tiene una **navegación bien estructurada** con:

✅ **13 módulos principales**  
✅ **4 módulos con navegación por tabs** (19 tabs en total)  
✅ **1 módulo con navegación tipo card** (11 reportes)  
✅ **8 módulos de vista única**  
✅ **Sistema de permisos por rol** bien definido  
✅ **Navegación intuitiva y responsive**  
✅ **Breadcrumbs y botones de retorno** en vistas detalladas  

**¡Un sistema completo y profesional!** 🚀
