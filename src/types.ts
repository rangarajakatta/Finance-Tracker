export type TransactionType = 'income' | 'expense';

export type FilterPeriod = 'today' | 'week' | 'month' | 'all' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export type ActivePage = 'cashflow' | 'dues';

export type DueType = 'receivable' | 'payable';

export type DueStatus = 'due' | 'partly_due' | 'settled';

export type DueFilterType = 'all' | 'receivable' | 'payable' | 'settled';

export type AccountFilter = 'all' | 'bank' | 'credit_card';

export type TxTypeFilter = 'all' | 'income' | 'expense';

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  linkedTransactionId?: string; // If synced to Income/Expense transaction
  createdAt: number;
}

export interface DueRecord {
  id: string;
  type: DueType; // 'receivable' = Owed to me; 'payable' = I owe
  personOrEntity: string; // Legacy or combined display name
  personName?: string; // Field 1: Name of the person
  organization?: string; // Field 2: Name of the organization
  purpose: string; // e.g. "Dinner split", "Credit Card Statement", "Travel advance"
  totalAmount: number;
  paidAmount: number; // Sum of partial payments received or paid
  status: DueStatus;
  startDate: string; // YYYY-MM-DD (Date money was lent/borrowed)
  dueDate: string; // YYYY-MM-DD (Due payment date)
  settledDate?: string; // YYYY-MM-DD (When fully marked settled)
  phone?: string;
  notes?: string;
  paymentHistory?: PaymentEntry[];
  createdAt: number;
}

export interface PersonDueSummary {
  personOrEntity: string;
  dues: DueRecord[];
  transactionCount: number;
  totalReceivable: number;
  totalPayable: number;
  remainingReceivable: number;
  remainingPayable: number;
  netAmount: number; // positive = to receive, negative = to pay
  pendingCount: number;
  settledCount: number;
  overdueCount: number;
  earliestDueDate?: string;
  phone?: string;
}

export type PaymentMethod = 'bank' | 'credit_card';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  subCategory?: string; // For expenses: 'Personal' | 'Business' | custom
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  note: string;
  paymentMethod?: PaymentMethod; // 'bank' | 'credit_card'
  isCreditCardPayment?: boolean; // True if this transaction is paying off credit card due
  linkedDueId?: string; // If synced from a receivable/payable due
  linkedPaymentId?: string; // The specific payment log entry ID
  createdAt: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  type: TransactionType;
  iconName: string;
  color: string;
  bgLight: string;
  isCustom?: boolean;
}

export interface UserSettings {
  currency: string;
  currencyCode: string;
  monthlyBudget: number;
  budgetAlertThreshold: number; // percentage, e.g. 80
  initialBankBalance?: number; // Starting balance for bank account
  initialCreditCardDue?: number; // Starting credit card dues payable
}

