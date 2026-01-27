# 🧪 Guía de Pruebas - Módulo de Compras

## 🚀 Inicio Rápido

### 1. Iniciar el Backend
```bash
cd server
npm run dev
```

**Debe mostrar:**
```
🚀 Servidor corriendo en puerto 5000
📍 API disponible en: http://localhost:5000/api
🏥 Health check: http://localhost:5000/api/health
```

### 2. Obtener Token de Autenticación
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Guarda el token de la respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Exporta el token:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📦 Pruebas de Órdenes de Compra

### Test 1: Listar Órdenes
```bash
curl http://localhost:5000/api/purchase-orders \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": []
}
```

### Test 2: Crear Orden de Compra
```bash
curl -X POST http://localhost:5000/api/purchase-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "supplier-123",
    "supplierName": "Coca Cola FEMSA",
    "items": [
      {
        "productId": "prod-coca",
        "productName": "Coca Cola 600ml",
        "quantity": 100,
        "unitCost": 10,
        "total": 1000
      },
      {
        "productId": "prod-sprite",
        "productName": "Sprite 600ml",
        "quantity": 50,
        "unitCost": 10,
        "total": 500
      }
    ],
    "subtotal": 1500,
    "tax": 240,
    "total": 1740,
    "expectedDate": "2026-02-15",
    "notes": "Orden de prueba"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "orderNumber": "OC202601-0001",
    "status": "draft",
    "supplierId": "supplier-123",
    "supplierName": "Coca Cola FEMSA",
    "items": [...],
    "total": 1740,
    "createdBy": "...",
    "createdByName": "Admin User",
    "createdAt": "2026-01-27T...",
    ...
  },
  "message": "Orden de compra creada exitosamente"
}
```

✅ **Verificar:** Número de orden generado automáticamente (OC202601-0001)

### Test 3: Cambiar Status a "Enviada"
```bash
# Guarda el ID de la orden creada
ORDER_ID="..." # Copia el _id de la respuesta anterior

curl -X PATCH http://localhost:5000/api/purchase-orders/$ORDER_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "sent"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "status": "sent",
    "sentAt": "2026-01-27T...",
    ...
  },
  "message": "Orden enviada exitosamente"
}
```

✅ **Verificar:** Campo `sentAt` tiene fecha/hora

### Test 4: Cambiar Status a "Aprobada"
```bash
curl -X PATCH http://localhost:5000/api/purchase-orders/$ORDER_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "status": "approved",
    "approvedAt": "2026-01-27T...",
    "approvedBy": "...",
    ...
  },
  "message": "Orden aprobada exitosamente"
}
```

✅ **Verificar:** Campos `approvedAt` y `approvedBy` están completos

---

## 📥 Pruebas de Recepciones

### Test 5: Crear Recepción
```bash
curl -X POST http://localhost:5000/api/receipts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "'"$ORDER_ID"'",
    "items": [
      {
        "productId": "prod-coca",
        "productName": "Coca Cola 600ml",
        "quantityOrdered": 100,
        "quantityReceived": 98,
        "unitCost": 10,
        "total": 980,
        "notes": "2 botellas rotas en transporte"
      },
      {
        "productId": "prod-sprite",
        "productName": "Sprite 600ml",
        "quantityOrdered": 50,
        "quantityReceived": 50,
        "unitCost": 10,
        "total": 500
      }
    ],
    "notes": "Recepción con discrepancia en Coca Cola"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "receiptNumber": "RC202601-0001",
    "purchaseOrderId": "...",
    "orderNumber": "OC202601-0001",
    "status": "partial",
    "items": [...],
    "discrepancies": [
      {
        "productId": "prod-coca",
        "productName": "Coca Cola 600ml",
        "expected": 100,
        "received": 98,
        "difference": -2,
        "reason": "2 botellas rotas en transporte"
      }
    ],
    "receivedBy": "...",
    "receivedByName": "Admin User",
    ...
  },
  "message": "Recepción creada exitosamente"
}
```

✅ **Verificar:** 
- Número de recepción generado (RC202601-0001)
- Discrepancias detectadas automáticamente
- Status = "partial" porque hubo diferencias

### Test 6: Verificar Stock Actualizado
```bash
# Verificar que el stock se actualizó
curl http://localhost:5000/api/products/prod-coca \
  -H "Authorization: Bearer $TOKEN"
```

