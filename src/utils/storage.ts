import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Transaction, UserSettings, CategoryInfo, DueRecord } from '../types';
import { loadStoredCategories, loadStoredSubCategories, saveStoredCategories, saveStoredSubCategories } from './categories';
import { calculateRemaining } from './precision';

export const STORAGE_KEY_TRANSACTIONS = 'expense_tracker_transactions_v2';
export const STORAGE_KEY_SETTINGS = 'expense_tracker_settings_v2';
export const STORAGE_KEY_DUES = 'expense_tracker_dues_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  currency: '₹',
  currencyCode: 'INR',
  monthlyBudget: 25000,
  budgetAlertThreshold: 80,
  initialBankBalance: 50000,
  initialCreditCardDue: 4300,
};

// Generates sample dues (receivables & payables)
export function generateSampleDues(): DueRecord[] {
  const now = new Date();
  const formatD = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'due-1',
      type: 'receivable',
      personOrEntity: 'Alex Miller',
      purpose: 'Weekend trip Airbnb split',
      totalAmount: 1400,
      paidAmount: 600,
      status: 'partly_due',
      startDate: formatD(-5),
      dueDate: formatD(3), // due in 3 days
      notes: 'Transferred ₹600 via UPI, remaining ₹800 due Friday.',
      paymentHistory: [
        {
          id: 'pay-1',
          amount: 600,
          date: formatD(-2),
          note: 'Partial payment received',
          createdAt: Date.now() - 2 * 86400000,
        },
      ],
      createdAt: Date.now() - 5 * 86400000,
    },
    {
      id: 'due-2',
      type: 'receivable',
      personOrEntity: 'David Kumar',
      purpose: 'Camera lens borrowed sale',
      totalAmount: 2500,
      paidAmount: 0,
      status: 'due',
      startDate: formatD(-2),
      dueDate: formatD(10), // due in 10 days
      notes: 'Agreed to pay when monthly salary arrives.',
      createdAt: Date.now() - 2 * 86400000,
    },
    {
      id: 'due-4',
      type: 'payable',
      personOrEntity: 'Sarah Jenkins',
      purpose: 'Concert tickets upfront payment',
      totalAmount: 850,
      paidAmount: 850,
      status: 'settled',
      startDate: formatD(-14),
      dueDate: formatD(-2),
      settledDate: formatD(-2),
      notes: 'Fully settled via UPI.',
      paymentHistory: [
        {
          id: 'pay-2',
          amount: 850,
          date: formatD(-2),
          note: 'Full settlement paid',
          createdAt: Date.now() - 2 * 86400000,
        },
      ],
      createdAt: Date.now() - 14 * 86400000,
    },
    {
      id: 'due-5',
      type: 'receivable',
      personOrEntity: 'Alex Miller',
      purpose: 'Dinner & drinks split',
      totalAmount: 550,
      paidAmount: 0,
      status: 'due',
      startDate: formatD(-1),
      dueDate: formatD(5),
      notes: 'Dinner at Italian bistro.',
      createdAt: Date.now() - 1 * 86400000,
    },
  ];
}

// Generates sample transactions relative to current local date
export function generateSampleData(): Transaction[] {
  const now = new Date();
  const formatD = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'tx-1',
      type: 'income',
      amount: 3200,
      category: 'Salary / Wages',
      date: formatD(2),
      time: '09:30',
      note: 'Monthly salary deposit',
      paymentMethod: 'bank',
      createdAt: Date.now() - 2 * 86400000,
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 84.50,
      category: 'Groceries',
      subCategory: 'Personal',
      date: formatD(0),
      time: '18:15',
      note: 'Supermarket weekly fresh supplies',
      paymentMethod: 'bank',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 18.20,
      category: 'Food & Dining',
      subCategory: 'Personal',
      date: formatD(0),
      time: '13:00',
      note: 'Lunch with colleagues',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 18000000,
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 35.00,
      category: 'Transport & Fuel',
      subCategory: 'Business',
      date: formatD(1),
      time: '08:45',
      note: 'Fuel station fill-up for client trip',
      paymentMethod: 'bank',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'tx-5',
      type: 'income',
      amount: 450,
      category: 'Freelance / Projects',
      date: formatD(1),
      time: '16:20',
      note: 'Client logo design completion',
      paymentMethod: 'bank',
      createdAt: Date.now() - 95000000,
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 65.00,
      category: 'Bills & Utilities',
      subCategory: 'Personal',
      date: formatD(3),
      time: '11:10',
      note: 'Home high-speed internet bill',
      paymentMethod: 'bank',
      createdAt: Date.now() - 3 * 86400000,
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 49.99,
      category: 'Shopping',
      subCategory: 'Personal',
      date: formatD(4),
      time: '15:30',
      note: 'New running shoes discount',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 4 * 86400000,
    },
  ];
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (!raw) {
      // Check legacy key if exists
      const legacy = localStorage.getItem('expense_tracker_transactions_v1');
      if (legacy) {
        try {
          const parsedLegacy = JSON.parse(legacy);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            // Migrate: add default subCategory 'Personal' to expenses that don't have it
            const migrated = parsedLegacy.map((t: any) => ({
              ...t,
              subCategory: t.subCategory || (t.type === 'expense' ? 'Personal' : undefined),
              paymentMethod: t.paymentMethod || 'bank',
            }));
            saveTransactions(migrated);
            return migrated;
          }
        } catch {}
      }
      // First visit: initialize with starter sample transactions
      const initial = generateSampleData();
      saveTransactions(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((t) => {
          const isCCPay = Boolean(
            t.isCreditCardPayment ||
            t.category === 'Credit Card Payment' ||
            (t.id && String(t.id).startsWith('tx-ccpay-')) ||
            (t.note && String(t.note).toLowerCase().includes('credit card bill payment'))
          );
          return {
            ...t,
            paymentMethod: t.paymentMethod || 'bank',
            isCreditCardPayment: isCCPay,
          };
        })
      : [];
  } catch (err) {
    console.warn('Failed to load transactions from localStorage:', err);
    return [];
  }
}

