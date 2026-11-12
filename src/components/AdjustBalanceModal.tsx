import React, { useState, useEffect } from 'react';
import {
  X,
  Landmark,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { roundTo2Decimals, parseAmountInput, formatAmount } from '../utils/precision';

interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  currentBankBalance: number;
  currentCreditCardDue: number;
  onSaveAdjustedBalances: (targetBankBalance: number, targetCreditCardDue: number) => void;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  isOpen,
  onClose,
  currency,
  currentBankBalance,
  currentCreditCardDue,
  onSaveAdjustedBalances,
}) => {
  const [bankBalanceInput, setBankBalanceInput] = useState<string>('');
  const [creditCardDueInput, setCreditCardDueInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBankBalanceInput(Math.round(currentBankBalance).toString());
      setCreditCardDueInput(Math.round(currentCreditCardDue).toString());
      setError(null);
    }
  }, [isOpen, currentBankBalance, currentCreditCardDue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBank = parseAmountInput(bankBalanceInput);
    const parsedCC = parseAmountInput(creditCardDueInput);

    if (isNaN(parsedBank)) {
      setError('Please enter a valid amount for Bank Balance.');
      return;
    }

    if (isNaN(parsedCC) || parsedCC < 0) {
      setError('Please enter a valid amount (0 or more) for Credit Card Due.');
      return;
    }

    setError(null);
    onSaveAdjustedBalances(roundTo2Decimals(parsedBank), roundTo2Decimals(parsedCC));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Adjust Account Balances
              </h3>
              <p className="text-xs text-slate-500">
                Sync with your real bank statement & credit card
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

          {/* Explanatory note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-xs text-slate-600">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Enter your current balance as shown in your banking app. Your transactions history will remain intact.
            </span>
          </div>

          {/* Bank Balance Field */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-blue-600" />
              <span>Bank Balance Amount</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                {currency}
              </span>
              <input
                id="adjust-bank-balance-input"
                type="number"
                step="any"
                value={bankBalanceInput}
                onChange={(e) => setBankBalanceInput(e.target.value)}
                placeholder="50000"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
            <p className={`text-[11px] mt-1 ${currentBankBalance < 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
              Currently calculated: {currentBankBalance < 0 ? '-' : ''}{currency}{formatAmount(currentBankBalance)}
            </p>
          </div>

          {/* Credit Card Dues Payable Field */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Credit Card Dues Payable</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                {currency}
              </span>
              <input
                id="adjust-cc-due-input"
                type="number"
                step="any"
                min="0"
                value={creditCardDueInput}
                onChange={(e) => setCreditCardDueInput(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Currently calculated: {currency}{formatAmount(currentCreditCardDue)}
            </p>
          </div>

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
              id="confirm-adjust-balance-btn"
              className="flex-2 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Balances</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
