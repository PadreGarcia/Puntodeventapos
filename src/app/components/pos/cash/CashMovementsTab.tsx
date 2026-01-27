import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Trash2, AlertCircle, Grid3x3, List, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { CashRegister, CashMovement } from '@/types/pos';

interface CashMovementsTabProps {
  register: CashRegister;
  movements: CashMovement[];
  onUpdateMovements: (movements: CashMovement[]) => void;
}

type ViewMode = 'grid' | 'table';

export function CashMovementsTab({ register, movements, onUpdateMovements }: CashMovementsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [formData, setFormData] = useState({
    type: 'withdrawal' as 'income' | 'withdrawal',
    amount: '',
    reason: '',
    category: 'other' as 'expense' | 'income' | 'transfer' | 'other',
    authorizedBy: register.openedBy,
    notes: ''
  });

  const totalIncome = movements
    .filter(m => m.type === 'income')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalWithdrawals = movements
    .filter(m => m.type === 'withdrawal')
    .reduce((sum, m) => sum + m.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Ingresa un motivo');
      return;
    }

    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      type: formData.type,
      amount,
      reason: formData.reason.trim(),
      category: formData.category,
      authorizedBy: formData.authorizedBy.trim(),
      timestamp: new Date(),
      notes: formData.notes.trim() || undefined
    };

    onUpdateMovements([...movements, newMovement]);
    toast.success(`${formData.type === 'income' ? 'Ingreso' : 'Retiro'} registrado exitosamente`);

    setFormData({
      type: 'withdrawal',
      amount: '',
      reason: '',
      category: 'other',
      authorizedBy: register.openedBy,
      notes: ''
    });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este movimiento?')) {
      onUpdateMovements(movements.filter(m => m.id !== id));
      toast.success('Movimiento eliminado');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      expense: 'Gasto',
      income: 'Ingreso Extra',
      transfer: 'Transferencia',
      other: 'Otro'
    };
    return labels[category as keyof typeof labels] || category;
  };

  // Componente de Card de Movimiento
  const MovementCard = ({ movement }: { movement: CashMovement }) => {
    return (
      <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
        movement.type === 'income' ? 'border-green-200' : 'border-red-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b ${
          movement.type === 'income' 
            ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {movement.type === 'income' ? (
                <div className="bg-green-600 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="bg-red-600 p-2 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {movement.type === 'income' ? 'Ingreso' : 'Retiro'}
                </h3>
                <p className="text-xs text-gray-600 uppercase font-bold">
                  {getCategoryLabel(movement.category)}
                </p>
              </div>
            </div>
            <div className={`text-right ${movement.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              <p className="text-2xl font-bold">{formatCurrency(movement.amount)}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Motivo */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-600 font-bold uppercase mb-1">Motivo</div>
            <div className="text-sm font-bold text-blue-900">{movement.reason}</div>
          </div>

          {/* Autorizado por */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-bold uppercase mb-1">Autorizado por</div>
            <div className="text-sm font-bold text-gray-900">{movement.authorizedBy}</div>
          </div>

          {/* Fecha y hora */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatDateTime(movement.timestamp)}</span>
          </div>

          {/* Notas */}
          {movement.notes && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="text-xs text-yellow-700 font-bold uppercase mb-1">Notas</div>
              <div className="text-sm text-yellow-900">{movement.notes}</div>
            </div>
          )}

          {/* Botón eliminar */}
          <button
            onClick={() => handleDelete(movement.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b border-gray-200">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Ingresos</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2.5 rounded-lg">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700 font-medium">Total Retiros</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(totalWithdrawals)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${
                totalIncome - totalWithdrawals >= 0 ? 'bg-green-600' : 'bg-red-600'
              }`}>
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Diferencia Neta</p>
                <p className={`text-2xl font-bold ${
                  totalIncome - totalWithdrawals >= 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                  {formatCurrency(totalIncome - totalWithdrawals)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-gray-600 font-medium">
            {movements.length} movimiento{movements.length !== 1 ? 's' : ''}
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle vista - Solo desktop */}
            {!showForm && movements.length > 0 && (
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
            )}

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nuevo Movimiento</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nuevo Movimiento</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tipo de Movimiento *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-medium"
                  >
                    <option value="withdrawal">Retiro (Salida de efectivo)</option>
                    <option value="income">Ingreso (Entrada de efectivo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Monto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-medium"
                  >
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso Extra</option>
                    <option value="transfer">Transferencia</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Autorizado Por *
                  </label>
                  <input
                    type="text"
                    value={formData.authorizedBy}
                    onChange={(e) => setFormData({ ...formData, authorizedBy: e.target.value })}
                    placeholder="Nombre"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Motivo *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ej: Pago a proveedor, Compra de insumos, etc."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Información adicional..."
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Movements List */}
        {movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="w-20 h-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay movimientos registrados</h3>
            <p className="text-gray-600 mb-6">Los movimientos de caja aparecerán aquí</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-xl font-bold shadow-lg shadow-red-500/30"
              >
                <Plus className="w-5 h-5" />
                Registrar Movimiento
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Vista de Cards - Móvil/Tablet o seleccionada en Desktop */}
            <div className={`${viewMode === 'table' ? 'hidden lg:hidden' : 'block'} ${viewMode === 'grid' && 'lg:block'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {movements.map(movement => (
                  <MovementCard key={movement.id} movement={movement} />
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
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Tipo</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Monto</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Motivo</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Categoría</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Autorizado</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Fecha/Hora</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {movements.map(movement => (
                        <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              movement.type === 'income'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {movement.type === 'income' ? (
                                <><TrendingUp className="w-3 h-3" /> Ingreso</>
                              ) : (
                                <><TrendingDown className="w-3 h-3" /> Retiro</>
                              )}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${
                            movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(movement.amount)}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{movement.reason}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{getCategoryLabel(movement.category)}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{movement.authorizedBy}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {formatDateTime(movement.timestamp)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDelete(movement.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
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
