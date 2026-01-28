import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Building2, Mail, Phone, FileText, AlertCircle, Calendar, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { purchaseService } from '@/services';
import type { Supplier, Product } from '@/types/pos';

interface SuppliersTabProps {
  suppliers: Supplier[];
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export function SuppliersTab({ suppliers, onUpdateSuppliers, products, onUpdateProducts }: SuppliersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: 0,
    visitDays: [],
    notes: '',
    status: 'active',
  });

  // Asegurar que suppliers siempre sea un array
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  const filteredSuppliers = safeSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.taxId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        paymentTerms: 0,
        visitDays: [],
        notes: '',
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }
    if (!formData.contactName?.trim()) {
      toast.error('El nombre del contacto es obligatorio');
      return;
    }
    if (!formData.email?.trim()) {
      toast.error('El email es obligatorio');
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error('El teléfono es obligatorio');
      return;
    }
    if (!formData.taxId?.trim()) {
      toast.error('El RFC/NIT es obligatorio');
      return;
    }

    try {
      if (editingSupplier) {
        // Actualizar - Solo enviar campos editables
        const updateData = {
          name: formData.name,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address || '',
          taxId: formData.taxId,
          paymentTerms: formData.paymentTerms || 0,
          visitDays: formData.visitDays || [],
          notes: formData.notes || '',
          status: formData.status || 'active',
        };
        
        const savedSupplier = await purchaseService.updateSupplier(editingSupplier.id, updateData);
        
        const updated = safeSuppliers.map(s => 
          s.id === editingSupplier.id ? savedSupplier : s
        );
        onUpdateSuppliers(updated);
        toast.success('Proveedor actualizado correctamente');
      } else {
        // Crear nuevo - NO enviar id ni createdAt, MongoDB los genera
        const newSupplierData = {
          name: formData.name,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address || '',
          taxId: formData.taxId,
          paymentTerms: formData.paymentTerms || 0,
          visitDays: formData.visitDays || [],
          notes: formData.notes || '',
          status: formData.status || 'active',
        };
        
        const savedSupplier = await purchaseService.createSupplier(newSupplierData);
        
        onUpdateSuppliers([...safeSuppliers, savedSupplier]);
        toast.success('Proveedor creado correctamente');
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      toast.error('Error al guardar el proveedor');
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`¿Eliminar el proveedor "${supplier.name}"?`)) {
      try {
        await purchaseService.deleteSupplier(supplier.id);
        
        onUpdateSuppliers(safeSuppliers.filter(s => s.id !== supplier.id));
        
        // Remover la asociación de productos
        const updatedProducts = products.map(p => 
          p.supplierId === supplier.id ? { ...p, supplierId: undefined } : p
        );
        onUpdateProducts(updatedProducts);
        
        toast.success('Proveedor eliminado');
      } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        toast.error('Error al eliminar el proveedor');
      }
    }
  };

  const getProductCount = (supplierId: string) => {
    return products.filter(p => p.supplierId === supplierId).length;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedor por nombre, contacto o RFC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Lista de proveedores */}
      <div className="flex-1 overflow-auto p-4">
        {filteredSuppliers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSuppliers.map(supplier => (
              <div
                key={supplier.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-[#EC0000] hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Header con gradiente corporativo */}
                <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] p-5 relative overflow-hidden">
                  {/* Patrón decorativo */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                  </div>
                  
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl flex-shrink-0 group-hover:bg-white/30 transition-colors">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate drop-shadow-sm">{supplier.name}</h3>
                        <p className="text-sm text-white/90 truncate mt-0.5">{supplier.contactName}</p>
                      </div>
                    </div>
                    
                    {/* Badge de estado */}
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                        supplier.status === 'active'
                          ? 'bg-green-500/90 text-white'
                          : 'bg-gray-500/90 text-white'
                      }`}>
                        {supplier.status === 'active' ? '● Activo' : '○ Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Info de contacto */}
                  <div className="space-y-3 mb-4">
                    {/* Email - Línea completa */}
                    <div className="flex items-center gap-3 bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                      <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-bold uppercase mb-0.5">Email</p>
                        <p className="text-sm text-gray-900 font-medium truncate">{supplier.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(supplier.email);
                          toast.success('📧 Email copiado al portapapeles');
                        }}
                        className="flex-shrink-0 p-2 hover:bg-blue-200 rounded-lg text-blue-600 transition-all active:scale-95"
                        title="Copiar email"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Teléfono y RFC - Dos columnas (Oculto en móvil) */}
                    <div className="hidden md:grid grid-cols-2 gap-3">
                      {/* Teléfono */}
                      <div className="flex items-center gap-2 bg-green-50/50 rounded-xl p-3 border border-green-100">
                        <div className="flex-shrink-0 w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-green-600 font-bold uppercase mb-0.5">Teléfono</p>
                          <p className="text-sm text-gray-900 font-bold truncate">{supplier.phone}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(supplier.phone);
                            toast.success('📞 Teléfono copiado al portapapeles');
                          }}
                          className="flex-shrink-0 p-1.5 hover:bg-green-200 rounded-lg text-green-600 transition-all active:scale-95"
                          title="Copiar teléfono"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* RFC */}
                      <div className="flex items-center gap-2 bg-orange-50/50 rounded-xl p-3 border border-orange-100">
                        <div className="flex-shrink-0 w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-orange-600 font-bold uppercase mb-0.5">RFC</p>
                          <p className="text-sm text-gray-900 font-mono font-bold truncate">{supplier.taxId}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(supplier.taxId);
                            toast.success('📄 RFC copiado al portapapeles');
                          }}
                          className="flex-shrink-0 p-1.5 hover:bg-orange-200 rounded-lg text-orange-600 transition-all active:scale-95"
                          title="Copiar RFC"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Días de visita */}
                  {supplier.visitDays && supplier.visitDays.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-xs text-gray-600 font-bold uppercase">Días de visita</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {supplier.visitDays.map(day => (
                          <span
                            key={day}
                            className="inline-flex items-center px-2.5 py-1 bg-[#EC0000] text-white rounded-lg text-xs font-bold shadow-sm"
                          >
                            {day.substring(0, 3).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer con botones de acción */}
                  <div className="pt-4 border-t-2 border-gray-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(supplier)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/30"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-bold transition-all active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Building2 className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay proveedores</h3>
            <p className="text-gray-600 mb-6">Comienza agregando tu primer proveedor</p>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30"
            >
              <Plus className="w-5 h-5" />
              Nuevo Proveedor
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between sticky top-0">
              <h3 className="text-2xl font-bold">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2.5 hover:bg-white/15 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              {/* Grid de 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUMNA DERECHA */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nombre del Proveedor *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                      placeholder="Ej: Distribuidora La Providencia S.A."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nombre del Contacto *
                    </label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      RFC / NIT *
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium font-mono"
                      placeholder="Ej: ABC123456XYZ"
                    />
                  </div>

                  {/* Email y Teléfono en una fila */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                        placeholder="contacto@proveedor.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Términos de Pago (días)
                    </label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                    >
                      <option value={0}>Contado</option>
                      <option value={7}>7 días</option>
                      <option value={15}>15 días</option>
                      <option value={30}>30 días</option>
                      <option value={45}>45 días</option>
                      <option value={60}>60 días</option>
                      <option value={90}>90 días</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Estado
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status === 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#EC0000]"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {formData.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Días que pasa el proveedor
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => {
                        const isSelected = formData.visitDays?.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const currentDays = formData.visitDays || [];
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  visitDays: currentDays.filter(d => d !== day)
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  visitDays: [...currentDays, day]
                                });
                              }
                            }}
                            className={`px-2 py-2 rounded-lg font-bold text-xs transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {day.substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Selecciona los días de la semana en que visita este proveedor
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Notas
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium resize-none"
                      placeholder="Información adicional sobre el proveedor..."
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6 mt-6 border-t">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  {editingSupplier ? 'Actualizar' : 'Crear'} Proveedor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
