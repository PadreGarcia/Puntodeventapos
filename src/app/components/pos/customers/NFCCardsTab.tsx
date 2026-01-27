import { useState } from 'react';
import { Wifi, Plus, Trash2, Ban, CheckCircle, Printer, QrCode, Barcode as BarcodeIcon, Eye } from 'lucide-react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { toast } from 'sonner';
import type { NFCCard, Customer } from '@/types/pos';

interface NFCCardsTabProps {
  cards: NFCCard[];
  customers: Customer[];
  onUpdateCards: (cards: NFCCard[]) => void;
}

export function NFCCardsTab({ cards, customers, onUpdateCards }: NFCCardsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<NFCCard | null>(null);
  const [codeType, setCodeType] = useState<'qr' | 'barcode'>('qr');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'remove'>('add');
  const [formData, setFormData] = useState({
    cardNumber: '',
    customerId: '',
    initialBalance: '0'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cardNumber.trim()) {
      toast.error('El número de tarjeta es requerido');
      return;
    }

    if (cards.some(c => c.cardNumber === formData.cardNumber.trim())) {
      toast.error('Esta tarjeta ya está registrada');
      return;
    }

    const customer = formData.customerId ? customers.find(c => c.id === formData.customerId) : undefined;

    const newCard: NFCCard = {
      id: `nfc-${Date.now()}`,
      cardNumber: formData.cardNumber.trim(),
      customerId: formData.customerId || undefined,
      customerName: customer?.name,
      status: 'active',
      issuedAt: new Date(),
      balance: parseFloat(formData.initialBalance) || 0
    };

    onUpdateCards([...cards, newCard]);
    toast.success('Tarjeta registrada');
    setFormData({ cardNumber: '', customerId: '', initialBalance: '0' });
    setShowForm(false);
  };

  const handleToggleStatus = (card: NFCCard) => {
    const newStatus = card.status === 'active' ? 'blocked' : 'active';
    onUpdateCards(cards.map(c => 
      c.id === card.id ? { ...c, status: newStatus } : c
    ));
    toast.success(`Tarjeta ${newStatus === 'active' ? 'activada' : 'bloqueada'}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta tarjeta?')) {
      onUpdateCards(cards.filter(c => c.id !== id));
      toast.success('Tarjeta eliminada');
    }
  };

  const handlePrintCard = (card: NFCCard) => {
    toast.success(`Imprimiendo tarjeta de ${card.customerName || card.cardNumber} con código ${codeType === 'qr' ? 'QR' : 'de barras'}...`);
    console.log('Imprimir tarjeta:', card.cardNumber, 'Tipo:', codeType);
  };

  const handleBalanceOperation = () => {
    if (!selectedCard || !balanceAmount) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Cantidad inválida');
      return;
    }

    const newBalance = balanceOperation === 'add' 
      ? selectedCard.balance + amount 
      : selectedCard.balance - amount;

    if (newBalance < 0) {
      toast.error('Saldo insuficiente');
      return;
    }

    onUpdateCards(cards.map(c => 
      c.id === selectedCard.id ? { ...c, balance: newBalance } : c
    ));

    toast.success(`${balanceOperation === 'add' ? 'Agregado' : 'Retirado'} $${amount.toFixed(2)}`);
    setBalanceAmount('');
    setShowBalanceModal(false);
    setSelectedCard({ ...selectedCard, balance: newBalance });
  };

  const handleReassignCard = (card: NFCCard) => {
    const newCustomerId = prompt('ID del nuevo cliente (deja vacío para desasignar):');
    
    if (newCustomerId === null) return; // Cancelado
    
    if (newCustomerId === '') {
      // Desasignar
      onUpdateCards(cards.map(c => 
        c.id === card.id ? { ...c, customerId: undefined, customerName: undefined } : c
      ));
      toast.success('Tarjeta desasignada');
      if (selectedCard?.id === card.id) {
        setSelectedCard({ ...card, customerId: undefined, customerName: undefined });
      }
      return;
    }

    const customer = customers.find(c => c.id === newCustomerId);
    if (!customer) {
      toast.error('Cliente no encontrado');
      return;
    }

    onUpdateCards(cards.map(c => 
      c.id === card.id ? { ...c, customerId: customer.id, customerName: customer.name } : c
    ));
    toast.success(`Tarjeta asignada a ${customer.name}`);
    if (selectedCard?.id === card.id) {
      setSelectedCard({ ...card, customerId: customer.id, customerName: customer.name });
    }
  };

  const activeCards = cards.filter(c => c.status === 'active').length;
  const assignedCards = cards.filter(c => c.customerId).length;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="text-sm font-bold text-gray-600 mb-1">Total Tarjetas</div>
            <div className="text-3xl font-bold text-gray-900">{cards.length}</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-lg border-2 border-green-200 p-6">
            <div className="text-sm font-bold text-green-700 mb-1">Activas</div>
            <div className="text-3xl font-bold text-green-600">{activeCards}</div>
          </div>
          <div className="bg-purple-50 rounded-xl shadow-lg border-2 border-purple-200 p-6">
            <div className="text-sm font-bold text-purple-700 mb-1">Asignadas</div>
            <div className="text-3xl font-bold text-purple-600">{assignedCards}</div>
          </div>
        </div>

        {/* Add Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Registrar Nueva Tarjeta NFC
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nueva Tarjeta NFC</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Número de Tarjeta *</label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Asignar a Cliente</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  >
                    <option value="">Sin asignar</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.initialBalance}
                    onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Registrar Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Card Details Modal */}
        {selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
               onClick={() => {
                 setSelectedCard(null);
                 setPrintQuantity(1);
                 setCodeType('qr');
               }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 sticky top-0 z-10">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Wifi className="w-6 h-6" />
                  Tarjeta NFC - {selectedCard.cardNumber}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Selector de tipo de código */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Tipo de Código en la Tarjeta
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCodeType('qr')}
                      className={`p-4 rounded-xl font-bold transition-all border-2 ${
                        codeType === 'qr'
                          ? 'bg-purple-500 text-white border-purple-600 shadow-lg'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <QrCode className="w-6 h-6 mx-auto mb-2" />
                      Código QR
                    </button>
                    <button
                      onClick={() => setCodeType('barcode')}
                      className={`p-4 rounded-xl font-bold transition-all border-2 ${
                        codeType === 'barcode'
                          ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <BarcodeIcon className="w-6 h-6 mx-auto mb-2" />
                      Código de Barras
                    </button>
                  </div>
                </div>

                {/* Card Preview con código integrado */}
                <div className={`bg-gradient-to-br rounded-xl shadow-xl p-6 text-white ${
                  selectedCard.status === 'active' ? 'from-purple-500 to-purple-700' :
                  selectedCard.status === 'blocked' ? 'from-gray-400 to-gray-600' :
                  'from-yellow-500 to-yellow-700'
                }`}>
                  {/* Header de la tarjeta */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-bold opacity-75">TARJETA NFC</div>
                    <Wifi className="w-8 h-8 opacity-50" />
                  </div>
                  
                  {/* Número de tarjeta */}
                  <div className="text-2xl font-bold tracking-wider mb-3">{selectedCard.cardNumber}</div>
                  
                  {/* Nombre del titular */}
                  {selectedCard.customerName && (
                    <div className="mb-3">
                      <div className="text-xs font-bold opacity-75 mb-1">TITULAR</div>
                      <div className="text-lg font-bold">{selectedCard.customerName}</div>
                    </div>
                  )}
                  
                  {/* Saldo, Status y Código en la misma línea */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold opacity-75 mb-1">SALDO</div>
                      <div className="text-xl font-bold">${selectedCard.balance.toFixed(2)}</div>
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-white/20 mt-2 flex items-center gap-1">
                        {selectedCard.status === 'active' ? (
                          <><CheckCircle className="w-3 h-3" /> Activa</>
                        ) : selectedCard.status === 'blocked' ? (
                          <><Ban className="w-3 h-3" /> Bloqueada</>
                        ) : (
                          'Perdida'
                        )}
                      </span>
                    </div>

                    {/* Código QR o Barras pequeño a la derecha */}
                    <div className="flex items-center justify-center">
                      {codeType === 'qr' ? (
                        <div className="bg-white rounded p-1">
                          <QRCode value={selectedCard.cardNumber} size={60} />
                        </div>
                      ) : (
                        <div className="bg-white rounded px-1 py-1">
                          <Barcode 
                            value={selectedCard.cardNumber}
                            width={0.8}
                            height={30}
                            displayValue={false}
                            margin={0}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gestión de Saldo */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold text-green-700">Saldo Actual</div>
                      <div className="text-3xl font-bold text-green-600">${selectedCard.balance.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setBalanceOperation('add');
                          setShowBalanceModal(true);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg"
                      >
                        + Agregar
                      </button>
                      <button
                        onClick={() => {
                          setBalanceOperation('remove');
                          setShowBalanceModal(true);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg"
                      >
                        - Retirar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePrintCard(selectedCard)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Imprimir Tarjeta
                  </button>
                  
                  <button
                    onClick={() => handleReassignCard(selectedCard)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Wifi className="w-5 h-5" />
                    {selectedCard.customerId ? 'Reasignar' : 'Asignar Cliente'}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedCard(null);
                    setCodeType('qr');
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-300 transition-all"
                >
                  Cerrar
                </button>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                  <p className="font-bold mb-1">💡 Información</p>
                  <p>Esta tarjeta puede ser escaneada en el POS (NFC, QR o código de barras) para identificar al cliente, aplicar puntos de lealtad y usar el saldo disponible.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Gestión de Saldo */}
        {showBalanceModal && selectedCard && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
               onClick={() => setShowBalanceModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                 onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                {balanceOperation === 'add' ? (
                  <>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Plus className="w-6 h-6 text-green-600" />
                    </div>
                    Agregar Saldo
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    Retirar Saldo
                  </>
                )}
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 mb-1">Tarjeta: {selectedCard.cardNumber}</div>
                <div className="text-sm text-gray-600 mb-2">
                  {selectedCard.customerName || 'Sin asignar'}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  Saldo actual: ${selectedCard.balance.toFixed(2)}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cantidad a {balanceOperation === 'add' ? 'agregar' : 'retirar'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-bold text-lg"
                  autoFocus
                />
              </div>

              {balanceAmount && !isNaN(parseFloat(balanceAmount)) && (
                <div className={`rounded-lg p-3 mb-4 ${
                  balanceOperation === 'add' ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
                }`}>
                  <div className="text-sm font-bold text-gray-700">Nuevo saldo:</div>
                  <div className={`text-2xl font-bold ${
                    balanceOperation === 'add' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${(selectedCard.balance + (balanceOperation === 'add' ? 1 : -1) * parseFloat(balanceAmount)).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBalanceOperation}
                  className={`flex-1 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all ${
                    balanceOperation === 'add' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    setBalanceAmount('');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-12 text-center">
              <Wifi className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No hay tarjetas NFC registradas</p>
            </div>
          ) : (
            cards.map(card => (
              <div
                key={card.id}
                className={`bg-gradient-to-br rounded-2xl shadow-lg p-6 text-white relative ${
                  card.status === 'active' ? 'from-purple-500 to-purple-700' :
                  card.status === 'blocked' ? 'from-gray-400 to-gray-600' :
                  'from-yellow-500 to-yellow-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold opacity-75">TARJETA NFC</div>
                  <Wifi className="w-8 h-8 opacity-50" />
                </div>

                <div className="text-2xl font-bold tracking-wider mb-3">{card.cardNumber}</div>

                {card.customerName ? (
                  <div className="mb-3">
                    <div className="text-xs font-bold opacity-75 mb-1">TITULAR</div>
                    <div className="text-lg font-bold">{card.customerName}</div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="text-sm font-bold opacity-75">SIN ASIGNAR</div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-bold opacity-75 mb-1">SALDO</div>
                    <div className="text-xl font-bold">${card.balance.toFixed(2)}</div>
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-white/20 mt-2 flex items-center gap-1">
                      {card.status === 'active' ? (
                        <><CheckCircle className="w-3 h-3" /> Activa</>
                      ) : card.status === 'blocked' ? (
                        <><Ban className="w-3 h-3" /> Bloqueada</>
                      ) : (
                        'Perdida'
                      )}
                    </span>
                  </div>

                  {/* Código QR pequeño en la tarjeta */}
                  <div className="bg-white rounded p-1">
                    <QRCode value={card.cardNumber} size={50} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCard(card)}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Gestionar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(card)}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors"
                    title={card.status === 'active' ? 'Bloquear' : 'Activar'}
                  >
                    {card.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="bg-red-500/50 hover:bg-red-500/70 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
