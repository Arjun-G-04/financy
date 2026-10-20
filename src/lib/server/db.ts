import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';

import type { LocalTransaction, Category, ReconciliationState, AppSettings } from '#lib/types';
export type { LocalTransaction, Category, ReconciliationState, AppSettings };
import { env } from '#lib/server/env';

export const db = createClient({
	url: env.TURSO_DATABASE_URL,
	authToken: env.TURSO_AUTH_TOKEN
});

let isInitialized = false;

export async function initDb() {
	if (isInitialized) return;

	await db.batch([
		`CREATE TABLE IF NOT EXISTS transactions (
			id TEXT PRIMARY KEY,
			date TEXT NOT NULL,
			type TEXT NOT NULL,
			amount REAL NOT NULL,
			name TEXT NOT NULL,
			category TEXT,
			created_at INTEGER
		);`,
		`CREATE TABLE IF NOT EXISTS categories (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL UNIQUE
		);`,
		`CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);`
	]);

	// Auto-seed if database is empty and backup file is found
	try {
		const countResult = await db.execute('SELECT COUNT(*) as count FROM transactions');
		const rowCount = Number(countResult.rows[0]?.count ?? 0);

		if (rowCount === 0) {
			const backupCandidates = [
				path.resolve(process.cwd(), 'financy_backup_1791550732875.json'),
				'/tmp/financy_backup.json'
			];

			let backupJsonStr: string | null = null;
			for (const candidate of backupCandidates) {
				if (fs.existsSync(candidate)) {
					backupJsonStr = fs.readFileSync(candidate, 'utf-8');
					break;
				}
			}

			if (backupJsonStr) {
				const backupData = JSON.parse(backupJsonStr);
				await restoreBackupData(backupData);
				console.log('Successfully seeded database from backup file.');
			}
		}
	} catch (seedErr) {
		console.warn('Initial seeding check skipped or failed:', seedErr);
	}

	isInitialized = true;
}

export async function restoreBackupData(data: {
	categories?: Category[];
	transactions?: any[];
	settings?: {
		spreadsheetId?: string;
		currencySymbol?: string;
		reconciliation?: Partial<ReconciliationState>;
	};
}) {
	const statements: { sql: string; args: any[] }[] = [];

	if (data.categories && Array.isArray(data.categories)) {
		for (const cat of data.categories) {
			statements.push({
				sql: 'INSERT OR REPLACE INTO categories (id, name) VALUES (?, ?)',
				args: [cat.id, cat.name.trim()]
			});
		}
	}

	if (data.transactions && Array.isArray(data.transactions)) {
		for (const tx of data.transactions) {
			const createdAt = tx.createdAt ?? (tx.date ? new Date(tx.date).getTime() : Date.now());
			statements.push({
				sql: `INSERT OR REPLACE INTO transactions (id, date, type, amount, name, category, created_at)
				      VALUES (?, ?, ?, ?, ?, ?, ?)`,
				args: [
					tx.id,
					tx.date,
					tx.type,
					Number(tx.amount),
					tx.name,
					tx.category || null,
					createdAt
				]
			});
		}
	}

	if (data.settings) {
		if (data.settings.spreadsheetId !== undefined) {
			statements.push({
				sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
				args: ['spreadsheet_id', data.settings.spreadsheetId]
			});
		}
		if (data.settings.currencySymbol !== undefined) {
			statements.push({
				sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
				args: ['currency_symbol', data.settings.currencySymbol]
			});
		}
		if (data.settings.reconciliation) {
			const r = data.settings.reconciliation;
			if (r.ccDebt !== undefined) {
				statements.push({
					sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
					args: ['reconcile_cc_debt', String(r.ccDebt)]
				});
			}
			if (r.hdfc !== undefined) {
				statements.push({
					sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
					args: ['reconcile_hdfc', String(r.hdfc)]
				});
			}
			if (r.kvb !== undefined) {
				statements.push({
					sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
					args: ['reconcile_kvb', String(r.kvb)]
				});
			}
			if (r.cash !== undefined) {
				statements.push({
					sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
					args: ['reconcile_cash', String(r.cash)]
				});
			}
			if (r.creditsOwed !== undefined) {
				statements.push({
					sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
					args: ['reconcile_credits_owed', String(r.creditsOwed)]
				});
			}
			if (r.lastUpdated !== undefined) {
				statements.push({
					sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
					args: ['reconcile_last_updated', String(r.lastUpdated)]
				});
			}
		}
	}

	// Batch execute in chunks of 100 statements to stay within libSQL limits
	const CHUNK_SIZE = 100;
	for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
		const chunk = statements.slice(i, i + CHUNK_SIZE);
		await db.batch(chunk);
	}
}

