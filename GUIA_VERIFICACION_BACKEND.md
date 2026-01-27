# ✅ Guía de Verificación del Backend

Esta guía te ayudará a verificar que el backend esté completamente funcional y conectado correctamente.

---

## 🚀 Inicio Rápido (5 minutos)

### 1️⃣ Instalar Dependencias

```bash
cd server
npm install
```

**Tiempo estimado:** 1-2 minutos

---

### 2️⃣ Configurar Variables de Entorno

Ya existe un archivo `.env` configurado. Verifica que tenga estos valores:

```bash
cat .env
```

Debería mostrar:
```env
MONGODB_URI=mongodb://localhost:27017/pos-santander
PORT=5000
JWT_SECRET=pos_santander_secret_key_2024_change_in_production
NODE_ENV=development
```

✅ **Si existe:** Continúa al paso 3  
❌ **Si no existe:** Crea el archivo `.env` copiando `.env.example`

---

### 3️⃣ Iniciar MongoDB

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
mongod
```

**Verificar que esté corriendo:**
```bash
mongosh --eval "db.version()"
```

Debería mostrar la versión de MongoDB.

---

### 4️⃣ Ejecutar Verificación Automática

```bash
npm run verify
```

Este script verificará automáticamente:
- ✅ Variables de entorno
- ✅ Conexión a MongoDB
- ✅ Modelos (18 archivos)
- ✅ Rutas (19 archivos)
- ✅ Controladores (7 archivos)
- ✅ Colecciones en BD
- ✅ Dependencias NPM
- ✅ Scripts de seed

**Resultado esperado:**
```
═══════════════════════════════════════
         RESUMEN DE VERIFICACIÓN       
═══════════════════════════════════════

✅ Variables de entorno: PASÓ
✅ Conexión a MongoDB: PASÓ
✅ Modelos: PASÓ
✅ Rutas: PASÓ
✅ Controladores: PASÓ
✅ Colecciones: PASÓ
✅ Dependencias NPM: PASÓ
✅ Scripts de Seed: PASÓ

📊 RESULTADO: 8/8 verificaciones pasadas (100.0%)

🎉 ¡SISTEMA COMPLETAMENTE VERIFICADO!
El backend está listo para funcionar
```

---

## 🌱 Poblar la Base de Datos

### Opción A: Poblar Todo (Recomendado)

```bash
npm run seed:all
```

**Tiempo estimado:** 2-3 minutos

### Opción B: Poblar Individualmente

```bash
# 1. Usuarios (7 usuarios en 3 roles)
npm run seed:users

# 2. Recargas (6 operadores + 150 productos)
npm run seed:recharges

# 3. Servicios (18 proveedores en 6 categorías)
npm run seed:services
```

**Resultado esperado de cada seed:**
```
✅ MongoDB conectado
✅ Colección limpiada
✅ Datos creados exitosamente
🎉 Seed completado exitosamente!
```

---

## 🏃 Iniciar el Servidor

```bash
npm run dev
```

**Salida esperada:**
```
✅ MongoDB conectado: localhost

🚀 Servidor corriendo en puerto 5000
📍 API disponible en: http://localhost:5000/api
🏥 Health check: http://localhost:5000/api/health
```

**El servidor debe estar corriendo sin errores.** ✅

---

## 🧪 Probar el Sistema (Checklist)

### ✅ 1. Health Check

```bash
curl http://localhost:5000/api/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "database": {
    "status": "conectado",
    "name": "pos-santander",
    "host": "localhost",
    "collections": 7
  },
  "environment": "development"
}
```

---

### ✅ 2. Endpoint Raíz

```bash
curl http://localhost:5000/
```

**Respuesta esperada:**
```json
{
  "message": "API POS - Sistema de Punto de Venta",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "auth": "/api/auth",
    "users": "/api/users",
    "customers": "/api/customers",
    ...
  }
}
```

---

### ✅ 3. Login con Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "username": "admin",
    "fullName": "Administrador Principal",
    "role": "admin",
    "email": "admin@possantander.com",
    "isActive": true
  }
}
```

