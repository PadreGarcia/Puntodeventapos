import { useState } from 'react';
import { 
  Zap, 
  Droplet, 
  Phone, 
  Wifi, 
  Tv, 
  Flame, 
  Building2, 
  FileText, 
  CreditCard, 
  Play,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  X,
  AlertCircle
} from 'lucide-react';
import type { ServiceProvider, ServicePayment, ServiceCategory, PaymentMethod } from '@/types/pos';

interface ServicesProps {
  onServicePayment: (payment: ServicePayment) => void;
  serviceHistory?: ServicePayment[];
}

const SERVICE_PROVIDERS: ServiceProvider[] = [
  // Energía
  { id: 'cfe', name: 'CFE (Luz)', category: 'energy', commission: 1.5, commissionFixed: 3, minAmount: 50, maxAmount: 50000, referenceLength: 10, active: true, instructions: 'Ingresa el número de servicio de 10 dígitos' },
  
  // Telecomunicaciones
  { id: 'telmex', name: 'Telmex', category: 'telecom', commission: 2, minAmount: 100, maxAmount: 10000, referenceLength: 10, active: true },
  { id: 'telcel', name: 'Telcel', category: 'telecom', commission: 1, minAmount: 20, maxAmount: 5000, requiresPhone: true, active: true },
  { id: 'att', name: 'AT&T', category: 'telecom', commission: 1, minAmount: 20, maxAmount: 5000, requiresPhone: true, active: true },
  { id: 'movistar', name: 'Movistar', category: 'telecom', commission: 1, minAmount: 20, maxAmount: 5000, requiresPhone: true, active: true },
  { id: 'izzi', name: 'Izzi', category: 'telecom', commission: 2, minAmount: 200, maxAmount: 5000, referenceLength: 12, active: true },
  { id: 'totalplay', name: 'Totalplay', category: 'telecom', commission: 2, minAmount: 200, maxAmount: 5000, active: true },
  { id: 'sky', name: 'Sky', category: 'telecom', commission: 2, minAmount: 300, maxAmount: 3000, active: true },
  { id: 'dish', name: 'Dish', category: 'telecom', commission: 2, minAmount: 300, maxAmount: 3000, active: true },
  
  // Agua y Gas
  { id: 'agua_municipal', name: 'Agua Municipal', category: 'water_gas', commission: 1.5, commissionFixed: 5, minAmount: 50, maxAmount: 10000, active: true },
  { id: 'naturgy', name: 'Naturgy (Gas Natural)', category: 'water_gas', commission: 2, minAmount: 100, maxAmount: 10000, active: true },
  
  // Gobierno
  { id: 'predial', name: 'Predial', category: 'government', commission: 0, commissionFixed: 15, minAmount: 100, maxAmount: 100000, active: true },
  { id: 'tenencia', name: 'Tenencia', category: 'government', commission: 0, commissionFixed: 15, minAmount: 100, maxAmount: 50000, active: true },
  { id: 'infracciones', name: 'Infracciones', category: 'government', commission: 0, commissionFixed: 20, minAmount: 100, maxAmount: 50000, active: true },
  
  // Entretenimiento
  { id: 'netflix', name: 'Netflix', category: 'entertainment', commission: 3, minAmount: 139, maxAmount: 299, active: true },
  { id: 'spotify', name: 'Spotify', category: 'entertainment', commission: 3, minAmount: 115, maxAmount: 199, active: true },
  { id: 'disney', name: 'Disney+', category: 'entertainment', commission: 3, minAmount: 159, maxAmount: 249, active: true },
  { id: 'hbo', name: 'HBO Max', category: 'entertainment', commission: 3, minAmount: 149, maxAmount: 199, active: true },
  
  // Financieros
  { id: 'tarjeta_credito', name: 'Tarjetas de Crédito', category: 'financial', commission: 0, commissionFixed: 10, minAmount: 100, maxAmount: 50000, active: true },
];

