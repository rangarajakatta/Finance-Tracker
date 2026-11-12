import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  X,
} from 'lucide-react';
import {
  Transaction,
  FilterPeriod,
  UserSettings,
  CategoryInfo,
  TransactionType,
  DueRecord,
  DueType,
  PaymentEntry,
  ActivePage,
  DueFilterType,
  PaymentMethod,
  AccountFilter,
  TxTypeFilter,
  DateRange,
} from './types';
import {
  loadTransactions,
  saveTransactions,
  loadSettings,
  saveSettings,
  loadNativeTransactions,
  loadNativeSettings,
  loadDues,
  saveDues,
  loadNativeDues,
} from './utils/storage';
import {
  loadStoredCategories,
  saveStoredCategories,
  loadStoredSubCategories,
  saveStoredSubCategories,
  loadNativeCategories,
  loadNativeSubCategories,
} from './utils/categories';
import { roundTo2Decimals, calculateRemaining } from './utils/precision';
import { Header } from './components/Header';
import { PageNavigation } from './components/PageNavigation';
import { BalanceCard } from './components/BalanceCard';
import { AccountBalanceCard } from './components/AccountBalanceCard';
import { CategoryInsights } from './components/CategoryInsights';
import { TransactionList } from './components/TransactionList';
import { DuesOverviewCard } from './components/DuesOverviewCard';
import { DuesList } from './components/DuesList';
import { TransactionModal } from './components/TransactionModal';
import { DueModal } from './components/DueModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { PayCreditCardModal } from './components/PayCreditCardModal';
import { AdjustBalanceModal } from './components/AdjustBalanceModal';
import { BudgetModal } from './components/BudgetModal';
import { BackupModal } from './components/BackupModal';
import { GuideModal } from './components/GuideModal';
import { DateRangeFilterModal } from './components/DateRangeFilterModal';
import { PersonDetailView } from './components/PersonDetailView';
import { BottomBar } from './components/BottomBar';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [dues, setDues] = useState<DueRecord[]>(() => loadDues());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [categories, setCategories] = useState<CategoryInfo[]>(() => loadStoredCategories());
  const [subCategories, setSubCategories] = useState<string[]>(() => loadStoredSubCategories());
  const [period, setPeriod] = useState<FilterPeriod>('month');
  const [activePage, setActivePage] = useState<ActivePage>('cashflow');
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<TxTypeFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);

  // Modals state for transactions
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Modals state for dues (receivables & payables)
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [editingDue, setEditingDue] = useState<DueRecord | null>(null);
  const [dueModalDefaultType, setDueModalDefaultType] = useState<DueType>('receivable');
  const [dueModalDefaultPerson, setDueModalDefaultPerson] = useState<string>('');
  const [dueTypeFilter, setDueTypeFilter] = useState<DueFilterType>('all');
  const [selectedPersonForReport, setSelectedPersonForReport] = useState<string | null>(null);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [activeDueForPayment, setActiveDueForPayment] = useState<DueRecord | null>(null);

  // Filter dues based on custom date range if selected
  const filteredDues = useMemo(() => {
    if (!customDateRange) return dues;
    const { startDate, endDate } = customDateRange;
    return dues.filter((d) => {
      const inStart = Boolean(d.startDate && d.startDate >= startDate && d.startDate <= endDate);
      const inDue = Boolean(d.dueDate && d.dueDate >= startDate && d.dueDate <= endDate);
      const inSettled = Boolean(d.settledDate && d.settledDate >= startDate && d.settledDate <= endDate);
      const inPayments = Boolean(
        d.paymentHistory && d.paymentHistory.some((p) => p.date >= startDate && p.date <= endDate)
      );
      const createdStr = d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '';
      const inCreated = Boolean(createdStr && createdStr >= startDate && createdStr <= endDate);
      return inStart || inDue || inSettled || inPayments || inCreated;
    });
  }, [dues, customDateRange]);

  // Filter dues for individual person full-page detailed report
  const selectedPersonDues = useMemo(() => {
    if (!selectedPersonForReport) return [];
    const target = selectedPersonForReport.trim().toLowerCase();
    return filteredDues.filter(
      (d) =>
        (d.personName || '').trim().toLowerCase() === target ||
        d.personOrEntity.trim().toLowerCase() === target
    );
  }, [filteredDues, selectedPersonForReport]);

  // Other modals
  const [isPayCreditCardModalOpen, setIsPayCreditCardModalOpen] = useState(false);
  const [isAdjustBalanceModalOpen, setIsAdjustBalanceModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Carousel container reference for native smooth swiping & programmatic navigation
  const carouselRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Keep carousel horizontal scroll position aligned on window resize or orientation change
  useEffect(() => {
    const handleResize = () => {
      if (!carouselRef.current) return;
      const width = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: activePage === 'dues' ? width : 0,
        behavior: 'instant' as ScrollBehavior,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activePage]);

  // Hydrate from native device storage (Capacitor Preferences on Android / iOS)
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromNativeStorage() {
      try {
        const [nativeTx, nativeDues, nativeSet, nativeCat, nativeSub] = await Promise.all([
          loadNativeTransactions(),
          loadNativeDues(),
          loadNativeSettings(),
          loadNativeCategories(),
          loadNativeSubCategories(),
        ]);
        if (!isMounted) return;
        if (nativeTx && Array.isArray(nativeTx) && nativeTx.length > 0) {
          setTransactions(nativeTx);
        }
        if (nativeDues && Array.isArray(nativeDues) && nativeDues.length > 0) {
          setDues(nativeDues);
        }
        if (nativeSet) {
          setSettings(nativeSet);
        }
        if (nativeCat && Array.isArray(nativeCat) && nativeCat.length > 0) {
          setCategories(nativeCat);
        }
        if (nativeSub && Array.isArray(nativeSub) && nativeSub.length > 0) {
          setSubCategories(nativeSub);
        }
      } catch (err) {
        console.warn('Hydration from native storage:', err);
      }
    }
    hydrateFromNativeStorage();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state with native device storage and localStorage
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveDues(dues);
  }, [dues]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveStoredSubCategories(subCategories);
  }, [subCategories]);

  // Date boundaries for filtering
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  // Start of current week (Monday start)
  const startOfWeek = useMemo(() => {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter transactions based on selected period or custom date range
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (customDateRange) {
        const { startDate, endDate } = customDateRange;
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return true;
      }
      if (period === 'today') {
        return t.date === todayStr;
      }
      if (period === 'week') {
        return t.date >= startOfWeek && t.date <= todayStr;
      }
      if (period === 'month') {
        return t.date.startsWith(currentMonthStr);
      }
      return true; // 'all'
    });
  }, [transactions, customDateRange, period, todayStr, startOfWeek, currentMonthStr]);

  // Helper to reliably identify credit card bill payments across records
  const isCreditCardBillPayment = (t: Transaction): boolean => {
    return Boolean(
      t.isCreditCardPayment ||
      t.category === 'Credit Card Payment' ||
      (t.id && String(t.id).startsWith('tx-ccpay-')) ||
      (t.note && String(t.note).toLowerCase().includes('credit card bill payment'))
    );
  };

  // Filter period transactions by Account Filter (Bank Balance vs Credit Card Due)
  // Requirement 1: In Bank Filter, credit card Bill payment transactions should not be included.
  // Requirement 2: In Credit Card Transactions filter, credit card bill payments are treated as Card income.
  const accountTransactions = useMemo(() => {
    const list: Transaction[] = [];

    periodTransactions.forEach((t) => {
      const isCCPay = isCreditCardBillPayment(t);

      if (accountFilter === 'bank') {
        // Requirement 1: Only when the Bank filter is selected on the top:
        // In the Balance Card, consider credit card payments as well for calculating total Expenses and Net Balance and also for Expense Breakdown as well.
        if (isCCPay) {
          if (t.paymentMethod === 'bank' || !t.paymentMethod) {
            list.push({
              ...t,
              type: 'expense',
              category: t.category || 'Credit Card Payment',
              note: t.note || 'Credit Card bill payment from Bank',
            });
          }
          return;
        }

        // Transactions paid or received through bank:
        if (t.type === 'income') {
          if (t.paymentMethod !== 'credit_card') {
            list.push(t);
          }
        } else if (t.type === 'expense') {
          if (t.paymentMethod === 'bank' || !t.paymentMethod) {
            list.push(t);
          }
        }
        return;
      }

      if (accountFilter === 'credit_card') {
        // Requirement 2: credit card bill payments amount should be treated as Card income
        if (isCCPay) {
          list.push({
            ...t,
            type: 'income',
            category: t.category || 'Credit Card Payment',
            note: t.note || 'Credit Card bill payment from Bank',
          });
          return;
        }

        // Transactions paid through credit card:
        if (t.paymentMethod === 'credit_card') {
          list.push(t);
        }
        return;
      }

      // accountFilter === 'all'
      list.push(t);
    });

    return list;
  }, [periodTransactions, accountFilter]);

  // Financial calculations for active period & account filter (before type filtering, so split cards show full totals)
  const totalIncome = useMemo(() => {
    return accountTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [accountTransactions]);

  const totalExpense = useMemo(() => {
    return accountTransactions
      .filter((t) => {
        const isCCPay = isCreditCardBillPayment(t);
        if (t.type !== 'expense') return false;
        // When Bank filter is selected, credit card bill payments from bank count as expenses
        if (accountFilter === 'bank') return true;
        // When 'all' or 'credit_card' filter is selected, CC bill payments are not counted as an expense (avoiding double-counting)
        return !isCCPay;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [accountTransactions, accountFilter]);

  const netBalance = totalIncome - totalExpense;

  // Monthly expense for budget tracking (matching active account filter)
  const monthlyExpense = useMemo(() => {
    return transactions
      .filter((t) => {
        const isCCPay = isCreditCardBillPayment(t);
        if (t.type !== 'expense') return false;
        if (!t.date.startsWith(currentMonthStr)) return false;
        if (accountFilter === 'bank') {
          // When Bank filter is selected, credit card bill payments from bank count towards bank monthly expenses
          if (isCCPay) return t.paymentMethod === 'bank' || !t.paymentMethod;
          return t.paymentMethod === 'bank' || !t.paymentMethod;
        }
        if (isCCPay) return false;
        if (accountFilter === 'credit_card') return t.paymentMethod === 'credit_card';
        return true;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonthStr, accountFilter]);

  // Bank Balance and Credit Card Due calculations across all transactions
  const { bankBalance, creditCardDue, allIncome, allBankExpenses, allCCExpenses, allCCPayments } = useMemo(() => {
    const initialBank = settings.initialBankBalance ?? 50000;
    const initialCC = settings.initialCreditCardDue ?? 0;

    let incomeTotal = 0;
    let bankExpenseTotal = 0;
    let ccExpenseTotal = 0;
    let ccPaymentTotal = 0;

    transactions.forEach((t) => {
      if (t.type === 'income') {
        incomeTotal += t.amount;
      } else if (t.type === 'expense') {
        if (t.isCreditCardPayment) {
          // Payment of credit card bill made from bank:
          // reduces bank balance, and reduces credit card due
          ccPaymentTotal += t.amount;
          bankExpenseTotal += t.amount;
        } else if (t.paymentMethod === 'credit_card') {
          // Expense paid via credit card:
          // increases credit card due, does not deduct from bank
          ccExpenseTotal += t.amount;
        } else {
          // Expense paid from bank (default):
          // deducts directly from bank balance
          bankExpenseTotal += t.amount;
        }
      }
    });

    const computedBank = roundTo2Decimals(initialBank + incomeTotal - bankExpenseTotal);
    const computedCC = Math.max(0, roundTo2Decimals(initialCC + ccExpenseTotal - ccPaymentTotal));

    return {
      bankBalance: computedBank,
      creditCardDue: computedCC,
      allIncome: incomeTotal,
      allBankExpenses: bankExpenseTotal,
      allCCExpenses: ccExpenseTotal,
      allCCPayments: ccPaymentTotal,
    };
  }, [transactions, settings.initialBankBalance, settings.initialCreditCardDue]);

  // Pending dues count (for page badge)
  const pendingDuesCount = useMemo(() => {
    return filteredDues.filter((d) => {
      const remaining = calculateRemaining(d.totalAmount, d.paidAmount || 0);
      return d.status !== 'settled' && remaining > 0.001;
    }).length;
  }, [filteredDues]);

  // Transaction CRUD handlers
  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt'>,
    id?: string
  ) => {
    const cleanAmount = roundTo2Decimals(data.amount);
    if (id) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...data, amount: cleanAmount }
            : t
        )
      );
    } else {
      const newRecord: Transaction = {
        ...data,
        amount: cleanAmount,
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newRecord, ...prev]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx && tx.linkedDueId) {
      // Automatic Synchronization: If a transaction linked to a due is deleted from Income & Expenses,
      // revert it in Dues (restore the amount as due) and remove the payment from paymentHistory.
      setDues((prevDues) =>
        prevDues.map((d) => {
          if (d.id !== tx.linkedDueId) return d;

          const updatedHistory = (d.paymentHistory || []).filter((p) => {
            if (tx.linkedPaymentId && p.id === tx.linkedPaymentId) return false;
            if (p.linkedTransactionId && p.linkedTransactionId === tx.id) return false;
            return true;
          });

          const newPaid = roundTo2Decimals(updatedHistory.reduce((sum, p) => sum + p.amount, 0));
          const isSettled = newPaid >= d.totalAmount - 0.001 && d.totalAmount > 0;
          const isPartly = newPaid > 0 && newPaid < d.totalAmount - 0.001;
          const newStatus: DueRecord['status'] = isSettled
            ? 'settled'
            : isPartly
            ? 'partly_due'
            : 'due';

          return {
            ...d,
            paidAmount: newPaid,
            status: newStatus,
            settledDate: isSettled ? d.settledDate : undefined,
            paymentHistory: updatedHistory,
          };
        })
      );
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Pay Credit Card Due from Bank handler:
  // Automatically logs an expense transaction paid from bank, reducing both bank balance and credit card due
  // Note: Marked as isCreditCardPayment so it does NOT double count in expenses or breakdown
  const handlePayCreditCard = (amount: number, date: string, note?: string) => {
    const cleanAmount = roundTo2Decimals(amount);
    if (cleanAmount <= 0) return;

    const paymentTxId = 'tx-ccpay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newTx: Transaction = {
      id: paymentTxId,
      type: 'expense',
      amount: cleanAmount,
      category: 'Credit Card Payment',
      subCategory: undefined,
      paymentMethod: 'bank',
      isCreditCardPayment: true,
      date: date || new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      note: note || 'Credit Card bill payment from Bank',
      createdAt: Date.now(),
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  // Adjust Bank Balance & Starting Credit Card Due handler
  const handleSaveAdjustedBalances = (targetBank: number, targetCC: number) => {
    const newInitialBank = roundTo2Decimals(targetBank - (allIncome - allBankExpenses));
    const newInitialCC = roundTo2Decimals(targetCC - (allCCExpenses - allCCPayments));

    setSettings((prev) => ({
      ...prev,
      initialBankBalance: newInitialBank,
      initialCreditCardDue: Math.max(0, newInitialCC),
    }));
  };

  const handleOpenAddTransaction = (type?: 'expense' | 'income') => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  // Due CRUD handlers
  const handleOpenAddDue = (type: DueType = 'receivable', personName: string = '') => {
    setEditingDue(null);
    setDueModalDefaultType(type);
    setDueModalDefaultPerson(personName);
    setIsDueModalOpen(true);
  };

  const handleOpenEditDue = (due: DueRecord) => {
    setEditingDue(due);
    setDueModalDefaultType(due.type);
    setDueModalDefaultPerson(due.personName || due.personOrEntity);
    setIsDueModalOpen(true);
  };

  const handleSaveDue = (
    data: Omit<DueRecord, 'id' | 'createdAt'>,
    id?: string
  ) => {
    const totalAmount = roundTo2Decimals(data.totalAmount);
    const paidAmount = roundTo2Decimals(data.paidAmount || 0);
    const isZeroPaid = paidAmount <= 0;
    const isSettled = paidAmount >= totalAmount - 0.001 && totalAmount > 0;
    const isPartly = paidAmount > 0 && paidAmount < totalAmount - 0.001;
    const computedStatus: DueRecord['status'] = isSettled
      ? 'settled'
      : isPartly
      ? 'partly_due'
      : 'due';

    const cleanData: Omit<DueRecord, 'id' | 'createdAt'> = {
      ...data,
      totalAmount,
      paidAmount: isZeroPaid ? 0 : paidAmount,
      status: computedStatus,
      // If paid amount is 0 or marked as 0, wipe payment history completely
      paymentHistory: isZeroPaid
        ? []
        : (data.paymentHistory || []).filter((p) => p.amount > 0),
    };

    if (id) {
      setDues((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, ...cleanData }
            : d
        )
      );
    } else {
      const newDue: DueRecord = {
        ...cleanData,
        id: 'due-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        createdAt: Date.now(),
      };
      setDues((prev) => [newDue, ...prev]);
    }
  };

  const handleDeleteDue = (id: string) => {
    // Delete due and any linked transactions
    setTransactions((prev) => prev.filter((t) => t.linkedDueId !== id));
    setDues((prev) => prev.filter((d) => d.id !== id));
  };

  const handleOpenRecordPayment = (due: DueRecord) => {
    setActiveDueForPayment(due);
    setIsRecordPaymentModalOpen(true);
  };

  const handleRecordPayment = (
    dueId: string,
    paymentAmount: number,
    paymentDate: string,
    paymentNote?: string,
    syncAsTransaction?: boolean,
    syncCategory?: string,
    syncSubCategory?: string,
    paymentMethod?: PaymentMethod
  ) => {
    const targetDue = dues.find((d) => d.id === dueId);
    if (!targetDue) return;

    const safeAmount = roundTo2Decimals(paymentAmount);
    const paymentId = 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    const transactionId =
      syncAsTransaction && safeAmount > 0
        ? 'tx-sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5)
        : undefined;

    const newPaidAmount = roundTo2Decimals((targetDue.paidAmount || 0) + safeAmount);
    const isNowSettled = newPaidAmount >= targetDue.totalAmount - 0.001;
    const newStatus = isNowSettled ? 'settled' : newPaidAmount > 0 ? 'partly_due' : 'due';

    const paymentEntry: PaymentEntry = {
      id: paymentId,
      amount: safeAmount,
      date: paymentDate,
      note: paymentNote,
      createdAt: Date.now(),
      linkedTransactionId: transactionId,
    };

    setDues((prev) =>
      prev.map((d) => {
        if (d.id !== dueId) return d;
        const history = d.paymentHistory ? [...d.paymentHistory, paymentEntry] : [paymentEntry];
        return {
          ...d,
          paidAmount: newPaidAmount,
          status: newStatus,
          settledDate: isNowSettled ? paymentDate : d.settledDate,
          paymentHistory: history,
        };
      })
    );

    // Synchronize this payment into transactions ledger with the selected category
    if (syncAsTransaction && paymentAmount > 0 && transactionId) {
      const isReceivable = targetDue.type === 'receivable';
      const personLabel = targetDue.personName || targetDue.personOrEntity;
      const orgLabel = targetDue.organization ? ` (${targetDue.organization})` : '';

      const isCCPayment = !isReceivable && (
        targetDue.personOrEntity.toLowerCase().includes('credit card') ||
        (targetDue.personName || '').toLowerCase().includes('credit card') ||
        targetDue.purpose.toLowerCase().includes('credit card')
      );

      const syncRecord: Transaction = {
        id: transactionId,
        type: isReceivable ? 'income' : 'expense',
        amount: paymentAmount,
        category: syncCategory || (isReceivable ? 'Salary' : 'Bills'),
        subCategory: syncSubCategory || 'Personal',
        paymentMethod: isReceivable ? 'bank' : (paymentMethod || 'bank'),
        isCreditCardPayment: isCCPayment,
        date: paymentDate,
        time: new Date().toTimeString().substring(0, 5),
        note: `${isReceivable ? 'Receipt from' : 'Payment to'} ${personLabel}${orgLabel}: ${targetDue.purpose}${
          paymentNote ? ` (${paymentNote})` : ''
        }`,
        createdAt: Date.now(),
        linkedDueId: dueId,
        linkedPaymentId: paymentId,
      };
      setTransactions((prev) => [syncRecord, ...prev]);
    }
  };

  // Payment log editing and deleting handlers
  const handleUpdatePaymentLog = (
    dueId: string,
    paymentId: string,
    updatedAmount: number,
    updatedDate: string,
    updatedNote?: string
  ) => {
    let linkedTxId: string | undefined;
    const safeUpdatedAmount = roundTo2Decimals(updatedAmount);

    setDues((prevDues) =>
      prevDues.map((d) => {
        if (d.id !== dueId) return d;

        const updatedHistory = (d.paymentHistory || []).map((p) => {
          if (p.id !== paymentId) return p;
          if (p.linkedTransactionId) linkedTxId = p.linkedTransactionId;
          return {
            ...p,
            amount: safeUpdatedAmount,
            date: updatedDate,
            note: updatedNote,
          };
        });

        const newPaid = roundTo2Decimals(updatedHistory.reduce((sum, p) => sum + p.amount, 0));
        const isSettled = newPaid >= d.totalAmount - 0.001 && d.totalAmount > 0;
        const isPartly = newPaid > 0 && newPaid < d.totalAmount - 0.001;
        const newStatus: DueRecord['status'] = isSettled
          ? 'settled'
          : isPartly
          ? 'partly_due'
          : 'due';

        return {
          ...d,
          paidAmount: newPaid,
          status: newStatus,
          settledDate: isSettled ? updatedDate : undefined,
          paymentHistory: updatedHistory,
        };
      })
    );

    // Sync update to transaction if it was synced
    setTransactions((prev) =>
      prev.map((t) => {
        if (
          (linkedTxId && t.id === linkedTxId) ||
          (t.linkedPaymentId && t.linkedPaymentId === paymentId)
        ) {
          return {
            ...t,
            amount: safeUpdatedAmount,
            date: updatedDate,
            note: updatedNote || t.note,
          };
        }
        return t;
      })
    );
  };

  const handleDeletePaymentLog = (dueId: string, paymentId: string) => {
    let linkedTxId: string | undefined;

    setDues((prevDues) =>
      prevDues.map((d) => {
        if (d.id !== dueId) return d;

        const target = (d.paymentHistory || []).find((p) => p.id === paymentId);
        if (target?.linkedTransactionId) linkedTxId = target.linkedTransactionId;

        const updatedHistory = (d.paymentHistory || []).filter((p) => p.id !== paymentId);
        const newPaid = roundTo2Decimals(updatedHistory.reduce((sum, p) => sum + p.amount, 0));
        const isSettled = newPaid >= d.totalAmount - 0.001 && d.totalAmount > 0;
        const isPartly = newPaid > 0 && newPaid < d.totalAmount - 0.001;
        const newStatus: DueRecord['status'] = isSettled
          ? 'settled'
          : isPartly
          ? 'partly_due'
          : 'due';

        return {
          ...d,
          paidAmount: newPaid,
          status: newStatus,
          settledDate: isSettled ? d.settledDate : undefined,
          paymentHistory: updatedHistory,
        };
      })
    );

    // Also delete any synced transaction from Income & Expenses
    setTransactions((prev) =>
      prev.filter((t) => {
        if (linkedTxId && t.id === linkedTxId) return false;
        if (t.linkedPaymentId && t.linkedPaymentId === paymentId) return false;
        return true;
      })
    );
  };

  // Category and SubCategory management handlers
  const handleAddCategory = (
    name: string,
    type: TransactionType,
    iconName?: string,
    color?: string,
    bgLight?: string
  ) => {
    const newCat: CategoryInfo = {
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name,
      type,
      iconName: iconName || (type === 'expense' ? 'Tag' : 'Coins'),
      color: color || (type === 'expense' ? '#e11d48' : '#059669'),
      bgLight:
        bgLight ||
        (type === 'expense'
          ? 'bg-rose-50 text-rose-600 border-rose-200'
          : 'bg-emerald-50 text-emerald-600 border-emerald-200'),
      isCustom: true,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleUpdateCategory = (updated: CategoryInfo, oldName?: string) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    if (oldName && oldName.trim() && oldName.trim().toLowerCase() !== updated.name.trim().toLowerCase()) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.type === updated.type && t.category.toLowerCase() === oldName.trim().toLowerCase()
            ? { ...t, category: updated.name.trim() }
            : t
        )
      );
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddSubCategory = (name: string) => {
    setSubCategories((prev) => [...prev, name]);
  };

  const handleDeleteSubCategory = (name: string) => {
    setSubCategories((prev) => prev.filter((s) => s !== name));
  };

  // Smooth programmatic transition when tapping tabs (PageNavigation / BottomBar)
  const handlePageChange = (newPage: ActivePage) => {
    setActivePage(newPage);
    if (!carouselRef.current) return;
    const width = carouselRef.current.clientWidth;
    const targetX = newPage === 'dues' ? width : 0;
    if (Math.abs(carouselRef.current.scrollLeft - targetX) > 4) {
      isProgrammaticScroll.current = true;
      carouselRef.current.scrollTo({
        left: targetX,
        behavior: 'smooth',
      });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 400);
    }
  };

  // Real-time carousel scroll listener: updates active indicator during interactive finger swipes
  const handleCarouselScroll = () => {
    if (isProgrammaticScroll.current || !carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    if (clientWidth <= 0) return;
    const pageIndex = Math.round(scrollLeft / clientWidth);
    const targetPage: ActivePage = pageIndex === 1 ? 'dues' : 'cashflow';
    if (targetPage !== activePage) {
      setActivePage(targetPage);
    }
  };

  // Date range filter handlers
  const handleApplyDateRange = (range: DateRange) => {
    setCustomDateRange(range);
    setPeriod('custom');
  };

  const handleClearDateRange = () => {
    setCustomDateRange(null);
    setPeriod('all');
  };

  const handlePeriodChange = (newPeriod: FilterPeriod) => {
    if (newPeriod !== 'custom') {
      setCustomDateRange(null);
    }
    setPeriod(newPeriod);
  };

  return (
    <div className="h-screen h-[100dvh] max-h-screen max-h-[100dvh] bg-slate-100 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white flex flex-col overflow-hidden">
      {/* Top Application Header */}
      <Header
        settings={settings}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onOpenDateFilterModal={() => setIsDateFilterModalOpen(true)}
        isDateFilterActive={Boolean(customDateRange)}
        activeDateRange={customDateRange}
      />

      {/* Two-Page View Navigation Bar (Cashflow <-> Dues) */}
      <PageNavigation
        activePage={activePage}
        onPageChange={handlePageChange}
        pendingDuesCount={pendingDuesCount}
      />

      {/* Active Custom Period Filter Bar */}
      {customDateRange && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs shrink-0 z-30">
          <div className="flex items-center gap-2 truncate font-medium">
            <Filter className="w-3.5 h-3.5 shrink-0 text-emerald-200" />
            <span className="truncate">
              Period Filter: <strong className="font-bold underline">{customDateRange.startDate}</strong> to{' '}
              <strong className="font-bold underline">{customDateRange.endDate}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsDateFilterModalOpen(true)}
              className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[11px] font-semibold text-white transition cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleClearDateRange}
              className="p-1 hover:bg-white/20 rounded text-white/90 hover:text-white transition cursor-pointer"
              title="Clear Period Filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Page Native Sliding Carousel Container */}
      <main className="flex-1 w-full overflow-hidden relative">
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth no-scrollbar select-none"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
          }}
        >
          {/* ======================================================================= */}
          {/* PAGE 1: CASHFLOW TRACKING (Income & Expenses) */}
          {/* ======================================================================= */}
          <section
            id="page-cashflow"
            aria-label="Income and Expenses Tracker"
            className="w-full h-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain px-4 pt-3 sm:pt-5 pb-28 sm:pb-12"
          >
            <div className="max-w-xl mx-auto space-y-4">
              {/* Bank Balance & Credit Card Due Cards */}
              <AccountBalanceCard
                bankBalance={bankBalance}
                creditCardDue={creditCardDue}
                currency={settings.currency}
                activeFilter={accountFilter}
                onFilterChange={setAccountFilter}
                onOpenPayCreditCard={() => setIsPayCreditCardModalOpen(true)}
                onOpenAdjustBalance={() => setIsAdjustBalanceModalOpen(true)}
              />

              {/* Balance Overview & Period Filter Card */}
              <BalanceCard
                period={period}
                onPeriodChange={handlePeriodChange}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                netBalance={netBalance}
                monthlyExpense={monthlyExpense}
                settings={settings}
                accountFilter={accountFilter}
                typeFilter={txTypeFilter}
                onTypeFilterChange={setTxTypeFilter}
                onResetFilters={() => {
                  setAccountFilter('all');
                  setTxTypeFilter('all');
                }}
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
                customDateRange={customDateRange}
                onOpenDateFilterModal={() => setIsDateFilterModalOpen(true)}
              />

              {/* Quick Add Button (Desktop / Tablet view) */}
              <div className="hidden sm:block">
                <button
                  id="desktop-add-transaction-btn"
                  type="button"
                  onClick={() => handleOpenAddTransaction()}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Transaction</span>
                </button>
              </div>

              {/* Category Spending Insights */}
              <CategoryInsights
                transactions={accountTransactions}
                currency={settings.currency}
                categories={categories}
                typeFilter={txTypeFilter}
                onTypeFilterChange={setTxTypeFilter}
                accountFilter={accountFilter}
              />

              {/* Transaction History & Search/Filter */}
              <TransactionList
                transactions={accountTransactions}
                currency={settings.currency}
                categories={categories}
                typeFilter={txTypeFilter}
                onTypeFilterChange={setTxTypeFilter}
                accountFilter={accountFilter}
                onEditTransaction={handleOpenEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onAddNew={() => handleOpenAddTransaction()}
              />
            </div>
          </section>

          {/* ======================================================================= */}
          {/* PAGE 2: DUES & LIABILITIES (Receivables & Payables) */}
          {/* ======================================================================= */}
          <section
            id="page-dues"
            aria-label="Receivables and Payables Tracker"
            className="w-full h-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain px-4 pt-3 sm:pt-5 pb-28 sm:pb-12"
          >
            <div className="max-w-xl mx-auto space-y-4">
              {/* High-Level Overview Card of Receivables, Payables, & Net Outstanding */}
              <DuesOverviewCard
                dues={filteredDues}
                currency={settings.currency}
                activeFilter={dueTypeFilter}
                onFilterChange={setDueTypeFilter}
              />

              {/* Quick Add Buttons for Receivables & Payables (Desktop / Tablet view) */}
              <div className="hidden sm:grid grid-cols-2 gap-3">
                <button
                  id="desktop-add-receivable-btn"
                  type="button"
                  onClick={() => handleOpenAddDue('receivable')}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Track Amount Receivable</span>
                </button>
                <button
                  id="desktop-add-payable-btn"
                  type="button"
                  onClick={() => handleOpenAddDue('payable')}
                  className="py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Track Amount Payable</span>
                </button>
              </div>

              {/* Grouped Person Dues List with Top Box Filters, Payments, & Search */}
              <DuesList
                dues={filteredDues}
                currency={settings.currency}
                activeFilter={dueTypeFilter}
                onFilterChange={setDueTypeFilter}
                onSelectPerson={setSelectedPersonForReport}
                onEditDue={handleOpenEditDue}
                onDeleteDue={handleDeleteDue}
                onOpenRecordPayment={handleOpenRecordPayment}
                onAddNew={handleOpenAddDue}
              />
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <BottomBar
        activePage={activePage}
        onAddTransaction={handleOpenAddTransaction}
        onAddDue={handleOpenAddDue}
        onPageChange={handlePageChange}
      />

      {/* Connectivity Status Indicator */}
      <OfflineIndicator />

      {/* Individual Person Detailed Report */}
      <PersonDetailView
        isOpen={!!selectedPersonForReport}
        onClose={() => setSelectedPersonForReport(null)}
        personName={selectedPersonForReport || ''}
        dues={selectedPersonDues}
        currency={settings.currency}
        activeFilter={dueTypeFilter}
        onFilterChange={setDueTypeFilter}
        onEditDue={handleOpenEditDue}
        onDeleteDue={(id) => {
          handleDeleteDue(id);
          if (selectedPersonDues.length <= 1) {
            setSelectedPersonForReport(null);
          }
        }}
        onOpenRecordPayment={handleOpenRecordPayment}
        onUpdatePaymentLog={handleUpdatePaymentLog}
        onDeletePaymentLog={handleDeletePaymentLog}
        onAddNewForPerson={(person, defaultType) => {
          handleOpenAddDue(defaultType, person);
        }}
      />

      {/* Transaction Entry & Edit Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        initialTransaction={editingTransaction}
        currency={settings.currency}
        categories={categories}
        subCategories={subCategories}
        bankBalance={bankBalance}
        creditCardDue={creditCardDue}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddSubCategory={handleAddSubCategory}
        onDeleteSubCategory={handleDeleteSubCategory}
      />

      {/* Pay Credit Card Bill from Bank Modal */}
      <PayCreditCardModal
        isOpen={isPayCreditCardModalOpen}
        onClose={() => setIsPayCreditCardModalOpen(false)}
        bankBalance={bankBalance}
        creditCardDue={creditCardDue}
        currency={settings.currency}
        onPayCreditCard={handlePayCreditCard}
      />

      {/* Adjust Bank Balance & Starting Credit Card Due Modal */}
      <AdjustBalanceModal
        isOpen={isAdjustBalanceModalOpen}
        onClose={() => setIsAdjustBalanceModalOpen(false)}
        currency={settings.currency}
        currentBankBalance={bankBalance}
        currentCreditCardDue={creditCardDue}
        onSaveAdjustedBalances={handleSaveAdjustedBalances}
      />

      {/* Dues Entry & Edit Modal (Receivables / Payables) */}
      <DueModal
        isOpen={isDueModalOpen}
        onClose={() => {
          setIsDueModalOpen(false);
          setEditingDue(null);
          setDueModalDefaultPerson('');
        }}
        onSave={handleSaveDue}
        onDelete={handleDeleteDue}
        initialDue={editingDue}
        defaultType={dueModalDefaultType}
        defaultPersonName={dueModalDefaultPerson}
        currency={settings.currency}
      />

      {/* Record Payment / Partial Settlement Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => {
          setIsRecordPaymentModalOpen(false);
          setActiveDueForPayment(null);
        }}
        due={activeDueForPayment}
        currency={settings.currency}
        categories={categories}
        subCategories={subCategories}
        onRecordPayment={handleRecordPayment}
      />

      {/* Budget & Currency Preferences Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      {/* Data Backup & Restore Modal (Handles Transactions + Dues) */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        transactions={transactions}
        settings={settings}
        categories={categories}
        subCategories={subCategories}
        dues={dues}
        onUpdateTransactions={setTransactions}
        onUpdateSettings={setSettings}
        onUpdateCategories={setCategories}
        onUpdateSubCategories={setSubCategories}
        onUpdateDues={setDues}
      />

      {/* Date Range Period Filter Modal */}
      <DateRangeFilterModal
        isOpen={isDateFilterModalOpen}
        onClose={() => setIsDateFilterModalOpen(false)}
        activeRange={customDateRange}
        onApplyRange={handleApplyDateRange}
        onClearRange={handleClearDateRange}
        transactions={transactions}
        dues={dues}
      />

      {/* Beginner & PWA Mobile Installation Guide Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}

