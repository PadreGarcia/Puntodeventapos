# ⚡ Comandos Rápidos - Sistema POS Santander

Referencia rápida de todos los comandos disponibles.

---

## 🚀 INICIO RÁPIDO (COPIAR Y PEGAR)

### Primera Vez - Configuración Completa
```bash
cd C:\Users\Jose\workspace\Puntodeventapos\server
npm install
npm run setup
npm run seed
npm run dev
```

### Uso Diario
```bash
cd C:\Users\Jose\workspace\Puntodeventapos\server
npm run dev
```

---

## 📋 ÍNDICE DE COMANDOS

| Categoría | Comando | Descripción |
|-----------|---------|-------------|
| **⚡ Setup** | `npm run setup` | Configuración inicial completa |
| **⚡ Setup** | `npm run setup:clean` | Limpiar y reconfigurar |
| **🌱 Datos** | `npm run seed` | Insertar datos iniciales |
| **🌱 Datos** | `npm run seed:clean` | Limpiar BD y volver a insertar |
| **🚀 Servidor** | `npm run dev` | Iniciar servidor (desarrollo) |
| **🚀 Servidor** | `npm start` | Iniciar servidor (producción) |
| **🔍 Check** | `npm run quick-check` | Verificación rápida |
| **🔍 Check** | `npm run check-config` | Verificar .env |
| **🔍 Check** | `npm run check-mongo` | Verificar MongoDB |
| **🔍 Check** | `npm run check-db` | Ver contenido de BD |

---

## ⚡ CONFIGURACIÓN INICIAL

### `npm run setup`
**Descripción:** Configuración inicial automática completa

**Qué hace:**
1. ✅ Verifica archivos de configuración (.env)
2. ✅ Verifica conexión a MongoDB
3. ✅ Crea usuario administrador inicial
4. ✅ Crea 5 productos de ejemplo
5. ✅ Muestra credenciales de acceso

**Cuándo usar:**
- Primera vez que configuras el sistema
- Después de clonar el repositorio
- Para verificar que todo funcione

**Salida:**
```
━━ Paso 1 ━━ Verificando Configuración
✓ Archivo .env encontrado
✓ Variables de entorno configuradas correctamente

━━ Paso 2 ━━ Verificando MongoDB
✓ Conectado a MongoDB exitosamente

━━ Paso 3 ━━ Insertando Datos Iniciales
✓ Usuario admin creado
✓ 5 productos creados

🔑 CREDENCIALES DE ACCESO
Usuario:   admin
Password:  admin123
```

---

### `npm run setup:clean`
**Descripción:** Limpia la base de datos y reconfigura desde cero

**Qué hace:**
1. 🗑️ Elimina TODOS los usuarios
2. 🗑️ Elimina TODOS los productos
3. ✅ Vuelve a insertar datos iniciales

**⚠️ ADVERTENCIA:** Esto eliminará TODOS los datos

**Cuándo usar:**
- Quieres empezar desde cero
- Tienes datos de prueba corruptos
- Necesitas resetear el sistema

---

## 🌱 INSERTAR DATOS (SEEDS)

### `npm run seed`
**Descripción:** Inserta datos iniciales completos

**Qué inserta:**
- ✅ 4 usuarios (1 admin, 1 supervisor, 2 cajeros)
- ✅ 33 productos en 8 categorías

**Datos insertados:**
```
Usuarios:
  - admin (admin123)
  - supervisor1 (super123)
  - cajero1, cajero2 (cajero123)

Productos (33):
  - Bebidas (5)
  - Botanas (5)
  - Dulces (5)
  - Lácteos (3)
  - Abarrotes (5)
  - Panadería (3)
  - Higiene (4)
  - Limpieza (4)
```

**Comportamiento:**
- ✅ NO elimina datos existentes
- ✅ Omite duplicados automáticamente
- ✅ Seguro para ejecutar múltiples veces

