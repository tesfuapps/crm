import { useState, useEffect } from 'react';
import { 
  INITIAL_BRANCHES, 
  INITIAL_USERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_CALL_LOGS, 
  INITIAL_PRODUCTS, 
  INITIAL_SALES 
} from './data/mockData';
import { Customer, CallLog, User, Branch, ProductItem, ProductSale, CustomerStage } from './types/crm';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CustomerListView } from './components/CustomerListView';
import { PipelineBoard } from './components/PipelineBoard';
import { ReportsView } from './components/ReportsView';
import { ProductStoreView } from './components/ProductStoreView';
import { ImportExportView } from './components/ImportExportView';
import { SettingsView } from './components/SettingsView';
import { IncomingCallWidget } from './components/IncomingCallWidget';

export function App() {
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('ttm_crm_branches');
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ttm_crm_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Dawit Bekele (Admin)
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // CRM State stored in memory/localStorage
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('ttm_crm_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    const saved = localStorage.getItem('ttm_crm_call_logs');
    return saved ? JSON.parse(saved) : INITIAL_CALL_LOGS;
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('ttm_crm_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<ProductSale[]>(() => {
    const saved = localStorage.getItem('ttm_crm_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [isIncomingCallOpen, setIsIncomingCallOpen] = useState(false);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);

  // Keyboard shortcut listener: Alt + I (Incoming Call)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsIncomingCallOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem('ttm_crm_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('ttm_crm_call_logs', JSON.stringify(callLogs));
  }, [callLogs]);

  useEffect(() => {
    localStorage.setItem('ttm_crm_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ttm_crm_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('ttm_crm_branches', JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem('ttm_crm_users', JSON.stringify(users));
  }, [users]);

  const handleSaveCallLog = (newLog: CallLog, updatedCustomer?: Partial<Customer>, newCustomer?: Customer) => {
    if (newCustomer) {
      setCustomers(prev => [newCustomer, ...prev]);
    }
    setCallLogs(prev => [newLog, ...prev]);
    if (updatedCustomer && Object.keys(updatedCustomer).length > 0) {
      setCustomers(prev => prev.map(c => {
        if (c.id === newLog.customerId) {
          return {
            ...c,
            ...updatedCustomer,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));
    }
  };

  const handleAddCustomer = (newCust: Customer) => {
    setCustomers(prev => [newCust, ...prev]);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setCallLogs(prev => prev.filter(cl => cl.customerId !== customerId));
    if (selectedCustomerForDetail?.id === customerId) {
      setSelectedCustomerForDetail(null);
    }
  };

  const handleUpdateCustomerStage = (customerId: string, newStage: CustomerStage) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { ...c, customerStage: newStage, updatedAt: new Date().toISOString() };
      }
      return c;
    }));
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerForDetail(customer);
    setActiveTab('customers');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenIncomingCall={() => setIsIncomingCallOpen(true)} 
      />

      {/* Main Layout */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header 
          branches={branches}
          selectedBranchId={selectedBranchId}
          setSelectedBranchId={setSelectedBranchId}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          users={users}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onOpenNotifications={() => setActiveTab('dashboard')}
          onOpenIncomingCall={() => setIsIncomingCallOpen(true)}
        />

        <main className="flex-1 p-8 mt-16 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              customers={customers}
              callLogs={callLogs}
              users={users}
              branches={branches}
              selectedBranchId={selectedBranchId}
              onOpenIncomingCall={() => setIsIncomingCallOpen(true)}
              onSelectCustomer={handleSelectCustomer}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerListView 
              customers={customers}
              branches={branches}
              users={users}
              callLogs={callLogs}
              selectedBranchId={selectedBranchId}
              products={products}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenLogCallForCustomer={() => setIsIncomingCallOpen(true)}
              initialSelectedCustomer={selectedCustomerForDetail}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineBoard 
              customers={customers}
              branches={branches}
              users={users}
              selectedBranchId={selectedBranchId}
              onUpdateCustomerStage={handleUpdateCustomerStage}
              onSelectCustomer={handleSelectCustomer}
              onOpenLogCall={() => setIsIncomingCallOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView 
              customers={customers}
              callLogs={callLogs}
              sales={sales}
              branches={branches}
              selectedBranchId={selectedBranchId}
            />
          )}

          {activeTab === 'products' && (
            <ProductStoreView 
              products={products}
              sales={sales}
              customers={customers}
              onAddProduct={(item: ProductItem) => setProducts((prev: ProductItem[]) => [item, ...prev])}
              onDeleteProduct={(id: string) => setProducts((prev: ProductItem[]) => prev.filter((p: ProductItem) => p.id !== id))}
              onRecordSale={(sale) => setSales(prev => [sale, ...prev])}
            />
          )}

          {activeTab === 'import-export' && (
            <ImportExportView 
              customers={customers}
              branches={branches}
              onImportCustomers={(newCusts) => setCustomers(prev => [...newCusts, ...prev])}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              branches={branches}
              users={users}
              onAddBranch={(b) => setBranches(prev => [...prev, b])}
              onAddUser={(u) => setUsers(prev => [...prev, u])}
            />
          )}
        </main>
      </div>

      {/* Live Incoming Call Lookup Widget */}
      <IncomingCallWidget 
        isOpen={isIncomingCallOpen}
        onClose={() => setIsIncomingCallOpen(false)}
        customers={customers}
        currentUser={currentUser}
        onSaveCallLog={handleSaveCallLog}
        onSelectCustomer={handleSelectCustomer}
      />
    </div>
  );
}

export default App;
