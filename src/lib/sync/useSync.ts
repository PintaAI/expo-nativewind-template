import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@/components/AuthProvider";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { syncNow } from "./syncEngine";

export type SyncStatus = "idle" | "syncing" | "error";

export type SyncHook = {
  status: SyncStatus;
  lastSync: Date | null;
  syncNow: () => Promise<void>;
};

export function useSync(): SyncHook {
  const db = useSQLiteContext();
  const { isAuthenticated, isPending } = useAuth();
  const { refresh } = useCashflowData();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const runningRef = useRef(false);

  const runSync = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setStatus("syncing");
    try {
      await syncNow(db);
      await refresh();
      setLastSync(new Date());
      setStatus("idle");
    } catch (error) {
      console.warn("[sync] syncNow failed", error);
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  }, [db, refresh]);

  useEffect(() => {
    if (!isAuthenticated || isPending) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void runSync();
    });
    const initialSync = setTimeout(() => void runSync(), 0);
    return () => {
      clearTimeout(initialSync);
      sub.remove();
    };
  }, [isAuthenticated, isPending, runSync]);

  return { status, lastSync, syncNow: runSync };
}
