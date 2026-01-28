import { useState } from 'react';
import { Search, Plus, FileText, X, Save, AlertTriangle, CheckCircle, Clock, Grid3x3, List } from 'lucide-react';
import { toast } from 'sonner';
import type { SupplierInvoice, Supplier, PurchaseOrder, PayableAccount, InvoiceStatus } from '@/types/pos';

interface InvoicesTabProps {
  invoices: SupplierInvoice[];
  onUpdateInvoices: (invoices: SupplierInvoice[]) => void;
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onCreatePayable: (payable: PayableAccount) => void;
}

type ViewMode = 'grid' | 'table';

export function InvoicesTab({ 
  invoices, 
  onUpdateInvoices, 
  suppliers,
  purchaseOrders,
  onCreatePayable
}: InvoicesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
    purchaseOrderId: '',
    amount: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = () => {
    setFormData({
      invoiceNumber: '',
      supplierId: '',
      purchaseOrderId: '',
      amount: 0,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setFormData({
      ...formData,
      supplierId,
      purchaseOrderId: '',
      dueDate: new Date(
        Date.now() + (supplier?.paymentTerms || 0) * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
    });
  };

  const handleOrderChange = (orderId: string) => {
    setFormData({
      ...formData,
      purchaseOrderId: orderId,
    });
  };

  const handleSaveInvoice = () => {
    if (!formData.invoiceNumber.trim()) {
      toast.error('El número de factura es obligatorio');
      return;
    }
    if (!formData.supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplierId);
    if (!supplier) return;

    const newInvoice: SupplierInvoice = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: formData.invoiceNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      purchaseOrderId: formData.purchaseOrderId || undefined,
      amount: formData.amount,
      status: 'pending',
      issueDate: new Date(formData.issueDate),
      dueDate: new Date(formData.dueDate),
      notes: formData.notes || undefined,
    };

    onUpdateInvoices([...invoices, newInvoice]);

    // Crear cuenta por pagar
    const newPayable: PayableAccount = {
      id: Math.random().toString(36).substr(2, 9),
      supplierId: supplier.id,
      supplierName: supplier.name,
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      amount: newInvoice.amount,
      amountPaid: 0,
      balance: newInvoice.amount,
      status: 'pending',
      dueDate: newInvoice.dueDate,
      notes: newInvoice.notes,
      paymentHistory: [],
    };

    onCreatePayable(newPayable);

    toast.success(`Factura ${formData.invoiceNumber} registrada`);
    handleCloseModal();
  };

  const handleMarkPaid = (invoice: SupplierInvoice) => {
    const updated = invoices.map(inv =>
      inv.id === invoice.id
        ? { ...inv, status: 'paid' as InvoiceStatus, paidDate: new Date() }
        : inv
    );
    onUpdateInvoices(updated);
    toast.success(`Factura ${invoice.invoiceNumber} marcada como pagada`);
  };

  const getStatusBadge = (status: InvoiceStatus, dueDate: Date) => {
    const isOverdue = status === 'pending' && new Date() > dueDate;
    
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          Vencida
        </span>
      );
    }

    const badges = {
      pending: { label: 'Pendiente', bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
      paid: { label: 'Pagada', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      overdue: { label: 'Vencida', bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
    };
    
    const badge = badges[status];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const days = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const receivedOrders = purchaseOrders.filter(o => o.status === 'received');

  // Componente de Card de Factura
  const InvoiceCard = ({ invoice }: { invoice: SupplierInvoice }) => {
    const daysUntilDue = getDaysUntilDue(invoice.dueDate);
    const isOverdue = invoice.status === 'pending' && daysUntilDue < 0;

    return (
      <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
        isOverdue ? 'border-red-300' : 'border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{invoice.invoiceNumber}</h3>
              <p className="text-sm text-gray-600 mt-1">{invoice.supplierName}</p>
            </div>
            {getStatusBadge(invoice.status, invoice.dueDate)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Monto */}
          <div className="bg-[#EC0000]/10 rounded-lg p-3">
            <div className="text-xs text-[#EC0000] font-bold uppercase mb-1">Monto</div>
            <div className="text-2xl font-bold text-[#EC0000]">{formatCurrency(invoice.amount)}</div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs text-blue-600 font-bold mb-1">Emisión</div>
              <div className="text-sm font-bold text-blue-900">{formatDate(invoice.issueDate)}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-2">
              <div className="text-xs text-orange-600 font-bold mb-1">Vencimiento</div>
              <div className="text-sm font-bold text-orange-900">{formatDate(invoice.dueDate)}</div>
            </div>
          </div>

          {/* Días para vencimiento */}
          {invoice.status === 'pending' && (
            <div className={`rounded-lg p-3 ${
              daysUntilDue < 0 
                ? 'bg-red-50 border border-red-200' 
                : daysUntilDue <= 7 
                ? 'bg-orange-50 border border-orange-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className={`text-sm font-bold ${
                daysUntilDue < 0 
                  ? 'text-red-600' 
                  : daysUntilDue <= 7 
                  ? 'text-orange-600' 
                  : 'text-gray-600'
              }`}>
                {daysUntilDue < 0 
                  ? `Vencida hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) > 1 ? 's' : ''}`
                  : `Vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}`
                }
              </p>
            </div>
          )}

          {/* Notas */}
          {invoice.notes && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="text-xs text-yellow-700 font-bold uppercase mb-1">Notas</div>
              <div className="text-sm text-yellow-900">{invoice.notes}</div>
            </div>
          )}

          {/* Botón marcar como pagada */}
          {invoice.status === 'pending' && (
            <button
              onClick={() => handleMarkPaid(invoice)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              Marcar como Pagada
            </button>
          )}

          {/* Fecha de pago */}
          {invoice.status === 'paid' && invoice.paidDate && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-sm text-green-600 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Pagada el {formatDate(invoice.paidDate)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b border-gray-200">
        {/* Controles */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-gray-600 font-medium">
            {filteredInvoices.length} de {invoices.length} facturas
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle vista - Solo desktop */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#EC0000] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#EC0000] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Factura</span>
            </button>
          </div>
        </div>

        {/* Filtros compactos */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar factura o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white min-w-[140px]"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagada</option>
            <option value="overdue">Vencida</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredInvoices.length > 0 ? (
          <>
            {/* Vista de Cards - Móvil/Tablet o seleccionada en Desktop */}
            <div className={`${viewMode === 'table' ? 'hidden lg:hidden' : 'block'} ${viewMode === 'grid' && 'lg:block'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredInvoices.map(invoice => (
                  <InvoiceCard key={invoice.id} invoice={invoice} />
                ))}
              </div>
            </div>

            {/* Vista de Tabla - Solo Desktop cuando está seleccionada */}
            {viewMode === 'table' && (
              <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Factura</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Proveedor</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Monto</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Emisión</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Vencimiento</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Estado</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInvoices.map(invoice => {
                        const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                        const isOverdue = invoice.status === 'pending' && daysUntilDue < 0;

                        return (
                          <tr key={invoice.id} className={`transition-colors ${isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{invoice.supplierName}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-bold text-[#EC0000]">{formatCurrency(invoice.amount)}</span>
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-gray-600">
                              {formatDate(invoice.issueDate)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="text-sm text-gray-600">{formatDate(invoice.dueDate)}</div>
                              {invoice.status === 'pending' && (
                                <div className={`text-xs font-bold mt-1 ${
                                  daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-orange-600' : 'text-gray-500'
                                }`}>
                                  {daysUntilDue < 0 
                                    ? `Vencida (${Math.abs(daysUntilDue)}d)`
                                    : `${daysUntilDue} días`
                                  }
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {getStatusBadge(invoice.status, invoice.dueDate)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {invoice.status === 'pending' && (
                                <button
                                  onClick={() => handleMarkPaid(invoice)}
                                  className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                                  title="Marcar como pagada"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {invoice.status === 'paid' && invoice.paidDate && (
                                <span className="text-xs text-green-600">
                                  {formatDate(invoice.paidDate)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay facturas registradas</h3>
            <p className="text-gray-600 mb-6">Registra las facturas de tus proveedores</p>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30"
            >
              <Plus className="w-5 h-5" />
              Nueva Factura
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between sticky top-0">
              <h3 className="text-2xl font-bold">Nueva Factura de Proveedor</h3>
              <button onClick={handleCloseModal} className="p-2.5 hover:bg-white/15 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Número de Factura *
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                    placeholder="Ej: A-123456"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {suppliers.filter(s => s.active).map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Orden de Compra (Opcional)
                  </label>
                  <select
                    value={formData.purchaseOrderId}
                    onChange={(e) => handleOrderChange(e.target.value)}
                    disabled={!formData.supplierId}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Sin orden de compra</option>
                    {receivedOrders
                      .filter(o => o.supplierId === formData.supplierId)
                      .map(order => (
                        <option key={order.id} value={order.id}>
                          {order.orderNumber} - {formatCurrency(order.total)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Monto *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium text-lg"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium resize-none"
                    placeholder="Notas sobre la factura..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveInvoice}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  Guardar Factura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
