import type {
	LocalTransaction,
	Category,
	AppSettings,
	TabType,
	ToastMessage,
	SheetRowItem,
	SheetsSyncState,
	AssetEntry,
	AssetSnapshot,
	AssetsData
} from '#lib/types';
import { getPresetDateRange } from '#lib/utils';

export type {
	LocalTransaction,
	Category,
	AppSettings,
	TabType,
	ToastMessage,
	SheetRowItem,
	SheetsSyncState,
	AssetEntry,
	AssetSnapshot,
	AssetsData
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

	assets = $state<AssetsData>({
		entries: [],
		history: []
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

	liquidAsset = $derived<AssetEntry>({
		id: 'asset_liquid',
		name: 'Liquid',
		initial: this.netBalance,
		final: this.netBalance,
		updatedAt: Date.now()
	});

	allAssetEntries = $derived.by<AssetEntry[]>(() => {
		const custom = this.assets.entries.filter((e) => e.id !== 'asset_liquid');
		return [this.liquidAsset, ...custom];
	});

	totalAssetInitial = $derived(
		this.allAssetEntries.reduce((sum, e) => sum + (Number(e.initial) || 0), 0)
	);

	totalAssetFinal = $derived(
		this.allAssetEntries.reduce((sum, e) => sum + (Number(e.final) || 0), 0)
	);

	totalAssetDelta = $derived(this.totalAssetFinal - this.totalAssetInitial);

	totalAssetDeltaPercentage = $derived(
		this.totalAssetInitial > 0
			? ((this.totalAssetFinal - this.totalAssetInitial) / this.totalAssetInitial) * 100
			: 0
	);

	// Initialize from SSR data
	init(initialData: {
		user?: { id: string; email: string; name: string; picture?: string } | null;
		transactions: LocalTransaction[];
		categories: Category[];
		settings: AppSettings;
		assets?: AssetsData;
	}) {
		this.user = initialData.user || null;
		this.transactions = initialData.transactions || [];
		this.categories = initialData.categories || [];
		this.settings = initialData.settings || this.settings;
		this.assets = initialData.assets || { entries: [], history: [] };
		this.initSheetsSyncDates();
	}

	initSheetsSyncDates() {
		if (!this.sheetsSync.startDate || !this.sheetsSync.endDate) {
			const { start, end } = getPresetDateRange('7days');
			this.sheetsSync.startDate = start;
			this.sheetsSync.endDate = end;
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

	async refreshAssets() {
		try {
			const res = await fetch('/api/assets');
			const data = await res.json();
			if (data.success) {
				this.assets = {
					entries: data.entries || [],
					history: data.history || []
				};
			}
		} catch (err) {
			console.error('Failed to refresh assets:', err);
		}
	}

	async saveAsset(entry: { id?: string; name: string; initial: number; final: number }) {
		const now = new Date();
		const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
		const res = await fetch('/api/assets', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...entry, localDate })
		});
		const data = await res.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to save asset');
		}
		this.assets = data.assets;
		return data.entry as AssetEntry;
	}

	async deleteAsset(id: string) {
		if (id === 'asset_liquid') {
			this.showToast('info', 'System Asset', 'Liquid asset is automatically linked to ledger net balance');
			return;
		}
		const now = new Date();
		const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
		const res = await fetch(`/api/assets/${id}?localDate=${encodeURIComponent(localDate)}`, { method: 'DELETE' });
		const data = await res.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to delete asset');
		}
		this.assets = data.assets;
	}
}

export const appState = new AppState();
