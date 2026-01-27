import { useState } from 'react';
import { Plus, Tag, Copy, Clock, Lock, CheckCircle, Pause } from 'lucide-react';
import { toast } from 'sonner';
import type { Coupon, Product, Customer } from '@/types/pos';

interface CouponsTabProps {
  coupons: Coupon[];
  products: Product[];
  customers: Customer[];
  onUpdateCoupons: (coupons: Coupon[]) => void;
}

export function CouponsTab({ coupons, products, customers, onUpdateCoupons }: CouponsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    description: '',
    minPurchase: '',
    maxUsage: '',
    endDate: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.value) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    if (coupons.some(c => c.code === formData.code.trim().toUpperCase())) {
      toast.error('Este código ya existe');
      return;
    }

    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      type: formData.type,
      value: parseFloat(formData.value),
      description: formData.description.trim(),
      minPurchaseAmount: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
      maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
      currentUsage: 0,
      usageHistory: [],
      startDate: new Date(),
      endDate: formData.endDate ? new Date(formData.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'active',
      createdAt: new Date(),
      createdBy: 'Admin'
    };

    onUpdateCoupons([newCoupon, ...coupons]);
    toast.success('Cupón creado');
    setFormData({ code: '', type: 'percentage', value: '', description: '', minPurchase: '', maxUsage: '', endDate: '' });
    setShowForm(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado');
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="text-sm font-bold text-gray-600 mb-1">Total Cupones</div>
            <div className="text-3xl font-bold text-gray-900">{coupons.length}</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-lg border-2 border-green-200 p-6">
            <div className="text-sm font-bold text-green-700 mb-1">Activos</div>
            <div className="text-3xl font-bold text-green-600">
              {coupons.filter(c => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <div className="text-sm font-bold text-blue-700 mb-1">Usos Totales</div>
            <div className="text-3xl font-bold text-blue-600">
              {coupons.reduce((sum, c) => sum + c.currentUsage, 0)}
            </div>
          </div>
        </div>

        {/* Create Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Crear Nuevo Cupón
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nuevo Cupón</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Código del Cupón *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VERANO2026"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Descuento</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Valor del Descuento *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? '15' : '50.00'}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Compra Mínima</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Usos Máximos</label>
                  <input
                    type="number"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                    placeholder="Ilimitado"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Expiración</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descuento especial de verano"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-3 rounded-xl font-bold"
                >
                  Crear Cupón
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => {
            const isExpired = coupon.endDate < new Date();
            const isMaxedOut = coupon.maxUsage && coupon.currentUsage >= coupon.maxUsage;

            return (
              <div
                key={coupon.id}
                className={`rounded-2xl shadow-lg p-6 border-2 ${
                  coupon.status === 'active' && !isExpired && !isMaxedOut
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <Tag className="w-8 h-8" />
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    coupon.status === 'active' && !isExpired && !isMaxedOut
                      ? 'bg-white/20'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isExpired ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Expirado
                      </span>
                    ) : isMaxedOut ? (
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Agotado
                      </span>
                    ) : coupon.status === 'active' ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Pause className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-bold opacity-75 mb-1">CÓDIGO</div>
                  <div className="text-2xl font-bold mb-2 flex items-center gap-2">
                    {coupon.code}
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm opacity-90">{coupon.description}</div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-bold opacity-75 mb-1">DESCUENTO</div>
                    <div className="text-xl font-bold">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold opacity-75 mb-1">USOS</div>
                    <div className="text-xl font-bold">
                      {coupon.currentUsage}{coupon.maxUsage ? `/${coupon.maxUsage}` : ''}
                    </div>
                  </div>
                </div>

                {coupon.minPurchaseAmount && (
                  <div className={`text-xs font-medium ${
                    coupon.status === 'active' && !isExpired && !isMaxedOut ? 'opacity-90' : ''
                  }`}>
                    Compra mínima: ${coupon.minPurchaseAmount.toFixed(2)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
