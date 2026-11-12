import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Settings2,
  Folder,
  Check,
  Landmark,
  CreditCard,
} from 'lucide-react';
import { Transaction, TransactionType, CategoryInfo, PaymentMethod } from '../types';
import { getCategoryInfo } from '../utils/categories';
import { roundTo2Decimals, parseAmountInput, formatAmount } from '../utils/precision';
import { CategoryIcon } from './CategoryIcon';
import { CategoryManagerModal } from './CategoryManagerModal';
import { SubCategoryManagerModal } from './SubCategoryManagerModal';
import { ConfirmModal } from './ConfirmModal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>, id?: string) => void;
  onDelete?: (id: string) => void;
  initialTransaction?: Transaction | null;
  currency: string;
  categories: CategoryInfo[];
  subCategories: string[];
  bankBalance?: number;
  creditCardDue?: number;
  onAddCategory: (
    name: string,
    type: TransactionType,
    iconName?: string,
    color?: string,
    bgLight?: string
  ) => void;
  onUpdateCategory?: (category: CategoryInfo, oldName?: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddSubCategory: (name: string) => void;
  onDeleteSubCategory: (name: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTransaction,
  currency,
  categories,
  subCategories,
  bankBalance,
  creditCardDue,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubCategory,
  onDeleteSubCategory,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('Personal');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Dropdown open states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);

  // Sub-modals for Category and SubCategory management
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isSubCategoryManagerOpen, setIsSubCategoryManagerOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subCategoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
      if (
        subCategoryDropdownRef.current &&
        !subCategoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSubCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(initialTransaction.amount.toString());
      setCategory(initialTransaction.category);
      setSubCategory(initialTransaction.subCategory || (subCategories[0] || 'Personal'));
      setPaymentMethod(initialTransaction.paymentMethod || 'bank');
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || '');
      setNote(initialTransaction.note || '');
    } else {
      // Reset for new transaction
      setType('expense');
      setAmount('');
      const defaultExpenseCat =
        categories.find((c) => c.type === 'expense')?.name || 'Food & Dining';
      setCategory(defaultExpenseCat);
      setSubCategory(subCategories[0] || 'Personal');
      setPaymentMethod('bank');
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));
      setNote('');
    }
    setAmountError(null);
    setIsConfirmDeleteOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsSubCategoryDropdownOpen(false);
  }, [initialTransaction, isOpen, categories, subCategories]);

  // Make sure selected category and subcategory exist
  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.some((c) => c.name === category)) {
      setCategory(activeCategories[0].name);
    }
  }, [type, categories]);

  useEffect(() => {
    if (subCategories.length > 0 && !subCategories.includes(subCategory)) {
      setSubCategory(subCategories[0]);
    }
  }, [subCategories]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType);
    if (firstCat) {
      setCategory(firstCat.name);
    }
    setIsCategoryDropdownOpen(false);
  };

  const handleQuickAddAmount = (val: number) => {
    const current = parseAmountInput(amount);
    setAmount(roundTo2Decimals(current + val).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseAmountInput(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Please enter a valid amount greater than 0.');
      return;
    }
    setAmountError(null);

    const isCCPayment = Boolean(
      initialTransaction?.isCreditCardPayment ||
      category === 'Credit Card Payment' ||
      (initialTransaction?.id && String(initialTransaction.id).startsWith('tx-ccpay-'))
    );

    onSave(
      {
        type,
        amount: parsedAmount,
        category: category || (type === 'expense' ? 'Other Expense' : 'Other Income'),
        subCategory: type === 'expense' && !isCCPayment ? (subCategory || 'Personal') : undefined,
        paymentMethod: type === 'expense' ? (isCCPayment ? 'bank' : paymentMethod) : 'bank',
        isCreditCardPayment: isCCPayment,
        date: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toTimeString().slice(0, 5),
        note: note.trim(),
      },
      initialTransaction?.id
    );
    onClose();
  };

  const currentCatInfo = getCategoryInfo(category, type, categories);

  return (
    <>
      <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl ${
                  type === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {type === 'expense' ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {initialTransaction ? 'Edit Transaction' : 'Record Transaction'}
                </h3>
                <p className="text-xs text-slate-500">
                  {type === 'expense' ? 'Track money spent' : 'Log income received'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-slate-700 flex-1">
            {/* Type Toggle: Expense vs Income */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                id="type-expense-btn"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Expense</span>
              </button>
              <button
                type="button"
                id="type-income-btn"
                onClick={() => handleTypeChange('income')}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Income</span>
              </button>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                  {currency}
                </span>
                <input
                  id="transaction-amount-input"
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus={!initialTransaction}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              {amountError && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5">{amountError}</p>
              )}
              {/* Quick Increment Buttons */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">Quick +</span>
                {[10, 20, 50, 100, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAddAmount(val)}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition shrink-0 active:scale-95"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Dropdown Button + Create / Delete Category Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Category
                </label>
                <span className="text-[11px] text-slate-400">
                  {type === 'expense' ? 'Expense category' : 'Income category'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Dropdown Button */}
                <div ref={categoryDropdownRef} className="relative flex-1">
                  <button
                    type="button"
                    id="category-dropdown-btn"
                    onClick={() => {
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                      setIsSubCategoryDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${currentCatInfo.bgLight}`}>
                        <CategoryIcon name={currentCatInfo.iconName} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {category || 'Select category'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isCategoryDropdownOpen ? 'rotate-180 text-slate-700' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-1 space-y-0.5">
                        {activeCategories.map((cat) => {
                          const isSelected = category === cat.name;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setCategory(cat.name);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                                isSelected
                                  ? 'bg-slate-900 text-white font-semibold'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`p-1 rounded-md shrink-0 ${
                                    isSelected ? 'bg-white/20 text-white' : cat.bgLight
                                  }`}
                                >
                                  <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">{cat.name}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Dropdown menu footer shortcut */}
                      <div className="p-1.5 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoryDropdownOpen(false);
                            setIsCategoryManagerOpen(true);
                          }}
                          className="w-full py-1.5 px-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg flex items-center justify-center gap-1.5 transition"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>+ Add or Delete Categories</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Button to Create or Delete Category */}
                <button
                  type="button"
                  id="manage-categories-btn"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 active:scale-95"
                  title="Create new category or delete existing categories"
                >
                  <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Add / Delete</span>
                  <span className="sm:hidden">Manage</span>
                </button>
              </div>
            </div>

            {/* Sub-Category Dropdown Button (ONLY FOR EXPENSES) */}
            {type === 'expense' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-purple-600" />
                    <span>Expense Sub Category</span>
                  </label>
                  <span className="text-[11px] text-purple-600 font-semibold">
                    Personal / Business
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Dropdown Button */}
                  <div ref={subCategoryDropdownRef} className="relative flex-1">
                    <button
                      type="button"
                      id="subcategory-dropdown-btn"
                      onClick={() => {
                        setIsSubCategoryDropdownOpen(!isSubCategoryDropdownOpen);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            subCategory.toLowerCase() === 'business'
                              ? 'bg-purple-600'
                              : 'bg-blue-600'
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {subCategory || 'Select sub category'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isSubCategoryDropdownOpen ? 'rotate-180 text-slate-700' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isSubCategoryDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-1 space-y-0.5">
                          {subCategories.map((subName) => {
                            const isSelected = subCategory === subName;
                            const isBiz = subName.toLowerCase() === 'business';
                            return (
                              <button
                                key={subName}
                                type="button"
                                onClick={() => {
                                  setSubCategory(subName);
                                  setIsSubCategoryDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                                  isSelected
                                    ? 'bg-purple-900 text-white font-semibold'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isSelected
                                        ? 'bg-purple-300'
                                        : isBiz
                                        ? 'bg-purple-600'
                                        : 'bg-blue-600'
                                    }`}
                                  />
                                  <span>{subName}</span>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Dropdown menu footer shortcut */}
                        <div className="p-1.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSubCategoryDropdownOpen(false);
                              setIsSubCategoryManagerOpen(true);
                            }}
                            className="w-full py-1.5 px-2 text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:bg-purple-50 rounded-lg flex items-center justify-center gap-1.5 transition"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            <span>+ Add or Delete Sub-Categories</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Button to Create or Delete Sub-Category */}
                  <button
                    type="button"
                    id="manage-subcategories-btn"
                    onClick={() => setIsSubCategoryManagerOpen(true)}
                    className="px-3 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 active:scale-95"
                    title="Create new sub-category or delete existing"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden sm:inline">Add / Delete</span>
                    <span className="sm:hidden">Manage</span>
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method Selector (Bank Account vs Credit Card) - ONLY FOR EXPENSES */}
            {type === 'expense' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span>Paid Through *</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Bank or Credit Card
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    id="select-payment-bank-btn"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      paymentMethod === 'bank'
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                        <Landmark className="w-4 h-4 text-blue-600" />
                        <span>Bank Account</span>
                      </div>
                      {paymentMethod === 'bank' && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      Deducts from bank
                      {bankBalance !== undefined && (
                        <span className="font-semibold text-blue-700 block">
                          Bal: {currency}{formatAmount(bankBalance)}
                        </span>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    id="select-payment-cc-btn"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      paymentMethod === 'credit_card'
                        ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/30 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                        <CreditCard className="w-4 h-4 text-purple-600" />
                        <span>Credit Card</span>
                      </div>
                      {paymentMethod === 'credit_card' && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      Adds to card due
                      {creditCardDue !== undefined && (
                        <span className="font-semibold text-purple-700 block">
                          Due: {currency}{formatAmount(creditCardDue)}
                        </span>
                      )}
                    </span>
                  </button>
                </div>

                {/* Helper Banner */}
                <div
                  className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 border transition ${
                    paymentMethod === 'credit_card'
                      ? 'bg-purple-50/70 border-purple-200 text-purple-800'
                      : 'bg-blue-50/70 border-blue-200 text-blue-800'
                  }`}
                >
                  {paymentMethod === 'credit_card' ? (
                    <>
                      <CreditCard className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                      <span>
                        This expense will be added to your <strong>Credit Card Due</strong>. Bank balance will remain untouched until you pay the card bill.
                      </span>
                    </>
                  ) : (
                    <>
                      <Landmark className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                      <span>
                        Paid directly from your <strong>Bank Account</strong>. Automatically deducted from your bank balance.
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Time (Optional)</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Note / Description</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Groceries at Trader Joe's, Starbucks coffee"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2.5">
              {initialTransaction && onDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="p-3 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center justify-center shrink-0"
                  title="Delete transaction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="save-transaction-submit-btn"
                className={`flex-2 py-3 text-xs font-semibold text-white rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 ${
                  type === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{initialTransaction ? 'Update Record' : 'Save Transaction'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        type={type}
        categories={categories}
        onAddCategory={(name, catType, iconName, color, bgLight) => {
          onAddCategory(name, catType, iconName, color, bgLight);
          setCategory(name);
        }}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={(id) => {
          onDeleteCategory(id);
        }}
      />

      {/* Sub Category Manager Modal */}
      <SubCategoryManagerModal
        isOpen={isSubCategoryManagerOpen}
        onClose={() => setIsSubCategoryManagerOpen(false)}
        subCategories={subCategories}
        onAddSubCategory={(name) => {
          onAddSubCategory(name);
          setSubCategory(name);
        }}
        onDeleteSubCategory={(name) => {
          onDeleteSubCategory(name);
        }}
      />

      {/* In-App Delete Transaction Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${type} of ${currency}${formatAmount(parseAmountInput(amount || '0'))} (${category})?`}
        confirmLabel="Delete Transaction"
        onConfirm={() => {
          if (initialTransaction && onDelete) {
            onDelete(initialTransaction.id);
            setIsConfirmDeleteOpen(false);
            onClose();
          }
        }}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </>
  );
};
