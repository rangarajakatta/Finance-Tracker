import React from 'react';
import {
  Wallet,
  Database,
  SlidersHorizontal,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { UserSettings, DateRange } from '../types';

interface HeaderProps {
  settings: UserSettings;
  onOpenBudgetModal: () => void;
  onOpenBackupModal: () => void;
  onOpenGuideModal: () => void;
  onOpenDateFilterModal: () => void;
  isDateFilterActive: boolean;
  activeDateRange?: DateRange | null;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenBudgetModal,
  onOpenBackupModal,
  onOpenGuideModal,
  onOpenDateFilterModal,
  isDateFilterActive,
  activeDateRange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shrink-0">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Icon & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            Finance Tracker
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Period Filter (From - To) button */}
          <button
            id="period-filter-header-btn"
            onClick={onOpenDateFilterModal}
            className={`relative p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
              isDateFilterActive
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
            title={
              isDateFilterActive && activeDateRange
                ? `Period Filter Active: ${activeDateRange.startDate} to ${activeDateRange.endDate}. Click to change`
                : 'Filter transactions & dues by period (From - To)'
            }
            aria-label="Filter transactions and dues by period"
          >
            <Filter className="w-4 h-4" />
            {isDateFilterActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white ring-1 ring-emerald-600" />
            )}
          </button>

          {/* Currency / Budget button */}
          <button
            id="settings-currency-btn"
            onClick={onOpenBudgetModal}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title="Adjust currency and monthly budget"
          >
            <span>{settings.currency}</span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Backup / Export button */}
          <button
            id="backup-storage-btn"
            onClick={onOpenBackupModal}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title="Backup to Excel / CSV / JSON"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Beginner Guide button */}
          <button
            id="guide-help-btn"
            onClick={onOpenGuideModal}
            className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition cursor-pointer"
            title="Step-by-step installation and help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
