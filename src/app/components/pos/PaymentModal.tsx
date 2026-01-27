import { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, ArrowLeftRight, CheckCircle, AlertCircle, Wifi, User, Award, ArrowRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { PaymentMethod, Customer } from '@/types/pos';

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  onClose: () => void;
  onComplete: (method: PaymentMethod, amountReceived?: number, change?: number, customer?: Customer) => void;
  customers: Customer[];
}

export function PaymentModal({ isOpen, total, onClose, onComplete, customers }: PaymentModalProps) {
  const [step, setStep] = useState<'method' | 'details'>(('method'));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [nfcCardId, setNfcCardId] = useState('');
  const [scannedCustomer, setScannedCustomer] = useState<Customer | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setPaymentMethod(null);
      setAmountReceived('');
      setIsProcessing(false);
      setNfcCardId('');
      setScannedCustomer(null);
      setIsScanning(false);
    }
  }, [isOpen]);

  // Simular escaneo de tarjeta NFC
  const handleNFCScan = () => {
    setIsScanning(true);
    
    // Simular lectura de tarjeta
    setTimeout(() => {
      if (nfcCardId.trim()) {
        const customer = customers.find(c => c.nfcCardId === nfcCardId.trim());
        if (customer) {
          setScannedCustomer(customer);
          toast.success(`¡Tarjeta de ${customer.name} detectada!`);
        } else {
          toast.error('Tarjeta NFC no registrada');
          setScannedCustomer(null);
        }
      }
      setIsScanning(false);
    }, 800);
  };

  // Escaneo rápido de clientes (simulación)
  const handleQuickNFCScan = (customer: Customer) => {
    setNfcCardId(customer.nfcCardId || '');
    setScannedCustomer(customer);
    toast.success(`Cliente ${customer.name} seleccionado`);
  };

  if (!isOpen) return null;

  const receivedAmount = parseFloat(amountReceived) || 0;
  const change = receivedAmount - total;
  const hasEnoughMoney = receivedAmount >= total;

  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount.toString());
  };

  const handleExactAmount = () => {
    setAmountReceived(total.toFixed(2));
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Si es tarjeta o transferencia, ir directo a confirmar
    if (method === 'card' || method === 'transfer') {
      setStep('details');
    } else if (method === 'cash' || method === 'nfc') {
      setStep('details');
    }
  };

  const handleBack = () => {
    setStep('method');
    setPaymentMethod(null);
    setAmountReceived('');
    setScannedCustomer(null);
    setNfcCardId('');
  };

  const handleCompleteSale = async () => {
    if (paymentMethod === 'cash' && !hasEnoughMoney) {
      toast.error('Monto insuficiente');
      return;
    }

    if (paymentMethod === 'nfc' && !scannedCustomer) {
      toast.error('Escanea la tarjeta NFC del cliente');
      return;
    }

    setIsProcessing(true);

    // Simular procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 800));

    if (paymentMethod === 'cash') {
      onComplete(paymentMethod, receivedAmount, change);
    } else if (paymentMethod === 'nfc') {
      onComplete(paymentMethod, undefined, undefined, scannedCustomer || undefined);
    } else {
      onComplete(paymentMethod);
    }

    setIsProcessing(false);
  };

  // Calcular puntos que ganará el cliente
  const pointsToEarn = scannedCustomer ? Math.floor(total / 10) : 0;

  // Clientes con NFC para acceso rápido
  const nfcCustomers = customers.filter(c => c.nfcCardId).slice(0, 4);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            {step === 'details' && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white/15 rounded-xl transition-colors border border-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {step === 'method' ? 'Procesar Pago' : 'Completar Pago'}
              </h2>
              <p className="text-red-50 text-sm font-medium mt-1">
                {step === 'method' ? 'Selecciona el método de pago' : 'Ingresa los detalles del pago'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/15 rounded-xl transition-colors border border-transparent hover:border-white/20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="bg-gray-100 px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${
              step === 'method' ? 'bg-[#EC0000] text-white' : 'bg-green-100 text-green-700'
            }`}>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
              Método
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${
              step === 'details' ? 'bg-[#EC0000] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
              Detalles
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-6">
          {/* PASO 1: Selección de Método de Pago */}
          {step === 'method' && (
            <div className="space-y-4">
              {/* Total a pagar */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 text-center border-2 border-red-200">
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Total a pagar</p>
                <p className="text-4xl font-bold text-[#EC0000] tabular-nums">${total.toFixed(2)}</p>
              </div>

              {/* Métodos de pago */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Selecciona el método de pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleMethodSelect('cash')}
                    className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-[#EC0000] hover:bg-red-50 transition-all hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <DollarSign className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-base font-bold text-gray-900">Efectivo</span>
                      <p className="text-xs text-gray-500">Pago en efectivo</p>
                    </div>
                    <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EC0000] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    onClick={() => handleMethodSelect('card')}
                    className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-[#EC0000] hover:bg-red-50 transition-all hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-base font-bold text-gray-900">Tarjeta</span>
                      <p className="text-xs text-gray-500">Débito / Crédito</p>
                    </div>
                    <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EC0000] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    onClick={() => handleMethodSelect('transfer')}
                    className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-[#EC0000] hover:bg-red-50 transition-all hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <ArrowLeftRight className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-base font-bold text-gray-900">Transferencia</span>
                      <p className="text-xs text-gray-500">SPEI / Bancaria</p>
                    </div>
                    <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EC0000] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    onClick={() => handleMethodSelect('nfc')}
                    className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-[#EC0000] hover:bg-red-50 transition-all hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Wifi className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-base font-bold text-gray-900">Tarjeta NFC</span>
                      <p className="text-xs text-gray-500">Cliente frecuente</p>
                    </div>
                    <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EC0000] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Detalles del Pago */}
          {step === 'details' && (
            <div className="space-y-3">
              {/* Resumen del total */}
              <div className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Total a pagar:</span>
                  <span className="text-xl font-bold text-[#EC0000] tabular-nums">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* EFECTIVO */}
              {paymentMethod === 'cash' && (
                <>
                  {/* Monto recibido */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Monto recibido del cliente
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#EC0000] focus:outline-none tabular-nums text-gray-900"
                        step="0.01"
                        min="0"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Botones rápidos */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Montos rápidos
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map(amount => (
                        <button
                          key={amount}
                          onClick={() => handleQuickAmount(amount)}
                          className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-bold transition-all border-2 border-gray-200 hover:border-gray-400 text-sm"
                        >
                          ${amount}
                        </button>
                      ))}
                      <button
                        onClick={handleExactAmount}
                        className="px-3 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold transition-all shadow-lg text-sm"
                      >
                        Exacto
                      </button>
                    </div>
                  </div>

                  {/* Cambio */}
                  {amountReceived && (
                    <div className={`rounded-xl p-4 border-2 ${
                      hasEnoughMoney 
                        ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
                        : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                          {hasEnoughMoney ? 'Cambio a devolver' : 'Falta por pagar'}
                        </span>
                        {hasEnoughMoney ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <p className={`text-3xl font-bold tabular-nums ${
                        hasEnoughMoney ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${Math.abs(change).toFixed(2)}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* TARJETA NFC */}
              {paymentMethod === 'nfc' && (
                <div className="space-y-3">
                  {scannedCustomer ? (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-gray-900">{scannedCustomer.name}</p>
                            <p className="text-xs text-gray-600">ID: {scannedCustomer.nfcCardId}</p>
                          </div>
                        </div>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      
                      {/* Info de lealtad */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1 font-semibold">Puntos Actuales</p>
                          <p className="text-lg font-bold text-gray-900">{scannedCustomer.loyaltyPoints}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1 font-semibold">A Ganar</p>
                          <p className="text-lg font-bold text-green-600">+{pointsToEarn}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1 font-semibold">Nivel</p>
                          <div className="flex items-center justify-center gap-1">
                            <Award className="w-4 h-4 text-yellow-600" />
                            <p className="text-xs font-bold text-gray-900 capitalize">{scannedCustomer.loyaltyTier}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setScannedCustomer(null);
                          setNfcCardId('');
                        }}
                        className="w-full px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 rounded-lg font-bold transition-all text-sm"
                      >
                        Escanear otra tarjeta
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center animate-pulse">
                          <Wifi className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Esperando Tarjeta NFC</p>
                          <p className="text-xs text-gray-600">Acerca la tarjeta del cliente al lector</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={nfcCardId}
                            onChange={(e) => setNfcCardId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleNFCScan()}
                            placeholder="O ingresa el ID manualmente..."
                            className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-[#EC0000] focus:outline-none font-medium"
                            autoFocus
                          />
                          <button
                            onClick={handleNFCScan}
                            disabled={isScanning || !nfcCardId.trim()}
                            className="px-4 py-2 bg-[#EC0000] hover:bg-[#D50000] text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {isScanning ? 'Verificando...' : 'Verificar'}
                          </button>
                        </div>

                        {/* Clientes rápidos */}
                        {nfcCustomers.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-700 mb-2 font-bold">Clientes frecuentes:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {nfcCustomers.map(customer => (
                                <button
                                  key={customer.id}
                                  onClick={() => handleQuickNFCScan(customer)}
                                  className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-200 hover:border-[#EC0000] hover:bg-red-50 rounded-lg text-xs font-semibold text-gray-700 hover:text-[#EC0000] transition-all"
                                >
                                  <User className="w-4 h-4" />
                                  {customer.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TARJETA / TRANSFERENCIA */}
              {(paymentMethod === 'card' || paymentMethod === 'transfer') && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200">
                  <div className="text-center">
                    {paymentMethod === 'card' && (
                      <>
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-lg font-bold text-gray-900 mb-2">Terminal de Pago</p>
                        <p className="text-sm text-gray-600 mb-3">El pago se procesará automáticamente con la terminal</p>
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800 font-semibold">
<CreditCard className="w-4 h-4 inline mr-1" /> Inserta o acerca la tarjeta a la terminal
                          </p>
                        </div>
                      </>
                    )}
                    {paymentMethod === 'transfer' && (
                      <>
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <ArrowLeftRight className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-lg font-bold text-gray-900 mb-2">Transferencia Bancaria</p>
                        <p className="text-sm text-gray-600 mb-3">Verifica que la transferencia se haya completado</p>
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
                          <p className="text-xs text-purple-800 font-semibold">
                            🏦 Confirma la referencia con el cliente
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
          {step === 'method' ? (
            <button
              onClick={onClose}
              className="w-full px-6 py-4 bg-white hover:bg-gray-100 text-gray-700 rounded-xl font-bold transition-all border-2 border-gray-200 hover:border-gray-300"
            >
              Cancelar
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-4 bg-white hover:bg-gray-100 text-gray-700 rounded-xl font-bold transition-all border-2 border-gray-200 hover:border-gray-300"
                disabled={isProcessing}
              >
                ← Atrás
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={
                  isProcessing || 
                  (paymentMethod === 'cash' && !hasEnoughMoney) ||
                  (paymentMethod === 'nfc' && !scannedCustomer)
                }
                className="flex-1 px-6 py-4 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Completar Venta
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
