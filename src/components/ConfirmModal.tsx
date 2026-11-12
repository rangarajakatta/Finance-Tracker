import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      style={{ minHeight: '100dvh', width: '100vw' }}
      role="alertdialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150 relative my-auto">
        {/* Top close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3.5 pr-6">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isDestructive
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              id="confirm-modal-cancel-btn"
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              {cancelLabel}
            </button>
            <button
              id="confirm-modal-action-btn"
              type="button"
              onClick={() => {
                onConfirm();
              }}
              className={`flex-1 py-3 px-3 text-xs font-bold text-white rounded-xl transition shadow-xs cursor-pointer min-h-[44px] flex items-center justify-center ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};
