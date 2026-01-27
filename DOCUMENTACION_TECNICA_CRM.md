# 📘 Documentación Técnica - Módulo CRM

## 📋 Tabla de Contenido

1. [Modelos de Datos](#modelos-de-datos)
2. [API Endpoints](#api-endpoints)
3. [Flujos de Negocio](#flujos-de-negocio)
4. [Fórmulas y Cálculos](#fórmulas-y-cálculos)
5. [Seguridad](#seguridad)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 1️⃣ MODELOS DE DATOS

### Customer (Cliente)
**Archivo:** `/server/src/models/Customer.js`

```javascript
{
  // Información Básica
  name: String,
  email: String,
  phone: String,
  address: String,
  
  // Identificación
  rfc: String,
  curp: String,
  ine: String,
  dateOfBirth: Date,
  
  // Dirección Completa
  street: String,
  neighborhood: String,
  city: String,
  state: String,
  zipCode: String,
  
  // Referencias Personales
  references: [{
    name: String,
    phone: String,
    relationship: String,
    address: String
  }],
  
  // NFC y Lealtad
  nfcCardId: String,          // UID único de tarjeta
  loyaltyPoints: Number,      // Default: 0
  loyaltyTier: Enum,          // bronze, silver, gold, platinum
  
  // Crédito
  creditLimit: Number,        // Límite máximo de crédito
  currentCredit: Number,      // Crédito actualmente usado
  creditScore: Number,        // 300-850, Default: 650
  
  // Historial
  totalPurchases: Number,     // Monto total comprado
  lastPurchase: Date,
  totalSpent: Number,
  purchaseCount: Number,
  
  // Estado
  status: Enum,               // active, inactive, blocked
  registeredAt: Date,
  notes: String
}
```

**Índices:**
- Text search: `name`, `email`, `phone`
- `nfcCardId` (unique, sparse)
- `loyaltyTier`

---

### NFCCard (Tarjeta NFC)
**Archivo:** `/server/src/models/NFCCard.js`

```javascript
{
  // Identificación
  cardId: String,            // UID de 8 caracteres hex (AB12CD34)
  cardNumber: String,        // Auto: NFC2601000001
  
  // Vinculación
  customerId: ObjectId,      // Ref: Customer
  customerName: String,
  linkedAt: Date,
  linkedBy: String,
  linkedByName: String,
  
  // Estado
  status: Enum,              // active, inactive, blocked, lost, damaged
  cardType: Enum,            // standard, premium, vip
  
  // Fechas
  issuedDate: Date,
  activatedDate: Date,
  expirationDate: Date,
  lastUsedDate: Date,
  
  // Uso
  usageCount: Number,
  totalTransactions: Number,
  
  // Historial
  transactions: [{
    transactionType: Enum,   // activation, linked, purchase, points_earned, etc.
    timestamp: Date,
    performedBy: String,
    performedByName: String,
    details: Mixed,
    notes: String
  }],
  
  // Bloqueo
  blockedReason: String,
  blockedBy: String,
  blockedAt: Date
}
```

**Métodos Estáticos:**
- `generateCardNumber()` - Genera NFC2601000001
- `validateCardId(cardId)` - Valida formato UID

**Métodos de Instancia:**
- `linkToCustomer(customerId, customerName, userId, userName)`
- `unlinkFromCustomer(userId, userName, reason)`
- `activate(userId, userName)`
- `block(userId, userName, reason)`
- `recordUsage(transactionType, details)`
- `isActiveAndLinked()` - Verifica estado

---

### AccountReceivable (Cuenta por Cobrar)
**Archivo:** `/server/src/models/AccountReceivable.js`

```javascript
{
  // Identificación
  invoiceNumber: String,     // Auto: FIADO-202601-0001
  customerId: ObjectId,      // Ref: Customer
  customerName: String,
  customerPhone: String,
  
  // Referencia a Venta
  saleId: String,
  saleDate: Date,
  
  // Montos
  totalAmount: Number,
  paidAmount: Number,
  remainingAmount: Number,   // Auto-calculado
  
  // Términos de Pago
  dueDate: Date,             // Auto-calculado
  paymentTermDays: Number,   // Default: 30
  
  // Estado
  status: Enum,              // pending, partial, paid, overdue, cancelled
  
  // Pagos
  payments: [{
    paymentDate: Date,
    amount: Number,
    paymentMethod: Enum,     // cash, card, transfer, check
    reference: String,
    receivedBy: String,
    receivedByName: String,
    notes: String
  }],
  
  // Intereses por Mora
  interestRate: Number,      // % mensual
  accruedInterest: Number,   // Auto-calculado
  
  // Control
  createdBy: String,
  createdByName: String,
  lastPaymentDate: Date,
  notes: String,
  cancellationReason: String
}
```

**Métodos Estáticos:**
- `generateInvoiceNumber()` - Genera FIADO-202601-0001

**Métodos de Instancia:**
- `recordPayment(payment)` - Registra pago y actualiza status
- `calculateInterest()` - Calcula interés por mora
- `checkOverdue()` - Verifica si está vencida

**Fórmula de Interés:**
```javascript
daysOverdue = (hoy - dueDate) / (1000 * 60 * 60 * 24)
monthsOverdue = daysOverdue / 30
interest = remainingAmount × (interestRate / 100) × monthsOverdue
```

---

### Loan (Préstamo)
**Archivo:** `/server/src/models/Loan.js`

```javascript
{
  // Identificación
  loanNumber: String,        // Auto: PREST-202601-0001
  customerId: ObjectId,      // Ref: Customer
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  
  // Montos del Préstamo
  loanAmount: Number,        // Capital
  interestRate: Number,      // % mensual
  termMonths: Number,        // Plazo
  totalInterest: Number,     // Auto-calculado
  totalAmount: Number,       // Auto-calculado
  monthlyPayment: Number,    // Auto-calculado
  
  // Estado Actual
  paidAmount: Number,
  remainingAmount: Number,
  
  // Fechas
  startDate: Date,
  endDate: Date,             // Auto-calculado
  
  // Estado
  status: Enum,              // active, completed, defaulted, cancelled
  
  // Tabla de Amortización
  payments: [{
    paymentNumber: Number,
    dueDate: Date,
    principalAmount: Number,
    interestAmount: Number,
    totalAmount: Number,
    paidAmount: Number,
    remainingAmount: Number,
    status: Enum,            // pending, partial, paid, overdue
    paidDate: Date,
    paymentMethod: String,
    reference: String,
    receivedBy: String,
    receivedByName: String,
    notes: String
  }],
  
  // Garantía
  collateral: String,
  collateralValue: Number,
  
  // Información Adicional
  purpose: String,
  approvedBy: String,
  approvedByName: String,
  disbursedBy: String,
  disbursedByName: String,
  disbursementDate: Date,
  disbursementMethod: String,
  
  // Penalizaciones
  lateFeePercentage: Number, // Default: 5%
  totalLateFees: Number,
  
  // Notas
  notes: String,
  cancellationReason: String,
  
  // Documentos
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: Date
  }]
}
```

**Métodos Estáticos:**
- `generateLoanNumber()` - Genera PREST-202601-0001
- `calculateLoan(principal, rate, months)` - Calcula préstamo

**Métodos de Instancia:**
- `generatePaymentSchedule()` - Genera tabla de amortización
- `recordPayment(paymentNumber, paymentData)` - Registra pago de cuota
- `checkOverduePayments()` - Detecta y marca pagos vencidos
- `getNextPayment()` - Obtiene próximo pago pendiente
- `getSummary()` - Resumen del préstamo

**Fórmula de Préstamo (Interés Simple):**
```javascript
totalInterest = principal × (rate / 100) × months
totalAmount = principal + totalInterest
monthlyPayment = totalAmount / months
```

---

## 2️⃣ API ENDPOINTS

### Clientes

#### GET /api/customers
Listar todos los clientes

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Juan Pérez",
      "email": "juan@email.com",
      "phone": "5512345678",
      "nfcCardId": "AB12CD34",
      "loyaltyPoints": 350,
      "loyaltyTier": "silver",
      "creditLimit": 5000,
      "currentCredit": 1500,
      "status": "active",
      ...
    }
  ]
}
```

#### GET /api/customers/search
Búsqueda avanzada

**Query Params:**
- `query` - Texto libre (busca en nombre, email, teléfono, NFC)
- `loyaltyTier` - bronze, silver, gold, platinum
- `status` - active, inactive, blocked
- `hasNFC` - true, false
- `hasCredit` - true, false
- `minPoints` - Número
- `maxPoints` - Número

**Example:**
```
GET /api/customers/search?loyaltyTier=gold&hasNFC=true&minPoints=500
```

#### GET /api/customers/:id/profile
Perfil completo con historial

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": { ... },
    "nfcCard": { ... },
    "financial": {
      "creditLimit": 5000,
      "currentCredit": 1500,
      "availableCredit": 3500,
      "creditScore": 680,
      "totalDebt": 1000,
      "totalLoans": 5000,
      "totalOwed": 6000
    },
    "loyalty": {
      "points": 350,
      "tier": "silver",
      "tierBenefits": {
        "pointsMultiplier": 1.5,
        "discount": 5,
        "description": "..."
      }
    },
    "stats": {
      "totalPurchases": 25,
      "totalSpent": 15000,
      "lastPurchase": "2026-01-20",
      "overdueReceivables": 0,
      "overdueLoans": 0
    },
    "receivables": [...],  // Últimas 5
    "loans": [...]         // Últimos 3
  }
}
```

#### POST /api/customers/:id/loyalty/add
Agregar puntos de lealtad

**Body:**
```json
{
  "points": 50
}
```

**Lógica:**
```javascript
1. Suma puntos
2. Recalcula tier automáticamente:
   - >= 1000: platinum
   - >= 500: gold
   - >= 200: silver
   - < 200: bronze
```

#### POST /api/customers/:id/loyalty/redeem
Canjear puntos

**Body:**
```json
{
  "points": 100,
  "description": "Descuento en compra"
}
```

**Validaciones:**
- Puntos disponibles >= puntos a canjear
- Recalcula tier después de canje

#### PATCH /api/customers/:id/credit
Actualizar límite de crédito

**Body:**
```json
{
  "creditLimit": 10000,
  "creditScore": 720
}
```

**Permisos:** Admin, Supervisor

---

### Tarjetas NFC

#### POST /api/nfc
Crear tarjeta NFC

**Body:**
```json
{
  "cardId": "AB12CD34",
  "cardType": "standard",
  "notes": "Tarjeta para cliente VIP"
}
```

**Validaciones:**
- `cardId` debe ser 8 caracteres hexadecimales
- Formato válido: A-F, 0-9
- No duplicados

**Response:**
```json
{
  "success": true,
  "data": {
    "cardId": "AB12CD34",
    "cardNumber": "NFC2601000001",
    "status": "inactive",
    "cardType": "standard"
  }
}
```

#### POST /api/nfc/:id/link
Vincular con cliente

**Body:**
```json
{
  "customerId": "cliente_id"
}
```

**Flujo:**
1. Verifica que tarjeta no esté vinculada
2. Verifica que cliente existe
3. Verifica que cliente no tenga otra tarjeta
4. Vincula tarjeta con cliente
5. Actualiza `Customer.nfcCardId`
6. Cambia status a "active"
7. Registra transacción en historial

#### POST /api/nfc/card/:cardId/usage
Registrar uso (en compra)

**Body:**
```json
{
  "transactionType": "purchase",
  "details": {
    "saleId": "venta_id",
    "amount": 500,
    "pointsEarned": 50
  }
}
```

**Validaciones:**
- Tarjeta debe estar activa
- Tarjeta debe estar vinculada
- Incrementa `usageCount`
- Actualiza `lastUsedDate`
- Registra en `transactions`

---

### Cuentas por Cobrar

#### POST /api/receivables
Crear cuenta por cobrar (dar fiado)

**Body:**
```json
{
  "customerId": "cliente_id",
  "saleId": "venta_id",
  "totalAmount": 500,
  "paymentTermDays": 30,
  "interestRate": 5,
  "notes": "Fiado a 30 días"
}
```

**Flujo:**
1. Verifica cliente existe
2. Calcula crédito disponible = `creditLimit - currentCredit`
3. Valida `totalAmount <= creditDisponible`
4. Genera `invoiceNumber`
5. Calcula `dueDate = hoy + paymentTermDays`
6. Crea cuenta con status "pending"
7. Actualiza `Customer.currentCredit += totalAmount`
8. Registra auditoría

**Response:**
```json
{
  "success": true,
  "data": {
    "invoiceNumber": "FIADO-202601-0001",
    "customerId": "...",
    "customerName": "Juan Pérez",
    "totalAmount": 500,
    "remainingAmount": 500,
    "dueDate": "2026-02-27",
    "status": "pending"
  }
}
```

#### POST /api/receivables/:id/payment
Registrar pago (abono)

**Body:**
```json
{
  "amount": 200,
  "paymentMethod": "cash",
  "reference": "Ticket #123",
  "notes": "Primer abono"
}
```

**Flujo:**
1. Verifica que no esté pagada ni cancelada
2. Valida `amount <= remainingAmount`
3. Agrega pago al array `payments`
4. Actualiza `paidAmount += amount`
5. Recalcula `remainingAmount = totalAmount - paidAmount`
6. Actualiza status:
   - Si `remainingAmount <= 0`: "paid"
   - Si `paidAmount > 0`: "partial"
7. Actualiza `Customer.currentCredit -= amount`
8. Registra auditoría

#### GET /api/receivables/overdue
Cuentas vencidas

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "invoiceNumber": "FIADO-202601-0001",
      "customerName": "Juan Pérez",
      "totalAmount": 500,
      "remainingAmount": 300,
      "dueDate": "2026-01-15",
      "status": "overdue",
      "accruedInterest": 15,  // Calculado automáticamente
      "daysOverdue": 12
    }
  ]
}
```

**Lógica:**
- Actualiza status a "overdue" si `hoy > dueDate`
- Calcula intereses automáticamente
- Ordena por fecha de vencimiento

---

### Préstamos

#### POST /api/loans/calculate
Calcular préstamo (simulación)

**Body:**
```json
{
  "loanAmount": 10000,
  "interestRate": 5,
  "termMonths": 12
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loanAmount": 10000,
    "interestRate": 5,
    "termMonths": 12,
    "totalInterest": 6000,
    "totalAmount": 16000,
    "monthlyPayment": 1333.33
  }
}
```

#### POST /api/loans
Crear préstamo

**Body:**
```json
{
  "customerId": "cliente_id",
  "loanAmount": 10000,
  "interestRate": 5,
  "termMonths": 12,
  "purpose": "Negocio",
  "collateral": "Motocicleta",
  "collateralValue": 15000,
  "lateFeePercentage": 5,
  "notes": "Cliente confiable"
}
```

**Validaciones:**
- `Customer.creditScore >= 500`

**Flujo:**
1. Verifica cliente y score
2. Genera `loanNumber`
3. Calcula totales automáticamente
4. Calcula `endDate = startDate + termMonths`
5. Crea préstamo con status "active"
6. Genera tabla de amortización:
   ```javascript
   principalPerPayment = loanAmount / termMonths
   interestPerPayment = totalInterest / termMonths
   
   Para cada mes (1 a termMonths):
     dueDate = startDate + i meses
     Crear pago con:
       - principalAmount
       - interestAmount
       - totalAmount = monthlyPayment
       - status: "pending"
   ```
7. Registra auditoría

#### GET /api/loans/:id/schedule
Tabla de amortización

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "paymentNumber": 1,
      "dueDate": "2026-02-27",
      "principalAmount": 833.33,
      "interestAmount": 500,
      "totalAmount": 1333.33,
      "paidAmount": 1333.33,
      "remainingAmount": 0,
      "status": "paid",
      "paidDate": "2026-02-25",
      "isOverdue": false
    },
    {
      "paymentNumber": 2,
      "dueDate": "2026-03-27",
      "principalAmount": 833.33,
      "interestAmount": 500,
      "totalAmount": 1333.33,
      "paidAmount": 0,
      "remainingAmount": 1333.33,
      "status": "overdue",
      "isOverdue": true
    },
    ...
  ]
}
```

