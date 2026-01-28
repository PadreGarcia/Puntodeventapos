import { useState, useMemo, memo } from 'react';
import { Plus, Search, Edit2, Trash2, X, Save, QrCode, Barcode as BarcodeIcon, Package, AlertTriangle, Printer, Building2, Grid3x3, List, ShieldAlert } from 'lucide-react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { toast } from 'sonner';
import type { Product, Supplier, User } from '@/types/pos';
import { hasPermission, MODULES, validatePriceChange, CASHIER_LIMITS } from '@/utils/permissions';

interface ProductManagementProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  suppliers: Supplier[];
  currentUser?: User | null;
  onNavigateToInventory?: (productId?: string) => void; // Navegar a inventario con producto seleccionado
}

type ViewMode = 'grid' | 'table';
type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';

export function ProductManagement({ products, onUpdateProducts, suppliers, currentUser, onNavigateToInventory }: ProductManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Permisos
  const canCreate = hasPermission(currentUser, MODULES.PRODUCTS, 'create');
  const canEdit = hasPermission(currentUser, MODULES.PRODUCTS, 'edit');
  const canDelete = hasPermission(currentUser, MODULES.PRODUCTS, 'delete');
  const [showCodeModal, setShowCodeModal] = useState<{ product: Product; type: 'qr' | 'barcode' } | null>(null);
  const [printQuantity, setPrintQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    cost: 0,
    category: '',
    stock: 0,
    image: '',
    barcode: '',
    supplierId: '',
    supplierName: '',
    minStock: undefined,
    description: ''
  });

  const categories = ['bebidas', 'panadería', 'lácteos', 'frutas', 'abarrotes', 'limpieza', 'snacks', 'cuidado personal'];

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesSearch = 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const matchesSupplier = selectedSupplier === 'all' || product.supplierId === selectedSupplier;
        
        return matchesSearch && matchesCategory && matchesSupplier;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'stock-asc':
            return a.stock - b.stock;
          case 'stock-desc':
            return b.stock - a.stock;
          default:
            return 0;
        }
      });
  }, [products, searchTerm, selectedCategory, selectedSupplier, sortBy]);

  const generateBarcode = () => {
    // Generar código EAN-13 (12 dígitos + 1 dígito de verificación)
    const randomDigits = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    
    // Calcular dígito de verificación EAN-13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(randomDigits[i]);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return randomDigits + checkDigit;
  };

  const handleOpenForm = (product?: Product) => {
    // Validar permisos
    if (product && !canEdit) {
      toast.error('No tienes permisos para editar productos', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    if (!product && !canCreate) {
      toast.error('No tienes permisos para crear productos', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: 0,
        cost: 0,
        category: categories[0],
        stock: 0,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        barcode: generateBarcode(),
        supplierId: '',
        supplierName: '',
        minStock: undefined,
        description: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      price: 0,
      cost: 0,
      category: '',
      stock: 0,
      image: '',
      barcode: '',
      supplierId: '',
      supplierName: '',
      minStock: undefined,
      description: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      // Editar producto existente
      
      // ✅ VALIDACIÓN: Verificar si es cambio de precio y si está dentro del límite del cajero
      if (formData.price !== editingProduct.price) {
        const validation = validatePriceChange(currentUser, editingProduct.price, formData.price || 0);
        
        if (!validation.valid) {
          toast.error(validation.message || 'No puedes cambiar este precio', {
            duration: 4000,
            icon: <ShieldAlert className="w-5 h-5" />,
          });
          return;
        }
        
        // Si es cajero y el cambio es válido, mostrar advertencia informativa
        if (currentUser?.role === 'cashier' && validation.percentChange) {
          toast.warning(
            `Cambio de precio registrado: ${validation.percentChange > 0 ? '+' : ''}${validation.percentChange.toFixed(1)}% (Límite: ±${CASHIER_LIMITS.MAX_PRICE_CHANGE_PERCENT}%)`,
            { duration: 4000 }
          );
        }
      }
      
      const updatedProducts = products.map(p =>
        p.id === editingProduct.id ? { ...formData, id: editingProduct.id } as Product : p
      );
      onUpdateProducts(updatedProducts);
      toast.success('Producto actualizado correctamente');
    } else {
      // Crear nuevo producto
      
      // ✅ CAJERO NIVEL 2: Informar que el producto será auditado
      if (currentUser?.role === 'cashier') {
        toast.info('Producto agregado. Esta acción será revisada por supervisión.', {
          duration: 3000,
        });
      }
      
      const newProduct: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || '',
        price: formData.price || 0,
        cost: formData.cost,
        category: formData.category || categories[0],
        stock: formData.stock || 0,
        image: formData.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        barcode: formData.barcode || generateBarcode(),
        minStock: formData.minStock,
        description: formData.description,
        supplierId: formData.supplierId,
        supplierName: formData.supplierName
      };
      onUpdateProducts([...products, newProduct]);
      toast.success('Producto creado correctamente');
    }

    handleCloseForm();
  };

  const handleDelete = (productId: string) => {
    // Validar permisos
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar productos', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    if (confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      const product = products.find(p => p.id === productId);
      const updatedProducts = products.filter(p => p.id !== productId);
      onUpdateProducts(updatedProducts);
      toast.success(`Producto "${product?.name}" eliminado correctamente`);
    }
  };

  const handleAdjustInventory = (product: Product) => {
    if (onNavigateToInventory) {
      toast.info(`Navegando a Inventario para ajustar "${product.name}"...`);
      onNavigateToInventory(product.id);
    } else {
      toast.warning('Funcionalidad de ajuste de inventario no disponible en este momento');
    }
  };

  const handleRegenerateBarcode = () => {
    setFormData({ ...formData, barcode: generateBarcode() });
  };

  const handlePrintBarcode = (product: Product, quantity: number) => {
    toast.success(`Imprimiendo ${quantity} código${quantity > 1 ? 's' : ''} de barras de ${product.name}...`);
  };

  const handlePrintQR = (product: Product, quantity: number) => {
    toast.success(`Imprimiendo ${quantity} código${quantity > 1 ? 's' : ''} QR de ${product.name}...`);
  };

  // Componente de Card de Producto
  const ProductCard = memo(({ 
    product, 
    onEdit, 
    onDelete, 
    onShowCode,
    onAdjustInventory,
    canEdit,
    canDelete
  }: { 
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
    onShowCode: (data: { product: Product; type: 'qr' | 'barcode' }) => void;
    onAdjustInventory?: (product: Product) => void;
    canEdit: boolean;
    canDelete: boolean;
  }) => {
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 relative">
        {/* Imagen del producto */}
        <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover pointer-events-none"
          />
          
          {/* Badge de categoría */}
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
            <span className="text-xs font-semibold text-gray-700 capitalize">{product.category}</span>
          </div>
          
          {/* Alerta de stock bajo */}
          {product.minStock !== undefined && product.stock <= product.minStock && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg">
              <AlertTriangle className="w-3 h-3" />
              Stock Bajo
            </div>
          )}
        </div>

        {/* Contenido del card */}
        <div className="p-4 space-y-3">
          {/* Nombre del producto */}
          <h3 className="font-bold text-gray-900 text-base line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>

          {/* Precio y Stock */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Precio</div>
              <div className="text-2xl font-bold text-[#EC0000]">
                ${product.price.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-0.5">Stock</div>
              <div className={`text-xl font-bold ${
                product.minStock !== undefined && product.stock <= product.minStock 
                  ? 'text-red-600' 
                  : 'text-gray-900'
              }`}>
                {product.stock}
              </div>
            </div>
          </div>

          {/* Proveedor */}
          {product.supplierName && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate font-medium">{product.supplierName}</span>
            </div>
          )}

          {/* Código de barras con acciones */}
          {product.barcode && (
            <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg relative z-10">
              <span className="font-mono text-xs text-gray-600 truncate">
                {product.barcode}
              </span>
              <div className="flex gap-1">
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onShowCode({ product, type: 'qr' });
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors pointer-events-auto relative z-20"
                  title="Ver QR"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onShowCode({ product, type: 'barcode' });
                  }}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors pointer-events-auto relative z-20"
                  title="Ver Código de Barras"
                >
                  <BarcodeIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2 border-t border-gray-100 relative z-10">
            {/* Ajustar Inventario */}
            {onAdjustInventory && (
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onAdjustInventory(product);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 active:scale-95 rounded-lg font-semibold text-sm transition-all pointer-events-auto relative z-20"
                title="Ajustar Inventario"
              >
                <Package className="w-4 h-4" />
                <span>Inv</span>
              </button>
            )}
            
            {/* Editar */}
            {canEdit && (
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 rounded-lg font-semibold text-sm transition-all pointer-events-auto relative z-20"
                title="Editar Producto"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </button>
            )}
            
            {/* Eliminar */}
            {canDelete && (
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onDelete(product.id);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 active:scale-95 rounded-lg font-semibold text-sm transition-all pointer-events-auto relative z-20"
                title="Eliminar Producto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-40">
        <div className="px-4 pt-2 pb-3 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600 font-medium">
              {filteredProducts.length} de {products.length} productos
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle de vista - Solo visible en desktop */}
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

              <button
                onClick={() => handleOpenForm()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-red-500/30 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            </div>
          </div>

          {/* Búsqueda y Filtros - Una sola línea compacta */}
          <div className="flex gap-2">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, categoría o código..."
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

            {/* Filtro por Proveedor */}
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white min-w-[140px] hidden sm:block"
            >
              <option value="all">Todos los proveedores</option>
              {suppliers.filter(s => s.status === 'active').map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>

            {/* Ordenamiento */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-sm font-medium bg-white min-w-[140px] hidden md:block"
            >
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="price-asc">Precio: Menor</option>
              <option value="price-desc">Precio: Mayor</option>
              <option value="stock-asc">Stock: Menor</option>
              <option value="stock-desc">Stock: Mayor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 overflow-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Package className="w-20 h-20 text-gray-300 mb-4" />
            <p className="text-xl font-bold text-gray-900 mb-2">No se encontraron productos</p>
            <p className="text-gray-500">Intenta ajustar los filtros o crear un nuevo producto</p>
          </div>
        ) : (
          <>
            {/* Vista de Cards */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    onEdit={handleOpenForm}
                    onDelete={handleDelete}
                    onShowCode={setShowCodeModal}
                    onAdjustInventory={handleAdjustInventory}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))}
              </div>
            )}

            {/* Vista de Tabla */}
            {viewMode === 'table' && (
              <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">Producto</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">Categoría</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">Proveedor</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">Precio</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">Stock</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">Código</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                              />
                              <span className="font-semibold text-gray-900">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {product.supplierName ? (
                              <span className="text-sm text-gray-700 font-medium">{product.supplierName}</span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Sin proveedor</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-[#EC0000] text-lg">${product.price.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">{product.stock}</span>
                              {product.minStock !== undefined && product.stock <= product.minStock && (
                                <AlertTriangle className="w-4 h-4 text-red-500" title="Stock bajo" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {product.barcode ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-gray-600">{product.barcode}</span>
                                <button
                                  onClick={() => setShowCodeModal({ product, type: 'qr' })}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Ver QR"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowCodeModal({ product, type: 'barcode' })}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Ver Código de Barras"
                                >
                                  <BarcodeIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Sin código</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* Ajustar Inventario */}
                              {onNavigateToInventory && (
                                <button
                                  onMouseDown={() => handleAdjustInventory(product)}
                                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Ajustar Inventario"
                                >
                                  <Package className="w-5 h-5" />
                                </button>
                              )}
                              
                              {/* Editar */}
                              {canEdit && (
                                <button
                                  onMouseDown={() => handleOpenForm(product)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                              )}
                              
                              {/* Eliminar */}
                              {canDelete && (
                                <button
                                  onMouseDown={() => handleDelete(product.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
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

      {/* Modal de formulario */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between sticky top-0">
              <h3 className="text-2xl font-bold">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-2.5 hover:bg-white/15 rounded-xl transition-colors border border-transparent hover:border-white/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                  placeholder="Ej: Coca Cola 600ml"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium capitalize"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Proveedor
                </label>
                <select
                  value={formData.supplierId || ''}
                  onChange={(e) => {
                    const supplier = suppliers.find(s => s.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      supplierId: e.target.value || undefined,
                      supplierName: supplier?.name || undefined
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                >
                  <option value="">Sin proveedor asignado</option>
                  {suppliers.filter(s => s.status === 'active').map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {suppliers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay proveedores registrados. Ve a la sección de Compras para crear proveedores.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Costo */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Costo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || undefined })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                    placeholder="0.00"
                  />
                </div>

                {/* Precio */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Precio *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                    placeholder="0.00"
                  />
                </div>

                {/* Stock Inicial */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Stock Inicial *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Código de Barras */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Código de Barras (EAN-13)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-mono"
                    placeholder="7501055300006"
                    maxLength={13}
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateBarcode}
                    className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold transition-colors"
                    title="Generar código automático"
                  >
                    <BarcodeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* URL de imagen */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  URL de Imagen
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                  placeholder="https://..."
                />
              </div>

              {/* Vista previa de imagen */}
              {formData.image && (
                <div className="flex justify-center">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';
                    }}
                  />
                </div>
              )}

              {/* Stock Mínimo */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Stock Mínimo (Punto de Reorden)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStock || ''}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || undefined })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium"
                  placeholder="Ej: 10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se alertará cuando el stock llegue a este nivel
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-medium resize-none"
                  placeholder="Descripción del producto (opcional)"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EC0000] to-[#D50000] hover:from-[#D50000] hover:to-[#C00000] text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-red-500/30 transition-all active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de códigos QR/Barras */}
      {showCodeModal && (
        <div 
          key={`code-modal-${showCodeModal.product.id}-${showCodeModal.type}`}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCodeModal(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">
                {showCodeModal.type === 'qr' ? 'Código QR' : 'Código de Barras'}
              </h3>
              <button
                onClick={() => setShowCodeModal(null)}
                className="p-2 hover:bg-white/15 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex flex-col items-center">
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">{showCodeModal.product.name}</p>
                <p className="text-sm text-gray-600 capitalize">{showCodeModal.product.category}</p>
              </div>

              {showCodeModal.type === 'qr' && showCodeModal.product.barcode && (
                <div key={`qr-${showCodeModal.product.id}`} className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <QRCode value={showCodeModal.product.barcode} size={200} />
                </div>
              )}

              {showCodeModal.type === 'barcode' && showCodeModal.product.barcode && (
                <div key={`barcode-${showCodeModal.product.id}`} className="bg-white p-4 rounded-lg border-2 border-gray-200 overflow-hidden">
                  <Barcode 
                    value={showCodeModal.product.barcode} 
                    width={1.5} 
                    height={80}
                    displayValue={true}
                    margin={10}
                  />
                </div>
              )}

              <div className="text-center">
                <div className="text-sm text-gray-600">Código de Barras</div>
                <div className="font-mono font-bold text-gray-900">{showCodeModal.product.barcode}</div>
              </div>

              {/* Selector de cantidad */}
              <div className="w-full">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cantidad de Etiquetas a Imprimir
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPrintQuantity(Math.max(1, printQuantity - 1))}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={printQuantity}
                    onChange={(e) => setPrintQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-bold text-center text-lg"
                  />
                  <button
                    onClick={() => setPrintQuantity(Math.min(100, printQuantity + 1))}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="w-full space-y-3">
                {showCodeModal.type === 'barcode' ? (
                  <button
                    onClick={() => handlePrintBarcode(showCodeModal.product, printQuantity)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Imprimir {printQuantity} Código{printQuantity > 1 ? 's' : ''} de Barras
                  </button>
                ) : (
                  <button
                    onClick={() => handlePrintQR(showCodeModal.product, printQuantity)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Imprimir {printQuantity} Código{printQuantity > 1 ? 's' : ''} QR
                  </button>
                )}
                
                <button
                  onClick={() => setShowCodeModal(null)}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
