export interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  cost?: number;
  image: string;
  category: string;
  stock: number;
  minStock?: number;
  reorderPoint?: number; // Alias de minStock para compatibilidad
  description?: string;
  supplierId?: string;
  supplierName?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'Entrada' | 'Salida';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: Date;
  user?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'nfc';

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  change?: number;
  timestamp: Date;
  customerId?: string;
  customerName?: string;
  nfcCardId?: string;
  loyaltyPointsEarned?: number;
  date: Date;
}

// Tipos para módulo de Compras/Proveedores
export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms: number; // días
  visitDays?: string[]; // días que pasa el proveedor: ['Lunes', 'Miércoles', 'Viernes']
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: 'draft' | 'sent' | 'pending' | 'approved' | 'received' | 'cancelled';
  orderDate?: Date;
  expectedDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  sentAt?: Date;
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'pending' | 'approved' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string; // 'caja', 'paquete', 'pieza', 'botella', etc.
  unitEquivalence?: number; // Ejemplo: 1 caja = 24 piezas
  equivalenceUnit?: string; // La unidad base: 'pieza', 'botella', etc.
}

export interface ProductReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: ReceiptItem[];
  receivedDate: Date;
  notes?: string;
  receivedBy: string;
}

export interface ReceiptItem {
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  total: number;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  receiptId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  invoiceDate: Date;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface PayableAccount {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  balance: number;
  dueDate: Date;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentHistory: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  date: Date;
  method: 'cash' | 'check' | 'transfer' | 'card';
  reference?: string;
  notes?: string;
}

// Tipos para módulo de Caja
export interface CashRegister {
  id: string;
  shiftNumber: string;
  status: 'open' | 'closed';
  openedBy: string;
  openedAt: Date;
  closedBy?: string;
  closedAt?: Date;
  openingBalance: number;
  expectedClosingBalance: number;
  actualClosingBalance?: number;
  difference?: number;
  sales: Sale[];
  movements: CashMovement[];
  denominations?: CashDenomination[];
}

export interface CashMovement {
  id: string;
  type: 'income' | 'withdrawal';
  amount: number;
  reason: string;
  category: 'expense' | 'income' | 'transfer' | 'other';
  authorizedBy: string;
  timestamp: Date;
  notes?: string;
}

export interface CashDenomination {
  value: number;
  quantity: number;
  total: number;
}

export interface CashCount {
  id: string;
  shiftId: string;
  countedBy: string;
  countedAt: Date;
  denominations: CashDenomination[];
  totalCounted: number;
  expectedAmount: number;
  difference: number;
  notes?: string;
}

export interface ShiftSummary {
  id: string;
  shiftNumber: string;
  openedBy: string;
  closedBy: string;
  openedAt: Date;
  closedAt: Date;
  duration: number; // minutos
  openingBalance: number;
  salesCash: number;
  salesCard: number;
  salesTransfer: number;
  totalSales: number;
  salesCount: number;
  incomes: number;
  withdrawals: number;
  expectedClosing: number;
  actualClosing: number;
  difference: number;
  status: 'balanced' | 'shortage' | 'overage';
}

// Tipos para módulo de Clientes
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  
  // Datos de identificación
  rfc?: string;
  curp?: string;
  ine?: string;
  dateOfBirth?: Date;
  
  // Dirección completa
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Referencias personales
  references?: CustomerReference[];
  
  // Sistema NFC y Lealtad
  nfcCardId?: string;
  loyaltyPoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  
  // Crédito
  creditLimit: number;
  currentCredit: number; // Deuda actual
  creditScore: number; // 300-850 (similar a FICO)
  
  // Historial
  totalPurchases: number;
  lastPurchase: Date;
  totalSpent: number;
  purchaseCount: number;
  
  // Estado
  status: 'active' | 'inactive' | 'blocked';
  registeredAt: Date;
  notes?: string;
}

export interface CustomerReference {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  address?: string;
}

