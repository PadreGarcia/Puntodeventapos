import { useState } from 'react';
import { Users, CreditCard, Award, DollarSign, Wifi, TrendingUp } from 'lucide-react';
import { CustomersListTab } from '@/app/components/pos/customers/CustomersListTab';
import { CustomerDetailTab } from '@/app/components/pos/customers/CustomerDetailTab';
import { LoyaltyProgramTab } from '@/app/components/pos/customers/LoyaltyProgramTab';
import { CreditAccountsTab } from '@/app/components/pos/customers/CreditAccountsTab';
import { LoansTab } from '@/app/components/pos/customers/LoansTab';
import { NFCCardsTab } from '@/app/components/pos/customers/NFCCardsTab';
import type { 
  Customer, 
  NFCCard, 
  LoyaltyTransaction,
  CreditAccount,
  Loan,
  Sale,
  User
} from '@/types/pos';
import { hasPermission, MODULES } from '@/utils/permissions';

interface CustomerManagementProps {
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
  sales: Sale[];
  currentUser?: User | null;
}

type TabType = 'list' | 'detail' | 'loyalty' | 'credit' | 'loans' | 'nfc';

export function CustomerManagement({ customers, onUpdateCustomers, sales, currentUser }: CustomerManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [nfcCards, setNfcCards] = useState<NFCCard[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  
  // Permisos
  const canCreate = hasPermission(currentUser, MODULES.CUSTOMERS, 'create');
  const canEdit = hasPermission(currentUser, MODULES.CUSTOMERS, 'edit');
  const canDelete = hasPermission(currentUser, MODULES.CUSTOMERS, 'delete');

  const tabs = [
    { 
      id: 'list' as TabType, 
      label: 'Clientes', 
      icon: Users,
      count: customers.length
    },
    { 
      id: 'nfc' as TabType, 
      label: 'Tarjetas NFC', 
      icon: Wifi,
      count: nfcCards.length
    },
    { 
      id: 'loyalty' as TabType, 
      label: 'Programa de Lealtad', 
      icon: Award,
      count: loyaltyTransactions.length
    },
    { 
      id: 'credit' as TabType, 
      label: 'Cuentas por Cobrar', 
      icon: CreditCard,
      count: creditAccounts.filter(c => c.status !== 'paid').length
    },
    { 
      id: 'loans' as TabType, 
      label: 'Préstamos', 
      icon: DollarSign,
      count: loans.filter(l => l.status === 'active').length
    },
  ];

  const handleViewCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('detail');
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
          <CustomersListTab
            customers={customers}
            onUpdateCustomers={onUpdateCustomers}
            onViewDetail={handleViewCustomerDetail}
            nfcCards={nfcCards}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'detail' && selectedCustomer && (
          <CustomerDetailTab
            customer={selectedCustomer}
            sales={sales.filter(s => s.customerId === selectedCustomer.id)}
            creditAccounts={creditAccounts.filter(c => c.customerId === selectedCustomer.id)}
            loans={loans.filter(l => l.customerId === selectedCustomer.id)}
            loyaltyTransactions={loyaltyTransactions.filter(t => t.customerId === selectedCustomer.id)}
            onBack={() => setActiveTab('list')}
            onUpdateCustomer={(updated) => {
              onUpdateCustomers(customers.map(c => c.id === updated.id ? updated : c));
              setSelectedCustomer(updated);
            }}
          />
        )}

        {activeTab === 'nfc' && (
          <NFCCardsTab
            cards={nfcCards}
            customers={customers}
            onUpdateCards={setNfcCards}
          />
        )}

        {activeTab === 'loyalty' && (
          <LoyaltyProgramTab
            customers={customers}
            transactions={loyaltyTransactions}
            onUpdateCustomers={onUpdateCustomers}
            onUpdateTransactions={setLoyaltyTransactions}
          />
        )}

        {activeTab === 'credit' && (
          <CreditAccountsTab
            accounts={creditAccounts}
            customers={customers}
            onUpdateAccounts={setCreditAccounts}
            onUpdateCustomers={onUpdateCustomers}
          />
        )}

        {activeTab === 'loans' && (
          <LoansTab
            loans={loans}
            customers={customers}
            onUpdateLoans={setLoans}
            onUpdateCustomers={onUpdateCustomers}
          />
        )}
      </div>
    </div>
  );
}