export async function loadNativeTransactions(): Promise<Transaction[] | null> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY_TRANSACTIONS });
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((t) => {
          const isCCPay = Boolean(
            t.isCreditCardPayment ||
            t.category === 'Credit Card Payment' ||
            (t.id && String(t.id).startsWith('tx-ccpay-')) ||
            (t.note && String(t.note).toLowerCase().includes('credit card bill payment'))
          );
          return {
            ...t,
            paymentMethod: t.paymentMethod || 'bank',
            isCreditCardPayment: isCCPay,
          };
        });
      }
    }
  } catch (e) {
    console.warn('Native preferences read failed, falling back to localStorage:', e);
  }
  return null;
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    const serialized = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, serialized);
    Preferences.set({ key: STORAGE_KEY_TRANSACTIONS, value: serialized }).catch((err) => {
      console.warn('Preferences.set error:', err);
    });
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

function filterOutCreditCardDues(dues: DueRecord[]): DueRecord[] {
  return dues.filter((d) => {
    if (d.id === 'due-3') return false;
    const name = (d.personOrEntity || '').toLowerCase();
    const pName = (d.personName || '').toLowerCase();
    const purpose = (d.purpose || '').toLowerCase();
    const isCC = name.includes('credit card') || pName.includes('credit card') || purpose.includes('credit card');
    return !isCC;
  });
}

export function loadDues(): DueRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DUES);
    if (!raw) {
      const initial = generateSampleDues();
      saveDues(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = filterOutCreditCardDues(parsed);
      if (cleaned.length !== parsed.length) {
        saveDues(cleaned);
      }
      return cleaned;
    }
    return [];
  } catch (err) {
    console.warn('Failed to load dues from localStorage:', err);
    return [];
  }
}

export async function loadNativeDues(): Promise<DueRecord[] | null> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY_DUES });
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const cleaned = filterOutCreditCardDues(parsed);
        if (cleaned.length !== parsed.length) {
          saveDues(cleaned);
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.warn('Native preferences dues read failed:', e);
  }
  return null;
}

export function saveDues(dues: DueRecord[]): void {
  try {
    const serialized = JSON.stringify(dues);
    localStorage.setItem(STORAGE_KEY_DUES, serialized);
    Preferences.set({ key: STORAGE_KEY_DUES, value: serialized }).catch((err) => {
      console.warn('Preferences.set dues error:', err);
    });
  } catch (err) {
    console.error('Failed to save dues:', err);
  }
}

