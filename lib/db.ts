import Database from "better-sqlite3"
import { join } from "path"

// Database connection configuration
const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), "data/data.db")

// Create a singleton connection
let db: Database.Database | null = null

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH, {
      verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    })

    // Enable WAL mode and foreign keys
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT UNIQUE,
        role TEXT CHECK(role IN ('ADMIN', 'USER', 'GUEST')) DEFAULT 'USER',
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER NOT NULL,
        mime_type TEXT,
        user_id TEXT,
        folder_id TEXT,
        download_count INTEGER DEFAULT 0,
        share_url TEXT UNIQUE,
        share_password TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        user_id TEXT NOT NULL,
        share_url TEXT UNIQUE,
        share_password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        site_name TEXT NOT NULL DEFAULT 'File Uploader',
        logo_url TEXT
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
      CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
      CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
      CREATE INDEX IF NOT EXISTS idx_files_share_url ON files(share_url);
      CREATE INDEX IF NOT EXISTS idx_folders_share_url ON folders(share_url);
      CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `)
  }

  return db
}

// Handle cleanup on process exit
process.on('exit', () => {
  if (db) {
    db.close()
    db = null
  }
})

export { getDb as db }