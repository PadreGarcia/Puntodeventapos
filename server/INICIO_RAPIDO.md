# 🚀 Inicio Rápido - Sistema POS Santander

Guía paso a paso para poner en marcha el sistema en menos de 5 minutos.

---

## ✅ Pasos para Iniciar

### **Paso 1: Verificar MongoDB** ⏱️ 30 segundos

```bash
cd C:\Users\Jose\workspace\Puntodeventapos\server
npm run check-mongo
```

**Si MongoDB NO está corriendo:**
- Abre otra terminal y ejecuta: `mongod`
- O inicia el servicio de MongoDB desde Servicios de Windows

---

### **Paso 2: Verificar Configuración** ⏱️ 10 segundos

```bash
npm run check-config
```

✅ **Todo debe aparecer en verde**

---

### **Paso 3: Insertar Datos Iniciales** ⏱️ 2 segundos

```bash
npm run seed
```

Esto crea:
- ✅ Usuario admin (admin/admin123)
- ✅ 3 usuarios de ejemplo
- ✅ 33 productos en 8 categorías

---

### **Paso 4: Verificar Base de Datos** ⏱️ 5 segundos

```bash
npm run check-db
```

Deberías ver todos los usuarios y productos creados.

---

### **Paso 5: Iniciar el Servidor** ⏱️ 5 segundos

```bash
npm run dev
```

✅ **El servidor debería iniciar en:** `http://localhost:5000`

---

## 🎯 Resumen de Comandos

```bash
# 1️⃣ Ir al directorio
cd C:\Users\Jose\workspace\Puntodeventapos\server

# 2️⃣ Verificar MongoDB
npm run check-mongo

# 3️⃣ Insertar datos iniciales
npm run seed

# 4️⃣ Verificar que todo esté bien
npm run check-db

# 5️⃣ Iniciar servidor
npm run dev
```

---

## 🔑 Credenciales de Acceso

### **Administrador** (Acceso Total)
```
Usuario:   admin
Password:  admin123
```

### **Supervisor** (Acceso Limitado)
```
Usuario:   supervisor1
Password:  super123
```

### **Cajero** (Solo Ventas)
```
Usuario:   cajero1
Password:  cajero123
```

---

## 🛠️ Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor en modo desarrollo |
| `npm run check-mongo` | Verificar conexión a MongoDB |
| `npm run check-config` | Verificar configuración |
| `npm run check-db` | Ver contenido de la base de datos |
| `npm run seed` | Insertar datos iniciales |
| `npm run seed:clean` | Limpiar BD y volver a insertar |
| `npm run quick-check` | Verificación completa del sistema |

---

## 📊 Verificar que Todo Funciona

### **1. Servidor corriendo**

Deberías ver:
```
🚀 Servidor corriendo en puerto 5000
✅ Conectado a MongoDB exitosamente
```

### **2. Probar endpoint de prueba**

Abre en tu navegador:
```
http://localhost:5000/api/test
```

Deberías ver:
```json
{
  "message": "API funcionando correctamente",
  "timestamp": "2025-01-27T..."
}
```

### **3. Verificar usuarios**

```bash
npm run check-db
```

Deberías ver 4 usuarios y 33 productos.

---

## ❌ Solución de Problemas

### **Error: "Cannot connect to MongoDB"**

**Solución:**
```bash
# Inicia MongoDB
mongod

# En otra terminal, vuelve a intentar
npm run dev
```

---

### **Error: "Port 5000 is already in use"**

**Solución 1:** Cambiar puerto en `.env`
```bash
PORT=5001
```

**Solución 2:** Cerrar proceso que usa puerto 5000
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <número_de_proceso> /F
```

---

### **Error: "MONGODB_URI is not defined"**

**Solución:**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Verificar configuración
npm run check-config
```

---

## 🎉 ¡Listo!

Si llegaste hasta aquí, el backend está funcionando perfectamente.

**Próximos pasos:**

1. ✅ Abrir el frontend en tu navegador
2. ✅ Iniciar sesión con `admin` / `admin123`
3. ✅ Explorar el sistema POS

---

## 📁 Estructura de Comandos por Frecuencia

### **Uso Diario**
```bash
npm run dev              # Iniciar servidor
```

### **Primera Vez / Resetear**
```bash
npm run seed             # Insertar datos
npm run seed:clean       # Limpiar y volver a insertar
```

### **Verificación / Debug**
```bash
npm run check-db         # Ver contenido de BD
npm run check-mongo      # Verificar MongoDB
npm run quick-check      # Verificación completa
```

---

## 💡 Tips

1. **Mantén MongoDB corriendo** en una terminal separada
2. **Usa `npm run check-db`** para ver rápidamente qué hay en la BD
3. **Si algo falla**, ejecuta `npm run quick-check` para diagnóstico completo
4. **Para resetear datos**, usa `npm run seed:clean`

---

## 📞 Soporte

Si tienes problemas:

1. Ejecuta: `npm run quick-check`
2. Lee el output y corrige los errores marcados
3. Verifica que MongoDB esté corriendo

---

**¡Bienvenido al Sistema POS Santander! 🎊**
