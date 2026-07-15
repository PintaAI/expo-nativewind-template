import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import i18n from "@/i18n";
import {
  listAllRecurringEntries,
  materializeAllDueRecurringEntries,
  type MaterializedRecurringEntry,
} from "@/data/cashflow/repository";
import { migrateCashflowDatabase } from "@/data/cashflow/schema";
import {
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  prepareDefaultNotificationChannelAsync,
  requestNotificationPermissionsAsync,
} from "@/lib/notifications";
import { parseDateKey } from "@/lib/date";

const DATABASE_NAME = "ethos-cashflow.db";
const AUTOMATIC_ENTRY_TASK = "ethos-automatic-entries";
const REMINDER_KIND = "automatic-entry-reminder";

async function notificationsAreAllowedAsync() {
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function notifyMaterializedAutomaticEntriesAsync(entries: MaterializedRecurringEntry[]) {
  if (entries.length === 0 || !await notificationsAreAllowedAsync()) return;
  await prepareDefaultNotificationChannelAsync();

  await Promise.all(entries.map((entry) => Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("autoEntry.recordedTitle"),
      body: i18n.t("autoEntry.recordedBody", { name: entry.name }),
      sound: "default",
      data: {
        kind: "automatic-entry-recorded",
        recurringEntryId: entry.recurringEntryId,
        managementId: entry.managementId,
        url: "/forms/automatic-entry",
      },
    },
    trigger: null,
  })));
}

export async function syncAutomaticEntryRemindersAsync(db: SQLiteDatabase) {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => notification.content.data?.kind === REMINDER_KIND)
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)),
  );
  if (!await notificationsAreAllowedAsync()) return;
  await prepareDefaultNotificationChannelAsync();

  const now = new Date();
  const recurringEntries = await listAllRecurringEntries(db);
  await Promise.all(recurringEntries.map(async (entry) => {
    const date = parseDateKey(entry.nextDate);
    const [hour, minute] = entry.reminderTime.split(":").map(Number);
    date.setHours(hour, minute, 0, 0);
    if (date <= now) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t("autoEntry.reminderTitle"),
        body: i18n.t("autoEntry.reminderBody", { name: entry.name }),
        sound: "default",
        data: {
          kind: REMINDER_KIND,
          recurringEntryId: entry.id,
          managementId: entry.managementId,
          url: "/forms/automatic-entry",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: Platform.OS === "android" ? DEFAULT_NOTIFICATION_CHANNEL_ID : undefined,
      },
    });
  }));
}

async function runAutomaticEntriesAsync() {
  const db = await openDatabaseAsync(DATABASE_NAME);
  try {
    await migrateCashflowDatabase(db);
    const materialized = await materializeAllDueRecurringEntries(db);
    await notifyMaterializedAutomaticEntriesAsync(materialized);
    await syncAutomaticEntryRemindersAsync(db);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error("Failed to process automatic entries in the background", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  } finally {
    await db.closeAsync();
  }
}

if (
  Platform.OS !== "web" &&
  !TaskManager.isTaskDefined(AUTOMATIC_ENTRY_TASK)
) {
  TaskManager.defineTask(AUTOMATIC_ENTRY_TASK, runAutomaticEntriesAsync);
}

export async function registerAutomaticEntryBackgroundTaskAsync() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;
  if (!await TaskManager.isAvailableAsync()) return;
  if (await TaskManager.isTaskRegisteredAsync(AUTOMATIC_ENTRY_TASK)) return;

  await BackgroundTask.registerTaskAsync(AUTOMATIC_ENTRY_TASK, {
    minimumInterval: 60,
  });
}

export function requestAutomaticEntryNotificationPermissionAsync() {
  return requestNotificationPermissionsAsync();
}
