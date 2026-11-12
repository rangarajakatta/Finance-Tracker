import React, { useState, useEffect } from 'react';
import { PieChart, ChevronDown, ChevronUp, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Transaction, CategoryInfo, TransactionType, TxTypeFilter, AccountFilter } from '../types';
import { getCategoryInfo } from '../utils/categories';
import { formatAmount } from '../utils/precision';
import { CategoryIcon } from './CategoryIcon';

interface CategoryInsightsProps {
  transactions: Transaction[];
  currency: string;
  categories?: CategoryInfo[];
  typeFilter?: TxTypeFilter;
  onTypeFilterChange?: (type: TxTypeFilter) => void;
  accountFilter?: AccountFilter;
}

export const CategoryInsights: React.FC<CategoryInsightsProps> = ({
  transactions,
  currency,
  categories,
  typeFilter = 'all',
  onTypeFilterChange,
  accountFilter = 'all',
}) => {
  const [internalActiveType, setInternalActiveType] = useState<TransactionType>('expense');
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync internal active type when parent type filter changes
  useEffect(() => {
    if (typeFilter === 'income') {
      setInternalActiveType('income');
    } else if (typeFilter === 'expense') {
      setInternalActiveType('expense');
    }
  }, [typeFilter]);

  const activeType: TransactionType =
    typeFilter === 'income' ? 'income' : typeFilter === 'expense' ? 'expense' : internalActiveType;

  const isCCPay = (t: Transaction) =>
    Boolean(
      t.isCreditCardPayment ||
      t.category === 'Credit Card Payment' ||
      (t.id && String(t.id).startsWith('tx-ccpay-')) ||
      (t.note && String(t.note).toLowerCase().includes('credit card bill payment'))
    );

  const expenseTx = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    // When Bank filter is active, include credit card bill payments in the expense breakdown
    if (accountFilter === 'bank') return true;
    return !isCCPay(t);
  });

  const incomeTx = transactions.filter((t) => t.type === 'income');

  const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);

  // If there are literally no transactions at all and no filter, hide
  if (transactions.length === 0 && accountFilter === 'all' && typeFilter === 'all') {
    return null;
  }

  const currentTx = activeType === 'expense' ? expenseTx : incomeTx;
  const currentTotal = activeType === 'expense' ? totalExpense : totalIncome;

  // Aggregate by category
  const categoryMap: Record<string, number> = {};
  currentTx.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const sortedCategories = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: currentTotal > 0 ? Math.round((amount / currentTotal) * 100) : 0,
      info: getCategoryInfo(category, activeType, categories),
    }))
    .sort((a, b) => b.amount - a.amount);

  const displayCategories = isExpanded ? sortedCategories : sortedCategories.slice(0, 3);

  const handleTabClick = (type: TransactionType) => {
    setInternalActiveType(type);
    setIsExpanded(false);
    if (onTypeFilterChange) {
      if (typeFilter === type) {
        onTypeFilterChange('all');
      } else {
        onTypeFilterChange(type);
      }
    }
  };

  const getBreakdownHeading = () => {
    if (activeType === 'expense') {
      if (accountFilter === 'bank') return 'Bank Expense Breakdown';
      if (accountFilter === 'credit_card') return 'Card Expense Breakdown';
      return 'Expense Breakdown';
    } else {
      if (accountFilter === 'bank') return 'Bank Income Breakdown';
      if (accountFilter === 'credit_card') return 'Card Income Breakdown';
      return 'Income Breakdown';
    }
  };

  const getBreakdownSubheading = () => {
    if (activeType === 'expense') {
      return accountFilter === 'credit_card'
        ? 'Purchases made via Credit Card'
        : 'Where your money goes';
    } else {
      return accountFilter === 'credit_card'
        ? 'Credit card bill payments & funds received'
        : 'Where your earnings come from';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
      {/* Header & Toggle Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg transition-colors ${
                activeType === 'expense'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {getBreakdownHeading()}
              </h3>
              <p className="text-[11px] text-slate-500">
                {getBreakdownSubheading()}
              </p>
            </div>
          </div>

          {sortedCategories.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition cursor-pointer"
            >
              <span>{isExpanded ? 'Top 3' : `All (${sortedCategories.length})`}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Breakdown Type Toggle Buttons */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button
            id="breakdown-tab-expense-btn"
            type="button"
            onClick={() => handleTabClick('expense')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeType === 'expense'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            <span>{accountFilter === 'credit_card' ? 'Card Expenses' : accountFilter === 'bank' ? 'Bank Expenses' : 'Expenses'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeType === 'expense'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {currency}{formatAmount(totalExpense)}
            </span>
          </button>

          <button
            id="breakdown-tab-income-btn"
            type="button"
            onClick={() => handleTabClick('income')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeType === 'income'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>{accountFilter === 'credit_card' ? 'Card Income' : accountFilter === 'bank' ? 'Bank Income' : 'Income'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeType === 'income'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {currency}{formatAmount(totalIncome)}
            </span>
          </button>
        </div>
      </div>

      {/* When current total is 0 */}
      {currentTotal === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No {activeType} recorded for this selected filter.
        </div>
      ) : (
        <>
          {/* Multi-color segment bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            {sortedCategories.map((c) => (
              <div
                key={c.category}
                style={{
                  width: `${(c.amount / currentTotal) * 100}%`,
                  backgroundColor: c.info.color,
                }}
                title={`${c.category}: ${currency}${formatAmount(c.amount)} (${c.percentage}%)`}
                className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>

          {/* Category List */}
          <div className="space-y-2 pt-1">
            {displayCategories.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.info.color }}
                  />
                  <div className={`p-1.5 rounded-lg shrink-0 ${item.info.bgLight}`}>
                    <CategoryIcon name={item.info.iconName} className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {item.category}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900">
                    {currency}
                    {formatAmount(item.amount)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium ml-1.5">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
