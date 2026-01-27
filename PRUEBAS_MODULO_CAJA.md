# 🧪 Guía de Pruebas - Módulo de Gestión de Caja

## 🚀 Configuración Inicial

### 1. Obtener Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Guardar token
export TOKEN="tu_token_aqui"
```

---

## 💰 PRUEBAS DE APERTURA DE CAJA

### Test 1: Verificar que no hay caja abierta
```bash
curl http://localhost:5000/api/cash/current \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": null
}
```

### Test 2: Abrir caja con fondo inicial
```bash
curl -X POST http://localhost:5000/api/cash/open \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openingBalance": 5000,
    "denominations": [
      { "value": 1000, "quantity": 3, "total": 3000 },
      { "value": 500, "quantity": 2, "total": 1000 },
      { "value": 200, "quantity": 5, "total": 1000 }
    ],
    "notes": "Turno matutino - 27 Enero 2026"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "shiftNumber": "T20260127-001",
    "status": "open",
    "openedBy": "...",
    "openedByName": "Admin User",
    "openedAt": "2026-01-27T...",
    "openingBalance": 5000,
    "expectedClosingBalance": 5000,
    "salesCount": 0,
    "salesCash": 0,
    "salesCard": 0,
    "salesTransfer": 0,
    "salesTotal": 0,
    "totalIncome": 0,
    "totalWithdrawals": 0,
    "movements": [],
    ...
  },
  "message": "Caja abierta exitosamente"
}
```

✅ **Verificar:** 
- Número de turno generado automáticamente (T20260127-001)
- Status = "open"
- expectedClosingBalance = openingBalance

### Test 3: Intentar abrir otra caja (debe fallar)
```bash
curl -X POST http://localhost:5000/api/cash/open \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openingBalance": 3000
  }'
```

**Resultado esperado:**
```json
{
  "success": false,
  "message": "Ya tienes una caja abierta. Debes cerrarla antes de abrir una nueva."
}
```

---

## 🛍️ PRUEBAS DE VENTAS (Actualización Automática)

### Test 4: Crear venta en efectivo
```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product": {
          "id": "PRODUCTO_ID",
          "name": "Coca Cola 600ml",
          "price": 15
        },
        "quantity": 10,
        "price": 15,
        "subtotal": 150
      }
    ],
    "subtotal": 150,
    "tax": 0,
    "total": 150,
    "paymentMethod": "cash",
    "amountReceived": 200,
    "change": 50
  }'
```

### Test 5: Verificar actualización automática de caja
```bash
curl http://localhost:5000/api/cash/current \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "shiftNumber": "T20260127-001",
    "openingBalance": 5000,
    "salesCount": 1,             ✅ Incrementó
    "salesCash": 150,            ✅ Suma de ventas en efectivo
    "salesCard": 0,
    "salesTransfer": 0,
    "salesTotal": 150,
    "expectedClosingBalance": 5150,  ✅ 5000 + 150
    ...
  }
}
```

### Test 6: Crear venta con tarjeta
```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [...],
    "total": 250,
    "paymentMethod": "card"
  }'
```

### Test 7: Verificar contadores separados
```bash
curl http://localhost:5000/api/cash/current \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "salesCount": 2,
  "salesCash": 150,              ✅ Solo efectivo
  "salesCard": 250,              ✅ Solo tarjeta
  "salesTotal": 400,
  "expectedClosingBalance": 5150  ✅ No cambia (tarjeta no es efectivo)
}
```

---

## 💸 PRUEBAS DE MOVIMIENTOS

### Test 8: Registrar retiro de efectivo
```bash
curl -X POST http://localhost:5000/api/cash/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "withdrawal",
    "amount": 1000,
    "reason": "Pago a proveedor Coca Cola",
    "category": "expense",
    "notes": "Factura FAC-12345"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "expectedClosingBalance": 4150,  ✅ 5150 - 1000
    "totalWithdrawals": 1000,
    "movements": [
      {
        "type": "withdrawal",
        "amount": 1000,
        "reason": "Pago a proveedor Coca Cola",
        "category": "expense",
        "authorizedBy": "...",
        "authorizedByName": "Admin User",
        "timestamp": "2026-01-27T...",
        "notes": "Factura FAC-12345"
      }
    ]
  },
  "message": "Retiro registrado exitosamente"
}
```

### Test 9: Registrar ingreso de efectivo
```bash
curl -X POST http://localhost:5000/api/cash/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "income",
    "amount": 500,
    "reason": "Pago de cuenta por cobrar",
    "category": "income",
    "notes": "Cliente Juan Pérez"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "expectedClosingBalance": 4650,  ✅ 4150 + 500
    "totalIncome": 500,
    "totalWithdrawals": 1000,
    "movements": [
      {...},  // Retiro anterior
      {
        "type": "income",
        "amount": 500,
        ...
      }
    ]
  },
  "message": "Ingreso registrado exitosamente"
}
```

### Test 10: Intentar retirar más del disponible (debe fallar)
```bash
curl -X POST http://localhost:5000/api/cash/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "withdrawal",
    "amount": 10000,
    "reason": "Retiro grande",
    "category": "other"
  }'
