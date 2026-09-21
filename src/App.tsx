import { useState, useEffect, useCallback, useRef } from 'react';
import {
  INITIAL_BRANCHES, INITIAL_USERS, INITIAL_CUSTOMERS,
  INITIAL_CALL_LOGS, INITIAL_PRODUCTS, INITIAL_SALES,
  INITIAL_NOTIFICATIONS, INITIAL_LABELS, INITIAL_FILTER_PRESETS,
} from './data/mockData';
import { OFFICIAL_TTM_CATALOG } from './data/officialCatalog';
import {
  Customer, CallLog, User, Branch, ProductItem, ProductSale,
  CustomerStage, Notification, Label, FilterPreset, BranchReassignmentEntry, FollowUpReminder,
} from './types/crm';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CustomerListView } from './components/CustomerListView';
import { PipelineBoard } from './components/PipelineBoard';
import { ReportsView } from './components/ReportsView';
import { ProductStoreView } from './components/ProductStoreView';
import { SalesView } from './components/SalesView';
import { ImportExportView } from './components/ImportExportView';
import { SettingsView } from './components/SettingsView';
import { IncomingCallWidget } from './components/IncomingCallWidget';
import { CalendarFollowUpsView } from './components/CalendarFollowUpsView';
import { LeaderboardView } from './components/LeaderboardView';
import { CustomerLeadboardView } from './components/CustomerLeadboardView';
import { MainCommunicationFeedView } from './components/MainCommunicationFeedView';
import { NotificationsView } from './components/NotificationsView';
import { CommandPalette } from './components/CommandPalette';
import { AiCopilotDrawer } from './components/AiCopilotDrawer';
import { SystemHelpModal } from './components/SystemHelpModal';
import { callAutomation, afterSalesReminder, requiresFollowUp } from './services/followUpService';
import { getCustomers, getCommunications, getProducts, getNotifications, logCommunication, recordSale } from './services/api';
import { useRealtimeSync } from './hooks/useRealtimeSync';

const CURRENT_SCHEMA_VERSION = 4;
try {
  const savedVersion = Number(localStorage.getItem('ttm_schema_version') || 0);
  if (savedVersion < CURRENT_SCHEMA_VERSION) {
    console.warn(`Upgrading TTM CRM schema from v${savedVersion} to v${CURRENT_SCHEMA_VERSION}...`);
    localStorage.removeItem('ttm_crm_customers');
    localStorage.removeItem('ttm_crm_call_logs');
    localStorage.setItem('ttm_schema_version', String(CURRENT_SCHEMA_VERSION));
  }
} catch {}

