import { useState, useCallback, useEffect, useMemo } from 'react';
import { ShoppingCart, Package, Box, X, ShoppingBag, ChevronLeft, ChevronRight, Wallet, BarChart3, Users, Percent, Home, Settings, LogOut, Shield, Smartphone, Receipt } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { LoginScreen } from '@/app/components/auth/LoginScreen';
import { SessionLockScreen } from '@/app/components/auth/SessionLockScreen';
import { DashboardView } from '@/app/components/dashboard/DashboardView';
import { UserManagement } from '@/app/components/admin/UserManagement';
import { AuditLogView } from '@/app/components/admin/AuditLogView';
import { useInactivityLock } from '@/app/hooks/useInactivityLock';
import { Header } from '@/app/components/pos/Header';
import { ProductGrid } from '@/app/components/pos/ProductGrid';
import { Cart } from '@/app/components/pos/Cart';
import { FloatingCartButton } from '@/app/components/pos/FloatingCartButton';
import { PaymentModal } from '@/app/components/pos/PaymentModal';
import { ConfirmationModal } from '@/app/components/pos/ConfirmationModal';
import { BarcodeScanner } from '@/app/components/pos/BarcodeScanner';
import { ProductManagement } from '@/app/components/pos/ProductManagement';
import { InventoryManagement } from '@/app/components/pos/InventoryManagement';
import { PurchaseManagement } from '@/app/components/pos/PurchaseManagement';
import { CashRegisterManagement } from '@/app/components/pos/CashRegisterManagement';
import { ReportsManagement } from '@/app/components/pos/ReportsManagement';
import { CustomerManagement } from '@/app/components/pos/CustomerManagement';
import { PromotionsManagement } from '@/app/components/pos/PromotionsManagement';
import { PhoneRecharges } from '@/app/components/pos/PhoneRecharges';
import { Services } from '@/app/components/pos/Services';
import type { Product, CartItem, PaymentMethod, Sale, ShiftSummary, Customer, User, AuditLog, SystemBackup, ServicePayment, Supplier } from '@/types/pos';
import { validateStockForCart, validateSaleStock, updateStockAfterSale } from '@/utils/stockValidation';
import { hasPermission, canAccessModule, MODULES, getActionCriticality } from '@/utils/permissions';
import { AccessDenied } from '@/app/components/common/AccessDenied';

// Productos - inicialmente vacío
const MOCK_PRODUCTS: Product[] = [];

// Usuarios - inicialmente vacío
const MOCK_USERS: User[] = [];

// Clientes - inicialmente vacío
const MOCK_CUSTOMERS: Customer[] = [];

// Logs de auditoría - inicialmente vacío
const MOCK_AUDIT_LOGS: AuditLog[] = [];

