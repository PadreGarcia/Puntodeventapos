/**
 * Servicio de Compras
 * Gestión de órdenes de compra, recepciones, facturas y cuentas por pagar
 */

import { apiClient } from '@/lib/apiClient';

// Helper para transformar _id de MongoDB a id
const transformMongoDoc = (doc: any): any => {
  if (!doc) return doc;
  
  if (Array.isArray(doc)) {
    return doc.map(transformMongoDoc);
  }
  
  if (doc._id) {
    const { _id, ...rest } = doc;
    return { id: _id, ...rest };
  }
  
  return doc;
};

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
    return transformMongoDoc(response.data || []);
  }

  async getPurchaseOrderById(id: string) {
    const response = await apiClient.get<any>(`/purchase-orders/${id}`);
    return transformMongoDoc(response.data);
  }

  async createPurchaseOrder(order: any) {
    const response = await apiClient.post<any>('/purchase-orders', order);
    return transformMongoDoc(response.data);
  }

  async updatePurchaseOrder(id: string, order: any) {
    const response = await apiClient.put<any>(`/purchase-orders/${id}`, order);
    return transformMongoDoc(response.data);
  }

  async updatePurchaseOrderStatus(id: string, status: string) {
    const response = await apiClient.patch<any>(`/purchase-orders/${id}/status`, { status });
    return transformMongoDoc(response.data);
  }

  async deletePurchaseOrder(id: string) {
    const response = await apiClient.delete(`/purchase-orders/${id}`);
    return transformMongoDoc(response.data);
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
    const receipts = transformMongoDoc(response.data || []);
    
    // Transformar los nombres de campos del backend al frontend
    return receipts.map((receipt: any) => {
      if (receipt.items) {
        receipt.items = receipt.items.map((item: any) => ({
          ...item,
          receivedQuantity: item.quantityReceived,
          orderedQuantity: item.quantityOrdered,
        }));
      }
      
      // Mapear receivedDate (backend) a receivedAt (frontend)
      if (receipt.receivedDate) {
        receipt.receivedAt = new Date(receipt.receivedDate);
      }
      
      // Mapear receivedByName (backend) a receivedBy (frontend para mostrar)
      // El backend guarda: receivedBy (ID) y receivedByName (nombre)
      // El frontend muestra: receivedBy (que debería ser el nombre)
      if (receipt.receivedByName) {
        receipt.receivedBy = receipt.receivedByName;
      }
      
      return receipt;
    });
  }

  async getReceiptById(id: string) {
    const response = await apiClient.get<any>(`/receipts/${id}`);
    const transformed = transformMongoDoc(response.data);
    
    // Transformar los nombres de campos del backend al frontend
    if (transformed && transformed.items) {
      transformed.items = transformed.items.map((item: any) => ({
        ...item,
        receivedQuantity: item.quantityReceived,
        orderedQuantity: item.quantityOrdered,
      }));
    }
    
    // Mapear receivedDate (backend) a receivedAt (frontend)
    if (transformed && transformed.receivedDate) {
      transformed.receivedAt = new Date(transformed.receivedDate);
    }
    
    // Mapear receivedByName (backend) a receivedBy (frontend para mostrar)
    if (transformed && transformed.receivedByName) {
      transformed.receivedBy = transformed.receivedByName;
    }
    
    return transformed;
  }

  async createReceipt(receipt: any) {
    const response = await apiClient.post<any>('/receipts', receipt);
    const transformed = transformMongoDoc(response.data);
    
    // Transformar los nombres de campos del backend al frontend
    if (transformed && transformed.items) {
      transformed.items = transformed.items.map((item: any) => ({
        ...item,
        receivedQuantity: item.quantityReceived,
        orderedQuantity: item.quantityOrdered,
      }));
    }
    
    // Mapear receivedDate (backend) a receivedAt (frontend)
    if (transformed && transformed.receivedDate) {
      transformed.receivedAt = new Date(transformed.receivedDate);
    }
    
    // Mapear receivedByName (backend) a receivedBy (frontend para mostrar)
    if (transformed && transformed.receivedByName) {
      transformed.receivedBy = transformed.receivedByName;
    }
    
    return transformed;
  }

  async updateReceipt(id: string, receipt: any) {
    const response = await apiClient.put<any>(`/receipts/${id}`, receipt);
    return transformMongoDoc(response.data);
  }

  async deleteReceipt(id: string) {
    const response = await apiClient.delete(`/receipts/${id}`);
    return transformMongoDoc(response.data);
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
    return transformMongoDoc(response.data || []);
  }

  async getOverdueInvoices() {
    const response = await apiClient.get<any[]>('/invoices/overdue');
    return transformMongoDoc(response.data || []);
  }

  async getSupplierInvoiceById(id: string) {
    const response = await apiClient.get<any>(`/invoices/${id}`);
    return transformMongoDoc(response.data);
  }

  async createSupplierInvoice(invoice: any) {
    const response = await apiClient.post<any>('/invoices', invoice);
    return transformMongoDoc(response.data);
  }

  async updateSupplierInvoice(id: string, invoice: any) {
    const response = await apiClient.put<any>(`/invoices/${id}`, invoice);
    return transformMongoDoc(response.data);
  }

  async recordInvoicePayment(id: string, payment: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    const response = await apiClient.post<any>(`/invoices/${id}/payment`, payment);
    return transformMongoDoc(response.data);
  }

  async deleteSupplierInvoice(id: string) {
    const response = await apiClient.delete(`/invoices/${id}`);
    return transformMongoDoc(response.data);
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
    return transformMongoDoc(response.data || []);
  }

  async getPayablesSummary() {
    const response = await apiClient.get<any>('/payables/summary');
    return transformMongoDoc(response.data);
  }

  async getPayableById(id: string) {
    const response = await apiClient.get<any>(`/payables/${id}`);
    return transformMongoDoc(response.data);
  }

  async recordPayablePayment(id: string, payment: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    const response = await apiClient.post<any>(`/payables/${id}/payment`, payment);
    return transformMongoDoc(response.data);
  }

  async updatePayable(id: string, payable: any) {
    const response = await apiClient.put<any>(`/payables/${id}`, payable);
    return transformMongoDoc(response.data);
  }

  async deletePayable(id: string) {
    const response = await apiClient.delete(`/payables/${id}`);
    return transformMongoDoc(response.data);
  }

  // ==========================================
  // PROVEEDORES
  // ==========================================

  async getSuppliers() {
    const response = await apiClient.get<any[]>('/suppliers');
    return transformMongoDoc(response.data || []);
  }

  async getSupplierById(id: string) {
    const response = await apiClient.get<any>(`/suppliers/${id}`);
    return transformMongoDoc(response.data);
  }

  async createSupplier(supplier: any) {
    const response = await apiClient.post<any>('/suppliers', supplier);
    return transformMongoDoc(response.data);
  }

  async updateSupplier(id: string, supplier: any) {
    const response = await apiClient.put<any>(`/suppliers/${id}`, supplier);
    return transformMongoDoc(response.data);
  }

  async deleteSupplier(id: string) {
    const response = await apiClient.delete(`/suppliers/${id}`);
    return transformMongoDoc(response.data);
  }
}

export const purchaseService = new PurchaseService();
