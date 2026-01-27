import { useState } from 'react';
import { Search, Plus, Package, Filter } from 'lucide-react';
import type { Product } from '@/types/pos';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Obtener categorías únicas
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Barra de búsqueda y filtros */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-md">
        <div className="px-4 pt-2 pb-3 space-y-2.5">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all text-base font-medium"
            />
          </div>

          {/* Filtro de categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-[#EC0000] flex-shrink-0" />
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {category === 'all' ? 'Todos' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Package className="w-16 h-16 mb-3" />
            <p className="text-lg font-medium">No se encontraron productos</p>
            <p className="text-sm">Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                disabled={product.stock === 0}
                className={`group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col min-h-[180px] ${
                  product.stock === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                }`}
              >
                {/* Imagen del producto */}
                <div className="relative h-28 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        AGOTADO
                      </span>
                    </div>
                  )}
                  {product.stock > 0 && product.stock <= 5 && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {product.stock} disp.
                      </span>
                    </div>
                  )}
                </div>

                {/* Información del producto */}
                <div className="flex-1 p-3 flex flex-col">
                  <h3 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-2 flex-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <span className="font-bold text-[#EC0000] text-lg">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] text-white p-1.5 rounded-lg group-hover:shadow-lg group-hover:shadow-red-500/30 transition-all">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
