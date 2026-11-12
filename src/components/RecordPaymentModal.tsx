import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  IndianRupee,
  Calendar,
  FileText,
  AlertCircle,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Tag,
  Landmark,
  CreditCard,
} from 'lucide-react';
import { DueRecord, CategoryInfo, PaymentMethod } from '../types';
import { roundTo2Decimals, parseAmountInput, calculateRemaining, formatAmount } from '../utils/precision';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: DueRecord | null;
  currency: string;
  categories?: CategoryInfo[];
  subCategories?: string[];
  onRecordPayment: (
    dueId: string,
    paymentAmount: number,
    paymentDate: string,
    paymentNote?: string,
    syncAsTransaction?: boolean,
    syncCategory?: string,
    syncSubCategory?: string,
    paymentMethod?: PaymentMethod
  ) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  due,
  currency,
  categories = [],
  subCategories = [],
  onRecordPayment,
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [syncAsTransaction, setSyncAsTransaction] = useState(true);
  const [syncCategory, setSyncCategory] = useState('');
  const [syncSubCategory, setSyncSubCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remaining = due ? calculateRemaining(due.totalAmount, due.paidAmount || 0) : 0;

  const relevantCategories = categories.filter(
    (c) => c.type === (due?.type === 'receivable' ? 'income' : 'expense')
  );

  useEffect(() => {
    if (due) {
      const rem = calculateRemaining(due.totalAmount, due.paidAmount || 0);
      setPaymentAmount(rem > 0 ? String(Math.round(rem)) : '0');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentNote(
        due.type === 'receivable'
          ? 'Received from ' + (due.personName || due.personOrEntity)
          : 'Paid to ' + (due.personName || due.personOrEntity)
      );
      setSyncAsTransaction(true);

      // Default category
      const targetType = due.type === 'receivable' ? 'income' : 'expense';
      const relCats = categories.filter((c) => c.type === targetType);
      if (relCats.length > 0) {
        setSyncCategory(relCats[0].name);
      } else {
        setSyncCategory(due.type === 'receivable' ? 'Other' : 'Bills');
      }

      if (subCategories.length > 0) {
        setSyncSubCategory(subCategories[0]);
      } else {
        setSyncSubCategory('Personal');
      }

      setError(null);
    }
  }, [due, isOpen, categories, subCategories]);

  if (!isOpen || !due) return null;

  const handlePayInFull = () => {
    setPaymentAmount(Math.round(remaining).toString());
  };

  const handlePayHalf = () => {
    setPaymentAmount(Math.round(remaining / 2).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseAmountInput(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (amount > remaining + 0.001) {
      setError(`Payment cannot exceed the remaining balance of ${currency}${formatAmount(remaining)}.`);
      return;
    }

    if (!paymentDate) {
      setError('Please choose a payment date.');
      return;
    }

    if (syncAsTransaction && !syncCategory.trim()) {
      setError('Please select a category for this cashflow transaction.');
      return;
    }

    onRecordPayment(
      due.id,
      amount,
      paymentDate,
      paymentNote.trim() || undefined,
      syncAsTransaction,
      syncCategory,
      due.type === 'payable' ? syncSubCategory : undefined,
      due.type === 'payable' ? paymentMethod : 'bank'
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                due.type === 'receivable'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {due.type === 'receivable' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {due.type === 'receivable' ? 'Record Amount Received' : 'Record Payment Made'}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">
                {due.personName || due.personOrEntity} &bull; {due.purpose}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Balance Summary Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Total Agreed:</span>
              <span className="font-bold text-slate-900">
                {currency}
                {formatAmount(due.totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Already Paid / Received:</span>
              <span className="font-semibold text-emerald-600">
                {currency}
                {formatAmount(due.paidAmount || 0)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-700">Remaining Balance:</span>
              <span className="font-extrabold text-slate-900">
                {currency}
                {formatAmount(remaining)}
              </span>
            </div>
          </div>

          {/* Amount to Record Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {due.type === 'receivable' ? 'Amount Received *' : 'Amount Paid *'}
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePayHalf}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer transition"
                >
                  Half
                </button>
                <button
                  type="button"
                  onClick={handlePayInFull}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded cursor-pointer transition"
                >
                  Pay Full ({currency}
                  {formatAmount(remaining)})
                </button>
              </div>
            </div>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                step="1"
                min="1"
                max={remaining}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-9.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Payment Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-9.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Payment Note / Method */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Payment Note / Method
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="e.g. Paid via Cash, Venmo, Bank Transfer, Apple Pay"
                className="w-full pl-9.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Sync Option: Automatically record receipt/payment in Income & Expenses */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={syncAsTransaction}
                onChange={(e) => setSyncAsTransaction(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  {due.type === 'receivable'
                    ? 'Automatically record receipt as Income'
                    : 'Automatically record payment as Expense'}
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal mt-0.5">
                  Logs this transaction in your Cashflow ledger and links it to this due.
                </span>
              </div>
            </label>

            {/* Immediate dropdown asking for categorizing such receipt or payment */}
            {syncAsTransaction && (
              <div className="pt-2 border-t border-emerald-200/60 space-y-2.5 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {due.type === 'receivable'
                        ? 'Select Income Category *'
                        : 'Select Expense Category *'}
                    </span>
                  </label>
                  <select
                    value={syncCategory}
                    onChange={(e) => setSyncCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    required
                  >
                    {relevantCategories.length > 0 ? (
                      relevantCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={due.type === 'receivable' ? 'Salary' : 'Bills'}>
                          {due.type === 'receivable' ? 'Salary' : 'Bills'}
                        </option>
                        <option value={due.type === 'receivable' ? 'Freelance' : 'Food & Dining'}>
                          {due.type === 'receivable' ? 'Freelance' : 'Food & Dining'}
                        </option>
                        <option value={due.type === 'receivable' ? 'Investments' : 'Utilities'}>
                          {due.type === 'receivable' ? 'Investments' : 'Utilities'}
                        </option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>

                {due.type === 'payable' && subCategories && subCategories.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                      Expense Sub-Category
                    </label>
                    <select
                      value={syncSubCategory}
                      onChange={(e) => setSyncSubCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      {subCategories.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {due.type === 'payable' && (
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                      Paid Through
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          paymentMethod === 'bank'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Landmark className="w-3.5 h-3.5" />
                        <span>Bank Account</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          paymentMethod === 'credit_card'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Credit Card</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Previous Payment History (if any) */}
          {due.paymentHistory && due.paymentHistory.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <History className="w-3.5 h-3.5" />
                <span>Payment History ({due.paymentHistory.length})</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {due.paymentHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 block truncate">
                        {item.note || 'Payment'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{item.date}</span>
                    </div>
                    <span className="font-bold text-emerald-600 shrink-0">
                      +{currency}
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
