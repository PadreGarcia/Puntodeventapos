import { useState, useEffect } from 'react';
import { ShoppingCart, Users, FileText, Package, CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { purchaseService } from '@/services';
import { SuppliersTab } from '@/app/components/pos/purchase/SuppliersTab';
import { PurchaseOrdersTab } from '@/app/components/pos/purchase/PurchaseOrdersTab';
import { ReceiptsTab } from '@/app/components/pos/purchase/ReceiptsTab';
import { InvoicesTab } from '@/app/components/pos/purchase/InvoicesTab';
import { PayablesTab } from '@/app/components/pos/purchase/PayablesTab';
import type { 
  Product, 
  Supplier, 
  PurchaseOrder, 
  ProductReceipt, 
  SupplierInvoice, 
  PayableAccount 
} from '@/types/pos';

interface PurchaseManagementProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  suppliers: Supplier[];
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
}

type TabType = 'suppliers' | 'orders' | 'receipts' | 'invoices' | 'payables';

export function PurchaseManagement({ products, onUpdateProducts, suppliers, onUpdateSuppliers }: PurchaseManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('suppliers');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<ProductReceipt[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [payables, setPayables] = useState<PayableAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos desde el backend al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar órdenes de compra
        const ordersData = await purchaseService.getPurchaseOrders();
        setPurchaseOrders(ordersData);

        // Cargar recepciones
        const receiptsData = await purchaseService.getReceipts();
        setReceipts(receiptsData);

        // Cargar facturas
        const invoicesData = await purchaseService.getSupplierInvoices();
        setInvoices(invoicesData);

        // Cargar cuentas por pagar
        const payablesData = await purchaseService.getPayables();
        setPayables(payablesData);

      } catch (error) {
        console.error('Error al cargar datos de compras:', error);
        toast.error('Error al cargar datos de compras');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const tabs = [
    { id: 'suppliers' as TabType, label: 'Proveedores', icon: Users, count: suppliers.length },
    { id: 'orders' as TabType, label: 'Órdenes de Compra', icon: ShoppingCart, count: purchaseOrders.length },
    { id: 'receipts' as TabType, label: 'Recepción', icon: Package, count: receipts.length },
    { id: 'invoices' as TabType, label: 'Facturas', icon: FileText, count: invoices.length },
    { id: 'payables' as TabType, label: 'Cuentas por Pagar', icon: CreditCard, count: payables.length },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#EC0000] mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Cargando módulo de compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-40">
        <div className="px-4 pt-2 pb-3">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'suppliers' && (
          <SuppliersTab
            suppliers={suppliers}
            onUpdateSuppliers={onUpdateSuppliers}
            products={products}
            onUpdateProducts={onUpdateProducts}
          />
        )}

        {activeTab === 'orders' && (
          <PurchaseOrdersTab
            purchaseOrders={purchaseOrders}
            onUpdatePurchaseOrders={setPurchaseOrders}
            suppliers={suppliers}
            products={products}
          />
        )}

        {activeTab === 'receipts' && (
          <ReceiptsTab
            receipts={receipts}
            onUpdateReceipts={setReceipts}
            purchaseOrders={purchaseOrders}
            onUpdatePurchaseOrders={setPurchaseOrders}
            products={products}
            onUpdateProducts={onUpdateProducts}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesTab
            invoices={invoices}
            onUpdateInvoices={setInvoices}
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            onCreatePayable={(payable) => setPayables(prev => [...prev, payable])}
          />
        )}

        {activeTab === 'payables' && (
          <PayablesTab
            payables={payables}
            onUpdatePayables={setPayables}
            suppliers={suppliers}
          />
        )}
      </div>
    </div>
  );
}