---

### ✅ 4. Listar Usuarios (con Token)

Primero, guarda el token del login anterior:

```bash
# Linux/macOS
TOKEN="tu_token_aqui"

# Windows PowerShell
$TOKEN="tu_token_aqui"
```

Luego lista los usuarios:

```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "count": 7,
  "total": 7,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "...",
      "username": "admin",
      "fullName": "Administrador Principal",
      "role": "admin",
      "employeeCode": "EMP0001",
      ...
    },
    ...
  ]
}
```

---

### ✅ 5. Listar Operadores de Recarga

```bash
curl http://localhost:5000/api/recharges/carriers \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "_id": "...",
      "name": "Telcel",
      "slug": "telcel",
      "logo": "...",
      "isActive": true
    },
    ...
  ]
}
```

---

### ✅ 6. Listar Proveedores de Servicios

```bash
curl http://localhost:5000/api/service-providers \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "count": 18,
  "data": [
    {
      "_id": "...",
      "name": "CFE",
      "category": "energy",
      "commissionType": "mixed",
      "isActive": true
    },
    ...
  ]
}
```

---

## 🔍 Verificación en MongoDB

### Conectar a MongoDB

```bash
mongosh
```

```javascript
// Usar base de datos
use pos-santander

// Ver colecciones
show collections

// Salida esperada:
// auditlogs
// cashcounts
// cashregisters
// customers
// phonerecharges
// promotions
// rechargecarriers
// rechargeproducts
// servicepayments
// serviceproviders
// users

// Ver usuarios
db.users.find().pretty()

// Contar usuarios por rol
db.users.aggregate([
  { $group: { _id: '$role', count: { $sum: 1 } } }
])

// Salida esperada:
// { "_id": "admin", "count": 1 }
// { "_id": "supervisor", "count": 2 }
// { "_id": "cashier", "count": 5 }

// Ver operadores de recarga
db.rechargecarriers.find().pretty()

// Contar productos de recarga
db.rechargeproducts.countDocuments()
// Esperado: 150+

// Ver proveedores de servicios
db.serviceproviders.find().pretty()

// Contar proveedores de servicios
db.serviceproviders.countDocuments()
// Esperado: 18
```

---

## 📊 Dashboard de Verificación

### Estadísticas del Sistema

```javascript
// En mongosh:
use pos-santander

print("=== ESTADÍSTICAS DEL SISTEMA ===\n")

// Usuarios
print("👥 Usuarios:")
print("  Total:", db.users.countDocuments())
print("  Admins:", db.users.countDocuments({ role: 'admin' }))
print("  Supervisores:", db.users.countDocuments({ role: 'supervisor' }))
print("  Cajeros:", db.users.countDocuments({ role: 'cashier' }))
print("  Activos:", db.users.countDocuments({ isActive: true }))

// Recargas
print("\n📱 Recargas:")
print("  Operadores:", db.rechargecarriers.countDocuments())
print("  Productos:", db.rechargeproducts.countDocuments())
print("  Recargas procesadas:", db.phonerecharges.countDocuments())

// Servicios
print("\n🧾 Servicios:")
print("  Proveedores:", db.serviceproviders.countDocuments())
print("  Pagos procesados:", db.servicepayments.countDocuments())

// Promociones
print("\n🎁 Promociones:")
print("  Activas:", db.promotions.countDocuments({ isActive: true }))
print("  Total:", db.promotions.countDocuments())

// Caja
print("\n💰 Caja:")
print("  Turnos activos:", db.cashregisters.countDocuments({ status: 'open' }))
print("  Total turnos:", db.cashregisters.countDocuments())

print("\n=== FIN ESTADÍSTICAS ===")
```

---

## ❌ Problemas Comunes y Soluciones

### Problema 1: "Cannot connect to MongoDB"

