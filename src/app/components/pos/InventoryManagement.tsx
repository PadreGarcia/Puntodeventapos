import { useState } from 'react';
import { Package, Search, TrendingUp, TrendingDown, X, Save, AlertTriangle, History, Grid3x3, List, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { Product, InventoryMovement, User } from '@/types/pos';
import { validateInventoryAdjustment } from '@/utils/stockValidation';
import { hasPermission, MODULES } from '@/utils/permissions';
import { productService } from '@/services';

interface InventoryManagementProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  currentUser?: User | null;
}

type ViewMode = 'grid' | 'table';
type SortOption = 'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc' | 'status';

export function InventoryManagement({ products, onUpdateProducts, currentUser }: InventoryManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [adjustmentModal, setAdjustmentModal] = useState<{ product: Product; isOpen: boolean } | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  
  // Permisos
  const canEdit = hasPermission(currentUser, MODULES.INVENTORY, 'edit');

  const categories = ['bebidas', 'panadería', 'lácteos', 'frutas', 'abarrotes', 'limpieza', 'snacks', 'cuidado personal'];

  const getStockStatus = (stock: number, minStock?: number) => {
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Sin stock', priority: 0 };
    if (minStock && stock <= minStock) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Stock bajo', priority: 1 };
    return { color: 'text-green-600', bg: 'bg-green-100', label: 'Stock OK', priority: 2 };
  };

  // Filtrar y ordenar productos
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'stock-asc':
          return a.stock - b.stock;
        case 'stock-desc':
          return b.stock - a.stock;
        case 'status':
          const statusA = getStockStatus(a.stock, a.minStock);
          const statusB = getStockStatus(b.stock, b.minStock);
          return statusA.priority - statusB.priority;
        default:
          return 0;
      }
    });

  const handleOpenAdjustment = (product: Product) => {
    // Validar permisos
    if (!canEdit) {
      toast.error('No tienes permisos para ajustar inventario', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    setAdjustmentModal({ product, isOpen: true });
    setAdjustmentValue(0);
    setAdjustmentReason('');
  };

  const handleCloseAdjustment = () => {
    setAdjustmentModal(null);
    setAdjustmentValue(0);
    setAdjustmentReason('');
  };

  const handleSubmitAdjustment = async () => {
    if (!adjustmentModal) return;

    const { product } = adjustmentModal;
    
    // Validación básica
    if (adjustmentValue === 0) {
      toast.error('El ajuste debe ser diferente de cero');
      return;
    }

    if (!adjustmentReason.trim()) {
      toast.error('Debes indicar el motivo del ajuste');
      return;
    }

    // Validar stock usando utilidades
    const adjustmentType = adjustmentValue > 0 ? 'Entrada' : 'Salida';
    const quantity = Math.abs(adjustmentValue);
    
    const validation = validateInventoryAdjustment(product, adjustmentType, quantity);
    
    if (!validation.isValid) {
      toast.error(validation.message || 'Error en el ajuste de inventario', {
        duration: 4000,
      });
      return;
    }
    
    try {
      // Actualizar inventario en el backend
      const updatedProduct = await productService.adjustInventory({
        productId: product.id,
        adjustment: adjustmentValue,
        reason: adjustmentReason,
        notes: `Ajuste de inventario por ${currentUser?.fullName || 'Usuario'}`
      });

      // Crear movimiento para el historial local
      const movement: InventoryMovement = {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        productName: product.name,
        type: adjustmentValue > 0 ? 'Entrada' : 'Salida',
        quantity: Math.abs(adjustmentValue),
        previousStock: product.stock,
        newStock: updatedProduct.stock,
        reason: adjustmentReason,
        timestamp: new Date(),
        user: currentUser?.fullName || 'Usuario'
      };

      setMovements(prev => [movement, ...prev]);

      // Actualizar productos en el estado
      const updatedProducts = products.map(p =>
        p.id === product.id ? updatedProduct : p
      );
      onUpdateProducts(updatedProducts);

      // Mostrar notificación
      toast.success(`Stock ajustado: ${product.name} ${adjustmentValue > 0 ? '+' : ''}${adjustmentValue} unidades`);

      handleCloseAdjustment();
    } catch (error) {
      console.error('Error al ajustar inventario:', error);
      toast.error('Error al ajustar el inventario');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Componente de Card de Producto (Inventario)
  const InventoryCard = ({ 
    product, 
    onAdjust 
  }: { 
    product: Product;
    onAdjust: (product: Product) => void;
  }) => {
    const status = getStockStatus(product.stock, product.minStock);
    
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 active:scale-[0.98]">
        {/* Imagen */}
        <div className="relative h-40 bg-gray-100 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Badge de estado */}
          <div className={`absolute top-2 right-2 ${status.bg} ${status.color} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1`}>
            {product.stock === 0 && <AlertTriangle className="w-3 h-3" />}
            {status.label}
          </div>
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg">
            <span className="text-xs font-bold text-gray-700 capitalize">{product.category}</span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-3">
          {/* Nombre */}
          <h3 className="font-bold text-gray-900 text-lg line-clamp-2 min-h-[3.5rem]">{product.name}</h3>

          {/* Código de barras */}
          {product.barcode && (
            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">{product.barcode}</div>
          )}

          {/* Stock Actual y Mínimo */}
          <div className="grid grid-cols-2 gap-3">
            <div key={`current-stock-${product.id}`} className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-bold uppercase mb-1">Stock Actual</div>
              <div className="text-3xl font-bold text-blue-900">{product.stock}</div>
              <div className="text-xs text-blue-600">unidades</div>
            </div>
            <div key={`min-stock-${product.id}`} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 font-bold uppercase mb-1">Stock Mín.</div>
              <div className="text-3xl font-bold text-gray-900">{product.minStock || 0}</div>
              <div className="text-xs text-gray-600">unidades</div>
            </div>
          </div>

          {/* Botón de Ajuste */}
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              onAdjust(product);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <TrendingUp className="w-5 h-5" />
            Ajustar Inventario
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-40">
        <div className="px-4 pt-2 pb-3 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600 font-medium">
              {filteredProducts.length} de {products.length} productos • {movements.length} movimientos
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle de vista - Solo visible en desktop cuando no se muestra historial */}
              {!showHistory && (
                <div className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#EC0000] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Vista de Cards"
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
                    title="Vista de Tabla"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                  showHistory
                    ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-red-500/30'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:inline">{showHistory ? 'Ocultar' : 'Ver'} Historial</span>
              </button>
            </div>
          </div>

          {/* Búsqueda y Filtros - Una sola línea compacta */}
          {!showHistory && (
            <div className="flex gap-2">
              {/* Búsqueda */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-base font-medium"
                />
              </div>

              {/* Filtro por Categoría */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white capitalize min-w-[140px]"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>

              {/* Ordenamiento */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white min-w-[140px] hidden sm:block"
              >
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="stock-asc">Stock: Menor</option>
                <option value="stock-desc">Stock: Mayor</option>
                <option value="status">Por Estado</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto p-4">
        {!showHistory ? (
          /* Vista de Inventario */
          filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Package className="w-20 h-20 text-gray-300 mb-4" />
              <p className="text-xl font-bold text-gray-900 mb-2">No se encontraron productos</p>
              <p className="text-gray-500">Intenta ajustar los filtros</p>
            </div>
          ) : (
            <>
              {/* Vista de Cards - Móvil/Tablet o cuando está seleccionado en Desktop */}
              <div className={`${viewMode === 'table' ? 'hidden lg:hidden' : 'block lg:block'} ${viewMode === 'grid' && 'lg:block'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <InventoryCard 
                      key={product.id} 
                      product={product}
                      onAdjust={handleOpenAdjustment}
                    />
                  ))}
                </div>
              </div>

              {/* Vista de Tabla - Solo Desktop cuando está seleccionado */}
              {viewMode === 'table' && (
                <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">Producto</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">Categoría</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">Stock Actual</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">Stock Mínimo</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">Estado</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredProducts.map((product) => {
                          const status = getStockStatus(product.stock, product.minStock);
                          return (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                  />
                                  <div>
                                    <div className="font-semibold text-gray-900">{product.name}</div>
                                    {product.barcode && (
                                      <div className="text-xs text-gray-500 font-mono">{product.barcode}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize">
                                  {product.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-2xl font-bold text-gray-900">{product.stock}</span>
                                <span className="text-sm text-gray-500 ml-1">unidades</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-lg font-medium text-gray-600">{product.minStock || 0}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${status.bg} ${status.color} rounded-full text-sm font-bold`}>
                                  {product.stock === 0 && <AlertTriangle className="w-4 h-4" />}
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onMouseDown={() => handleOpenAdjustment(product)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                  Ajustar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          /* Historial de movimientos */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Historial de Movimientos</h3>
              <p className="text-sm text-gray-600 mt-1">Registro completo de ajustes de inventario</p>
            </div>

            {movements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Cantidad</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Stock Anterior</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Stock Nuevo</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(movement.timestamp)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{movement.productName}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                            movement.type === 'Entrada'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {movement.type === 'Entrada' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {movement.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-lg font-bold ${
                            movement.type === 'Entrada' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movement.type === 'Entrada' ? '+' : '-'}{movement.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600 font-medium">
                          {movement.previousStock}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-900 font-bold text-lg">
                          {movement.newStock}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {movement.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No hay movimientos registrados</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de ajuste */}
      {adjustmentModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-2xl font-bold">Ajustar Inventario</h3>
                <p className="text-red-100 mt-1">{adjustmentModal.product.name}</p>
              </div>
              <button
                onClick={handleCloseAdjustment}
                className="p-2.5 hover:bg-white/15 rounded-xl transition-colors border border-transparent hover:border-white/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-5">
              {/* Stock actual */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-600 uppercase">Stock Actual</span>
                  <span className="text-3xl font-bold text-gray-900">{adjustmentModal.product.stock}</span>
                </div>
              </div>

              {/* Campo de ajuste */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ajuste (+ para entrada, - para salida)
                </label>
                <input
                  type="number"
                  value={adjustmentValue === 0 ? '' : adjustmentValue}
                  onChange={(e) => setAdjustmentValue(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-2xl font-bold text-center"
                  placeholder="0"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Motivo del ajuste *
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium resize-none"
                  placeholder="Ej: Llegó proveedor, Merma por caducidad, Error de conteo..."
                />
              </div>

              {/* Vista previa del resultado */}
              {adjustmentValue !== 0 && (
                <div className={`rounded-xl p-4 border-2 ${
                  adjustmentModal.product.stock + adjustmentValue < 0
                    ? 'bg-red-50 border-red-300'
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Stock Resultante</span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-gray-600">{adjustmentModal.product.stock}</span>
                      <span className={`text-xl font-bold ${
                        adjustmentValue > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {adjustmentValue > 0 ? '+' : ''}{adjustmentValue}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        = {adjustmentModal.product.stock + adjustmentValue}
                      </span>
                    </div>
                  </div>
                  {adjustmentModal.product.stock + adjustmentValue < 0 && (
                    <div className="mt-2 flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-bold">Error: El stock no puede ser negativo</span>
                    </div>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAdjustment}
                  className="flex-1 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAdjustment}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-red-500/30 transition-all active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  Guardar Ajuste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
