import { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_BRANCHES, INITIAL_USERS, INITIAL_CUSTOMERS,
  INITIAL_CALL_LOGS, INITIAL_PRODUCTS, INITIAL_SALES,
  INITIAL_NOTIFICATIONS, INITIAL_LABELS, INITIAL_FILTER_PRESETS,
} from './data/mockData';
import {
  Customer, CallLog, User, Branch, ProductItem, ProductSale,
  CustomerStage, Notification, Label, FilterPreset, BranchReassignmentEntry,
} from './types/crm';
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
import { CalendarFollowUpsView } from './components/CalendarFollowUpsView';
import { LeaderboardView } from './components/LeaderboardView';
import { CustomerLeadboardView } from './components/CustomerLeadboardView';
import { MainCommunicationFeedView } from './components/MainCommunicationFeedView';

export function App() {
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('ttm_crm_branches');
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ttm_crm_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ttm_crm_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('ttm_crm_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
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
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('ttm_crm_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [labels, setLabels] = useState<Label[]>(() => {
    const saved = localStorage.getItem('ttm_crm_labels');
    return saved ? JSON.parse(saved) : INITIAL_LABELS;
  });
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(() => {
    const saved = localStorage.getItem('ttm_crm_filter_presets');
    return saved ? JSON.parse(saved) : INITIAL_FILTER_PRESETS;
  });
  const [isIncomingCallOpen, setIsIncomingCallOpen] = useState(false);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('ttm_crm_onboarded'));

  useEffect(() => {
    if (showOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(false);
        localStorage.setItem('ttm_crm_onboarded', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);

  useEffect(() => {
    localStorage.setItem('ttm_crm_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('ttm_crm_current_user', JSON.stringify(currentUser));
  }, [currentUser]);
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
  useEffect(() => {
    localStorage.setItem('ttm_crm_notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('ttm_crm_labels', JSON.stringify(labels));
  }, [labels]);
  useEffect(() => {
    localStorage.setItem('ttm_crm_filter_presets', JSON.stringify(filterPresets));
  }, [filterPresets]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const addToast = useCallback((message: string, type: string = 'info') => {
    const id = 'toast_' + Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Auto-reassignment logic
  const checkAndTriggerReassignment = useCallback((customer: Customer, saleBranchId: string): Customer | null => {
    const currentMainBranchId = customer.mainBranchId;
    const currentStreak = customer.consecutivePurchaseStreak?.[saleBranchId] || 0;
    const newStreak = currentStreak + 1;
    const newStreaks = { ...customer.consecutivePurchaseStreak, [saleBranchId]: newStreak };

    // Reset streaks for other branches if they buy from a different branch
    const updatedStreaks: Record<string, number> = {};
    updatedStreaks[saleBranchId] = newStreak;

    if (newStreak >= 5 && saleBranchId !== currentMainBranchId) {
      const newBranch = branches.find(b => b.id === saleBranchId);
      const oldBranch = branches.find(b => b.id === currentMainBranchId);
      const now = new Date().toISOString();

      const reassignmentEntry: BranchReassignmentEntry = {
        previousBranch: oldBranch?.name || 'Unknown',
        previousBranchId: currentMainBranchId,
        newBranch: newBranch?.name || 'Unknown',
        newBranchId: saleBranchId,
        dateTime: now,
        reason: `Reassigned: 5 consecutive purchases at ${newBranch?.name || saleBranchId}`,
      };

      // Create notification for new branch manager
      const newBranchManager = users.find(u => u.branchId === saleBranchId && (u.role === 'Branch Manager' || u.role === 'Admin'));
      if (newBranchManager) {
        const newNotification: Notification = {
          id: 'n_' + Date.now(),
          recipientUserId: newBranchManager.id,
          type: 'branch_reassignment',
          title: '🎉 Customer Reassigned',
          message: `${customer.customerName} is now one of ${newBranch?.name}'s customers after 5 consecutive purchases.`,
          read: false,
          createdAt: now,
        };
        setNotifications(prev => [newNotification, ...prev]);
      }

      // Optional: notify old branch manager
      const oldBranchManager = users.find(u => u.branchId === currentMainBranchId && (u.role === 'Branch Manager' || u.role === 'Admin'));
      if (oldBranchManager && oldBranchManager.id !== newBranchManager?.id) {
        const oldNotification: Notification = {
          id: 'n_' + (Date.now() + 1),
          recipientUserId: oldBranchManager.id,
          type: 'branch_reassignment',
          title: 'Customer Moved',
          message: `${customer.customerName} has moved to ${newBranch?.name}.`,
          read: false,
          createdAt: now,
        };
        setNotifications(prev => [oldNotification, ...prev]);
      }

      const updatedCustomer: Customer = {
        ...customer,
        mainBranchId: saleBranchId,
        branchId: saleBranchId,
        consecutivePurchaseStreak: updatedStreaks,
        branchReassignmentLog: [...(customer.branchReassignmentLog || []), reassignmentEntry],
        updatedAt: now,
      };

      addToast(`🎉 ${customer.customerName} reassigned to ${newBranch?.name}`, 'success');
      return updatedCustomer;
    }

    // Update streak without reassignment
    const updatedCustomer: Customer = {
      ...customer,
      consecutivePurchaseStreak: updatedStreaks,
      updatedAt: new Date().toISOString(),
    };
    return updatedCustomer;
  }, [branches, users, addToast]);

  // Persist sales to trigger reassignment check
  const handleRecordSale = useCallback((newSale: ProductSale) => {
    const customer = customers.find(c => c.id === newSale.customerId);
    if (customer) {
      const updated = checkAndTriggerReassignment(customer, customer.branchId);
      if (updated && updated.id !== customer.id) {
        setCustomers(prev => prev.map(c => c.id === customer.id ? updated : c));
      }
    }
    setSales(prev => [newSale, ...prev]);
    const updatedCust = customers.find(c => c.id === newSale.customerId);
    if (updatedCust) {
      setCustomers(prev => prev.map(c =>
        c.id === newSale.customerId
          ? { ...c, lastContactedDate: newSale.saleDate, updatedAt: new Date().toISOString() }
          : c
      ));
    }
    // Activity Notification
    const notif: Notification = {
      id: 'n_' + Date.now(),
      recipientUserId: currentUser.id,
      type: 'system',
      title: '💰 New Sale Recorded',
      message: `${updatedCust?.customerName || 'Customer'} purchased items for ${newSale.saleAmount.toLocaleString()} ETB.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
    addToast(`New sale recorded: ${newSale.saleAmount.toLocaleString()} ETB`, 'success');
  }, [customers, checkAndTriggerReassignment, currentUser.id, addToast]);

  const handleSaveCallLog = (newLog: CallLog, updatedCustomer?: Partial<Customer>, newCustomer?: Customer) => {
    if (newCustomer) {
      setCustomers(prev => [newCustomer, ...prev]);
      const notif: Notification = {
        id: 'n_' + Date.now(),
        recipientUserId: currentUser.id,
        type: 'system',
        title: '👤 New Customer Registered',
        message: `${newCustomer.customerName} registered successfully.`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev]);
    }
    setCallLogs(prev => [newLog, ...prev]);
    if (updatedCustomer && Object.keys(updatedCustomer).length > 0) {
      setCustomers(prev => prev.map(c => {
        if (c.id === newLog.customerId) return { ...c, ...updatedCustomer, updatedAt: new Date().toISOString() };
        return c;
      }));
    }
    const cust = customers.find(c => c.id === newLog.customerId) || newCustomer;
    const notifLog: Notification = {
      id: 'n_' + (Date.now() + 1),
      recipientUserId: currentUser.id,
      type: 'system',
      title: '📞 Call Logged',
      message: `Call logged for ${cust?.customerName || 'Client'}: ${newLog.purpose} (${newLog.durationMinutes}m).`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notifLog, ...prev]);
    addToast('Call log saved successfully', 'success');
  };

  const handleAddCustomer = (newCust: Customer) => {
    setCustomers(prev => [newCust, ...prev]);
    const notif: Notification = {
      id: 'n_' + Date.now(),
      recipientUserId: currentUser.id,
      type: 'system',
      title: '👤 Client Added',
      message: `New printing client added: ${newCust.customerName}.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
    addToast(`Added client ${newCust.customerName}`, 'success');
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
    const notif: Notification = {
      id: 'n_' + Date.now(),
      recipientUserId: currentUser.id,
      type: 'system',
      title: '✏️ Client Updated',
      message: `Updated profile for ${updatedCust.customerName}.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setCallLogs(prev => prev.filter(cl => cl.customerId !== customerId));
    if (selectedCustomerForDetail?.id === customerId) setSelectedCustomerForDetail(null);
    const notif: Notification = {
      id: 'n_' + Date.now(),
      recipientUserId: currentUser.id,
      type: 'system',
      title: '🗑️ Client Deleted',
      message: `Removed client ${cust?.customerName || customerId} from system.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
    addToast('Customer record deleted', 'info');
  };

  const handleUpdateCustomerStage = (customerId: string, newStage: CustomerStage) => {
    let custName = '';
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        custName = c.customerName;
        return { ...c, customerStage: newStage, updatedAt: new Date().toISOString() };
      }
      return c;
    }));
    const notif: Notification = {
      id: 'n_' + Date.now(),
      recipientUserId: currentUser.id,
      type: 'system',
      title: '📊 Stage Changed',
      message: `${custName || 'Client'} stage updated to ${newStage}.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
    addToast(`${custName || 'Client'} moved to ${newStage}`, 'success');
  };
  const handleSelectCustomer = (customer: Customer) => { setSelectedCustomerForDetail(customer); setActiveTab('customers'); };

  // Branch Manager assignment
  const handleAssignBranchManager = (branchId: string, managerUserId: string) => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, managerId: managerUserId } : b));
    const branch = branches.find(b => b.id === branchId);
    const manager = users.find(u => u.id === managerUserId);
    if (branch && manager) addToast(`${manager.name} assigned as Branch Manager for ${branch.name}`, 'success');
  };

  // Notification management
  const markNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };
  const unreadNotifCount = notifications.filter(n => !n.read && n.recipientUserId === currentUser.id).length;

  // Label management
  const handleAddLabel = (newLabel: Label) => { setLabels(prev => [...prev, newLabel]); };
  const handleDeleteLabel = (labelId: string) => { setLabels(prev => prev.filter(l => l.id !== labelId)); };

  return (
    <div className="min-h-screen flex bg-[#09090b] text-zinc-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 ml-64 flex flex-col min-h-screen bg-[#09090b]">
        <Header
          branches={branches} selectedBranchId={selectedBranchId} setSelectedBranchId={setSelectedBranchId}
          currentUser={currentUser} setCurrentUser={setCurrentUser} users={users}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm} theme={theme} onToggleTheme={toggleTheme}
          onOpenNotifications={() => setActiveTab('dashboard')}
          onOpenIncomingCall={() => setIsIncomingCallOpen(true)}
          unreadNotifCount={unreadNotifCount}
          notifications={notifications}
          onMarkRead={markNotificationRead}
        />

        <main className="flex-1 p-8 mt-14 overflow-y-auto bg-[#09090b]">
          {activeTab === 'dashboard' && (
            <Dashboard customers={customers} callLogs={callLogs} users={users} branches={branches}
              selectedBranchId={selectedBranchId} onOpenIncomingCall={() => setIsIncomingCallOpen(true)}
              onSelectCustomer={handleSelectCustomer} setActiveTab={setActiveTab} theme={theme}
              notifications={notifications} unreadCount={unreadNotifCount} />
          )}
          {activeTab === 'customers' && (
            <CustomerListView customers={customers} branches={branches} users={users} callLogs={callLogs}
              selectedBranchId={selectedBranchId} products={products} theme={theme}
              onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer} onOpenLogCallForCustomer={() => setIsIncomingCallOpen(true)}
              initialSelectedCustomer={selectedCustomerForDetail}
              filterPresets={filterPresets} />
          )}
          {activeTab === 'customer-leadboard' && (
            <CustomerLeadboardView customers={customers} callLogs={callLogs} sales={sales} branches={branches}
              users={users} theme={theme} onSelectCustomer={handleSelectCustomer}
              onOpenLogCall={() => setIsIncomingCallOpen(true)} />
          )}
          {activeTab === 'communications' && (
            <MainCommunicationFeedView customers={customers} callLogs={callLogs} users={users} branches={branches}
              currentUser={currentUser} selectedBranchId={selectedBranchId} theme={theme}
              onSelectCustomer={handleSelectCustomer} onOpenLogCall={() => setIsIncomingCallOpen(true)}
              products={products} />
          )}
          {activeTab === 'calendar' && (
            <CalendarFollowUpsView customers={customers} branches={branches} users={users} selectedBranchId={selectedBranchId}
              theme={theme} onSelectCustomer={handleSelectCustomer} onOpenLogCall={() => setIsIncomingCallOpen(true)}
              onUpdateCustomer={handleUpdateCustomer} />
          )}
          {activeTab === 'leaderboard' && (
            <LeaderboardView customers={customers} callLogs={callLogs} users={users} branches={branches}
              sales={sales} theme={theme} />
          )}
          {activeTab === 'reports' && (
            <ReportsView customers={customers} callLogs={callLogs} sales={sales} branches={branches}
              selectedBranchId={selectedBranchId} theme={theme} />
          )}
          {activeTab === 'products' && (
            <ProductStoreView products={products} sales={sales} customers={customers} theme={theme}
              onAddProduct={(item) => setProducts(prev => [item, ...prev])}
              onDeleteProduct={(id) => setProducts(prev => prev.filter(p => p.id !== id))}
              onRecordSale={handleRecordSale} />
          )}
          {activeTab === 'import-export' && (
            <ImportExportView customers={customers} branches={branches} theme={theme}
              onImportCustomers={(newCusts) => setCustomers(prev => [...newCusts, ...prev])} />
          )}
          {activeTab === 'settings' && (
            <SettingsView branches={branches} users={users} theme={theme}
              onAddBranch={(b) => setBranches(prev => [...prev, b])}
              onAddUser={(u) => setUsers(prev => [...prev, u])}
              onAssignBranchManager={handleAssignBranchManager}
              labels={labels} onAddLabel={handleAddLabel} onDeleteLabel={handleDeleteLabel} />
          )}
        </main>
      </div>

      <IncomingCallWidget isOpen={isIncomingCallOpen} onClose={() => setIsIncomingCallOpen(false)}
        customers={customers} currentUser={currentUser} theme={theme}
        onSaveCallLog={handleSaveCallLog} onSelectCustomer={handleSelectCustomer} products={products} />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {showOnboarding && (
          <div className="px-4 py-3 rounded-lg border shadow-lg text-sm font-medium animate-fade-in bg-amber-950/90 border-amber-700 text-amber-200">
            🎉 Welcome to TTM CRM! Explore branches, manage customers, and track your pipeline.
          </div>
        )}
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg border shadow-lg text-sm font-medium animate-fade-in ${
            t.type === 'success' ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200' :
            'bg-zinc-900 border-zinc-700 text-zinc-200'
          }`}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}

export default App;
