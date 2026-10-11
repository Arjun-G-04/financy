export type TabType = 'home' | 'history' | 'analytics' | 'reconcile' | 'import' | 'settings';

export interface LocalTransaction {
	id: string;
	date: string; // YYYY-MM-DD
	type: 'credit' | 'debit';
	amount: number;
	name: string;
	category?: string | null;
	createdAt?: number;
}

export interface Category {
	id: string;
	name: string;
}

export interface ReconciliationState {
	ccDebt: string;
	hdfc: string;
	kvb: string;
	cash: string;
	creditsOwed: string;
	lastUpdated: string;
}

export interface AppSettings {
	spreadsheetId: string;
	currencySymbol: string;
	reconciliation: ReconciliationState;
}

export interface SheetRowItem {
	id: string;
	rawDate: string;
	date: string;
	type: 'credit' | 'debit';
	amount: number;
	merchant: string;
	raw: string;
	alreadyImported: boolean;
}

export interface SheetsSyncState {
	startDate: string;
	endDate: string;
	isLoading: boolean;
	result: {
		title: string;
		sheetTitle?: string;
		transactions: SheetRowItem[];
	} | null;
}

export interface ToastMessage {
	id: string;
	type: 'success' | 'error' | 'info';
	title: string;
	message?: string;
}

export interface SheetTransaction {
	id: string;
	rawDate: string;
	date: string;
	type: 'credit' | 'debit';
	amount: number;
	merchant: string;
	raw: string;
}

export interface SheetFetchResult {
	spreadsheetTitle: string;
	sheetTitle: string;
	transactions: SheetTransaction[];
}
