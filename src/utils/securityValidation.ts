import type { User, Sale } from '@/types/pos';
import { hasPermission, MODULES } from './permissions';

/**
 * Validaciones de seguridad para acciones críticas
 */

/**
 * Valida si un usuario puede realizar ajustes de caja
 * Solo admin y supervisor pueden hacer ajustes
 */
export function canAdjustCash(user: User | null): {
  allowed: boolean;
  message?: string;
} {
  if (!user) {
    return {
      allowed: false,
      message: 'Usuario no autenticado',
    };
  }

  // Solo admin y supervisor
  if (user.role !== 'admin' && user.role !== 'supervisor') {
    return {
      allowed: false,
      message: 'Solo administradores y supervisores pueden realizar ajustes de caja',
    };
  }

  // Verificar permiso específico
  if (!hasPermission(user, MODULES.CASH, 'edit')) {
    return {
      allowed: false,
      message: 'No tienes permisos para realizar ajustes de caja',
    };
  }

  return { allowed: true };
}

/**
 * Valida si un usuario puede cerrar caja
 * Solo admin y supervisor pueden cerrar caja
 */
export function canCloseCash(user: User | null): {
  allowed: boolean;
  message?: string;
} {
  if (!user) {
    return {
      allowed: false,
      message: 'Usuario no autenticado',
    };
  }

  // Solo admin y supervisor
  if (user.role !== 'admin' && user.role !== 'supervisor') {
    return {
      allowed: false,
      message: 'Solo administradores y supervisores pueden cerrar caja',
    };
  }

  return { allowed: true };
}

/**
 * Valida si un usuario puede cancelar una venta
 * Solo admin y supervisor pueden cancelar ventas
 */
