import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { BudgetPeriod, CashflowDataState, CashflowCategory, CashflowManagement, CashflowOverallBudget, CashflowQuickFill, CashflowRecurringEntry, CreateCategoryInput, CreateEntryInput, CreateQuickFillInput, CreateRecurringEntryInput, ManagementImageTheme, UpdateCategoryInput, UpdateManagementInput } from "./types";
import {
  buildActivity,
  buildAnalytics,
  createCategory as insertCategory,
  createQuickFill as insertQuickFill,
  createRecurringEntry as insertRecurringEntry,
  buildStats,
  deleteRecurringEntry as softDeleteRecurringEntry,
  deleteQuickFill as softDeleteQuickFill,
  deleteCategory as softDeleteCategory,
  updateCategoryBudget as persistCategoryBudget,
  updateCategory as updateCategoryInRepo,
  createEntry as insertEntry,
  createTransfer as insertTransfer,
  createManagement as insertManagement,
  emptyCashflowStats,
  getActiveManagementId,
  listCategories,
  listEntries,
  listManagementMembers as listManagementMembersFromRepo,
  listManagements,
  listOverallBudgets,
  listQuickFills,
  listRecurringEntries,
  materializeDueRecurringEntries,
  setActiveManagementId as persistActiveManagementId,
  setManagementImage as persistManagementImage,
  updateOverallBudget as persistOverallBudget,
  updateEntry as updateEntryInRepo,
  updateManagementImageTheme as updateManagementImageThemeInRepo,
  updateManagement as updateManagementInRepo,
} from "./repository";
import type { CashflowEntry } from "@/components/cashflow/CashflowTable";

const emptyActivity = buildActivity([]);
const emptyAnalytics = buildAnalytics([], []);

const CashflowDataContext = createContext<CashflowDataState | null>(null);