✅ **Verificar:** Stock del producto aumentó en 98 unidades

### Test 7: Verificar Orden Recibida
```bash
curl http://localhost:5000/api/purchase-orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

✅ **Verificar:** 
- Status = "received"
- Campo `receivedAt` tiene fecha/hora

---

## 💰 Pruebas de Facturas

### Test 8: Crear Factura
```bash
curl -X POST http://localhost:5000/api/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "FAC-COCA-12345",
    "supplierId": "supplier-123",
    "supplierName": "Coca Cola FEMSA",
    "purchaseOrderId": "'"$ORDER_ID"'",
    "orderNumber": "OC202601-0001",
    "items": [
      {
        "productId": "prod-coca",
        "productName": "Coca Cola 600ml",
        "quantity": 98,
        "unitCost": 10,
        "total": 980
      },
      {
        "productId": "prod-sprite",
        "productName": "Sprite 600ml",
        "quantity": 50,
        "unitCost": 10,
        "total": 500
      }
    ],
    "subtotal": 1480,
    "tax": 236.8,
    "total": 1716.8,
    "invoiceDate": "2026-01-27",
    "paymentTerms": 30,
    "taxId": "COCA123456ABC",
    "notes": "Factura por recepción RC202601-0001"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "invoiceNumber": "FAC-COCA-12345",
    "status": "pending",
    "total": 1716.8,
    "amountPaid": 0,
    "amountDue": 1716.8,
    "invoiceDate": "2026-01-27T...",
    "dueDate": "2026-02-26T...",
    ...
  },
  "message": "Factura registrada exitosamente"
}
```

✅ **Verificar:** 
- Fecha de vencimiento = invoiceDate + 30 días
- amountDue = total (nada pagado aún)
- Status = "pending"

### Test 9: Verificar Cuenta por Pagar Creada
```bash
curl http://localhost:5000/api/payables \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "invoiceNumber": "FAC-COCA-12345",
      "supplierName": "Coca Cola FEMSA",
      "amount": 1716.8,
      "amountPaid": 0,
      "amountDue": 1716.8,
      "status": "pending",
      "paymentHistory": [],
      ...
    }
  ]
}
```

✅ **Verificar:** Cuenta por pagar creada automáticamente

---

## 💳 Pruebas de Pagos

### Test 10: Registrar Pago Parcial
```bash
# Guarda el ID de la cuenta por pagar
PAYABLE_ID="..." # Copia el _id de la cuenta

curl -X POST http://localhost:5000/api/payables/$PAYABLE_ID/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "paymentMethod": "transfer",
    "reference": "TRANSFER-98765",
    "notes": "Pago parcial - Primera cuota"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "amountPaid": 1000,
    "amountDue": 716.8,
    "status": "partial",
    "paymentHistory": [
      {
        "paymentDate": "2026-01-27T...",
        "amount": 1000,
        "paymentMethod": "transfer",
        "reference": "TRANSFER-98765",
        "notes": "Pago parcial - Primera cuota",
        "processedBy": "...",
        "processedByName": "Admin User"
      }
    ],
    ...
  },
  "message": "Pago registrado exitosamente"
}
```

✅ **Verificar:**
- amountPaid = 1000
- amountDue = 716.8 (1716.8 - 1000)
- Status cambió a "partial"
- Pago agregado a paymentHistory

### Test 11: Registrar Pago Final
```bash
curl -X POST http://localhost:5000/api/payables/$PAYABLE_ID/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 716.8,
    "paymentMethod": "transfer",
    "reference": "TRANSFER-99999",
    "notes": "Pago final - Liquidación completa"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "amountPaid": 1716.8,
    "amountDue": 0,
    "status": "paid",
    "paymentHistory": [
      {
        "paymentDate": "2026-01-27T...",
        "amount": 1000,
        ...
      },
      {
        "paymentDate": "2026-01-27T...",
        "amount": 716.8,
        "paymentMethod": "transfer",
        "reference": "TRANSFER-99999",
        "notes": "Pago final - Liquidación completa",
        ...
      }
    ],
    ...
  },
  "message": "Pago registrado exitosamente"
}
```

✅ **Verificar:**
- amountPaid = total completo
- amountDue = 0
- Status cambió a "paid"
- Dos pagos en paymentHistory

### Test 12: Verificar Factura Pagada
```bash
# Guarda el ID de la factura
INVOICE_ID="..." # Del test 8

