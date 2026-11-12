import { Preferences } from '@capacitor/preferences';
import { CategoryInfo, TransactionType } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: CategoryInfo[] = [
  { id: 'food', name: 'Food & Dining', type: 'expense', iconName: 'UtensilsCrossed', color: '#ea580c', bgLight: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'groceries', name: 'Groceries', type: 'expense', iconName: 'ShoppingCart', color: '#16a34a', bgLight: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'transport', name: 'Transport & Fuel', type: 'expense', iconName: 'Car', color: '#0284c7', bgLight: 'bg-sky-50 text-sky-600 border-sky-200' },
  { id: 'housing', name: 'Housing & Rent', type: 'expense', iconName: 'Home', color: '#9333ea', bgLight: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 'utilities', name: 'Bills & Utilities', type: 'expense', iconName: 'Zap', color: '#ca8a04', bgLight: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'shopping', name: 'Shopping', type: 'expense', iconName: 'ShoppingBag', color: '#db2777', bgLight: 'bg-pink-50 text-pink-600 border-pink-200' },
  { id: 'health', name: 'Health & Medical', type: 'expense', iconName: 'HeartPulse', color: '#e11d48', bgLight: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', iconName: 'Film', color: '#4f46e5', bgLight: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { id: 'education', name: 'Education', type: 'expense', iconName: 'GraduationCap', color: '#0d9488', bgLight: 'bg-teal-50 text-teal-600 border-teal-200' },
  { id: 'other_expense', name: 'Other Expense', type: 'expense', iconName: 'MoreHorizontal', color: '#64748b', bgLight: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryInfo[] = [
  { id: 'salary', name: 'Salary / Wages', type: 'income', iconName: 'Briefcase', color: '#059669', bgLight: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'freelance', name: 'Freelance / Projects', type: 'income', iconName: 'Laptop', color: '#0284c7', bgLight: 'bg-sky-50 text-sky-600 border-sky-200' },
  { id: 'business_income', name: 'Business Income', type: 'income', iconName: 'Building2', color: '#7c3aed', bgLight: 'bg-violet-50 text-violet-600 border-violet-200' },
  { id: 'investments', name: 'Investments & Dividends', type: 'income', iconName: 'TrendingUp', color: '#16a34a', bgLight: 'bg-green-50 text-green-600 border-green-200' },
  { id: 'gifts', name: 'Gifts & Allowance', type: 'income', iconName: 'Gift', color: '#d97706', bgLight: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'other_income', name: 'Other Income', type: 'income', iconName: 'Coins', color: '#0891b2', bgLight: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
];

export const DEFAULT_EXPENSE_SUBCATEGORIES: string[] = ['Personal', 'Business'];

const STORAGE_KEY_CATEGORIES = 'expense_tracker_categories_v2';
const STORAGE_KEY_SUBCATEGORIES = 'expense_tracker_subcategories_v2';

export async function loadNativeCategories(): Promise<CategoryInfo[] | null> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY_CATEGORIES });
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Native preferences categories read failed:', e);
  }
  return null;
}

export function loadStoredCategories(): CategoryInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) {
      return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  } catch {
    return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  }
}

export function saveStoredCategories(categories: CategoryInfo[]): void {
  try {
    const serialized = JSON.stringify(categories);
    localStorage.setItem(STORAGE_KEY_CATEGORIES, serialized);
    Preferences.set({ key: STORAGE_KEY_CATEGORIES, value: serialized }).catch((err) => {
      console.warn('Preferences.set categories error:', err);
    });
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

export async function loadNativeSubCategories(): Promise<string[] | null> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY_SUBCATEGORIES });
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Native preferences subcategories read failed:', e);
  }
  return null;
}

export function loadStoredSubCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBCATEGORIES);
    if (!raw) {
      return [...DEFAULT_EXPENSE_SUBCATEGORIES];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_EXPENSE_SUBCATEGORIES];
  } catch {
    return [...DEFAULT_EXPENSE_SUBCATEGORIES];
  }
}

export function saveStoredSubCategories(subCategories: string[]): void {
  try {
    const serialized = JSON.stringify(subCategories);
    localStorage.setItem(STORAGE_KEY_SUBCATEGORIES, serialized);
    Preferences.set({ key: STORAGE_KEY_SUBCATEGORIES, value: serialized }).catch((err) => {
      console.warn('Preferences.set subcategories error:', err);
    });
  } catch (err) {
    console.error('Failed to save subcategories:', err);
  }
}

export function getCategoryInfo(
  name: string,
  type: TransactionType,
  allCategories?: CategoryInfo[]
): CategoryInfo {
  if ((name || '').toLowerCase() === 'credit card payment') {
    return {
      id: 'cc-payment',
      name: 'Credit Card Payment',
      type: type,
      iconName: 'CreditCard',
      color: '#7c3aed',
      bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
      isCustom: false,
    };
  }

  const list = allCategories || [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  const match = list.find((c) => c.name.toLowerCase() === (name || '').toLowerCase());
  if (match) return match;

  // Custom or unmapped category fallback
  return {
    id: 'custom-' + name.toLowerCase().replace(/\s+/g, '-'),
    name: name || (type === 'expense' ? 'Other Expense' : 'Other Income'),
    type,
    iconName: type === 'expense' ? 'Tag' : 'Coins',
    color: type === 'expense' ? '#e11d48' : '#059669',
    bgLight: type === 'expense' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
    isCustom: true,
  };
}

export const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
];