export default function App() {
  // Sistema de autenticación
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [lockTime, setLockTime] = useState<Date | null>(null);

  // Auditoría y seguridad
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [backups, setBackups] = useState<SystemBackup[]>([]);

  // Estado del sistema
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'sales' | 'products' | 'inventory' | 'purchases' | 'cash' | 'reports' | 'customers' | 'promotions' | 'recharges' | 'services' | 'users' | 'audit'>('dashboard');
  const [sales, setSales] = useState<Sale[]>([]);
  const [shifts, setShifts] = useState<ShiftSummary[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [servicePayments, setServicePayments] = useState<ServicePayment[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const TAX_RATE = 0.16;
  const INACTIVITY_TIMEOUT = 15; // minutos

  // Función para registrar eventos en la auditoría
  const logAudit = useCallback((
    action: AuditLog['action'],
    module: string,
    description: string,
    details?: any,
    success: boolean = true
  ) => {
    if (!currentUser) return;

    // Calcular criticidad automáticamente
    const criticality = getActionCriticality(currentUser, action, details);

    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      action,
      module,
      description,
      details,
      success,
      criticality, // ✅ Nivel de criticidad automático
    };

    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // Hook de bloqueo por inactividad
  const handleSessionLock = useCallback(() => {
    if (!currentUser) return;
    
    setIsSessionLocked(true);
    setLockTime(new Date());
    logAudit('session_locked', 'security', `Sesión bloqueada por inactividad de ${INACTIVITY_TIMEOUT} minutos`);
    toast.warning('Sesión bloqueada por inactividad');
  }, [currentUser, logAudit]);

  useInactivityLock({
    timeout: INACTIVITY_TIMEOUT,
    onLock: handleSessionLock,
    enabled: !!currentUser && !isSessionLocked,
  });

  // Detectar intentos de acceso no autorizado
  useEffect(() => {
    if (!currentUser) return;

    const moduleMap: Record<string, string> = {
      'products': MODULES.PRODUCTS,
      'inventory': MODULES.INVENTORY,
      'purchases': MODULES.PURCHASES,
      'cash': MODULES.CASH,
      'reports': MODULES.REPORTS,
      'users': MODULES.USERS,
      'audit': MODULES.AUDIT,
    };

    const module = moduleMap[currentView];
    
    if (module && !canAccessModule(currentUser, module)) {
      // Registrar intento de acceso no autorizado
      logAudit(
        'access_denied',
        module,
        `Intento de acceso no autorizado al módulo: ${currentView}`,
        { 
          view: currentView, 
          userRole: currentUser.role,
          attemptedModule: module 
        },
        false
      );
      
      toast.error('No tienes permisos para acceder a este módulo', {
        duration: 3000,
      });
    }
  }, [currentView, currentUser, logAudit]);

  // Desbloquear sesión
  const handleUnlockSession = (password: string) => {
    setIsSessionLocked(false);
    logAudit('session_unlocked', 'security', 'Sesión desbloqueada exitosamente');
  };

  // Login con auditoría
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    
    // Crear turno automáticamente
    const newShift: ShiftSummary = {
      id: `shift-${Date.now()}`,
      shiftNumber: `T-${Date.now().toString().slice(-6)}`,
      openedBy: user.fullName,
      closedBy: '',
      openedAt: new Date(),
      closedAt: new Date(), // Se actualizará al cerrar
      duration: 0, // Se calculará al cerrar
      openingBalance: 0,
      salesCash: 0,
      salesCard: 0,
      salesTransfer: 0,
      totalSales: 0,
      salesCount: 0,
      incomes: 0,
      withdrawals: 0,
      finalBalance: 0,
      expectedBalance: 0,
      difference: 0,
      notes: 'Turno abierto automáticamente al iniciar sesión',
    };
    
    setActiveShift(newShift);
    logAudit('login', 'auth', `Inicio de sesión exitoso - Turno ${newShift.shiftNumber} abierto`);
    toast.success(`Turno ${newShift.shiftNumber} iniciado`, { duration: 2000 });
  };

  // Logout con auditoría
  const handleLogoutWithAudit = () => {
    if (confirm('¿Cerrar sesión y finalizar turno?')) {
      // Cerrar turno activo si existe
      if (activeShift && currentUser) {
        const closedAt = new Date();
        const duration = Math.floor((closedAt.getTime() - activeShift.openedAt.getTime()) / (1000 * 60));
        
        const closedShift: ShiftSummary = {
          ...activeShift,
          closedBy: currentUser.fullName,
          closedAt,
          duration,
          finalBalance: activeShift.openingBalance + activeShift.totalSales + activeShift.incomes - activeShift.withdrawals,
          expectedBalance: activeShift.openingBalance + activeShift.totalSales + activeShift.incomes - activeShift.withdrawals,
          difference: 0,
        };
        
        setShifts(prev => [closedShift, ...prev]);
        setActiveShift(null);
        
        logAudit('shift_closed', 'cash', `Turno ${closedShift.shiftNumber} cerrado - ${duration} minutos - $${closedShift.totalSales.toFixed(2)} en ventas`);
      }
      
      logAudit('logout', 'auth', 'Cierre de sesión');
      setCurrentUser(null);
      setCurrentView('dashboard');
      setCartItems([]);
      setIsSessionLocked(false);
      toast.success('Sesión cerrada y turno finalizado');
    }
  };

  // Crear respaldo del sistema
  const handleCreateBackup = () => {
    const backup: SystemBackup = {
      id: `backup-${Date.now()}`,
      timestamp: new Date(),
      createdBy: currentUser?.fullName || 'Sistema',
      data: {
        products,
        sales,
        customers,
        shifts,
        users,
      },
      size: JSON.stringify({ products, sales, customers, shifts, users }).length,
      version: '2.0',
    };

    setBackups(prev => [backup, ...prev]);
    logAudit('backup_created', 'system', `Respaldo creado: ${backup.id}`, { size: backup.size });
    
    // Descargar como JSON
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    toast.success('Respaldo creado y descargado exitosamente');
  };

  // Restaurar respaldo
  const handleRestoreBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event: any) => {
        try {
          const backup: SystemBackup = JSON.parse(event.target.result);
          
          if (confirm(`¿Restaurar respaldo del ${new Date(backup.timestamp).toLocaleString()}? Esto sobrescribirá todos los datos actuales.`)) {
            setProducts(backup.data.products);
            setSales(backup.data.sales);
            setCustomers(backup.data.customers);
            setShifts(backup.data.shifts);
            setUsers(backup.data.users);
            
            logAudit('backup_restored', 'system', `Respaldo restaurado: ${backup.id}`, { timestamp: backup.timestamp });
            toast.success('Respaldo restaurado exitosamente');
          }
        } catch (error) {
          toast.error('Error al restaurar el respaldo');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  // Exportar logs de auditoría
  const handleExportLogs = () => {
    const csvHeader = 'Fecha,Hora,Usuario,Rol,Acción,Módulo,Descripción,Estado\n';
    const csvRows = auditLogs.map(log => {
      const date = new Date(log.timestamp);
      return [
        date.toLocaleDateString('es-MX'),
        date.toLocaleTimeString('es-MX'),
        log.userName,
        log.userRole,
        log.action,
        log.module,
        `"${log.description}"`,
        log.success ? 'Exitoso' : 'Fallido'
      ].join(',');
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    logAudit('backup_created', 'audit', 'Logs de auditoría exportados a CSV');
    toast.success('Logs exportados exitosamente');
  };

  // Buscar producto por código de barras
  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      if (product.stock > 0) {
        handleAddToCart(product);
        toast.success(`${product.name} agregado al carrito`, {
          duration: 2000,
          position: 'top-center',
        });
      } else {
        toast.error(`${product.name} sin stock disponible`, {
          duration: 3000,
          position: 'top-center',
        });
      }
    } else {
      toast.error(`Producto no encontrado: ${barcode}`, {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  // Agregar producto al carrito con validación de stock
  const handleAddToCart = (product: Product) => {
    // Validar stock antes de agregar
    const validation = validateStockForCart(product, cartItems, 1);
    
    if (!validation.isValid) {
      toast.error(validation.message || 'No se puede agregar el producto', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Si ya existe, incrementar cantidad
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Si no existe, agregarlo
        toast.success(`${product.name} agregado al carrito`, {
          duration: 2000,
          position: 'top-center',
        });
        return [...prevItems, { product, quantity: 1 }];
      }
    });
  };

  // Actualizar cantidad de un item con validación de stock
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const item = cartItems.find(i => i.product.id === productId);
    if (!item) return;
    
    // Validar que la nueva cantidad no exceda el stock
    if (quantity > item.product.stock) {
      toast.error(`Solo hay ${item.product.stock} unidades disponibles de ${item.product.name}`, {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }
    
    // Validar que la cantidad sea positiva
    if (quantity < 1) {
      toast.error('La cantidad debe ser mayor a 0', {
        duration: 2000,
      });
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Eliminar item del carrito
  const handleRemoveItem = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  // Abrir modal de cobro
  const handleCheckout = () => {
    setIsPaymentModalOpen(true);
  };

  // Completar venta
  const handleCompleteSale = (
    method: PaymentMethod,
    amountReceived?: number,
    change?: number,
    customer?: Customer
  ) => {
    // VALIDACIÓN CRÍTICA: Verificar stock antes de completar la venta
    const stockValidation = validateSaleStock(cartItems, products);
    
    if (!stockValidation.isValid) {
      toast.error(stockValidation.message || 'Stock insuficiente', {
        duration: 4000,
        position: 'top-center',
      });
      
      // Registrar en auditoría el intento fallido
      logAudit(
        'sale_created',
        'pos',
        `Intento de venta fallido: ${stockValidation.message}`,
        { items: cartItems.length, reason: 'stock_insufficient' },
        false
      );
      
      return;
    }
    
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    // Calcular puntos de lealtad si hay cliente
    const pointsEarned = customer ? Math.floor(total / 10) : 0;

    const sale: Sale = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      items: [...cartItems],
      subtotal,
      tax,
      total,
      paymentMethod: method,
      amountReceived,
      change,
      timestamp: new Date(),
      date: new Date(),
      customerId: customer?.id,
      customerName: customer?.name,
      nfcCardId: customer?.nfcCardId,
      loyaltyPointsEarned: pointsEarned,
    };

    // ACTUALIZAR STOCK: Descontar productos vendidos del inventario
    const updatedProducts = updateStockAfterSale(products, cartItems);
    setProducts(updatedProducts);

    // Si hay cliente, actualizar sus puntos
    if (customer && pointsEarned > 0) {
      const updatedCustomers = customers.map(c => 
        c.id === customer.id 
          ? { ...c, loyaltyPoints: c.loyaltyPoints + pointsEarned }
          : c
      );
      handleUpdateCustomers(updatedCustomers);
      
      toast.success(`¡${customer.name} ganó ${pointsEarned} puntos!`, {
        duration: 3000,
      });
    }

    setCurrentSale(sale);
    setSales([sale, ...sales]); // Guardar venta en el historial
    
    // Actualizar turno activo
    if (activeShift) {
      setActiveShift(prev => {
        if (!prev) return prev;
        
        const updatedShift = {
          ...prev,
          totalSales: prev.totalSales + total,
          salesCount: prev.salesCount + 1,
          salesCash: method === 'cash' ? prev.salesCash + total : prev.salesCash,
          salesCard: method === 'card' ? prev.salesCard + total : prev.salesCard,
          salesTransfer: method === 'transfer' ? prev.salesTransfer + total : prev.salesTransfer,
        };
        
        return updatedShift;
      });
    }
    
    // Registrar en auditoría
    const auditDescription = customer 
      ? `Venta realizada por $${total.toFixed(2)} - ${method} - ${cartItems.length} artículos - Cliente: ${customer.name} (+${pointsEarned} pts)`
      : `Venta realizada por $${total.toFixed(2)} - ${method} - ${cartItems.length} artículos`;
    
    logAudit(
      'sale_created',
      'pos',
      auditDescription,
      { saleId: sale.id, items: cartItems.length, total, method, customerId: customer?.id, pointsEarned }
    );
    
    setIsPaymentModalOpen(false);
    setIsConfirmationModalOpen(true);
  };

  // Nueva venta
  const handleNewSale = () => {
    setCartItems([]);
    setCurrentSale(null);
    setIsConfirmationModalOpen(false);
    setIsCartOpen(false);
  };

  // Manejar pago de servicio
  const handleServicePayment = (payment: ServicePayment) => {
    setServicePayments([payment, ...servicePayments]);
    
    // Actualizar turno activo
    if (activeShift) {
      setActiveShift(prev => {
        if (!prev) return prev;
        
        const updatedShift = {
          ...prev,
          totalSales: prev.totalSales + payment.total,
          salesCount: prev.salesCount + 1,
          salesCash: payment.paymentMethod === 'cash' ? prev.salesCash + payment.total : prev.salesCash,
          salesCard: payment.paymentMethod === 'card' ? prev.salesCard + payment.total : prev.salesCard,
          salesTransfer: payment.paymentMethod === 'transfer' ? prev.salesTransfer + payment.total : prev.salesTransfer,
        };
        
        return updatedShift;
      });
    }
    
    // Registrar en auditoría
    logAudit(
      'sale_created',
      'services',
      `Pago de servicio: ${payment.providerName} - ${payment.reference} - $${payment.total.toFixed(2)} - ${payment.paymentMethod}`,
      { serviceId: payment.id, provider: payment.providerName, amount: payment.amount, commission: payment.commission, total: payment.total }
    );
    
    toast.success(
      `Servicio procesado: ${payment.providerName}\nCódigo: ${payment.confirmationCode}`,
      { duration: 5000 }
    );
  };

  // Imprimir ticket
  const handlePrint = () => {
    alert('Funcionalidad de impresión: En un sistema real, aquí se enviaría el ticket a la impresora térmica.');
  };

  // Calcular totales para el footer
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // Wrapper para mantener compatibilidad
  const handleLogout = handleLogoutWithAudit;

  // Wrapper para actualizar productos con auditoría
  const handleUpdateProducts = (newProducts: Product[]) => {
    const oldLength = products.length;
    const newLength = newProducts.length;
    
    if (newLength > oldLength) {
      const addedProduct = newProducts.find(p => !products.some(old => old.id === p.id));
      if (addedProduct) {
        logAudit(
          'product_created', 
          'products', 
          `Producto creado: ${addedProduct.name} - $${addedProduct.price.toFixed(2)}`, 
          { 
            productId: addedProduct.id, 
            price: addedProduct.price, 
            category: addedProduct.category 
          }
        );
      }
    } else if (newLength < oldLength) {
      const deletedProduct = products.find(p => !newProducts.some(newP => newP.id === p.id));
      if (deletedProduct) {
        logAudit('product_deleted', 'products', `Producto eliminado: ${deletedProduct.name}`, { productId: deletedProduct.id });
      }
    } else {
      // Producto modificado - detectar cambios de precio
      const modifiedProduct = newProducts.find(p => {
        const old = products.find(old => old.id === p.id);
        return old && JSON.stringify(old) !== JSON.stringify(p);
      });
      
      if (modifiedProduct) {
        const oldProduct = products.find(p => p.id === modifiedProduct.id);
        
        // ✅ Si cambió el precio, registrar con detalles para auditoría
        if (oldProduct && oldProduct.price !== modifiedProduct.price) {
          const priceChange = ((modifiedProduct.price - oldProduct.price) / oldProduct.price) * 100;
          
          logAudit(
            'product_updated', 
            'products', 
            `Cambio de precio: ${modifiedProduct.name} de $${oldProduct.price.toFixed(2)} → $${modifiedProduct.price.toFixed(2)}`, 
            { 
              productId: modifiedProduct.id,
              oldPrice: oldProduct.price,
              newPrice: modifiedProduct.price,
              priceChange: parseFloat(priceChange.toFixed(1)) // ✅ Para evaluación de criticidad
            }
          );
        } else {
          // Otros cambios (stock, categoría, etc.)
          logAudit('product_updated', 'products', `Producto modificado: ${modifiedProduct.name}`, { productId: modifiedProduct.id });
        }
      }
    }
    
    setProducts(newProducts);
  };

  // Wrapper para actualizar usuarios con auditoría
  const handleUpdateUsers = (newUsers: User[]) => {
    const oldLength = users.length;
    const newLength = newUsers.length;
    
    if (newLength > oldLength) {
      const addedUser = newUsers.find(u => !users.some(old => old.id === u.id));
      if (addedUser) {
        logAudit('user_created', 'users', `Usuario creado: ${addedUser.fullName} (@${addedUser.username})`, { userId: addedUser.id, role: addedUser.role });
      }
    } else if (newLength < oldLength) {
      const deletedUser = users.find(u => !newUsers.some(newU => newU.id === u.id));
      if (deletedUser) {
        logAudit('user_deleted', 'users', `Usuario eliminado: ${deletedUser.fullName}`, { userId: deletedUser.id });
      }
    } else {
      // Usuario modificado
      const modifiedUser = newUsers.find(u => {
        const old = users.find(old => old.id === u.id);
        return old && JSON.stringify(old) !== JSON.stringify(u);
      });
      if (modifiedUser) {
        logAudit('user_updated', 'users', `Usuario modificado: ${modifiedUser.fullName}`, { userId: modifiedUser.id });
      }
    }
    
    setUsers(newUsers);
  };

  // Wrapper para actualizar clientes con auditoría
  const handleUpdateCustomers = (newCustomers: Customer[]) => {
    const oldLength = customers.length;
    const newLength = newCustomers.length;
    
    if (newLength > oldLength) {
      const addedCustomer = newCustomers.find(c => !customers.some(old => old.id === c.id));
      if (addedCustomer) {
        logAudit('customer_created', 'customers', `Cliente creado: ${addedCustomer.name}`, { customerId: addedCustomer.id });
      }
    } else if (newLength < oldLength) {
      const deletedCustomer = customers.find(c => !newCustomers.some(newC => newC.id === c.id));
      if (deletedCustomer) {
        logAudit('customer_deleted', 'customers', `Cliente eliminado: ${deletedCustomer.name}`, { customerId: deletedCustomer.id });
      }
    } else {
      const modifiedCustomer = newCustomers.find(c => {
        const old = customers.find(old => old.id === c.id);
        return old && JSON.stringify(old) !== JSON.stringify(c);
      });
      if (modifiedCustomer) {
        logAudit('customer_updated', 'customers', `Cliente modificado: ${modifiedCustomer.name}`, { customerId: modifiedCustomer.id });
      }
    }
    
    setCustomers(newCustomers);
  };

  // Menú con validación de permisos - useMemo para recalcular cuando cambia currentUser
  const menuItems = useMemo(() => [
    // Dashboard - Siempre visible
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home, module: MODULES.DASHBOARD },
    
    // Ventas - Todos pueden ver
    { id: 'sales' as const, label: 'Punto de Venta', icon: ShoppingCart, module: MODULES.SALES },
    
    // Productos - Solo si tiene permiso de ver
    ...(canAccessModule(currentUser, MODULES.PRODUCTS) ? [
      { id: 'products' as const, label: 'Productos', icon: Box, module: MODULES.PRODUCTS }
    ] : []),
    
    // Inventario - Solo si tiene permiso de ver
    ...(canAccessModule(currentUser, MODULES.INVENTORY) ? [
      { id: 'inventory' as const, label: 'Inventario', icon: Package, module: MODULES.INVENTORY }
    ] : []),
    
    // Compras - Solo Admin y Supervisor
    ...(canAccessModule(currentUser, MODULES.PURCHASES) ? [
      { id: 'purchases' as const, label: 'Compras', icon: ShoppingBag, module: MODULES.PURCHASES }
    ] : []),
    
    // Caja - Solo si tiene permiso de ver
    ...(canAccessModule(currentUser, MODULES.CASH) ? [
      { id: 'cash' as const, label: 'Caja', icon: Wallet, module: MODULES.CASH }
    ] : []),
    
    // Clientes - Todos pueden ver
    ...(canAccessModule(currentUser, MODULES.CUSTOMERS) ? [
      { id: 'customers' as const, label: 'Clientes', icon: Users, module: MODULES.CUSTOMERS }
    ] : []),
    
    // Promociones - Todos pueden ver
    ...(canAccessModule(currentUser, MODULES.PROMOTIONS) ? [
      { id: 'promotions' as const, label: 'Promociones', icon: Percent, module: MODULES.PROMOTIONS }
    ] : []),
    
    // Servicios - Solo si tiene permiso
    ...(canAccessModule(currentUser, MODULES.SERVICES) ? [
      { id: 'services' as const, label: 'Servicios', icon: Receipt, module: MODULES.SERVICES }
    ] : []),
    
    // Recargas - Siempre visible (no tiene módulo de permisos aún)
    { id: 'recharges' as const, label: 'Recargas', icon: Smartphone, module: 'recharges' },
    
    // Reportes - Solo Admin y Supervisor
    ...(canAccessModule(currentUser, MODULES.REPORTS) ? [
      { id: 'reports' as const, label: 'Reportes', icon: BarChart3, module: MODULES.REPORTS }
    ] : []),
    
    // Usuarios - Solo Admin
    ...(canAccessModule(currentUser, MODULES.USERS) ? [
      { id: 'users' as const, label: 'Usuarios', icon: Settings, module: MODULES.USERS }
    ] : []),
    
    // Auditoría - Solo Admin y Supervisor
    ...(canAccessModule(currentUser, MODULES.AUDIT) ? [
      { id: 'audit' as const, label: 'Auditoría', icon: Shield, module: MODULES.AUDIT }
    ] : []),
  ], [currentUser]); // ← Se recalcula cuando currentUser cambia

  // Función para obtener título y subtítulo según la vista
  const getViewTitle = () => {
    const viewTitles: Record<typeof currentView, { title: string; subtitle?: string }> = {
      dashboard: { title: 'Sistema POS Empresarial', subtitle: 'Sistema de Punto de Venta' },
      sales: { title: 'Punto de Venta', subtitle: 'Gestión de ventas y cobros' },
      products: { title: 'Gestión de Productos', subtitle: 'Catálogo y configuración' },
      inventory: { title: 'Inventario', subtitle: 'Control de stock y movimientos' },
      purchases: { title: 'Compras', subtitle: 'Registro de compras a proveedores' },
      cash: { title: 'Caja', subtitle: 'Control de turnos y efectivo' },
      customers: { title: 'Gestión de Clientes', subtitle: 'CRM, lealtad, crédito y tarjetas NFC' },
      promotions: { title: 'Promociones', subtitle: 'Descuentos y ofertas especiales' },
      services: { title: 'Pago de Servicios', subtitle: 'Luz, agua, teléfono, internet y más' },
      recharges: { title: 'Recargas Telefónicas', subtitle: 'Recargas de saldo móvil' },
      reports: { title: 'Reportes', subtitle: 'Análisis y estadísticas' },
      users: { title: 'Usuarios', subtitle: 'Gestión de usuarios del sistema' },
      audit: { title: 'Auditoría', subtitle: 'Registro de actividades y seguridad' },
    };
    return viewTitles[currentView];
  };

  // Si no hay sesión, mostrar login
  if (!currentUser) {
    return (
      <>
        <Toaster richColors closeButton />
        <LoginScreen onLogin={handleLogin} users={users} />
      </>
    );
  }

  // Si la sesión está bloqueada, mostrar pantalla de desbloqueo
  if (isSessionLocked && currentUser && lockTime) {
    const inactiveMinutes = Math.floor((lockTime.getTime() - Date.now()) / 60000) + INACTIVITY_TIMEOUT;
    return (
      <>
        <Toaster richColors closeButton />
        <SessionLockScreen
          user={currentUser}
          onUnlock={handleUnlockSession}
          onLogout={handleLogoutWithAudit}
          inactiveTime={INACTIVITY_TIMEOUT}
        />
      </>
    );
  }

  return (
    <>
      <Toaster richColors closeButton />
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <Header 
          userName={currentUser.fullName} 
          title={getViewTitle().title}
          subtitle={getViewTitle().subtitle}
          onMenuClick={() => setIsSidebarOpen(true)}
          shiftNumber={activeShift?.shiftNumber}
          shiftSales={activeShift?.totalSales}
        />

        {/* Main Layout con Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Desktop */}
          <aside 
            className={`hidden lg:flex lg:flex-col bg-white border-r-2 border-gray-200 shadow-lg transition-all duration-300 ${
              isSidebarCollapsed ? 'w-20' : 'w-64'
            }`}
          >
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-base transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>

            {/* Información de usuario y logout */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              {!isSidebarCollapsed && (
                <div className="px-2 py-2 bg-gray-50 rounded-lg mb-2">
                  <div className="text-xs font-bold text-gray-600">Usuario</div>
                  <div className="text-sm font-bold text-gray-900">{currentUser.fullName}</div>
                  <div className="text-xs text-gray-500 capitalize">{currentUser.role}</div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-red-50 text-red-700 hover:bg-red-100 transition-all"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
                {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
              </button>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-gray-700 hover:bg-gray-100 transition-all"
                title={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <>
                    <ChevronLeft className="w-5 h-5" />
                    <span>Contraer</span>
                  </>
                )}
              </button>
            </div>
          </aside>

          {/* Sidebar Mobile */}
          {isSidebarOpen && (
            <>
              <div 
                className="lg:hidden fixed inset-0 bg-black/60 z-40"
                onClick={() => setIsSidebarOpen(false)}
              />
              <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 flex flex-col">
                {/* Header del sidebar móvil */}
                <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Menú Principal</h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-white/15 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Navegación móvil */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {menuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-base transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Usuario y logout móvil */}
                <div className="p-4 border-t border-gray-200 space-y-2">
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-bold text-gray-600">Usuario</div>
                    <div className="text-sm font-bold text-gray-900">{currentUser.fullName}</div>
                    <div className="text-xs text-gray-500 capitalize">{currentUser.role}</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-red-50 text-red-700 hover:bg-red-100 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </aside>
            </>
          )}

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
        {currentView === 'sales' && (
          <>
            {/* Panel de Productos */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ProductGrid products={products} onAddToCart={handleAddToCart} />
            </div>

            {/* Carrito - Desktop lateral, Mobile modal */}
            <Cart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              onCheckout={handleCheckout}
            />
          </>
        )}

        {currentView === 'products' && (
          canAccessModule(currentUser, MODULES.PRODUCTS) ? (
            <ProductManagement
              products={products}
              onUpdateProducts={handleUpdateProducts}
              suppliers={suppliers}
              currentUser={currentUser}
              onNavigateToInventory={(productId) => {
                setCurrentView('inventory');
                // TODO: Pasar productId al InventoryManagement para seleccionarlo automáticamente
              }}
            />
          ) : (
            <AccessDenied 
              moduleName="Productos" 
              onGoBack={() => setCurrentView('dashboard')}
              userName={currentUser.fullName}
            />
          )
        )}

        {currentView === 'inventory' && (
          canAccessModule(currentUser, MODULES.INVENTORY) ? (
            <InventoryManagement
              products={products}
              onUpdateProducts={setProducts}
              currentUser={currentUser}
            />
          ) : (
            <AccessDenied 
              moduleName="Inventario" 
              onGoBack={() => setCurrentView('dashboard')}
              userName={currentUser.fullName}
            />
          )
        )}

        {currentView === 'purchases' && (
          canAccessModule(currentUser, MODULES.PURCHASES) ? (
            <PurchaseManagement
              products={products}
              onUpdateProducts={setProducts}
              suppliers={suppliers}
              onUpdateSuppliers={setSuppliers}
            />
          ) : (
            <AccessDenied 
              moduleName="Compras" 
              onGoBack={() => setCurrentView('dashboard')}
              userName={currentUser.fullName}
            />
          )
        )}

        {currentView === 'cash' && (
          canAccessModule(currentUser, MODULES.CASH) ? (
            <CashRegisterManagement
              sales={sales}
              onSaveShift={(shift) => setShifts([shift, ...shifts])}
              currentUser={currentUser}
            />
          ) : (
            <AccessDenied 
              moduleName="Caja" 
              onGoBack={() => setCurrentView('dashboard')}
              userName={currentUser.fullName}
            />
          )
        )}

        {currentView === 'reports' && (
          canAccessModule(currentUser, MODULES.REPORTS) ? (
            <ReportsManagement
              sales={sales}
              products={products}
              shifts={shifts}
              customers={customers}
              servicePayments={servicePayments}
            />
          ) : (
            <AccessDenied 
              moduleName="Reportes" 
              onGoBack={() => setCurrentView('dashboard')}
              userName={currentUser.fullName}
            />
          )
        )}

        {currentView === 'customers' && (
          <CustomerManagement
            customers={customers}
            onUpdateCustomers={handleUpdateCustomers}
            sales={sales}
            currentUser={currentUser}
          />
        )}

        {currentView === 'promotions' && (
          <PromotionsManagement
            products={products}
            customers={customers}
          />
        )}

        {currentView === 'recharges' && (
          <PhoneRecharges
            currentUser={currentUser}
          />
        )}

        {currentView === 'services' && (
          <Services
            onServicePayment={handleServicePayment}
            serviceHistory={servicePayments}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            sales={sales}
            products={products}
            customers={customers}
            shifts={shifts}
            auditLogs={auditLogs}
            users={users}
            currentUser={currentUser}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'users' && (
          canAccessModule(currentUser, MODULES.USERS) ? (
            <UserManagement
              users={users}
              onUpdateUsers={handleUpdateUsers}
              currentUser={currentUser}
            />
          ) : (
            <AccessDenied 
              moduleName="Usuarios" 
              onGoBack={() => setCurrentView('dashboard')}
              userName={currentUser.fullName}
            />
          )
        )}

        {currentView === 'audit' && (
          canAccessModule(currentUser, MODULES.AUDIT) ? (
            <AuditLogView
              auditLogs={auditLogs}
              users={users}
              onExportLogs={handleExportLogs}
              onBackupSystem={handleCreateBackup}
              onRestoreBackup={handleRestoreBackup}
            />
          ) : (
            <AccessDenied 
              moduleName="Auditoría" 
              onGoBack={() => setCurrentView('dashboard')}
              userName={currentUser.fullName}
            />
          )
        )}
          </div>
        </div>

        {/* Botón flotante del carrito (solo móvil) y Barcode Scanner - Solo visible en vista de ventas */}
        {currentView === 'sales' && (
          <>
            <FloatingCartButton
              items={cartItems}
              onToggleCart={() => setIsCartOpen(!isCartOpen)}
            />
            <BarcodeScanner onScan={handleBarcodeScan} />
          </>
        )}

        {/* Modal de pago */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          total={total}
          onClose={() => setIsPaymentModalOpen(false)}
          onComplete={handleCompleteSale}
          customers={customers}
        />

        {/* Modal de confirmación */}
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          sale={currentSale}
          onNewSale={handleNewSale}
          onPrint={handlePrint}
        />
      </div>
    </>
  );
}
