import { useState } from 'react';
import { Percent, Tag, Zap, Gift } from 'lucide-react';
import { PromotionsListTab } from '@/app/components/pos/promotions/PromotionsListTab';
import { CreatePromotionWizard } from '@/app/components/pos/promotions/CreatePromotionWizard';
import { CouponsTab } from '@/app/components/pos/promotions/CouponsTab';
import { ActiveDealsTab } from '@/app/components/pos/promotions/ActiveDealsTab';
import type { Promotion, Coupon, Product, Customer } from '@/types/pos';

interface PromotionsManagementProps {
  products: Product[];
  customers: Customer[];
}

type TabType = 'list' | 'create' | 'coupons' | 'active';

export function PromotionsManagement({ products, customers }: PromotionsManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const tabs = [
    { 
      id: 'list' as TabType, 
      label: 'Promociones', 
      icon: Percent,
      count: promotions.filter(p => p.status === 'active').length
    },
    { 
      id: 'active' as TabType, 
      label: 'Ofertas Activas', 
      icon: Zap,
      count: promotions.filter(p => p.status === 'active').length
    },
    { 
      id: 'coupons' as TabType, 
      label: 'Cupones', 
      icon: Tag,
      count: coupons.filter(c => c.status === 'active').length
    },
    { 
      id: 'create' as TabType, 
      label: 'Crear Nueva', 
      icon: Gift,
    },
  ];

  const handlePromotionCreated = (promotion: Promotion) => {
    setPromotions([promotion, ...promotions]);
    setActiveTab('list');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-40">
        <div className="px-4 pt-2 pb-3">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-lg shadow-red-500/30'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'list' && (
          <PromotionsListTab
            promotions={promotions}
            products={products}
            onUpdatePromotions={setPromotions}
            onCreateNew={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'create' && (
          <CreatePromotionWizard
            products={products}
            customers={customers}
            onComplete={handlePromotionCreated}
            onCancel={() => setActiveTab('list')}
          />
        )}

        {activeTab === 'coupons' && (
          <CouponsTab
            coupons={coupons}
            products={products}
            customers={customers}
            onUpdateCoupons={setCoupons}
          />
        )}

        {activeTab === 'active' && (
          <ActiveDealsTab
            promotions={promotions.filter(p => p.status === 'active')}
            products={products}
          />
        )}
      </div>
    </div>
  );
}
