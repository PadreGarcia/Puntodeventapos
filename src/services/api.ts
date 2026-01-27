import { API_URL, getHeaders, handleApiError } from '@/config/api';
import type { 
  Product, 
  User, 
  Customer, 
  Sale, 
  Supplier, 
  ServicePayment,
  AuditLog 
} from '@/types/pos';

// Clase principal del servicio API
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_URL;
  }

  // Método genérico para hacer peticiones
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }

      return data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // AUTENTICACIÓN
  async login(username: string, password: string) {
    const data = await this.request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
    }

    return data;
  }

  async getCurrentUser() {
    return this.request<{ success: boolean; user: User }>('/auth/me');
  }

  // PRODUCTOS
  async getProducts() {
    return this.request<{ success: boolean; data: Product[] }>('/products');
  }

  async getProductById(id: string) {
    return this.request<{ success: boolean; data: Product }>(`/products/${id}`);
  }

  async getProductByBarcode(barcode: string) {
    return this.request<{ success: boolean; data: Product }>(`/products/barcode/${barcode}`);
  }

  async createProduct(product: Partial<Product>) {
    return this.request<{ success: boolean; data: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  }

  async updateProduct(id: string, product: Partial<Product>) {
    return this.request<{ success: boolean; data: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  }

  async deleteProduct(id: string) {
    return this.request<{ success: boolean; message: string }>(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  async adjustInventory(id: string, adjustment: number, reason: string) {
    return this.request<{ success: boolean; data: Product }>(`/products/${id}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify({ adjustment, reason })
    });
  }

  // VENTAS
  async getSales(params?: { startDate?: string; endDate?: string; paymentMethod?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: Sale[] }>(`/sales${query ? '?' + query : ''}`);
  }

  async getSaleById(id: string) {
    return this.request<{ success: boolean; data: Sale }>(`/sales/${id}`);
  }

  async createSale(sale: Partial<Sale>) {
    return this.request<{ success: boolean; data: Sale }>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale)
    });
  }

  async deleteSale(id: string) {
    return this.request<{ success: boolean; message: string }>(`/sales/${id}`, {
      method: 'DELETE'
    });
  }

  // CLIENTES
  async getCustomers() {
    return this.request<{ success: boolean; data: Customer[] }>('/customers');
  }

  async getCustomerById(id: string) {
    return this.request<{ success: boolean; data: Customer }>(`/customers/${id}`);
  }

  async getCustomerByNFC(nfcId: string) {
    return this.request<{ success: boolean; data: Customer }>(`/customers/nfc/${nfcId}`);
  }

  async createCustomer(customer: Partial<Customer>) {
    return this.request<{ success: boolean; data: Customer }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    });
  }

  async updateCustomer(id: string, customer: Partial<Customer>) {
    return this.request<{ success: boolean; data: Customer }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer)
    });
  }

  async deleteCustomer(id: string) {
    return this.request<{ success: boolean; message: string }>(`/customers/${id}`, {
      method: 'DELETE'
    });
  }

  async addLoyaltyPoints(id: string, points: number) {
    return this.request<{ success: boolean; data: Customer }>(`/customers/${id}/loyalty/add`, {
      method: 'POST',
      body: JSON.stringify({ points })
    });
  }

  // PROVEEDORES
  async getSuppliers() {
    return this.request<{ success: boolean; data: Supplier[] }>('/suppliers');
  }

  async createSupplier(supplier: Partial<Supplier>) {
    return this.request<{ success: boolean; data: Supplier }>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
  }

  async updateSupplier(id: string, supplier: Partial<Supplier>) {
    return this.request<{ success: boolean; data: Supplier }>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier)
    });
  }

  async deleteSupplier(id: string) {
    return this.request<{ success: boolean; message: string }>(`/suppliers/${id}`, {
      method: 'DELETE'
    });
  }

  // SERVICIOS
  async getServicePayments(params?: { startDate?: string; endDate?: string; category?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: ServicePayment[] }>(`/services${query ? '?' + query : ''}`);
  }

  async createServicePayment(payment: Partial<ServicePayment>) {
    return this.request<{ success: boolean; data: ServicePayment }>('/services', {
      method: 'POST',
      body: JSON.stringify(payment)
    });
  }

  // AUDITORÍA
  async getAuditLogs(params?: { startDate?: string; endDate?: string; module?: string; action?: string; userId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: AuditLog[] }>(`/audit${query ? '?' + query : ''}`);
  }

  async createAuditLog(log: Partial<AuditLog>) {
    return this.request<{ success: boolean; data: AuditLog }>('/audit', {
      method: 'POST',
      body: JSON.stringify(log)
    });
  }

  // USUARIOS
  async getUsers() {
    return this.request<{ success: boolean; data: User[] }>('/users');
  }

  async createUser(user: Partial<User>) {
    return this.request<{ success: boolean; data: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  async updateUser(id: string, user: Partial<User>) {
    return this.request<{ success: boolean; data: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    });
  }

  async deleteUser(id: string) {
    return this.request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // ÓRDENES DE COMPRA
  async getPurchaseOrders(params?: { status?: string; supplierId?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/purchase-orders${query ? '?' + query : ''}`);
  }

  async getPurchaseOrderById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/purchase-orders/${id}`);
  }

  async createPurchaseOrder(order: any) {
    return this.request<{ success: boolean; data: any }>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
  }

  async updatePurchaseOrder(id: string, order: any) {
    return this.request<{ success: boolean; data: any }>(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order)
    });
  }

  async updatePurchaseOrderStatus(id: string, status: string) {
    return this.request<{ success: boolean; data: any }>(`/purchase-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async deletePurchaseOrder(id: string) {
    return this.request<{ success: boolean; message: string }>(`/purchase-orders/${id}`, {
      method: 'DELETE'
    });
  }

  // RECEPCIONES
  async getReceipts(params?: { supplierId?: string; purchaseOrderId?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/receipts${query ? '?' + query : ''}`);
  }

  async getReceiptById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/receipts/${id}`);
  }

  async createReceipt(receipt: any) {
    return this.request<{ success: boolean; data: any }>('/receipts', {
      method: 'POST',
      body: JSON.stringify(receipt)
    });
  }

  async updateReceipt(id: string, receipt: any) {
    return this.request<{ success: boolean; data: any }>(`/receipts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(receipt)
    });
  }

  async deleteReceipt(id: string) {
    return this.request<{ success: boolean; message: string }>(`/receipts/${id}`, {
      method: 'DELETE'
    });
  }

  // FACTURAS DE PROVEEDORES
  async getSupplierInvoices(params?: { status?: string; supplierId?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/invoices${query ? '?' + query : ''}`);
  }

  async getOverdueInvoices() {
    return this.request<{ success: boolean; data: any[] }>('/invoices/overdue');
  }

  async getSupplierInvoiceById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/invoices/${id}`);
  }

  async createSupplierInvoice(invoice: any) {
    return this.request<{ success: boolean; data: any }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice)
    });
  }

  async updateSupplierInvoice(id: string, invoice: any) {
    return this.request<{ success: boolean; data: any }>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice)
    });
  }

  async recordInvoicePayment(id: string, payment: { amount: number; paymentMethod: string; reference?: string; notes?: string }) {
    return this.request<{ success: boolean; data: any }>(`/invoices/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(payment)
    });
  }

  async deleteSupplierInvoice(id: string) {
    return this.request<{ success: boolean; message: string }>(`/invoices/${id}`, {
      method: 'DELETE'
    });
  }

  // CUENTAS POR PAGAR
  async getPayables(params?: { status?: string; supplierId?: string; overdue?: boolean }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/payables${query ? '?' + query : ''}`);
  }

  async getPayablesSummary() {
    return this.request<{ success: boolean; data: any }>('/payables/summary');
  }

  async getPayableById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/payables/${id}`);
  }

  async recordPayablePayment(id: string, payment: { amount: number; paymentMethod: string; reference?: string; notes?: string }) {
    return this.request<{ success: boolean; data: any }>(`/payables/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(payment)
    });
  }

  async updatePayable(id: string, payable: any) {
    return this.request<{ success: boolean; data: any }>(`/payables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payable)
    });
  }

  async deletePayable(id: string) {
    return this.request<{ success: boolean; message: string }>(`/payables/${id}`, {
      method: 'DELETE'
    });
  }

  // GESTIÓN DE CAJA
  async getCurrentCashRegister() {
    return this.request<{ success: boolean; data: any }>('/cash/current');
  }

  async openCashRegister(data: { openingBalance: number; denominations?: any[]; notes?: string }) {
    return this.request<{ success: boolean; data: any }>('/cash/open', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async closeCashRegister(data: { actualClosingBalance: number; denominations?: any[]; notes?: string }) {
    return this.request<{ success: boolean; data: any }>('/cash/close', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCashMovements() {
    return this.request<{ success: boolean; data: any[] }>('/cash/movements');
  }

  async addCashMovement(movement: { type: 'income' | 'withdrawal'; amount: number; reason: string; category: string; notes?: string }) {
    return this.request<{ success: boolean; data: any }>('/cash/movements', {
      method: 'POST',
      body: JSON.stringify(movement)
    });
  }

  async getCashCounts(shiftId?: string) {
    const query = shiftId ? `?shiftId=${shiftId}` : '';
    return this.request<{ success: boolean; data: any[] }>(`/cash/counts${query}`);
  }

  async createCashCount(count: { shiftId: string; denominations: any[]; type?: string; notes?: string }) {
    return this.request<{ success: boolean; data: any }>('/cash/counts', {
      method: 'POST',
      body: JSON.stringify(count)
    });
  }

  async getCashRegisterHistory(params?: { startDate?: string; endDate?: string; userId?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/cash/history${query ? '?' + query : ''}`);
  }

  async getCashRegisterById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/cash/${id}`);
  }

  async getCashSummary() {
    return this.request<{ success: boolean; data: any }>('/cash/summary');
  }

  async updateCashRegisterSales(data: { saleId: string; paymentMethod: string; amount: number }) {
    return this.request<{ success: boolean; data }>('/cash/update-sales', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // CLIENTES MEJORADO
  async searchCustomers(params?: { query?: string; loyaltyTier?: string; status?: string; hasNFC?: string; hasCredit?: string; minPoints?: number; maxPoints?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[]; count: number }>(`/customers/search${query ? '?' + query : ''}`);
  }

  async getCustomerStats() {
    return this.request<{ success: boolean; data: any }>('/customers/stats');
  }

  async getCustomerProfile(id: string) {
    return this.request<{ success: boolean; data: any }>(`/customers/${id}/profile`);
  }

  async redeemLoyaltyPoints(id: string, data: { points: number; description: string }) {
    return this.request<{ success: boolean; data: any }>(`/customers/${id}/loyalty/redeem`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCreditLimit(id: string, data: { creditLimit: number; creditScore?: number }) {
    return this.request<{ success: boolean; data: any }>(`/customers/${id}/credit`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // TARJETAS NFC
  async getNFCCards(params?: { status?: string; linked?: string; customerId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/nfc${query ? '?' + query : ''}`);
  }

  async getNFCCardById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/nfc/${id}`);
  }

  async getNFCCardByCardId(cardId: string) {
    return this.request<{ success: boolean; data: any }>(`/nfc/card/${cardId}`);
  }

  async createNFCCard(data: { cardId: string; cardType?: string; notes?: string }) {
    return this.request<{ success: boolean; data: any }>('/nfc', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async linkNFCCard(id: string, customerId: string) {
    return this.request<{ success: boolean; data: any }>(`/nfc/${id}/link`, {
      method: 'POST',
      body: JSON.stringify({ customerId })
    });
  }

  async unlinkNFCCard(id: string, reason?: string) {
    return this.request<{ success: boolean; data: any }>(`/nfc/${id}/unlink`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async activateNFCCard(id: string) {
    return this.request<{ success: boolean; data: any }>(`/nfc/${id}/activate`, {
      method: 'POST'
    });
  }

  async blockNFCCard(id: string, reason: string) {
    return this.request<{ success: boolean; data: any }>(`/nfc/${id}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async recordNFCUsage(cardId: string, data: { transactionType: string; details?: any }) {
    return this.request<{ success: boolean; data: any }>(`/nfc/card/${cardId}/usage`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getNFCStats() {
    return this.request<{ success: boolean; data: any }>('/nfc/stats');
  }

  async updateNFCCard(id: string, data: { cardType?: string; notes?: string; status?: string }) {
    return this.request<{ success: boolean; data: any }>(`/nfc/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteNFCCard(id: string) {
    return this.request<{ success: boolean; message: string }>(`/nfc/${id}`, {
      method: 'DELETE'
    });
  }

  // CUENTAS POR COBRAR (FIADO)
  async getAccountsReceivable(params?: { status?: string; customerId?: string; startDate?: string; endDate?: string; overdue?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/receivables${query ? '?' + query : ''}`);
  }

  async getAccountReceivableById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/receivables/${id}`);
  }

  async createAccountReceivable(data: { customerId: string; saleId?: string; totalAmount: number; paymentTermDays?: number; interestRate?: number; notes?: string }) {
    return this.request<{ success: boolean; data: any }>('/receivables', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async recordReceivablePayment(id: string, data: { amount: number; paymentMethod: string; reference?: string; notes?: string }) {
    return this.request<{ success: boolean; data: any }>(`/receivables/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async cancelAccountReceivable(id: string, reason: string) {
    return this.request<{ success: boolean; data: any }>(`/receivables/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async getReceivablesSummary() {
    return this.request<{ success: boolean; data: any }>('/receivables/summary');
  }

  async getOverdueAccounts() {
    return this.request<{ success: boolean; data: any[] }>('/receivables/overdue');
  }

  async updateReceivableInterestRate(id: string, interestRate: number) {
    return this.request<{ success: boolean; data: any }>(`/receivables/${id}/interest`, {
      method: 'PATCH',
      body: JSON.stringify({ interestRate })
    });
  }

  async getCustomerPaymentHistory(customerId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/receivables/customer/${customerId}/history`);
  }

  // PRÉSTAMOS
  async getLoans(params?: { status?: string; customerId?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/loans${query ? '?' + query : ''}`);
  }

  async getLoanById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/loans/${id}`);
  }

  async calculateLoan(data: { loanAmount: number; interestRate: number; termMonths: number }) {
    return this.request<{ success: boolean; data: any }>('/loans/calculate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createLoan(data: { customerId: string; loanAmount: number; interestRate: number; termMonths: number; purpose?: string; collateral?: string; collateralValue?: number; lateFeePercentage?: number; notes?: string }) {
    return this.request<{ success: boolean; data: any }>('/loans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async disburseLoan(id: string, data: { disbursementMethod: string; notes?: string }) {
    return this.request<{ success: boolean; data: any }>(`/loans/${id}/disburse`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async recordLoanPayment(id: string, data: { paymentNumber: number; amount: number; paymentMethod: string; reference?: string; notes?: string }) {
    return this.request<{ success: boolean; data: any }>(`/loans/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getNextLoanPayment(id: string) {
    return this.request<{ success: boolean; data: any }>(`/loans/${id}/next-payment`);
  }

  async getLoanAmortizationSchedule(id: string) {
    return this.request<{ success: boolean; data: any[] }>(`/loans/${id}/schedule`);
  }

  async cancelLoan(id: string, reason: string) {
    return this.request<{ success: boolean; data: any }>(`/loans/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async getLoansSummary() {
    return this.request<{ success: boolean; data: any }>('/loans/summary');
  }

  async getDefaultedLoans() {
    return this.request<{ success: boolean; data: any[] }>('/loans/defaulted');
  }

  async getCustomerLoanHistory(customerId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/loans/customer/${customerId}/history`);
  }

  async updateLoan(id: string, data: { collateral?: string; collateralValue?: number; notes?: string }) {
    return this.request<{ success: boolean; data: any }>(`/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ==========================================
  // PROMOCIONES
  // ==========================================
  
  async getAllPromotions(params?: { status?: string; type?: string; active_only?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.active_only) queryParams.append('active_only', 'true');
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; count: number; data: any[] }>(`/promotions${query}`);
  }

  async getPromotionById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/promotions/${id}`);
  }

  async createPromotion(promotion: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/promotions', {
      method: 'POST',
      body: JSON.stringify(promotion)
    });
  }

  async updatePromotion(id: string, promotion: Partial<any>) {
    return this.request<{ success: boolean; message: string; data: any }>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promotion)
    });
  }

  async deletePromotion(id: string) {
    return this.request<{ success: boolean; message: string }>(`/promotions/${id}`, {
      method: 'DELETE'
    });
  }

  async togglePromotionStatus(id: string, status: 'active' | 'inactive' | 'scheduled') {
    return this.request<{ success: boolean; message: string; data: any }>(`/promotions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async getPromotionsForProduct(productId: string) {
    return this.request<{ success: boolean; count: number; data: any[] }>(`/promotions/product/${productId}`);
  }

  async getActiveDeals() {
    return this.request<{ success: boolean; count: number; data: any[] }>('/promotions/active/deals');
  }

  async applyPromotionToCart(data: { promotionId: string; cartItems: any[]; customerId?: string }) {
    return this.request<{ success: boolean; data: any }>('/promotions/apply', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async duplicatePromotion(id: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/promotions/${id}/duplicate`, {
      method: 'POST'
    });
  }

  // ==========================================
  // CUPONES
  // ==========================================

  async getAllCoupons(params?: { status?: string; type?: string; customer_id?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; count: number; data: any[] }>(`/coupons${query}`);
  }

  async getCouponById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/coupons/${id}`);
  }

  async createCoupon(coupon: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/coupons', {
      method: 'POST',
      body: JSON.stringify(coupon)
    });
  }

  async updateCoupon(id: string, coupon: Partial<any>) {
    return this.request<{ success: boolean; message: string; data: any }>(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(coupon)
    });
  }

  async deleteCoupon(id: string) {
    return this.request<{ success: boolean; message: string }>(`/coupons/${id}`, {
      method: 'DELETE'
    });
  }

  async validateCoupon(data: { code: string; customerId?: string; cartTotal: number; cartItems?: any[] }) {
    return this.request<{ success: boolean; valid: boolean; message: string; data?: any }>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async applyCoupon(data: { couponId: string; customerId: string; customerName: string; saleId: string; discountAmount: number }) {
    return this.request<{ success: boolean; message: string; data: any }>('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async toggleCouponStatus(id: string, status: 'active' | 'inactive') {
    return this.request<{ success: boolean; message: string; data: any }>(`/coupons/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async getCouponStats(id: string) {
    return this.request<{ success: boolean; data: any }>(`/coupons/${id}/stats`);
  }

  async generateCouponCode(params?: { length?: number; prefix?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.length) queryParams.append('length', params.length.toString());
    if (params?.prefix) queryParams.append('prefix', params.prefix);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; code: string }>(`/coupons/generate/code${query}`);
  }

  // ==========================================
  // RECARGAS TELEFÓNICAS
  // ==========================================

  // Operadores
  async getAllCarriers(activeOnly?: boolean) {
    const query = activeOnly ? '?active_only=true' : '';
    return this.request<{ success: boolean; count: number; data: any[] }>(`/recharges/carriers${query}`);
  }

  async createCarrier(carrier: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/recharges/carriers', {
      method: 'POST',
      body: JSON.stringify(carrier)
    });
  }

  async updateCarrier(id: string, carrier: Partial<any>) {
    return this.request<{ success: boolean; message: string; data: any }>(`/recharges/carriers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carrier)
    });
  }

  // Productos
  async getRechargeProducts(params?: { carrier_id?: string; type?: string; active_only?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.carrier_id) queryParams.append('carrier_id', params.carrier_id);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.active_only) queryParams.append('active_only', 'true');
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; count: number; data: any[] }>(`/recharges/products${query}`);
  }

  async createRechargeProduct(product: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/recharges/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  }

  async updateRechargeProduct(id: string, product: Partial<any>) {
    return this.request<{ success: boolean; message: string; data: any }>(`/recharges/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  }

  // Recargas
  async createRecharge(data: {
    carrierId: string;
    phoneNumber: string;
    productId: string;
    paymentMethod: string;
    receivedAmount?: number;
    customerId?: string;
    cashRegisterId?: string;
  }) {
    return this.request<{ success: boolean; message: string; data: any }>('/recharges', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAllRecharges(params?: {
    status?: string;
    carrier_id?: string;
    phone_number?: string;
    date_from?: string;
    date_to?: string;
    user_id?: string;
    limit?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.carrier_id) queryParams.append('carrier_id', params.carrier_id);
    if (params?.phone_number) queryParams.append('phone_number', params.phone_number);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; count: number; total: number; page: number; pages: number; data: any[] }>(`/recharges${query}`);
  }

  async getRechargeById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/recharges/${id}`);
  }

  async getRechargeByCode(code: string) {
    return this.request<{ success: boolean; data: any }>(`/recharges/code/${code}`);
  }

  async getRechargesByPhone(phoneNumber: string) {
    return this.request<{ success: boolean; count: number; phoneNumber: string; data: any[] }>(`/recharges/phone/${phoneNumber}`);
  }

  async getDailyRechargeStats(params?: { date?: string; user_id?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; data: any }>(`/recharges/stats/daily${query}`);
  }

  async validatePhoneNumber(phoneNumber: string) {
    return this.request<{ success: boolean; valid: boolean; message?: string; phoneNumber?: string; history?: any; customer?: any }>('/recharges/validate-phone', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
  }

  async cancelRecharge(id: string, reason: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/recharges/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  }

  // ==========================================
  // PAGO DE SERVICIOS
  // ==========================================

  // Proveedores de servicios
  async getAllServiceProviders(params?: { category?: string; active_only?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.active_only) queryParams.append('active_only', 'true');
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; count: number; data: any[] }>(`/services/providers${query}`);
  }

  async getServiceProviderById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/services/providers/${id}`);
  }

  async createServiceProvider(provider: any) {
    return this.request<{ success: boolean; message: string; data: any }>('/services/providers', {
      method: 'POST',
      body: JSON.stringify(provider)
    });
  }

  async updateServiceProvider(id: string, provider: Partial<any>) {
    return this.request<{ success: boolean; message: string; data: any }>(`/services/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(provider)
    });
  }

  // Pagos de servicios - método getAllServicePayments ya existe como getServicePayments arriba
  async getAllServicePayments(params?: {
    status?: string;
    provider_id?: string;
    category?: string;
    reference?: string;
    date_from?: string;
    date_to?: string;
    user_id?: string;
    limit?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.provider_id) queryParams.append('provider_id', params.provider_id);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.reference) queryParams.append('reference', params.reference);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; count: number; total: number; page: number; pages: number; data: any[] }>(`/services${query}`);
  }

  async getServicePaymentById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/services/${id}`);
  }

  async getServicePaymentByCode(code: string) {
    return this.request<{ success: boolean; data: any }>(`/services/code/${code}`);
  }

  async getServicePaymentsByReference(reference: string) {
    return this.request<{ success: boolean; count: number; reference: string; data: any[] }>(`/services/reference/${reference}`);
  }

  async getDailyServiceStats(params?: { date?: string; user_id?: string; category?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.category) queryParams.append('category', params.category);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; data: any }>(`/services/stats/daily${query}`);
  }

  async getServiceCommissionsReport(params?: {
    date_from?: string;
    date_to?: string;
    category?: string;
    provider_id?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.provider_id) queryParams.append('provider_id', params.provider_id);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; data: any }>(`/services/stats/commissions${query}`);
  }

  async validateServiceReference(providerId: string, reference: string) {
    return this.request<{ success: boolean; valid: boolean; message?: string; reference?: string; provider?: string; history?: any }>('/services/validate-reference', {
      method: 'POST',
      body: JSON.stringify({ providerId, reference })
    });
  }

  async cancelServicePayment(id: string, reason: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/services/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  }

  // ==========================================
  // USUARIOS
  // ==========================================

  // Gestión de usuarios
  async getAllUsers(params?: {
    role?: string;
    is_active?: boolean;
    department?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.department) queryParams.append('department', params.department);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; count: number; total: number; page: number; pages: number; data: any[] }>(`/users${query}`);
  }

  async getUserById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/users/${id}`);
  }

  // createUser, updateUser y deleteUser ya existen arriba en las líneas 220-237
  // Se removieron los duplicados para evitar conflictos

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async toggleUserStatus(id: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/users/${id}/toggle-status`, {
      method: 'PUT'
    });
  }

  // deleteUser ya existe arriba en la línea 234 - se removió el duplicado

  // Estadísticas y reportes de usuarios
  async getUserStats(id: string, params?: { date_from?: string; date_to?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; data: any }>(`/users/${id}/stats${query}`);
  }

  async getUsersRanking(params?: {
    date_from?: string;
    date_to?: string;
    metric?: 'sales' | 'amount' | 'ticket';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.metric) queryParams.append('metric', params.metric);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; metric: string; count: number; data: any[] }>(`/users/ranking${query}`);
  }

  async getUserActivity(id: string, limit: number = 20) {
    return this.request<{ success: boolean; user: any; count: number; data: any[] }>(`/users/${id}/activity?limit=${limit}`);
  }

  // Permisos
  async updateUserPermissions(id: string, permissions: any[]) {
    return this.request<{ success: boolean; message: string; data: any }>(`/users/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions })
    });
  }

  // Turnos
  async getUserCurrentShift(id: string) {
    return this.request<{ success: boolean; hasShift: boolean; data?: any; message?: string }>(`/users/${id}/current-shift`);
  }

  async getUserShiftsHistory(id: string, params?: { limit?: number; page?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ success: boolean; user: any; count: number; total: number; page: number; pages: number; data: any[] }>(`/users/${id}/shifts${query}`);
  }
}

// Exportar instancia única del servicio
export const api = new ApiService();