curl http://localhost:5000/api/invoices/$INVOICE_ID \
  -H "Authorization: Bearer $TOKEN"
```

✅ **Verificar:**
- amountPaid = 1716.8
- amountDue = 0
- Status = "paid"

---

## 📊 Pruebas de Reportes

### Test 13: Resumen de Cuentas por Pagar
```bash
curl http://localhost:5000/api/payables/summary \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "totalPending": 0,
    "overdue": {
      "total": 0,
      "count": 0
    },
    "dueSoon": {
      "total": 0,
      "count": 0
    },
    "bySupplier": []
  }
}
```

### Test 14: Facturas Vencidas
```bash
curl http://localhost:5000/api/invoices/overdue \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Pruebas de Filtros

### Test 15: Filtrar Órdenes por Status
```bash
curl "http://localhost:5000/api/purchase-orders?status=received" \
  -H "Authorization: Bearer $TOKEN"
```

### Test 16: Filtrar por Proveedor
```bash
curl "http://localhost:5000/api/purchase-orders?supplierId=supplier-123" \
  -H "Authorization: Bearer $TOKEN"
```

### Test 17: Filtrar por Rango de Fechas
```bash
curl "http://localhost:5000/api/receipts?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔐 Pruebas de Seguridad

### Test 18: Sin Token (Debe Fallar)
```bash
curl http://localhost:5000/api/purchase-orders
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Token no proporcionado"
}
```

### Test 19: Token Inválido (Debe Fallar)
```bash
curl http://localhost:5000/api/purchase-orders \
  -H "Authorization: Bearer token_invalido"
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Token inválido"
}
```

### Test 20: Cajero Intentando Crear Orden (Debe Fallar)
```bash
# Login como cajero
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cashier",
    "password": "cashier123"
  }'

# Usar token de cajero
export CASHIER_TOKEN="..."

curl -X POST http://localhost:5000/api/purchase-orders \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción"
}
```

---

## 📝 Pruebas de Validación

### Test 21: Pagar Más del Monto Pendiente (Debe Fallar)
```bash
curl -X POST http://localhost:5000/api/payables/$PAYABLE_ID/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99999,
    "paymentMethod": "cash"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "El monto excede lo pendiente ($...)"
}
```

### Test 22: Eliminar Orden Recibida (Debe Fallar)
```bash
curl -X DELETE http://localhost:5000/api/purchase-orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Solo se pueden eliminar órdenes en borrador o canceladas"
}
```

---

## 📋 Checklist de Pruebas

### Órdenes de Compra
- [ ] Listar órdenes vacío
- [ ] Crear orden (número auto-generado)
- [ ] Cambiar status a sent
- [ ] Cambiar status a approved
- [ ] Filtrar por status
- [ ] Filtrar por proveedor
- [ ] Validar permisos (cashier no puede)

### Recepciones
- [ ] Crear recepción vinculada a orden
- [ ] Detectar discrepancias automáticamente
- [ ] Actualizar stock automáticamente
- [ ] Cambiar orden a received
- [ ] Listar recepciones

### Facturas
- [ ] Crear factura
- [ ] Calcular fecha de vencimiento
- [ ] Crear cuenta por pagar automáticamente
- [ ] Registrar pago parcial
- [ ] Registrar pago final
- [ ] Actualizar status automáticamente
- [ ] Listar facturas vencidas

### Cuentas por Pagar
- [ ] Listar cuentas
- [ ] Registrar pago con historial
- [ ] Calcular montos automáticamente
- [ ] Resumen financiero
- [ ] Validar monto de pago

### Seguridad
- [ ] Rechazar sin token
- [ ] Rechazar token inválido
- [ ] Validar permisos por rol
- [ ] Auditoría de todas las acciones

---

## 🎉 Resultado Esperado

Al completar todas las pruebas, deberías tener:

✅ 1 orden de compra creada (OC202601-0001)  
✅ 1 recepción creada (RC202601-0001)  
✅ Stock de productos actualizado (+98, +50)  
✅ 1 factura registrada (FAC-COCA-12345)  
✅ 1 cuenta por pagar creada  
✅ 2 pagos registrados (parcial + final)  
✅ Cuenta por pagar completamente pagada  
✅ Logs de auditoría de todas las operaciones  

**¡Backend completamente funcional!** 🚀
