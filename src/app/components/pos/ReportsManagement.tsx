import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  Layers, 
  ShoppingBag, 
  Target, 
  Award, 
  Percent, 
  CreditCard, 
  Receipt,
  ArrowLeft,
  FileText,
  Calendar,
  TrendingDown
} from 'lucide-react';
import { SalesReportsTab } from '@/app/components/pos/reports/SalesReportsTab';
import { ProductReportsTab } from '@/app/components/pos/reports/ProductReportsTab';
import { CategoryReportsTab } from '@/app/components/pos/reports/CategoryReportsTab';
import { CashierReportsTab } from '@/app/components/pos/reports/CashierReportsTab';
import { ProfitabilityReportsTab } from '@/app/components/pos/reports/ProfitabilityReportsTab';
import { InventoryReportsTab } from '@/app/components/pos/reports/InventoryReportsTab';
import { CustomerReportsTab } from '@/app/components/pos/reports/CustomerReportsTab';
import { LoyaltyReportsTab } from '@/app/components/pos/reports/LoyaltyReportsTab';
import { PromotionsReportsTab } from '@/app/components/pos/reports/PromotionsReportsTab';
import { CreditReportsTab } from '@/app/components/pos/reports/CreditReportsTab';
import { ServicesReportsTab } from '@/app/components/pos/reports/ServicesReportsTab';
import type { Sale, Product, ShiftSummary, Customer, ServicePayment } from '@/types/pos';

interface ReportsManagementProps {
  sales: Sale[];
  products: Product[];
  shifts: ShiftSummary[];
  customers: Customer[];
  servicePayments?: ServicePayment[];
}

type ReportType = 'sales' | 'products' | 'categories' | 'cashiers' | 'profitability' | 'inventory' | 'customers' | 'loyalty' | 'promotions' | 'credit' | 'services' | null;

export function ReportsManagement({ sales, products, shifts, customers, servicePayments = [] }: ReportsManagementProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);

  const reports = [
    { 
      id: 'sales' as const, 
      title: 'Ventas', 
      icon: TrendingUp,
      description: 'Análisis de ventas por período, tendencias y comparativas',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      stats: `${sales.length} registros`
    },
    { 
      id: 'products' as const, 
      title: 'Productos', 
      icon: Package,
      description: 'Top productos más vendidos y análisis de desempeño',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      stats: `${products.length} productos`
    },
    { 
      id: 'categories' as const, 
      title: 'Categorías', 
      icon: Layers,
      description: 'Ventas y utilidades por categoría de productos',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-600',
      stats: 'Análisis detallado'
    },
    { 
      id: 'cashiers' as const, 
      title: 'Cajeros & Turnos', 
      icon: Users,
      description: 'Desempeño de cajeros y análisis de turnos',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-600',
      stats: `${shifts.length} turnos`
    },
    { 
      id: 'profitability' as const, 
      title: 'Utilidades', 
      icon: DollarSign,
      description: 'Márgenes de ganancia, costos y rentabilidad',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      stats: 'Análisis financiero'
    },
    { 
      id: 'inventory' as const, 
      title: 'Inventario', 
      icon: ShoppingBag,
      description: 'Stock actual, rotación y productos por reabastecer',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-600',
      stats: 'Control de stock'
    },
    { 
      id: 'customers' as const, 
      title: 'Clientes', 
      icon: Target,
      description: 'Análisis de clientes, frecuencia y ticket promedio',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-600',
      stats: `${customers.length} clientes`
    },
    { 
      id: 'loyalty' as const, 
      title: 'Programa de Lealtad', 
      icon: Award,
      description: 'Puntos canjeados, niveles y efectividad del programa',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-600',
      stats: 'Análisis de fidelización'
    },
    { 
      id: 'promotions' as const, 
      title: 'Promociones', 
      icon: Percent,
      description: 'Efectividad de descuentos y ofertas especiales',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      stats: 'ROI de promociones'
    },
    { 
      id: 'credit' as const, 
      title: 'Crédito & Préstamos', 
      icon: CreditCard,
      description: 'Cuentas por cobrar, préstamos y cartera vencida',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-600',
      stats: 'Análisis crediticio'
    },
    { 
      id: 'services' as const, 
      title: 'Pago de Servicios', 
      icon: Receipt,
      description: 'Comisiones generadas por pago de servicios',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      textColor: 'text-violet-600',
      stats: `${servicePayments.length} pagos`
    },
  ];

  // Si no hay reporte seleccionado, mostrar grid de cards
  if (!selectedReport) {
    return (
      <div className="p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes y Análisis</h1>
            <p className="text-gray-600 font-medium">
              Selecciona el tipo de reporte que deseas consultar
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] text-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="w-8 h-8 opacity-90" />
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                  General
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {reports.length} Reportes
              </div>
              <div className="text-sm opacity-90">
                Disponibles para análisis
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  Ventas
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {sales.length}
              </div>
              <div className="text-sm text-gray-600">
                Transacciones registradas
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <Calendar className="w-8 h-8 text-green-600" />
                <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Turnos
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {shifts.length}
              </div>
              <div className="text-sm text-gray-600">
                Cortes de caja realizados
              </div>
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map(report => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-gray-200 hover:border-gray-300 p-6 text-left transition-all duration-200 hover:scale-105 active:scale-100"
                >
                  {/* Icon & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${report.bgColor} ${report.textColor} border-2 ${report.borderColor}`}>
                      {report.stats}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#EC0000] transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-4 flex items-center text-sm font-bold text-[#EC0000] opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver reporte
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Footer */}
          <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 mb-1">💡 Consejos para reportes</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Revisa los reportes de ventas diariamente para detectar tendencias</li>
                  <li>• Analiza la rotación de inventario para optimizar tus compras</li>
                  <li>• Monitorea el desempeño de cajeros para mejorar la productividad</li>
                  <li>• Utiliza los reportes de clientes para estrategias de marketing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar el reporte seleccionado con botón de regresar
  const currentReport = reports.find(r => r.id === selectedReport);
  const ReportIcon = currentReport?.icon || BarChart3;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Regresar
            </button>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentReport?.color} flex items-center justify-center shadow-lg`}>
                <ReportIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Reporte de {currentReport?.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {currentReport?.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedReport === 'sales' && (
          <SalesReportsTab sales={sales} products={products} />
        )}
        {selectedReport === 'products' && (
          <ProductReportsTab sales={sales} products={products} />
        )}
        {selectedReport === 'categories' && (
          <CategoryReportsTab sales={sales} products={products} />
        )}
        {selectedReport === 'cashiers' && (
          <CashierReportsTab shifts={shifts} sales={sales} />
        )}
        {selectedReport === 'profitability' && (
          <ProfitabilityReportsTab sales={sales} products={products} />
        )}
        {selectedReport === 'inventory' && (
          <InventoryReportsTab products={products} sales={sales} />
        )}
        {selectedReport === 'customers' && (
          <CustomerReportsTab customers={customers} sales={sales} />
        )}
        {selectedReport === 'loyalty' && (
          <LoyaltyReportsTab customers={customers} sales={sales} />
        )}
        {selectedReport === 'promotions' && (
          <PromotionsReportsTab sales={sales} products={products} />
        )}
        {selectedReport === 'credit' && (
          <CreditReportsTab customers={customers} sales={sales} />
        )}
        {selectedReport === 'services' && (
          <ServicesReportsTab servicePayments={servicePayments} />
        )}
      </div>
    </div>
  );
}
