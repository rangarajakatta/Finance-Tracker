import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { DueRecord, DueFilterType } from '../types';
import { roundTo2Decimals, calculateRemaining, formatAmount } from '../utils/precision';

interface DuesOverviewCardProps {
  dues: DueRecord[];
  currency: string;
  activeFilter?: DueFilterType;
  onFilterChange?: (filter: DueFilterType) => void;
}

export const DuesOverviewCard: React.FC<DuesOverviewCardProps> = ({
  dues,
  currency,
  activeFilter = 'all',
  onFilterChange,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate totals for active/unsettled dues and settled dues (including full settlements and partial payments)
  let totalReceivableRemaining = 0;
  let totalPayableRemaining = 0;
  let totalSettledAmount = 0;
  let overdueCount = 0;
  let pendingCount = 0;
  let settledCount = 0;
  let partlyPaidCount = 0;

  dues.forEach((d) => {
    const paid = d.paidAmount || 0;
    const remaining = calculateRemaining(d.totalAmount, paid);
    const isFullySettled = d.status === 'settled' || remaining <= 0.001;

    if (isFullySettled) {
      settledCount += 1;
      totalSettledAmount = roundTo2Decimals(totalSettledAmount + Math.max(d.totalAmount, paid));
    } else {
      pendingCount += 1;
      if (d.dueDate < todayStr) {
        overdueCount += 1;
      }
      if (d.type === 'receivable') {
        totalReceivableRemaining = roundTo2Decimals(totalReceivableRemaining + remaining);
      } else {
        totalPayableRemaining = roundTo2Decimals(totalPayableRemaining + remaining);
      }
      // Include partial payments received or paid towards settled total
      if (paid > 0.001) {
        partlyPaidCount += 1;
        totalSettledAmount = roundTo2Decimals(totalSettledAmount + paid);
      }
    }
  });

  const netBalance = roundTo2Decimals(totalReceivableRemaining - totalPayableRemaining);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-none">
              Dues & Debts Overview
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Receivables from others & payables you owe
            </p>
          </div>
        </div>

        {/* Quick status chips */}
        <div className="flex items-center gap-1.5">
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3 h-3" />
              <span>{overdueCount} Overdue</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
            <Clock className="w-3 h-3" />
            <span>{pendingCount} Pending</span>
          </span>
        </div>
      </div>

      {/* Grid of Main Figures: To Receive vs To Pay vs Settled (Clickable Filters) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Receivables Card */}
        <button
          type="button"
          id="due-filter-receivable-btn"
          onClick={() => onFilterChange?.(activeFilter === 'receivable' ? 'all' : 'receivable')}
          className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between relative group ${
            activeFilter === 'receivable'
              ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xs'
              : 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/50 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">To Receive</span>
            </div>
            {activeFilter === 'receivable' && (
              <span className="hidden sm:inline-block text-[10px] font-bold bg-emerald-700 text-white px-1.5 py-0.2 rounded leading-tight shrink-0">
                Active
              </span>
            )}
          </div>
          <div className="text-sm sm:text-lg font-black text-emerald-700 tracking-tight truncate">
            {currency}
            {formatAmount(totalReceivableRemaining)}
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-emerald-700/80 mt-1 truncate">
            {activeFilter === 'receivable' ? 'Active filter' : 'Tap to filter'}
          </span>
        </button>

        {/* Payables Card */}
        <button
          type="button"
          id="due-filter-payable-btn"
          onClick={() => onFilterChange?.(activeFilter === 'payable' ? 'all' : 'payable')}
          className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between relative group ${
            activeFilter === 'payable'
              ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-500/40 shadow-xs'
              : 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/50 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">To Pay</span>
            </div>
            {activeFilter === 'payable' && (
              <span className="hidden sm:inline-block text-[10px] font-bold bg-amber-700 text-white px-1.5 py-0.2 rounded leading-tight shrink-0">
                Active
              </span>
            )}
          </div>
          <div className="text-sm sm:text-lg font-black text-amber-700 tracking-tight truncate">
            {currency}
            {formatAmount(totalPayableRemaining)}
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-amber-700/80 mt-1 truncate">
            {activeFilter === 'payable' ? 'Active filter' : 'Tap to filter'}
          </span>
        </button>

        {/* Settled Card */}
        <button
          type="button"
          id="due-filter-settled-btn"
          onClick={() => onFilterChange?.(activeFilter === 'settled' ? 'all' : 'settled')}
          className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between relative group ${
            activeFilter === 'settled'
              ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-500/40 shadow-xs'
              : 'bg-blue-50/60 border-blue-200/80 hover:bg-blue-100/50 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-800 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Settled</span>
            </div>
            {activeFilter === 'settled' && (
              <span className="hidden sm:inline-block text-[10px] font-bold bg-blue-700 text-white px-1.5 py-0.2 rounded leading-tight shrink-0">
                Active
              </span>
            )}
          </div>
          <div className="text-sm sm:text-lg font-black text-blue-700 tracking-tight truncate">
            {currency}
            {formatAmount(totalSettledAmount)}
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-blue-700/80 mt-1 truncate">
            {activeFilter === 'settled'
              ? 'Active filter'
              : settledCount > 0 && partlyPaidCount > 0
              ? `${settledCount} settled • ${partlyPaidCount} partial`
              : partlyPaidCount > 0
              ? `${partlyPaidCount} partly settled`
              : `${settledCount} settled`}
          </span>
        </button>
      </div>

      {/* Net Position Bar */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Net Due Position:</span>
          <span
            className={`text-xs font-black ${
              netBalance > 0
                ? 'text-emerald-600'
                : netBalance < 0
                ? 'text-rose-600'
                : 'text-slate-700'
            }`}
          >
            {currency}
            {formatAmount(netBalance)}
          </span>
          {activeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange?.('all')}
              className="ml-2 text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {settledCount} Settled{partlyPaidCount > 0 ? ` (${partlyPaidCount} partial)` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