```

**Resultado esperado:**
```json
{
  "success": false,
  "message": "No hay suficiente efectivo. Disponible: $4650.00"
}
```

### Test 11: Listar movimientos
```bash
curl http://localhost:5000/api/cash/movements \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": [
    { "type": "withdrawal", "amount": 1000, ... },
    { "type": "income", "amount": 500, ... }
  ]
}
```

---

## 📊 PRUEBAS DE ARQUEO

### Test 12: Crear arqueo de caja
```bash
# Guardar shiftId de la caja actual
SHIFT_ID="..." # Del test 2

curl -X POST http://localhost:5000/api/cash/counts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shiftId": "'"$SHIFT_ID"'",
    "denominations": [
      { "value": 1000, "quantity": 4, "total": 4000 },
      { "value": 500, "quantity": 1, "total": 500 },
      { "value": 100, "quantity": 1, "total": 100 },
      { "value": 50, "quantity": 1, "total": 50 }
    ],
    "type": "regular",
    "notes": "Arqueo de medio día"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "countNumber": "ARQ20260127-001",
    "shiftNumber": "T20260127-001",
    "countedBy": "...",
    "countedByName": "Admin User",
    "totalCounted": 4650,
    "expectedAmount": 4650,
    "difference": 0,              ✅ Cuadra perfecto
    "totalBills": 4600,
    "totalCoins": 50,
    "type": "regular",
    "status": "pending",
    ...
  },
  "message": "Arqueo registrado exitosamente"
}
```

### Test 13: Arqueo con diferencia (faltante)
```bash
curl -X POST http://localhost:5000/api/cash/counts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shiftId": "'"$SHIFT_ID"'",
    "denominations": [
      { "value": 1000, "quantity": 4, "total": 4000 },
      { "value": 500, "quantity": 1, "total": 500 }
    ],
    "type": "surprise",
    "notes": "Arqueo sorpresa"
  }'
```

**Resultado esperado:**
```json
{
  "data": {
    "countNumber": "ARQ20260127-002",
    "totalCounted": 4500,
    "expectedAmount": 4650,
    "difference": -150,          ✅ Faltante de $150
    "type": "surprise"
  }
}
```

### Test 14: Listar arqueos
```bash
curl "http://localhost:5000/api/cash/counts?shiftId=$SHIFT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔒 PRUEBAS DE CIERRE DE CAJA

### Test 15: Cerrar caja
```bash
curl -X POST http://localhost:5000/api/cash/close \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualClosingBalance": 4650,
    "denominations": [
      { "value": 1000, "quantity": 4, "total": 4000 },
      { "value": 500, "quantity": 1, "total": 500 },
      { "value": 100, "quantity": 1, "total": 100 },
      { "value": 50, "quantity": 1, "total": 50 }
    ],
    "notes": "Turno completado sin problemas"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "shiftNumber": "T20260127-001",
    "status": "closed",              ✅ Cerrada
    
    "openedAt": "2026-01-27T08:00:00Z",
    "closedAt": "2026-01-27T20:00:00Z",
    "duration": 720,                 ✅ 12 horas = 720 minutos
    
    "openingBalance": 5000,
    "expectedClosingBalance": 4650,
    "actualClosingBalance": 4650,
    "difference": 0,                 ✅ Cuadró perfecto
    
    "salesCount": 2,
    "salesCash": 150,
    "salesCard": 250,
    "salesTotal": 400,
    
    "totalIncome": 500,
    "totalWithdrawals": 1000,
    
    "closedBy": "...",
    "closedByName": "Admin User",
    ...
  },
  "message": "Caja cerrada exitosamente"
}
```

### Test 16: Verificar caja ya no está abierta
```bash
curl http://localhost:5000/api/cash/current \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": null         ✅ No hay caja abierta
}
```

