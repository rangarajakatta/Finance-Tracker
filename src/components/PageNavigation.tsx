import React from 'react';
import {
  Wallet,
  HandCoins,
  ChevronRight,
  ChevronLeft,
  ArrowLeftRight,
} from 'lucide-react';
import { ActivePage } from '../types';

interface PageNavigationProps {
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  pendingDuesCount: number;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  activePage,
  onPageChange,
  pendingDuesCount,
}) => {
  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-[57px] z-30 px-4 py-2 transition-all shrink-0">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        {/* Tab Buttons Segmented Control */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl w-full border border-slate-200/60 shadow-2xs">
          {/* Tab 1: Income & Expenses */}
          <button
            id="page-tab-cashflow"
            type="button"
            onClick={() => onPageChange('cashflow')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activePage === 'cashflow'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className={`w-4 h-4 ${activePage === 'cashflow' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Income & Expenses</span>
          </button>

          {/* Tab 2: Receivables & Payables */}
          <button
            id="page-tab-dues"
            type="button"
            onClick={() => onPageChange('dues')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer relative ${
              activePage === 'dues'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HandCoins className={`w-4 h-4 ${activePage === 'dues' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Receivables & Payables</span>

            {/* Pending count pill */}
            {pendingDuesCount > 0 && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  activePage === 'dues'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {pendingDuesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Swipe visual indicator / helper text */}
      <div className="max-w-xl mx-auto flex items-center justify-between pt-1 px-1 text-[10px] text-slate-400 font-medium">
        <div className="flex items-center gap-1">
          {activePage === 'dues' ? (
            <button
              onClick={() => onPageChange('cashflow')}
              className="flex items-center gap-0.5 hover:text-slate-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Swipe right for Cashflow</span>
            </button>
          ) : (
            <span className="text-emerald-700/80 font-semibold">Page 1: Cashflow</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Pagination dots */}
          <div className="flex items-center gap-1">
            <span
              onClick={() => onPageChange('cashflow')}
              className={`w-2 h-1.5 rounded-full transition-all cursor-pointer ${
                activePage === 'cashflow' ? 'w-4 bg-emerald-600' : 'bg-slate-300'
              }`}
            />
            <span
              onClick={() => onPageChange('dues')}
              className={`w-2 h-1.5 rounded-full transition-all cursor-pointer ${
                activePage === 'dues' ? 'w-4 bg-amber-600' : 'bg-slate-300'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 justify-end">
          {activePage === 'cashflow' ? (
            <button
              onClick={() => onPageChange('dues')}
              className="flex items-center gap-0.5 hover:text-slate-600 transition cursor-pointer"
            >
              <span>Swipe left for Dues</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-amber-700/80 font-semibold">Page 2: Dues & Liabilities</span>
          )}
        </div>
      </div>
    </div>
  );
};
