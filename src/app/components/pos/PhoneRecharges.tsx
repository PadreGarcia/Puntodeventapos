import { useState } from 'react';
import { Smartphone, Phone, Search, Clock, CheckCircle, Receipt, X, ArrowRight, ArrowLeft, Wifi, MessageCircle, Zap, TrendingUp, DollarSign, Database, Circle, Banknote, CreditCard, Building } from 'lucide-react';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/types/pos';

interface PhoneRecharge {
  id: string;
  carrier: string;
  phoneNumber: string;
  productType: 'airtime' | 'data' | 'social' | 'unlimited';
  productName: string;
  amount: number;
  commission: number;
  paymentMethod: PaymentMethod;
  timestamp: Date;
  operatorName: string;
  confirmationCode: string;
}

interface Carrier {
  id: string;
  name: string;
  color: string;
  logo: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'airtime' | 'data' | 'social' | 'unlimited';
  icon: string;
  validity?: string;
}

const CARRIERS: Carrier[] = [
  { id: 'telcel', name: 'Telcel', color: 'from-blue-500 to-blue-700', logo: 'Smartphone' },
  { id: 'att', name: 'AT&T', color: 'from-sky-500 to-sky-700', logo: 'Phone' },
  { id: 'movistar', name: 'Movistar', color: 'from-green-500 to-green-700', logo: 'Smartphone' },
  { id: 'unefon', name: 'Unefon', color: 'from-purple-500 to-purple-700', logo: 'Phone' },
  { id: 'virgin', name: 'Virgin Mobile', color: 'from-red-500 to-red-700', logo: 'Smartphone' },
  { id: 'weex', name: 'Weex', color: 'from-orange-500 to-orange-700', logo: 'Phone' }
];

const PRODUCTS: Product[] = [
  // Tiempo Aire
  { id: 'air-20', name: '$20', description: 'Tiempo Aire', price: 20, type: 'airtime', icon: 'DollarSign' },
  { id: 'air-30', name: '$30', description: 'Tiempo Aire', price: 30, type: 'airtime', icon: 'DollarSign' },
  { id: 'air-50', name: '$50', description: 'Tiempo Aire', price: 50, type: 'airtime', icon: 'DollarSign' },
  { id: 'air-100', name: '$100', description: 'Tiempo Aire', price: 100, type: 'airtime', icon: 'DollarSign' },
  { id: 'air-150', name: '$150', description: 'Tiempo Aire', price: 150, type: 'airtime', icon: 'DollarSign' },
  { id: 'air-200', name: '$200', description: 'Tiempo Aire', price: 200, type: 'airtime', icon: 'DollarSign' },
  { id: 'air-300', name: '$300', description: 'Tiempo Aire', price: 300, type: 'airtime', icon: 'DollarSign' },
  { id: 'air-500', name: '$500', description: 'Tiempo Aire', price: 500, type: 'airtime', icon: 'DollarSign' },
  
  // Paquetes de Datos
  { id: 'data-1gb', name: '1 GB', description: 'Internet 7 días', price: 50, type: 'data', icon: 'Wifi', validity: '7 días' },
  { id: 'data-2gb', name: '2 GB', description: 'Internet 15 días', price: 80, type: 'data', icon: 'Wifi', validity: '15 días' },
  { id: 'data-3gb', name: '3 GB', description: 'Internet 30 días', price: 120, type: 'data', icon: 'Wifi', validity: '30 días' },
  { id: 'data-5gb', name: '5 GB', description: 'Internet 30 días', price: 180, type: 'data', icon: 'Wifi', validity: '30 días' },
  { id: 'data-10gb', name: '10 GB', description: 'Internet 30 días', price: 300, type: 'data', icon: 'Wifi', validity: '30 días' },
  { id: 'data-20gb', name: '20 GB', description: 'Internet 30 días', price: 500, type: 'data', icon: 'Wifi', validity: '30 días' },
  
  // Paquetes Redes Sociales
  { id: 'social-fb', name: 'Facebook', description: '30 días ilimitado', price: 30, type: 'social', icon: 'MessageCircle', validity: '30 días' },
  { id: 'social-wa', name: 'WhatsApp', description: '30 días ilimitado', price: 30, type: 'social', icon: 'MessageCircle', validity: '30 días' },
  { id: 'social-all', name: 'Redes Sociales', description: 'FB + WA + IG 30 días', price: 50, type: 'social', icon: 'Smartphone', validity: '30 días' },
  
  // Paquetes Ilimitados
  { id: 'unlim-day', name: 'Ilimitado 1 día', description: 'Todo ilimitado', price: 35, type: 'unlimited', icon: 'Zap', validity: '1 día' },
  { id: 'unlim-week', name: 'Ilimitado 7 días', description: 'Todo ilimitado', price: 150, type: 'unlimited', icon: 'Zap', validity: '7 días' },
  { id: 'unlim-month', name: 'Ilimitado 30 días', description: 'Todo ilimitado', price: 500, type: 'unlimited', icon: 'Zap', validity: '30 días' }
];

