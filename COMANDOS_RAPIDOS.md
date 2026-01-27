# ⚡ Comandos Rápidos - Sistema POS Santander

Referencia rápida de todos los comandos útiles del sistema.

---

## 🚀 Inicio Rápido (Copy-Paste)

```bash
# 1. Instalar todo
cd server && npm install

# 2. Verificar que MongoDB esté corriendo
mongosh --eval "db.version()"

# 3. Verificar el sistema
npm run verify

# 4. Poblar base de datos
npm run seed:all

# 5. Iniciar servidor
npm run dev
```

---

## 📦 NPM Scripts

### Servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

---

### Verificación

```bash
# Verificar configuración completa
npm run verify

# Auditar coherencia del backend
npm run audit
```

**`npm run verify`** verifica:
- ✅ Variables de entorno
- ✅ Conexión a MongoDB
- ✅ Modelos (22 archivos)
- ✅ Rutas (21 archivos)
- ✅ Controladores (20 archivos)
- ✅ Colecciones en BD
- ✅ Dependencias NPM

**`npm run audit`** audita:
- ✅ Conexión Modelos → Controladores
- ✅ Conexión Controladores → Rutas
- ✅ Referencias entre modelos
- ✅ Nomenclatura consistente
- ✅ Middleware de autenticación
- ✅ Sin referencias rotas

---

### Seeds (Poblar Base de Datos)

```bash
# Individual
npm run seed:users       # 7 usuarios (1 admin, 2 supervisores, 5 cajeros)
npm run seed:recharges   # 6 operadores + 150 productos de recarga
npm run seed:services    # 18 proveedores de servicios

# Todo junto
npm run seed:all         # Ejecutar todos los seeds
```

---

## 🗄️ MongoDB

### Conexión

```bash
# Conectar a MongoDB
mongosh

# Conectar a base de datos específica
mongosh pos-santander
```

---

### Comandos Básicos

```bash
# Dentro de mongosh:

# Usar base de datos
use pos-santander

# Ver colecciones
show collections

# Ver bases de datos
show dbs

# Estadísticas de BD
db.stats()
```

---

### Ver Datos

```bash
# Ver todos los usuarios
db.users.find().pretty()

# Ver solo admins
db.users.find({ role: 'admin' }).pretty()

# Contar usuarios
db.users.countDocuments()

# Contar por rol
db.users.aggregate([
  { $group: { _id: '$role', count: { $sum: 1 } } }
])

# Ver operadores de recarga
db.rechargecarriers.find().pretty()

# Contar productos de recarga
db.rechargeproducts.countDocuments()

# Ver proveedores de servicios
db.serviceproviders.find().pretty()

# Ver últimas 10 ventas
db.sales.find().sort({ createdAt: -1 }).limit(10).pretty()

# Ver turnos de caja activos
db.cashregisters.find({ status: 'open' }).pretty()
```

---

### Limpiar/Resetear

```bash
# Eliminar colección específica
db.users.drop()

# Eliminar TODA la base de datos (¡CUIDADO!)
db.dropDatabase()

# Limpiar solo los datos de una colección
db.users.deleteMany({})
```

---

## 🧪 Testing con cURL

### Health Check

```bash
# Verificar que el servidor está corriendo
curl http://localhost:5000/api/health

# Versión con formato
curl -s http://localhost:5000/api/health | json_pp
```

---

### Autenticación

```bash
# Login con admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Guardar token (Linux/macOS)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Guardar token (Windows PowerShell)
$response = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -Body '{"username":"admin","password":"admin123"}' -ContentType "application/json"
$TOKEN = $response.token
```

---

### Endpoints Protegidos

```bash
# Listar usuarios (requiere token)
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"

# Listar clientes
curl http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN"

# Listar productos
curl http://localhost:5000/api/products \
  -H "Authorization: Bearer $TOKEN"

# Ver operadores de recarga
curl http://localhost:5000/api/recharges/carriers \
  -H "Authorization: Bearer $TOKEN"

# Ver proveedores de servicios
curl http://localhost:5000/api/service-providers \
  -H "Authorization: Bearer $TOKEN"
```

---

### Crear Datos

```bash
# Crear cliente
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "6141234567",
    "email": "juan@example.com"
  }'

# Crear producto
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca Cola 600ml",
    "barcode": "7501234567890",
    "price": 15.00,
    "cost": 10.00,
    "stock": 100,
    "category": "bebidas"
  }'
```

---

## 🔍 Diagnóstico

### Ver logs del servidor

```bash
# Logs en tiempo real
npm run dev

# Logs con más detalle
DEBUG=* npm run dev

# Guardar logs en archivo
npm run dev 2>&1 | tee server.log
```

---

### Ver procesos

```bash
# Ver si el servidor está corriendo
lsof -i :5000

# Ver procesos de MongoDB
ps aux | grep mongod

# Ver procesos de Node
ps aux | grep node
```

---

### Matar procesos

```bash
# Matar proceso en puerto 5000
lsof -ti:5000 | xargs kill -9

# Matar todos los procesos de Node
killall node

# Matar MongoDB
killall mongod
```

---

## 🐛 Troubleshooting Rápido

### MongoDB no conecta

```bash
# 1. Verificar que está instalado
mongod --version

# 2. Iniciar MongoDB
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# 3. Verificar que esté corriendo
mongosh --eval "db.version()"
```

---

### Puerto 5000 ocupado

```bash
# Ver qué proceso usa el puerto
lsof -i :5000

# Matar el proceso
lsof -ti:5000 | xargs kill -9

# O cambiar puerto en .env
echo "PORT=5001" >> .env
```

---

### Módulos no encontrados

