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
    const response = await apiClient.get<any[]>(`/purchase-orders${query}`);
    return response.data || [];
  }

  async getPurchaseOrderById(id: string) {
    const response = await apiClient.get<any>(`/purchase-orders/${id}`);
    return response.data;
  }

  async createPurchaseOrder(order: any) {
    const response = await apiClient.post<any>('/purchase-orders', order);
    return response.data;
  }

  async updatePurchaseOrder(id: string, order: any) {
    const response = await apiClient.put<any>(`/purchase-orders/${id}`, order);
    return response.data;
  }

  async updatePurchaseOrderStatus(id: string, status: string) {
    const response = await apiClient.patch<any>(`/purchase-orders/${id}/status`, { status });
    return response.data;
  }

  async deletePurchaseOrder(id: string) {
    const response = await apiClient.delete(`/purchase-orders/${id}`);
    return response.data;
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
    const response = await apiClient.get<any[]>(`/receipts${query}`);
    return response.data || [];
  }

  async getReceiptById(id: string) {
    const response = await apiClient.get<any>(`/receipts/${id}`);
    return response.data;
  }

  async createReceipt(receipt: any) {
    const response = await apiClient.post<any>('/receipts', receipt);
    return response.data;
  }

  async updateReceipt(id: string, receipt: any) {
    const response = await apiClient.put<any>(`/receipts/${id}`, receipt);
    return response.data;
  }

  async deleteReceipt(id: string) {
    const response = await apiClient.delete(`/receipts/${id}`);
    return response.data;
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
    const response = await apiClient.get<any[]>(`/invoices${query}`);
    return response.data || [];
  }

  async getOverdueInvoices() {
    const response = await apiClient.get<any[]>('/invoices/overdue');
    return response.data || [];
  }

  async getSupplierInvoiceById(id: string) {
    const response = await apiClient.get<any>(`/invoices/${id}`);
    return response.data;
  }

  async createSupplierInvoice(invoice: any) {
    const response = await apiClient.post<any>('/invoices', invoice);
    return response.data;
  }

  async updateSupplierInvoice(id: string, invoice: any) {
    const response = await apiClient.put<any>(`/invoices/${id}`, invoice);
    return response.data;
  }

  async recordInvoicePayment(id: string, payment: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    const response = await apiClient.post<any>(`/invoices/${id}/payment`, payment);
    return response.data;
  }

  async deleteSupplierInvoice(id: string) {
    const response = await apiClient.delete(`/invoices/${id}`);
    return response.data;
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
    const response = await apiClient.get<any[]>(`/payables${query}`);
    return response.data || [];
  }

  async getPayablesSummary() {
    const response = await apiClient.get<any>('/payables/summary');
    return response.data;
  }

  async getPayableById(id: string) {
    const response = await apiClient.get<any>(`/payables/${id}`);
    return response.data;
  }

  async recordPayablePayment(id: string, payment: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    const response = await apiClient.post<any>(`/payables/${id}/payment`, payment);
    return response.data;
  }

  async updatePayable(id: string, payable: any) {
    const response = await apiClient.put<any>(`/payables/${id}`, payable);
    return response.data;
  }

  async deletePayable(id: string) {
    const response = await apiClient.delete(`/payables/${id}`);
    return response.data;
  }

  // ==========================================
  // PROVEEDORES
  // ==========================================

  async getSuppliers() {
    const response = await apiClient.get<any[]>('/suppliers');
    return response.data || [];
  }

  async getSupplierById(id: string) {
    const response = await apiClient.get<any>(`/suppliers/${id}`);
    return response.data;
  }

  async createSupplier(supplier: any) {
    const response = await apiClient.post<any>('/suppliers', supplier);
    return response.data;
  }

  async updateSupplier(id: string, supplier: any) {
    const response = await apiClient.put<any>(`/suppliers/${id}`, supplier);
    return response.data;
  }

  async deleteSupplier(id: string) {
    const response = await apiClient.delete(`/suppliers/${id}`);
    return response.data;
  }
}

export const purchaseService = new PurchaseService();