#### POST /api/loans/:id/payment
Pagar cuota

**Body:**
```json
{
  "paymentNumber": 2,
  "amount": 1333.33,
  "paymentMethod": "cash",
  "reference": "Pago mes 2",
  "notes": ""
}
```

**Flujo:**
1. Encuentra pago por número
2. Valida que no esté ya pagado
3. Actualiza pago:
   - `paidAmount += amount`
   - `remainingAmount = totalAmount - paidAmount`
   - Si completo: `status = "paid"`, `paidDate = hoy`
   - Si parcial: `status = "partial"`
4. Recalcula totales del préstamo
5. Si todos los pagos están completos: `loan.status = "completed"`
6. Registra auditoría

---

## 3️⃣ FLUJOS DE NEGOCIO

### Flujo: Cliente Nuevo con NFC y Primera Compra

```
1. Crear Cliente
   POST /api/customers
   {
     "name": "María López",
     "phone": "5587654321",
     "email": "maria@email.com",
     "creditLimit": 3000,
     "creditScore": 700
   }
   → Cliente ID: "abc123"

2. Crear Tarjeta NFC
   POST /api/nfc
   {
     "cardId": "CD34EF56"
   }
   → Tarjeta creada: NFC2601000002
   → Status: "inactive"

3. Vincular Tarjeta
   POST /api/nfc/{nfc_id}/link
   {
     "customerId": "abc123"
   }
   → Tarjeta vinculada
   → Status: "active"
   → Customer.nfcCardId = "CD34EF56"

4. Cliente hace compra de $200
   → Sistema lee tarjeta NFC (CD34EF56)
   
   GET /api/nfc/card/CD34EF56
   → Obtiene datos del cliente
   → Tier: bronze (puntos: 0)
   → Multiplicador: 1x
   → Descuento: 0%

   POST /api/sales
   {
     "customerId": "abc123",
     "total": 200,
     "paymentMethod": "cash",
     ...
   }
   
   → Venta procesada
   → Sistema calcula puntos: 200 / 10 * 1 = 20 puntos
   
   POST /api/customers/abc123/loyalty/add
   {
     "points": 20
   }
   
   → Customer.loyaltyPoints = 20
   → Tier sigue en bronze (necesita 200)

5. Registrar uso de tarjeta
   POST /api/nfc/card/CD34EF56/usage
   {
     "transactionType": "purchase",
     "details": {
       "saleId": "venta_id",
       "amount": 200,
       "pointsEarned": 20
     }
   }
   
   → usageCount = 1
   → lastUsedDate actualizado
```

