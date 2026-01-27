import { useState } from 'react';
import { Calendar, Clock, DollarSign, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Search, ChevronDown, Banknote, CreditCard, Grid3x3, List } from 'lucide-react';
import type { ShiftSummary } from '@/types/pos';

interface ShiftsTabProps {
  shifts: ShiftSummary[];
}

type ViewMode = 'grid' | 'table';

export function ShiftsTab({ shifts }: ShiftsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredShifts = shifts.filter(shift =>
    shift.shiftNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.openedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.closedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusConfig = (status: ShiftSummary['status']) => {
    switch (status) {
      case 'balanced':
        return {
          icon: CheckCircle,
          label: 'Cuadrado',
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-300'
        };
      case 'overage':
        return {
          icon: AlertCircle,
          label: 'Sobrante',
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-300'
        };
      case 'shortage':
        return {
          icon: AlertCircle,
          label: 'Faltante',
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-300'
        };
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Componente de Card de Turno
  const ShiftCard = ({ shift }: { shift: ShiftSummary }) => {
    const statusConfig = getStatusConfig(shift.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{shift.shiftNumber}</h3>
              <p className="text-sm text-gray-600 mt-1">{shift.openedBy}</p>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Fecha y duración */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-bold uppercase mb-1">Fecha</div>
              <div className="text-sm font-bold text-blue-900">
                {new Date(shift.openedAt).toLocaleDateString('es-MX')}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-purple-600 font-bold uppercase mb-1">Duración</div>
              <div className="text-sm font-bold text-purple-900">{formatDuration(shift.duration)}</div>
            </div>
          </div>

          {/* Ventas totales */}
          <div className="bg-[#EC0000]/10 rounded-lg p-3">
            <div className="text-xs text-[#EC0000] font-bold uppercase mb-1">Total Ventas</div>
            <div className="text-2xl font-bold text-[#EC0000]">{formatCurrency(shift.totalSales)}</div>
            <div className="text-xs text-[#EC0000] mt-1">{shift.salesCount} transacciones</div>
          </div>

          {/* Métodos de pago */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-xs text-green-600 font-bold mb-1">Efectivo</div>
              <div className="text-sm font-bold text-green-900">{formatCurrency(shift.salesCash)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-xs text-blue-600 font-bold mb-1">Tarjeta</div>
              <div className="text-sm font-bold text-blue-900">{formatCurrency(shift.salesCard)}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <div className="text-xs text-purple-600 font-bold mb-1">Transfer</div>
              <div className="text-sm font-bold text-purple-900">{formatCurrency(shift.salesTransfer)}</div>
            </div>
          </div>

          {/* Balance */}
          {shift.difference !== 0 && (
            <div className={`rounded-lg p-3 ${
              shift.difference > 0 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Diferencia:</span>
                <span className={`text-lg font-bold ${
                  shift.difference > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {shift.difference > 0 ? '+' : ''}{formatCurrency(shift.difference)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Historial de Turnos</h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredShifts.length} de {shifts.length} turnos
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Summary Stats - Hidden on mobile */}
            <div className="hidden md:flex gap-3">
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 px-4 py-2 text-center">
                <div className="text-xs font-bold text-gray-600 mb-1">Total Ventas</div>
                <div className="text-lg font-bold text-[#EC0000]">
                  {formatCurrency(shifts.reduce((sum, s) => sum + s.totalSales, 0))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 px-4 py-2 text-center">
                <div className="text-xs font-bold text-gray-600 mb-1">Transacciones</div>
                <div className="text-lg font-bold text-gray-900">
                  {shifts.reduce((sum, s) => sum + s.salesCount, 0)}
                </div>
              </div>
            </div>

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
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número de turno o cajero..."
            className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredShifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Clock className="w-20 h-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {shifts.length === 0 ? 'No hay turnos registrados' : 'No se encontraron turnos'}
            </h3>
            <p className="text-gray-600">
              {shifts.length === 0
                ? 'Los turnos cerrados aparecerán aquí'
                : 'Intenta con otro término de búsqueda'}
            </p>
          </div>
        ) : (
          <>
            {/* Vista de Cards - Móvil/Tablet o seleccionada en Desktop */}
            <div className={`${viewMode === 'table' ? 'hidden lg:hidden' : 'block'} ${viewMode === 'grid' && 'lg:block'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} />
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
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Turno</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Cajero</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Fecha</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Duración</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Ventas</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Total</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredShifts.map(shift => {
                        const statusConfig = getStatusConfig(shift.status);
                        const StatusIcon = statusConfig.icon;
                        const isExpanded = expandedShift === shift.id;

                        return (
                          <>
                            <tr 
                              key={shift.id} 
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => setExpandedShift(isExpanded ? null : shift.id)}
                            >
                              <td className="px-6 py-4">
                                <span className="font-bold text-gray-900">{shift.shiftNumber}</span>
                              </td>
                              <td className="px-6 py-4 text-gray-700">{shift.openedBy}</td>
                              <td className="px-6 py-4 text-center text-sm text-gray-600">
                                {new Date(shift.openedAt).toLocaleDateString('es-MX')}
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-gray-600">
                                {formatDuration(shift.duration)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-bold text-gray-900">{shift.salesCount}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="font-bold text-[#EC0000]">{formatCurrency(shift.totalSales)}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig.label}
                                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </span>
                              </td>
                            </tr>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                  <div className="grid grid-cols-4 gap-4">
                                    {/* Métodos de pago */}
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Banknote className="w-4 h-4 text-green-600" />
                                        <span className="text-xs font-bold text-gray-600 uppercase">Efectivo</span>
                                      </div>
                                      <div className="text-lg font-bold text-green-600">{formatCurrency(shift.salesCash)}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs font-bold text-gray-600 uppercase">Tarjeta</span>
                                      </div>
                                      <div className="text-lg font-bold text-blue-600">{formatCurrency(shift.salesCard)}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-purple-600" />
                                        <span className="text-xs font-bold text-gray-600 uppercase">Transferencia</span>
                                      </div>
                                      <div className="text-lg font-bold text-purple-600">{formatCurrency(shift.salesTransfer)}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-4 h-4 text-gray-600" />
                                        <span className="text-xs font-bold text-gray-600 uppercase">Diferencia</span>
                                      </div>
                                      <div className={`text-lg font-bold ${
                                        shift.difference > 0 ? 'text-blue-600' : shift.difference < 0 ? 'text-red-600' : 'text-gray-600'
                                      }`}>
                                        {shift.difference > 0 ? '+' : ''}{formatCurrency(shift.difference)}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
