import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Network from "expo-network";
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

const AUTO_SYNC_INTERVAL_MS = 60_000;

export function useSync(): SyncHook {
  const db = useSQLiteContext();
  const { isAuthenticated, isPending } = useAuth();
  const { refresh } = useCashflowData();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const runningRef = useRef(false);
  const lastSuccessfulSyncRef = useRef(0);
  const wasConnectedRef = useRef<boolean | null>(null);

  const runSync = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setStatus("syncing");
    try {
      const summary = await syncNow(db);
      await refresh();
      const completedAt = new Date();
      if (summary.errors > 0) {
        console.warn(`[sync] completed with ${summary.errors} error(s)`);
        setStatus("error");
      } else {
        lastSuccessfulSyncRef.current = completedAt.getTime();
        setLastSync(completedAt);
        setStatus("idle");
      }
    } catch (error) {
      console.warn("[sync] syncNow failed", error);
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  }, [db, refresh]);

  const runAutomaticSync = useCallback(() => {
    if (Date.now() - lastSuccessfulSyncRef.current < AUTO_SYNC_INTERVAL_MS) return;
    void runSync();
  }, [runSync]);

  useEffect(() => {
    if (!isAuthenticated || isPending) {
      lastSuccessfulSyncRef.current = 0;
      wasConnectedRef.current = null;
      return;
    }
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") runAutomaticSync();
    });
    const networkSub = Network.addNetworkStateListener(({ isConnected, isInternetReachable }) => {
      const isOnline = isConnected === true && isInternetReachable !== false;
      const connectionRestored = wasConnectedRef.current === false && isOnline;
      wasConnectedRef.current = isOnline;
      if (connectionRestored) runAutomaticSync();
    });
    const initialSync = setTimeout(runAutomaticSync, 0);
    return () => {
      clearTimeout(initialSync);
      sub.remove();
      networkSub.remove();
    };
  }, [isAuthenticated, isPending, runAutomaticSync]);

  return { status, lastSync, syncNow: runSync };
}
