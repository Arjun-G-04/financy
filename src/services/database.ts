import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export interface LocalTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'credit' | 'debit';
  amount: number;
  name: string;
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
      `INSERT OR REPLACE INTO transactions (id, date, type, amount, name) VALUES (?, ?, ?, ?, ?);`,
      tx.id,
      tx.date,
      tx.type,
      tx.amount,
      tx.name
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
  }
};
