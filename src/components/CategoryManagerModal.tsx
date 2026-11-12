import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tag,
  AlertCircle,
  Palette,
  ArrowLeft,
  Check,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { CategoryInfo, TransactionType } from '../types';
import {
  CategoryIcon,
  AVAILABLE_CATEGORY_ICONS,
  CATEGORY_COLOR_PRESETS,
  CategoryColorPreset,
} from './CategoryIcon';
import { ConfirmModal } from './ConfirmModal';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  categories: CategoryInfo[];
  onAddCategory: (
    name: string,
    type: TransactionType,
    iconName?: string,
    color?: string,
    bgLight?: string
  ) => void;
  onUpdateCategory?: (category: CategoryInfo, oldName?: string) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  type,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newIconName, setNewIconName] = useState<string>(type === 'expense' ? 'Tag' : 'Coins');
  const [newColorPreset, setNewColorPreset] = useState<CategoryColorPreset>(
    type === 'expense' ? CATEGORY_COLOR_PRESETS[8] : CATEGORY_COLOR_PRESETS[1] // rose or emerald
  );
  const [isPickingIconForNew, setIsPickingIconForNew] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryInfo | null>(null);

  // State for editing existing category symbol/color
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [editName, setEditName] = useState('');
  const [editIconName, setEditIconName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editBgLight, setEditBgLight] = useState('');
  const [iconSearchQuery, setIconSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleStartEdit = (cat: CategoryInfo) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditIconName(cat.iconName);
    setEditColor(cat.color);
    setEditBgLight(cat.bgLight);
    setIconSearchQuery('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const trimmed = editName.trim();
    if (!trimmed) {
      setError('Category name cannot be empty.');
      return;
    }

    // Check duplicate name if name changed
    if (trimmed.toLowerCase() !== editingCategory.name.toLowerCase()) {
      const exists = filteredCategories.some(
        (c) => c.id !== editingCategory.id && c.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) {
        setError(`"${trimmed}" already exists.`);
        return;
      }
    }

    const updatedCategory: CategoryInfo = {
      ...editingCategory,
      name: trimmed,
      iconName: editIconName,
      color: editColor,
      bgLight: editBgLight,
    };

    if (onUpdateCategory) {
      onUpdateCategory(updatedCategory, editingCategory.name);
    }

    setSuccessMsg(`Symbol & settings for "${trimmed}" updated!`);
    setEditingCategory(null);
    setError(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setError('Please enter a category name');
      return;
    }

    // Check duplicate
    const exists = filteredCategories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError(`"${trimmed}" already exists.`);
      return;
    }

    onAddCategory(trimmed, type, newIconName, newColorPreset.color, newColorPreset.bgLight);
    setNewCategoryName('');
    setNewIconName(type === 'expense' ? 'Tag' : 'Coins');
    setError(null);
    setSuccessMsg(`Category "${trimmed}" added!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRequestDelete = (cat: CategoryInfo) => {
    if (filteredCategories.length <= 1) {
      setError('You must have at least one category.');
      return;
    }
    setError(null);
    setCategoryToDelete(cat);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
      setError(null);
    }
  };

  // Filtered available icons for search
  const filteredIcons = AVAILABLE_CATEGORY_ICONS.filter((item) =>
    item.label.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(iconSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {editingCategory ? (
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition shrink-0 cursor-pointer mr-1"
                title="Back to categories"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  type === 'expense'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                <Tag className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {editingCategory
                  ? `Customize Symbol: ${editingCategory.name}`
                  : `Manage ${type === 'expense' ? 'Expense' : 'Income'} Categories`}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {editingCategory
                  ? 'Pick any symbol and color theme'
                  : 'Tap any category to change its symbol & color'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-700">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW 1: CUSTOMIZE / EDIT CATEGORY SYMBOL */}
          {editingCategory ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Preview & Name Input */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${editBgLight} shrink-0 shadow-2xs`}>
                    <CategoryIcon name={editIconName} className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Category name"
                    />
                  </div>
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Color Theme
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CATEGORY_COLOR_PRESETS.map((preset) => {
                    const isSelected = editColor === preset.color;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setEditColor(preset.color);
                          setEditBgLight(preset.bgLight);
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                          isSelected ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-xs' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Symbol Selector Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Choose Symbol ({AVAILABLE_CATEGORY_ICONS.length})
                  </label>
                  <span className="text-[11px] text-slate-400">Tap to select</span>
                </div>

                {/* Search Symbols */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={iconSearchQuery}
                    onChange={(e) => setIconSearchQuery(e.target.value)}
                    placeholder="Search symbols (e.g. food, car, gym, pet)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                {/* Grid of icons */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                  {filteredIcons.map((iconItem) => {
                    const isSelected = editIconName === iconItem.name;
                    return (
                      <button
                        key={iconItem.name}
                        type="button"
                        onClick={() => setEditIconName(iconItem.name)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition text-center cursor-pointer ${
                          isSelected
                            ? `${editBgLight} font-bold shadow-xs scale-98`
                            : 'bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-100/80'
                        }`}
                      >
                        <CategoryIcon name={iconItem.name} className="w-5 h-5 mb-1 shrink-0" />
                        <span className="text-[10px] leading-tight truncate w-full">
                          {iconItem.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Symbol</span>
                </button>
              </div>
            </form>
          ) : (
            /* VIEW 2: CATEGORY LIST & ADD NEW FORM */
            <>
              {/* Add Category Form */}
              <form onSubmit={handleAdd} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Add New Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPickingIconForNew(!isPickingIconForNew)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{isPickingIconForNew ? 'Hide symbol picker' : 'Pick symbol & color'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPickingIconForNew(!isPickingIconForNew)}
                    className={`p-2 rounded-xl border ${newColorPreset.bgLight} shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition`}
                    title="Change icon & color for new category"
                  >
                    <CategoryIcon name={newIconName} className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={
                      type === 'expense'
                        ? 'e.g. Pet Care, Subscriptions, Gym'
                        : 'e.g. Rental, Bonus, Dividends'
                    }
                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2.5 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Optional Icon/Color drawer for new category */}
                {isPickingIconForNew && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 mt-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">Choose Color Theme:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_COLOR_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewColorPreset(p)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                            newColorPreset.id === p.id ? 'ring-2 ring-offset-1 ring-slate-900 scale-110' : ''
                          }`}
                          style={{ backgroundColor: p.color }}
                        >
                          {newColorPreset.id === p.id && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">Choose Symbol:</span>
                      <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white border border-slate-200 rounded-lg">
                        {AVAILABLE_CATEGORY_ICONS.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setNewIconName(item.name);
                              setIsPickingIconForNew(false);
                            }}
                            className={`p-1.5 rounded-lg flex flex-col items-center text-center cursor-pointer transition ${
                              newIconName === item.name
                                ? `${newColorPreset.bgLight} font-bold shadow-2xs`
                                : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <CategoryIcon name={item.name} className="w-4 h-4 mb-0.5" />
                            <span className="text-[9px] truncate w-full">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* Existing Categories List */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Existing Categories ({filteredCategories.length})
                  </label>
                  <span className="text-[11px] text-slate-400">Tap category to change symbol</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-emerald-50/40 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition group"
                    >
                      {/* Left: Tap to edit symbol */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                        title={`Change symbol or color for ${cat.name}`}
                      >
                        <div
                          className={`p-2 rounded-xl shrink-0 border ${cat.bgLight} shadow-2xs group-hover:scale-105 transition`}
                        >
                          <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-900 truncate block">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 group-hover:text-emerald-700 flex items-center gap-1">
                            <Palette className="w-3 h-3" />
                            <span>Change symbol & color</span>
                          </span>
                        </div>
                      </button>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-100/60 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          title={`Customize symbol for "${cat.name}"`}
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Change</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestDelete(cat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title={`Delete category "${cat.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition shadow-2xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirm Category Deletion Dialog */}
      <ConfirmModal
        isOpen={categoryToDelete !== null}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? Transactions already recorded in this category will remain intact.`}
        confirmLabel="Delete Category"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
};

