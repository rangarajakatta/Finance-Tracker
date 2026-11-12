import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Landmark,
  CreditCard,
  Filter,
  X,
} from 'lucide-react';
import { FilterPeriod, UserSettings, AccountFilter, TxTypeFilter, DateRange } from '../types';
import { formatAmount } from '../utils/precision';

interface BalanceCardProps {
  period: FilterPeriod;
  onPeriodChange: (p: FilterPeriod) => void;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyExpense: number;
  settings: UserSettings;
  accountFilter?: AccountFilter;
  typeFilter?: TxTypeFilter;
  onTypeFilterChange?: (type: TxTypeFilter) => void;
  onResetFilters?: () => void;
  onOpenBudgetModal: () => void;
  customDateRange?: DateRange | null;
  onOpenDateFilterModal?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  period,
  onPeriodChange,
  totalIncome,
  totalExpense,
  netBalance,
  monthlyExpense,
  settings,
  accountFilter = 'all',
  typeFilter = 'all',
  onTypeFilterChange,
  onResetFilters,
  onOpenBudgetModal,
  customDateRange,
  onOpenDateFilterModal,
}) => {
  const currency = settings.currency;
  const budget = settings.monthlyBudget;
  const budgetSpentPct = budget > 0 ? Math.min(Math.round((monthlyExpense / budget) * 100), 100) : 0;
  const budgetRemaining = budget - monthlyExpense;
  const isNearBudget = budget > 0 && budgetSpentPct >= settings.budgetAlertThreshold && budgetSpentPct < 100;
  const isOverBudget = budget > 0 && monthlyExpense > budget;

  const periods: { id: FilterPeriod; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
    ...(customDateRange ? [{ id: 'custom' as FilterPeriod, label: 'Custom' }] : []),
  ];

  const isBankFiltered = accountFilter === 'bank';
  const isCCFiltered = accountFilter === 'credit_card';
  const isIncomeFiltered = typeFilter === 'income';
  const isExpenseFiltered = typeFilter === 'expense';
  const hasActiveFilter = accountFilter !== 'all' || typeFilter !== 'all';

  const handleIncomeBoxClick = () => {
    onTypeFilterChange?.(isIncomeFiltered ? 'all' : 'income');
  };

  const handleExpenseBoxClick = () => {
    onTypeFilterChange?.(isExpenseFiltered ? 'all' : 'expense');
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
      {/* Period Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex p-1 bg-slate-100 rounded-xl max-w-full overflow-x-auto">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => onPeriodChange(p.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                period === p.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Offline Storage
        </span>
      </div>

      {/* Active Combined Filter Notification Banner */}
      {hasActiveFilter && (
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs animate-in fade-in duration-150 ${
            isBankFiltered
              ? 'bg-blue-50/90 border-blue-200 text-blue-900'
              : isCCFiltered
              ? 'bg-purple-50/90 border-purple-200 text-purple-900'
              : isIncomeFiltered
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/90 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 font-medium min-w-0">
            {isBankFiltered ? (
              <Landmark className="w-4 h-4 text-blue-600 shrink-0" />
            ) : isCCFiltered ? (
              <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
            ) : isIncomeFiltered ? (
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="truncate">
              Filtered:{' '}
              {isBankFiltered && isIncomeFiltered && (
                <>
                  <strong>Bank Income</strong> transactions
                </>
              )}
              {isBankFiltered && isExpenseFiltered && (
                <>
                  <strong>Bank Expenses</strong> (including CC bill payments)
                </>
              )}
              {isBankFiltered && !isIncomeFiltered && !isExpenseFiltered && (
                <>
                  <strong>Bank Account</strong> transactions (including CC bill payments)
                </>
              )}
              {isCCFiltered && isIncomeFiltered && (
                <>
                  <strong>Card Income</strong> (Credit card bill payments)
                </>
              )}
              {isCCFiltered && isExpenseFiltered && (
                <>
                  <strong>Card Expenses</strong> (Purchases paid via card)
                </>
              )}
              {isCCFiltered && !isIncomeFiltered && !isExpenseFiltered && (
                <>
                  <strong>Credit Card</strong> transactions (Purchases & bill payment income)
                </>
              )}
              {!isBankFiltered && !isCCFiltered && isIncomeFiltered && (
                <>
                  <strong>Income</strong> transactions
                </>
              )}
              {!isBankFiltered && !isCCFiltered && isExpenseFiltered && (
                <>
                  <strong>Expense</strong> transactions
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className={`text-[11px] font-bold underline flex items-center gap-1 cursor-pointer shrink-0 ml-2 ${
              isBankFiltered
                ? 'text-blue-700 hover:text-blue-900'
                : isCCFiltered
                ? 'text-purple-700 hover:text-purple-900'
                : isIncomeFiltered
                ? 'text-emerald-700 hover:text-emerald-900'
                : 'text-rose-700 hover:text-rose-900'
            }`}
          >
            <span>Show All</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Net Balance Highlight */}
      <div className="text-center py-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          {isIncomeFiltered
            ? isBankFiltered
              ? 'Bank Total Income'
              : isCCFiltered
              ? 'Card Total Income'
              : 'Total Income'
            : isExpenseFiltered
            ? isBankFiltered
              ? 'Bank Total Expenses'
              : isCCFiltered
              ? 'Card Total Expenses'
              : 'Total Expenses'
            : isBankFiltered
            ? 'Bank Net Cashflow'
            : isCCFiltered
            ? 'Credit Card Net Balance'
            : period === 'today'
            ? "Today's Net Balance"
            : period === 'week'
            ? "This Week's Net Balance"
            : period === 'month'
            ? "This Month's Net Balance"
            : period === 'custom'
            ? 'Period Net Balance'
            : 'Total Net Balance'}
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <span
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isIncomeFiltered
                ? 'text-emerald-600'
                : isExpenseFiltered
                ? 'text-rose-600'
                : netBalance >= 0
                ? 'text-slate-900'
                : 'text-rose-600'
            }`}
          >
            {isIncomeFiltered
              ? `+${currency}${formatAmount(totalIncome)}`
              : isExpenseFiltered
              ? `-${currency}${formatAmount(totalExpense)}`
              : `${netBalance < 0 ? '-' : ''}${currency}${formatAmount(netBalance)}`}
          </span>
        </div>
      </div>

      {/* Income & Expense Interactive Filter Split Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Income Card (Click to filter Income) */}
        <div
          id="cashflow-income-filter-box"
          role="button"
          tabIndex={0}
          onClick={handleIncomeBoxClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleIncomeBoxClick();
            }
          }}
          className={`p-3.5 rounded-2xl transition-all duration-150 cursor-pointer select-none text-left ${
            isIncomeFiltered
              ? 'bg-emerald-100/90 border-2 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
              : 'bg-emerald-50/60 border border-emerald-100/80 hover:border-emerald-300 hover:shadow-2xs active:scale-[0.99]'
          }`}
          title={
            isIncomeFiltered
              ? 'Income filter active. Click to show all'
              : `Click to filter by ${isBankFiltered ? 'Bank Income' : isCCFiltered ? 'Card Income' : 'Income'}`
          }
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBankFiltered ? 'Bank Income' : isCCFiltered ? 'Card Income' : 'Income'}</span>
            </span>
            {isIncomeFiltered && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider bg-emerald-200/80 px-1.5 py-0.5 rounded-md">
                <Filter className="w-2.5 h-2.5" /> Filtered
              </span>
            )}
          </div>
          <p className="text-lg font-bold text-emerald-700 truncate">
            +{currency}
            {formatAmount(totalIncome)}
          </p>
          <p className={`text-[10px] mt-1 font-semibold ${isIncomeFiltered ? 'text-emerald-800' : 'text-emerald-600/80'}`}>
            {isIncomeFiltered ? 'Tap to clear filter' : 'Tap to filter'}
          </p>
        </div>

        {/* Total Expense Card (Click to filter Expenses) */}
        <div
          id="cashflow-expense-filter-box"
          role="button"
          tabIndex={0}
          onClick={handleExpenseBoxClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleExpenseBoxClick();
            }
          }}
          className={`p-3.5 rounded-2xl transition-all duration-150 cursor-pointer select-none text-left ${
            isExpenseFiltered
              ? 'bg-rose-100/90 border-2 border-rose-500 ring-2 ring-rose-500/30 shadow-xs'
              : 'bg-rose-50/60 border border-rose-100/80 hover:border-rose-300 hover:shadow-2xs active:scale-[0.99]'
          }`}
          title={
            isExpenseFiltered
              ? 'Expense filter active. Click to show all'
              : `Click to filter by ${isBankFiltered ? 'Bank Expenses' : isCCFiltered ? 'Card Expenses' : 'Expenses'}`
          }
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              <span>{isBankFiltered ? 'Bank Expenses' : isCCFiltered ? 'Card Expenses' : 'Expenses'}</span>
            </span>
            {isExpenseFiltered && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-rose-800 uppercase tracking-wider bg-rose-200/80 px-1.5 py-0.5 rounded-md">
                <Filter className="w-2.5 h-2.5" /> Filtered
              </span>
            )}
          </div>
          <p className="text-lg font-bold text-rose-700 truncate">
            -{currency}
            {formatAmount(totalExpense)}
          </p>
          <p className={`text-[10px] mt-1 font-semibold ${isExpenseFiltered ? 'text-rose-800' : 'text-rose-600/80'}`}>
            {isExpenseFiltered ? 'Tap to clear filter' : 'Tap to filter'}
          </p>
        </div>
      </div>

      {/* Monthly Budget Progress Card */}
      {budget > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Monthly Budget:</span>
              <span className="font-bold text-slate-900">
                {currency}{formatAmount(budget)}
              </span>
            </span>
            <button
              onClick={onOpenBudgetModal}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
            >
              <span>Edit</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget
                  ? 'bg-rose-600'
                  : isNearBudget
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetSpentPct, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500">
            <span>
              Spent: {currency}{formatAmount(monthlyExpense)} ({budgetSpentPct}%)
            </span>
            <span
              className={`font-semibold ${
                isOverBudget
                  ? 'text-rose-600'
                  : isNearBudget
                  ? 'text-amber-600'
                  : 'text-slate-600'
              }`}
            >
              {isOverBudget
                ? `Exceeded by ${currency}${formatAmount(budgetRemaining)}`
                : `${currency}${formatAmount(budgetRemaining)} left`}
            </span>
          </div>

          {/* Budget warning alert banner if threshold reached */}
          {(isNearBudget || isOverBudget) && (
            <div
              className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-1.5 border ${
                isOverBudget
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium">
                {isOverBudget
                  ? 'Monthly budget exceeded! Consider reviewing discretionary expenses.'
                  : `You have spent ${budgetSpentPct}% of your monthly target limit.`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