**Síntomas:**
```
❌ Error conectando a MongoDB: connect ECONNREFUSED 127.0.0.1:27017
```

**Soluciones:**

1. **Verificar que MongoDB esté corriendo:**
   ```bash
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongod
   
   # Windows
   tasklist | findstr mongod
   ```

2. **Iniciar MongoDB:**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

3. **Verificar puerto:**
   ```bash
   lsof -i :27017
   ```

---

### Problema 2: "Module not found"

**Síntomas:**
```
Error: Cannot find module 'express'
```

**Solución:**
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

---

### Problema 3: "Port 5000 already in use"

**Síntomas:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Soluciones:**

1. **Cambiar puerto en `.env`:**
   ```env
   PORT=5001
   ```

2. **O matar el proceso:**
   ```bash
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

---

### Problema 4: "JWT_SECRET not defined"

**Síntomas:**
```
Error: JWT_SECRET must be defined
```

**Solución:**
```bash
# Verificar que existe .env
ls -la .env

# Si no existe, copiar el ejemplo
cp .env.example .env

# Editar y agregar JWT_SECRET
nano .env
```

---

### Problema 5: Seeds no se ejecutan

**Síntomas:**
```
Colección vacía después de ejecutar seed
```

**Soluciones:**

1. **Verificar conexión a MongoDB:**
   ```bash
   mongosh --eval "db.version()"
   ```

2. **Ejecutar seed manualmente:**
   ```bash
   node src/scripts/seedUsers.js
   ```

3. **Ver logs completos:**
   ```bash
   node src/scripts/seedUsers.js 2>&1 | tee seed.log
   ```

---

## ✅ Checklist Final

Marca cada punto cuando lo completes:

- [ ] MongoDB instalado y corriendo
- [ ] Node.js v18+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` configurado
- [ ] Verificación del sistema pasó (8/8)
- [ ] Seeds ejecutados (usuarios, recargas, servicios)
- [ ] Servidor inicia sin errores
- [ ] Health check responde correctamente
- [ ] Login de admin funciona
- [ ] Endpoints protegidos requieren token
- [ ] MongoDB tiene colecciones pobladas
- [ ] Logs del servidor son claros

---

## 🎉 Sistema Verificado

Si completaste todos los puntos del checklist:

**¡Felicidades! El backend está 100% operativo.** ✅

### Próximos Pasos:

1. **Iniciar el frontend:**
   ```bash
   cd ..
   npm run dev
   ```

2. **Probar integración:**
   - Login desde el frontend
   - Verificar que los datos se cargan
   - Probar operaciones CRUD

3. **Revisar documentación:**
   - [Módulo de Usuarios](/RESUMEN_MODULO_USUARIOS.md)
   - [Estado Completo](/ESTADO_COMPLETO_BACKEND.md)
   - [API Reference](/server/README.md)

---

## 📞 Comandos de Referencia Rápida

```bash
# Servidor
npm run dev              # Iniciar con auto-reload
npm start                # Iniciar producción
npm run verify           # Verificar sistema

# Seeds
npm run seed:users       # Poblar usuarios
npm run seed:recharges   # Poblar recargas
npm run seed:services    # Poblar servicios
npm run seed:all         # Poblar todo

# MongoDB
mongosh                  # Conectar a MongoDB
use pos-santander        # Usar base de datos
show collections         # Ver colecciones
db.users.find().pretty() # Ver usuarios

# Testing
curl http://localhost:5000/api/health  # Health check
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 📚 Recursos Adicionales

- **README del Servidor:** `/server/README.md`
- **Documentación de Módulos:** `/RESUMEN_MODULO_*.md`
- **Estado Completo:** `/ESTADO_COMPLETO_BACKEND.md`
- **MongoDB Docs:** https://docs.mongodb.com/
- **Express Docs:** https://expressjs.com/
- **Mongoose Docs:** https://mongoosejs.com/

---

**¡Tu backend está listo para funcionar!** 🚀
