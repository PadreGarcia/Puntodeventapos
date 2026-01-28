import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Building2, Mail, Phone, MapPin, FileText, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
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

  const filteredSuppliers = suppliers.filter(supplier =>
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

  const handleSave = () => {
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

    if (editingSupplier) {
      // Actualizar
      const updated = suppliers.map(s => 
        s.id === editingSupplier.id ? { ...formData, id: s.id, createdAt: s.createdAt } as Supplier : s
      );
      onUpdateSuppliers(updated);
      toast.success('Proveedor actualizado correctamente');
    } else {
      // Crear nuevo
      const newSupplier: Supplier = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      } as Supplier;
      onUpdateSuppliers([...suppliers, newSupplier]);
      toast.success('Proveedor creado correctamente');
    }

    handleCloseModal();
  };

  const handleDelete = (supplier: Supplier) => {
    if (window.confirm(`¿Eliminar el proveedor "${supplier.name}"?`)) {
      onUpdateSuppliers(suppliers.filter(s => s.id !== supplier.id));
      
      // Remover la asociación de productos
      const updatedProducts = products.map(p => 
        p.supplierId === supplier.id ? { ...p, supplierId: undefined } : p
      );
      onUpdateProducts(updatedProducts);
      
      toast.success('Proveedor eliminado');
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
                className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-[#EC0000] transition-all overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] p-2.5 rounded-lg flex-shrink-0">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg truncate">{supplier.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{supplier.contactName}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenModal(supplier)}
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 truncate">{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">{supplier.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 line-clamp-2">{supplier.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 font-mono">{supplier.taxId}</span>
                  </div>

                  {supplier.visitDays && supplier.visitDays.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs text-gray-500 block mb-1">Días de visita</span>
                        <div className="flex flex-wrap gap-1">
                          {supplier.visitDays.map(day => (
                            <span
                              key={day}
                              className="inline-block px-2 py-0.5 bg-[#EC0000]/10 text-[#EC0000] rounded text-xs font-bold"
                            >
                              {day.substring(0, 3)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block">Términos de pago</span>
                      <span className="font-bold text-gray-900">
                        {supplier.paymentTerms === 0 ? 'Contado' : `${supplier.paymentTerms} días`}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Productos</span>
                      <span className="font-bold text-[#EC0000]">{getProductCount(supplier.id)}</span>
                    </div>
                    <div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        supplier.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
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
