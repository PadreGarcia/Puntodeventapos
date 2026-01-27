/**
 * Servicio de Compras
 * Gestión de órdenes de compra, recepciones, facturas y cuentas por pagar
 */

import { apiClient } from '@/lib/apiClient';

class PurchaseService {
  // ==========================================
  // ÓRDENES DE COMPRA
  // ==========================================

  async getPurchaseOrders(filters?: {
    status?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<any[]>(`/purchase-orders${query}`);
  }

  async getPurchaseOrderById(id: string) {
    return apiClient.get<any>(`/purchase-orders/${id}`);
  }

  async createPurchaseOrder(order: any) {
    return apiClient.post<any>('/purchase-orders', order);
  }

  async updatePurchaseOrder(id: string, order: any) {
    return apiClient.put<any>(`/purchase-orders/${id}`, order);
  }

  async updatePurchaseOrderStatus(id: string, status: string) {
    return apiClient.patch<any>(`/purchase-orders/${id}/status`, { status });
  }

  async deletePurchaseOrder(id: string) {
    return apiClient.delete(`/purchase-orders/${id}`);
  }

  // ==========================================
  // RECEPCIONES
  // ==========================================

  async getReceipts(filters?: {
    supplierId?: string;
    purchaseOrderId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<any[]>(`/receipts${query}`);
  }

  async getReceiptById(id: string) {
    return apiClient.get<any>(`/receipts/${id}`);
  }

  async createReceipt(receipt: any) {
    return apiClient.post<any>('/receipts', receipt);
  }

  async updateReceipt(id: string, receipt: any) {
    return apiClient.put<any>(`/receipts/${id}`, receipt);
  }

  async deleteReceipt(id: string) {
    return apiClient.delete(`/receipts/${id}`);
  }

  // ==========================================
  // FACTURAS DE PROVEEDORES
  // ==========================================

  async getSupplierInvoices(filters?: {
    status?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<any[]>(`/invoices${query}`);
  }

  async getOverdueInvoices() {
    return apiClient.get<any[]>('/invoices/overdue');
  }

  async getSupplierInvoiceById(id: string) {
    return apiClient.get<any>(`/invoices/${id}`);
  }

  async createSupplierInvoice(invoice: any) {
    return apiClient.post<any>('/invoices', invoice);
  }

  async updateSupplierInvoice(id: string, invoice: any) {
    return apiClient.put<any>(`/invoices/${id}`, invoice);
  }

  async recordInvoicePayment(id: string, payment: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    return apiClient.post<any>(`/invoices/${id}/payment`, payment);
  }

  async deleteSupplierInvoice(id: string) {
    return apiClient.delete(`/invoices/${id}`);
  }

  // ==========================================
  // CUENTAS POR PAGAR
  // ==========================================

  async getPayables(filters?: {
    status?: string;
    supplierId?: string;
    overdue?: boolean;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<any[]>(`/payables${query}`);
  }

  async getPayablesSummary() {
    return apiClient.get<any>('/payables/summary');
  }

  async getPayableById(id: string) {
    return apiClient.get<any>(`/payables/${id}`);
  }

  async recordPayablePayment(id: string, payment: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    return apiClient.post<any>(`/payables/${id}/payment`, payment);
  }

  async updatePayable(id: string, payable: any) {
    return apiClient.put<any>(`/payables/${id}`, payable);
  }

  async deletePayable(id: string) {
    return apiClient.delete(`/payables/${id}`);
  }

  // ==========================================
  // PROVEEDORES
  // ==========================================

  async getSuppliers() {
    return apiClient.get<any[]>('/suppliers');
  }

  async getSupplierById(id: string) {
    return apiClient.get<any>(`/suppliers/${id}`);
  }

  async createSupplier(supplier: any) {
    return apiClient.post<any>('/suppliers', supplier);
  }

  async updateSupplier(id: string, supplier: any) {
    return apiClient.put<any>(`/suppliers/${id}`, supplier);
  }

  async deleteSupplier(id: string) {
    return apiClient.delete(`/suppliers/${id}`);
  }
}

export const purchaseService = new PurchaseService();