interface PhoneRechargesProps {
  currentUser: { username: string; fullName: string };
}

export function PhoneRecharges({ currentUser }: PhoneRechargesProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<'airtime' | 'data' | 'social' | 'unlimited' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [rechargeHistory, setRechargeHistory] = useState<PhoneRecharge[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');

  const COMMISSION_RATE = 0.05; // 5% de comisión

  const commission = selectedProduct ? selectedProduct.price * COMMISSION_RATE : 0;
  const totalToCharge = selectedProduct ? selectedProduct.price : 0;
  const change = receivedAmount && selectedProduct 
    ? Math.max(0, parseFloat(receivedAmount) - selectedProduct.price)
    : 0;

  const productTypes = [
    { id: 'airtime' as const, name: 'Tiempo Aire', icon: Zap, color: 'from-yellow-500 to-orange-600', description: 'Saldo para llamadas' },
    { id: 'data' as const, name: 'Internet', icon: Wifi, color: 'from-blue-500 to-blue-600', description: 'Paquetes de datos' },
    { id: 'social' as const, name: 'Redes Sociales', icon: MessageCircle, color: 'from-purple-500 to-purple-600', description: 'FB, WA, IG' },
    { id: 'unlimited' as const, name: 'Ilimitado', icon: TrendingUp, color: 'from-green-500 to-green-600', description: 'Todo incluido' }
  ];

  const handleNext = () => {
    if (currentStep === 1 && !selectedCarrier) {
      toast.error('Selecciona una compañía');
      return;
    }
    if (currentStep === 2 && phoneNumber.length !== 10) {
      toast.error('Ingresa un número válido de 10 dígitos');
      return;
    }
    if (currentStep === 3 && !selectedProductType) {
      toast.error('Selecciona el tipo de producto');
      return;
    }
    if (currentStep === 4 && !selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedCarrier(null);
    setPhoneNumber('');
    setSelectedProductType(null);
    setSelectedProduct(null);
    setPaymentMethod('cash');
    setReceivedAmount('');
  };

  const handleProcessRecharge = () => {
    if (!selectedCarrier || !phoneNumber || !selectedProduct) {
      toast.error('Completa todos los campos');
      return;
    }

    if (paymentMethod === 'cash' && !receivedAmount) {
      toast.error('Ingresa el monto recibido');
      return;
    }

    if (paymentMethod === 'cash' && parseFloat(receivedAmount) < totalToCharge) {
      toast.error('Monto insuficiente');
      return;
    }

    const confirmationCode = `${selectedCarrier.id.toUpperCase()}-${Date.now().toString().slice(-8)}`;

    const newRecharge: PhoneRecharge = {
      id: `rec-${Date.now()}`,
      carrier: selectedCarrier.name,
      phoneNumber,
      productType: selectedProduct.type,
      productName: selectedProduct.name,
      amount: selectedProduct.price,
      commission,
      paymentMethod,
      timestamp: new Date(),
      operatorName: currentUser.fullName,
      confirmationCode
    };

    setRechargeHistory([newRecharge, ...rechargeHistory]);
    setShowPaymentModal(false);
    
    toast.success(
      <div>
        <p className="font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Recarga Exitosa
        </p>
        <p className="text-sm">Código: {confirmationCode}</p>
        <p className="text-sm">{selectedCarrier.name} - {selectedProduct.name}</p>
        <p className="text-sm">Tel: {phoneNumber}</p>
      </div>,
      { duration: 5000 }
    );

    handleReset();
  };

  const filteredHistory = rechargeHistory.filter(r => 
    r.phoneNumber.includes(searchHistory) ||
    r.carrier.toLowerCase().includes(searchHistory.toLowerCase()) ||
    r.confirmationCode.toLowerCase().includes(searchHistory.toLowerCase())
  );

  const todayRecharges = rechargeHistory.filter(r => {
    const today = new Date();
    const rDate = new Date(r.timestamp);
    return rDate.toDateString() === today.toDateString();
  });

  const todayTotal = todayRecharges.reduce((sum, r) => sum + r.amount, 0);
  const todayCommission = todayRecharges.reduce((sum, r) => sum + r.commission, 0);

  const filteredProducts = selectedProductType 
    ? PRODUCTS.filter(p => p.type === selectedProductType)
    : [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header Stats */}
      <div className="bg-white border-b-2 border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) handleReset();
              }}
              className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Clock className="w-5 h-5" />
              {showHistory ? 'Nueva Recarga' : 'Ver Historial'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
              <div className="text-sm font-bold text-blue-700">Recargas Hoy</div>
              <div className="text-3xl font-bold text-blue-600">{todayRecharges.length}</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
              <div className="text-sm font-bold text-green-700">Total Vendido Hoy</div>
              <div className="text-3xl font-bold text-green-600">${todayTotal.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
              <div className="text-sm font-bold text-purple-700">Comisión Hoy</div>
              <div className="text-3xl font-bold text-purple-600">${todayCommission.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {!showHistory ? (
            <>
              {/* Steps Indicator */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                  {[
                    { num: 1, name: 'Compañía' },
                    { num: 2, name: 'Número' },
                    { num: 3, name: 'Categoría' },
                    { num: 4, name: 'Producto' },
                    { num: 5, name: 'Confirmar' }
                  ].map((step, idx) => (
                    <div key={step.num} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                          currentStep >= step.num
                            ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {currentStep > step.num ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            step.num
                          )}
                        </div>
                        <div className={`text-sm font-bold mt-2 ${
                          currentStep >= step.num ? 'text-[#EC0000]' : 'text-gray-400'
                        }`}>
                          {step.name}
                        </div>
                      </div>
                      {idx < 4 && (
                        <div className={`h-1 flex-1 mx-2 rounded transition-all ${
                          currentStep > step.num ? 'bg-[#EC0000]' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
                {/* Step 1: Seleccionar Compañía */}
                {currentStep === 1 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Selecciona la Compañía</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {CARRIERS.map(carrier => (
                        <button
                          key={carrier.id}
                          onClick={() => setSelectedCarrier(carrier)}
                          className={`p-8 rounded-2xl font-bold transition-all border-2 ${
                            selectedCarrier?.id === carrier.id
                              ? `bg-gradient-to-br ${carrier.color} text-white border-transparent shadow-xl scale-105`
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-lg hover:scale-105'
                          }`}
                        >
                          <div className="text-5xl mb-3">{carrier.logo}</div>
                          <div className="text-base">{carrier.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Ingresar Número */}
                {currentStep === 2 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Ingresa el Número Telefónico</h3>
                    <div className="max-w-md mx-auto">
                      <div className="flex items-center gap-4 mb-4">
                        <Phone className="w-8 h-8 text-gray-400" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhoneNumber(value);
                          }}
                          placeholder="5512345678"
                          className="flex-1 px-6 py-5 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-bold text-3xl text-center tracking-wider"
                          maxLength={10}
                          autoFocus
                        />
                      </div>
                      {phoneNumber && (
                        <div className={`text-center font-bold flex items-center justify-center gap-2 ${
                          phoneNumber.length === 10 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {phoneNumber.length === 10 ? (
                            <><CheckCircle className="w-4 h-4" /> Número válido</>
                          ) : (
                            `${phoneNumber.length}/10 dígitos`
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Tipo de Producto */}
                {currentStep === 3 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">¿Qué necesitas?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {productTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setSelectedProductType(type.id)}
                            className={`p-8 rounded-2xl font-bold transition-all border-2 ${
                              selectedProductType === type.id
                                ? `bg-gradient-to-br ${type.color} text-white border-transparent shadow-xl scale-105`
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-lg hover:scale-105'
                            }`}
                          >
                            <Icon className="w-12 h-12 mx-auto mb-3" />
                            <div className="text-xl mb-1">{type.name}</div>
                            <div className={`text-sm ${
                              selectedProductType === type.id ? 'text-white/80' : 'text-gray-500'
                            }`}>
                              {type.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 4: Seleccionar Producto */}
                {currentStep === 4 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Selecciona {productTypes.find(t => t.id === selectedProductType)?.name}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className={`p-6 rounded-2xl font-bold transition-all border-2 ${
                            selectedProduct?.id === product.id
                              ? 'bg-gradient-to-br from-[#EC0000] to-[#D50000] text-white border-transparent shadow-xl scale-105'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-[#EC0000] hover:shadow-lg hover:scale-105'
                          }`}
                        >
                          <div className="mb-2">
                            {product.icon === 'DollarSign' && <DollarSign className="w-12 h-12 mx-auto" />}
                            {product.icon === 'Wifi' && <Wifi className="w-12 h-12 mx-auto" />}
                            {product.icon === 'MessageCircle' && <MessageCircle className="w-12 h-12 mx-auto" />}
                            {product.icon === 'Smartphone' && <Smartphone className="w-12 h-12 mx-auto" />}
                            {product.icon === 'Zap' && <Zap className="w-12 h-12 mx-auto" />}
                          </div>
                          <div className="text-2xl mb-1">{product.name}</div>
                          <div className={`text-sm mb-2 ${
                            selectedProduct?.id === product.id ? 'text-white/80' : 'text-gray-500'
                          }`}>
                            {product.description}
                          </div>
                          {product.validity && (
                            <div className={`text-xs ${
                              selectedProduct?.id === product.id ? 'text-white/70' : 'text-gray-400'
                            }`}>
                              {product.validity}
                            </div>
                          )}
                          <div className="text-2xl mt-3 font-bold">${product.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: Resumen */}
                {currentStep === 5 && selectedCarrier && selectedProduct && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Confirmar Recarga</h3>
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-4 border-b-2 border-green-200">
                            <span className="text-gray-700 font-bold">Compañía:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{selectedCarrier.logo}</span>
                              <span className="text-xl font-bold text-gray-900">{selectedCarrier.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pb-4 border-b-2 border-green-200">
                            <span className="text-gray-700 font-bold">Número:</span>
                            <span className="text-xl font-bold text-gray-900">{phoneNumber}</span>
                          </div>
                          <div className="flex items-center justify-between pb-4 border-b-2 border-green-200">
                            <span className="text-gray-700 font-bold">Producto:</span>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">{selectedProduct.name}</div>
                              <div className="text-sm text-gray-600">{selectedProduct.description}</div>
                              {selectedProduct.validity && (
                                <div className="text-xs text-gray-500">{selectedProduct.validity}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pb-4 border-b-2 border-green-200">
                            <span className="text-gray-700 font-bold">Precio:</span>
                            <span className="text-xl font-bold text-gray-900">${selectedProduct.price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between pb-4 border-b-2 border-green-200">
                            <span className="text-gray-700 font-bold">Tu Comisión (5%):</span>
                            <span className="text-xl font-bold text-green-600">+${commission.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xl font-bold text-gray-900">Total a Cobrar:</span>
                            <span className="text-4xl font-bold text-green-600">${totalToCharge.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 rounded-xl font-bold text-xl hover:shadow-xl transition-all flex items-center justify-center gap-3"
                      >
                        <CheckCircle className="w-7 h-7" />
                        Proceder al Pago
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={`px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 ${
                    currentStep === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#EC0000] hover:shadow-lg'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Anterior
                </button>

                <button
                  onClick={currentStep === 5 ? () => setShowPaymentModal(true) : handleNext}
                  className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white hover:shadow-xl transition-all flex items-center gap-2"
                >
                  {currentStep === 5 ? 'Confirmar' : 'Siguiente'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            /* Historial */
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Historial de Recargas</h3>
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchHistory}
                    onChange={(e) => setSearchHistory(e.target.value)}
                    placeholder="Buscar número, compañía o código..."
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No hay recargas registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map(recharge => (
                    <div
                      key={recharge.id}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:border-[#EC0000] transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 rounded-full text-white">
                              <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{recharge.carrier}</div>
                              <div className="text-sm text-gray-600">{recharge.phoneNumber}</div>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="font-bold text-gray-900 mb-1">{recharge.productName}</div>
                            <div className="text-sm text-gray-600">
                              {recharge.productType === 'airtime' && 'Tiempo Aire'}
                              {recharge.productType === 'data' && 'Paquete de Internet'}
                              {recharge.productType === 'social' && 'Paquete Redes Sociales'}
                              {recharge.productType === 'unlimited' && 'Paquete Ilimitado'}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="text-gray-600">Monto</div>
                              <div className="font-bold text-gray-900">${recharge.amount.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Comisión</div>
                              <div className="font-bold text-green-600">${recharge.commission.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Método</div>
                              <div className="font-bold text-gray-900 flex items-center gap-1">
                                {recharge.paymentMethod === 'cash' ? (
                                  <><Banknote className="w-4 h-4" /> Efectivo</>
                                ) : recharge.paymentMethod === 'card' ? (
                                  <><CreditCard className="w-4 h-4" /> Tarjeta</>
                                ) : recharge.paymentMethod === 'transfer' ? (
                                  <><Building className="w-4 h-4" /> Transferencia</>
                                ) : (
                                  <><Wifi className="w-4 h-4" /> NFC</>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Fecha</div>
                              <div className="font-bold text-gray-900">
                                {new Date(recharge.timestamp).toLocaleString('es-MX', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="text-xs text-gray-500">Código:</div>
                            <div className="text-xs font-mono font-bold text-[#EC0000] bg-red-50 px-2 py-1 rounded">
                              {recharge.confirmationCode}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && selectedProduct && selectedCarrier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
             onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Método de Pago</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 mb-1">Total a Cobrar</div>
              <div className="text-3xl font-bold text-[#EC0000]">${totalToCharge.toFixed(2)}</div>
            </div>

            {/* Métodos de Pago */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`w-full p-4 rounded-xl font-bold transition-all border-2 flex items-center gap-3 ${
                  paymentMethod === 'cash'
                    ? 'bg-green-500 text-white border-green-600 shadow-lg'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
                }`}
              >
                <Banknote className="w-6 h-6" />
                Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-4 rounded-xl font-bold transition-all border-2 flex items-center gap-3 ${
                  paymentMethod === 'card'
                    ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                Tarjeta
              </button>
              <button
                onClick={() => setPaymentMethod('transfer')}
                className={`w-full p-4 rounded-xl font-bold transition-all border-2 flex items-center gap-3 ${
                  paymentMethod === 'transfer'
                    ? 'bg-purple-500 text-white border-purple-600 shadow-lg'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
                }`}
              >
                <Building className="w-6 h-6" />
                Transferencia
              </button>
              <button
                onClick={() => setPaymentMethod('nfc')}
                className={`w-full p-4 rounded-xl font-bold transition-all border-2 flex items-center gap-3 ${
                  paymentMethod === 'nfc'
                    ? 'bg-orange-500 text-white border-orange-600 shadow-lg'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                }`}
              >
                <Wifi className="w-6 h-6" />
                Tarjeta NFC
              </button>
            </div>

            {/* Input de efectivo recibido */}
            {paymentMethod === 'cash' && (
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Efectivo Recibido
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-bold text-lg"
                  autoFocus
                />
                {receivedAmount && parseFloat(receivedAmount) >= totalToCharge && (
                  <div className="mt-3 bg-green-50 border-2 border-green-200 rounded-lg p-3">
                    <div className="text-sm text-green-700">Cambio a devolver:</div>
                    <div className="text-2xl font-bold text-green-600">${change.toFixed(2)}</div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleProcessRecharge}
              className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
            >
              Confirmar Recarga
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
