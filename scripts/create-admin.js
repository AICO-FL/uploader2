const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { createId } = require('@paralleldrive/cuid2');
const { join } = require('path');
const { mkdir } = require('fs/promises');

async function createAdmin() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const name = 'System Admin';
  const id = createId();

  try {
    // Create data directory if it doesn't exist
    const dataDir = join(process.cwd(), 'data');
    await mkdir(dataDir, { recursive: true });
    
    const db = new Database(join(dataDir, 'data.db'));

    // Enable WAL mode and foreign keys
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create users table if it doesn't exist
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
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
      CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
      CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
    `);
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = db.prepare(`
      INSERT OR REPLACE INTO users (id, username, email, name, password, role, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(id, 'admin', email, name, passwordHash, 'ADMIN');

    if (result.changes > 0) {
      console.log('Admin account created successfully');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.log('Failed to create admin account');
    }

    db.close();
  } catch (error) {
    console.error('Failed to create admin account:', error);
    process.exit(1);
  }
}

createAdmin();