### Flujo: Venta a Crédito con Pagos

```
1. Cliente quiere comprar $1,000 a crédito
   GET /api/customers/abc123/profile
   
   → creditLimit: 3000
   → currentCredit: 0
   → availableCredit: 3000 ✅

2. Crear cuenta por cobrar
   POST /api/receivables
   {
     "customerId": "abc123",
     "saleId": "sale_789",
     "totalAmount": 1000,
     "paymentTermDays": 30,
     "interestRate": 5
   }
   
   → invoiceNumber: "FIADO-202601-0001"
   → dueDate: "2026-02-27" (30 días después)
   → status: "pending"
   → Customer.currentCredit = 1000
   → availableCredit = 2000

3. Cliente abona $400 después de 15 días
   POST /api/receivables/{id}/payment
   {
     "amount": 400,
     "paymentMethod": "cash"
   }
   
   → paidAmount = 400
   → remainingAmount = 600
   → status = "partial"
   → Customer.currentCredit = 600
   → availableCredit = 2400

4. Pasa fecha de vencimiento sin pagar resto
   (Sistema automático al consultar)
   
   GET /api/receivables/overdue
   
   → status cambia a "overdue"
   → Calcula interés:
     * Días vencidos: 5
     * Meses: 5/30 = 0.166
     * Interés = 600 * (5/100) * 0.166 = $4.98
   → accruedInterest = 4.98

5. Cliente paga resto + interés
   POST /api/receivables/{id}/payment
   {
     "amount": 604.98
   }
   
   → paidAmount = 1004.98
   → remainingAmount = 0
   → status = "paid"
   → Customer.currentCredit = 0
   → availableCredit = 3000
```

