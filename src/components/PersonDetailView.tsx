import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  IndianRupee,
  CreditCard,
  User,
  Filter,
  Building2,
} from 'lucide-react';
import { DueRecord, DueType, PaymentEntry, DueFilterType } from '../types';
import { roundTo2Decimals, calculateRemaining, formatAmount } from '../utils/precision';
import { ConfirmModal } from './ConfirmModal';
import { EditPaymentLogModal } from './EditPaymentLogModal';

interface PersonDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  personName: string;
  dues: DueRecord[];
  currency: string;
  activeFilter?: DueFilterType;
  onFilterChange?: (filter: DueFilterType) => void;
  onEditDue: (due: DueRecord) => void;
  onDeleteDue: (id: string) => void;
  onOpenRecordPayment: (due: DueRecord) => void;
  onAddNewForPerson: (personName: string, defaultType?: DueType) => void;
  onUpdatePaymentLog?: (
    dueId: string,
    paymentId: string,
    updatedAmount: number,
    updatedDate: string,
    updatedNote?: string
  ) => void;
  onDeletePaymentLog?: (dueId: string, paymentId: string) => void;
}

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({
  isOpen,
  onClose,
  personName,
  dues,
  currency,
  activeFilter = 'all',
  onFilterChange,
  onEditDue,
  onDeleteDue,
  onOpenRecordPayment,
  onAddNewForPerson,
  onUpdatePaymentLog,
  onDeletePaymentLog,
}) => {
  const [dueToDelete, setDueToDelete] = useState<DueRecord | null>(null);
  const [editingPaymentLog, setEditingPaymentLog] = useState<{
    due: DueRecord;
    payment: PaymentEntry;
  } | null>(null);
  const [subFilter, setSubFilter] = useState<'all' | 'pending' | 'settled'>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Detect organization if any
  const organizationName = dues.find((d) => d.organization)?.organization;

  // Hardware and Browser Back Button Support
  useEffect(() => {
    if (!isOpen) return;

    // Push history state so phone's physical back button or browser back arrow closes this view
    const stateObj = { view: 'person_detail_view', person: personName };
    window.history.pushState(stateObj, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, personName, onClose]);

  // Handle on-screen back button click
  const handleBack = () => {
    if (window.history.state?.view === 'person_detail_view') {
      window.history.back();
    } else {
      onClose();
    }
  };

  // Helper to format due countdown
  const getDueCountdown = (dueDateStr: string, isSettled: boolean) => {
    if (isSettled) return { text: 'Settled', isOverdue: false, isToday: false, days: 0 };
    const today = new Date(todayStr).getTime();
    const due = new Date(dueDateStr).getTime();
    const diffDays = Math.round((due - today) / 86400000);

    if (diffDays < 0) {
      const pastDays = Math.abs(diffDays);
      return {
        text: `Overdue by ${pastDays} ${pastDays === 1 ? 'day' : 'days'}`,
        isOverdue: true,
        isToday: false,
        days: diffDays,
      };
    }
    if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false, isToday: true, days: 0 };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow', isOverdue: false, isToday: false, days: 1 };
    }
    return { text: `Due in ${diffDays} days`, isOverdue: false, isToday: false, days: diffDays };
  };

  // Filter dues based on activeFilter:
  // When activeFilter is 'receivable', exclude settled transactions!
  // When activeFilter is 'payable', exclude settled transactions!
  const displayedDues = useMemo(() => {
    let list = dues;

    if (activeFilter === 'receivable') {
      list = list.filter((d) => {
        const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
        const isSettled = d.status === 'settled' || remaining <= 0.001;
        return d.type === 'receivable' && !isSettled;
      });
    } else if (activeFilter === 'payable') {
      list = list.filter((d) => {
        const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
        const isSettled = d.status === 'settled' || remaining <= 0.001;
        return d.type === 'payable' && !isSettled;
      });
    } else if (activeFilter === 'settled') {
      list = list.filter((d) => {
        const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
        return d.status === 'settled' || remaining <= 0.001 || (d.paidAmount || 0) > 0.001;
      });
    } else {
      // activeFilter is 'all': apply subFilter if user selected
      if (subFilter === 'pending') {
        list = list.filter((d) => {
          const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
          return d.status !== 'settled' && remaining > 0.001;
        });
      } else if (subFilter === 'settled') {
        list = list.filter((d) => {
          const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
          return d.status === 'settled' || remaining <= 0.001 || (d.paidAmount || 0) > 0.001;
        });
      }
    }

    // Sort: Overdue pending first, then pending by due date, settled last
    return [...list].sort((a, b) => {
      const aRemaining = calculateRemaining(a.totalAmount, a.paidAmount || 0);
      const bRemaining = calculateRemaining(b.totalAmount, b.paidAmount || 0);
      const aSettled = a.status === 'settled' || aRemaining <= 0.001;
      const bSettled = b.status === 'settled' || bRemaining <= 0.001;
      if (aSettled && !bSettled) return 1;
      if (!aSettled && bSettled) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [dues, activeFilter, subFilter]);

  // Calculate totals for this person
  const {
    totalReceivable,
    totalPayable,
    remainingReceivable,
    remainingPayable,
    totalAmountSum,
    pendingAmountSum,
    settledAmountSum,
    pendingCount,
    settledCount,
    overdueCount,
  } = useMemo(() => {
    let tRec = 0;
    let tPay = 0;
    let rRec = 0;
    let rPay = 0;
    let totSum = 0;
    let pendSum = 0;
    let settSum = 0;
    let pCount = 0;
    let sCount = 0;
    let oCount = 0;

    dues.forEach((d) => {
      const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
      const isSettled = d.status === 'settled' || remaining <= 0.001;

      totSum = roundTo2Decimals(totSum + d.totalAmount);

      if (d.type === 'receivable') {
        tRec = roundTo2Decimals(tRec + d.totalAmount);
        rRec = roundTo2Decimals(rRec + remaining);
      } else {
        tPay = roundTo2Decimals(tPay + d.totalAmount);
        rPay = roundTo2Decimals(rPay + remaining);
      }

      if (isSettled) {
        sCount += 1;
        settSum = roundTo2Decimals(settSum + Math.max(d.totalAmount, d.paidAmount || 0));
      } else {
        pCount += 1;
        pendSum = roundTo2Decimals(pendSum + remaining);
        if (d.dueDate < todayStr) {
          oCount += 1;
        }
        if ((d.paidAmount || 0) > 0.001) {
          settSum = roundTo2Decimals(settSum + (d.paidAmount || 0));
        }
      }
    });

    return {
      totalReceivable: tRec,
      totalPayable: tPay,
      remainingReceivable: rRec,
      remainingPayable: rPay,
      totalAmountSum: totSum,
      pendingAmountSum: pendSum,
      settledAmountSum: settSum,
      pendingCount: pCount,
      settledCount: sCount,
      overdueCount: oCount,
    };
  }, [dues, todayStr]);

  if (!isOpen) return null;

  const netRemaining = roundTo2Decimals(remainingReceivable - remainingPayable);
  const isCard = personName.toLowerCase().includes('card');
  const initials = personName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const defaultAddType: DueType =
    activeFilter === 'payable'
      ? 'payable'
      : activeFilter === 'receivable'
      ? 'receivable'
      : remainingReceivable >= remainingPayable
      ? 'receivable'
      : 'payable';

  return (
    <div
      id="person-detail-full-page"
      className="fixed inset-0 z-40 bg-slate-50 flex flex-col h-full w-full overflow-hidden select-none animate-fadeIn"
      role="dialog"
      aria-label={`Detailed report for ${personName}`}
    >
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 py-3 shrink-0 flex items-center justify-between gap-2 shadow-2xs">
        {/* Left: Back Button with Icon & Label */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            id="person-detail-back-btn"
            onClick={handleBack}
            className="p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
            title="Back to Dues list"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
            <span className="text-xs font-bold text-slate-800 hidden xs:inline">Back</span>
          </button>

          {/* Avatar & Person Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                isCard
                  ? 'bg-amber-100 text-amber-800'
                  : netRemaining > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : netRemaining < 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isCard ? <CreditCard className="w-4 h-4" /> : initials || <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate leading-tight">
                {personName}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <span>
                  {displayedDues.length}{' '}
                  {displayedDues.length === 1 ? 'transaction' : 'transactions'}
                </span>
                {organizationName && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-slate-600 truncate flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{organizationName}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Add Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id="person-detail-add-btn"
            onClick={() => onAddNewForPerson(personName, defaultAddType)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-4 pb-16">
          {/* Active Filter Notification Banner */}
          {activeFilter !== 'all' && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
                activeFilter === 'receivable'
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                  : activeFilter === 'payable'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                  : 'bg-blue-50/90 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 font-medium">
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {activeFilter === 'settled' ? (
                    <>
                      Showing <strong className="font-black">Settled Transactions</strong> only
                    </>
                  ) : (
                    <>
                      Showing active{' '}
                      <strong className="font-black">
                        {activeFilter === 'receivable' ? 'Receivables' : 'Payables'}
                      </strong>{' '}
                      only • Settled hidden
                    </>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onFilterChange?.('all')}
                className="text-[11px] font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
              >
                Show All
              </button>
            </div>
          )}

          {/* Person Net Balance Summary Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-3.5 shadow-xs ${
              activeFilter === 'receivable' || (activeFilter === 'all' && netRemaining > 0)
                ? 'bg-emerald-50/70 border-emerald-200'
                : activeFilter === 'payable' || (activeFilter === 'all' && netRemaining < 0)
                ? 'bg-amber-50/70 border-amber-200'
                : activeFilter === 'settled'
                ? 'bg-blue-50/70 border-blue-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  {activeFilter === 'receivable'
                    ? 'Total Pending To Receive'
                    : activeFilter === 'payable'
                    ? 'Total Pending To Pay'
                    : activeFilter === 'settled'
                    ? 'Total Settled Amount'
                    : netRemaining > 0
                    ? 'Net Balance To Receive'
                    : netRemaining < 0
                    ? 'Net Balance To Pay (You Owe)'
                    : 'Account Fully Settled'}
                </span>
                <div
                  className={`text-2xl sm:text-3xl font-black tracking-tight mt-0.5 ${
                    activeFilter === 'receivable' || (activeFilter === 'all' && netRemaining > 0)
                      ? 'text-emerald-700'
                      : activeFilter === 'payable' || (activeFilter === 'all' && netRemaining < 0)
                      ? 'text-amber-700'
                      : activeFilter === 'settled'
                      ? 'text-blue-700'
                      : 'text-slate-700'
                  }`}
                >
                  {currency}
                  {formatAmount(
                    activeFilter === 'receivable'
                      ? remainingReceivable
                      : activeFilter === 'payable'
                      ? remainingPayable
                      : activeFilter === 'settled'
                      ? settledAmountSum
                      : netRemaining
                  )}
                </div>
              </div>

              {overdueCount > 0 && activeFilter !== 'settled' && (
                <div className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{overdueCount} Overdue</span>
                </div>
              )}
            </div>

            {/* Summary Table: Total, Pending, and Settled with counts and total sum of amount */}
            <div className="pt-2.5 border-t border-slate-200/70">
              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-center">Transactions</th>
                      <th className="py-2 px-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                        <span>Total</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {dues.length}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 text-xs sm:text-sm">
                        {currency}
                        {formatAmount(totalAmountSum)}
                      </td>
                    </tr>
                    <tr className="hover:bg-amber-50/30 transition">
                      <td className="py-2.5 px-3 font-semibold text-amber-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                        <span>Pending</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
                          {pendingCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-amber-700 text-xs sm:text-sm">
                        {currency}
                        {formatAmount(pendingAmountSum)}
                      </td>
                    </tr>
                    <tr className="hover:bg-emerald-50/30 transition">
                      <td className="py-2.5 px-3 font-semibold text-emerald-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>Settled</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                          {settledCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-xs sm:text-sm">
                        {currency}
                        {formatAmount(settledAmountSum)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sub-Filter Tabs when viewing 'all' */}
          {activeFilter === 'all' && dues.length > 1 && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setSubFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                  subFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({dues.length})
              </button>
              <button
                type="button"
                onClick={() => setSubFilter('pending')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                  subFilter === 'pending'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Active Only ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setSubFilter('settled')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                  subFilter === 'settled'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Settled ({settledCount})
              </button>
            </div>
          )}

          {/* List of Detailed Transactions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Transaction History ({displayedDues.length})
              </h2>
            </div>

            {displayedDues.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No active dues to display</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {activeFilter !== 'all'
                    ? `No active ${activeFilter} transactions found for ${personName}. All settled transactions are hidden.`
                    : 'No transactions match the selected filter.'}
                </p>
                {activeFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => onFilterChange?.('all')}
                    className="inline-block mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    View All History
                  </button>
                )}
              </div>
            ) : (
              displayedDues.map((item) => {
                const remaining = calculateRemaining(item.totalAmount, item.paidAmount || 0);
                const isSettled = item.status === 'settled' || remaining <= 0.001;
                const progress = Math.min(
                  100,
                  Math.round(((item.paidAmount || 0) / item.totalAmount) * 100)
                );
                const countdown = getDueCountdown(item.dueDate, isSettled);

                return (
                  <article
                    key={item.id}
                    className={`p-4 rounded-2xl border transition space-y-3 ${
                      isSettled
                        ? 'bg-white border-slate-200 opacity-80'
                        : countdown.isOverdue
                        ? 'bg-rose-50/50 border-rose-200 shadow-2xs'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    {/* Header: Badges and Purpose */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Type Pill */}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                              item.type === 'receivable'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.type === 'receivable' ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>Receivable</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Payable</span>
                              </>
                            )}
                          </span>

                          {/* Status Pill */}
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settled</span>
                            </span>
                          ) : countdown.isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-700">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{countdown.text}</span>
                            </span>
                          ) : item.status === 'partly_due' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>Partly Due ({progress}%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                              <Clock className="w-3 h-3" />
                              <span>{countdown.text}</span>
                            </span>
                          )}
                        </div>

                        {/* Top-Right Remaining Display */}
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            {isSettled ? 'Status' : 'Remaining Balance'}
                          </span>
                          <span
                            className={`text-base font-black ${
                              isSettled
                                ? 'text-slate-400 line-through'
                                : item.type === 'receivable'
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {currency}
                            {formatAmount(remaining)}
                          </span>
                        </div>
                      </div>

                      {/* Purpose Name & Organization */}
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.purpose}
                        </h3>
                        {item.organization && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5 text-slate-400" />
                            <span>{item.organization}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial Amount Breakdown (Total, Paid, Balance) */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Total</span>
                        <span className="font-bold text-slate-800">
                          {currency}
                          {formatAmount(item.totalAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Paid</span>
                        <span className="font-bold text-emerald-700">
                          {currency}
                          {formatAmount(item.paidAmount || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Remaining</span>
                        <span
                          className={`font-black ${
                            isSettled
                              ? 'text-slate-400 line-through'
                              : item.type === 'receivable'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {currency}
                          {formatAmount(remaining)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar (when partially paid) */}
                    {!isSettled && (item.paidAmount || 0) > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>Progress: {progress}%</span>
                          <span>
                            {currency}
                            {formatAmount(item.paidAmount)} of {currency}
                            {formatAmount(item.totalAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Dates & Settlement info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {item.startDate ? `Started ${item.startDate} • ` : ''}Due {item.dueDate}
                        </span>
                      </div>
                      {isSettled && item.settledDate && (
                        <span className="text-emerald-700 font-semibold">
                          Settled on {item.settledDate}
                        </span>
                      )}
                    </div>

                    {/* Payment History Log: Clickable log statement to edit/delete without changing font colour/size */}
                    {(item.paidAmount || 0) > 0 &&
                      item.paymentHistory &&
                      item.paymentHistory.filter((p) => p.amount > 0).length > 0 && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Payment Log ({item.paymentHistory.filter((p) => p.amount > 0).length}) &bull; Tap log to edit or delete
                          </span>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {item.paymentHistory
                              .filter((p) => p.amount > 0)
                              .map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => setEditingPaymentLog({ due: item, payment: p })}
                                  className="flex items-center justify-between text-xs text-slate-600 py-1 px-1.5 hover:bg-slate-200/60 rounded-lg transition cursor-pointer border-b border-slate-100/60 last:border-none"
                                  title="Click to edit or delete this payment entry"
                                >
                                  <span className="truncate pr-2">
                                    {p.date} {p.note ? `• ${p.note}` : ''}
                                  </span>
                                  <span className="font-bold text-emerald-700 shrink-0">
                                    +{currency}
                                    {formatAmount(p.amount)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isSettled && (
                          <button
                            type="button"
                            onClick={() => onOpenRecordPayment(item)}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                          >
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Record Payment</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => onEditDue(item)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                          title="Edit transaction"
                          aria-label="Edit transaction"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDueToDelete(item)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                          title="Delete transaction"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Edit Payment Log Modal */}
      {editingPaymentLog && (
        <EditPaymentLogModal
          isOpen={!!editingPaymentLog}
          onClose={() => setEditingPaymentLog(null)}
          due={editingPaymentLog.due}
          payment={editingPaymentLog.payment}
          currency={currency}
          onUpdatePayment={(dueId, paymentId, updatedAmount, updatedDate, updatedNote) => {
            onUpdatePaymentLog?.(dueId, paymentId, updatedAmount, updatedDate, updatedNote);
          }}
          onDeletePayment={(dueId, paymentId) => {
            onDeletePaymentLog?.(dueId, paymentId);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!dueToDelete}
        onCancel={() => setDueToDelete(null)}
        onConfirm={() => {
          if (dueToDelete) {
            onDeleteDue(dueToDelete.id);
            setDueToDelete(null);
          }
        }}
        title="Delete Transaction?"
        message={
          dueToDelete
            ? `Are you sure you want to delete "${dueToDelete.purpose}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