export async function getTransactions(filters?: {
	startDate?: string;
	endDate?: string;
	category?: string;
	type?: string;
	search?: string;
	limit?: number;
	offset?: number;
}): Promise<LocalTransaction[]> {
	await initDb();

	let sql = 'SELECT * FROM transactions WHERE 1=1';
	const args: any[] = [];

	if (filters?.startDate) {
		sql += ' AND date >= ?';
		args.push(filters.startDate);
	}
	if (filters?.endDate) {
		sql += ' AND date <= ?';
		args.push(filters.endDate);
	}
	if (filters?.category) {
		sql += ' AND category = ?';
		args.push(filters.category);
	}
	if (filters?.type) {
		sql += ' AND type = ?';
		args.push(filters.type);
	}
	if (filters?.search) {
		sql += ' AND name LIKE ?';
		args.push(`%${filters.search.trim()}%`);
	}

	sql += ' ORDER BY date DESC, COALESCE(created_at, 0) DESC, id DESC';

	if (typeof filters?.limit === 'number' && !isNaN(filters.limit) && filters.limit > 0) {
		sql += ' LIMIT ?';
		args.push(filters.limit);
		if (typeof filters?.offset === 'number' && !isNaN(filters.offset) && filters.offset >= 0) {
			sql += ' OFFSET ?';
			args.push(filters.offset);
		}
	}

	const result = await db.execute({ sql, args });

	return result.rows.map((row) => ({
		id: String(row.id),
		date: String(row.date),
		type: (row.type === 'credit' ? 'credit' : 'debit') as 'credit' | 'debit',
		amount: Number(row.amount),
		name: String(row.name),
		category: row.category ? String(row.category) : null,
		createdAt: row.created_at ? Number(row.created_at) : undefined
	}));
}

export async function saveTransaction(tx: {
	id?: string;
	date: string;
	type: 'credit' | 'debit';
	amount: number;
	name: string;
	category?: string | null;
	createdAt?: number;
}): Promise<LocalTransaction> {
	await initDb();

	const id = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
	const createdAt = tx.createdAt ?? Date.now();

	await db.execute({
		sql: `INSERT OR REPLACE INTO transactions (id, date, type, amount, name, category, created_at)
		      VALUES (?, ?, ?, ?, ?, ?, ?)`,
		args: [id, tx.date, tx.type, Number(tx.amount), tx.name.trim(), tx.category || null, createdAt]
	});

	return {
		id,
		date: tx.date,
		type: tx.type,
		amount: Number(tx.amount),
		name: tx.name.trim(),
		category: tx.category || null,
		createdAt
	};
}

export async function getExistingTransactionIds(ids: string[]): Promise<Set<string>> {
	if (!ids || ids.length === 0) return new Set();
	await initDb();

	const CHUNK_SIZE = 100;
	const existing = new Set<string>();

	for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
		const chunk = ids.slice(i, i + CHUNK_SIZE);
		const placeholders = chunk.map(() => '?').join(',');
		const result = await db.execute({
			sql: `SELECT id FROM transactions WHERE id IN (${placeholders})`,
			args: chunk
		});
		for (const row of result.rows) {
			existing.add(String(row.id));
		}
	}

	return existing;
}

