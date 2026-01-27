# Sistema POS - Punto de Venta Completo

Sistema de Punto de Venta moderno, táctil y responsive con backend Node.js y MongoDB.

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + MongoDB
- **Base de Datos**: MongoDB
- **Autenticación**: JWT (JSON Web Tokens)

## 📋 Características Principales

### Frontend
- ✅ Interfaz táctil responsive (móvil, tablet, desktop)
- ✅ Sistema de ventas con carrito dinámico
- ✅ Gestión de productos con códigos de barras y QR
- ✅ Módulo de clientes con NFC y programa de lealtad
- ✅ Sistema de créditos y préstamos
- ✅ Gestión de caja y turnos
- ✅ Reportes y análisis
- ✅ Promociones y cupones
- ✅ Pago de servicios (luz, agua, teléfono, etc.)
- ✅ Recargas telefónicas
- ✅ Gestión de compras y proveedores
- ✅ Sistema de usuarios con roles y permisos
- ✅ Auditoría completa de acciones

### Backend
- ✅ API RESTful completa
- ✅ Autenticación con JWT
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Validación de datos
- ✅ Sistema de auditoría automático
- ✅ Control de stock en tiempo real
- ✅ Manejo de roles y permisos

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 18 o superior
- MongoDB 6.0 o superior
- npm o yarn

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd pos-system
```

### 2. Configurar Backend

```bash
cd server
npm install
```

Crear archivo `.env` en `/server`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pos_db
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=development
```

Inicializar base de datos:

```bash
npm run seed
```

Esto creará un usuario administrador:
- **Usuario**: admin
- **Contraseña**: admin123

Iniciar servidor backend:

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en: `http://localhost:5000`

### 3. Configurar Frontend

```bash
# Volver a la raíz del proyecto
cd ..

# Instalar dependencias
npm install
```

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:5000/api
```

Iniciar aplicación frontend:

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## 🔐 Primer Acceso

1. Abrir `http://localhost:5173` en el navegador
2. Iniciar sesión con:
   - Usuario: `admin`
   - Contraseña: `admin123`

3. **IMPORTANTE**: Cambiar la contraseña del administrador después del primer acceso

## 📁 Estructura del Proyecto

```
pos-system/
├── server/                  # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Configuración (DB, etc.)
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── middleware/     # Middlewares (auth, etc.)
│   │   ├── models/         # Modelos de MongoDB
│   │   ├── routes/         # Definición de rutas
│   │   ├── scripts/        # Scripts de utilidad
│   │   └── index.js        # Punto de entrada
│   ├── package.json
│   └── README.md
│
├── src/                     # Frontend (React + TypeScript)
│   ├── app/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Hooks personalizados
│   │   └── App.tsx         # Componente principal
│   ├── config/             # Configuración del frontend
│   ├── services/           # Servicios API
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades
│   └── styles/             # Estilos globales
│
├── package.json
└── README.md
```

## 🗄️ Base de Datos

### Colecciones MongoDB

- **users**: Usuarios del sistema
- **products**: Productos del inventario
- **sales**: Ventas realizadas
- **customers**: Clientes registrados
- **suppliers**: Proveedores
- **servicepayments**: Pagos de servicios
- **auditlogs**: Logs de auditoría

## 🔑 API Endpoints

Ver documentación completa en `/server/README.md`

### Principales Endpoints

- **Auth**: `/api/auth/*`
- **Productos**: `/api/products/*`
- **Ventas**: `/api/sales/*`
- **Clientes**: `/api/customers/*`
- **Proveedores**: `/api/suppliers/*`
- **Servicios**: `/api/services/*`
- **Auditoría**: `/api/audit/*`
- **Usuarios**: `/api/users/*`

## 👥 Roles y Permisos

### Administrador (admin)
- Acceso total al sistema
- Gestión de usuarios
- Configuración del sistema
- Acceso a auditoría

### Supervisor (supervisor)
- Gestión de inventario
- Gestión de proveedores
- Gestión de promociones
- Reportes avanzados
- Cancelación de ventas

### Cajero (cashier)
- Ventas
- Gestión básica de clientes
- Recargas y servicios
- Consulta de inventario

## 🛡️ Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ Autenticación JWT
- ✅ Tokens con expiración
- ✅ Validación de permisos por rol
- ✅ Logs de auditoría completos
- ✅ HTTPS recomendado en producción

## 🚀 Despliegue en Producción

### Backend

1. Configurar MongoDB Atlas o servidor MongoDB
2. Actualizar variables de entorno:
   ```env
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/pos_db
   JWT_SECRET=clave_super_segura_aleatoria
   NODE_ENV=production
   ```
3. Desplegar en servicios como:
   - Heroku
   - DigitalOcean
   - AWS EC2
   - Railway
   - Render

### Frontend

1. Actualizar `.env`:
   ```env
   VITE_API_URL=https://tu-api.com/api
   ```
2. Build del proyecto:
   ```bash
   npm run build
   ```
3. Desplegar carpeta `dist` en:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - DigitalOcean App Platform

## 🔧 Scripts Disponibles

### Frontend
- `npm run dev` - Modo desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de build

### Backend
- `npm run dev` - Modo desarrollo con nodemon
- `npm start` - Modo producción
- `npm run seed` - Inicializar base de datos

## 📚 Tecnologías Utilizadas

### Frontend
- React 18
- TypeScript
- Tailwind CSS v4
- Vite
- Lucide Icons
- Sonner (Toasts)
- QR Code / Barcode generators

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- CORS
- Morgan (logging)

## 🐛 Solución de Problemas

### Error de conexión a MongoDB
```bash
# Verificar que MongoDB esté corriendo
mongod

# O iniciar servicio
sudo systemctl start mongod
```

### Error de CORS
Verificar que el backend tenga CORS habilitado y la URL del frontend esté permitida.

### Token expirado
El token JWT expira después de 24 horas. Volver a hacer login.

## 📞 Soporte

Para reportar problemas o solicitar características, crear un issue en el repositorio.

## 📄 Licencia

Este proyecto es de uso privado.

---

**Desarrollado con ❤️ para modernizar tu punto de venta**
