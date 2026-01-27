import { useState } from 'react';
import { Award, Plus, Minus, Settings, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Customer, LoyaltyTransaction } from '@/types/pos';

interface LoyaltyProgramTabProps {
  customers: Customer[];
  transactions: LoyaltyTransaction[];
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateTransactions: (transactions: LoyaltyTransaction[]) => void;
}

const LOYALTY_TIERS = [
  { name: 'bronze' as const, minPoints: 0, multiplier: 1, color: 'amber', benefits: ['1 punto por $1 gastado'] },
  { name: 'silver' as const, minPoints: 1000, multiplier: 1.5, color: 'gray', benefits: ['1.5 puntos por $1', '5% descuento'] },
  { name: 'gold' as const, minPoints: 5000, multiplier: 2, color: 'yellow', benefits: ['2 puntos por $1', '10% descuento', 'Envío gratis'] },
  { name: 'platinum' as const, minPoints: 10000, multiplier: 2.5, color: 'purple', benefits: ['2.5 puntos por $1', '15% descuento', 'Acceso VIP'] },
];

export function LoyaltyProgramTab({ customers, transactions, onUpdateCustomers, onUpdateTransactions }: LoyaltyProgramTabProps) {
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    customerId: '',
    points: '',
    reason: '',
    type: 'earn' as 'earn' | 'redeem'
  });

  const handleAdjustment = (e: React.FormEvent) => {
    e.preventDefault();

    const customer = customers.find(c => c.id === adjustmentData.customerId);
    if (!customer) {
      toast.error('Selecciona un cliente');
      return;
    }

    const points = parseInt(adjustmentData.points);
    if (isNaN(points) || points <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    const transaction: LoyaltyTransaction = {
      id: `loy-${Date.now()}`,
      customerId: customer.id,
      type: adjustmentData.type,
      points: adjustmentData.type === 'earn' ? points : -points,
      reason: adjustmentData.reason.trim(),
      timestamp: new Date(),
      performedBy: 'Admin'
    };

    const newPoints = customer.loyaltyPoints + transaction.points;
    if (newPoints < 0) {
      toast.error('El cliente no tiene suficientes puntos');
      return;
    }

    const newTier = LOYALTY_TIERS.reverse().find(t => newPoints >= t.minPoints)?.name || 'bronze';
    LOYALTY_TIERS.reverse(); // Restore order

    onUpdateCustomers(customers.map(c => 
      c.id === customer.id ? { ...c, loyaltyPoints: newPoints, loyaltyTier: newTier } : c
    ));
    onUpdateTransactions([transaction, ...transactions]);

    toast.success(`${adjustmentData.type === 'earn' ? 'Puntos agregados' : 'Puntos canjeados'}`);
    setAdjustmentData({ customerId: '', points: '', reason: '', type: 'earn' });
    setShowAdjustment(false);
  };

  const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm font-bold opacity-90 mb-1">Puntos Totales</div>
            <div className="text-3xl font-bold">{totalPoints.toLocaleString()}</div>
          </div>
          {LOYALTY_TIERS.slice(1).map((tier, index) => {
            const count = customers.filter(c => c.loyaltyTier === tier.name).length;
            return (
              <div key={tier.name} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
                <div className="text-sm font-bold text-gray-600 mb-1">{tier.name.toUpperCase()}</div>
                <div className="text-3xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500 mt-1">Clientes</div>
              </div>
            );
          })}
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {LOYALTY_TIERS.map(tier => (
            <div key={tier.name} className={`bg-${tier.color}-50 border-2 border-${tier.color}-200 rounded-xl p-6`}>
              <div className="flex items-center gap-2 mb-3">
                <Award className={`w-6 h-6 text-${tier.color}-600`} />
                <h3 className={`text-lg font-bold text-${tier.color}-900`}>{tier.name.toUpperCase()}</h3>
              </div>
              <div className={`text-sm font-bold text-${tier.color}-700 mb-2`}>
                Desde {tier.minPoints.toLocaleString()} puntos
              </div>
              <div className={`text-sm text-${tier.color}-800 mb-3`}>
                Multiplicador: {tier.multiplier}x
              </div>
              <ul className="space-y-1">
                {tier.benefits.map((benefit, i) => (
                  <li key={i} className={`text-xs text-${tier.color}-700 flex items-center gap-1`}>
                    <Check className="w-3 h-3" /> {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Adjustment Button */}
        {!showAdjustment && (
          <button
            onClick={() => setShowAdjustment(true)}
            className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Ajustar Puntos Manualmente
          </button>
        )}

        {/* Adjustment Form */}
        {showAdjustment && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajustar Puntos</h3>
            <form onSubmit={handleAdjustment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cliente</label>
                  <select
                    value={adjustmentData.customerId}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, customerId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  >
                    <option value="">Seleccionar...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.loyaltyPoints} pts)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                  <select
                    value={adjustmentData.type}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  >
                    <option value="earn">➕ Agregar Puntos</option>
                    <option value="redeem">➖ Canjear Puntos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cantidad</label>
                  <input
                    type="number"
                    value={adjustmentData.points}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, points: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Motivo</label>
                <input
                  type="text"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-3 rounded-xl font-bold">
                  Aplicar
                </button>
                <button type="button" onClick={() => setShowAdjustment(false)} className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Historial de Transacciones ({transactions.length})</h3>
          </div>
          <div className="p-6">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay transacciones</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 20).map(t => {
                  const customer = customers.find(c => c.id === t.customerId);
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {t.type === 'earn' ? (
                          <Plus className="w-5 h-5 text-green-600" />
                        ) : (
                          <Minus className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-bold text-gray-900">{customer?.name}</div>
                          <div className="text-sm text-gray-600">{t.reason}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${t.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.points >= 0 ? '+' : ''}{t.points} pts
                        </div>
                        <div className="text-xs text-gray-500">{new Date(t.timestamp).toLocaleDateString('es-MX')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
