import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Award, CreditCard, Wifi, Ban, CheckCircle, XCircle, Phone, Mail, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { Customer, NFCCard, User } from '@/types/pos';
import { hasPermission, MODULES } from '@/utils/permissions';

interface CustomersListTabProps {
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
  onViewDetail: (customer: Customer) => void;
  nfcCards: NFCCard[];
  currentUser?: User | null;
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  silver: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  platinum: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  diamond: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
};

export function CustomersListTab({ customers, onUpdateCustomers, onViewDetail, nfcCards, currentUser }: CustomersListTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    creditLimit: '0',
    notes: ''
  });
  
  // Permisos
  const canCreate = hasPermission(currentUser, MODULES.CUSTOMERS, 'create');
  const canEdit = hasPermission(currentUser, MODULES.CUSTOMERS, 'edit');
  const canDelete = hasPermission(currentUser, MODULES.CUSTOMERS, 'delete');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar permisos
    if (editingCustomer && !canEdit) {
      toast.error('No tienes permisos para editar clientes', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    if (!editingCustomer && !canCreate) {
      toast.error('No tienes permisos para crear clientes', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        notes: formData.notes.trim() || undefined
      };
      onUpdateCustomers(customers.map(c => c.id === updated.id ? updated : c));
      toast.success('Cliente actualizado');
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        loyaltyPoints: 0,
        loyaltyTier: 'bronze',
        creditLimit: parseFloat(formData.creditLimit) || 0,
        currentCredit: 0,
        totalPurchases: 0,
        lastPurchase: new Date(),
        totalSpent: 0,
        purchaseCount: 0,
        status: 'active',
        registeredAt: new Date(),
        notes: formData.notes.trim() || undefined
      };
      onUpdateCustomers([newCustomer, ...customers]);
      toast.success('Cliente registrado');
    }

    setFormData({ name: '', email: '', phone: '', address: '', creditLimit: '0', notes: '' });
    setEditingCustomer(null);
    setShowForm(false);
  };

  const handleEdit = (customer: Customer) => {
    // Validar permisos
    if (!canEdit) {
      toast.error('No tienes permisos para editar clientes', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      creditLimit: customer.creditLimit.toString(),
      notes: customer.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    // Validar permisos
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar clientes', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    const customer = customers.find(c => c.id === id);
    
    if (confirm(`¿Eliminar al cliente "${customer?.name}"? Esta acción no se puede deshacer.`)) {
      onUpdateCustomers(customers.filter(c => c.id !== id));
      toast.success(`Cliente "${customer?.name}" eliminado correctamente`);
    }
  };

  const handleToggleStatus = (customer: Customer) => {
    const newStatus = customer.status === 'active' ? 'blocked' : 'active';
    onUpdateCustomers(customers.map(c => 
      c.id === customer.id ? { ...c, status: newStatus } : c
    ));
    toast.success(`Cliente ${newStatus === 'active' ? 'activado' : 'bloqueado'}`);
  };

  const activeCount = customers.filter(c => c.status === 'active').length;
  const withNFC = customers.filter(c => c.nfcCardId).length;
  const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4">
            <div className="text-sm font-bold text-gray-600 mb-1">Total Clientes</div>
            <div className="text-3xl font-bold text-gray-900">{customers.length}</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-lg border-2 border-green-200 p-4">
            <div className="text-sm font-bold text-green-700 mb-1">Activos</div>
            <div className="text-3xl font-bold text-green-600">{activeCount}</div>
          </div>
          <div className="bg-purple-50 rounded-xl shadow-lg border-2 border-purple-200 p-4">
            <div className="text-sm font-bold text-purple-700 mb-1">Con Tarjeta NFC</div>
            <div className="text-3xl font-bold text-purple-600">{withNFC}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-lg border-2 border-yellow-200 p-4">
            <div className="text-sm font-bold text-yellow-700 mb-1">Puntos Totales</div>
            <div className="text-3xl font-bold text-yellow-600">{totalPoints.toLocaleString()}</div>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
            />
          </div>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ name: '', email: '', phone: '', address: '', creditLimit: '0', notes: '' });
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    placeholder="juan@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    placeholder="555-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Límite de Crédito</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  placeholder="Calle #123, Colonia, Ciudad"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  {editingCustomer ? 'Actualizar' : 'Registrar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCustomer(null);
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Clientes ({filteredCustomers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Puntos</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Crédito Disponible</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500 font-medium">
                      No se encontraron clientes
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(customer => {
                    const tierColors = TIER_COLORS[customer.loyaltyTier] || TIER_COLORS.bronze;
                    const availableCredit = customer.creditLimit - customer.currentCredit;
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            {/* Avatar con iniciales */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${tierColors.bg.replace('100', '500')}`}>
                              {customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              {/* Nombre con badges */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900">{customer.name}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${tierColors.bg} ${tierColors.text}`}>
                                  <Award className="w-3 h-3" />
                                  {customer.loyaltyTier.charAt(0).toUpperCase() + customer.loyaltyTier.slice(1)}
                                </span>
                                {customer.nfcCardId && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700" title="Tiene tarjeta NFC">
                                    <Wifi className="w-3 h-3" />
                                    NFC
                                  </span>
                                )}
                              </div>
                              {/* Contacto en texto pequeño */}
                              <div className="text-xs text-gray-500 space-y-0.5">
                                {customer.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {customer.phone}
                                  </div>
                                )}
                                {customer.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {customer.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-yellow-600 text-lg">{customer.loyaltyPoints.toLocaleString()}</span>
                            <span className="text-xs text-gray-500">pts</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-bold text-lg ${availableCredit > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              ${availableCredit.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500">de ${customer.creditLimit.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                            customer.status === 'active' ? 'bg-green-100 text-green-700' :
                            customer.status === 'blocked' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {customer.status === 'active' ? (
                              <><CheckCircle className="w-3.5 h-3.5" /> Activo</>
                            ) : customer.status === 'blocked' ? (
                              <><XCircle className="w-3.5 h-3.5" /> Bloqueado</>
                            ) : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onViewDetail(customer)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalle completo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(customer)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(customer)}
                              className={`p-2 rounded-lg transition-colors ${
                                customer.status === 'active' 
                                  ? 'text-orange-600 hover:bg-orange-50' 
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={customer.status === 'active' ? 'Bloquear cliente' : 'Activar cliente'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