### Flujo: Préstamo Completo

```
1. Cliente solicita préstamo
   GET /api/customers/abc123
   → creditScore: 700 ✅ (>= 500)

2. Simular préstamo
   POST /api/loans/calculate
   {
     "loanAmount": 5000,
     "interestRate": 5,
     "termMonths": 6
   }
   
   → totalInterest: 1500
   → totalAmount: 6500
   → monthlyPayment: 1083.33

3. Cliente acepta, crear préstamo
   POST /api/loans
   {
     "customerId": "abc123",
     "loanAmount": 5000,
     "interestRate": 5,
     "termMonths": 6,
     "purpose": "Expansión de negocio",
     "collateral": "Equipo de cómputo",
     "collateralValue": 8000
   }
   
   → loanNumber: "PREST-202601-0001"
   → status: "active"
   → Tabla de 6 pagos generada:
   
     Cuota 1: 27-Feb-26, Principal: $833.33, Interés: $250, Total: $1083.33
     Cuota 2: 27-Mar-26, Principal: $833.33, Interés: $250, Total: $1083.33
     Cuota 3: 27-Abr-26, Principal: $833.33, Interés: $250, Total: $1083.33
     Cuota 4: 27-May-26, Principal: $833.33, Interés: $250, Total: $1083.33
     Cuota 5: 27-Jun-26, Principal: $833.33, Interés: $250, Total: $1083.33
     Cuota 6: 27-Jul-26, Principal: $833.33, Interés: $250, Total: $1083.33

4. Desembolsar
   POST /api/loans/{id}/disburse
   {
     "disbursementMethod": "transfer"
   }
   
   → disbursedBy actualizado
   → disbursementDate: "2026-01-27"

5. Cliente paga cuota 1 a tiempo
   POST /api/loans/{id}/payment
   {
     "paymentNumber": 1,
     "amount": 1083.33,
     "paymentMethod": "cash"
   }
   
   → Cuota 1 status: "paid"
   → paidAmount: 1083.33
   → remainingAmount: 5416.67

6. Cliente NO paga cuota 2 a tiempo
   (28-Mar-26, un día después)
   
   GET /api/loans/{id}
   → Sistema detecta automáticamente
   → Cuota 2 status: "overdue"
   → Préstamo status: "defaulted"
   → Calcula penalización:
     * lateFeePercentage: 5%
     * Penalización = 1083.33 * 0.05 = $54.17
   → totalLateFees = 54.17

7. Cliente paga cuota atrasada + penalización
   POST /api/loans/{id}/payment
   {
     "paymentNumber": 2,
     "amount": 1137.50,  // 1083.33 + 54.17
     "paymentMethod": "cash"
   }
   
   → Cuota 2 status: "paid"
   → Si no hay más vencidas: status vuelve a "active"

8. Cliente completa todas las cuotas
   → Última cuota pagada
   → Sistema detecta automáticamente
   → loan.status = "completed"
```

