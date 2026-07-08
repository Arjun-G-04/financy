import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export interface Category {
  id: string;
  name: string;
}

export interface LocalTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'credit' | 'debit';
  amount: number;
  name: string;
  category?: string | null;
}

export const initDatabase = () => {
  if (db) return db;
  try {
    db = SQLite.openDatabaseSync('financy.db');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        name TEXT NOT NULL
      );
    `);
    
    // Create categories table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
    `);

    // Migrate transactions table to add category column if missing
    try {
      db.execSync('ALTER TABLE transactions ADD COLUMN category TEXT;');
    } catch {
      // Column already exists, ignore
    }
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
    throw error;
  }
  return db;
};

export const DatabaseService = {
  getDb() {
    return initDatabase();
  },

  saveTransaction(tx: LocalTransaction) {
    const database = this.getDb();
    database.runSync(
      `INSERT OR REPLACE INTO transactions (id, date, type, amount, name, category) VALUES (?, ?, ?, ?, ?, ?);`,
      tx.id,
      tx.date,
      tx.type,
      tx.amount,
      tx.name,
      tx.category ?? null
    );
  },

  getTransactions(startDate?: string, endDate?: string): LocalTransaction[] {
    const database = this.getDb();
    let query = `SELECT * FROM transactions`;
    const params: string[] = [];

    if (startDate && endDate) {
      query += ` WHERE date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ` WHERE date >= ?`;
      params.push(startDate);
    } else if (endDate) {
      query += ` WHERE date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY date DESC, id DESC`;

    return database.getAllSync<LocalTransaction>(query, ...params);
  },

  transactionExists(id: string): boolean {
    const database = this.getDb();
    const row = database.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count FROM transactions WHERE id = ?;`,
      id
    );
    return (row?.count ?? 0) > 0;
  },

  deleteTransaction(id: string) {
    const database = this.getDb();
    database.runSync(`DELETE FROM transactions WHERE id = ?;`, id);
  },

  // Category CRUD
  getCategories(): Category[] {
    const database = this.getDb();
    return database.getAllSync<Category>(`SELECT * FROM categories ORDER BY name ASC;`);
  },

  saveCategory(name: string): Category {
    const database = this.getDb();
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    database.runSync(
      `INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?);`,
      id,
      name.trim()
    );
    
    const existing = database.getFirstSync<Category>(
      `SELECT * FROM categories WHERE name = ?;`,
      name.trim()
    );
    if (!existing) {
      throw new Error('Failed to save category');
    }
    return existing;
  },

  deleteCategory(id: string) {
    const database = this.getDb();
    database.runSync(`DELETE FROM categories WHERE id = ?;`, id);
  },

  categoryExists(name: string): boolean {
    const database = this.getDb();
    const row = database.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count FROM categories WHERE name = ?;`,
      name.trim()
    );
    return (row?.count ?? 0) > 0;
  }
};
