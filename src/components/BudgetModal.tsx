import React, { useState } from 'react';
import { X, IndianRupee, Target, Bell, Check } from 'lucide-react';
import { UserSettings } from '../types';
import { CURRENCIES } from '../utils/categories';
import { parseAmountInput } from '../utils/precision';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [currency] = useState('₹');
  const [currencyCode] = useState('INR');
  const [monthlyBudget, setMonthlyBudget] = useState(Math.round(settings.monthlyBudget).toString());
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(settings.budgetAlertThreshold);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseAmountInput(monthlyBudget);
    onSaveSettings({
      currency: '₹',
      currencyCode: 'INR',
      monthlyBudget: Math.round(Math.max(0, budgetNum)),
      budgetAlertThreshold,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Budget & Currency</h3>
              <p className="text-xs text-slate-500">Personalize spending targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 text-sm text-slate-700">
          {/* Monthly Budget Limit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Monthly Expense Target ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                {currency}
              </span>
              <input
                id="budget-amount-input"
                type="number"
                step="1"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-base"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Used to calculate remaining allowance and monthly progress bars.
            </p>
          </div>

          {/* Active Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              App Currency
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-200 text-emerald-800 font-black flex items-center justify-center text-sm shadow-2xs">
                  ₹
                </span>
                <div>
                  <div className="font-bold text-slate-900">Indian Rupee (₹ - INR)</div>
                  <div className="text-[11px] text-slate-500 font-normal">Active currency for all views</div>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>
          </div>

          {/* Alert Threshold */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>Budget Warning Alert</span>
              </label>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                {budgetAlertThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={budgetAlertThreshold}
              onChange={(e) => setBudgetAlertThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              Highlights your balance card when monthly expenses cross this mark.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
