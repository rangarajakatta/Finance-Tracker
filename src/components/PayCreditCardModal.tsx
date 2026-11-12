import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Landmark,
  ArrowRight,
  CheckCircle2,
  Calendar,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { roundTo2Decimals, parseAmountInput, formatAmount } from '../utils/precision';

interface PayCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankBalance: number;
  creditCardDue: number;
  currency: string;
  onPayCreditCard: (amount: number, date: string, note?: string) => void;
}

export const PayCreditCardModal: React.FC<PayCreditCardModalProps> = ({
  isOpen,
  onClose,
  bankBalance,
  creditCardDue,
  currency,
  onPayCreditCard,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Default to paying the full outstanding due if > 0, otherwise empty
      const defaultAmount = creditCardDue > 0 ? String(Math.round(creditCardDue)) : '';
      setAmount(defaultAmount);
      setDate(new Date().toISOString().split('T')[0]);
      setNote('Credit Card bill payment from Bank');
      setError(null);
    }
  }, [isOpen, creditCardDue]);

  if (!isOpen) return null;

  const parsedAmount = parseAmountInput(amount);
  const validAmount = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const newBankBalance = roundTo2Decimals(bankBalance - validAmount);
  const newCreditCardDue = Math.max(0, roundTo2Decimals(creditCardDue - validAmount));

  const handlePayFull = () => {
    setAmount(Math.round(creditCardDue).toString());
    setError(null);
  };

  const handlePayHalf = () => {
    setAmount(Math.round(creditCardDue / 2).toString());
    setError(null);
  };

  const handleSetQuickAmount = (val: number) => {
    setAmount(val.toString());
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (creditCardDue > 0 && parsedAmount > creditCardDue + 0.001) {
      setError(`Payment cannot exceed the outstanding credit card due of ${currency}${formatAmount(creditCardDue)}.`);
      return;
    }

    if (!date) {
      setError('Please select a payment date.');
      return;
    }

    setError(null);
    onPayCreditCard(parsedAmount, date, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pay Credit Card Due
              </h3>
              <p className="text-xs text-slate-500">
                Transfer payment directly from Bank to Credit Card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-slate-700 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Visual Direction: Bank Account -> Credit Card */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-purple-50/60 to-purple-100/70 rounded-2xl border border-purple-200/80">
            <div className="flex items-center justify-between text-xs">
              {/* Bank Side */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-blue-600" />
                  <span>From Bank</span>
                </span>
                <p className="text-sm font-extrabold text-slate-900">
                  {currency}{formatAmount(bankBalance)}
                </p>
                <span className="text-[10px] text-slate-500 block">Available Balance</span>
              </div>

              {/* Arrow */}
              <div className="p-2 bg-white rounded-full shadow-xs text-purple-600 border border-purple-200 mx-2">
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Credit Card Side */}
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center justify-end gap-1">
                  <span>To Credit Card</span>
                  <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                </span>
                <p className="text-sm font-extrabold text-purple-900">
                  {currency}{formatAmount(creditCardDue)}
                </p>
                <span className="text-[10px] text-slate-500 block">Outstanding Due</span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Payment Amount *
              </label>
              {creditCardDue > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePayHalf}
                    className="px-2 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded transition cursor-pointer"
                  >
                    Pay Half
                  </button>
                  <button
                    type="button"
                    onClick={handlePayFull}
                    className="px-2 py-0.5 text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded transition cursor-pointer"
                  >
                    Pay Full ({currency}{formatAmount(creditCardDue)})
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                {currency}
              </span>
              <input
                id="pay-cc-amount-input"
                type="number"
                step="any"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* Quick Presets if CC due is 0 or user wants round numbers */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-400 shrink-0 font-medium">Quick:</span>
              {[500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSetQuickAmount(val)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition shrink-0 active:scale-95 cursor-pointer"
                >
                  +{currency}{val}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Payment Date *</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              required
            />
          </div>

          {/* Payment Note / Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Description / Note</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. HDFC Credit Card monthly bill paid via Net Banking"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Preview of Automatic Balances Impact */}
          {validAmount > 0 && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Automatic Balance Update</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  No Double Expense
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60">
                <div>
                  <span className="text-[11px] text-slate-500 block">Bank Balance:</span>
                  <span className="font-bold text-slate-900">
                    {currency}{formatAmount(newBankBalance)}
                  </span>
                  <span className="text-[10px] text-rose-600 block">
                    (-{currency}{formatAmount(validAmount)})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Credit Card Due:</span>
                  <span className="font-bold text-slate-900">
                    {currency}{formatAmount(newCreditCardDue)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">
                    (-{currency}{formatAmount(validAmount)})
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-emerald-800 font-medium pt-1">
                Settles credit debt from bank. Not recorded as a duplicate expense or included in expense breakdown.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-pay-cc-submit-btn"
              className="flex-2 py-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Pay Bill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