export function canCancelSale(
  user: User | null,
  sale: Sale,
  maxMinutesAllowed: number = 30
): {
  allowed: boolean;
  message?: string;
} {
  if (!user) {
    return {
      allowed: false,
      message: 'Usuario no autenticado',
    };
  }

  // Solo admin y supervisor
  if (user.role !== 'admin' && user.role !== 'supervisor') {
    return {
      allowed: false,
      message: 'Solo administradores y supervisores pueden cancelar ventas',
    };
  }

  // Verificar tiempo transcurrido
  const now = new Date();
  const saleTime = new Date(sale.timestamp);
  const minutesElapsed = (now.getTime() - saleTime.getTime()) / (1000 * 60);

  if (minutesElapsed > maxMinutesAllowed) {
    return {
      allowed: false,
      message: `No se pueden cancelar ventas después de ${maxMinutesAllowed} minutos. Tiempo transcurrido: ${Math.floor(minutesElapsed)} minutos`,
    };
  }

  // Admin puede cancelar sin límite de tiempo
  if (user.role === 'admin') {
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Valida si un usuario puede modificar precios
 * Solo admin puede modificar precios directamente
 */
export function canModifyPrices(user: User | null): {
  allowed: boolean;
  message?: string;
} {
  if (!user) {
    return {
      allowed: false,
      message: 'Usuario no autenticado',
    };
  }

  // Solo admin puede modificar precios
  if (user.role !== 'admin') {
    return {
      allowed: false,
      message: 'Solo administradores pueden modificar precios',
    };
  }

  if (!hasPermission(user, MODULES.PRODUCTS, 'edit')) {
    return {
      allowed: false,
      message: 'No tienes permisos para modificar precios',
    };
  }

  return { allowed: true };
}

/**
 * Valida cambios de precio (detecta cambios sospechosos)
 */
export function validatePriceChange(
  oldPrice: number,
  newPrice: number,
  maxPercentageChange: number = 50
): {
  valid: boolean;
  message?: string;
  percentageChange?: number;
} {
  if (newPrice <= 0) {
    return {
      valid: false,
      message: 'El precio debe ser mayor a 0',
    };
  }

  if (oldPrice === newPrice) {
    return {
      valid: true,
      message: 'Sin cambios en el precio',
    };
  }

  const percentageChange = Math.abs(((newPrice - oldPrice) / oldPrice) * 100);

  if (percentageChange > maxPercentageChange) {
    return {
      valid: false,
      message: `Cambio de precio demasiado grande (${percentageChange.toFixed(1)}%). Máximo permitido: ${maxPercentageChange}%`,
      percentageChange,
    };
  }

  return {
    valid: true,
    percentageChange,
  };
}

/**
 * Valida si un usuario puede aplicar descuentos manuales
 */
export function canApplyDiscount(
  user: User | null,
  discountPercentage: number,
  maxAllowed: Record<string, number> = {
    admin: 100,
    supervisor: 20,
    cashier: 5,
  }
): {
  allowed: boolean;
  message?: string;
} {
  if (!user) {
    return {
      allowed: false,
      message: 'Usuario no autenticado',
    };
  }

  const maxDiscount = maxAllowed[user.role] || 0;

  if (discountPercentage > maxDiscount) {
    return {
      allowed: false,
      message: `Tu rol solo permite descuentos hasta ${maxDiscount}%. Descuento solicitado: ${discountPercentage}%`,
    };
  }

  if (discountPercentage < 0 || discountPercentage > 100) {
    return {
      allowed: false,
      message: 'El descuento debe estar entre 0% y 100%',
    };
  }

  return { allowed: true };
}

/**
 * Valida si un usuario puede acceder a información sensible
 */
export function canAccessSensitiveData(
  user: User | null,
  dataType: 'financial' | 'customer_personal' | 'audit' | 'reports'
): {
  allowed: boolean;
  message?: string;
} {
  if (!user) {
    return {
      allowed: false,
      message: 'Usuario no autenticado',
    };
  }

  const permissions: Record<string, string[]> = {
    financial: ['admin', 'supervisor'],
    customer_personal: ['admin', 'supervisor'],
    audit: ['admin', 'supervisor'],
    reports: ['admin', 'supervisor'],
  };

  const allowedRoles = permissions[dataType] || [];

  if (!allowedRoles.includes(user.role)) {
    return {
      allowed: false,
      message: `Tu rol no tiene acceso a datos de tipo: ${dataType}`,
    };
  }

  return { allowed: true };
}

/**
 * Valida retiros de efectivo de caja
 */
export function validateCashWithdrawal(
  user: User | null,
  amount: number,
  currentBalance: number,
  maxAllowed: number = 5000
): {
  valid: boolean;
  message?: string;
} {
  if (!user) {
    return {
      valid: false,
      message: 'Usuario no autenticado',
    };
  }

  if (amount <= 0) {
    return {
      valid: false,
      message: 'El monto debe ser mayor a 0',
    };
  }

  if (amount > currentBalance) {
    return {
      valid: false,
      message: `No hay suficiente efectivo en caja. Disponible: $${currentBalance.toFixed(2)}`,
    };
  }

  // Solo admin puede retirar más del límite
  if (user.role !== 'admin' && amount > maxAllowed) {
    return {
      valid: false,
      message: `Tu rol solo permite retiros hasta $${maxAllowed.toFixed(2)}. Para cantidades mayores, contacta al administrador`,
    };
  }

  return { valid: true };
}

/**
 * Registra actividad sospechosa
 */
export interface SuspiciousActivity {
  userId: string;
  userName: string;
  action: string;
  details: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Detecta patrones sospechosos
 */
export function detectSuspiciousActivity(
  user: User,
  action: string,
  details: any
): SuspiciousActivity | null {
  const suspicious: SuspiciousActivity = {
    userId: user.id,
    userName: user.fullName,
    action,
    details,
    timestamp: new Date(),
    severity: 'low',
  };

  // Detectar múltiples intentos fallidos
  if (action === 'failed_permission' && details.attempts > 3) {
    suspicious.severity = 'high';
    return suspicious;
  }

  // Detectar cambios de precio sospechosos
  if (action === 'price_change' && details.percentageChange > 50) {
    suspicious.severity = 'medium';
    return suspicious;
  }

  // Detectar cancelaciones múltiples
  if (action === 'sale_cancelled' && details.count > 5) {
    suspicious.severity = 'high';
    return suspicious;
  }

  // Detectar retiros grandes
  if (action === 'cash_withdrawal' && details.amount > 10000) {
    suspicious.severity = 'critical';
    return suspicious;
  }

  return null;
}
