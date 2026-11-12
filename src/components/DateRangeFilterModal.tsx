import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Filter,
  Calendar,
  RotateCcw,
  Check,
  CalendarRange,
  ArrowRight,
} from 'lucide-react';
import { DateRange, Transaction, DueRecord } from '../types';

interface DateRangeFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRange: DateRange | null;
  onApplyRange: (range: DateRange) => void;
  onClearRange: () => void;
  transactions: Transaction[];
  dues: DueRecord[];
}

export const DateRangeFilterModal: React.FC<DateRangeFilterModalProps> = ({
  isOpen,
  onClose,
  activeRange,
  onApplyRange,
  onClearRange,
  transactions,
  dues,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStart = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const [startDate, setStartDate] = useState<string>(
    activeRange ? activeRange.startDate : currentMonthStart
  );
  const [endDate, setEndDate] = useState<string>(
    activeRange ? activeRange.endDate : todayStr
  );
  const [error, setError] = useState<string | null>(null);

  // Sync inputs whenever modal opens or activeRange changes
  useEffect(() => {
    if (isOpen) {
      if (activeRange) {
        setStartDate(activeRange.startDate);
        setEndDate(activeRange.endDate);
      } else {
        setStartDate(currentMonthStart);
        setEndDate(todayStr);
      }
      setError(null);
    }
  }, [isOpen, activeRange, currentMonthStart, todayStr]);

  // Dynamic current & previous financial year calculation (April 1 to March 31)
  const fyPresets = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const isPastApril = now.getMonth() >= 3; // Indian FY starts April 1st (month index 3)
    const currentFYStart = isPastApril ? currentYear : currentYear - 1;
    const currentFYEnd = currentFYStart + 1;

    const currentLabel = `FY ${currentFYStart}-${String(currentFYEnd).slice(-2)}`;
    const currentStart = `${currentFYStart}-04-01`;
    const currentEnd = `${currentFYEnd}-03-31`;

    const prevFYStart = currentFYStart - 1;
    const prevFYEnd = currentFYStart;
    const prevLabel = `FY ${prevFYStart}-${String(prevFYEnd).slice(-2)}`;
    const prevStart = `${prevFYStart}-04-01`;
    const prevEnd = `${prevFYEnd}-03-31`;

    return {
      current: { label: currentLabel, start: currentStart, end: currentEnd },
      previous: { label: prevLabel, start: prevStart, end: prevEnd },
    };
  }, []);

  // Preset generators
  const handlePreset = (type: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    setError(null);

    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (type === 'this_week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (type === 'this_month') {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setStartDate(start);
      setEndDate(today);
    } else if (type === 'last_month') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(prevMonth.toISOString().split('T')[0]);
      setEndDate(lastDayOfPrevMonth.toISOString().split('T')[0]);
    } else if (type === 'last_30_days') {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 29);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (type === 'financial_year') {
      setStartDate(fyPresets.current.start);
      setEndDate(fyPresets.current.end);
    } else if (type === 'prev_financial_year') {
      setStartDate(fyPresets.previous.start);
      setEndDate(fyPresets.previous.end);
    }
  };

  // Live count preview
  const matchingTxCount = transactions.filter((t) => {
    if (!startDate || !endDate) return true;
    return t.date >= startDate && t.date <= endDate;
  }).length;

  const matchingDuesCount = dues.filter((d) => {
    if (!startDate || !endDate) return true;
    const inStart = d.startDate && d.startDate >= startDate && d.startDate <= endDate;
    const inDue = d.dueDate && d.dueDate >= startDate && d.dueDate <= endDate;
    const inSettled = d.settledDate && d.settledDate >= startDate && d.settledDate <= endDate;
    const inPayments = d.paymentHistory && d.paymentHistory.some((p) => p.date >= startDate && p.date <= endDate);
    const createdStr = d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '';
    const inCreated = createdStr >= startDate && createdStr <= endDate;
    return Boolean(inStart || inDue || inSettled || inPayments || inCreated);
  }).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please select both From and To dates.');
      return;
    }
    if (startDate > endDate) {
      setError('From Date cannot be later than To Date.');
      return;
    }
    setError(null);
    onApplyRange({ startDate, endDate });
    onClose();
  };

  const handleClear = () => {
    onClearRange();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Filter by Date Range
              </h3>
              <p className="text-xs text-slate-500">
                Filter Income, Expenses, Receivables & Payables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4.5 text-slate-700 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quick Shortcuts
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Auto-updated for {fyPresets.current.label}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'today', label: 'Today', start: todayStr, end: todayStr },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'last_30_days', label: 'Last 30 Days' },
                {
                  id: 'financial_year',
                  label: fyPresets.current.label,
                  start: fyPresets.current.start,
                  end: fyPresets.current.end,
                  tooltip: `Full Financial Year: ${fyPresets.current.start} to ${fyPresets.current.end}`,
                },
                {
                  id: 'prev_financial_year',
                  label: `Prev ${fyPresets.previous.label}`,
                  start: fyPresets.previous.start,
                  end: fyPresets.previous.end,
                  tooltip: `Previous Financial Year: ${fyPresets.previous.start} to ${fyPresets.previous.end}`,
                },
              ].map((p) => {
                const isSelected =
                  Boolean(p.start && p.end && startDate === p.start && endDate === p.end);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePreset(p.id)}
                    title={p.tooltip || `Select ${p.label}`}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer active:scale-95 text-center border ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs ring-2 ring-emerald-500/25'
                        : p.id === 'financial_year'
                        ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100 font-semibold'
                        : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-slate-200/60 text-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>From Date (Start)</span>
              </label>
              <input
                id="filter-from-date-input"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>To Date (End)</span>
              </label>
              <input
                id="filter-to-date-input"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Live Preview Count */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <span className="font-semibold flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Matching in this period:</span>
            </span>
            <span className="font-bold">
              {matchingTxCount} txns • {matchingDuesCount} dues
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {activeRange && (
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Clear date range and show all transactions"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex-2 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Filter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
