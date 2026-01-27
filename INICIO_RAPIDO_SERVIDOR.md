# 🚀 Guía de Inicio Rápido - Servidor Backend

## ✅ El error de MongoDB está RESUELTO

El error que tenías era porque faltaba el archivo `.env`. **Ya está creado y configurado.**

---

## 📋 Pasos para Iniciar el Servidor

### 1️⃣ Asegúrate de que MongoDB esté corriendo

**macOS (con Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
mongod --dbpath C:\data\db
```

**Verificar que MongoDB esté activo:**
```bash
mongosh
# o
mongo
```

Si ves algo como `MongoDB shell version...` significa que está funcionando ✅

---

### 2️⃣ Verificar la configuración

```bash
cd server
npm run check-config
```

**Salida esperada:**
```
✅ CONFIGURACIÓN CORRECTA - Listo para iniciar el servidor
```

---

### 3️⃣ Verificar conexión a MongoDB

```bash
npm run check-mongo
```

**Salida esperada:**
```
✅ CONEXIÓN EXITOSA
📦 Base de datos: pos_santander
🖥️  Host: localhost
```

---

### 4️⃣ Iniciar el servidor

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
```

---

## 🧪 Probar que funciona

Abre otra terminal y ejecuta:

```bash
curl http://localhost:5000/api/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2024-01-27T..."
}
```

---

## ❌ Si MongoDB NO está instalado

### macOS
```bash
# Instalar MongoDB con Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community

# Verificar
mongosh
```

### Ubuntu/Debian
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

### Windows
1. Descarga MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Instala siguiendo el asistente
3. Inicia MongoDB Compass o ejecuta `mongod` en CMD

---

## 🌱 Poblar la Base de Datos (Opcional)

Una vez que el servidor esté corriendo, puedes poblar la base de datos con datos de prueba:

### Crear usuarios de prueba
```bash
npm run seed:users
```

Esto crea:
- 1 Administrador: `admin / admin123`
- 2 Supervisores: `supervisor1 / super123`, `supervisor2 / super123`
- 5 Cajeros: `cajero1 / cajero123` ... `cajero5 / cajero123`

### Crear operadores de recarga
```bash
npm run seed:recharges
```

Esto crea 6 operadores (Telcel, AT&T, Movistar, etc.) con ~150 productos de recarga.

### Crear proveedores de servicios
```bash
npm run seed:services
```

Esto crea 18 proveedores en 6 categorías (CFE, Telmex, Izzi, etc.).

### Todo en uno
```bash
npm run seed:all
```

---

## 📊 Comandos Útiles

```bash
# Verificar configuración completa
npm run check-config

# Verificar solo MongoDB
npm run check-mongo

# Iniciar en modo desarrollo (con auto-reload)
npm run dev

# Iniciar en modo producción
npm start

# Ver sistema completo
npm run verify

# Auditar backend
npm run audit
```

---

## 🔍 Estructura de Archivos Creados

```
server/
├── .env                          # ✅ NUEVO - Variables de entorno
├── .env.example                  # ✅ NUEVO - Ejemplo de configuración
├── .gitignore                    # ✅ NUEVO - Git ignore
├── src/
│   ├── config/
│   │   └── database.js          # ✅ MEJORADO - Con validaciones
│   └── scripts/
│       ├── check-config.js      # ✅ NUEVO - Verificar configuración
│       └── check-mongodb.js     # ✅ NUEVO - Verificar MongoDB
└── package.json                  # ✅ ACTUALIZADO - Nuevos scripts
```

---

## 📝 Variables de Entorno Configuradas

En `/server/.env`:

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/pos_santander

# Servidor
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_aqui_cambiar_en_produccion_123456
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:5174

# Seguridad
BCRYPT_ROUNDS=10
```

---

## 🌐 Si prefieres usar MongoDB Atlas (nube)

1. Crea una cuenta gratuita en https://www.mongodb.com/cloud/atlas
2. Crea un cluster gratuito (M0)
3. Obtén tu connection string
4. Edita `/server/.env`:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/pos_santander?retryWrites=true&w=majority
```

5. Whitelist tu IP en Atlas
6. Ejecuta `npm run check-config`
7. Ejecuta `npm run dev`

---

## ❓ Preguntas Frecuentes

### ¿Necesito instalar MongoDB?
**Sí**, a menos que uses MongoDB Atlas (nube).

### ¿Puedo cambiar el puerto?
**Sí**, edita `PORT=5001` en `/server/.env`

### ¿Necesito crear la base de datos manualmente?
**No**, MongoDB la crea automáticamente la primera vez que te conectas.

### ¿Cómo cambio el nombre de la base de datos?
Edita `MONGODB_URI` en `.env` y cambia `pos_santander` por el nombre que quieras.

### ¿Es seguro el JWT_SECRET por defecto?
**NO para producción**. Cambia `JWT_SECRET` a algo único y complejo antes de desplegar.

---

## 🎯 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] MongoDB está instalado: `mongod --version`
- [ ] MongoDB está corriendo: `mongosh` funciona
- [ ] Archivo `.env` existe: `ls -la /server/.env`
- [ ] Variables configuradas: `npm run check-config` ✅
- [ ] MongoDB accesible: `npm run check-mongo` ✅
- [ ] Dependencias instaladas: `npm install` ejecutado
- [ ] Puerto 5000 libre: `lsof -i :5000` no muestra nada

---

## 📞 Soporte Rápido

### Error: "MONGODB_URI is undefined"
```bash
npm run check-config
```

### Error: "Cannot connect to MongoDB"
```bash
npm run check-mongo
```

### Error: "Port 5000 already in use"
Cambia el puerto en `.env` o mata el proceso:
```bash
lsof -ti:5000 | xargs kill -9
```

### Error: "Module not found"
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ TODO LISTO

Si sigues estos pasos, el servidor debería iniciarse sin problemas.

**Comandos en orden:**

```bash
# 1. Iniciar MongoDB
brew services start mongodb-community  # macOS
# o
sudo systemctl start mongod  # Linux

# 2. Ir al servidor
cd server

# 3. Verificar configuración
npm run check-config

# 4. Verificar MongoDB
npm run check-mongo

# 5. Iniciar servidor
npm run dev

# 6. En otra terminal, probar
curl http://localhost:5000/api/health
```

---

**🎉 ¡El servidor debería estar funcionando!**

Si tienes algún problema, revisa los logs del servidor o ejecuta los comandos de verificación.