**Cuándo usar:**
- Primera vez configurando el sistema
- Necesitas datos de prueba
- Quieres productos de ejemplo

---

### `npm run seed:clean`
**Descripción:** Limpia la BD y vuelve a insertar todos los datos

**⚠️ ADVERTENCIA:** Elimina TODOS los usuarios y productos

**Cuándo usar:**
- Quieres empezar desde cero
- Tienes duplicados o datos corruptos
- Necesitas resetear completamente

---

### `npm run seed:users`
**Descripción:** Solo inserta usuarios (script antiguo)

**Nota:** Usa `npm run seed` en su lugar (más completo)

---

## 🚀 INICIAR SERVIDOR

### `npm run dev`
**Descripción:** Inicia el servidor en modo desarrollo con auto-reload

**Características:**
- 🔄 Auto-reload con nodemon
- 📝 Logs detallados
- 🐛 Stack traces completos
- ⚡ Hot reload al modificar archivos

**Puerto:** http://localhost:5000

**Salida:**
```
🚀 Servidor corriendo en puerto 5000
✅ Conectado a MongoDB exitosamente
📡 Endpoints disponibles: 177+
```

**Cuándo usar:**
- Desarrollo activo
- Haciendo cambios al código
- Necesitas ver logs en tiempo real

---

### `npm start`
**Descripción:** Inicia el servidor en modo producción

**Características:**
- ⚡ Sin auto-reload
- 📊 Logs optimizados
- 🚀 Mejor rendimiento

**Cuándo usar:**
- Servidor en producción
- No necesitas hot-reload
- Máximo rendimiento

---

## 🔍 VERIFICACIÓN Y DIAGNÓSTICO

### `npm run quick-check`
**Descripción:** Verificación rápida y completa del sistema

**Qué verifica:**
1. ✅ Estructura de archivos (modelos, controladores, rutas)
2. ✅ Formato ES6 modules
3. ✅ Imports correctos
4. ✅ Dependencias instaladas
5. ✅ Archivos de configuración
6. ✅ Scripts de Node.js

**Salida:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔍 Verificación Rápida del Backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Modelos... ✅ OK (22)
📋 Controladores... ✅ OK (20)
📋 Rutas... ✅ OK (21)

✅ VERIFICACIÓN COMPLETA: TODO CORRECTO
```

**Cuándo usar:**
- Antes de iniciar el servidor
- Después de cambios estructurales
- Para diagnosticar problemas
- Después de clonar el repositorio

---

### `npm run check-config`
**Descripción:** Verifica la configuración del archivo .env

**Qué verifica:**
1. ✅ Archivo .env existe
2. ✅ Variables requeridas están definidas
3. ✅ MONGODB_URI tiene formato correcto
4. ✅ JWT_SECRET es seguro
5. ✅ Puerto está disponible

**Salida:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 Verificación de Configuración
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Archivo .env encontrado
✓ MONGODB_URI configurado
✓ JWT_SECRET configurado
✓ PORT configurado

✅ Configuración válida
```

**Cuándo usar:**
- Error "MONGODB_URI is not defined"
- Problemas de conexión
- Después de editar .env
- Primera vez configurando

---

### `npm run check-mongo`
**Descripción:** Verifica la conexión a MongoDB

**Qué verifica:**
1. ✅ MongoDB está corriendo
2. ✅ Puede conectarse
3. ✅ Base de datos existe
4. ✅ Puede listar colecciones

**Salida:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔍 Verificación de MongoDB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ MongoDB está corriendo
✓ Conectado exitosamente
✓ Base de datos: pos_santander
✓ Colecciones: 7