### Test 17: Verificar arqueo de cierre automático
```bash
curl "http://localhost:5000/api/cash/counts?shiftId=$SHIFT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:** Lista de arqueos incluyendo uno tipo "closing"

---

## 📜 PRUEBAS DE HISTORIAL

### Test 18: Historial de turnos
```bash
curl http://localhost:5000/api/cash/history \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "shiftNumber": "T20260127-001",
      "status": "closed",
      "openedBy": "...",
      "openedByName": "Admin User",
      "duration": 720,
      "difference": 0,
      ...
    }
  ]
}
```

### Test 19: Filtrar por fechas
```bash
curl "http://localhost:5000/api/cash/history?startDate=2026-01-27&endDate=2026-01-28" \
  -H "Authorization: Bearer $TOKEN"
```

### Test 20: Filtrar por usuario
```bash
curl "http://localhost:5000/api/cash/history?userId=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Test 21: Filtrar solo cajas abiertas
```bash
curl "http://localhost:5000/api/cash/history?status=open" \
  -H "Authorization: Bearer $TOKEN"
```

### Test 22: Obtener turno específico por ID
```bash
curl http://localhost:5000/api/cash/$SHIFT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 PRUEBAS DE REPORTES

### Test 23: Resumen del día
```bash
curl http://localhost:5000/api/cash/summary \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "activeShift": null,    // No hay caja abierta
    "today": {
      "shiftsCount": 1,
      "openShifts": 0,
      "closedShifts": 1,
      "totalSales": 400,
      "totalCash": 150,
      "totalCard": 250
    }
  }
}
```

---

## 🔄 FLUJO COMPLETO DE PRUEBA

### Escenario: Día Completo de Trabajo

```bash
# 1. Abrir caja (8:00 AM)
curl -X POST http://localhost:5000/api/cash/open \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"openingBalance": 5000}'

# 2. Venta 1 - Efectivo $150
curl -X POST http://localhost:5000/api/sales \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"total": 150, "paymentMethod": "cash", ...}'

# 3. Venta 2 - Tarjeta $250
curl -X POST http://localhost:5000/api/sales \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"total": 250, "paymentMethod": "card", ...}'

# 4. Retiro para gastos $1000
curl -X POST http://localhost:5000/api/cash/movements \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "withdrawal", "amount": 1000, "reason": "Gastos varios", "category": "expense"}'

# 5. Ingreso por cuenta cobrada $500
curl -X POST http://localhost:5000/api/cash/movements \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "income", "amount": 500, "reason": "Pago de cliente", "category": "income"}'

# 6. Arqueo de medio día (2:00 PM)
curl -X POST http://localhost:5000/api/cash/counts \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "shiftId": "SHIFT_ID",
    "denominations": [...],
    "type": "regular"
  }'

# 7. Más ventas...
# 8. Cerrar caja (8:00 PM)
curl -X POST http://localhost:5000/api/cash/close \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"actualClosingBalance": 4650, "denominations": [...]}'

# 9. Ver resumen final
curl http://localhost:5000/api/cash/$SHIFT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ CHECKLIST DE PRUEBAS

### Apertura
- [ ] Abrir caja exitosamente
- [ ] Generar número de turno automático
- [ ] No permitir abrir si ya hay una abierta
- [ ] Registrar denominaciones de apertura

### Ventas (Integración)
- [ ] Venta en efectivo actualiza caja
- [ ] Venta con tarjeta actualiza contadores
- [ ] Balance esperado se recalcula
- [ ] Contadores separados por método de pago

### Movimientos
- [ ] Registrar retiro
- [ ] Registrar ingreso
- [ ] Validar que retiro no exceda disponible
- [ ] Listar movimientos correctamente
- [ ] Balance esperado se actualiza

### Arqueos
- [ ] Crear arqueo regular
- [ ] Calcular diferencia automáticamente
- [ ] Separar billetes de monedas
- [ ] Listar arqueos de un turno
- [ ] Generar número de arqueo

### Cierre
- [ ] Cerrar caja exitosamente
- [ ] Calcular diferencia final
- [ ] Calcular duración del turno
- [ ] Crear arqueo de cierre automático
- [ ] Cambiar status a "closed"
- [ ] No permitir movimientos después del cierre

### Historial
- [ ] Listar todos los turnos
- [ ] Filtrar por fechas
- [ ] Filtrar por usuario
- [ ] Filtrar por status
- [ ] Obtener turno específico

### Reportes
- [ ] Resumen del día
- [ ] Mostrar turno activo
- [ ] Totales correctos

---

## 🎉 RESULTADO ESPERADO

Al completar todas las pruebas:

✅ 1 turno completado (T20260127-001)  
✅ 2 ventas registradas (efectivo + tarjeta)  
✅ 2 movimientos (1 retiro + 1 ingreso)  
✅ 3 arqueos (2 regulares + 1 de cierre)  
✅ Balance cuadrado (diferencia = $0)  
✅ Auditoría completa de todas las operaciones  

**¡Sistema de caja completamente funcional!** 💰
