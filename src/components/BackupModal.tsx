import React, { useRef, useState } from 'react';
import {
  X,
  Database,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Loader2,
  Share2,
  FileText,
  HandCoins,
} from 'lucide-react';
import { Transaction, UserSettings, CategoryInfo, DueRecord } from '../types';
import {
  exportTransactionsCSV,
  exportDuesCSV,
  exportFullBackupJSON,
  formatTransactionsToCSV,
  formatDuesToCSV,
  formatFullBackupJSON,
  generateSampleData,
  generateSampleDues,
} from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  settings: UserSettings;
  categories?: CategoryInfo[];
  subCategories?: string[];
  dues?: DueRecord[];
  onUpdateTransactions: (transactions: Transaction[]) => void;
  onUpdateSettings: (settings: UserSettings) => void;
  onUpdateCategories?: (categories: CategoryInfo[]) => void;
  onUpdateSubCategories?: (subCategories: string[]) => void;
  onUpdateDues?: (dues: DueRecord[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  transactions,
  settings,
  categories,
  subCategories,
  dues = [],
  onUpdateTransactions,
  onUpdateSettings,
  onUpdateCategories,
  onUpdateSubCategories,
  onUpdateDues,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState<'csv' | 'dues_csv' | 'json' | null>(null);
  const [copiedType, setCopiedType] = useState<'csv' | 'dues_csv' | 'json' | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isLoadSampleModalOpen, setIsLoadSampleModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  if (!isOpen) return null;

  const handleExportCSV = async () => {
    if (transactions.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No transactions to export yet.' });
      return;
    }
    setIsExporting('csv');
    try {
      const res = await exportTransactionsCSV(transactions);
      setFeedbackMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Failed to export CSV file.',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDuesCSV = async () => {
    if (dues.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No dues or payables to export yet.' });
      return;
    }
    setIsExporting('dues_csv');
    try {
      const res = await exportDuesCSV(dues);
      setFeedbackMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Failed to export Dues CSV file.',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting('json');
    try {
      const res = await exportFullBackupJSON(transactions, settings, categories, subCategories, dues);
      setFeedbackMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Failed to export JSON backup.',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleCopyCSV = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transactions.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No transactions to copy.' });
      return;
    }
    try {
      const csv = formatTransactionsToCSV(transactions);
      await navigator.clipboard.writeText(csv);
      setCopiedType('csv');
      setFeedbackMsg({ type: 'success', text: 'Transactions CSV copied to clipboard!' });
      setTimeout(() => setCopiedType(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Could not copy to clipboard.' });
    }
  };

  const handleCopyDuesCSV = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dues.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No dues to copy.' });
      return;
    }
    try {
      const csv = formatDuesToCSV(dues);
      await navigator.clipboard.writeText(csv);
      setCopiedType('dues_csv');
      setFeedbackMsg({ type: 'success', text: 'Dues & Payables CSV copied to clipboard!' });
      setTimeout(() => setCopiedType(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Could not copy to clipboard.' });
    }
  };

  const handleCopyJSON = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const json = formatFullBackupJSON(transactions, settings, categories, subCategories, dues);
      await navigator.clipboard.writeText(json);
      setCopiedType('json');
      setFeedbackMsg({ type: 'success', text: 'Full JSON backup copied to clipboard!' });
      setTimeout(() => setCopiedType(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Could not copy to clipboard.' });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          // Direct transactions array
          onUpdateTransactions(parsed);
          setFeedbackMsg({ type: 'success', text: `Successfully restored ${parsed.length} transactions!` });
        } else if (parsed && Array.isArray(parsed.transactions)) {
          // Full export object
          onUpdateTransactions(parsed.transactions);
          if (parsed.settings) {
            onUpdateSettings(parsed.settings);
          }
          if (Array.isArray(parsed.categories) && onUpdateCategories) {
            onUpdateCategories(parsed.categories);
          }
          if (Array.isArray(parsed.subCategories) && onUpdateSubCategories) {
            onUpdateSubCategories(parsed.subCategories);
          }
          if (Array.isArray(parsed.dues) && onUpdateDues) {
            onUpdateDues(parsed.dues);
          }
          setFeedbackMsg({
            type: 'success',
            text: `Restored ${parsed.transactions.length} transactions, ${
              parsed.dues ? parsed.dues.length : 0
            } dues, categories, and settings!`,
          });
        } else {
          setFeedbackMsg({ type: 'error', text: 'Invalid backup file format.' });
        }
      } catch (err) {
        setFeedbackMsg({ type: 'error', text: 'Failed to read backup file. Please check the file.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestoreFromPaste = () => {
    try {
      if (!pasteText.trim()) {
        setFeedbackMsg({ type: 'error', text: 'Please paste the backup JSON content.' });
        return;
      }
      const parsed = JSON.parse(pasteText.trim());
      if (Array.isArray(parsed)) {
        onUpdateTransactions(parsed);
        setFeedbackMsg({ type: 'success', text: `Successfully restored ${parsed.length} transactions!` });
        setIsPasteModalOpen(false);
        setPasteText('');
      } else if (parsed && Array.isArray(parsed.transactions)) {
        onUpdateTransactions(parsed.transactions);
        if (parsed.settings) onUpdateSettings(parsed.settings);
        if (Array.isArray(parsed.categories) && onUpdateCategories) onUpdateCategories(parsed.categories);
        if (Array.isArray(parsed.subCategories) && onUpdateSubCategories) onUpdateSubCategories(parsed.subCategories);
        if (Array.isArray(parsed.dues) && onUpdateDues) onUpdateDues(parsed.dues);
        setFeedbackMsg({
          type: 'success',
          text: `Restored ${parsed.transactions.length} transactions, ${
            parsed.dues ? parsed.dues.length : 0
          } dues, and settings!`,
        });
        setIsPasteModalOpen(false);
        setPasteText('');
      } else {
        setFeedbackMsg({ type: 'error', text: 'Invalid JSON format. Expected backup data.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Invalid JSON syntax. Please check the pasted text.' });
    }
  };

  const handleConfirmLoadSample = () => {
    const sample = generateSampleData();
    onUpdateTransactions(sample);
    if (onUpdateDues) {
      const sampleDues = generateSampleDues();
      onUpdateDues(sampleDues);
    }
    setFeedbackMsg({ type: 'success', text: 'Starter sample transactions and dues loaded!' });
    setIsLoadSampleModalOpen(false);
  };

  const handleConfirmClearAll = () => {
    onUpdateTransactions([]);
    if (onUpdateDues) {
      onUpdateDues([]);
    }
    setFeedbackMsg({ type: 'success', text: 'All transaction and dues history cleared.' });
    setIsClearModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Backup & Storage</h3>
              <p className="text-xs text-slate-500">100% offline & local data management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-slate-700 overflow-y-auto">
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{feedbackMsg.text}</span>
            </div>
          )}

          {/* Stored Counts Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Transactions:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                {transactions.length}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Dues & Debts:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                {dues.length}
              </span>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Export & Download</p>
              <span className="text-[11px] text-slate-400">Save to device or share</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Transactions CSV Card */}
              <div className="flex flex-col justify-between p-3 bg-white border border-slate-200 hover:border-emerald-400 rounded-xl transition shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCSV}
                      title="Copy CSV text to clipboard"
                      className="text-[10px] font-medium text-slate-500 hover:text-emerald-700 px-1.5 py-0.5 rounded hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedType === 'csv' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedType === 'csv' ? 'Done' : 'Copy'}</span>
                    </button>
                  </div>
                  <span className="font-semibold text-xs text-slate-900 block">Cashflow CSV</span>
                  <span className="text-[10px] text-slate-500 block mb-2.5">Income & Expenses</span>
                </div>

                <button
                  type="button"
                  disabled={isExporting === 'csv'}
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isExporting === 'csv' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Export</span>
                </button>
              </div>

              {/* Dues CSV Card */}
              <div className="flex flex-col justify-between p-3 bg-white border border-slate-200 hover:border-amber-400 rounded-xl transition shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                      <HandCoins className="w-3.5 h-3.5" />
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDuesCSV}
                      title="Copy Dues CSV text to clipboard"
                      className="text-[10px] font-medium text-slate-500 hover:text-amber-700 px-1.5 py-0.5 rounded hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedType === 'dues_csv' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedType === 'dues_csv' ? 'Done' : 'Copy'}</span>
                    </button>
                  </div>
                  <span className="font-semibold text-xs text-slate-900 block">Dues CSV</span>
                  <span className="text-[10px] text-slate-500 block mb-2.5">Receivables & Debts</span>
                </div>

                <button
                  type="button"
                  disabled={isExporting === 'dues_csv'}
                  onClick={handleExportDuesCSV}
                  className="w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isExporting === 'dues_csv' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* JSON Full Backup (Includes everything: transactions, dues, settings, categories) */}
            <div className="p-3 bg-white border border-slate-200 hover:border-sky-400 rounded-xl transition shadow-2xs flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="p-1 bg-sky-100 text-sky-700 rounded-md">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-slate-900">Complete JSON Backup</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Includes transactions, dues, categories, and settings
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  title="Copy JSON text to clipboard"
                  className="p-1.5 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  {copiedType === 'json' ? (
                    <Check className="w-4 h-4 text-sky-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  id="backup-export-json-btn"
                  type="button"
                  disabled={isExporting === 'json'}
                  onClick={handleExportJSON}
                  className="flex items-center gap-1 py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isExporting === 'json' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save / Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Restore & Manage */}
          <div className="space-y-2 pt-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Restore & Manage</p>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json,text/plain,*/*"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-xs font-medium text-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Restore from JSON File</span>
                </div>
                <span className="text-[11px] text-slate-400">Choose file</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPasteModalOpen(true)}
                className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-xs font-medium text-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Restore from Pasted JSON Text</span>
                </div>
                <span className="text-[11px] text-slate-400">Paste text</span>
              </button>

              <button
                id="backup-load-sample-btn"
                type="button"
                onClick={() => setIsLoadSampleModalOpen(true)}
                className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-xs font-medium text-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 text-sky-600" />
                  <span>Load Starter Sample Data</span>
                </div>
                <span className="text-[11px] text-slate-400">Transactions & Dues</span>
              </button>

              <button
                id="backup-clear-all-btn"
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="w-full flex items-center justify-between p-3 border border-rose-200 rounded-xl hover:bg-rose-50 text-xs font-medium text-rose-700 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Clear All Data</span>
                </div>
                <span className="text-[11px] text-rose-500">Reset</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing All Data */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear All Data"
        message="Are you sure you want to delete all recorded transactions and dues? This action will completely erase your local history and cannot be undone unless you have downloaded a backup."
        confirmLabel="Clear All Data"
        isDestructive={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Confirmation Modal for Loading Sample Data */}
      <ConfirmModal
        isOpen={isLoadSampleModalOpen}
        title="Load Starter Sample Data"
        message="Replace current records with realistic starter sample transactions and dues? You can export your current data first if you want to keep it."
        confirmLabel="Load Sample Data"
        isDestructive={false}
        onConfirm={handleConfirmLoadSample}
        onCancel={() => setIsLoadSampleModalOpen(false)}
      />

      {/* Modal for Pasting JSON text directly */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Paste Backup JSON</h4>
              <button
                type="button"
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPasteText('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Paste the text content from a previously copied or saved JSON backup below:
            </p>
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste JSON content here..."
              className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPasteText('');
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestoreFromPaste}
                disabled={!pasteText.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-2xs"
              >
                Restore Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

