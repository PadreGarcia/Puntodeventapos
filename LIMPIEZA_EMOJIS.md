# 🔧 PLAN DE LIMPIEZA - Emojis → Lucide Icons

## 🎯 PROBLEMA IDENTIFICADO

**Inconsistencia de diseño:** Mezclamos emojis (📱 ✉️ ✓) con iconos de Lucide React, creando una experiencia visual inconsistente.

---

## ✅ COMPLETADO

### **CustomersListTab.tsx** ✓
```diff
- 📱 {customer.phone}
+ <Phone className="w-3 h-3" /> {customer.phone}

- ✉️ {customer.email}
+ <Mail className="w-3 h-3" /> {customer.email}
```

---

## 📋 PENDIENTE DE LIMPIEZA

### **ALTA PRIORIDAD** (Vistas principales)

#### 1. **InvoicesTab.tsx** & **PayablesTab.tsx**
```diff
- ✓ Pagada el {formatDate}
+ <CheckCircle className="w-3 h-3" /> Pagada el {formatDate}
```

#### 2. **NFCCardsTab.tsx**
```diff
- {card.status === 'active' ? '✅ Activa' : '⛔ Bloqueada'}
+ {card.status === 'active' ? (
+   <><CheckCircle className="w-3 h-3" /> Activa</>
+ ) : (
+   <><Ban className="w-3 h-3" /> Bloqueada</>
+ )}
```

#### 3. **CreditAccountsTab.tsx**
```diff
- {account.status === 'paid' ? '✅ Pagado' : '⏰ Vencido'}
+ {account.status === 'paid' ? (
+   <><CheckCircle className="w-3 h-3" /> Pagado</>
+ ) : (
+   <><Clock className="w-3 h-3" /> Vencido</>
+ )}
```

---

### **MEDIA PRIORIDAD** (Módulos secundarios)

#### 4. **LoyaltyProgramTab.tsx**
```diff
- <li>✓ {benefit}</li>
+ <li className="flex items-center gap-1">
+   <Check className="w-3 h-3" /> {benefit}
+ </li>
```

#### 5. **LoanDetail.tsx**
```diff
- {loan.status === 'active' ? '✓ Activo' : '✗ Cancelado'}
+ {loan.status === 'active' ? (
+   <><CheckCircle className="w-3 h-3" /> Activo</>
+ ) : (
+   <><XCircle className="w-3 h-3" /> Cancelado</>
+ )}
```

#### 6. **PhoneRecharges.tsx** (¡Muchos emojis!)
```diff
- logo: '📱'  // Carriers
+ icon: Phone  // Componente de Lucide

- '💵 Efectivo'
+ <><Banknote className="w-4 h-4" /> Efectivo</>

- '💳 Tarjeta'
+ <><CreditCard className="w-4 h-4" /> Tarjeta</>

- '🏦 Transferencia'
+ <><Building className="w-4 h-4" /> Transferencia</>
```

---

### **BAJA PRIORIDAD** (Módulos admin)

#### 7. **UserManagement.tsx**
```diff
- {user.isActive ? '✅ Activo' : '⏸️ Inactivo'}
+ {user.isActive ? (
+   <><CheckCircle className="w-3 h-3" /> Activo</>
+ ) : (
+   <><Pause className="w-3 h-3" /> Inactivo</>
+ )}
```

#### 8. **AuditLogView.tsx**
```diff
- icon: '🔓'  // login
+ icon: Unlock

- icon: '💰'  // sale_created
+ icon: DollarSign

- icon: '📦'  // product_created
+ icon: Package
```

---

## 🎨 MAPEO DE EMOJIS → ICONOS

| Emoji | Icono Lucide | Import |
|-------|--------------|--------|
| 📱 | Phone | `import { Phone } from 'lucide-react'` |
| ✉️ | Mail | `import { Mail } from 'lucide-react'` |
| ✓ / ✅ | CheckCircle / Check | `import { CheckCircle, Check } from 'lucide-react'` |
| ✗ / ❌ | XCircle / X | `import { XCircle, X } from 'lucide-react'` |
| ⏰ / ⏳ | Clock | `import { Clock } from 'lucide-react'` |
| ⛔ | Ban / ShieldOff | `import { Ban } from 'lucide-react'` |
| 💰 / 💵 | DollarSign / Banknote | `import { DollarSign, Banknote } from 'lucide-react'` |
| 💳 | CreditCard | `import { CreditCard } from 'lucide-react'` |
| 🏦 | Building / Building2 | `import { Building } from 'lucide-react'` |
| 📦 | Package | `import { Package } from 'lucide-react'` |
| 🔓 | Unlock | `import { Unlock } from 'lucide-react'` |
| 🔒 | Lock | `import { Lock } from 'lucide-react'` |
| ⏸️ | Pause | `import { Pause } from 'lucide-react'` |
| 🔵 / 🟢 | Circle (colored) | `import { Circle } from 'lucide-react'` |
| ⚠️ | AlertTriangle | `import { AlertTriangle } from 'lucide-react'` |

---

## 📊 ESTADÍSTICAS

| Categoría | Archivos | Emojis Encontrados |
|-----------|----------|-------------------|
| Clientes | 5 | ~15 |
| Compras | 3 | ~5 |
| Promociones | 2 | ~10 |
| Servicios | 1 | ~20 |
| Admin | 2 | ~15 |
| **TOTAL** | **13** | **~65** |

---

## 🎯 ESTRATEGIA DE LIMPIEZA

### **Opción 1: Limpieza Completa Ahora** (2-3 horas)
- ✅ Sistema 100% consistente
- ✅ Sin emojis en ninguna parte
- ⚠️ Tiempo considerable

### **Opción 2: Limpieza Progresiva** (recomendada)
- ✅ Prioridad en vistas principales
- ✅ Módulos secundarios después
- ✅ 30-45 min por sesión

### **Opción 3: Solo lo Crítico**
- ✅ Clientes (ya hecho ✓)
- ✅ Compras (InvoicesTab, PayablesTab)
- ⏭️ El resto queda para después

---

## 💡 RECOMENDACIÓN

**Opción 2: Limpieza Progresiva**

1. ✅ **Clientes** - COMPLETADO
2. **Compras** (siguiente) - 15 min
3. **CRM** (crédito, préstamos) - 20 min
4. **Promociones** - 15 min
5. **Servicios** - 30 min
6. **Admin** - 15 min

**Total:** ~1.5 horas en sesiones separadas

---

## 🚀 PRÓXIMO PASO

**¿Quieres que continúe con la limpieza de emojis en otros módulos?**

**Opción A:** Limpiar InvoicesTab y PayablesTab ahora (15 min)  
**Opción B:** Dejarlo para después  
**Opción C:** Limpieza completa de todo el sistema  

---

**Última actualización:** 26 de Enero, 2026  
**Progreso:** CustomersListTab ✅ (1/13 archivos)  
**Emojis eliminados:** 2 de ~65  
**Estado:** En progreso