export function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ttm_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasOldSaaS = parsed.some((p: any) =>
          p.itemName?.includes('Abyssinia Cloud ERP') ||
          p.itemName?.includes('EthioPOS') ||
          p.itemName?.includes('Habesha Biometric') ||
          p.itemCategory === 'Software' ||
          p.itemCategory === 'Services' ||
          p.itemCategory === 'SaaS'
        );
        if (hasOldSaaS || parsed.length < 10) {
          localStorage.setItem('ttm_crm_products', JSON.stringify(OFFICIAL_TTM_CATALOG));
          return OFFICIAL_TTM_CATALOG;
        }
        return parsed;
      } catch { /* fall through */ }
    }
    localStorage.setItem('ttm_crm_products', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
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
  const [reminders, setReminders] = useState<FollowUpReminder[]>(() => {
    const saved = localStorage.getItem('ttm_crm_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem('ttm_crm_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    async function loadSupabaseData() {
      try {
        const [remoteCusts, remoteComms, remoteProds, remoteNotifs] = await Promise.all([
          getCustomers().catch(() => []),
          getCommunications().catch(() => []),
          getProducts().catch(() => []),
          getNotifications().catch(() => []),
        ]);
        if (remoteCusts.length > 0) {
          setCustomers(remoteCusts.map((c: any) => ({
            id: c.id,
            customerName: c.name,
            companyName: c.company_name,
            phoneNumber: c.phone_number,
            customerType: 'Old',
            source: 'Telegram',
            purposeOfCall: 'Inquiry',
            customerStage: c.priority === 'Hot' ? 'Lead' : 'Client',
            assignedUserId: 'u1',
            branchId: c.main_branch || 'b1',
            mainBranchId: c.main_branch || 'b1',
            leadPriority: c.priority || 'Normal',
            dealValue: Number(c.lifetime_spent_etb) || 0,
            consecutivePurchaseStreak: {},
            branchReassignmentLog: [],
            createdAt: c.created_at,
            updatedAt: c.created_at,
          } as Customer)));
        }
        if (remoteComms.length > 0) {
          setCallLogs(remoteComms.map((cl: any) => ({
            id: cl.id,
            customerId: cl.customer_id,
            userId: cl.sales_rep_id || 'u1',
            dateTime: cl.call_date,
            durationMinutes: Math.round((cl.duration_seconds || 60) / 60),
            purpose: cl.purpose || cl.call_status,
            remark: cl.remarks || '',
            callStatus: cl.call_status,
            productId: cl.product_id,
            unlistedProductName: cl.unlisted_product_name,
            isUnlistedProduct: cl.is_unlisted_product,
            priceFeedback: cl.price_feedback,
          })));
        }
        if (remoteProds.length > 0) {
          setProducts(remoteProds.map((p: any) => ({
            id: p.id,
            itemName: p.name,
            itemDescription: p.code,
            itemCategory: p.category,
            itemPrice: Number(p.base_price_etb) || 0,
            stockQuantity: Number(p.total_stock) || 0,
          })));
        }
        if (remoteNotifs.length > 0) {
          setNotifications(remoteNotifs.map((n: any) => ({
            id: n.id,
            recipientUserId: n.target_user_id || currentUser.id,
            type: n.notification_type,
            title: n.title,
            message: n.message,
            read: n.is_read,
            createdAt: n.created_at,
          })));
        }
      } catch (err) {
        console.warn('Supabase sync offline/unreachable, using local fallback state.', err);
      }
    }
    loadSupabaseData();
  }, []);

  useRealtimeSync(async (table) => {
    if (table === 'communications') {
      const comms = await getCommunications().catch(() => []);
      if (comms.length > 0) {
        setCallLogs(comms.map((cl: any) => ({
          id: cl.id,
          customerId: cl.customer_id,
          userId: cl.sales_rep_id || 'u1',
          dateTime: cl.call_date,
          durationMinutes: Math.round((cl.duration_seconds || 60) / 60),
          purpose: cl.purpose || cl.call_status,
          remark: cl.remarks || '',
          callStatus: cl.call_status,
          productId: cl.product_id,
          unlistedProductName: cl.unlisted_product_name,
          isUnlistedProduct: cl.is_unlisted_product,
          priceFeedback: cl.price_feedback,
        })));
      }
    } else if (table === 'customers') {
      const custs = await getCustomers().catch(() => []);
      if (custs.length > 0) {
        setCustomers(custs.map((c: any) => ({
          id: c.id,
          customerName: c.name,
          companyName: c.company_name,
          phoneNumber: c.phone_number,
          customerType: 'Old',
          source: 'Telegram',
          purposeOfCall: 'Inquiry',
          customerStage: c.priority === 'Hot' ? 'Lead' : 'Client',
          assignedUserId: 'u1',
          branchId: c.main_branch || 'b1',
          mainBranchId: c.main_branch || 'b1',
          leadPriority: c.priority || 'Normal',
          dealValue: Number(c.lifetime_spent_etb) || 0,
          consecutivePurchaseStreak: {},
          branchReassignmentLog: [],
          createdAt: c.created_at,
          updatedAt: c.created_at,
        } as Customer)));
      }
    } else if (table === 'app_notifications') {
      const notifs = await getNotifications().catch(() => []);
      if (notifs.length > 0) {
        setNotifications(notifs.map((n: any) => ({
          id: n.id,
          recipientUserId: n.target_user_id || currentUser.id,
          type: n.notification_type,
          title: n.title,
          message: n.message,
          read: n.is_read,
          createdAt: n.created_at,
        })));
      }
    }
  });

  const [isIncomingCallOpen, setIsIncomingCallOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const toastTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => () => {
    toastTimersRef.current.forEach(timer => window.clearTimeout(timer));
    toastTimersRef.current.clear();
  }, []);

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: string = 'info') => {
    const id = 'toast_' + crypto.randomUUID();
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    const timer = window.setTimeout(() => dismissToast(id), 5000);
    toastTimersRef.current.set(id, timer);
  }, [dismissToast]);

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
    if (sales.some(sale => sale.id === newSale.id)) return;
    newSale = { ...newSale, salesRepId: newSale.salesRepId || currentUser.id, status: newSale.status || 'confirmed' };
    const product = products.find(item => item.id === newSale.itemId);
    const reminder = product ? afterSalesReminder(newSale, product, currentUser.id) : null;
    if (reminder) setReminders(prev => prev.some(item => item.id === reminder.id) ? prev : [...prev, reminder]);
    const customer = customers.find(c => c.id === newSale.customerId);
    if (customer && newSale.status !== 'cancelled') {
      const updated = checkAndTriggerReassignment(customer, customer.branchId);
      if (updated) {
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

    try {
      recordSale({
        customer_id: newSale.customerId,
        product_id: newSale.itemId,
        product_name: product?.itemName || 'Equipment',
        branch_name: customer?.branchId === 'b3' ? 'Piassa Branch' : customer?.branchId === 'b2' ? 'Mexico Branch' : 'Bole Branch',
        sales_rep_id: currentUser.id,
        sales_rep_name: currentUser.name,
        quantity: newSale.quantity,
        sale_amount_etb: newSale.saleAmount,
      }).catch(err => console.warn('Supabase recordSale offline fallback:', err));
    } catch {}
  }, [customers, sales, products, checkAndTriggerReassignment, currentUser.id, addToast]);

  const handleSaveCallLog = (newLog: CallLog, updatedCustomer?: Partial<Customer>, newCustomer?: Customer) => {
    if (callLogs.some(log => log.id === newLog.id)) return;
    if (requiresFollowUp(newLog.callStatus) && !newLog.nextFollowUpDate) {
      addToast('A follow-up date is required for this outcome.');
      return;
    }
    const targetCustomer = newCustomer || customers.find(customer => customer.id === newLog.customerId);
    if (!targetCustomer) return;
    const automation = callAutomation(newLog, targetCustomer, users);
    setReminders(prev => [...prev, ...automation.reminders.filter(item => !prev.some(existing => existing.id === item.id))]);
    setNotifications(prev => [...automation.notifications, ...prev]);
    updatedCustomer = { ...updatedCustomer, lastContactedDate: newLog.dateTime };
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
    addToast(`Call Logged — ${cust?.customerName || 'Client'}: ${newLog.callStatus || newLog.purpose} (${newLog.durationMinutes}m)`, 'success');

    try {
      logCommunication({
        customer_id: newLog.customerId,
        sales_rep_id: currentUser.id,
        sales_rep_name: currentUser.name,
        branch_name: currentUser.branchId === 'b3' ? 'Piassa Branch' : currentUser.branchId === 'b2' ? 'Mexico Branch' : 'Bole Branch',
        call_status: newLog.callStatus || 'Sales',
        purpose: newLog.purpose,
        duration_seconds: (newLog.durationMinutes || 5) * 60,
        customer_type: newCustomer ? 'New' : 'Old',
        lead_source: newCustomer?.source || 'Telegram',
        product_id: newLog.productId !== 'unlisted' ? newLog.productId : null,
        unlisted_product_name: newLog.unlistedProductName,
        is_unlisted_product: newLog.isUnlistedProduct || false,
        price_feedback: newLog.priceFeedback || 'not_discussed',
        remarks: newLog.remark,
      }).catch(err => console.warn('Supabase logCommunication offline fallback:', err));
    } catch {}
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

  const handleUpdateReminder = (updated: FollowUpReminder) => {
    const existing = reminders.find(reminder => reminder.id === updated.id);
    if (!existing) return;
    const next = reminders.map(reminder => reminder.id === updated.id ? { ...reminder, dueDate: updated.dueDate, status: updated.status } : reminder);
    setReminders(next);
    const nextDue = next.filter(reminder => reminder.customerId === existing.customerId && reminder.status === 'pending').map(reminder => reminder.dueDate).sort()[0];
    setCustomers(prev => prev.map(customer => customer.id === existing.customerId ? { ...customer, nextFollowUpDate: nextDue } : customer));
    addToast(updated.status === 'completed' ? 'Follow-up completed' : 'Follow-up rescheduled', 'success');
  };

  const handleDeleteCustomer = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setCallLogs(prev => prev.filter(cl => cl.customerId !== customerId));
    setReminders(prev => prev.filter(reminder => reminder.customerId !== customerId));
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
    <div className="h-screen w-screen overflow-hidden flex bg-[#09090b] text-zinc-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onCollapsedChange={setSidebarCollapsed} />

      <div className={`flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-18' : 'ml-64'}`}>
        <Header
          branches={branches} selectedBranchId={selectedBranchId} setSelectedBranchId={setSelectedBranchId}
          currentUser={currentUser} setCurrentUser={setCurrentUser} users={users}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm} theme={theme} onToggleTheme={toggleTheme}
          onOpenNotifications={() => setActiveTab('dashboard')}
          onOpenIncomingCall={() => setIsIncomingCallOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          unreadNotifCount={unreadNotifCount}
          notifications={notifications}
          onMarkRead={markNotificationRead}
        />

        <main className="flex-1 p-8 overflow-y-auto bg-[#09090b]">
          {activeTab === 'dashboard' && (
             <Dashboard customers={customers} callLogs={callLogs} users={users} branches={branches}
               selectedBranchId={selectedBranchId} onOpenIncomingCall={() => setIsIncomingCallOpen(true)}
               onSelectCustomer={handleSelectCustomer} setActiveTab={setActiveTab} theme={theme}
               notifications={notifications} unreadCount={unreadNotifCount} products={products} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              currentUser={currentUser}
              onMarkRead={markNotificationRead}
              onMarkAllRead={() => {
                setNotifications(prev => prev.map(n => n.recipientUserId === currentUser.id ? { ...n, read: true } : n));
              }}
              theme={theme}
            />
          )}
          {activeTab === 'customers' && (
            <CustomerListView customers={customers} branches={branches} users={users} callLogs={callLogs} sales={sales}
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
              onUpdateCustomer={handleUpdateCustomer}
              reminders={reminders} onUpdateReminder={handleUpdateReminder} />
          )}
          {activeTab === 'leaderboard' && (
            <LeaderboardView customers={customers} callLogs={callLogs} users={users} branches={branches}
              sales={sales} theme={theme} />
          )}
          {activeTab === 'reports' && (
            <ReportsView customers={customers} callLogs={callLogs} sales={sales} branches={branches} products={products}
              selectedBranchId={selectedBranchId} theme={theme} />
          )}
          {activeTab === 'products' && (
            <ProductStoreView products={products} sales={sales} customers={customers} branches={branches} users={users} theme={theme}
              onAddProduct={(item) => setProducts(prev => [item, ...prev])}
              onUpdateProduct={(updated) => setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))}
              onDeleteProduct={(id) => setProducts(prev => prev.filter(p => p.id !== id))}
              onRecordSale={handleRecordSale} />
          )}
          {activeTab === 'sales' && (
            <SalesView sales={sales} products={products} customers={customers} branches={branches} users={users} theme={theme}
              setActiveTab={setActiveTab} onSelectCustomer={handleSelectCustomer} />
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
        customers={customers} branches={branches} currentUser={currentUser} theme={theme}
        onSaveCallLog={handleSaveCallLog} onSelectCustomer={handleSelectCustomer} products={products}
        onRecordSale={handleRecordSale} />

      <CommandPalette
        isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)}
        customers={customers} callLogs={callLogs} products={products}
        users={users} branches={branches} theme={theme}
        setActiveTab={setActiveTab} onSelectCustomer={handleSelectCustomer}
        onOpenIncomingCall={() => setIsIncomingCallOpen(true)} />

      <AiCopilotDrawer
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        customers={customers}
        callLogs={callLogs}
        products={products}
        branches={branches}
        currentUser={currentUser}
      />

      <SystemHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-[150] w-[calc(100%-2rem)] max-w-sm space-y-2 pointer-events-none" role="status" aria-live="polite" aria-relevant="additions">
        {showOnboarding && (
          <div className="px-4 py-3 rounded-lg border shadow-lg text-sm font-medium animate-fade-in bg-amber-950/90 border-amber-700 text-amber-200">
            🎉 Welcome to TTM CRM! Explore branches, manage customers, and track your pipeline.
          </div>
        )}
        {toasts.map(t => (
          <div key={t.id} className="toast-popup pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-xl border border-neutral-800 bg-[#181818] shadow-2xl">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-neutral-100">{t.type === 'success' ? 'Success' : 'Notification'}</h4>
              <p className="text-xs text-neutral-300 mt-0.5 break-words">{t.message}</p>
              <span className="text-[10px] text-neutral-500 mt-1 block">Just now</span>
            </div>
            <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification" className="text-neutral-500 hover:text-neutral-300 px-1">×</button>
            <div aria-hidden="true" className="toast-countdown absolute bottom-0 left-0 h-0.5 bg-amber-500 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
