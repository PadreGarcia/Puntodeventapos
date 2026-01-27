import { useState } from 'react';
import { Calculator, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CashRegister, CashMovement, Sale, CashCount, CashDenomination } from '@/types/pos';

interface CashCountTabProps {
  register: CashRegister;
  movements: CashMovement[];
  sales: Sale[];
  onSaveCount: (count: CashCount) => void;
}

const DENOMINATIONS = [
  { value: 1000, label: '$1,000' },
  { value: 500, label: '$500' },
  { value: 200, label: '$200' },
  { value: 100, label: '$100' },
  { value: 50, label: '$50' },
  { value: 20, label: '$20' },
  { value: 10, label: '$10' },
  { value: 5, label: '$5' },
  { value: 2, label: '$2' },
  { value: 1, label: '$1' },
  { value: 0.5, label: '$0.50' },
];

export function CashCountTab({ register, movements, sales, onSaveCount }: CashCountTabProps) {
  const [denominations, setDenominations] = useState<Record<number, number>>(
    Object.fromEntries(DENOMINATIONS.map(d => [d.value, 0]))
  );
  const [notes, setNotes] = useState('');

  const totalCounted = DENOMINATIONS.reduce(
    (sum, denom) => sum + (denom.value * (denominations[denom.value] || 0)),
    0
  );

  // Calculate expected amount
  const salesCash = sales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0);

  const totalIncome = movements
    .filter(m => m.type === 'income')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalWithdrawals = movements
    .filter(m => m.type === 'withdrawal')
    .reduce((sum, m) => sum + m.amount, 0);

  const expectedAmount = register.openingBalance + salesCash + totalIncome - totalWithdrawals;
  const difference = totalCounted - expectedAmount;

  const handleSaveCount = () => {
    if (totalCounted === 0) {
      toast.error('Realiza el conteo de efectivo');
      return;
    }

    const denominationsList: CashDenomination[] = DENOMINATIONS
      .filter(d => (denominations[d.value] || 0) > 0)
      .map(d => ({
        value: d.value,
        quantity: denominations[d.value] || 0,
        total: d.value * (denominations[d.value] || 0)
      }));

    const count: CashCount = {
      id: `count-${Date.now()}`,
      shiftId: register.id,
      countedBy: register.openedBy,
      countedAt: new Date(),
      denominations: denominationsList,
      totalCounted,
      expectedAmount,
      difference,
      notes: notes.trim() || undefined
    };

    onSaveCount(count);
    toast.success('Arqueo guardado exitosamente');

    // Reset form
    setDenominations(Object.fromEntries(DENOMINATIONS.map(d => [d.value, 0])));
    setNotes('');
  };

  const getDifferenceStatus = () => {
    if (difference === 0) {
      return { icon: CheckCircle, color: 'green', text: 'Cuadrado' };
    } else if (difference > 0) {
      return { icon: AlertTriangle, color: 'blue', text: 'Sobrante' };
    } else {
      return { icon: AlertTriangle, color: 'red', text: 'Faltante' };
    }
  };

  const status = getDifferenceStatus();
  const StatusIcon = status.icon;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4">
            <div className="text-sm font-bold text-gray-600 mb-1">Fondo Inicial</div>
            <div className="text-xl font-bold text-gray-900">
              ${register.openingBalance.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4">
            <div className="text-sm font-bold text-gray-600 mb-1">Ventas Efectivo</div>
            <div className="text-xl font-bold text-green-600">
              +${salesCash.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4">
            <div className="text-sm font-bold text-gray-600 mb-1">Movimientos Netos</div>
            <div className={`text-xl font-bold ${
              (totalIncome - totalWithdrawals) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(totalIncome - totalWithdrawals) >= 0 ? '+' : ''}${(totalIncome - totalWithdrawals).toFixed(2)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-md p-4 text-white">
            <div className="text-sm font-bold mb-1 opacity-90">Total Esperado</div>
            <div className="text-xl font-bold">
              ${expectedAmount.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Counting Form */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
            <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#EC0000]" />
                Conteo de Efectivo
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                {DENOMINATIONS.map(denom => (
                  <div key={denom.value} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3">
                    <div className="text-center mb-2">
                      <span className="text-base font-bold text-gray-900">{denom.label}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={denominations[denom.value] || 0}
                      onChange={(e) => setDenominations({
                        ...denominations,
                        [denom.value]: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-center font-bold focus:border-[#EC0000] focus:outline-none"
                      placeholder="0"
                    />
                    <div className="text-center mt-2 text-sm font-bold text-gray-600">
                      = ${((denominations[denom.value] || 0) * denom.value).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notas del Arqueo
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones sobre el conteo..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium resize-none"
                />
              </div>

              <button
                onClick={handleSaveCount}
                disabled={totalCounted === 0}
                className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-3 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Guardar Arqueo
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Total Counted */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-600">Total Contado</div>
                  <div className="text-3xl font-bold text-gray-900">
                    ${totalCounted.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Difference */}
            <div className={`bg-white rounded-2xl shadow-xl border-2 border-${status.color}-200 p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`bg-${status.color}-100 p-2 rounded-lg`}>
                  <StatusIcon className={`w-6 h-6 text-${status.color}-600`} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-600">Diferencia</div>
                  <div className={`text-3xl font-bold text-${status.color}-600`}>
                    {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className={`p-4 bg-${status.color}-50 rounded-xl border-2 border-${status.color}-200`}>
                <div className="flex items-center gap-2 mb-2">
                  <StatusIcon className={`w-5 h-5 text-${status.color}-600`} />
                  <span className={`font-bold text-${status.color}-900`}>{status.text}</span>
                </div>
                <p className={`text-sm text-${status.color}-800`}>
                  {difference === 0 && 'El efectivo contado coincide perfectamente con lo esperado.'}
                  {difference > 0 && `Hay un sobrante de $${difference.toFixed(2)}. Verifica el conteo y las ventas.`}
                  {difference < 0 && `Hay un faltante de $${Math.abs(difference).toFixed(2)}. Revisa el conteo y los movimientos.`}
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Desglose</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Fondo Inicial</span>
                  <span className="font-bold text-gray-900">${register.openingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Ventas en Efectivo</span>
                  <span className="font-bold text-green-600">+${salesCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Ingresos Extra</span>
                  <span className="font-bold text-green-600">+${totalIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Retiros</span>
                  <span className="font-bold text-red-600">-${totalWithdrawals.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                  <span className="font-bold text-gray-900">Total Esperado</span>
                  <span className="text-lg font-bold text-[#EC0000]">${expectedAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
