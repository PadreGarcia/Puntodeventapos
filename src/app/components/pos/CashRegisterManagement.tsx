import { useState } from 'react';
import { Wallet, DollarSign, TrendingUp, TrendingDown, Calculator, Clock } from 'lucide-react';
import { CashOpeningTab } from '@/app/components/pos/cash/CashOpeningTab';
import { CashClosingTab } from '@/app/components/pos/cash/CashClosingTab';
import { CashMovementsTab } from '@/app/components/pos/cash/CashMovementsTab';
import { CashCountTab } from '@/app/components/pos/cash/CashCountTab';
import { ShiftsTab } from '@/app/components/pos/cash/ShiftsTab';
import type { 
  CashRegister, 
  CashMovement, 
  CashCount, 
  ShiftSummary,
  Sale,
  User
} from '@/types/pos';
import { hasPermission, MODULES } from '@/utils/permissions';

interface CashRegisterManagementProps {
  sales: Sale[];
  onSaveShift?: (shift: ShiftSummary) => void;
  currentUser?: User | null;
}

type TabType = 'opening' | 'movements' | 'count' | 'closing' | 'shifts';

export function CashRegisterManagement({ sales, onSaveShift, currentUser }: CashRegisterManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('opening');
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [counts, setCounts] = useState<CashCount[]>([]);
  const [shifts, setShifts] = useState<ShiftSummary[]>([]);

  const isRegisterOpen = currentRegister?.status === 'open';
  
  // Permisos
  const canManageCash = hasPermission(currentUser, MODULES.CASH, 'create');
  const canEditCash = hasPermission(currentUser, MODULES.CASH, 'edit');

  const tabs = [
    { 
      id: 'opening' as TabType, 
      label: 'Apertura de Caja', 
      icon: DollarSign,
      disabled: isRegisterOpen
    },
    { 
      id: 'movements' as TabType, 
      label: 'Retiros/Ingresos', 
      icon: TrendingUp,
      count: movements.length,
      disabled: !isRegisterOpen
    },
    { 
      id: 'count' as TabType, 
      label: 'Arqueo', 
      icon: Calculator,
      disabled: !isRegisterOpen
    },
    { 
      id: 'closing' as TabType, 
      label: 'Corte de Caja', 
      icon: TrendingDown,
      disabled: !isRegisterOpen
    },
    { 
      id: 'shifts' as TabType, 
      label: 'Historial de Turnos', 
      icon: Clock,
      count: shifts.length,
      disabled: false
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-40">
        <div className="px-4 pt-2 pb-3">
          <div className="flex items-center justify-between mb-4">

            {/* Status Indicator */}
            {currentRegister && (
              <div className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ${
                isRegisterOpen
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isRegisterOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
                {isRegisterOpen ? 'Caja Abierta' : 'Caja Cerrada'}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = tab.disabled;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                      : isDisabled
                      ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'opening' && (
          <CashOpeningTab
            currentRegister={currentRegister}
            onOpenRegister={setCurrentRegister}
          />
        )}

        {activeTab === 'movements' && currentRegister && (
          <CashMovementsTab
            register={currentRegister}
            movements={movements}
            onUpdateMovements={setMovements}
          />
        )}

        {activeTab === 'count' && currentRegister && (
          <CashCountTab
            register={currentRegister}
            movements={movements}
            sales={sales.filter(s => s.timestamp >= currentRegister.openedAt)}
            onSaveCount={(count) => setCounts([...counts, count])}
          />
        )}

        {activeTab === 'closing' && currentRegister && (
          <CashClosingTab
            register={currentRegister}
            movements={movements}
            sales={sales.filter(s => s.timestamp >= currentRegister.openedAt)}
            lastCount={counts[counts.length - 1]}
            onCloseRegister={(summary) => {
              setShifts([summary, ...shifts]);
              onSaveShift?.(summary); // Notify parent component
              setCurrentRegister(null);
              setMovements([]);
              setCounts([]);
              setActiveTab('opening');
            }}
          />
        )}

        {activeTab === 'shifts' && (
          <ShiftsTab
            shifts={shifts}
          />
        )}
      </div>
    </div>
  );
}
