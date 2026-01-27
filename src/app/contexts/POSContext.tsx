import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { Product, CartItem, Sale, Customer } from '@/types/pos';

interface POSContextType {
  // Productos
  products: Product[];
  loadingProducts: boolean;
  loadProducts: () => Promise<void>;
  addProduct: (product: Partial<Product>) => Promise<boolean>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  getProductByBarcode: (barcode: string) => Promise<Product | null>;
  adjustInventory: (productId: string, adjustment: number, reason: string) => Promise<boolean>;
  
  // Carrito
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // Ventas
  sales: Sale[];
  loadingSales: boolean;
  loadSales: () => Promise<void>;
  createSale: (sale: Partial<Sale>) => Promise<Sale | null>;
  cancelSale: (saleId: string) => Promise<boolean>;
  
  // Clientes
  customers: Customer[];
  loadingCustomers: boolean;
  loadCustomers: () => Promise<void>;
  getCustomerByNFC: (nfcId: string) => Promise<Customer | null>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Cargar productos desde el backend
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await api.getProducts();
      if (response.success) {
        // Mapear _id de MongoDB a id para compatibilidad con el frontend
        const mappedProducts = response.data.map(p => ({
          ...p,
          id: p._id || p.id
        }));
        setProducts(mappedProducts);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar productos');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Agregar producto
  const addProduct = useCallback(async (product: Partial<Product>) => {
    try {
      const response = await api.createProduct(product);
      if (response.success) {
        const mappedProduct = {
          ...response.data,
          id: response.data._id || response.data.id
        };
        setProducts(prev => [mappedProduct, ...prev]);
        toast.success('Producto creado exitosamente');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Error al crear producto');
      return false;
    }
  }, []);

  // Actualizar producto
  const updateProduct = useCallback(async (id: string, product: Partial<Product>) => {
    try {
      const response = await api.updateProduct(id, product);
      if (response.success) {
        const mappedProduct = {
          ...response.data,
          id: response.data._id || response.data.id
        };
        setProducts(prev => prev.map(p => p.id === id ? mappedProduct : p));
        toast.success('Producto actualizado exitosamente');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar producto');
      return false;
    }
  }, []);

  // Eliminar producto
  const deleteProduct = useCallback(async (id: string) => {
    try {
      const response = await api.deleteProduct(id);
      if (response.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('Producto eliminado exitosamente');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar producto');
      return false;
    }
  }, []);

  // Buscar producto por código de barras
  const getProductByBarcode = useCallback(async (barcode: string) => {
    try {
      const response = await api.getProductByBarcode(barcode);
      if (response.success) {
        return {
          ...response.data,
          id: response.data._id || response.data.id
        };
      }
      return null;
    } catch (error: any) {
      toast.error(error.message || 'Producto no encontrado');
      return null;
    }
  }, []);

  // Ajustar inventario
  const adjustInventory = useCallback(async (productId: string, adjustment: number, reason: string) => {
    try {
      const response = await api.adjustInventory(productId, adjustment, reason);
      if (response.success) {
        const updatedProduct = {
          ...response.data,
          id: response.data._id || response.data.id
        };
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        toast.success(`Inventario ajustado: ${adjustment > 0 ? '+' : ''}${adjustment} unidades`);
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Error al ajustar inventario');
      return false;
    }
  }, []);

  // Agregar al carrito
  const addToCart = useCallback((product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Verificar stock
        if (existingItem.quantity + 1 > product.stock) {
          toast.error(`Solo hay ${product.stock} unidades disponibles`);
          return prevItems;
        }
        
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Verificar stock
        if (product.stock < 1) {
          toast.error('Producto sin stock disponible');
          return prevItems;
        }
        
        toast.success(`${product.name} agregado al carrito`, { duration: 2000 });
        return [...prevItems, { product, quantity: 1 }];
      }
    });
  }, []);

  // Actualizar cantidad en carrito
  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const item = cartItems.find(i => i.product.id === productId);
    if (!item) return;

    if (quantity > item.product.stock) {
      toast.error(`Solo hay ${item.product.stock} unidades disponibles`);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [cartItems]);

  // Eliminar del carrito
  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  }, []);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Cargar ventas
  const loadSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const response = await api.getSales();
      if (response.success) {
        setSales(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar ventas');
    } finally {
      setLoadingSales(false);
    }
  }, []);

  // Crear venta
  const createSale = useCallback(async (saleData: Partial<Sale>) => {
    try {
      const response = await api.createSale(saleData);
      if (response.success) {
        const mappedSale = {
          ...response.data,
          id: response.data._id || response.data.id
        };
        setSales(prev => [mappedSale, ...prev]);
        
        // Actualizar stock local de los productos
        await loadProducts();
        
        // Limpiar carrito
        clearCart();
        
        toast.success('Venta registrada exitosamente');
        return mappedSale;
      }
      return null;
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar la venta');
      return null;
    }
  }, [loadProducts, clearCart]);

  // Cancelar venta
  const cancelSale = useCallback(async (saleId: string) => {
    try {
      const response = await api.deleteSale(saleId);
      if (response.success) {
        setSales(prev => prev.filter(s => s.id !== saleId));
        
        // Recargar productos para actualizar stock
        await loadProducts();
        
        toast.success('Venta cancelada exitosamente');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar la venta');
      return false;
    }
  }, [loadProducts]);

  // Cargar clientes
  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const response = await api.getCustomers();
      if (response.success) {
        const mappedCustomers = response.data.map(c => ({
          ...c,
          id: c._id || c.id
        }));
        setCustomers(mappedCustomers);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar clientes');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  // Buscar cliente por NFC
  const getCustomerByNFC = useCallback(async (nfcId: string) => {
    try {
      const response = await api.getCustomerByNFC(nfcId);
      if (response.success) {
        return {
          ...response.data,
          id: response.data._id || response.data.id
        };
      }
      return null;
    } catch (error: any) {
      toast.error(error.message || 'Cliente no encontrado');
      return null;
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadProducts();
      loadCustomers();
    }
  }, [loadProducts, loadCustomers]);

  const value: POSContextType = {
    products,
    loadingProducts,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductByBarcode,
    adjustInventory,
    
    cartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    
    sales,
    loadingSales,
    loadSales,
    createSale,
    cancelSale,
    
    customers,
    loadingCustomers,
    loadCustomers,
    getCustomerByNFC,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
}

export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
