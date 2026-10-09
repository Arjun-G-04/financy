import type { LocalTransaction, Category, AppSettings } from '#lib/server/db';

export type TabType = 'home' | 'history' | 'analytics' | 'reconcile' | 'import' | 'settings';

export interface ToastMessage {
	id: string;
	type: 'success' | 'error' | 'info';
	title: string;
	message?: string;
}

class AppState {
	transactions = $state<LocalTransaction[]>([]);
	categories = $state<Category[]>([]);
	settings = $state<AppSettings>({
		spreadsheetId: '',
		currencySymbol: '₹',
		reconciliation: {
			ccDebt: '0',
			hdfc: '0',
			kvb: '0',
			cash: '0',
			creditsOwed: '0',
			lastUpdated: ''
		}
	});

	activeTab = $state<TabType>('home');
	isTransactionModalOpen = $state<boolean>(false);
	editingTransaction = $state<LocalTransaction | null>(null);
	toasts = $state<ToastMessage[]>([]);
	isLoading = $state<boolean>(false);

	// Derived metrics
	totalCredit = $derived(
		this.transactions.reduce((sum, tx) => (tx.type === 'credit' ? sum + tx.amount : sum), 0)
	);

	totalDebit = $derived(
		this.transactions.reduce((sum, tx) => (tx.type === 'debit' ? sum + tx.amount : sum), 0)
	);

	netBalance = $derived(this.totalCredit - this.totalDebit);

	// Initialize from SSR data
	init(initialData: {
		transactions: LocalTransaction[];
		categories: Category[];
		settings: AppSettings;
	}) {
		this.transactions = initialData.transactions || [];
		this.categories = initialData.categories || [];
		this.settings = initialData.settings || this.settings;
	}

	showToast(type: 'success' | 'error' | 'info', title: string, message?: string) {
		const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
		this.toasts.push({ id, type, title, message });
		setTimeout(() => {
			this.toasts = this.toasts.filter((t) => t.id !== id);
		}, 4000);
	}

	async refreshTransactions(filters?: Record<string, string>) {
		try {
			const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
			const res = await fetch(`/api/transactions${query}`);
			const data = await res.json();
			if (data.success) {
				this.transactions = data.transactions;
			}
		} catch (err) {
			console.error('Failed to load transactions:', err);
		}
	}

	async saveTransaction(txData: {
		id?: string;
		date: string;
		type: 'credit' | 'debit';
		amount: number;
		name: string;
		category?: string | null;
	}) {
		const res = await fetch('/api/transactions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(txData)
		});
		const result = await res.json();
		if (!result.success) {
			throw new Error(result.error || 'Failed to save transaction');
		}

		const saved = result.transaction as LocalTransaction;
		const index = this.transactions.findIndex((t) => t.id === saved.id);
		if (index >= 0) {
			this.transactions[index] = saved;
		} else {
			this.transactions = [saved, ...this.transactions];
		}
		// Sort by date DESC
		this.transactions.sort((a, b) => b.date.localeCompare(a.date));
		return saved;
	}

	async deleteTransaction(id: string) {
		const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
		const result = await res.json();
		if (!result.success) {
			throw new Error(result.error || 'Failed to delete transaction');
		}
		this.transactions = this.transactions.filter((t) => t.id !== id);
	}

	async addCategory(name: string) {
		const res = await fetch('/api/categories', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		const result = await res.json();
		if (!result.success) {
			throw new Error(result.error || 'Failed to add category');
		}
		this.categories = [...this.categories, result.category].sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		return result.category;
	}

	async deleteCategory(id: string) {
		const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
		const result = await res.json();
		if (!result.success) {
			throw new Error(result.error || 'Failed to delete category');
		}
		this.categories = this.categories.filter((c) => c.id !== id);
	}

	async saveSettings(newSettings: Partial<AppSettings>) {
		const res = await fetch('/api/settings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newSettings)
		});
		const result = await res.json();
		if (!result.success) {
			throw new Error(result.error || 'Failed to save settings');
		}
		this.settings = result.settings;
	}
}

export const appState = new AppState();
