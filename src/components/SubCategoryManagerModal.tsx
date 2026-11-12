import React, { useState } from 'react';
import { X, Plus, Trash2, Folder, AlertCircle } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface SubCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subCategories: string[];
  onAddSubCategory: (name: string) => void;
  onDeleteSubCategory: (name: string) => void;
}

export const SubCategoryManagerModal: React.FC<SubCategoryManagerModalProps> = ({
  isOpen,
  onClose,
  subCategories,
  onAddSubCategory,
  onDeleteSubCategory,
}) => {
  const [newSubCategory, setNewSubCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubCategory.trim();
    if (!trimmed) {
      setError('Please enter a sub-category name.');
      return;
    }

    const exists = subCategories.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError(`"${trimmed}" already exists.`);
      return;
    }

    onAddSubCategory(trimmed);
    setNewSubCategory('');
    setError(null);
  };

  const handleRequestDelete = (name: string) => {
    if (subCategories.length <= 1) {
      setError('You must have at least one sub-category.');
      return;
    }
    setError(null);
    setSubCategoryToDelete(name);
  };

  const handleConfirmDelete = () => {
    if (subCategoryToDelete) {
      onDeleteSubCategory(subCategoryToDelete);
      setSubCategoryToDelete(null);
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Manage Expense Sub-Categories
              </h3>
              <p className="text-xs text-slate-500">
                Add or delete tags like Personal, Business, etc.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-700">
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Add New Sub-Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubCategory}
                onChange={(e) => {
                  setNewSubCategory(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Side Hustle, Household, Client A"
                className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            {error && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </form>

          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Current Sub-Categories ({subCategories.length})
            </label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {subCategories.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-semibold text-slate-800">
                      {name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRequestDelete(name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title={`Delete sub-category "${name}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirm Sub-Category Deletion Dialog */}
      <ConfirmModal
        isOpen={subCategoryToDelete !== null}
        title="Delete Sub-Category"
        message={`Are you sure you want to delete the "${subCategoryToDelete}" sub-category tag?`}
        confirmLabel="Delete Sub-Category"
        onConfirm={handleConfirmDelete}
        onCancel={() => setSubCategoryToDelete(null)}
      />
    </div>
  );
};
