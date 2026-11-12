import React from 'react';
import {
  Landmark,
  CreditCard,
  ArrowRightLeft,
  SlidersHorizontal,
  Filter,
} from 'lucide-react';
import { formatAmount } from '../utils/precision';
import { AccountFilter } from '../types';

interface AccountBalanceCardProps {
  bankBalance: number;
  creditCardDue: number;
  currency: string;
  activeFilter?: AccountFilter;
  onFilterChange?: (filter: AccountFilter) => void;
  onOpenPayCreditCard: () => void;
  onOpenAdjustBalance: () => void;
}

export const AccountBalanceCard: React.FC<AccountBalanceCardProps> = ({
  bankBalance,
  creditCardDue,
  currency,
  activeFilter = 'all',
  onFilterChange,
  onOpenPayCreditCard,
  onOpenAdjustBalance,
}) => {
  const isBankFiltered = activeFilter === 'bank';
  const isCCFiltered = activeFilter === 'credit_card';

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Bank Balance Card (Click to filter by Bank) */}
      <div
        id="bank-balance-filter-box"
        role="button"
        tabIndex={0}
        onClick={() => onFilterChange?.(isBankFiltered ? 'all' : 'bank')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.(isBankFiltered ? 'all' : 'bank');
          }
        }}
        className={`rounded-2xl p-4 transition-all duration-150 space-y-2 relative group cursor-pointer text-left select-none ${
          isBankFiltered
            ? bankBalance < 0
              ? 'bg-rose-50/90 border-2 border-rose-500 ring-2 ring-rose-500/30 shadow-xs'
              : 'bg-blue-50/90 border-2 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
            : bankBalance < 0
            ? 'bg-rose-50/40 border border-rose-200 hover:border-rose-300 hover:shadow-2xs'
            : 'bg-white border border-blue-100 hover:border-blue-300 hover:shadow-2xs'
        }`}
        title={
          isBankFiltered
            ? 'Bank filter active. Click to show all'
            : bankBalance < 0
            ? 'Bank balance is negative (expenses exceed balance). Click to filter transactions'
            : 'Click to filter transactions paid or received via Bank'
        }
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className={`p-2 rounded-xl transition ${
                isBankFiltered
                  ? bankBalance < 0
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-blue-600 text-white shadow-2xs'
                  : bankBalance < 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block leading-tight">Bank Balance</span>
              {isBankFiltered && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                    bankBalance < 0 ? 'text-rose-700' : 'text-blue-700'
                  }`}
                >
                  <Filter className="w-2.5 h-2.5" /> Filtered
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdjustBalance();
            }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/70 rounded-lg transition cursor-pointer"
            title="Adjust Bank Balance"
            aria-label="Adjust Bank Balance"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        <div>
          <p
            className={`text-lg sm:text-xl font-extrabold tracking-tight truncate ${
              bankBalance < 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {bankBalance < 0 ? `-${currency}${formatAmount(bankBalance)}` : `${currency}${formatAmount(bankBalance)}`}
          </p>
          <div className="flex items-center justify-between mt-0.5 text-[11px]">
            <p
              className={`${
                bankBalance < 0
                  ? 'text-rose-600 font-bold'
                  : isBankFiltered
                  ? 'text-blue-700 font-bold'
                  : 'text-slate-500 font-medium'
              }`}
            >
              {bankBalance < 0
                ? isBankFiltered
                  ? 'Negative balance (Tap to clear)'
                  : 'Negative balance (Overdrawn)'
                : isBankFiltered
                ? 'Tap to clear filter'
                : 'Available in bank'}
            </p>
            {!isBankFiltered && (
              <span
                className={`text-[10px] font-semibold transition hidden sm:inline ${
                  bankBalance < 0 ? 'text-rose-600' : 'text-blue-600/80 opacity-0 group-hover:opacity-100'
                }`}
              >
                Tap to filter
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Credit Card Due Card (Click to filter by Credit Card) */}
      <div
        id="credit-card-filter-box"
        role="button"
        tabIndex={0}
        onClick={() => onFilterChange?.(isCCFiltered ? 'all' : 'credit_card')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterChange?.(isCCFiltered ? 'all' : 'credit_card');
          }
        }}
        className={`rounded-2xl p-4 transition-all duration-150 space-y-2 relative group cursor-pointer text-left select-none ${
          isCCFiltered
            ? 'bg-purple-50/90 border-2 border-purple-500 ring-2 ring-purple-500/30 shadow-xs'
            : 'bg-white border border-purple-100 hover:border-purple-300 hover:shadow-2xs'
        }`}
        title={isCCFiltered ? 'Credit card filter active. Click to show all' : 'Click to filter transactions paid via Credit Card'}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`p-2 rounded-xl transition ${isCCFiltered ? 'bg-purple-600 text-white shadow-2xs' : 'bg-purple-50 text-purple-600'}`}>
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block leading-tight">Credit Card Due</span>
              {isCCFiltered && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-purple-700 uppercase tracking-wider">
                  <Filter className="w-2.5 h-2.5" /> Filtered
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            id="pay-cc-quick-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPayCreditCard();
            }}
            className="px-2 py-1 text-[10px] font-bold text-purple-700 hover:text-white bg-purple-100 hover:bg-purple-600 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
            title="Pay credit card bill from bank"
            aria-label="Pay credit card bill from bank"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Pay</span>
          </button>
        </div>

        <div>
          <p
            className={`text-lg sm:text-xl font-extrabold tracking-tight truncate ${
              creditCardDue > 0 ? 'text-purple-700' : 'text-slate-900'
            }`}
          >
            {currency}
            {formatAmount(creditCardDue)}
          </p>
          <div className="flex items-center justify-between mt-0.5 text-[11px]">
            <p className={`${isCCFiltered ? 'text-purple-700 font-bold' : 'text-purple-600/80 font-medium'}`}>
              {isCCFiltered ? 'Tap to clear filter' : creditCardDue > 0 ? 'Outstanding due' : 'No dues pending'}
            </p>
            {!isCCFiltered && (
              <span className="text-[10px] text-purple-600 font-semibold opacity-0 group-hover:opacity-100 transition hidden sm:inline">
                Tap to filter
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
