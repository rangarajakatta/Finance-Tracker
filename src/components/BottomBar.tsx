import React from 'react';
import { Plus, Wallet, HandCoins } from 'lucide-react';
import { ActivePage } from '../types';

interface BottomBarProps {
  activePage: ActivePage;
  onAddTransaction: (type?: 'expense' | 'income') => void;
  onAddDue: () => void;
  onPageChange: (page: ActivePage) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  activePage,
  onAddTransaction,
  onAddDue,
  onPageChange,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-2.5 px-6 pb-safe sm:hidden flex justify-between items-center">
      {/* Switch to Cashflow */}
      <button
        type="button"
        onClick={() => onPageChange('cashflow')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition cursor-pointer ${
          activePage === 'cashflow' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl transition ${
            activePage === 'cashflow' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'
          }`}
        >
          <Wallet className="w-4 h-4" />
        </div>
        <span>Cashflow</span>
      </button>

      {/* Center FAB button */}
      <button
        id="mobile-add-btn"
        type="button"
        onClick={() => {
          if (activePage === 'dues') {
            onAddDue();
          } else {
            onAddTransaction();
          }
        }}
        className={`w-13 h-13 -mt-5 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition cursor-pointer text-white ${
          activePage === 'dues'
            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
        }`}
        title={activePage === 'dues' ? 'Track New Due' : 'Add Transaction'}
        aria-label={activePage === 'dues' ? 'Track New Due' : 'Add Transaction'}
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Switch to Dues */}
      <button
        type="button"
        onClick={() => onPageChange('dues')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition cursor-pointer ${
          activePage === 'dues' ? 'text-amber-700' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl transition ${
            activePage === 'dues' ? 'bg-amber-100 text-amber-700' : 'text-slate-400'
          }`}
        >
          <HandCoins className="w-4 h-4" />
        </div>
        <span>Dues</span>
      </button>
    </div>
  );
};

