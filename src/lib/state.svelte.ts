import type {
	LocalTransaction,
	Category,
	AppSettings,
	TabType,
	ToastMessage,
	SheetRowItem,
	SheetsSyncState
} from '#lib/types';

export type {
	LocalTransaction,
	Category,
	AppSettings,
	TabType,
	ToastMessage,
	SheetRowItem,
	SheetsSyncState
};

export interface SheetReviewContext {
	transaction: SheetRowItem;
	onConfirm: (item: {
		id: string;
		name: string;
		amount: number;
		type: 'credit' | 'debit';
		date: string;
		category: string | null;
	}) => Promise<void>;
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

	sheetsSync = $state<SheetsSyncState>({
		startDate: '',
		endDate: '',
		isLoading: false,
		result: null
	});

	user = $state<{ id: string; email: string; name: string; picture?: string } | null>(null);
	activeTab = $state<TabType>('home');
	isTransactionModalOpen = $state<boolean>(false);
	editingTransaction = $state<LocalTransaction | null>(null);
	sheetReviewContext = $state<SheetReviewContext | null>(null);
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
		user?: { id: string; email: string; name: string; picture?: string } | null;
		transactions: LocalTransaction[];
		categories: Category[];
		settings: AppSettings;
	}) {
		this.user = initialData.user || null;
		this.transactions = initialData.transactions || [];
		this.categories = initialData.categories || [];
		this.settings = initialData.settings || this.settings;
		this.initSheetsSyncDates();
	}

	initSheetsSyncDates() {
		if (!this.sheetsSync.startDate || !this.sheetsSync.endDate) {
			const now = new Date();
			const y = now.getFullYear();
			const m = String(now.getMonth() + 1).padStart(2, '0');
			const d = String(now.getDate()).padStart(2, '0');
			this.sheetsSync.startDate = `${y}-${m}-01`;
			this.sheetsSync.endDate = `${y}-${m}-${d}`;
		}
	}

	openTransactionModal(tx?: LocalTransaction | null) {
		this.sheetReviewContext = null;
		this.editingTransaction = tx || null;
		this.isTransactionModalOpen = true;
	}

	openSheetReviewModal(
		tx: SheetRowItem,
		onConfirm: (item: {
			id: string;
			name: string;
			amount: number;
			type: 'credit' | 'debit';
			date: string;
			category: string | null;
		}) => Promise<void>
	) {
		this.editingTransaction = null;
		this.sheetReviewContext = { transaction: tx, onConfirm };
		this.isTransactionModalOpen = true;
	}

	closeTransactionModal() {
		this.isTransactionModalOpen = false;
		this.editingTransaction = null;
		this.sheetReviewContext = null;
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
				// Sync alreadyImported flags if sheets sync result exists
				if (this.sheetsSync.result) {
					const txIdSet = new Set(this.transactions.map((t) => t.id));
					this.sheetsSync.result.transactions = this.sheetsSync.result.transactions.map((t) => ({
						...t,
						alreadyImported: t.alreadyImported || txIdSet.has(t.id)
					}));
				}
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
