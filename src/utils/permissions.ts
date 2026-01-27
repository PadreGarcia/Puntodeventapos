import type { User, Permission, UserRole } from '@/types/pos';

/**
 * Verifica si un usuario tiene permiso para realizar una acción específica en un módulo
 */
export function hasPermission(
  user: User | null,
  module: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean {
  if (!user) return false;
  
  // Los admins tienen todos los permisos
  if (user.role === 'admin') return true;
  
  // Buscar el permiso específico del módulo
  const permission = user.permissions.find(p => p.module === module);
  
  if (!permission) {
    // Si no hay permiso explícito, usar permisos por defecto según el rol
    return getDefaultPermission(user.role, module, action);
  }
  
  switch (action) {
    case 'view':
      return permission.canView;
    case 'create':
      return permission.canCreate;
    case 'edit':
      return permission.canEdit;
    case 'delete':
      return permission.canDelete;
    default:
      return false;
  }
}

/**
 * Permisos por defecto según el rol
 */
function getDefaultPermission(
  role: UserRole,
  module: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean {
  // Configuración de permisos por defecto
  const defaultPermissions: Record<UserRole, Record<string, Record<string, boolean>>> = {
    admin: {
      '*': { view: true, create: true, edit: true, delete: true }
    },
    supervisor: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      sales: { view: true, create: true, edit: true, delete: true },
      products: { view: true, create: true, edit: true, delete: false },
      inventory: { view: true, create: true, edit: true, delete: false },
      customers: { view: true, create: true, edit: true, delete: true },
      promotions: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: false, edit: false, delete: false },
      cash: { view: true, create: true, edit: true, delete: false },
      services: { view: true, create: true, edit: false, delete: false },
      purchases: { view: true, create: true, edit: true, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
      audit: { view: true, create: false, edit: false, delete: false },
    },
    cashier: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      sales: { view: true, create: true, edit: false, delete: false },
      products: { view: true, create: true, edit: true, delete: false }, // ✅ Cajero Nivel 2: puede agregar y editar (con límites)
      inventory: { view: false, create: false, edit: false, delete: false },
      customers: { view: true, create: true, edit: true, delete: false },
      promotions: { view: true, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      cash: { view: true, create: true, edit: false, delete: false },
      services: { view: true, create: true, edit: false, delete: false },
      purchases: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
      audit: { view: false, create: false, edit: false, delete: false },
    }
  };
  
  if (role === 'admin') {
    return true;
  }
  
  const rolePermissions = defaultPermissions[role];
  const modulePermissions = rolePermissions[module];
  
  return modulePermissions ? modulePermissions[action] : false;
}

/**
 * Obtiene una lista de acciones permitidas para un módulo
 */
export function getPermittedActions(
  user: User | null,
  module: string
): { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean } {
  return {
    canView: hasPermission(user, module, 'view'),
    canCreate: hasPermission(user, module, 'create'),
    canEdit: hasPermission(user, module, 'edit'),
    canDelete: hasPermission(user, module, 'delete'),
  };
}

/**
 * Verifica si el usuario puede acceder a un módulo completo
 */
export function canAccessModule(user: User | null, module: string): boolean {
  return hasPermission(user, module, 'view');
}

/**
 * Lista de módulos del sistema
 */
export const MODULES = {
  SALES: 'sales',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  CUSTOMERS: 'customers',
  PROMOTIONS: 'promotions',
  REPORTS: 'reports',
  CASH: 'cash',
  SERVICES: 'services',
  PURCHASES: 'purchases',
  USERS: 'users',
  AUDIT: 'audit',
  DASHBOARD: 'dashboard',
} as const;

/**
 * Límites para Cajero Nivel 2
 */
export const CASHIER_LIMITS = {
  MAX_PRICE_CHANGE_PERCENT: 15, // ±15% en ajuste de precios
  MAX_DISCOUNT_PERCENT: 25,     // Máximo 25% de descuento
} as const;

/**
 * Valida si un cambio de precio está dentro del límite permitido para cajeros
 */
export function validatePriceChange(
  user: User | null,
  originalPrice: number,
  newPrice: number
): { valid: boolean; message?: string; percentChange?: number } {
  if (!user) return { valid: false, message: 'Usuario no autenticado' };
  
  // Admin y supervisor pueden cambiar cualquier precio
  if (user.role === 'admin' || user.role === 'supervisor') {
    return { valid: true };
  }
  
  // Cajero: validar límite de ±15%
  if (user.role === 'cashier') {
    const percentChange = ((newPrice - originalPrice) / originalPrice) * 100;
    const absChange = Math.abs(percentChange);
    
    if (absChange > CASHIER_LIMITS.MAX_PRICE_CHANGE_PERCENT) {
      return {
        valid: false,
        message: `El cambio de precio (${percentChange.toFixed(1)}%) excede el límite permitido (±${CASHIER_LIMITS.MAX_PRICE_CHANGE_PERCENT}%)`,
        percentChange
      };
    }
    
    return { valid: true, percentChange };
  }
  
  return { valid: false, message: 'No tiene permisos para cambiar precios' };
}

/**
 * Valida si un descuento está dentro del límite permitido para cajeros
 */
export function validateDiscount(
  user: User | null,
  discountPercent: number
): { valid: boolean; message?: string } {
  if (!user) return { valid: false, message: 'Usuario no autenticado' };
  
  // Admin y supervisor pueden dar cualquier descuento
  if (user.role === 'admin' || user.role === 'supervisor') {
    return { valid: true };
  }
  
  // Cajero: validar límite de 25%
  if (user.role === 'cashier') {
    if (discountPercent > CASHIER_LIMITS.MAX_DISCOUNT_PERCENT) {
      return {
        valid: false,
        message: `El descuento (${discountPercent}%) excede el límite permitido (${CASHIER_LIMITS.MAX_DISCOUNT_PERCENT}%)`
      };
    }
    
    return { valid: true };
  }
  
  return { valid: false, message: 'No tiene permisos para aplicar descuentos' };
}

/**
 * Determina el nivel de criticidad de una acción para auditoría
 */
export function getActionCriticality(
  user: User | null,
  action: string,
  details?: { priceChange?: number; discount?: number; amount?: number }
): 'info' | 'warning' | 'critical' {
  if (!user) return 'critical';
  
  // Acciones críticas siempre
  const criticalActions = ['product_deleted', 'sale_cancelled', 'user_deleted', 'cash_opened'];
  if (criticalActions.includes(action)) return 'critical';
  
  // Evaluar por rol y detalles
  if (user.role === 'cashier') {
    // Cajero agregando/editando productos es warning
    if (action === 'product_created' || action === 'product_updated') return 'warning';
    
    // Descuentos grandes
    if (details?.discount && details.discount > 15) return 'warning';
    
    // Cambios de precio significativos
    if (details?.priceChange && Math.abs(details.priceChange) > 10) return 'warning';
  }
  
  // Ventas canceladas de montos altos
  if (action === 'sale_cancelled' && details?.amount && details.amount > 500) {
    return 'critical';
  }
  
  return 'info';
}
