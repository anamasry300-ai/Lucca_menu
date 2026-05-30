import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'lucca.db');

let _db: SqlJsDatabase | null = null;

export function getDb(): SqlJsDatabase {
  if (_db) return _db;
  throw new Error('Database not initialized. Call initDb() first.');
}

export async function initDb(): Promise<SqlJsDatabase> {
  if (_db) return _db;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const SQL = await initSqlJs();
  let buffer: Buffer | undefined;
  try { buffer = fs.readFileSync(DB_PATH); } catch { /* new db */ }
  _db = new SQL.Database(buffer);

  migrate(_db);
  saveDb();
  return _db;
}

export function saveDb() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function closeDb() {
  if (_db) { saveDb(); _db.close(); _db = null; }
}

// Helper: run a SELECT and return all rows as objects
export function queryAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a SELECT and return first row
export function queryOne(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

// Helper: run INSERT/UPDATE/DELETE, return changes info
export function execute(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number } {
  const db = getDb();
  db.run(sql, params);
  saveDb();
  // sql.js's getRowsModified and getInsertId don't exist directly
  // We need to track them
  return { changes: 0, lastInsertRowid: 0 };
}

// Custom tracked execution
let _lastInsertId = 0;

export function insert(sql: string, params: unknown[] = []): number {
  const db = getDb();
  db.run(sql, params);
  saveDb();
  // Get the last insert id by querying sqlite_sequence or max(id)
  const tableMatch = sql.match(/INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+`?(\w+)`?/i);
  if (tableMatch) {
    const table = tableMatch[1];
    const row = queryOne(`SELECT MAX(id) as max_id FROM \`${table}\``);
    _lastInsertId = (row?.max_id as number) || 0;
  }
  return _lastInsertId;
}

export function getLastInsertId(): number {
  return _lastInsertId;
}

function migrate(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT DEFAULT '',
      role TEXT DEFAULT 'cashier',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY,
      number INTEGER,
      status TEXT DEFAULT 'available',
      capacity INTEGER DEFAULT 4,
      currentOrder INTEGER
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tableId TEXT,
      items TEXT DEFAULT '[]',
      customerName TEXT DEFAULT '',
      customerPhone TEXT DEFAULT '',
      paymentMethod TEXT DEFAULT 'cash',
      customerNotes TEXT DEFAULT '',
      invoiceDelivery TEXT DEFAULT 'cashier',
      marketingOptIn INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      discountAmount REAL DEFAULT 0,
      discountType TEXT DEFAULT 'percent',
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      date TEXT DEFAULT (datetime('now')),
      createdBy TEXT DEFAULT 'unknown',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      name TEXT DEFAULT '',
      visits INTEGER DEFAULT 1,
      lastVisit TEXT,
      totalSpent REAL DEFAULT 0,
      marketingOptIn INTEGER DEFAULT 0,
      preferredChannel TEXT DEFAULT 'cashier',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      quantity REAL DEFAULT 0,
      unit TEXT DEFAULT 'قطعة',
      minStock REAL DEFAULT 0,
      costPrice REAL DEFAULT 0,
      lastUpdated TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      quantity REAL DEFAULT 1,
      total REAL DEFAULT 0,
      date TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      createdBy TEXT DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT DEFAULT '',
      role TEXT DEFAULT 'موظف',
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER,
      date TEXT,
      checkIn TEXT,
      checkOut TEXT,
      lateMinutes INTEGER DEFAULT 0,
      bonus REAL DEFAULT 0,
      deduction REAL DEFAULT 0,
      hoursWorked REAL,
      notes TEXT DEFAULT '',
      FOREIGN KEY (employeeId) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT DEFAULT 'أخرى',
      amount REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      date TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      createdBy TEXT DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS shifts (
      date TEXT PRIMARY KEY,
      openingBalance REAL DEFAULT 0,
      status TEXT DEFAULT 'open',
      openedAt TEXT DEFAULT (datetime('now')),
      closedAt TEXT,
      actualCash REAL,
      expectedCash REAL,
      difference REAL,
      cashSales REAL,
      cardSales REAL,
      totalSales REAL,
      totalExpenses REAL,
      orderCount INTEGER DEFAULT 0,
      notes TEXT DEFAULT ''
    );
  `);

  // Seed default admin user
  const users = queryAll('SELECT COUNT(*) as c FROM users');
  if (users.length === 0 || users[0].c === 0) {
    db.run('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', ['admin', '123456', 'مدير النظام', 'admin']);
  }

  // Seed default tables (1-14)
  const tables = queryAll('SELECT COUNT(*) as c FROM tables');
  if (tables.length === 0 || tables[0].c === 0) {
    for (let i = 1; i <= 14; i++) {
      db.run('INSERT INTO tables (id, number, status, capacity) VALUES (?, ?, ?, ?)', [i, i, 'available', 4]);
    }
  }

  saveDb();
}
