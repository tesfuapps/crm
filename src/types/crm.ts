export type CustomerStage = 'Contact' | 'Lead' | 'Customer' | 'Client';
export type CustomerType = 'New' | 'Old';
export type LeadPriority = 'Hot' | 'Warm' | 'Cold';
export type UserRole = 'Admin' | 'Branch Manager' | 'Sales Agent';
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
  type: 'branch_reassignment' | 'follow_up_due' | 'stage_change' | 'system';
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
}

export interface ProductItem {
  id: string;
  itemName: string;
  itemDescription: string;
  itemCategory: string;
  itemPrice: number;
  stockQuantity: number;
}

export interface ProductSale {
  id: string;
  customerId: string;
  itemId: string;
  quantity: number;
  saleDate: string;
  saleAmount: number;
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