export async function saveTransactionsBatch(txs: Array<{
	id?: string;
	date: string;
	type: 'credit' | 'debit';
	amount: number;
	name: string;
	category?: string | null;
	createdAt?: number;
}>): Promise<number> {
	if (!txs || txs.length === 0) return 0;
	await initDb();

	const statements = txs.map((tx) => {
		const id = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const createdAt = tx.createdAt ?? Date.now();
		return {
			sql: `INSERT OR REPLACE INTO transactions (id, date, type, amount, name, category, created_at)
			      VALUES (?, ?, ?, ?, ?, ?, ?)`,
			args: [id, tx.date, tx.type, Number(tx.amount), tx.name.trim(), tx.category || null, createdAt]
		};
	});

	const CHUNK_SIZE = 100;
	for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
		const chunk = statements.slice(i, i + CHUNK_SIZE);
		await db.batch(chunk);
	}

	return txs.length;
}

export async function deleteTransaction(id: string): Promise<void> {
	await initDb();
	await db.execute({
		sql: 'DELETE FROM transactions WHERE id = ?',
		args: [id]
	});
}

export async function getCategories(): Promise<Category[]> {
	await initDb();
	const result = await db.execute('SELECT * FROM categories ORDER BY name ASC');
	return result.rows.map((row) => ({
		id: String(row.id),
		name: String(row.name)
	}));
}

export async function saveCategory(name: string): Promise<Category> {
	await initDb();
	const trimmed = name.trim();
	const existing = await db.execute({
		sql: 'SELECT * FROM categories WHERE name = ?',
		args: [trimmed]
	});

	if (existing.rows.length > 0) {
		return {
			id: String(existing.rows[0].id),
			name: String(existing.rows[0].name)
		};
	}

	const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
	await db.execute({
		sql: 'INSERT INTO categories (id, name) VALUES (?, ?)',
		args: [id, trimmed]
	});

	return { id, name: trimmed };
}

export async function deleteCategory(id: string): Promise<void> {
	await initDb();
	await db.execute({
		sql: 'DELETE FROM categories WHERE id = ?',
		args: [id]
	});
}

export async function getSettings(): Promise<AppSettings> {
	await initDb();
	const result = await db.execute('SELECT * FROM settings');
	const map: Record<string, string> = {};
	for (const row of result.rows) {
		map[String(row.key)] = String(row.value);
	}

	return {
		spreadsheetId: map['spreadsheet_id'] || '',
		currencySymbol: map['currency_symbol'] || '₹',
		reconciliation: {
			ccDebt: map['reconcile_cc_debt'] || '0',
			hdfc: map['reconcile_hdfc'] || '0',
			kvb: map['reconcile_kvb'] || '0',
			cash: map['reconcile_cash'] || '0',
			creditsOwed: map['reconcile_credits_owed'] || '0',
			lastUpdated: map['reconcile_last_updated'] || ''
		}
	};
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
	await initDb();
	const statements: { sql: string; args: any[] }[] = [];

	if (settings.spreadsheetId !== undefined) {
		statements.push({
			sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
			args: ['spreadsheet_id', settings.spreadsheetId]
		});
	}
	if (settings.currencySymbol !== undefined) {
		statements.push({
			sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
			args: ['currency_symbol', settings.currencySymbol]
		});
	}
	if (settings.reconciliation) {
		const r = settings.reconciliation;
		if (r.ccDebt !== undefined) {
			statements.push({
				sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
				args: ['reconcile_cc_debt', String(r.ccDebt)]
			});
		}
		if (r.hdfc !== undefined) {
			statements.push({
				sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
				args: ['reconcile_hdfc', String(r.hdfc)]
			});
		}
		if (r.kvb !== undefined) {
			statements.push({
				sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
				args: ['reconcile_kvb', String(r.kvb)]
			});
		}
		if (r.cash !== undefined) {
			statements.push({
				sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
				args: ['reconcile_cash', String(r.cash)]
			});
		}
		if (r.creditsOwed !== undefined) {
			statements.push({
				sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
				args: ['reconcile_credits_owed', String(r.creditsOwed)]
			});
		}
		if (r.lastUpdated !== undefined) {
			statements.push({
				sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
				args: ['reconcile_last_updated', String(r.lastUpdated)]
			});
		}
	}

	if (statements.length > 0) {
		await db.batch(statements);
	}
}

export async function getFullBackupData() {
	await initDb();
	const [txs, cats, settings] = await Promise.all([
		getTransactions(),
		getCategories(),
		getSettings()
	]);

	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		settings,
		categories: cats,
		transactions: txs
	};
}
