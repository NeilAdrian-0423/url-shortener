import bcrypt from 'bcryptjs';
import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbLogger = winston.createLogger({
  level: process.env.DB_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'database.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

let db = null;
let Database;

// Detect runtime and load appropriate SQLite implementation
if (typeof Bun !== 'undefined') {
  // Use Bun's built-in SQLite
  Database = (await import('bun:sqlite')).Database;
  dbLogger.info('Using Bun built-in SQLite');
} else {
  // Use better-sqlite3 for Node.js
  Database = (await import('better-sqlite3')).default;
  dbLogger.info('Using better-sqlite3');
}

export async function initDB() {
  if (db) return db;

  try {
    dbLogger.info('Initializing database connection...');

    // Create database connection
    const dbPath = join(__dirname, 'urls.db');

    if (typeof Bun !== 'undefined') {
      // Bun SQLite configuration
      db = new Database(dbPath, { create: true });
    } else {
      // better-sqlite3 configuration
      db = new Database(dbPath);
      db.pragma('foreign_keys = ON');
      db.pragma('journal_mode = WAL');
    }

    dbLogger.info('Creating database tables...');

    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );
    `);
    dbLogger.info('Users table ready');

    // URLs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        short_code TEXT UNIQUE NOT NULL,
        long_url TEXT NOT NULL,
        custom_alias TEXT,
        password TEXT,
        is_password_protected INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
      CREATE INDEX IF NOT EXISTS idx_user_id ON urls(user_id);
    `);
    dbLogger.info('URLs table ready');

    // Invites table
    db.exec(`
      CREATE TABLE IF NOT EXISTS invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        email TEXT,
        created_by INTEGER NOT NULL,
        used_by INTEGER,
        is_used INTEGER DEFAULT 0,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id),
        FOREIGN KEY (used_by) REFERENCES users (id)
      );
    `);
    dbLogger.info('Invites table ready');

    // Click analytics table
    db.exec(`
      CREATE TABLE IF NOT EXISTS clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url_id INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        referrer TEXT,
        clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (url_id) REFERENCES urls (id) ON DELETE CASCADE
      );
    `);
    dbLogger.info('Clicks table ready');

    // Create unified API for both Bun and better-sqlite3
    if (typeof Bun !== 'undefined') {
      // Bun SQLite API wrapper
      db.get = function (sql, params = []) {
        try {
          const stmt = this.prepare(sql);
          const result = stmt.get(...params);
          dbLogger.debug(`Query executed: ${sql.substring(0, 50)}...`);
          return result;
        } catch (error) {
          dbLogger.error(`Query failed: ${sql}`, error);
          throw error;
        }
      };

      db.all = function (sql, params = []) {
        try {
          const stmt = this.prepare(sql);
          const results = stmt.all(...params);
          dbLogger.debug(`Query executed: ${sql.substring(0, 50)}... (${results.length} rows)`);
          return results;
        } catch (error) {
          dbLogger.error(`Query failed: ${sql}`, error);
          throw error;
        }
      };

      db.run = function (sql, params = []) {
        try {
          const stmt = this.prepare(sql);
          const result = stmt.run(...params);
          dbLogger.debug(`Query executed: ${sql.substring(0, 50)}...`);
          return {
            lastID: typeof result.lastInsertRowid !== 'undefined' ? result.lastInsertRowid : this.lastInsertRowid,
            changes: result.changes || 0
          };
        } catch (error) {
          dbLogger.error(`Query failed: ${sql}`, error);
          throw error;
        }
      };
    } else {
      // better-sqlite3 already has these methods, just wrap for logging
      const originalGet = db.prepare.bind(db);
      const originalAll = db.prepare.bind(db);
      const originalRun = db.prepare.bind(db);

      db.get = function (sql, params = []) {
        try {
          const stmt = originalGet(sql);
          const result = stmt.get(...params);
          dbLogger.debug(`Query executed: ${sql.substring(0, 50)}...`);
          return result;
        } catch (error) {
          dbLogger.error(`Query failed: ${sql}`, error);
          throw error;
        }
      };

      db.all = function (sql, params = []) {
        try {
          const stmt = originalAll(sql);
          const results = stmt.all(...params);
          dbLogger.debug(`Query executed: ${sql.substring(0, 50)}... (${results.length} rows)`);
          return results;
        } catch (error) {
          dbLogger.error(`Query failed: ${sql}`, error);
          throw error;
        }
      };

      db.run = function (sql, params = []) {
        try {
          const stmt = originalRun(sql);
          const result = stmt.run(...params);
          dbLogger.debug(`Query executed: ${sql.substring(0, 50)}... (${result.changes} changes)`);
          return {
            lastID: result.lastInsertRowid,
            changes: result.changes
          };
        } catch (error) {
          dbLogger.error(`Query failed: ${sql}`, error);
          throw error;
        }
      };
    }

    // Check if admin exists
    const adminExists = db.get('SELECT * FROM users WHERE role = ?', ['admin']);

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, 'admin']
      );
      dbLogger.info('Default admin user created - username: admin, password: admin123');
    } else {
      dbLogger.info('Admin user already exists');
    }

    dbLogger.info('Database initialization completed successfully');
    dbLogger.info(`Runtime: ${typeof Bun !== 'undefined' ? 'Bun' : 'Node.js'}`);

    return db;
  } catch (error) {
    dbLogger.error('Database initialization failed:', error);
    throw error;
  }
}

// Close database connection gracefully
export function closeDB() {
  if (db) {
    db.close();
    dbLogger.info('Database connection closed');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  closeDB();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDB();
  process.exit(0);
});

export { db, dbLogger };