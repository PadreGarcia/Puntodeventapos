# 🚀 Guía de Instalación Completa - Sistema POS

Esta guía te llevará paso a paso para configurar el sistema POS completo con backend y frontend.

## ⚙️ Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** versión 18 o superior → [Descargar](https://nodejs.org/)
- **MongoDB** versión 6.0 o superior → [Descargar](https://www.mongodb.com/try/download/community)
- **Git** (opcional) → [Descargar](https://git-scm.com/)

### Verificar instalaciones

```bash
node --version    # Debe mostrar v18.0.0 o superior
npm --version     # Debe mostrar 9.0.0 o superior
mongod --version  # Debe mostrar 6.0.0 o superior
```

## 📦 Paso 1: Preparar el Proyecto

### Opción A: Si tienes Git
```bash
git clone <url-del-repositorio>
cd pos-system
```

### Opción B: Si descargaste el ZIP
1. Extraer el archivo ZIP
2. Abrir terminal en la carpeta extraída

## 🗄️ Paso 2: Configurar MongoDB

### En Windows:

1. Abrir **"Servicios"** (buscar en el menú de Windows)
2. Buscar **"MongoDB Server"**
3. Click derecho → **"Iniciar"**

O desde PowerShell (como administrador):
```powershell
net start MongoDB
```

### En macOS:

```bash
brew services start mongodb-community
```

### En Linux:

```bash
sudo systemctl start mongod
sudo systemctl enable mongod  # Para que inicie automáticamente
```

### Verificar que MongoDB esté corriendo:

```bash
mongosh

# Deberías ver algo como:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017
# ...

# Salir con:
exit
```

## 🔧 Paso 3: Configurar el Backend

### 3.1 Navegar a la carpeta del servidor

```bash
cd server
```

### 3.2 Instalar dependencias

```bash
npm install
```

Esto puede tomar varios minutos. Espera a que termine completamente.

### 3.3 Crear archivo de configuración

Copiar el archivo de ejemplo:

**Windows (PowerShell):**
```powershell
copy .env.example .env
```

**macOS/Linux:**
```bash
cp .env.example .env
```

### 3.4 Editar configuración (opcional)

Abrir el archivo `.env` con cualquier editor de texto y modificar si es necesario:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pos_db
JWT_SECRET=mi_clave_secreta_super_segura_123456
NODE_ENV=development
```

> ⚠️ **IMPORTANTE**: En producción, cambiar `JWT_SECRET` por algo único y seguro

### 3.5 Inicializar la base de datos

```bash
npm run seed
```

Deberías ver:
```
✅ MongoDB conectado: localhost
✅ Base de datos inicializada exitosamente

👤 Usuario Administrador Creado:
   Username: admin
   Password: admin123
   Role: admin
```

### 3.6 Iniciar el servidor backend

```bash
npm run dev
```

Deberías ver:
```
🚀 Servidor corriendo en puerto 5000
📍 API disponible en: http://localhost:5000/api
🏥 Health check: http://localhost:5000/api/health
```

> ✅ **Mantén esta terminal abierta**. El servidor debe estar corriendo para que el frontend funcione.

## 💻 Paso 4: Configurar el Frontend

### 4.1 Abrir una NUEVA terminal

⚠️ **No cierres la terminal del backend**. Abre una nueva terminal/ventana.

### 4.2 Navegar a la raíz del proyecto

Si estás en `/server`, vuelve atrás:

```bash
cd ..
```

Deberías estar en la carpeta raíz del proyecto (donde está `package.json` del frontend).

### 4.3 Instalar dependencias

```bash
npm install
```

Esto también puede tomar varios minutos.

### 4.4 Crear archivo de configuración

**Windows (PowerShell):**
```powershell
copy .env.example .env
```

**macOS/Linux:**
```bash
cp .env.example .env
```

### 4.5 Verificar configuración

Abrir `.env` y verificar que contenga:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4.6 Iniciar la aplicación

```bash
npm run dev
```

Deberías ver:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 🎉 Paso 5: Acceder a la Aplicación

1. Abrir navegador (Chrome, Firefox, Edge)
2. Ir a: `http://localhost:5173`
3. Verás la pantalla de login

### Iniciar sesión con el usuario administrador:

- **Usuario**: `admin`
- **Contraseña**: `admin123`

## ✅ Verificación del Sistema

### Backend funcionando:

Abrir en el navegador: `http://localhost:5000/api/health`

Deberías ver:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2026-01-27T..."
}
```

### Frontend funcionando:

- Deberías poder iniciar sesión
- Ver el dashboard
- Navegar por los diferentes módulos

## 🛑 Detener el Sistema

### Para detener el backend:

En la terminal del servidor (backend), presionar:
```
Ctrl + C
```

### Para detener el frontend:

En la terminal del frontend, presionar:
```
Ctrl + C
```

### Para detener MongoDB (opcional):

**Windows:**
```powershell
net stop MongoDB
```

**macOS:**
```bash
brew services stop mongodb-community
```

**Linux:**
```bash
sudo systemctl stop mongod
```

## 🔄 Reiniciar el Sistema

Cada vez que quieras usar la aplicación:

1. **Iniciar MongoDB** (si no está corriendo)
2. **Terminal 1** (Backend):
   ```bash
   cd server
   npm run dev
   ```

3. **Terminal 2** (Frontend):
   ```bash
   npm run dev
   ```

4. Abrir navegador en `http://localhost:5173`

## 🐛 Solución de Problemas Comunes

### "Puerto 5000 ya está en uso"

**Solución**: Cambiar el puerto en `/server/.env`:
```env
PORT=5001
```

Y en la raíz `/.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

### "Cannot connect to MongoDB"

**Solución**: Verificar que MongoDB esté corriendo:
```bash
mongosh
```

Si no conecta, iniciar MongoDB según tu sistema operativo (ver Paso 2).

### "CORS error" o "Network error"

**Solución**: 
1. Verificar que el backend esté corriendo
2. Verificar la URL en `/.env`
3. Refrescar el navegador (F5)

### Página en blanco en el frontend

**Solución**:
1. Abrir la consola del navegador (F12)
2. Ver errores en la pestaña "Console"
3. Verificar que el backend esté corriendo
4. Limpiar caché del navegador

### "Module not found" o errores de dependencias

**Solución**:
```bash
# Borrar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# O en Windows PowerShell:
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## 📞 Necesitas Ayuda?

1. Verificar que todos los pasos se hayan seguido en orden
2. Revisar los mensajes de error completos
3. Consultar el README.md para más detalles

## 🎯 Próximos Pasos

Una vez que el sistema esté funcionando:

1. **Cambiar contraseña del admin**:
   - Ir a "Usuarios" en el menú
   - Editar usuario "admin"
   - Cambiar la contraseña

2. **Crear usuarios adicionales**:
   - Supervisores
   - Cajeros

3. **Agregar productos**:
   - Ir a "Productos"
   - Crear nuevo producto

4. **Configurar proveedores**:
   - Ir a "Compras"
   - Agregar proveedores

5. **Registrar clientes**:
   - Ir a "Clientes"
   - Crear nuevo cliente

---

**¡Listo! Tu sistema POS está funcionando** 🎉