```bash
# Reinstalar todo
cd server
rm -rf node_modules package-lock.json
npm install
```

---

### Base de datos corrupta

```bash
# 1. Entrar a mongosh
mongosh

# 2. Eliminar base de datos
use pos-santander
db.dropDatabase()

# 3. Salir y ejecutar seeds
exit
npm run seed:all
```

---

## 📊 Estadísticas Rápidas

### Script de Estadísticas MongoDB

```javascript
// Guardar en stats.js y ejecutar con: mongosh pos-santander stats.js

print("\n=== ESTADÍSTICAS DEL SISTEMA ===\n");

print("👥 USUARIOS:");
print("  Total:", db.users.countDocuments());
print("  Admins:", db.users.countDocuments({ role: 'admin' }));
print("  Supervisores:", db.users.countDocuments({ role: 'supervisor' }));
print("  Cajeros:", db.users.countDocuments({ role: 'cashier' }));

print("\n👨‍👩‍👧‍👦 CLIENTES:");
print("  Total:", db.customers.countDocuments());
print("  Con tarjeta NFC:", db.nfccards.countDocuments());
print("  Con fiado:", db.accountreceivables.countDocuments({ status: 'active' }));

print("\n📦 PRODUCTOS:");
print("  Total:", db.products.countDocuments());
print("  Bajo stock:", db.products.countDocuments({ stock: { $lt: 10 } }));

print("\n💰 VENTAS:");
print("  Total:", db.sales.countDocuments());
print("  Hoy:", db.sales.countDocuments({
  createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
}));

print("\n📱 RECARGAS:");
print("  Operadores:", db.rechargecarriers.countDocuments());
print("  Productos:", db.rechargeproducts.countDocuments());
print("  Procesadas:", db.phonerecharges.countDocuments());

print("\n🧾 SERVICIOS:");
print("  Proveedores:", db.serviceproviders.countDocuments());
print("  Pagos:", db.servicepayments.countDocuments());

print("\n💼 CAJA:");
print("  Turnos activos:", db.cashregisters.countDocuments({ status: 'open' }));
print("  Total turnos:", db.cashregisters.countDocuments());

print("\n🎁 PROMOCIONES:");
print("  Activas:", db.promotions.countDocuments({ isActive: true }));

print("\n📝 AUDITORÍA:");
print("  Logs totales:", db.auditlogs.countDocuments());

print("\n=================================\n");
```

---

## 🔄 Reinicio Completo

### Resetear todo el sistema

```bash
#!/bin/bash

echo "🔄 Reiniciando sistema completo..."

# 1. Matar procesos
echo "1️⃣ Matando procesos..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
killall node 2>/dev/null

# 2. Limpiar MongoDB
echo "2️⃣ Limpiando MongoDB..."
mongosh pos-santander --eval "db.dropDatabase()"

# 3. Reinstalar dependencias
echo "3️⃣ Reinstalando dependencias..."
cd server
rm -rf node_modules package-lock.json
npm install

# 4. Verificar sistema
echo "4️⃣ Verificando sistema..."
npm run verify

# 5. Poblar datos
echo "5️⃣ Poblando base de datos..."
npm run seed:all

# 6. Iniciar servidor
echo "6️⃣ Iniciando servidor..."
npm run dev

echo "✅ Sistema reiniciado!"
```

---

## 📝 Comandos de Desarrollo

### Agregar nuevo modelo

```bash
# 1. Crear archivo del modelo
touch server/src/models/NuevoModelo.js

# 2. Crear controlador
touch server/src/controllers/nuevoModeloController.js

# 3. Crear rutas
touch server/src/routes/nuevoModeloRoutes.js

# 4. Registrar ruta en index.js
# Editar: server/src/routes/index.js

# 5. Verificar coherencia
npm run audit
```

---

### Ver estructura del proyecto

```bash
# Ver árbol completo
tree server/src

# Ver solo archivos .js
find server/src -name "*.js" -type f

# Contar líneas de código
find server/src -name "*.js" | xargs wc -l
```

---

## 🎯 Comandos Más Usados

```bash
# Top 10 comandos que usarás más:

1. npm run dev              # Iniciar servidor
2. npm run verify           # Verificar sistema
3. npm run audit            # Auditar backend
4. npm run seed:all         # Poblar datos
5. mongosh                  # Conectar a MongoDB
6. curl http://localhost:5000/api/health  # Health check
7. lsof -i :5000           # Ver puerto 5000
8. db.users.find().pretty() # Ver usuarios (en mongosh)
9. npm install              # Instalar dependencias
10. git status              # Ver estado de Git
```

---

## 📚 Documentación Relacionada

- [README del Servidor](/server/README.md)
- [Guía de Verificación](/GUIA_VERIFICACION_BACKEND.md)
- [Auditoría Completa](/AUDITORIA_BACKEND_COMPLETADA.md)
- [Mapa de Arquitectura](/MAPA_ARQUITECTURA_BACKEND.md)

---

## 💡 Tips

### Alias útiles (agregar a ~/.bashrc o ~/.zshrc)

```bash
# Backend
alias pos-dev='cd ~/pos-santander/server && npm run dev'
alias pos-verify='cd ~/pos-santander/server && npm run verify'
alias pos-audit='cd ~/pos-santander/server && npm run audit'
alias pos-seed='cd ~/pos-santander/server && npm run seed:all'

# MongoDB
alias mongo-connect='mongosh pos-santander'
alias mongo-stats='mongosh pos-santander --eval "db.stats()"'
alias mongo-reset='mongosh pos-santander --eval "db.dropDatabase()"'

# Health check
alias pos-health='curl -s http://localhost:5000/api/health | json_pp'
```

---

**¡Guarda esta referencia para acceso rápido!** ⚡