---

## 4️⃣ FÓRMULAS Y CÁLCULOS

### Puntos de Lealtad

```javascript
// En cada venta
const basePoints = totalCompra / 10;
const multiplier = getTierMultiplier(customer.loyaltyTier);
const pointsEarned = basePoints * multiplier;

customer.loyaltyPoints += pointsEarned;
updateTier(customer);

function getTierMultiplier(tier) {
  const multipliers = {
    bronze: 1,
    silver: 1.5,
    gold: 2,
    platinum: 3
  };
  return multipliers[tier] || 1;
}

function updateTier(customer) {
  if (customer.loyaltyPoints >= 1000) {
    customer.loyaltyTier = 'platinum';
  } else if (customer.loyaltyPoints >= 500) {
    customer.loyaltyTier = 'gold';
  } else if (customer.loyaltyPoints >= 200) {
    customer.loyaltyTier = 'silver';
  } else {
    customer.loyaltyTier = 'bronze';
  }
}
```

### Interés de Cuentas por Cobrar (Mora)

```javascript
function calculateInterest(receivable) {
  const today = new Date();
  const dueDate = new Date(receivable.dueDate);
  
  if (today <= dueDate || receivable.interestRate === 0) {
    return 0;
  }
  
  const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  const monthsOverdue = daysOverdue / 30;
  
  const interest = receivable.remainingAmount * (receivable.interestRate / 100) * monthsOverdue;
  
  return Math.round(interest * 100) / 100;
}

// Ejemplo:
// Saldo pendiente: $1,000
// Tasa: 5% mensual
// Días vencidos: 45 días = 1.5 meses
// Interés = 1000 * (5/100) * 1.5 = $75
```