export async function loadNativeSettings(): Promise<UserSettings | null> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY_SETTINGS });
    if (value) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(value), currency: '₹', currencyCode: 'INR' };
    }
  } catch (e) {
    console.warn('Native preferences settings read failed:', e);
  }
  return null;
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS) || localStorage.getItem('expense_tracker_settings_v1');
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw), currency: '₹', currencyCode: 'INR' };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, serialized);
    Preferences.set({ key: STORAGE_KEY_SETTINGS, value: serialized }).catch((err) => {
      console.warn('Preferences.set settings error:', err);
    });
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function formatTransactionsToCSV(transactions: Transaction[]): string {
  const headers = ['ID', 'Type', 'Amount', 'Payment Method', 'Category', 'Sub Category', 'Date', 'Time', 'Note'];
  const rows = transactions.map((t) => [
    t.id,
    t.type,
    Math.round(Math.abs(t.amount)).toString(),
    t.paymentMethod === 'credit_card' ? 'Credit Card' : 'Bank Account',
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.subCategory || '').replace(/"/g, '""')}"`,
    t.date,
    t.time || '',
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function formatDuesToCSV(dues: DueRecord[]): string {
  const headers = [
    'ID',
    'Type',
    'Person/Entity',
    'Purpose',
    'Total Amount',
    'Paid/Received Amount',
    'Remaining Balance',
    'Status',
    'Start Date',
    'Due Date',
    'Settled Date',
    'Notes',
  ];
  const rows = dues.map((d) => [
    d.id,
    d.type,
    `"${(d.personOrEntity || '').replace(/"/g, '""')}"`,
    `"${(d.purpose || '').replace(/"/g, '""')}"`,
    Math.round(Math.abs(d.totalAmount)).toString(),
    Math.round(Math.abs(d.paidAmount || 0)).toString(),
    Math.round(Math.abs(calculateRemaining(d.totalAmount, d.paidAmount || 0))).toString(),
    d.status,
    d.startDate,
    d.dueDate,
    d.settledDate || '',
    `"${(d.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function formatFullBackupJSON(
  transactions: Transaction[],
  settings: UserSettings,
  categories?: CategoryInfo[],
  subCategories?: string[],
  dues?: DueRecord[]
): string {
  const data = {
    version: 3,
    appName: 'Finance Tracker',
    exportedAt: new Date().toISOString(),
    settings,
    transactions,
    categories: categories || loadStoredCategories(),
    subCategories: subCategories || loadStoredSubCategories(),
    dues: dues || loadDues(),
  };
  return JSON.stringify(data, null, 2);
}

export interface ExportResult {
  success: boolean;
  message: string;
  savedPath?: string;
}

export async function saveAndDeliverFile(
  filename: string,
  content: string,
  mimeType: string,
  title: string
): Promise<ExportResult> {
  const isNative = Capacitor.isNativePlatform();
  let savedPath: string | undefined;
  let shared = false;

  // 1. If on native platform (Android APK), write directly to filesystem
  if (isNative) {
    try {
      const writeRes = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      savedPath = writeRes.uri;
    } catch (fsErr) {
      console.warn('Filesystem write to Documents failed, falling back to Cache:', fsErr);
      try {
        const cacheRes = await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
        savedPath = cacheRes.uri;
      } catch (cacheErr) {
        console.warn('Filesystem write to Cache failed:', cacheErr);
      }
    }
  }

  // 2. Try Native / Web Share Sheet (allows user to Save to Drive, Files, WhatsApp, Excel, Gmail, etc.)
  try {
    const blob = new Blob([content], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: title || filename,
        text: `Exported ${filename} from Finance Tracker`,
      });
      shared = true;
    } else if (navigator.share && !isNative) {
      await navigator.share({
        title: title || filename,
        text: content,
      });
      shared = true;
    }
  } catch (shareErr: any) {
    // If the user cancelled the share drawer or dismissed it, that's not a failure
    if (shareErr?.name === 'AbortError') {
      shared = true;
    } else {
      console.warn('Share API error:', shareErr);
    }
  }

  // 3. Browser download fallback (works in standard browsers / desktop / PWA)
  if (!isNative) {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 300);
    } catch (dlErr) {
      console.warn('Download link fallback failed:', dlErr);
    }
  }

  if (shared && savedPath) {
    return {
      success: true,
      message: `File shared & saved to Documents! (${filename})`,
      savedPath,
    };
  }

  if (savedPath) {
    return {
      success: true,
      message: `File saved successfully to Documents folder! (${filename})`,
      savedPath,
    };
  }

  if (shared) {
    return {
      success: true,
      message: `File shared successfully! (${filename})`,
    };
  }

  return {
    success: true,
    message: `Export ready (${filename})`,
  };
}

export async function exportTransactionsCSV(transactions: Transaction[]): Promise<ExportResult> {
  const content = formatTransactionsToCSV(transactions);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Finance_Tracker_Transactions_${dateStr}.csv`;
  return saveAndDeliverFile(filename, content, 'text/csv;charset=utf-8', 'Finance Tracker Transactions CSV Export');
}

export async function exportDuesCSV(dues: DueRecord[]): Promise<ExportResult> {
  const content = formatDuesToCSV(dues);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Finance_Tracker_Receivables_Payables_${dateStr}.csv`;
  return saveAndDeliverFile(filename, content, 'text/csv;charset=utf-8', 'Finance Tracker Dues & Payables CSV Export');
}

export async function exportFullBackupJSON(
  transactions: Transaction[],
  settings: UserSettings,
  categories?: CategoryInfo[],
  subCategories?: string[],
  dues?: DueRecord[]
): Promise<ExportResult> {
  const content = formatFullBackupJSON(transactions, settings, categories, subCategories, dues);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Finance_Tracker_Backup_${dateStr}.json`;
  return saveAndDeliverFile(filename, content, 'application/json', 'Finance Tracker JSON Backup');
}
