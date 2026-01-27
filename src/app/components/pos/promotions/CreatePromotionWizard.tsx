import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Percent, ShoppingBag, Settings, Calendar, Eye, Search, X, BarChart3, DollarSign, Gift, Package, TrendingUp, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { PromotionSummary } from './PromotionSummary';
import type { Promotion, PromotionType, Product, Customer } from '@/types/pos';

interface CreatePromotionWizardProps {
  products: Product[];
  customers: Customer[];
  onComplete: (promotion: Promotion) => void;
  onCancel: () => void;
}

const PROMOTION_TYPES = [
  { 
    id: 'percentage_discount' as PromotionType, 
    name: 'Descuento Porcentual', 
    description: '10% de descuento, 20% off, etc.',
    example: 'Ejemplo: 15% de descuento en toda la tienda',
    icon: BarChart3,
    color: 'blue'
  },
  { 
    id: 'fixed_discount' as PromotionType, 
    name: 'Descuento Fijo', 
    description: '$100 de descuento',
    example: 'Ejemplo: $50 de descuento en compras mayores a $300',
    icon: DollarSign,
    color: 'green'
  },
  { 
    id: 'buy_x_get_y' as PromotionType, 
    name: 'Compra X Lleva Y', 
    description: '2x1, 3x2, Compra 2 lleva 3',
    example: 'Ejemplo: Compra 2 lleva 3 en productos seleccionados',
    icon: Gift,
    color: 'purple'
  },
  { 
    id: 'combo' as PromotionType, 
    name: 'Combo/Paquete', 
    description: 'Conjunto de productos a precio especial',
    example: 'Ejemplo: Combo desayuno: café + pan + jugo = $50',
    icon: Package,
    color: 'orange'
  },
  { 
    id: 'volume_discount' as PromotionType, 
    name: 'Descuento por Volumen', 
    description: 'Descuento progresivo por cantidad',
    example: 'Ejemplo: Compra 5+ unidades y recibe 10% de descuento',
    icon: TrendingUp,
    color: 'teal'
  },
  { 
    id: 'special_price' as PromotionType, 
    name: 'Precio Especial', 
    description: 'Precio temporal rebajado',
    example: 'Ejemplo: Producto normalmente $100 ahora $79',
    icon: Tag,
    color: 'pink'
  },
];

