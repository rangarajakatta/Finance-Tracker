import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Users,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  CreditCard,
  User,
  X,
} from 'lucide-react';
import { DueRecord, DueType, DueFilterType } from '../types';
import { roundTo2Decimals, calculateRemaining, formatAmount } from '../utils/precision';

interface DuesListProps {
  dues: DueRecord[];
  currency: string;
  activeFilter?: DueFilterType;
  onFilterChange?: (filter: DueFilterType) => void;
  onSelectPerson?: (personName: string) => void;
  onEditDue: (due: DueRecord) => void;
  onDeleteDue: (id: string) => void;
  onOpenRecordPayment: (due: DueRecord) => void;
  onQuickSettle?: (due: DueRecord) => void;
  onAddNew: (type?: DueType, personName?: string) => void;
}

interface GroupedPersonItem {
  personOrEntity: string;
  organization?: string;
  dues: DueRecord[];
  transactionCount: number;
  remainingReceivable: number;
  remainingPayable: number;
  netAmount: number;
  pendingCount: number;
  settledCount: number;
  overdueCount: number;
  earliestDueDate?: string;
}

export const DuesList: React.FC<DuesListProps> = ({
  dues,
  currency,
  activeFilter = 'all',
  onFilterChange,
  onSelectPerson,
  onEditDue,
  onDeleteDue,
  onOpenRecordPayment,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Group dues by person and calculate net balances & counts
  const groupedPersons = useMemo(() => {
    // 1. Filter dues by the top-level activeFilter ('receivable' | 'payable' | 'settled' | 'all')
    const filteredByTopFilter = dues.filter((d) => {
      const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
      const isSettled = d.status === 'settled' || remaining <= 0.001;
      const hasPartPayment = (d.paidAmount || 0) > 0.001;

      if (activeFilter === 'receivable') {
        return d.type === 'receivable' && !isSettled;
      }
      if (activeFilter === 'payable') {
        return d.type === 'payable' && !isSettled;
      }
      if (activeFilter === 'settled') {
        return isSettled || hasPartPayment;
      }
      return true;
    });

    // 2. Group by person name
    const map = new Map<string, DueRecord[]>();
    filteredByTopFilter.forEach((d) => {
      const key = (d.personName || d.personOrEntity).trim().toLowerCase();
      const existing = map.get(key) || [];
      existing.push(d);
      map.set(key, existing);
    });

    const groups: GroupedPersonItem[] = [];

    map.forEach((personDues) => {
      const displayName = (personDues[0].personName || personDues[0].personOrEntity).trim();
      const organization = personDues.find((d) => d.organization)?.organization;

      let remainingReceivable = 0;
      let remainingPayable = 0;
      let pendingCount = 0;
      let settledCount = 0;
      let overdueCount = 0;
      let earliestDueDate: string | undefined;

      personDues.forEach((d) => {
        const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
        if (d.type === 'receivable') {
          remainingReceivable = roundTo2Decimals(remainingReceivable + remaining);
        } else {
          remainingPayable = roundTo2Decimals(remainingPayable + remaining);
        }

        if (d.status === 'settled' || remaining <= 0.001) {
          settledCount += 1;
        } else {
          pendingCount += 1;
          if (d.dueDate < todayStr) {
            overdueCount += 1;
          }
          if (!earliestDueDate || d.dueDate < earliestDueDate) {
            earliestDueDate = d.dueDate;
          }
        }
      });

      let netAmount = 0;
      if (activeFilter === 'receivable') {
        netAmount = remainingReceivable;
      } else if (activeFilter === 'payable') {
        netAmount = remainingPayable;
      } else if (activeFilter === 'settled') {
        netAmount = roundTo2Decimals(
          personDues.reduce((sum, d) => {
            const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
            const isSettledDue = d.status === 'settled' || remaining <= 0.001;
            const settledForDue = isSettledDue
              ? Math.max(d.totalAmount, d.paidAmount || 0)
              : (d.paidAmount || 0);
            return sum + settledForDue;
          }, 0)
        );
      } else {
        netAmount = roundTo2Decimals(remainingReceivable - remainingPayable);
      }

      groups.push({
        personOrEntity: displayName,
        organization,
        dues: personDues,
        transactionCount: personDues.length,
        remainingReceivable,
        remainingPayable,
        netAmount,
        pendingCount,
        settledCount,
        overdueCount,
        earliestDueDate,
      });
    });

    // 3. Search query filter
    let result = groups;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = groups.filter((g) => {
        const matchesName = g.personOrEntity.toLowerCase().includes(q);
        const matchesPurpose = g.dues.some((d) => d.purpose.toLowerCase().includes(q));
        const matchesOrg = g.organization?.toLowerCase().includes(q);
        return matchesName || matchesPurpose || matchesOrg;
      });
    }

    // 4. Sort: overdue first, then items with pending balances, settled last
    return result.sort((a, b) => {
      if (a.overdueCount > 0 && b.overdueCount === 0) return -1;
      if (a.overdueCount === 0 && b.overdueCount > 0) return 1;

      const aHasPending = a.pendingCount > 0;
      const bHasPending = b.pendingCount > 0;
      if (aHasPending && !bHasPending) return -1;
      if (!aHasPending && bHasPending) return 1;

      return Math.abs(b.netAmount) - Math.abs(a.netAmount);
    });
  }, [dues, activeFilter, searchQuery, todayStr]);

  return (
    <div className="space-y-3">
      {/* Search Input Card (Removed status filters and duplicate type filters per user request) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="dues-person-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by person or entity name..."
            className="w-full pl-9.5 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active filter contextual note if filtered from the top overview boxes */}
        {activeFilter !== 'all' && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span>Filtered by:</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded-md ${
                  activeFilter === 'receivable'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeFilter === 'payable'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {activeFilter === 'receivable'
                  ? 'To Receive'
                  : activeFilter === 'payable'
                  ? 'To Pay (I Owe)'
                  : 'Settled'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onFilterChange?.('all')}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              Reset filter
            </button>
          </div>
        )}
      </div>

      {/* Header and Add Button */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          People & Entities ({groupedPersons.length})
        </h3>
        <button
          type="button"
          id="dues-add-new-btn"
          onClick={() => onAddNew(activeFilter === 'payable' ? 'payable' : 'receivable')}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-emerald-50 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Due</span>
        </button>
      </div>

      {/* Grouped Person Cards List */}
      {groupedPersons.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No records found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {searchQuery || activeFilter !== 'all'
              ? 'No persons match your search or filter. Tap "Reset filter" or clear search.'
              : 'You have not added any dues yet. Tap "Add Due" to start tracking.'}
          </p>
          <button
            type="button"
            onClick={() => onAddNew(activeFilter === 'payable' ? 'payable' : 'receivable')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Track New Due</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {groupedPersons.map((group) => {
            const isAllSettled = group.pendingCount === 0;
            const isCard = group.personOrEntity.toLowerCase().includes('card');
            const initials = group.personOrEntity
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);

            // Determine if net is receivable or payable
            const isReceivable =
              activeFilter === 'receivable'
                ? true
                : activeFilter === 'payable'
                ? false
                : group.netAmount >= 0;

            return (
              <div
                key={group.personOrEntity}
                onClick={() => onSelectPerson?.(group.personOrEntity)}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 hover:shadow-xs active:scale-[0.99] transition cursor-pointer flex items-center justify-between gap-3 group"
                title="Click to view detailed transaction report"
              >
                {/* Left: Avatar & Person Name & Transaction Count */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 transition ${
                      isCard
                        ? 'bg-amber-100 text-amber-800'
                        : activeFilter === 'settled' || isAllSettled
                        ? 'bg-blue-50 text-blue-700'
                        : isReceivable
                        ? 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200'
                        : 'bg-amber-100 text-amber-800 group-hover:bg-amber-200'
                    }`}
                  >
                    {isCard ? (
                      <CreditCard className="w-5 h-5" />
                    ) : initials || (
                      <User className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 truncate leading-snug group-hover:text-emerald-700 transition">
                        {group.personOrEntity}
                      </h4>
                      {group.organization && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {group.organization}
                        </span>
                      )}
                    </div>

                    {/* Subtext: Number of transactions and status */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span className="font-semibold text-slate-600">
                        {group.transactionCount}{' '}
                        {group.transactionCount === 1 ? 'transaction' : 'transactions'}
                      </span>

                      {group.overdueCount > 0 && activeFilter !== 'settled' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>{group.overdueCount} overdue</span>
                        </span>
                      )}

                      {isAllSettled && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-md">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Settled</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Net Amount and Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-black tracking-tight ${
                        activeFilter === 'settled'
                          ? 'text-blue-700 font-bold'
                          : isAllSettled
                          ? 'text-slate-400 line-through'
                          : isReceivable
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {currency}
                      {formatAmount(group.netAmount)}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 block -mt-0.5">
                      {activeFilter === 'settled'
                        ? 'Total Settled'
                        : isAllSettled
                        ? 'All Cleared'
                        : isReceivable
                        ? 'Net to Receive'
                        : 'Net to Pay'}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
