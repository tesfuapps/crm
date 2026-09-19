export type CustomerStage = 'Contact' | 'Lead' | 'Customer' | 'Client';
export type CustomerType = 'New' | 'Old';
export type LeadPriority = 'Hot' | 'Warm' | 'Normal' | 'Cold';
export type UserRole = 'Admin' | 'Branch Manager' | 'Sales Agent' | 'Marketing Manager';
export type NewCustomerSource = 'Social' | 'Digital Media' | 'Referral' | 'Telegram' | 'Facebook';
export type OldCustomerSource = 'Previous Buyer' | 'Direct Call' | 'Exhibition' | 'Partner';

export interface Branch {
  id: string;
  name: string;
  managerId?: string;
  subCity: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  branchId: string;
  email: string;
  username?: string;
  mentionAliases?: string[];
}

export interface BranchReassignmentEntry {
  previousBranch: string;
  previousBranchId: string;
  newBranch: string;
  newBranchId: string;
  dateTime: string;
  reason: string;
}

export interface AISummary {
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Hesitant' | 'Urgent';
  keyInterests: string[];
  suggestedAction: string;
  suggestedFollowUpDate?: string;
  generatedAt: string;
}

export interface Customer {
  id: string;
  customerName: string;
  companyName?: string;
  phoneNumber: string;
  alternatePhone?: string;
  email?: string;
  customerType: CustomerType;
  source: string;
  purposeOfCall: string;
  customerStage: CustomerStage;
  assignedUserId: string;
  branchId: string;
  mainBranchId: string;
  nextFollowUpDate?: string;
  lastContactedDate?: string;
  leadPriority: LeadPriority;
  dealValue: number;
  createdAt: string;
  updatedAt: string;
  internalNotes?: string;
  labels?: string[];
  consecutivePurchaseStreak: Record<string, number>;
  branchReassignmentLog: BranchReassignmentEntry[];
  aiSummary?: AISummary;
  tinNumber?: string;
  subCity?: string;
  businessType?: string;
  preferredChannel?: string;
}

export interface ProductRequest {
  id: string;
  customerId: string;
  itemName: string;
  itemCategory: string;
  estimatedQuantity: number;
  targetBudgetEtb?: number;
  status: 'Open' | 'Sourced' | 'Fulfilled' | 'Cancelled';
  notes?: string;
  createdAt: string;
}

export interface AIForecast {
  forecastedRevenue30Days: number;
  confidenceScore: number;
  topOpportunities: string[];
  risksAndBottlenecks: string[];
  executiveSummary: string;
  generatedAt: string;
}

export interface Notification {
  id: string;
  recipientUserId: string;
  type: 'branch_reassignment' | 'follow_up_due' | 'stage_change' | 'system' | 'complaint' | 'mention' | 'after_sales' | string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CallLog {
  id: string;
  customerId: string;
  userId: string;
  dateTime: string;
  durationMinutes: number;
  purpose: string;
  remark: string;
  callStatus?: 'Sales' | 'Evaluation' | 'Service' | 'Out of List' | 'Out of Stock' | 'Pre-order' | 'Complaint';
  productId?: string;
  unlistedProductName?: string;
  isUnlistedProduct?: boolean;
  nextFollowUpDate?: string;
  priceFeedback?: 'accepted' | 'too_high' | 'competitor_cheaper' | string;
  isResolved?: boolean;
  resolutionRemark?: string;
}

export interface FollowUpReminder {
  id: string;
  customerId: string;
  assignedRepId: string;
  title: string;
  purpose: string;
  dueDate: string;
  status: 'pending' | 'completed';
  reminderType: 'manual' | 'after_sales' | 'complaint' | 'mention';
  communicationId?: string;
  saleId?: string;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  itemName: string;
  itemDescription: string;
  itemCategory: string;
  itemPrice: number;
  stockQuantity: number;
}

export type DeliveryScope = 'pickup' | 'addis_ababa' | 'province';
export type AddisDeliveryType = 'own_delivery' | 'outsourced';
export type DeliveryFeePaidBy = 'customer' | 'ttm_free';

export interface ProductSale {
  id: string;
  customerId: string;
  itemId: string;
  quantity: number;
  saleDate: string;
  saleAmount: number;
  salesRepId?: string;
  status?: 'confirmed' | 'cancelled';
  carrier?: string;
  ticketNumber?: string;
  destinationCity?: string;
  fulfillment_type?: 'pickup' | 'delivery';
  delivery_scope?: DeliveryScope;
  addis_delivery_type?: AddisDeliveryType;
  outsourced_provider?: string;
  delivery_fee_paid_by?: DeliveryFeePaidBy;
  vehicle_plate_number?: string;
  driver_name?: string;
  driver_phone?: string;
  branch_name?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  createdBy: string;
}

export interface FilterPreset {
  id: string;
  userId: string;
  name: string;
  filters: {
    stage?: string;
    source?: string;
    priority?: string;
    branchId?: string;
    repId?: string;
    labelId?: string;
    dateRange?: { start: string; end: string };
  };
}