export interface NFCCard {
  id: string;
  cardNumber: string;
  customerId?: string;
  customerName?: string;
  status: 'active' | 'inactive' | 'blocked' | 'lost';
  issuedAt: Date;
  lastUsed?: Date;
  balance: number; // Saldo prepagado en la tarjeta
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  reason: string;
  saleId?: string;
  timestamp: Date;
  performedBy: string;
}

export interface CreditAccount {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  remainingBalance: number;
  dueDate: Date;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  saleId?: string;
  createdAt: Date;
  notes?: string;
  payments: CreditPayment[];
}

export interface CreditPayment {
  id: string;
  amount: number;
  date: Date;
  method: 'cash' | 'card' | 'transfer';
  receivedBy: string;
  notes?: string;
}

export interface Loan {
  id: string;
  loanNumber: string; // Número de préstamo único
  customerId: string;
  customerName: string;
  
  // Montos
  principal: number; // Monto prestado
  interestRate: number; // Tasa de interés anual (%)
  monthlyInterestRate: number; // Tasa mensual
  totalAmount: number; // Total a pagar (principal + intereses)
  remainingBalance: number; // Saldo pendiente
  paidAmount: number; // Total pagado
  
  // Plazos
  termMonths: number; // 6, 12, 24, 36 meses
  monthlyPayment: number; // Pago mensual (amortización)
  minimumPayment: number; // Pago mínimo permitido
  
  // Fechas
  startDate: Date;
  endDate: Date;
  nextPaymentDate: Date;
  
  // Estado
  status: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  
  // Tabla de amortización
  amortizationSchedule: AmortizationEntry[];
  
  // Pagos realizados
  payments: LoanPayment[];
  
  // Configuración de intereses moratorios
  lateFeeRate: number; // Interés moratorio (%)
  daysOverdue: number;
  lateFees: number; // Intereses moratorios acumulados
  
  notes?: string;
  createdAt: Date;
}

export interface AmortizationEntry {
  paymentNumber: number;
  dueDate: Date;
  beginningBalance: number;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  endingBalance: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  paidAmount?: number;
  paidDate?: Date;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  paymentNumber: number; // Número de cuota
  amount: number;
  principal: number;
  interest: number;
  lateFee: number; // Interés moratorio
  date: Date;
  method: 'cash' | 'card' | 'transfer';
  receivedBy: string;
  notes?: string;
  remainingBalanceAfter: number;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  pointsPerDollar: number;
  dollarsPerPoint: number;
  tiers: LoyaltyTier[];
  active: boolean;
}

export interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  minPoints: number;
  multiplier: number;
  benefits: string[];
  color: string;
}

// Tipos para módulo de Promociones
export type PromotionType = 
  | 'percentage_discount'    // Descuento %
  | 'fixed_discount'         // Descuento $
  | 'buy_x_get_y'           // 2x1, 3x2
  | 'combo'                 // Paquete de productos
  | 'volume_discount'       // Descuento por volumen
  | 'special_price'         // Precio especial
  | 'category_discount'     // Descuento por categoría
  | 'tier_discount';        // Descuento por nivel de cliente

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: PromotionType;
  status: 'active' | 'inactive' | 'scheduled' | 'expired';
  priority: number; // Mayor número = mayor prioridad
  
  // Productos aplicables
  productIds: string[];
  freeProductIds?: string[]; // Solo para buy_x_get_y: productos que se llevan gratis
  categoryIds?: string[];
  applyToAll?: boolean;
  
  // Condiciones
  minQuantity?: number;
  minAmount?: number;
  maxUsagePerCustomer?: number;
  requiresCoupon?: boolean;
  couponCode?: string;
  
  // Beneficio
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  buyQuantity?: number;  // Para 2x1: compra 2
  getQuantity?: number;  // Para 2x1: lleva 1 gratis
  specialPrice?: number;
  comboProducts?: ComboProduct[];
  
  // Restricciones
  customerTiers?: ('bronze' | 'silver' | 'gold' | 'platinum')[];
  excludeCustomerIds?: string[];
  maxTotalUsage?: number;
  currentUsage: number;
  
  // Vigencia
  startDate: Date;
  endDate: Date;
  daysOfWeek?: number[]; // 0-6 (Domingo-Sábado)
  timeStart?: string; // "09:00"
  timeEnd?: string;   // "18:00"
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  tags?: string[];
  imageUrl?: string;
}