export function CashflowDataProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [isReady, setIsReady] = useState(false);
  const [activeManagementId, setActiveManagementIdState] = useState<string | null>(null);
  const [managements, setManagements] = useState<CashflowManagement[]>([]);
  const [categories, setCategories] = useState<CashflowCategory[]>([]);
  const [overallBudgets, setOverallBudgets] = useState<CashflowOverallBudget[]>([]);
  const [quickFills, setQuickFills] = useState<CashflowQuickFill[]>([]);
  const [recurringEntries, setRecurringEntries] = useState<CashflowRecurringEntry[]>([]);
  const [entries, setEntries] = useState<CashflowEntry[]>([]);

  const refresh = useCallback(async () => {
    const [nextManagements, storedManagementId] = await Promise.all([listManagements(db), getActiveManagementId(db)]);
    const fallbackManagementId = storedManagementId ?? nextManagements[0]?.id ?? null;

    setManagements(nextManagements);
    setActiveManagementIdState(fallbackManagementId);

    if (!fallbackManagementId) {
      setCategories([]);
      setOverallBudgets([]);
      setQuickFills([]);
      setRecurringEntries([]);
      setEntries([]);
      setIsReady(true);
      return;
    }

    await materializeDueRecurringEntries(db, fallbackManagementId);

    const [nextCategories, nextOverallBudgets, nextQuickFills, nextRecurringEntries, nextEntries] = await Promise.all([
      listCategories(db, fallbackManagementId),
      listOverallBudgets(db, fallbackManagementId),
      listQuickFills(db, fallbackManagementId),
      listRecurringEntries(db, fallbackManagementId),
      listEntries(db, fallbackManagementId),
    ]);

    setCategories(nextCategories);
    setOverallBudgets(nextOverallBudgets);
    setQuickFills(nextQuickFills);
    setRecurringEntries(nextRecurringEntries);
    setEntries(nextEntries);
    setIsReady(true);
  }, [db]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      await refresh();
      if (!isMounted) return;
    }

    load().catch((error) => {
      console.error("Failed to load cashflow data", error);
      if (isMounted) setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, [db, refresh]);

  const activeManagement = useMemo(
    () => managements.find((management) => management.id === activeManagementId) ?? null,
    [activeManagementId, managements],
  );
  const stats = useMemo(() => buildStats(entries), [entries]);
  const activity = useMemo(() => buildActivity(entries), [entries]);
  const analytics = useMemo(() => buildAnalytics(entries, categories), [entries, categories]);

  const value: CashflowDataState = {
    isReady,
    activeManagementId,
    activeManagement,
    managements,
    categories,
    overallBudgets,
    quickFills,
    recurringEntries,
    entries,
    stats: entries.length > 0 ? stats : emptyCashflowStats,
    activity: entries.length > 0 ? activity : emptyActivity,
    analytics: entries.length > 0 ? analytics : emptyAnalytics,
    setActiveManagementId: async (managementId) => {
      await persistActiveManagementId(db, managementId);
      await refresh();
    },
    setManagementImage: async (managementId: string, image: string, imageTheme: ManagementImageTheme | null) => {
      await persistManagementImage(db, managementId, image, imageTheme);
      await refresh();
    },
    updateManagementImageTheme: async (managementId: string, imageTheme: ManagementImageTheme) => {
      await updateManagementImageThemeInRepo(db, managementId, imageTheme);
      await refresh();
    },
    createManagement: async (input) => {
      await insertManagement(db, input);
      await refresh();
    },
    updateManagement: async (managementId: string, input: UpdateManagementInput) => {
      await updateManagementInRepo(db, managementId, input);
      await refresh();
    },
    listManagementMembers: (managementId: string) => listManagementMembersFromRepo(db, managementId),
    createCategory: async (input: CreateCategoryInput) => {
      if (!activeManagementId) return;
      await insertCategory(db, activeManagementId, input);
      await refresh();
    },
    updateCategory: async (categoryId: string, input: UpdateCategoryInput) => {
      if (!activeManagementId) return;
      await updateCategoryInRepo(db, activeManagementId, categoryId, input);
      await refresh();
    },
    deleteCategory: async (id: string) => {
      if (!activeManagementId) return;
      await softDeleteCategory(db, activeManagementId, id);
      await refresh();
    },
    updateOverallBudget: async (period: BudgetPeriod, nominal: number | null) => {
      if (!activeManagementId) return;
      await persistOverallBudget(db, activeManagementId, period, nominal);
      await refresh();
    },
    updateCategoryBudget: async (categoryId: string, period: BudgetPeriod, nominal: number | null) => {
      if (!activeManagementId) return;
      await persistCategoryBudget(db, activeManagementId, categoryId, period, nominal);
      await refresh();
    },
    createQuickFill: async (input: CreateQuickFillInput) => {
      if (!activeManagementId) return;
      await insertQuickFill(db, activeManagementId, input);
      await refresh();
    },
    deleteQuickFill: async (id: string) => {
      if (!activeManagementId) return;
      await softDeleteQuickFill(db, activeManagementId, id);
      await refresh();
    },
    createRecurringEntry: async (input: CreateRecurringEntryInput) => {
      if (!activeManagementId) return;
      await insertRecurringEntry(db, activeManagementId, input);
      await materializeDueRecurringEntries(db, activeManagementId);
      await refresh();
    },
    deleteRecurringEntry: async (id: string) => {
      if (!activeManagementId) return;
      await softDeleteRecurringEntry(db, activeManagementId, id);
      await refresh();
    },
    createEntry: async (input: CreateEntryInput) => {
      if (!activeManagementId) return;
      await insertEntry(db, activeManagementId, input);
      await refresh();
    },
    updateEntry: async (id: string, input: CreateEntryInput) => {
      if (!activeManagementId) return;
      await updateEntryInRepo(db, activeManagementId, id, input);
      await refresh();
    },
    createTransfer: async (input) => {
      await insertTransfer(db, input);
      await refresh();
    },
    refresh,
  };

  return <CashflowDataContext.Provider value={value}>{children}</CashflowDataContext.Provider>;
}

export function useCashflowData() {
  const value = useContext(CashflowDataContext);
  if (!value) {
    throw new Error("useCashflowData must be used within CashflowDataProvider");
  }
  return value;
}