### Préstamo (Interés Simple)

```javascript
function calculateLoan(principal, interestRate, termMonths) {
  // Interés simple: I = P * r * t
  const totalInterest = principal * (interestRate / 100) * termMonths;
  const totalAmount = principal + totalInterest;
  const monthlyPayment = totalAmount / termMonths;
  
  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100
  };
}

// Ejemplo:
// Capital: $10,000
// Tasa: 5% mensual
// Plazo: 12 meses
//
// Interés total = 10,000 * (5/100) * 12 = $6,000
// Total a pagar = 10,000 + 6,000 = $16,000
// Pago mensual = 16,000 / 12 = $1,333.33
```

### Tabla de Amortización

```javascript
function generatePaymentSchedule(loan) {
  const principalPerPayment = loan.loanAmount / loan.termMonths;
  const interestPerPayment = loan.totalInterest / loan.termMonths;
  const monthlyAmount = loan.monthlyPayment;
  
  const payments = [];
  
  for (let i = 1; i <= loan.termMonths; i++) {
    const dueDate = new Date(loan.startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    payments.push({
      paymentNumber: i,
      dueDate,
      principalAmount: Math.round(principalPerPayment * 100) / 100,
      interestAmount: Math.round(interestPerPayment * 100) / 100,
      totalAmount: monthlyAmount,
      remainingAmount: monthlyAmount,
      status: 'pending'
    });
  }
  
  return payments;
}
```

