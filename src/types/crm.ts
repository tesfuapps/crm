export type CustomerStage = 'Contact' | 'Lead' | 'Customer' | 'Client';
export type CustomerType = 'New' | 'Old';
export type LeadPriority = 'Hot' | 'Warm' | 'Cold';
export type UserRole = 'Admin' | 'Branch Manager' | 'Sales Agent';
export type NewCustomerSource = 'Social' | 'Digital Media' | 'Referral' | 'Telegram' | 'Facebook';
export type OldCustomerSource = 'Previous Buyer' | 'Direct Call' | 'Exhibition' | 'Partner';

export interface Branch {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  branchId: string;
  email: string;
}

export interface Customer {
  id: string;
  customerName: string;
  companyName?: string;
  phoneNumber: string;
  alternatePhone?: string;
  email?: string;
  customerType: CustomerType;
  source: string; // e.g. Telegram, Facebook, Referral, Previous Buyer
  purposeOfCall: string;
  customerStage: CustomerStage;
  assignedUserId: string;
  branchId: string;
  nextFollowUpDate?: string;
  leadPriority: LeadPriority;
  dealValue: number;
  createdAt: string;
  updatedAt: string;
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
  itemPrice: number; // in ETB
  stockQuantity: number;
}

export interface ProductSale {
  id: string;
  customerId: string;
  itemId: string;
  quantity: number;
  saleDate: string;
  saleAmount: number; // in ETB
}
