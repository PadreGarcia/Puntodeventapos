import { useState } from 'react';
import { DollarSign, User, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CashRegister, CashDenomination } from '@/types/pos';

interface CashOpeningTabProps {
  currentRegister: CashRegister | null;
  onOpenRegister: (register: CashRegister) => void;
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

export function CashOpeningTab({ currentRegister, onOpenRegister }: CashOpeningTabProps) {
  const [userName, setUserName] = useState('');
  const [denominations, setDenominations] = useState<Record<number, number>>(
    Object.fromEntries(DENOMINATIONS.map(d => [d.value, 0]))
  );

  const totalAmount = DENOMINATIONS.reduce(
    (sum, denom) => sum + (denom.value * (denominations[denom.value] || 0)),
    0
  );

  const handleOpenRegister = () => {
    if (!userName.trim()) {
      toast.error('Por favor ingresa el nombre del cajero');
      return;
    }

    if (totalAmount === 0) {
      toast.error('El monto inicial debe ser mayor a $0');
      return;
    }

    const shiftNumber = `TURNO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    const denominationsList: CashDenomination[] = DENOMINATIONS
      .filter(d => (denominations[d.value] || 0) > 0)
      .map(d => ({
        value: d.value,
        quantity: denominations[d.value] || 0,
        total: d.value * (denominations[d.value] || 0)
      }));

    const newRegister: CashRegister = {
      id: `reg-${Date.now()}`,
      shiftNumber,
      status: 'open',
      openedBy: userName.trim(),
      openedAt: new Date(),
      openingBalance: totalAmount,
      expectedClosingBalance: totalAmount,
      sales: [],
      movements: [],
      denominations: denominationsList,
    };

    onOpenRegister(newRegister);
    toast.success(`Caja abierta exitosamente - ${shiftNumber}`);
  };

  if (currentRegister?.status === 'open') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-2 border-green-200">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Caja Abierta</h3>
          <p className="text-gray-600 font-medium mb-4">
            Turno: <span className="font-bold text-gray-900">{currentRegister.shiftNumber}</span>
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-semibold">Cajero:</span> {currentRegister.openedBy}</p>
            <p><span className="font-semibold">Apertura:</span> {new Date(currentRegister.openedAt).toLocaleString('es-MX')}</p>
            <p><span className="font-semibold">Fondo Inicial:</span> ${currentRegister.openingBalance.toFixed(2)}</p>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              💡 Puedes registrar retiros/ingresos, hacer arqueos y cerrar la caja desde las otras pestañas
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Alert */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Apertura de Caja</h4>
            <p className="text-sm text-blue-800">
              Registra el efectivo inicial con el que comenzarás el turno. Cuenta las denominaciones cuidadosamente.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
          {/* User Info */}
          <div className="p-6 border-b-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#EC0000]" />
              Información del Cajero
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del Cajero *
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fecha y Hora
                </label>
                <div className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-700">
                    {new Date().toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Denominations */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#EC0000]" />
              Conteo de Efectivo Inicial
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {DENOMINATIONS.map(denom => (
                <div key={denom.value} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                  <div className="text-center mb-2">
                    <span className="text-lg font-bold text-gray-900">{denom.label}</span>
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

            {/* Total */}
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total Inicial:</span>
                <span className="text-3xl font-bold">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t-2 border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleOpenRegister}
              disabled={!userName.trim() || totalAmount === 0}
              className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Abrir Caja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
