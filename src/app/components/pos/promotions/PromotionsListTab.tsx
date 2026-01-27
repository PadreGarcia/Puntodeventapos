import { Plus, Edit, Trash2, Play, Pause, Eye, CheckCircle, Clock, Calendar, Ban, BarChart3, DollarSign, Gift, Package, TrendingUp, Tag, Target, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Promotion, Product } from '@/types/pos';

interface PromotionsListTabProps {
  promotions: Promotion[];
  products: Product[];
  onUpdatePromotions: (promotions: Promotion[]) => void;
  onCreateNew: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  percentage_discount: 'Descuento %',
  fixed_discount: 'Descuento Fijo',
  buy_x_get_y: 'Compra X Lleva Y',
  combo: 'Combo',
  volume_discount: 'Descuento Volumen',
  special_price: 'Precio Especial',
};

const TYPE_ICONS: Record<string, any> = {
  percentage_discount: BarChart3,
  fixed_discount: DollarSign,
  buy_x_get_y: Gift,
  combo: Package,
  volume_discount: TrendingUp,
  special_price: Tag,
};

export function PromotionsListTab({ promotions, products, onUpdatePromotions, onCreateNew }: PromotionsListTabProps) {
  const handleToggleStatus = (id: string) => {
    onUpdatePromotions(promotions.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
    toast.success('Promoción actualizada');
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta promoción?')) {
      onUpdatePromotions(promotions.filter(p => p.id !== id));
      toast.success('Promoción eliminada');
    }
  };

  const activeCount = promotions.filter(p => p.status === 'active').length;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm font-bold opacity-90 mb-1">Total Promociones</div>
            <div className="text-3xl font-bold">{promotions.length}</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-lg border-2 border-green-200 p-6">
            <div className="text-sm font-bold text-green-700 mb-1">Activas</div>
            <div className="text-3xl font-bold text-green-600">{activeCount}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="text-sm font-bold text-gray-600 mb-1">Inactivas</div>
            <div className="text-3xl font-bold text-gray-900">{promotions.length - activeCount}</div>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={onCreateNew}
          className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Crear Nueva Promoción
        </button>

        {/* Promotions List */}
        <div className="space-y-4">
          {promotions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-12 text-center">
              <div className="mb-4 flex justify-center">
                <Target className="w-24 h-24 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hay promociones</h3>
              <p className="text-gray-600 font-medium mb-4">Crea tu primera promoción para impulsar las ventas</p>
              <button
                onClick={onCreateNew}
                className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear Promoción
              </button>
            </div>
          ) : (
            promotions.map(promo => {
              const now = new Date();
              const isExpired = promo.endDate < now;
              const isScheduled = promo.startDate > now;

              return (
                <div key={promo.id} className={`bg-white rounded-2xl shadow-lg border-2 p-6 ${
                  promo.status === 'active' ? 'border-green-200' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{promo.name}</h3>
                        {TYPE_ICONS[promo.type] && (() => {
                          const Icon = TYPE_ICONS[promo.type];
                          return <Icon className="w-6 h-6 text-[#EC0000]" />;
                        })()}
                      </div>
                      <p className="text-gray-600 font-medium mb-2">{promo.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-bold inline-flex items-center gap-1">
                          {TYPE_ICONS[promo.type] && (() => {
                            const Icon = TYPE_ICONS[promo.type];
                            return <Icon className="w-3 h-3" />;
                          })()}
                          {TYPE_LABELS[promo.type]}
                        </span>
                        {promo.applyToAll ? (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Todos los productos
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-bold">
                            {promo.productIds.length} productos
                          </span>
                        )}
                        {promo.requiresCoupon && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-bold">
                            🎟️ Cupón: {promo.couponCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        promo.status === 'active' ? 'bg-green-100 text-green-700' :
                        isExpired ? 'bg-red-100 text-red-700' :
                        isScheduled ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {promo.status === 'active' ? (
                          <><CheckCircle className="w-4 h-4 inline" /> Activa</>
                        ) : isExpired ? (
                          <><Clock className="w-4 h-4 inline" /> Expirada</>
                        ) : isScheduled ? (
                          <><Calendar className="w-4 h-4 inline" /> Programada</>
                        ) : (
                          <><Ban className="w-4 h-4 inline" /> Pausada</>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-gray-600 mb-1">Beneficio</div>
                      <div className="text-lg font-bold text-[#EC0000]">
                        {promo.type === 'buy_x_get_y' ? `${promo.buyQuantity}x${promo.getQuantity}` :
                         promo.type === 'special_price' ? `$${promo.specialPrice}` :
                         promo.discountType === 'percentage' ? `${promo.discountValue}%` :
                         `$${promo.discountValue}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-600 mb-1">Vigencia</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(promo.startDate).toLocaleDateString('es-MX')} - {new Date(promo.endDate).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-600 mb-1">Uso</div>
                      <div className="text-sm font-medium text-gray-900">
                        {promo.currentUsage} veces
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(promo.id)}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                        promo.status === 'active'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {promo.status === 'active' ? (
                        <><Pause className="w-4 h-4 inline mr-1" /> Pausar</>
                      ) : (
                        <><Play className="w-4 h-4 inline mr-1" /> Activar</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors"
                    >
<Trash2 className="w-4 h-4 inline mr-1" /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