export function CreatePromotionWizard({ products, customers, onComplete, onCancel }: CreatePromotionWizardProps) {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingList, setEditingList] = useState<'buy' | 'free'>('buy'); // Para buy_x_get_y
  const [formData, setFormData] = useState({
    // Paso 1: Tipo
    type: '' as PromotionType,
    
    // Paso 2: Productos
    productIds: [] as string[], // Productos que se compran (o todos los productos para otros tipos)
    freeProductIds: [] as string[], // Solo para buy_x_get_y: productos que se llevan gratis
    applyToAll: false,
    
    // Paso 3: Condiciones
    minQuantity: '',
    minAmount: '',
    buyQuantity: '',
    getQuantity: '',
    
    // Paso 4: Beneficio
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    specialPrice: '',
    
    // Paso 5: Configuración
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    requiresCoupon: false,
    couponCode: '',
    priority: '1'
  });

  const steps = [
    { number: 1, title: 'Tipo de Promoción', icon: Percent },
    { number: 2, title: 'Productos', icon: ShoppingBag },
    { number: 3, title: 'Condiciones', icon: Settings },
    { number: 4, title: 'Beneficio', icon: Check },
    { number: 5, title: 'Configuración Final', icon: Calendar },
    { number: 6, title: 'Vista Previa', icon: Eye },
  ];

  // Determinar qué pasos necesita este tipo de promoción
  const needsConditionsStep = () => {
    return !['combo', 'special_price'].includes(formData.type);
  };

  const needsBenefitStep = () => {
    return formData.type !== 'buy_x_get_y';
  };

  // Extraer categorías únicas
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtrar productos por búsqueda y categoría
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleNext = () => {
    // Validaciones por paso
    if (step === 1 && !formData.type) {
      toast.error('⚠️ Por favor selecciona un tipo de promoción');
      return;
    }
    if (step === 2) {
      if (formData.type === 'buy_x_get_y') {
        if (formData.productIds.length === 0) {
          toast.error('⚠️ Selecciona al menos un producto que el cliente debe comprar');
          return;
        }
        if (formData.freeProductIds.length === 0) {
          toast.error('⚠️ Selecciona al menos un producto que el cliente se lleva gratis');
          return;
        }
      } else {
        if (formData.productIds.length === 0) {
          toast.error('⚠️ Selecciona al menos un producto para la promoción');
          return;
        }
      }
    }
    if (step === 3) {
      // Validar campos requeridos según tipo
      if (formData.type === 'buy_x_get_y') {
        if (!formData.buyQuantity || parseInt(formData.buyQuantity) < 1) {
          toast.error('⚠️ Define cuántos productos debe comprar el cliente');
          return;
        }
        if (!formData.getQuantity || parseInt(formData.getQuantity) < 1) {
          toast.error('⚠️ Define cuántos productos gratis recibirá');
          return;
        }
      }
      if (formData.type === 'volume_discount') {
        if (!formData.minQuantity || parseInt(formData.minQuantity) < 2) {
          toast.error('⚠️ Define la cantidad mínima (debe ser 2 o más)');
          return;
        }
      }
      if (formData.type === 'fixed_discount') {
        if (!formData.minAmount || parseFloat(formData.minAmount) <= 0) {
          toast.error('⚠️ Define el monto mínimo de compra para el descuento fijo');
          return;
        }
      }
    }
    if (step === 4) {
      // Validar beneficio según tipo
      if (formData.type === 'special_price') {
        if (!formData.specialPrice || parseFloat(formData.specialPrice) <= 0) {
          toast.error('⚠️ Define un precio especial válido');
          return;
        }
      } else if (formData.type === 'combo') {
        if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
          toast.error('⚠️ Define el precio del combo');
          return;
        }
      } else if (formData.type === 'percentage_discount' || formData.type === 'volume_discount') {
        if (!formData.discountValue || parseFloat(formData.discountValue) <= 0 || parseFloat(formData.discountValue) > 100) {
          toast.error('⚠️ Define un porcentaje válido (1-100)');
          return;
        }
      } else if (formData.type === 'fixed_discount') {
        if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
          toast.error('⚠️ Define un monto de descuento válido');
          return;
        }
      }
    }
    if (step === 5) {
      // Validar configuración final
      if (!formData.name.trim()) {
        toast.error('⚠️ Ingresa un nombre para la promoción');
        return;
      }
    }
    if (step === 6) {
      handleCreate();
      return;
    }
    
    // Saltar pasos innecesarios
    let nextStep = step + 1;
    
    // Si estamos en paso 2 y el tipo no necesita condiciones, saltar al 4
    if (step === 2 && !needsConditionsStep()) {
      nextStep = 4;
    }
    
    // Si estamos en paso 3 y el tipo no necesita beneficio, saltar al 5
    if (step === 3 && !needsBenefitStep()) {
      nextStep = 5;
    }
    
    // Si estamos en paso 2, tipo buy_x_get_y (tiene condiciones pero no beneficio), va a 3
    // luego de 3 salta a 5
    
    setStep(nextStep);
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Ingresa un nombre para la promoción');
      return;
    }

    const promotion: Promotion = {
      id: `promo-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
      status: 'active',
      priority: parseInt(formData.priority) || 1,
      
      productIds: formData.productIds,
      freeProductIds: formData.type === 'buy_x_get_y' ? formData.freeProductIds : undefined,
      applyToAll: false,
      
      minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : undefined,
      minAmount: formData.minAmount ? parseFloat(formData.minAmount) : undefined,
      buyQuantity: formData.buyQuantity ? parseInt(formData.buyQuantity) : undefined,
      getQuantity: formData.getQuantity ? parseInt(formData.getQuantity) : undefined,
      
      discountType: formData.discountType,
      discountValue: formData.discountValue ? parseFloat(formData.discountValue) : undefined,
      specialPrice: formData.specialPrice ? parseFloat(formData.specialPrice) : undefined,
      
      requiresCoupon: formData.requiresCoupon,
      couponCode: formData.requiresCoupon ? formData.couponCode.trim().toUpperCase() : undefined,
      
      currentUsage: 0,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      
      createdBy: 'Admin',
      createdAt: new Date(),
      lastModified: new Date()
    };

    onComplete(promotion);
    toast.success('Promoción creada exitosamente');
  };

  const toggleProduct = (productId: string, listType: 'buy' | 'free' = 'buy') => {
    if (listType === 'buy') {
      setFormData({
        ...formData,
        productIds: formData.productIds.includes(productId)
          ? formData.productIds.filter(id => id !== productId)
          : [...formData.productIds, productId]
      });
    } else {
      setFormData({
        ...formData,
        freeProductIds: formData.freeProductIds.includes(productId)
          ? formData.freeProductIds.filter(id => id !== productId)
          : [...formData.freeProductIds, productId]
      });
    }
  };

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto">
        {/* Steps Header */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => {
              const Icon = typeof s.icon === 'string' ? null : s.icon;
              return (
                <div key={s.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all ${
                      step > s.number ? 'bg-green-500 text-white' :
                      step === s.number ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s.number ? <Check className="w-4 h-4" /> : 
                       Icon ? <Icon className="w-4 h-4" /> : s.icon}
                    </div>
                    <div className={`text-[10px] font-bold mt-1 text-center leading-tight ${
                      step === s.number ? 'text-[#EC0000]' : 'text-gray-500'
                    }`}>
                      {s.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 rounded ${
                      step > s.number ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 mb-4">
          {/* Step 1: Tipo */}
          {step === 1 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Selecciona el Tipo de Promoción</h3>
              <p className="text-gray-600 font-medium mb-4">Elige el tipo de oferta que deseas crear</p>
              
              {!formData.type && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <p className="text-sm font-bold text-blue-900">
                    👆 Haz clic en una de las opciones para continuar
                  </p>
                </div>
              )}

              {formData.type && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-bold text-green-900">
                    Tipo seleccionado: {PROMOTION_TYPES.find(t => t.id === formData.type)?.name}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROMOTION_TYPES.map(type => {
                  const isSelected = formData.type === type.id;
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      className={`relative p-5 rounded-xl border-3 text-left transition-all duration-200 hover:scale-105 ${
                        isSelected
                          ? 'border-[#EC0000] bg-gradient-to-br from-red-50 to-red-100 shadow-2xl shadow-red-500/40 scale-105'
                          : 'border-gray-300 bg-white hover:border-[#EC0000] hover:shadow-lg'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#EC0000] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                      
                      <div className={`mb-3 inline-flex p-2.5 rounded-lg ${
                        isSelected ? 'bg-[#EC0000]' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      
                      <h4 className={`text-base font-bold mb-1.5 ${
                        isSelected ? 'text-[#EC0000]' : 'text-gray-900'
                      }`}>{type.name}</h4>
                      
                      <p className={`text-xs font-medium mb-2 ${
                        isSelected ? 'text-red-700' : 'text-gray-600'
                      }`}>{type.description}</p>
                      
                      <p className={`text-xs italic ${
                        isSelected ? 'text-red-600' : 'text-gray-500'
                      }`}>{type.example}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Productos */}
          {step === 2 && (
            <div>
              {formData.type === 'buy_x_get_y' ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Define la Promoción 2x1 / 3x2</h3>
                  <p className="text-gray-600 font-medium mb-4">Selecciona qué compra y qué se lleva gratis</p>

                  {/* Tabs para cambiar entre listas */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setEditingList('buy')}
                      className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                        editingList === 'buy'
                          ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-sm mb-1">🛒 Productos a Comprar</div>
                      <div className="text-xs opacity-80">{formData.productIds.length} seleccionados</div>
                    </button>
                    <button
                      onClick={() => setEditingList('free')}
                      className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                        editingList === 'free'
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-sm mb-1">🎁 Productos Gratis</div>
                      <div className="text-xs opacity-80">{formData.freeProductIds.length} seleccionados</div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Selecciona los Productos</h3>
                  <p className="text-gray-600 font-medium mb-4">¿A qué productos aplica esta promoción?</p>
                </>
              )}

              {/* Buscador */}
              <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre o código..."
                        className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#EC0000] focus:outline-none font-medium"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
              </div>

              {/* Filtros por Categoría */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-md'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {cat === 'all' ? 'Todas' : cat}
                  </button>
                ))}
              </div>

              {/* Lista de Productos */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-auto border-2 border-gray-100 rounded-lg p-2">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => {
                    const currentList = formData.type === 'buy_x_get_y' ? editingList : 'buy';
                    const isSelected = currentList === 'buy' 
                      ? formData.productIds.includes(product.id)
                      : formData.freeProductIds.includes(product.id);
                    
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggleProduct(product.id, currentList)}
                        className={`p-3 rounded-lg border-2 text-left transition-all relative overflow-hidden ${
                          isSelected
                            ? (currentList === 'buy' ? 'border-[#EC0000] bg-red-50' : 'border-green-600 bg-green-50')
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {/* Imagen del Producto */}
                        <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Información del Producto */}
                        <div className="font-bold text-gray-900 mb-1 text-sm truncate">{product.name}</div>
                        <div className="text-xs text-gray-500 mb-1">{product.category}</div>
                        <div className="text-sm font-bold text-gray-700">${product.price.toFixed(2)}</div>
                        
                        {/* Badge de Seleccionado */}
                        {isSelected && (
                          <div className={`absolute top-2 right-2 text-white rounded-full w-6 h-6 flex items-center justify-center ${
                            currentList === 'buy' ? 'bg-[#EC0000]' : 'bg-green-600'
                          }`}>
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No se encontraron productos</p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                {formData.type === 'buy_x_get_y' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-gray-700">
                        🛒 Productos a comprar: {formData.productIds.length}
                      </div>
                      {formData.productIds.length > 0 && (
                        <button
                          onClick={() => setFormData({ ...formData, productIds: [] })}
                          className="text-xs font-bold text-[#EC0000] hover:underline"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-gray-700">
                        🎁 Productos gratis: {formData.freeProductIds.length}
                      </div>
                      {formData.freeProductIds.length > 0 && (
                        <button
                          onClick={() => setFormData({ ...formData, freeProductIds: [] })}
                          className="text-xs font-bold text-green-600 hover:underline"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-700">
                      Productos seleccionados: {formData.productIds.length}
                    </div>
                    {formData.productIds.length > 0 && (
                      <button
                        onClick={() => setFormData({ ...formData, productIds: [] })}
                        className="text-xs font-bold text-[#EC0000] hover:underline"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Condiciones */}
          {step === 3 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {formData.type === 'buy_x_get_y' ? 'Configura las Cantidades' : 
                 formData.type === 'volume_discount' ? 'Cantidad Mínima para Descuento' :
                 'Condiciones de Aplicación'}
              </h3>
              <p className="text-gray-600 font-medium mb-6">
                {formData.type === 'buy_x_get_y' ? 'Define cuántos debe comprar y cuántos se lleva gratis' :
                 formData.type === 'volume_discount' ? 'Establece desde qué cantidad aplica el descuento' :
                 formData.type === 'fixed_discount' ? 'Define el monto mínimo de compra (recomendado)' :
                 'Opcional: Define cuándo se aplica la promoción'}
              </p>

              <div className="space-y-4">
                {/* TIPO: Compra X Lleva Y */}
                {formData.type === 'buy_x_get_y' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Cantidad a Comprar
                        </label>
                        <input
                          type="number"
                          value={formData.buyQuantity}
                          onChange={(e) => setFormData({ ...formData, buyQuantity: e.target.value })}
                          placeholder="Ej: 2"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Cantidad Gratis/Bonus
                        </label>
                        <input
                          type="number"
                          value={formData.getQuantity}
                          onChange={(e) => setFormData({ ...formData, getQuantity: e.target.value })}
                          placeholder="Ej: 1"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                      <p className="text-sm font-medium text-blue-900">
                        Ejemplo: Compra <span className="font-bold">{formData.buyQuantity || '2'}</span> y lleva <span className="font-bold">{formData.getQuantity || '1'}</span> gratis
                      </p>
                    </div>
                  </>
                )}

                {/* TIPO: Descuento por Volumen */}
                {formData.type === 'volume_discount' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Cantidad Mínima para Descuento *
                      </label>
                      <input
                        type="number"
                        value={formData.minQuantity}
                        onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                        placeholder="Ej: 5"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium text-2xl"
                      />
                      <p className="text-sm text-gray-500 mt-2">El descuento aplica al comprar esta cantidad o más</p>
                    </div>
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                      <p className="text-sm font-medium text-blue-900">
                        Ejemplo: Al comprar <span className="font-bold">{formData.minQuantity || '5'}+</span> unidades, se aplicará el descuento configurado
                      </p>
                    </div>
                  </>
                )}

                {/* TIPO: Descuento Fijo - Monto mínimo casi obligatorio */}
                {formData.type === 'fixed_discount' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Monto Mínimo de Compra *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.minAmount}
                        onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                        placeholder="Ej: 500.00"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium text-2xl"
                      />
                      <p className="text-sm text-gray-500 mt-2">La promoción solo aplica si el total supera este monto</p>
                    </div>
                    <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                      <p className="text-sm font-medium text-yellow-900">
                        💡 Tip: Para descuentos fijos es recomendable establecer un monto mínimo
                      </p>
                    </div>
                  </>
                )}

                {/* TIPO: Descuento Porcentual - Condiciones opcionales */}
                {formData.type === 'percentage_discount' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Monto Mínimo de Compra (Opcional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.minAmount}
                        onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                        placeholder="Ej: 100.00"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                      />
                      <p className="text-xs text-gray-500 mt-1">Deja en blanco si no requiere monto mínimo</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Cantidad Mínima (Opcional)
                      </label>
                      <input
                        type="number"
                        value={formData.minQuantity}
                        onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                        placeholder="Ej: 2"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                      />
                      <p className="text-xs text-gray-500 mt-1">Deja en blanco si no requiere cantidad mínima</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Beneficio */}
          {step === 4 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {formData.type === 'special_price' ? 'Define el Precio Especial' :
                 formData.type === 'combo' ? 'Precio del Combo' :
                 'Define el Descuento'}
              </h3>
              <p className="text-gray-600 font-medium mb-6">
                {formData.type === 'special_price' ? 'Establece el precio temporal para los productos seleccionados' :
                 formData.type === 'combo' ? 'Define el precio total del paquete/combo' :
                 'Configura el valor del descuento a aplicar'}
              </p>

              {formData.type === 'special_price' ? (
                /* TIPO: Precio Especial */
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Precio Especial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.specialPrice}
                    onChange={(e) => setFormData({ ...formData, specialPrice: e.target.value })}
                    placeholder="Ej: 79.99"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium text-2xl"
                  />
                  <p className="text-sm text-gray-500 mt-2">Los productos seleccionados se venderán a este precio durante la vigencia de la promoción</p>
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <p className="text-sm font-medium text-blue-900">
                      💡 El precio especial reemplaza temporalmente el precio original del producto
                    </p>
                  </div>
                </div>
              ) : formData.type === 'combo' ? (
                /* TIPO: Combo */
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Precio Total del Combo *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder="Ej: 150.00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium text-2xl"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Precio total al comprar todos los productos del combo juntos
                  </p>
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <p className="text-sm font-medium text-green-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      El cliente paga este precio fijo por todo el combo en lugar de los precios individuales
                    </p>
                  </div>
                </div>
              ) : (
                /* TIPOS: Porcentual, Fijo y Volumen */
                <div className="space-y-4">
                  {/* Descuento Porcentual o Volumen - Solo mostrar % */}
                  {(formData.type === 'percentage_discount' || formData.type === 'volume_discount') && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Porcentaje de Descuento *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discountValue}
                          onChange={(e) => {
                            setFormData({ ...formData, discountValue: e.target.value, discountType: 'percentage' });
                          }}
                          placeholder="Ej: 15"
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium text-2xl"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">%</div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {formData.type === 'volume_discount' 
                          ? 'Se aplicará este porcentaje al comprar la cantidad mínima definida'
                          : 'Se aplicará este porcentaje sobre el precio de los productos seleccionados'}
                      </p>
                    </div>
                  )}

                  {/* Descuento Fijo - Solo mostrar $ */}
                  {formData.type === 'fixed_discount' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Monto Fijo de Descuento *
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</div>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discountValue}
                          onChange={(e) => {
                            setFormData({ ...formData, discountValue: e.target.value, discountType: 'fixed' });
                          }}
                          placeholder="Ej: 100.00"
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium text-2xl"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Se descontará esta cantidad fija del total de la compra
                      </p>
                    </div>
                  )}

                  {/* Selector de tipo antiguo - solo para compatibilidad si es necesario */}
                  {!['percentage_discount', 'fixed_discount', 'volume_discount'].includes(formData.type) && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Selecciona el Tipo de Descuento</label>
                        <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                        className={`relative p-8 rounded-2xl border-3 transition-all text-center ${
                          formData.discountType === 'percentage'
                            ? 'border-[#EC0000] bg-gradient-to-br from-red-50 to-red-100 shadow-xl shadow-red-500/30'
                            : 'border-gray-300 bg-white hover:border-[#EC0000] hover:shadow-lg'
                        }`}
                      >
                        <div className={`text-4xl font-black mb-2 ${
                          formData.discountType === 'percentage' ? 'text-[#EC0000]' : 'text-gray-900'
                        }`}>
                          %
                        </div>
                        <p className={`text-2xl font-bold mb-2 ${
                          formData.discountType === 'percentage' ? 'text-[#EC0000]' : 'text-gray-900'
                        }`}>
                          Porcentaje
                        </p>
                        <p className={`text-sm font-medium ${
                          formData.discountType === 'percentage' ? 'text-red-700' : 'text-gray-500'
                        }`}>
                          Descuento en %
                        </p>
                        <p className="text-xs text-gray-600 mt-3">Ej: 10%, 25%, 50% off</p>
                        {formData.discountType === 'percentage' && (
                          <div className="absolute top-4 right-4">
                            <div className="w-8 h-8 bg-[#EC0000] rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                        className={`relative p-8 rounded-2xl border-3 transition-all text-center ${
                          formData.discountType === 'fixed'
                            ? 'border-[#EC0000] bg-gradient-to-br from-red-50 to-red-100 shadow-xl shadow-red-500/30'
                            : 'border-gray-300 bg-white hover:border-[#EC0000] hover:shadow-lg'
                        }`}
                      >
                        <div className={`text-4xl font-black mb-2 ${
                          formData.discountType === 'fixed' ? 'text-[#EC0000]' : 'text-gray-900'
                        }`}>
                          $
                        </div>
                        <p className={`text-2xl font-bold mb-2 ${
                          formData.discountType === 'fixed' ? 'text-[#EC0000]' : 'text-gray-900'
                        }`}>
                          Monto Fijo
                        </p>
                        <p className={`text-sm font-medium ${
                          formData.discountType === 'fixed' ? 'text-red-700' : 'text-gray-500'
                        }`}>
                          Descuento en $
                        </p>
                        <p className="text-xs text-gray-600 mt-3">Ej: $50, $100, $200</p>
                        {formData.discountType === 'fixed' && (
                          <div className="absolute top-4 right-4">
                            <div className="w-8 h-8 bg-[#EC0000] rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {formData.discountType === 'percentage' ? 'Porcentaje de Descuento' : 'Monto de Descuento'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discountValue}
                          onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                          placeholder={formData.discountType === 'percentage' ? 'Ej: 15' : 'Ej: 50.00'}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-bold text-3xl text-center"
                        />
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">
                          {formData.discountType === 'percentage' ? '%' : '$'}
                        </div>
                      </div>
                    </div>

                    {formData.discountValue && (
                      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <p className="text-sm font-medium text-blue-900">
                          Preview: Un producto de $100 quedaría en{' '}
                          <span className="font-bold">
                            ${formData.discountType === 'percentage' 
                              ? (100 - (100 * parseFloat(formData.discountValue) / 100)).toFixed(2)
                              : (100 - parseFloat(formData.discountValue)).toFixed(2)
                            }
                          </span>
                        </p>
                      </div>
                    )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Configuración */}
          {step === 5 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Configuración Final</h3>
              <p className="text-gray-600 font-medium mb-6">Nombre, vigencia y opciones adicionales</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nombre de la Promoción *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Super Oferta de Verano 2026"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción de la promoción para mostrar a los clientes"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Fecha de Fin (Opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresCoupon}
                      onChange={(e) => setFormData({ ...formData, requiresCoupon: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="font-bold text-yellow-900">
                      Requiere código de cupón
                    </span>
                  </label>
                </div>

                {formData.requiresCoupon && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Código del Cupón
                    </label>
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                      placeholder="VERANO2026"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-bold text-lg uppercase"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Vista Previa */}
          {step === 6 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Vista Previa de la Promoción</h3>
              <p className="text-gray-600 font-medium mb-6">Revisa todos los detalles antes de crear la promoción</p>

              <PromotionSummary 
                promotion={{
                  ...formData,
                  type: formData.type as PromotionType,
                  discountValue: formData.discountValue ? parseFloat(formData.discountValue) : undefined,
                  specialPrice: formData.specialPrice ? parseFloat(formData.specialPrice) : undefined,
                  minAmount: formData.minAmount ? parseFloat(formData.minAmount) : undefined,
                  minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : undefined,
                  buyQuantity: formData.buyQuantity ? parseInt(formData.buyQuantity) : undefined,
                  getQuantity: formData.getQuantity ? parseInt(formData.getQuantity) : undefined,
                }}
                products={products}
              />

              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Haz clic en "Crear Promoción" para guardar esta configuración
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 1) {
                onCancel();
                return;
              }
              
              // Retroceder respetando los saltos
              let prevStep = step - 1;
              
              // Si estamos en paso 4 y el tipo no necesita condiciones, volver a 2
              if (step === 4 && !needsConditionsStep()) {
                prevStep = 2;
              }
              
              // Si estamos en paso 5 y el tipo no necesita beneficio, buscar el paso anterior válido
              if (step === 5 && !needsBenefitStep()) {
                prevStep = needsConditionsStep() ? 3 : 2;
              }
              
              setStep(prevStep);
            }}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2 text-sm"
          >
            {step === 6 ? (
              <>
                <Check className="w-4 h-4" />
                Crear Promoción
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
