import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Plus,
  Trash2,
  Landmark,
  CreditCard,
  ArrowRightLeft,
  TrendingUp,
} from 'lucide-react';
import { Transaction, CategoryInfo, TxTypeFilter, AccountFilter } from '../types';
import { getCategoryInfo } from '../utils/categories';
import { formatAmount } from '../utils/precision';
import { CategoryIcon } from './CategoryIcon';
import { ConfirmModal } from './ConfirmModal';

interface TransactionListProps {
  transactions: Transaction[];
  currency: string;
  categories?: CategoryInfo[];
  typeFilter?: TxTypeFilter;
  onTypeFilterChange?: (type: TxTypeFilter) => void;
  accountFilter?: AccountFilter;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddNew: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currency,
  categories,
  typeFilter = 'all',
  onTypeFilterChange,
  accountFilter = 'all',
  onEditTransaction,
  onDeleteTransaction,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);

  const isCCBillPayment = (t: Transaction) =>
    Boolean(
      t.isCreditCardPayment ||
      t.category === 'Credit Card Payment' ||
      (t.id && String(t.id).startsWith('tx-ccpay-')) ||
      (t.note && String(t.note).toLowerCase().includes('credit card bill payment'))
    );

  // Filter transactions
  const filtered = transactions.filter((t) => {
    const isCCPay = isCCBillPayment(t);

    if (typeFilter === 'expense') {
      if (t.type !== 'expense') return false;
      // If bank filter is active, credit card bill payments from bank are included in expenses
      if (accountFilter === 'bank') return true;
      if (isCCPay) return false;
    }
    if (typeFilter === 'income') {
      if (t.type !== 'income') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = t.note?.toLowerCase().includes(q);
      const matchCategory = t.category.toLowerCase().includes(q);
      const matchSubCategory = t.subCategory?.toLowerCase().includes(q);
      const matchAmount = t.amount.toString().includes(q);
      return matchNote || matchCategory || matchSubCategory || matchAmount;
    }
    return true;
  });

  // Group by Date
  const grouped: Record<string, Transaction[]> = {};
  filtered.forEach((t) => {
    if (!grouped[t.date]) {
      grouped[t.date] = [];
    }
    grouped[t.date].push(t);
  });

  // Sort dates descending
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDateHeader = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-3">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Transaction Activity
          </h2>
          <p className="text-[11px] text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by note, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex p-0.5 bg-slate-100 rounded-xl shrink-0">
            <button
              onClick={() => onTypeFilterChange ? onTypeFilterChange('all') : undefined}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onTypeFilterChange ? onTypeFilterChange(typeFilter === 'expense' ? 'all' : 'expense') : undefined}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {accountFilter === 'credit_card' ? 'Card Expenses' : accountFilter === 'bank' ? 'Bank Expenses' : 'Expenses'}
            </button>
            <button
              onClick={() => onTypeFilterChange ? onTypeFilterChange(typeFilter === 'income' ? 'all' : 'income') : undefined}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {accountFilter === 'credit_card' ? 'Card Income' : accountFilter === 'bank' ? 'Bank Income' : 'Income'}
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No transactions found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              {searchQuery
                ? 'Try adjusting your search query or filter.'
                : 'Start tracking your finances by logging your first income or expense.'}
            </p>
          </div>
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      ) : (
        /* Grouped List */
        <div className="space-y-4">
          {sortedDates.map((dateStr) => {
            const dateTx = grouped[dateStr];
            const dayExpense = dateTx
              .filter((t) => {
                const isCCPay = Boolean(
                  t.isCreditCardPayment ||
                  t.category === 'Credit Card Payment' ||
                  (t.id && String(t.id).startsWith('tx-ccpay-')) ||
                  (t.note && String(t.note).toLowerCase().includes('credit card bill payment'))
                );
                return t.type === 'expense' && !isCCPay;
              })
              .reduce((s, t) => s + t.amount, 0);
            const dayIncome = dateTx
              .filter((t) => t.type === 'income')
              .reduce((s, t) => s + t.amount, 0);

            return (
              <div key={dateStr} className="space-y-1.5">
                {/* Date header label */}
                <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">{formatDateHeader(dateStr)}</span>
                  <div className="space-x-2 text-[11px] font-medium">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600">+{currency}{formatAmount(dayIncome)}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-600">-{currency}{formatAmount(dayExpense)}</span>
                    )}
                  </div>
                </div>

                {/* Date's transactions cards */}
                <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {dateTx.map((item) => {
                    const catInfo = getCategoryInfo(item.category, item.type, categories);
                    const isExpense = item.type === 'expense';
                    const isBusiness = item.subCategory?.toLowerCase() === 'business';
                    const isCCPay = isCCBillPayment(item);
                    const isCardIncome = accountFilter === 'credit_card' && isCCPay;

                    return (
                      <div
                        key={item.id}
                        onClick={() => onEditTransaction(item)}
                        className="group flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer"
                      >
                        {/* Left: Icon & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              isCardIncome || isCCPay
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : catInfo.bgLight
                            }`}
                          >
                            {isCardIncome ? (
                              <CreditCard className="w-4 h-4" />
                            ) : isCCPay ? (
                              <ArrowRightLeft className="w-4 h-4" />
                            ) : (
                              <CategoryIcon name={catInfo.iconName} className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {isCCPay ? 'Credit Card Bill Payment' : item.category}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                              {item.note && (
                                <span className="truncate max-w-[140px] sm:max-w-[200px] text-slate-600">
                                  {item.note}
                                </span>
                              )}
                              {item.note && <span>•</span>}
                              {/* Sub category badge for regular expenses */}
                              {!isCCPay && isExpense && item.subCategory && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    isBusiness
                                      ? 'bg-purple-100 text-purple-700 border border-purple-200/50'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                                  }`}
                                >
                                  {item.subCategory}
                                </span>
                              )}
                              {/* Payment Method / Type Badge */}
                              {isCardIncome ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200/60">
                                  <CreditCard className="w-2.5 h-2.5 text-purple-600" />
                                  <span>Card Bill Payment Received</span>
                                </span>
                              ) : isCCPay ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                  <ArrowRightLeft className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>CC Bill Paid from Bank</span>
                                </span>
                              ) : isExpense ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                                    item.paymentMethod === 'credit_card'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                                  }`}
                                >
                                  {item.paymentMethod === 'credit_card' ? (
                                    <>
                                      <CreditCard className="w-2.5 h-2.5 text-purple-600" />
                                      <span>Credit Card</span>
                                    </>
                                  ) : (
                                    <>
                                      <Landmark className="w-2.5 h-2.5 text-blue-600" />
                                      <span>Bank</span>
                                    </>
                                  )}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                  <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Income</span>
                                </span>
                              )}
                              {item.time && (
                                <span className="text-slate-400">
                                  {item.time}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Quick Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm sm:text-base font-bold tracking-tight ${
                              isCardIncome
                                ? 'text-emerald-600'
                                : isCCPay && accountFilter === 'bank'
                                ? 'text-rose-600'
                                : isCCPay
                                ? 'text-blue-700'
                                : isExpense
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {isCardIncome
                              ? '+'
                              : isCCPay && accountFilter === 'bank'
                              ? '-'
                              : isCCPay
                              ? '⇄ '
                              : isExpense
                              ? '-'
                              : '+'}
                            {currency}
                            {formatAmount(item.amount)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 rounded-xl hover:bg-rose-50 transition min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer active:scale-95"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Rendered via portal at document.body, fully mobile responsive) */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="Delete Transaction"
        message={
          itemToDelete
            ? `Are you sure you want to delete this ${itemToDelete.type} of ${currency}${formatAmount(
                itemToDelete.amount
              )} (${itemToDelete.category})?${
                itemToDelete.linkedDueId
                  ? ' This payment is linked to a due and will automatically be restored as pending due.'
                  : ' This action cannot be undone.'
              }`
            : ''
        }
        confirmLabel="Delete Transaction"
        onConfirm={() => {
          if (itemToDelete) {
            onDeleteTransaction(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
