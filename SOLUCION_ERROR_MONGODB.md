# 🔧 SOLUCIÓN: Error MongoDB URI undefined

## ❌ Error Completo
```
❌ Error conectando a MongoDB: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
```

---

## ✅ SOLUCIÓN APLICADA

He creado automáticamente el archivo `/server/.env` con todas las configuraciones necesarias.

---

## 📝 Lo que se ha hecho:

### 1. ✅ Archivo `.env` creado
**Ubicación:** `/server/.env`

**Contenido:**
```env
NODE_ENV=development
PORT=5000

# MongoDB Local (por defecto)
MONGODB_URI=mongodb://localhost:27017/pos_santander

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_aqui_cambiar_en_produccion_123456
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

### 2. ✅ Archivo `.env.example` creado
Para documentación y nuevas instalaciones.

### 3. ✅ Script de verificación creado
**Nuevo comando:** `npm run check-config`

Este script verifica:
- ✅ Que el archivo .env exista
- ✅ Variables requeridas definidas
- ✅ MONGODB_URI correctamente formateada
- ✅ JWT_SECRET con longitud adecuada
- ✅ Configuración de red

### 4. ✅ Mejora en database.js
Ahora muestra errores más claros con soluciones sugeridas.

### 5. ✅ README actualizado
Con sección completa de troubleshooting.

---

## 🚀 CÓMO INICIAR EL SERVIDOR AHORA

### Opción A: MongoDB Local (recomendado para desarrollo)

**Paso 1:** Inicia MongoDB (si no está corriendo)

```bash
# macOS con Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
mongod --dbpath C:\data\db
```

**Paso 2:** Verifica la configuración

```bash
cd server
npm run check-config
```

**Paso 3:** Inicia el servidor

```bash
npm run dev
```

### Opción B: MongoDB Atlas (nube)

**Paso 1:** Edita `/server/.env`

```bash
nano /server/.env
# o
code /server/.env
```

**Paso 2:** Cambia MONGODB_URI a tu cluster de Atlas:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/pos_santander?retryWrites=true&w=majority
```

**Paso 3:** Verifica y arranca

```bash
npm run check-config
npm run dev
```

---

## 🔍 VERIFICACIÓN PASO A PASO

### 1. Verificar que existe el archivo .env

```bash
ls -la /server/.env
```

**Salida esperada:**
```
-rw-r--r-- 1 usuario grupo 1234 Jan 27 12:00 /server/.env
```

### 2. Verificar contenido de MONGODB_URI

```bash
cat /server/.env | grep MONGODB_URI
```

**Salida esperada:**
```
MONGODB_URI=mongodb://localhost:27017/pos_santander
```

### 3. Ejecutar script de verificación

```bash
cd server
npm run check-config
```

**Salida esperada si todo está bien:**
```
🔍 VERIFICACIÓN DE CONFIGURACIÓN
============================================================

📄 Archivo .env: /server/.env
   ✅ Encontrado

📋 Variables REQUERIDAS:
   ✅ MONGODB_URI          = ***ander
   ✅ JWT_SECRET           = ***3456
   ✅ PORT                 = 5000

📋 Variables OPCIONALES:
   ✅ NODE_ENV             = development
   ✅ JWT_EXPIRES_IN       = 7d
   ✅ CORS_ORIGIN          = http://localhost:3000,...
   ✅ BCRYPT_ROUNDS        = 10

🔍 Análisis de MONGODB_URI:
   📍 Tipo: MongoDB Local
   💡 Asegúrate de que MongoDB esté corriendo localmente

🔐 Análisis de JWT_SECRET:
   ✅ Longitud: Adecuada

🌐 Configuración de red:
   📍 Puerto: 5000
   🔗 API estará en: http://localhost:5000/api

============================================================
✅ CONFIGURACIÓN CORRECTA - Listo para iniciar el servidor
```

### 4. Intentar conectar a MongoDB

```bash
# Con mongosh (MongoDB Shell nuevo)
mongosh

# O con mongo (versiones antiguas)
mongo
```

**Si MongoDB está corriendo, verás:**
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017
Using MongoDB: 6.0.0
```

### 5. Iniciar el servidor

```bash
cd server
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

---

## ❌ SI AÚN TIENES PROBLEMAS

### Problema 1: MongoDB no está instalado

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows:**
- Descarga MongoDB Community Server de https://www.mongodb.com/try/download/community
- Instala y ejecuta MongoDB Compass o inicia `mongod` desde la terminal

### Problema 2: El archivo .env no se carga

**Verifica que dotenv esté instalado:**
```bash
cd server
npm list dotenv
```

Si no está:
```bash
npm install dotenv
```

### Problema 3: Puerto 5000 ocupado

**Cambia el puerto en .env:**
```env
PORT=5001
```

**O mata el proceso en ese puerto:**
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 🎯 RESUMEN

✅ **Archivo .env creado** en `/server/.env`  
✅ **MONGODB_URI configurada** para MongoDB local  
✅ **Script check-config** agregado  
✅ **database.js mejorado** con errores claros  
✅ **README actualizado** con troubleshooting  

**El error está resuelto. Solo necesitas:**
1. Asegurarte de que MongoDB esté corriendo
2. Ejecutar `npm run check-config`
3. Ejecutar `npm run dev`

---

## 📞 Comandos Útiles

```bash
# Verificar configuración
npm run check-config

# Ver contenido de .env
cat /server/.env

# Verificar MongoDB corriendo
mongosh
# o
mongo

# Ver logs del servidor con más detalle
NODE_ENV=development npm run dev

# Verificar puerto disponible
lsof -i :5000
```

---

**Fecha de solución:** 2024-01-27  
**Archivos creados:** `.env`, `.env.example`, `.gitignore`, `check-config.js`  
**Archivos modificados:** `database.js`, `package.json`, `README.md`  
**Estado:** ✅ RESUELTO
