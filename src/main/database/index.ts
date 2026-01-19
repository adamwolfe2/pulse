/**
 * Database Module
 *
 * Provides SQLite database connection and management for Pulse.
 * Uses better-sqlite3 for synchronous, fast database operations.
 */

import Database from "better-sqlite3"
import { app } from "electron"
import * as path from "path"
import * as fs from "fs"
import { SCHEMA_VERSION, MIGRATIONS } from "./schema"

let db: Database.Database | null = null

/**
 * Get the database file path
 */
function getDatabasePath(): string {
  const userDataPath = app.getPath("userData")
  return path.join(userDataPath, "pulse.db")
}

/**
 * Initialize the database connection and run migrations
 */
export function initializeDatabase(): Database.Database {
  if (db) return db

  const dbPath = getDatabasePath()
  const dbDir = path.dirname(dbPath)

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  console.log(`[Database] Initializing at: ${dbPath}`)

  // Create database connection with performance optimizations
  db = new Database(dbPath)

  // Performance pragmas
  db.pragma("journal_mode = WAL")           // Write-Ahead Logging for concurrency
  db.pragma("synchronous = NORMAL")         // Balance between safety and speed
  db.pragma("foreign_keys = ON")            // Enforce referential integrity
  db.pragma("cache_size = -64000")          // 64MB cache
  db.pragma("temp_store = MEMORY")          // Store temp tables in memory
  db.pragma("mmap_size = 268435456")        // 256MB memory-mapped I/O

  // Run migrations
  runMigrations(db)

  console.log(`[Database] Initialized successfully`)
  return db
}

/**
 * Run pending database migrations
 */
function runMigrations(database: Database.Database): void {
  // Get current schema version
  const versionRow = database
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'`
    )
    .get() as { name: string } | undefined

  let currentVersion = 0

  if (versionRow) {
    const row = database
      .prepare(`SELECT MAX(version) as version FROM schema_version`)
      .get() as { version: number } | undefined
    currentVersion = row?.version || 0
  }

  console.log(`[Database] Current schema version: ${currentVersion}`)

  // Apply pending migrations
  for (let version = currentVersion + 1; version <= SCHEMA_VERSION; version++) {
    const migration = MIGRATIONS[version]
    if (migration) {
      console.log(`[Database] Applying migration ${version}...`)
      database.exec(migration)
      database
        .prepare(`INSERT INTO schema_version (version) VALUES (?)`)
        .run(version)
      console.log(`[Database] Migration ${version} applied`)
    }
  }
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase()
  }
  return db
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    console.log(`[Database] Closing connection`)
    db.close()
    db = null
  }
}

/**
 * Export database path for backup purposes
 */
export function getDatabaseFilePath(): string {
  return getDatabasePath()
}