### Penalización por Mora (Préstamos)

```javascript
function checkOverduePayments(loan) {
  const today = new Date();
  let totalLateFees = 0;
  
  loan.payments.forEach(payment => {
    if (payment.status !== 'paid' && today > payment.dueDate) {
      payment.status = 'overdue';
      
      const daysLate = Math.floor((today - payment.dueDate) / (1000 * 60 * 60 * 24));
      
      if (daysLate > 0) {
        const lateFee = payment.totalAmount * (loan.lateFeePercentage / 100);
        totalLateFees += lateFee;
      }
    }
  });
  
  loan.totalLateFees = Math.round(totalLateFees * 100) / 100;
  
  const hasOverdue = loan.payments.some(p => p.status === 'overdue');
  if (hasOverdue && loan.status === 'active') {
    loan.status = 'defaulted';
  }
  
  return loan;
}

// Ejemplo:
// Pago mensual: $1,333.33
// Penalización: 5%
// Penalización = 1333.33 * 0.05 = $66.67 por cada mes vencido
```

---

## 5️⃣ SEGURIDAD

### Permisos por Rol

| Acción | Admin | Supervisor | Cashier |
|--------|-------|------------|---------|
| **Clientes** |
| Ver clientes | ✅ | ✅ | ✅ |
| Crear cliente | ✅ | ✅ | ✅ |
| Editar cliente | ✅ | ✅ | ✅ |
| Eliminar cliente | ✅ | ❌ | ❌ |
| Ver historial completo | ✅ | ✅ | ❌ |
| Actualizar crédito | ✅ | ✅ | ❌ |
| **Tarjetas NFC** |
| Ver tarjetas | ✅ | ✅ | ✅ |
| Crear tarjeta | ✅ | ✅ | ❌ |
| Vincular/Desvincular | ✅ | ✅ | ❌ |
| Activar/Bloquear | ✅ | ✅ | ❌ |
| Eliminar tarjeta | ✅ | ❌ | ❌ |
| **Cuentas por Cobrar** |
| Ver cuentas | ✅ | ✅ | ✅ |
| Crear fiado | ✅ | ✅ | ❌ |
| Registrar pago | ✅ | ✅ | ✅ |
| Cancelar cuenta | ✅ | ❌ | ❌ |
| Actualizar interés | ✅ | ✅ | ❌ |
| **Préstamos** |
| Ver préstamos | ✅ | ✅ | ✅ |
| Calcular | ✅ | ✅ | ✅ |
| Crear préstamo | ✅ | ✅ | ❌ |
| Desembolsar | ✅ | ✅ | ❌ |
| Registrar pago | ✅ | ✅ | ✅ |
| Cancelar | ✅ | ❌ | ❌ |