export interface ComboProduct {
  productId: string;
  quantity: number;
  optional?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'free_product';
  value: number;
  description: string;
  
  // Restricciones
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  productIds?: string[];
  categoryIds?: string[];
  customerIds?: string[];
  
  // Uso
  maxUsage?: number;
  maxUsagePerCustomer?: number;
  currentUsage: number;
  usageHistory: CouponUsage[];
  
  // Vigencia
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive' | 'expired';
  
  // Metadata
  createdAt: Date;
  createdBy: string;
}

export interface CouponUsage {
  customerId: string;
  customerName: string;
  saleId: string;
  discountAmount: number;
  usedAt: Date;
}

export interface ActiveDeal {
  promotionId: string;
  name: string;
  type: PromotionType;
  description: string;
  discountPreview: string;
  productsAffected: number;
  endsAt: Date;
  imageUrl?: string;
}

// Sistema de Autenticación y Usuarios
export type UserRole = 'admin' | 'supervisor' | 'cashier';

export interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  username: string;
  password: string; // En producción debería estar hasheada
  fullName: string;
  email?: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  avatar?: string;
}

export interface Session {
  user: User;
  loginTime: Date;
  lastActivity: Date;
}

// Sistema de Auditoría y Seguridad
export type AuditAction = 
  | 'login' 
  | 'logout' 
  | 'sale_created' 
  | 'sale_deleted'
  | 'product_created' 
  | 'product_updated' 
  | 'product_deleted'
  | 'inventory_adjusted'
  | 'purchase_created'
  | 'cash_opened'
  | 'cash_closed'
  | 'cash_adjustment'
  | 'customer_created'
  | 'customer_updated'
  | 'customer_deleted'
  | 'promotion_created'
  | 'promotion_updated'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'backup_created'
  | 'backup_restored'
  | 'session_locked'
  | 'session_unlocked';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  module: string;
  description: string;
  details?: any;
  ipAddress?: string;
  success: boolean;
  criticality?: 'info' | 'warning' | 'critical'; // Nivel de criticidad de la acción
}

export interface SystemBackup {
  id: string;
  timestamp: Date;
  createdBy: string;
  data: {
    products: Product[];
    sales: Sale[];
    customers: Customer[];
    shifts: ShiftSummary[];
    users: User[];
  };
  size: number;
  version: string;
}

export interface SalesReport {
  period: string;
  date: Date;
  sales: number;
  transactions: number;
  averageTicket: number;
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  category: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface CategorySalesReport {
  category: string;
  sales: number;
  transactions: number;
  percentage: number;
  products: number;
}

export interface CashierPerformance {
  cashier: string;
  sales: number;
  transactions: number;
  averageTicket: number;
  hoursWorked: number;
  salesPerHour: number;
}

// Sistema de Pago de Servicios
export type ServiceCategory = 'energy' | 'telecom' | 'water_gas' | 'government' | 'entertainment' | 'financial';

export interface ServiceProvider {
  id: string;
  name: string;
  category: ServiceCategory;
  logo?: string;
  commission: number; // Porcentaje de comisión
  commissionFixed?: number; // Comisión fija opcional
  minAmount?: number;
  maxAmount?: number;
  referenceLength?: number;
  requiresPhone?: boolean;
  requiresEmail?: boolean;
  active: boolean;
  instructions?: string;
}

export interface ServicePayment {
  id: string;
  providerId: string;
  providerName: string;
  category: ServiceCategory;
  reference: string;
  accountName?: string;
  amount: number;
  commission: number;
  total: number; // amount + commission
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  confirmationCode?: string;
  timestamp: Date;
  processedBy: string;
  notes?: string;
}