✅ MongoDB OK
```

**Cuándo usar:**
- Error "Cannot connect to MongoDB"
- Antes de iniciar el servidor
- Verificar que MongoDB esté corriendo
- Problemas de conexión

---

### `npm run check-db`
**Descripción:** Muestra el contenido de la base de datos

**Qué muestra:**
1. 👤 Lista de usuarios con roles
2. 🛍️ Lista de productos por categoría
3. 📊 Estadísticas generales
4. 📦 Colecciones disponibles

**Salida:**
```
👤 USUARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usuario      Nombre                 Rol        Estado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
admin        Administrador...       Admin      ✓ Activo
supervisor1  María García...        Supervisor ✓ Activo
cajero1      Juan Carlos...         Cajero     ✓ Activo

🛍️ PRODUCTOS
━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Bebidas (5 productos)
  Coca-Cola 600ml          $18.00   120
  Agua Ciel 1L             $12.00   200
  ...

📊 Total: 4 usuarios | 33 productos
```

**Cuándo usar:**
- Ver qué hay en la base de datos
- Verificar que el seed funcionó
- Debug de datos
- Antes de limpiar la BD

---

## 🛠️ OTROS COMANDOS

### `npm run verify`
**Descripción:** Verificación exhaustiva del sistema (script antiguo)

**Nota:** Usa `npm run quick-check` en su lugar (más rápido)

---

### `npm run audit`
**Descripción:** Auditoría completa del backend

**Qué hace:**
- Verifica coherencia de archivos
- Analiza imports y exports
- Revisa endpoints duplicados

**Cuándo usar:**
- Desarrollo de nuevas funcionalidades
- Cambios estructurales importantes
- Auditoría de código

---

## 🎯 FLUJOS DE TRABAJO COMUNES

### 🆕 Primera Vez - Configuración Completa
```bash
cd server
npm install
npm run setup
npm run seed
npm run check-db
npm run dev
```

---

### 🔄 Desarrollo Diario
```bash
cd server
npm run dev
```

---

### 🗑️ Resetear Sistema Completo
```bash
npm run seed:clean
npm run check-db
npm run dev
```

---

### 🔍 Diagnosticar Problemas
```bash
npm run quick-check
npm run check-config
npm run check-mongo
npm run check-db
```

---

### ✨ Agregar Datos de Ejemplo
```bash
npm run seed
npm run check-db
```

---

## 🆘 SOLUCIÓN RÁPIDA DE PROBLEMAS

| Error | Comando de Solución |
|-------|---------------------|
| "Cannot connect to MongoDB" | `npm run check-mongo` |
| "MONGODB_URI is not defined" | `npm run check-config` |
| "Port already in use" | Cambiar PORT en .env |
| "Module not found" | `npm install` |
| BD vacía | `npm run seed` |
| Datos corruptos | `npm run seed:clean` |
| Sistema no arranca | `npm run quick-check` |

---

## 🔑 CREDENCIALES DE ACCESO

Después de `npm run seed`:

| Rol | Usuario | Password |
|-----|---------|----------|
| **Administrador** | admin | admin123 |
| **Supervisor** | supervisor1 | super123 |
| **Cajero 1** | cajero1 | cajero123 |
| **Cajero 2** | cajero2 | cajero123 |

---

## 📁 ARCHIVOS DE DOCUMENTACIÓN

| Archivo | Descripción |
|---------|-------------|
| [INICIO_RAPIDO.md](INICIO_RAPIDO.md) | Guía paso a paso (5 min) |
| [SEED_README.md](SEED_README.md) | Documentación de seeds |
| [README.md](README.md) | Documentación completa |
| [COMANDOS_RAPIDOS.md](COMANDOS_RAPIDOS.md) | Este archivo |

---

## 💡 TIPS RÁPIDOS

1. **Siempre verifica primero:** `npm run quick-check`
2. **Ver contenido de BD:** `npm run check-db`
3. **Problemas de conexión:** `npm run check-mongo`
4. **Resetear datos:** `npm run seed:clean`
5. **Desarrollo:** Usa `npm run dev` (auto-reload)

---

**¡Listo para usar! 🚀**

Para más detalles, consulta: [INICIO_RAPIDO.md](INICIO_RAPIDO.md)
