/**
 * Índice de servicios API
 * Exporta todos los servicios del sistema
 */

// Cliente API base
export { apiClient } from '@/lib/apiClient';

// Servicios por módulo
export * from './productService';
export * from './saleService';
export * from './cashRegisterService';
export * from './customerService';
export * from './promotionService';
export * from './rechargeService';
export * from './servicePaymentService';
export * from './loanService';
export * from './purchaseService';
export * from './userService';
export * from './auditService';
export * from './nfcService';
export * from './receivableService';

// Importar servicios individuales
import { productService } from './productService';
import { saleService } from './saleService';
import { cashRegisterService } from './cashRegisterService';
import { customerService } from './customerService';
import { promotionService } from './promotionService';
import { rechargeService } from './rechargeService';
import { servicePaymentService } from './servicePaymentService';
import { loanService } from './loanService';
import { purchaseService } from './purchaseService';
import { userService } from './userService';
import { auditService } from './auditService';
import { nfcService } from './nfcService';
import { receivableService } from './receivableService';

/**
 * Objeto de servicios agrupados
 * Uso: api.products.getAll()
 */
export const api = {
  products: productService,
  sales: saleService,
  cash: cashRegisterService,
  customers: customerService,
  promotions: promotionService,
  recharges: rechargeService,
  services: servicePaymentService,
  loans: loanService,
  purchases: purchaseService,
  users: userService,
  audit: auditService,
  nfc: nfcService,
  receivables: receivableService,
};

export default api;
