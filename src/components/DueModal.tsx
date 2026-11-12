import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { DueRecord, DueType } from '../types';
import { parseAmountInput, calculateRemaining, formatAmount } from '../utils/precision';

interface DueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<DueRecord, 'id' | 'createdAt'>, id?: string) => void;
  onDelete?: (id: string) => void;
  initialDue?: DueRecord | null;
  defaultType?: DueType;
  defaultPersonName?: string;
  currency: string;
}

export const DueModal: React.FC<DueModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDue,
  defaultType = 'receivable',
  defaultPersonName = '',
  currency,
}) => {
  const [type, setType] = useState<DueType>(defaultType);
  const [personName, setPersonName] = useState('');
  const [organization, setOrganization] = useState('');
  const [purpose, setPurpose] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form state
  useEffect(() => {
    if (initialDue) {
      setType(initialDue.type);
      setPersonName(initialDue.personName || initialDue.personOrEntity || '');
      setOrganization(initialDue.organization || '');
      setPurpose(initialDue.purpose);
      setTotalAmount(initialDue.totalAmount.toString());
      setPaidAmount((initialDue.paidAmount || 0).toString());
      setStartDate(initialDue.startDate);
      setDueDate(initialDue.dueDate);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      setType(defaultType);
      setPersonName(defaultPersonName || '');
      setOrganization('');
      setPurpose('');
      setTotalAmount('');
      setPaidAmount('0');
      setStartDate(today);
      setDueDate(nextWeekStr);
    }
    setError(null);
  }, [initialDue, defaultType, defaultPersonName, isOpen]);

  if (!isOpen) return null;

  const setDueDatePreset = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const setDueDateEndOfMonth = () => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setDueDate(lastDay.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseAmountInput(totalAmount);
    const paid = parseAmountInput(paidAmount);

    if (!personName.trim()) {
      setError('Please specify the name of the person.');
      return;
    }

    if (!purpose.trim()) {
      setError('Please specify the purpose / reason.');
      return;
    }

    if (isNaN(total) || total <= 0) {
      setError('Total amount must be greater than 0.');
      return;
    }

    if (paid < 0) {
      setError('Paid amount cannot be negative.');
      return;
    }

    if (paid > total + 0.001) {
      setError('Paid amount cannot be greater than the total amount.');
      return;
    }

    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    // Determine status automatically
    let status: DueRecord['status'] = 'due';
    if (paid >= total) {
      status = 'settled';
    } else if (paid > 0) {
      status = 'partly_due';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const cleanPersonName = personName.trim();
    const cleanOrg = organization.trim();
    const effectiveDisplayName = cleanOrg
      ? `${cleanPersonName} (${cleanOrg})`
      : cleanPersonName;

    onSave(
      {
        type,
        personName: cleanPersonName,
        organization: cleanOrg || undefined,
        personOrEntity: effectiveDisplayName,
        purpose: purpose.trim(),
        totalAmount: total,
        paidAmount: paid,
        status,
        startDate: startDate || todayStr,
        dueDate,
        settledDate: status === 'settled' ? todayStr : undefined,
        paymentHistory:
          paid <= 0
            ? []
            : initialDue?.paymentHistory && initialDue.paymentHistory.length > 0
            ? initialDue.paymentHistory.filter((p) => p.amount > 0)
            : [
                {
                  id: 'pay-init-' + Date.now(),
                  amount: paid,
                  date: startDate || todayStr,
                  note: 'Initial payment recorded',
                  createdAt: Date.now(),
                },
              ],
      },
      initialDue?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                type === 'receivable'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {type === 'receivable' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialDue ? 'Edit Record' : 'Track New Due'}
              </h3>
              <p className="text-xs text-slate-500">
                {type === 'receivable'
                  ? 'Amount to receive from someone (Receivable)'
                  : 'Amount you are liable to pay to someone (Payable)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector Toggle: Receivable vs Payable */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Due Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('receivable')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'receivable'
                    ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>To Receive (Receivable)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('payable')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'payable'
                    ? 'bg-white text-amber-700 shadow-xs ring-1 ring-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-amber-600" />
                <span>To Pay (Payable)</span>
              </button>
            </div>
          </div>

          {/* Field 1: Name of the Person */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Name of the Person *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. John Doe, Alex Smith"
                className="w-full pl-9.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Field 2: Name of the Organization */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Name of the Organization
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Acme Corp, HDFC Bank, Landlord Ltd (Optional)"
                className="w-full pl-9.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Purpose / Reason (Text Box only, no preset buttons) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Purpose / Reason *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Project advance, Equipment split, Consultation fee"
                className="w-full pl-9.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Total Amount & Already Paid Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Total Amount ({currency}) *
              </label>
              <div className="relative">
                <span className="text-slate-400 font-bold absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {currency}
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {type === 'receivable' ? 'Already Received' : 'Already Paid'} ({currency})
              </label>
              <div className="relative">
                <span className="text-slate-400 font-bold absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {currency}
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Live Remaining Balance Pill */}
          {parseAmountInput(totalAmount) > 0 && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">
                Outstanding Balance:
              </span>
              <span className="text-xs font-bold text-slate-900">
                {currency}
                {formatAmount(
                  calculateRemaining(
                    parseAmountInput(totalAmount),
                    parseAmountInput(paidAmount)
                  )
                )}
              </span>
            </div>
          )}

          {/* Dates: Start Date & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {type === 'receivable' ? 'Lent / Created Date' : 'Borrowed / Bill Date'}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9.5 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9.5 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Due Date Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-semibold">Quick Due:</span>
            <button
              type="button"
              onClick={() => setDueDatePreset(7)}
              className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
            >
              +7 Days
            </button>
            <button
              type="button"
              onClick={() => setDueDatePreset(15)}
              className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
            >
              +15 Days
            </button>
            <button
              type="button"
              onClick={() => setDueDatePreset(30)}
              className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
            >
              +30 Days
            </button>
            <button
              type="button"
              onClick={setDueDateEndOfMonth}
              className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
            >
              End of Month
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
            {initialDue && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(initialDue.id)}
                className="px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer ${
                  type === 'receivable'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {initialDue ? 'Save Changes' : 'Track Due'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