const CATEGORY_INFO: Record<ServiceCategory, { name: string; icon: any; color: string }> = {
  energy: { name: 'Energía', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  telecom: { name: 'Telecomunicaciones', icon: Phone, color: 'from-blue-500 to-indigo-500' },
  water_gas: { name: 'Agua y Gas', icon: Droplet, color: 'from-cyan-500 to-blue-500' },
  government: { name: 'Gobierno', icon: Building2, color: 'from-purple-500 to-pink-500' },
  entertainment: { name: 'Entretenimiento', icon: Play, color: 'from-red-500 to-pink-500' },
  financial: { name: 'Financieros', icon: CreditCard, color: 'from-green-500 to-emerald-500' },
};

const SERVICE_ICONS: Record<string, any> = {
  cfe: Zap,
  telmex: Phone,
  telcel: Phone,
  att: Phone,
  movistar: Phone,
  izzi: Wifi,
  totalplay: Wifi,
  sky: Tv,
  dish: Tv,
  agua_municipal: Droplet,
  naturgy: Flame,
  predial: FileText,
  tenencia: FileText,
  infracciones: FileText,
  netflix: Play,
  spotify: Play,
  disney: Play,
  hbo: Play,
  tarjeta_credito: CreditCard,
};

export function Services({ onServicePayment, serviceHistory = [] }: ServicesProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'payment' | 'history'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form fields
  const [reference, setReference] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  const filteredProviders = SERVICE_PROVIDERS.filter(provider => {
    const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && provider.active;
  });

  const handleSelectProvider = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setViewMode('payment');
    setReference('');
    setAccountName('');
    setAmount('');
    setCustomerPhone('');
    setCustomerEmail('');
    setNotes('');
  };

  const calculateCommission = (provider: ServiceProvider, amount: number): number => {
    let commission = 0;
    if (provider.commissionFixed) {
      commission += provider.commissionFixed;
    }
    if (provider.commission) {
      commission += (amount * provider.commission) / 100;
    }
    return commission;
  };

  const handleSubmitPayment = () => {
    if (!selectedProvider) return;

    const amountNum = parseFloat(amount);
    const commission = calculateCommission(selectedProvider, amountNum);
    const total = amountNum + commission;

    const payment: ServicePayment = {
      id: `SVC-${Date.now()}`,
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      category: selectedProvider.category,
      reference,
      accountName,
      amount: amountNum,
      commission,
      total,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
      paymentMethod,
      status: 'completed',
      confirmationCode: `CNF${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      timestamp: new Date(),
      processedBy: 'Usuario Actual',
      notes: notes || undefined,
    };

    onServicePayment(payment);
    setViewMode('grid');
    setSelectedProvider(null);
  };

  const isFormValid = (): boolean => {
    if (!selectedProvider) return false;
    if (!reference || reference.trim() === '') return false;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return false;
    
    if (selectedProvider.minAmount && amountNum < selectedProvider.minAmount) return false;
    if (selectedProvider.maxAmount && amountNum > selectedProvider.maxAmount) return false;
    
    if (selectedProvider.referenceLength && reference.length !== selectedProvider.referenceLength) return false;
    
    if (selectedProvider.requiresPhone && (!customerPhone || customerPhone.length < 10)) return false;
    
    return true;
  };

  // Grid View - Lista de proveedores
  if (viewMode === 'grid') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Pago de Servicios</h2>
              <p className="text-base opacity-90">Luz, Agua, Teléfono, Internet y más</p>
            </div>
          </div>
          <button
            onClick={() => setViewMode('history')}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-bold"
          >
            <Clock className="w-5 h-5" />
            <span>Historial</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="w-5 h-5 text-[#EC0000] flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                Todos
              </button>
              {(Object.keys(CATEGORY_INFO) as ServiceCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {CATEGORY_INFO[cat].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {filteredProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <AlertCircle className="w-16 h-16 mb-3" />
              <p className="text-xl font-bold">No se encontraron servicios</p>
              <p className="text-sm">Intenta con otra categoría o término de búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredProviders.map(provider => {
                const Icon = SERVICE_ICONS[provider.id] || Receipt;
                const categoryInfo = CATEGORY_INFO[provider.category];
                
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleSelectProvider(provider)}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col p-5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-2 border-gray-100 hover:border-[#EC0000]"
                  >
                    <div className={`bg-gradient-to-br ${categoryInfo.color} w-16 h-16 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-center mb-1">{provider.name}</h3>
                    <p className="text-xs text-gray-500 text-center mb-2">{categoryInfo.name}</p>
                    {provider.commission > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-1 mt-auto">
                        <p className="text-xs text-green-700 font-bold text-center">
                          Comisión: {provider.commission}%
                          {provider.commissionFixed && ` + $${provider.commissionFixed}`}
                        </p>
                      </div>
                    )}
                    {provider.commissionFixed && provider.commission === 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-1 mt-auto">
                        <p className="text-xs text-green-700 font-bold text-center">
                          Comisión: ${provider.commissionFixed}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Payment View - Formulario de pago
  if (viewMode === 'payment' && selectedProvider) {
    const Icon = SERVICE_ICONS[selectedProvider.id] || Receipt;
    const categoryInfo = CATEGORY_INFO[selectedProvider.category];
    
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${categoryInfo.color} text-white p-6`}>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('grid');
                  setSelectedProvider(null);
                }}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <Icon className="w-10 h-10" />
              <div>
                <h3 className="text-3xl font-bold">{selectedProvider.name}</h3>
                <p className="text-base opacity-90">{categoryInfo.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
              {selectedProvider.instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900 font-medium">{selectedProvider.instructions}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Número de Referencia / Servicio *
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={selectedProvider.referenceLength ? `${selectedProvider.referenceLength} dígitos` : 'Ingresa la referencia'}
                  maxLength={selectedProvider.referenceLength}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-mono text-lg"
                />
                {selectedProvider.referenceLength && (
                  <p className="text-xs text-gray-500 mt-1">
                    {reference.length}/{selectedProvider.referenceLength} dígitos
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del Titular (Opcional)
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Nombre del titular del servicio"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Monto a Pagar *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min={selectedProvider.minAmount}
                    max={selectedProvider.maxAmount}
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-lg font-bold"
                  />
                </div>
                {selectedProvider.minAmount && selectedProvider.maxAmount && (
                  <p className="text-xs text-gray-500 mt-1">
                    Monto válido: ${selectedProvider.minAmount} - ${selectedProvider.maxAmount.toLocaleString()}
                  </p>
                )}
              </div>

              {selectedProvider.requiresPhone && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Número de Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10 dígitos"
                    maxLength={10}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-mono"
                  />
                </div>
              )}

              {selectedProvider.requiresEmail && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Método de Pago *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tarjeta
                  </button>
                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      paymentMethod === 'transfer'
                        ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Transfer.
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agrega notas adicionales..."
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all resize-none"
                />
              </div>

              {/* Summary */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 border-2 border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Monto del servicio:</span>
                    <span className="font-bold text-gray-900">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Comisión:</span>
                    <span className="font-bold text-green-600">
                      +${calculateCommission(selectedProvider, parseFloat(amount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">TOTAL A COBRAR:</span>
                    <span className="text-2xl font-bold text-[#EC0000]">
                      ${(parseFloat(amount) + calculateCommission(selectedProvider, parseFloat(amount))).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  setViewMode('grid');
                  setSelectedProvider(null);
                }}
                className="flex-1 px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all text-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={!isFormValid()}
                className={`flex-1 px-8 py-4 rounded-xl font-bold transition-all text-lg ${
                  isFormValid()
                    ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white hover:shadow-xl hover:scale-105 active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Procesar Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // History View - Historial de servicios pagados
  if (viewMode === 'history') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('grid')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <Clock className="w-8 h-8" />
              <div>
                <h3 className="text-3xl font-bold">Historial de Servicios</h3>
                <p className="text-base opacity-90">Servicios pagados recientemente</p>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {serviceHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Receipt className="w-20 h-20 mb-4" />
                <p className="text-2xl font-bold">Sin servicios pagados</p>
                <p className="text-base mt-2">El historial aparecerá aquí</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {serviceHistory.map(service => (
                  <div key={service.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-[#EC0000] hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-lg">{service.providerName}</h4>
                        {service.status === 'completed' && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {service.status === 'failed' && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Referencia:</span> {service.reference}
                      </p>
                      {service.accountName && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Titular:</span> {service.accountName}
                        </p>
                      )}
                      {service.confirmationCode && (
                        <p className="text-sm text-green-600 font-mono bg-green-50 px-2 py-1 rounded">
                          <span className="font-semibold">Código:</span> {service.confirmationCode}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-end justify-between pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        {new Date(service.timestamp).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-2xl font-bold text-[#EC0000]">
                        ${service.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
