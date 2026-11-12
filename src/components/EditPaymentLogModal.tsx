import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, IndianRupee, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DueRecord, PaymentEntry } from '../types';
import { parseAmountInput, formatAmount } from '../utils/precision';

interface EditPaymentLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: DueRecord | null;
  payment: PaymentEntry | null;
  currency: string;
  onUpdatePayment: (
    dueId: string,
    paymentId: string,
    updatedAmount: number,
    updatedDate: string,
    updatedNote?: string
  ) => void;
  onDeletePayment: (dueId: string, paymentId: string) => void;
}

export const EditPaymentLogModal: React.FC<EditPaymentLogModalProps> = ({
  isOpen,
  onClose,
  due,
  payment,
  currency,
  onUpdatePayment,
  onDeletePayment,
}) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setDate(payment.date);
      setNote(payment.note || '');
      setError(null);
      setIsConfirmingDelete(false);
    }
  }, [payment, isOpen]);

  if (!isOpen || !due || !payment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseAmountInput(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }
    if (!date) {
      setError('Please select a payment date.');
      return;
    }

    onUpdatePayment(
      due.id,
      payment.id,
      parsedAmount,
      date,
      note.trim() || undefined
    );
    onClose();
  };

  const handleDelete = () => {
    onDeletePayment(due.id, payment.id);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-65 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      style={{ minHeight: '100dvh', width: '100vw' }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150 relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Edit Payment Log
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-[220px]">
              {due.personName || due.personOrEntity} &bull; {due.purpose}
            </p>
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

        {/* Delete Confirmation View inside modal */}
        {isConfirmingDelete ? (
          <div className="p-5 space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Delete this payment log?</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Deleting this payment of{' '}
                <span className="font-bold">
                  {currency}
                  {formatAmount(payment.amount)}
                </span>{' '}
                will automatically restore this amount as outstanding due. Any synced transaction in Income & Expenses will also be removed.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer min-h-[42px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition shadow-xs cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Log</span>
              </button>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Payment Amount ({currency}) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Payment Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Note / Method */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Payment Note / Method
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Cash, Bank Transfer, Apple Pay"
                  className="w-full pl-9.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="p-2.5 text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                title="Delete this payment"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer min-h-[40px] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
