import type { SQLiteDatabase } from "expo-sqlite";
import { reseedDemoCashflowEntries, seedCashflowDatabase } from "./seed";

const DATABASE_VERSION = 2;

export async function migrateCashflowDatabase(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");

  const result = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_preferences (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        name TEXT NOT NULL,
        email TEXT,
        image TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS managements (
        id TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        name TEXT NOT NULL,
        image TEXT,
        image_theme_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS management_members (
        id TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        management_id TEXT NOT NULL REFERENCES managements(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        role TEXT NOT NULL DEFAULT 'owner',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT,
        UNIQUE(management_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        name TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        budget_daily INTEGER,
        budget_weekly INTEGER,
        budget_monthly INTEGER,
        budget_yearly INTEGER,
        management_id TEXT NOT NULL REFERENCES managements(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT,
        UNIQUE(name, management_id)
      );

      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        notion_id TEXT,
        name TEXT NOT NULL,
        nominal INTEGER NOT NULL,
        original_nominal INTEGER,
        original_currency TEXT,
        exchange_rate_to_idr REAL,
        exchange_rate_at TEXT,
        category_id TEXT REFERENCES categories(id),
        date TEXT NOT NULL,
        io TEXT NOT NULL CHECK (io IN ('Income', 'Expenses')),
        management_id TEXT NOT NULL REFERENCES managements(id),
        created_by_id TEXT REFERENCES users(id),
        is_reconciliation INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS quick_fills (
        id TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        label TEXT NOT NULL,
        amount INTEGER,
        category_id TEXT REFERENCES categories(id),
        management_id TEXT NOT NULL REFERENCES managements(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS overall_budgets (
        id TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        management_id TEXT NOT NULL REFERENCES managements(id),
        period TEXT NOT NULL,
        nominal INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT,
        UNIQUE(management_id, period)
      );

      CREATE TABLE IF NOT EXISTS recurring_entries (
        id TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        name TEXT NOT NULL,
        nominal INTEGER NOT NULL,
        category_id TEXT REFERENCES categories(id),
        io TEXT NOT NULL CHECK (io IN ('Income', 'Expenses')),
        management_id TEXT NOT NULL REFERENCES managements(id),
        frequency TEXT NOT NULL,
        next_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_snapshots (
        id TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        management_id TEXT NOT NULL REFERENCES managements(id),
        period TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT
      );

      CREATE INDEX IF NOT EXISTS entries_date_created_idx ON entries(date, created_at, id);
      CREATE INDEX IF NOT EXISTS entries_io_date_idx ON entries(io, date);
      CREATE INDEX IF NOT EXISTS entries_category_idx ON entries(category_id);
      CREATE INDEX IF NOT EXISTS entries_management_idx ON entries(management_id);
      CREATE INDEX IF NOT EXISTS entries_created_by_idx ON entries(created_by_id);
      CREATE INDEX IF NOT EXISTS categories_management_idx ON categories(management_id);
      CREATE INDEX IF NOT EXISTS quick_fills_management_idx ON quick_fills(management_id);
    `);

    await seedCashflowDatabase(db);
    currentVersion = 1;
  }

  if (currentVersion < 2) {
    await reseedDemoCashflowEntries(db);
    currentVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
