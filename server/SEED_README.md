# 🌱 Script de Inicialización de Base de Datos (Seed)

Este documento explica cómo usar el script de seed para poblar la base de datos con datos iniciales.

## 📋 Tabla de Contenidos

- [¿Qué Incluye el Seed?](#qué-incluye-el-seed)
- [Requisitos Previos](#requisitos-previos)
- [Uso Rápido](#uso-rápido)
- [Comandos Disponibles](#comandos-disponibles)
- [Credenciales de Acceso](#credenciales-de-acceso)
- [Datos Insertados](#datos-insertados)

---

## 🎯 ¿Qué Incluye el Seed?

El script de seed inserta los siguientes datos en la base de datos:

### 👤 **Usuarios** (4 usuarios)
- ✅ 1 Administrador
- ✅ 1 Supervisor
- ✅ 2 Cajeros

### 🛍️ **Productos** (33 productos)
- ✅ Bebidas (5 productos)
- ✅ Botanas (5 productos)
- ✅ Dulces y Chocolates (5 productos)
- ✅ Lácteos (3 productos)
- ✅ Abarrotes (5 productos)
- ✅ Panadería (3 productos)
- ✅ Higiene Personal (4 productos)
- ✅ Limpieza (4 productos)

---

## ⚙️ Requisitos Previos

Antes de ejecutar el seed, asegúrate de:

1. **MongoDB está corriendo**
   ```bash
   # Verifica que MongoDB esté activo
   npm run check-mongo
   ```

2. **Variables de entorno configuradas**
   ```bash
   # Verifica la configuración
   npm run check-config
   ```

3. **Backend funcional**
   ```bash
   # Verifica el sistema completo
   npm run quick-check
   ```

---

## 🚀 Uso Rápido

### **Opción 1: Insertar datos (mantener existentes)**

Este comando inserta los datos de seed **sin eliminar** los datos existentes. Si un usuario o producto ya existe, lo omite.

```bash
cd C:\Users\Jose\workspace\Puntodeventapos\server
npm run seed
```

### **Opción 2: Limpiar y volver a insertar**

Este comando **elimina todos los datos** existentes y luego inserta los datos de seed desde cero.

⚠️ **ADVERTENCIA:** Esto eliminará TODOS los usuarios y productos de la base de datos.

```bash
cd C:\Users\Jose\workspace\Puntodeventapos\server
npm run seed:clean
```

---

## 📝 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run seed` | Inserta datos iniciales (omite duplicados) |
| `npm run seed:clean` | Limpia la BD y vuelve a insertar |

---

## 🔑 Credenciales de Acceso

Después de ejecutar el seed, puedes iniciar sesión con:

### 🔴 **Administrador**
```
Usuario:   admin
Password:  admin123
Rol:       Administrador
```
**Permisos:** Acceso total al sistema

---

### 🟡 **Supervisor**
```
Usuario:   supervisor1
Password:  super123
Rol:       Supervisor
Nombre:    María García López
```
**Permisos:** Puede ver reportes, gestionar ventas y productos (sin eliminar)

---

### 🟢 **Cajeros**

**Cajero 1** (Turno Matutino)
```
Usuario:   cajero1
Password:  cajero123
Rol:       Cajero
Nombre:    Juan Carlos Martínez
Horario:   07:00 - 15:00 (Lun-Vie)
```

**Cajero 2** (Turno Vespertino)
```
Usuario:   cajero2
Password:  cajero123
Rol:       Cajero
Nombre:    Ana Laura Rodríguez
Horario:   15:00 - 23:00 (Lun-Dom)
```

**Permisos:** Pueden realizar ventas y registrar clientes

---

## 📊 Datos Insertados

### **Productos por Categoría**

#### 🥤 Bebidas (5 productos)
- Coca-Cola 600ml - $18.00
- Agua Ciel 1L - $12.00
- Pepsi 600ml - $18.00
- Jugos Del Valle 1L - $28.00
- Red Bull 250ml - $35.00

#### 🍿 Botanas (5 productos)
- Sabritas Original 45g - $15.00
- Doritos Nacho 62g - $18.00
- Cheetos Poffs 55g - $16.00
- Ruffles Queso 45g - $15.50
- Cacahuates Japoneses 50g - $12.00

#### 🍫 Dulces y Chocolates (5 productos)
- Chocolate Hershey's 45g - $22.00
- Snickers 50g - $20.00
- M&M's 45g - $19.00
- Skittles 61g - $18.00
- Pulparindo 14g - $8.00

#### 🥛 Lácteos (3 productos)
- Leche Lala 1L Entera - $25.00
- Yogurt Danone Natural 1L - $32.00
- Queso Oaxaca 400g - $65.00

#### 🍚 Abarrotes (5 productos)
- Arroz San Miguel 1kg - $38.00
- Frijol Negro La Costeña 560g - $24.00
- Aceite Capullo 1L - $42.00
- Atún Herdez 140g - $22.00
- Sopa Nissin 64g - $10.00

#### 🍞 Panadería (3 productos)
- Pan Bimbo Blanco Grande - $38.00
- Pan Integral Bimbo - $42.00
- Tortillas de Harina 1kg - $35.00

#### 🧼 Higiene Personal (4 productos)
- Jabón Dove 100g - $28.00
- Shampoo Sedal 340ml - $45.00
- Papel Higiénico Pétalo 4 Rollos - $32.00
- Pasta Colgate 75ml - $35.00

#### 🧹 Limpieza (4 productos)
- Cloro Cloralex 1L - $28.00
- Detergente Ariel 1kg - $68.00
- Pinol Limpiador 1L - $32.00
- Fabuloso 1L - $30.00

---

## 💡 Ejemplo de Salida

Al ejecutar `npm run seed`, verás algo como:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🌱 SEED - Sistema POS Santander
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Conectando a MongoDB: mongodb://localhost:27017/pos_santander
✓ Conectado a MongoDB exitosamente

👤 Insertando Usuarios

✓ Usuario 'admin' creado - Rol: admin
✓ Usuario 'supervisor1' creado - Rol: supervisor
✓ Usuario 'cajero1' creado - Rol: cashier
✓ Usuario 'cajero2' creado - Rol: cashier

📊 Usuarios: 4 insertados, 0 omitidos

🛍️  Insertando Productos

✓ Producto 'Coca-Cola 600ml' creado - $18
✓ Producto 'Agua Ciel 1L' creado - $12
...

📊 Productos: 33 insertados, 0 omitidos

📊 Resumen de Base de Datos

Usuarios:
  Total:        4
  Admin:        1
  Supervisores: 1
  Cajeros:      2

Productos:
  Total:        33
  Categorías:   8 (Bebidas, Botanas, Dulces, Lácteos, ...)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 CREDENCIALES DE ACCESO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Administrador:
  Usuario:   admin
  Password:  admin123

Supervisor:
  Usuario:   supervisor1
  Password:  super123

Cajeros:
  Usuario:   cajero1 / cajero2
  Password:  cajero123

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ ✨ Proceso completado exitosamente
```

---

## 🔄 Casos de Uso

### **Caso 1: Primera vez configurando el sistema**

```bash
# 1. Verificar que todo esté bien
npm run quick-check

# 2. Insertar datos iniciales
npm run seed

# 3. Iniciar el servidor
npm run dev
```

### **Caso 2: Resetear la base de datos**

```bash
# Limpiar todo y volver a insertar
npm run seed:clean
```

### **Caso 3: Agregar datos sin perder los existentes**

```bash
# Solo inserta lo que no existe
npm run seed
```

---

## 🛠️ Solución de Problemas

### **Error: "Cannot connect to MongoDB"**

**Solución:**
```bash
# 1. Verifica que MongoDB esté corriendo
npm run check-mongo

# 2. Si no está corriendo, inícialo
mongod
```

### **Error: "E11000 duplicate key error"**

**Causa:** Estás intentando insertar un usuario o producto que ya existe.

**Solución:**
```bash
# Usa seed:clean para limpiar y volver a insertar
npm run seed:clean
```

### **Error: "MONGODB_URI is not defined"**

**Causa:** Falta el archivo `.env`

**Solución:**
```bash
# 1. Copia el archivo de ejemplo
cp .env.example .env

# 2. Edita las variables según tu configuración
# 3. Vuelve a intentar
npm run seed
```

---

## 📚 Siguientes Pasos

Después de ejecutar el seed:

1. ✅ **Inicia el servidor**
   ```bash
   npm run dev
   ```

2. ✅ **Inicia sesión en el frontend**
   - Usuario: `admin`
   - Password: `admin123`

3. ✅ **Explora el sistema**
   - Ver productos en el catálogo
   - Realizar una venta de prueba
   - Probar diferentes usuarios

---

## 📧 Soporte

Si tienes problemas con el seed:

1. Ejecuta `npm run quick-check` para verificar el sistema
2. Revisa los logs del script
3. Verifica que MongoDB esté corriendo con `npm run check-mongo`

---

**¡Listo para usar! 🎉**

El sistema ahora tiene datos de prueba para que puedas comenzar a trabajar inmediatamente.
