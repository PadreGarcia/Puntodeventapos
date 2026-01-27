# 🚀 Guía Completa de Inicio - Backend POS Santander

## 📋 Índice Rápido

1. [Verificación Inicial](#1-verificación-inicial)
2. [Instalación de MongoDB](#2-instalación-de-mongodb)
3. [Configuración del Backend](#3-configuración-del-backend)
4. [Iniciar el Servidor](#4-iniciar-el-servidor)
5. [Poblar la Base de Datos](#5-poblar-la-base-de-datos)
6. [Solución de Problemas](#6-solución-de-problemas)

---

## 1. Verificación Inicial

### 1.1 Requisitos del Sistema

Verifica que tengas instalado:

```bash
# Node.js (requiere v18+)
node --version
# Debería mostrar: v18.x.x o superior

# npm
npm --version
# Debería mostrar: 9.x.x o superior
```

Si no tienes Node.js, descárgalo de: https://nodejs.org/

### 1.2 Ir al Directorio del Servidor

**Windows (PowerShell o CMD):**
```bash
cd C:\Users\Jose\workspace\Puntodeventapos\server
```

**Linux/macOS:**
```bash
cd /ruta/a/tu/proyecto/server
```

### 1.3 Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias:
- express (servidor web)
- mongoose (MongoDB ODM)
- bcryptjs (encriptación)
- jsonwebtoken (autenticación)
- dotenv (variables de entorno)
- cors (seguridad)
- morgan (logs)
- express-validator (validaciones)

### 1.4 Verificación Rápida

```bash
npm run quick-check
```

**Si todo está bien, verás:**
```
✅ VERIFICACIÓN COMPLETA: TODO CORRECTO
```

**Si hay problemas, el script te dirá exactamente qué falta.**

---

## 2. Instalación de MongoDB

El backend requiere MongoDB para funcionar. Tienes dos opciones:

### Opción A: MongoDB Local (Recomendado para desarrollo)

#### Windows

1. **Descargar MongoDB Community Server:**
   - Ve a: https://www.mongodb.com/try/download/community
   - Descarga la versión para Windows
   - Ejecuta el instalador

2. **Iniciar MongoDB:**
   ```bash
   # Crear directorio de datos (solo primera vez)
   mkdir C:\data\db
   
   # Iniciar MongoDB
   mongod --dbpath C:\data\db
   ```

3. **Verificar que funciona:**
   - Abre otra terminal
   - Ejecuta: `mongosh` o `mongo`
   - Si se conecta, MongoDB está funcionando ✅

#### macOS

```bash
# Instalar con Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community

# Verificar
mongosh
```

#### Linux (Ubuntu/Debian)

```bash
# Importar clave GPG
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Agregar repositorio
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Actualizar e instalar
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar
mongosh
```

### Opción B: MongoDB Atlas (Nube - Gratis)

1. **Crear cuenta:**
   - Ve a: https://www.mongodb.com/cloud/atlas
   - Regístrate (es gratis)

2. **Crear cluster:**
   - Crea un cluster M0 (gratis)
   - Espera a que se cree (2-3 minutos)

3. **Obtener connection string:**
   - Click en "Connect"
   - "Connect your application"
   - Copia el connection string
   - Ejemplo: `mongodb+srv://usuario:password@cluster.mongodb.net/pos_santander`

4. **Whitelist de IP:**
   - En Atlas, ve a "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (solo para desarrollo)

5. **Configurar en .env:**
   - Edita `/server/.env`
   - Cambia `MONGODB_URI` por tu connection string de Atlas

---

## 3. Configuración del Backend

### 3.1 Verificar Archivo .env

El archivo `.env` ya está creado con valores por defecto:

```bash
# Ver contenido (Windows)
type .env

# Ver contenido (Linux/macOS)
cat .env
```

**Contenido esperado:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pos_santander
JWT_SECRET=tu_clave_secreta_super_segura_aqui_cambiar_en_produccion_123456
JWT_EXPIRES_IN=7d
```

### 3.2 Modificar Configuración (Opcional)

**Para usar MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/pos_santander
```

**Para cambiar el puerto:**
```env
PORT=5001
```

**Para producción:**
```env
NODE_ENV=production
JWT_SECRET=una_clave_super_secreta_y_larga_que_nadie_pueda_adivinar_123456789
```

### 3.3 Verificar Configuración

```bash
npm run check-config
```

**Salida esperada:**
```
✅ CONFIGURACIÓN CORRECTA - Listo para iniciar el servidor
```

### 3.4 Verificar Conexión a MongoDB

```bash
npm run check-mongo
```

**Salida esperada:**
```
✅ CONEXIÓN EXITOSA
📦 Base de datos: pos_santander
🖥️  Host: localhost
```

**Si falla:**
- Verifica que MongoDB esté corriendo
- Verifica la URI en `.env`
- Revisa la [Sección 6: Solución de Problemas](#6-solución-de-problemas)

---

## 4. Iniciar el Servidor

### 4.1 Modo Desarrollo (Recomendado)

```bash
npm run dev
```

**Salida esperada:**
```
🔄 Conectando a MongoDB...
✅ MongoDB conectado: localhost
📦 Base de datos: pos_santander

🚀 Servidor corriendo en puerto 5000
📍 API disponible en: http://localhost:5000/api
🏥 Health check: http://localhost:5000/api/health
```

El servidor se reiniciará automáticamente cuando hagas cambios en el código.

### 4.2 Modo Producción

```bash
npm start
```

Similar al modo desarrollo, pero sin auto-reload.

### 4.3 Probar que Funciona

**Opción 1: Navegador**
- Abre: http://localhost:5000/api/health
- Deberías ver un JSON con `"success": true`

**Opción 2: curl (terminal)**
```bash
curl http://localhost:5000/api/health
```

**Opción 3: PowerShell**
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2024-01-27T...",
  "database": {
    "status": "conectado",
    "name": "pos_santander"
  }
}
```

---

## 5. Poblar la Base de Datos

Para tener datos de prueba, ejecuta estos comandos:

### 5.1 Crear Usuarios de Prueba

```bash
npm run seed:users
```

**Esto crea:**
- 1 Administrador: `admin / admin123`
- 2 Supervisores: `supervisor1 / super123`, `supervisor2 / super123`
- 5 Cajeros: `cajero1 / cajero123`, `cajero2 / cajero123`, etc.

### 5.2 Crear Operadores de Recarga

```bash
npm run seed:recharges
```

**Esto crea:**
- 6 operadores (Telcel, AT&T, Movistar, Unefon, Virgin, Weex)
- ~150 productos de recarga ($10, $20, $30, $50, $100, $200, $300, $500)

### 5.3 Crear Proveedores de Servicios

```bash
npm run seed:services
```

**Esto crea:**
- 18 proveedores en 6 categorías:
  - Electricidad (CFE, Iberdrola)
  - Agua (SACMEX, CONAGUA)
  - Telefonía (Telmex, Totalplay)
  - Internet (Izzi, Megacable)
  - TV Cable (Sky, Dish)
  - Gas (Naturgy, Gas Natural)

### 5.4 Poblar Todo de Una Vez

```bash
npm run seed:all
```

Esto ejecuta los 3 seeds anteriores en secuencia.

### 5.5 Verificar Datos

**Login de prueba:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**Windows PowerShell:**
```powershell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -Body $body -ContentType "application/json"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin",
    "role": "admin",
    "name": "Administrador Principal"
  }
}
```

---

## 6. Solución de Problemas

### Problema 1: "MONGODB_URI is undefined"

**Síntomas:**
```
❌ Error conectando a MongoDB: The `uri` parameter to `openUri()` must be a string, got "undefined"
```

**Solución:**
```bash
# Verificar que .env existe
cat .env  # Linux/macOS
type .env # Windows

# Si no existe, se creó automáticamente, pero verifica:
npm run check-config

# Debería mostrar que MONGODB_URI está definida
```

**Si aún falla:**
- Edita `.env` manualmente
- Agrega: `MONGODB_URI=mongodb://localhost:27017/pos_santander`
- Guarda el archivo
- Reinicia el servidor

### Problema 2: "Cannot connect to MongoDB" / "ECONNREFUSED"

**Síntomas:**
```
❌ Error conectando a MongoDB: connect ECONNREFUSED 127.0.0.1:27017
```

**Causa:** MongoDB no está corriendo.

**Solución:**

**Windows:**
```bash
mongod --dbpath C:\data\db
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Verificar que funciona:**
```bash
mongosh
# o
mongo
```

### Problema 3: "Port 5000 already in use"

**Síntomas:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solución 1: Cambiar el puerto**
```bash
# Edita .env
# Cambia PORT=5000 por PORT=5001
```

**Solución 2: Liberar el puerto**

**Windows:**
```bash
netstat -ano | findstr :5000
# Anota el PID (última columna)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

### Problema 4: "Module not found"

**Síntomas:**
```
Error: Cannot find module 'express'
```

**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json  # Linux/macOS
rmdir /s node_modules                  # Windows

npm install
```

### Problema 5: "quick-check no encuentra archivos"

**Síntomas:**
```
📋 Modelos... ❌ FAIL (esperado: 22, actual: 0)
```

**Solución:**
```bash
# Asegúrate de estar en el directorio correcto
cd C:\Users\Jose\workspace\Puntodeventapos\server  # Windows
cd /ruta/al/proyecto/server                        # Linux/macOS

# Verifica que estás en el lugar correcto
ls src/models     # Linux/macOS
dir src\models    # Windows

# Deberías ver 22 archivos .js

# Ahora ejecuta:
npm run quick-check
```

### Problema 6: "Authentication failed" (MongoDB Atlas)

**Síntomas:**
```
❌ Error: Authentication failed
```

**Solución:**
- Verifica usuario y password en Atlas
- Verifica el connection string en `.env`
- Asegúrate de que tu IP esté en la whitelist de Atlas
- El formato debe ser: `mongodb+srv://usuario:password@cluster.mongodb.net/pos_santander`

### Problema 7: Scripts de Node.js no funcionan

**Síntomas:**
```
'node' is not recognized as an internal or external command
```

**Solución:**
- Reinstala Node.js desde https://nodejs.org/
- Asegúrate de marcar "Add to PATH" durante la instalación
- Cierra y abre nuevamente la terminal
- Verifica: `node --version`

---

## 7. Comandos Útiles

### Verificación y Diagnóstico

```bash
npm run quick-check     # Verificación rápida de estructura
npm run check-config    # Verificar configuración y .env
npm run check-mongo     # Verificar conexión a MongoDB
npm run verify          # Verificación exhaustiva del sistema
```

### Desarrollo

```bash
npm run dev             # Iniciar en modo desarrollo (con auto-reload)
npm start               # Iniciar en modo producción
```

### Poblar Base de Datos

```bash
npm run seed:users      # Crear usuarios de prueba
npm run seed:recharges  # Crear operadores de recarga
npm run seed:services   # Crear proveedores de servicios
npm run seed:all        # Poblar todo
```

### MongoDB Directo

```bash
mongosh                 # Conectar a MongoDB (nuevo)
mongo                   # Conectar a MongoDB (antiguo)

# Dentro de mongosh:
use pos_santander       # Usar la base de datos
show collections        # Ver colecciones
db.users.find()         # Ver usuarios
db.users.countDocuments() # Contar usuarios
```

---

## 8. Flujo de Trabajo Completo

### Primera Vez

```bash
# 1. Ir al directorio
cd C:\Users\Jose\workspace\Puntodeventapos\server

# 2. Instalar dependencias
npm install

# 3. Verificar estructura
npm run quick-check

# 4. Verificar configuración
npm run check-config

# 5. Iniciar MongoDB (si no está corriendo)
mongod --dbpath C:\data\db  # Windows
# o
brew services start mongodb-community  # macOS

# 6. Verificar conexión a MongoDB
npm run check-mongo

# 7. Poblar base de datos
npm run seed:all

# 8. Iniciar servidor
npm run dev

# 9. Probar en el navegador
# Abre: http://localhost:5000/api/health
```

### Día a Día

```bash
# 1. Ir al directorio
cd C:\Users\Jose\workspace\Puntodeventapos\server

# 2. Asegurarse de que MongoDB esté corriendo
npm run check-mongo

# 3. Iniciar servidor
npm run dev

# Listo para desarrollar! 🚀
```

---

## 9. Documentación Adicional

- **Error de MongoDB:** Ver `/SOLUCION_ERROR_MONGODB.md`
- **Quick Check en Windows:** Ver `/SOLUCION_QUICK_CHECK_WINDOWS.md`
- **Resumen completo:** Ver `/RESUMEN_SOLUCION_COMPLETA.md`
- **README del servidor:** Ver `/server/README.md`

---

## 10. Endpoints Principales

Una vez que el servidor esté corriendo, estos son los endpoints principales:

### Autenticación
```
POST /api/auth/login          # Iniciar sesión
POST /api/auth/logout         # Cerrar sesión
POST /api/auth/refresh        # Renovar token
```

### Usuarios
```
GET    /api/users             # Listar usuarios
POST   /api/users             # Crear usuario
GET    /api/users/:id         # Obtener usuario
PUT    /api/users/:id         # Actualizar usuario
DELETE /api/users/:id         # Eliminar usuario
```

### Clientes (CRM)
```
GET    /api/customers         # Listar clientes
POST   /api/customers         # Crear cliente
GET    /api/customers/:id     # Obtener cliente
POST   /api/customers/:id/card # Registrar tarjeta NFC
```

### Health Check
```
GET    /api/health            # Estado del servidor
```

Ver documentación completa en: `http://localhost:5000/api`

---

## ✅ Checklist Final

Antes de decir que todo está listo:

- [ ] Node.js v18+ instalado: `node --version`
- [ ] npm instalado: `npm --version`
- [ ] MongoDB instalado y corriendo
- [ ] Dependencias instaladas: `npm install`
- [ ] Archivo `.env` configurado
- [ ] `npm run quick-check` ✅ pasa
- [ ] `npm run check-config` ✅ pasa
- [ ] `npm run check-mongo` ✅ pasa
- [ ] `npm run dev` inicia sin errores
- [ ] `http://localhost:5000/api/health` responde OK
- [ ] Base de datos poblada: `npm run seed:all`
- [ ] Login de prueba funciona: `admin / admin123`

---

**¡El backend está listo para funcionar!** 🎉

Si tienes algún problema, revisa la [Sección 6: Solución de Problemas](#6-solución-de-problemas) o ejecuta los comandos de verificación.

---

**Última actualización:** 2024-01-27  
**Versión del backend:** 3.0.0  
**Estado:** ✅ 100% Funcional y Documentado