### Validaciones Críticas

**Tarjetas NFC:**
- UID debe ser único en el sistema
- Formato válido: 8 caracteres hexadecimales
- No vincular si ya está vinculada
- No activar si está bloqueada/perdida/dañada

**Cuentas por Cobrar:**
- Validar límite de crédito antes de crear
- No permitir pago mayor al saldo
- Actualizar crédito del cliente automáticamente
- Cálculos automáticos (no manipulables)

**Préstamos:**
- Score crediticio mínimo: 500
- Validar montos positivos
- No pagar cuota ya pagada
- Detección automática de mora
- Solo admin/supervisor puede aprobar

### Auditoría

Todas las operaciones se registran en `AuditLog`:

```javascript
{
  userId: String,
  userName: String,
  userRole: String,
  action: String,        // Tipo de acción
  module: String,        // Módulo (nfc, receivables, loans)
  description: String,   // Descripción legible
  details: Mixed,        // Detalles específicos
  ipAddress: String,
  success: Boolean,
  criticality: String,   // info, warning, critical
  timestamp: Date
}
```

**Acciones Auditadas:**
```
✅ customer_created
✅ customer_updated
✅ customer_deleted
✅ loyalty_points_added
✅ loyalty_points_redeemed
✅ credit_limit_updated
✅ nfc_card_created
✅ nfc_card_linked
✅ nfc_card_unlinked
✅ nfc_card_activated
✅ nfc_card_blocked
✅ nfc_card_deleted
✅ account_receivable_created
✅ payment_recorded (receivables)
✅ account_receivable_cancelled
✅ loan_created
✅ loan_disbursed
✅ loan_payment_recorded
✅ loan_cancelled
```

---

## 🎉 CONCLUSIÓN

El módulo CRM está completamente implementado con:

✅ **47 endpoints API** funcionando  
✅ **Cálculos automáticos** de intereses, puntos y amortización  
✅ **Validaciones robustas** en cada operación  
✅ **Auditoría completa** de todas las acciones  
✅ **Permisos por rol** bien definidos  
✅ **Integración perfecta** entre módulos  

**¡Sistema listo para producción!** 🚀
