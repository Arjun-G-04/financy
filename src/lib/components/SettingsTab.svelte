<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { getCategoryColor } from '#lib/utils';
	import {
		Download,
		Upload,
		Trash2,
		Plus,
		Check
	} from '@lucide/svelte';

	let newCategoryName = $state('');
	let spreadsheetId = $state(appState.settings.spreadsheetId || '');
	let isSavingSpreadsheet = $state(false);
	let isRestoring = $state(false);
	type ExportFormat = 'backup' | 'excel' | 'csv';
	let activeExport = $state<ExportFormat | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	const EXPORT_CONFIG: Record<ExportFormat, { url: string; ext: string; title: string; checkEmpty?: boolean }> = {
		backup: { url: '/api/backup', ext: 'json', title: 'Financy Backup' },
		excel: { url: '/api/export/excel', ext: 'xls', title: 'Excel Ledger', checkEmpty: true },
		csv: { url: '/api/export/csv', ext: 'csv', title: 'CSV Ledger', checkEmpty: true }
	};

	$effect(() => {
		spreadsheetId = appState.settings.spreadsheetId || '';
	});

	async function handleSaveCurrency(sym: string) {
		try {
			await appState.saveSettings({ currencySymbol: sym });
			appState.showToast('success', 'Currency Updated', `Prefix set to ${sym}`);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Update failed';
			appState.showToast('error', 'Update Failed', message);
		}
	}

	async function handleSaveSpreadsheet() {
		if (!spreadsheetId.trim()) {
			appState.showToast('error', 'Validation Error', 'Spreadsheet ID cannot be empty');
			return;
		}
		isSavingSpreadsheet = true;
		try {
			await appState.saveSettings({ spreadsheetId: spreadsheetId.trim() });
			appState.showToast('success', 'Settings Saved', 'Spreadsheet linked');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Save failed';
			appState.showToast('error', 'Save Failed', message);
		} finally {
			isSavingSpreadsheet = false;
		}
	}

	async function handleAddCategory(e: Event) {
		e.preventDefault();
		const trimmed = newCategoryName.trim();
		if (!trimmed) {
			appState.showToast('error', 'Validation Error', 'Category name cannot be empty');
			return;
		}
		if (appState.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
			appState.showToast('error', 'Validation Error', 'Category already exists');
			return;
		}

		try {
			await appState.addCategory(trimmed);
			newCategoryName = '';
			appState.showToast('success', 'Category Added', `"${trimmed}"`);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Add failed';
			appState.showToast('error', 'Failed', message);
		}
	}

	async function handleDeleteCategory(id: string, name: string) {
		if (!confirm(`Delete category "${name}"?`)) return;
		try {
			await appState.deleteCategory(id);
			appState.showToast('info', 'Deleted', name);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Delete failed';
			appState.showToast('error', 'Delete Failed', message);
		}
	}

	async function downloadFile(url: string, filename: string, title: string) {
		const res = await fetch(url);
		if (!res.ok) {
			const errData = await res.json().catch(() => ({}));
			throw new Error(errData.error || 'Export request failed');
		}
		const blob = await res.blob();
		const objectUrl = URL.createObjectURL(blob);
		try {
			const a = document.createElement('a');
			a.href = objectUrl;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} finally {
			setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
		}
		appState.showToast('success', 'Exported', `${title} downloaded`);
	}

	async function handleExport(format: ExportFormat) {
		const config = EXPORT_CONFIG[format];
		if (config.checkEmpty && appState.transactions.length === 0) {
			appState.showToast('info', 'Export Info', 'No transactions in ledger to export');
			return;
		}

		activeExport = format;
		try {
			const filename = `financy_${format}_${Date.now()}.${config.ext}`;
			await downloadFile(config.url, filename, config.title);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Export failed';
			appState.showToast('error', 'Export Failed', message);
		} finally {
			activeExport = null;
		}
	}

	async function handleFileRestore(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isRestoring = true;
		try {
			const text = await file.text();
			const data = JSON.parse(text);

			const res = await fetch('/api/backup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
			const result = await res.json();
			if (!result.success) {
				throw new Error(result.error || 'Restore failed');
			}

			appState.showToast('success', 'Restored', `Loaded ${result.importedTransactions} transactions`);
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Restore failed';
			appState.showToast('error', 'Restore Failed', message);
		} finally {
			isRestoring = false;
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<div class="space-y-5 sm:space-y-6">
	<!-- Page Header -->
	<div class="border-b border-stone-800/80 pb-4">
		<div class="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-500 uppercase">System</div>
		<h1 class="text-xl sm:text-2xl font-serif tracking-tight text-[#f5f2ea] mt-0.5">Configuration & Storage</h1>
	</div>

	<!-- Currency Configuration Card -->
	<div class="p-4 sm:p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3">
		<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">Primary Currency</div>
		<p class="text-xs text-stone-500">Select base denomination symbol for ledger math.</p>

		<div class="flex items-center gap-2 max-w-xs w-full">
			<button
				onclick={() => handleSaveCurrency('₹')}
				class="flex-1 py-2 sm:py-1.5 rounded-lg border text-xs font-mono tabular-nums transition-all min-h-[40px] sm:min-h-0 flex items-center justify-center {appState.settings.currencySymbol === '₹'
					? 'bg-[#22211e] text-[#f5f2ea] border-stone-700 shadow-sm font-semibold'
					: 'bg-[#111110] text-stone-400 border-stone-800 hover:text-stone-200'}"
			>
				INR (₹)
			</button>
			<button
				onclick={() => handleSaveCurrency('$')}
				class="flex-1 py-2 sm:py-1.5 rounded-lg border text-xs font-mono tabular-nums transition-all min-h-[40px] sm:min-h-0 flex items-center justify-center {appState.settings.currencySymbol === '$'
					? 'bg-[#22211e] text-[#f5f2ea] border-stone-700 shadow-sm font-semibold'
					: 'bg-[#111110] text-stone-400 border-stone-800 hover:text-stone-200'}"
			>
				USD ($)
			</button>
		</div>
	</div>

	<!-- Google Spreadsheet ID Card -->
	<div class="p-4 sm:p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3">
		<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">Google Spreadsheet Integration</div>
		<p class="text-xs text-stone-500">Linked Google Sheet ID for bidirectional transaction sync.</p>

		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
			<input
				type="text"
				placeholder="1LYv2aGTfpGBhfAK..."
				bind:value={spreadsheetId}
				class="flex-1 px-3 py-2.5 sm:py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-base sm:text-xs font-mono focus:outline-none focus:border-stone-600 transition-colors"
			/>
			<button
				onclick={handleSaveSpreadsheet}
				disabled={isSavingSpreadsheet}
				class="px-4 py-2.5 sm:py-1.5 rounded-lg bg-[#eeebe3] active:scale-95 hover:bg-white text-[#111110] text-xs font-semibold transition-all disabled:opacity-50 min-h-[40px] sm:min-h-0 shadow-sm"
			>
				{isSavingSpreadsheet ? 'Saving...' : 'Link Sheet'}
			</button>
		</div>
	</div>

	<!-- Category Management Card -->
	<div class="p-4 sm:p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3">
		<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">Ledger Categories</div>
		<p class="text-xs text-stone-500">Taxonomy for operational debits and credits.</p>

		<form onsubmit={handleAddCategory} class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-sm">
			<input
				type="text"
				placeholder="New category..."
				bind:value={newCategoryName}
				class="flex-1 px-3 py-2.5 sm:py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-base sm:text-xs focus:outline-none focus:border-stone-600 transition-colors"
			/>
			<button
				type="submit"
				class="px-4 py-2.5 sm:py-1.5 rounded-lg bg-[#eeebe3] active:scale-95 hover:bg-white text-[#111110] text-xs font-semibold transition-all min-h-[40px] sm:min-h-0 shadow-sm flex items-center justify-center"
			>
				Add Category
			</button>
		</form>

		<div class="flex flex-wrap gap-1.5 pt-1">
			{#each appState.categories as cat (cat.id)}
				<div class="inline-flex items-center gap-2 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#111110] border border-stone-800 text-xs text-stone-300 min-h-[32px] sm:min-h-0">
					<span class="w-2 h-2 rounded-full shrink-0" style="background-color: {getCategoryColor(cat.name)};"></span>
					<span>{cat.name}</span>
					<button
						onclick={() => handleDeleteCategory(cat.id, cat.name)}
						class="text-stone-500 hover:text-rose-400 transition-colors p-1"
						title="Delete"
						aria-label="Delete {cat.name}"
					>
						<Trash2 class="w-3.5 h-3.5" />
					</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- Database Backup & Migration Card -->
	<div class="p-4 sm:p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3">
		<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">Database Storage & Exports</div>
		<p class="text-xs text-stone-500">
			Encrypted Turso libSQL records can be dumped or restored as JSON.
		</p>

		<div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 pt-1">
			<button
				onclick={() => handleExport('backup')}
				disabled={activeExport !== null}
				class="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-1.5 rounded-lg bg-[#1f1e1b] hover:bg-[#252420] text-stone-200 border border-stone-700/80 text-xs transition-colors min-h-[40px] sm:min-h-0 disabled:opacity-50"
			>
				<Download class="w-3.5 h-3.5" />
				<span>{activeExport === 'backup' ? 'Exporting...' : 'Download JSON Backup'}</span>
			</button>

			<label class="cursor-pointer flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-1.5 rounded-lg bg-[#1f1e1b] hover:bg-[#252420] text-stone-200 border border-stone-700/80 text-xs transition-colors min-h-[40px] sm:min-h-0">
				<Upload class="w-3.5 h-3.5" />
				<span>{isRestoring ? 'Restoring...' : 'Restore JSON Backup'}</span>
				<input
					type="file"
					accept=".json"
					bind:this={fileInput}
					onchange={handleFileRestore}
					class="hidden"
				/>
			</label>

			<button
				onclick={() => handleExport('excel')}
				disabled={activeExport !== null}
				class="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-1.5 rounded-lg bg-[#1f1e1b] hover:bg-[#252420] text-stone-200 border border-stone-700/80 text-xs transition-colors min-h-[40px] sm:min-h-0 disabled:opacity-50"
			>
				<Download class="w-3.5 h-3.5" />
				<span>{activeExport === 'excel' ? 'Exporting...' : 'Export Excel (.xls)'}</span>
			</button>

			<button
				onclick={() => handleExport('csv')}
				disabled={activeExport !== null}
				class="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-1.5 rounded-lg bg-[#1f1e1b] hover:bg-[#252420] text-stone-200 border border-stone-700/80 text-xs transition-colors min-h-[40px] sm:min-h-0 disabled:opacity-50"
			>
				<Download class="w-3.5 h-3.5" />
				<span>{activeExport === 'csv' ? 'Exporting...' : 'Export CSV (.csv)'}</span>
			</button>
		</div>
	</div>

	<!-- User Session Card -->
	<div class="p-4 sm:p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3">
		<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">Authenticated Account</div>
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<div class="text-sm font-medium text-stone-200 truncate">{appState.user?.name || 'Authorized Account'}</div>
				<div class="text-xs text-stone-500 font-mono truncate">{appState.user?.email || 'Protected Session'}</div>
			</div>

			<a
				href="/auth/logout"
				class="px-3.5 py-2 sm:py-1.5 rounded-lg bg-[#22211e] hover:bg-rose-950/40 text-stone-300 hover:text-rose-300 border border-stone-800 hover:border-rose-800/50 text-xs transition-colors min-h-[38px] sm:min-h-0 flex items-center shrink-0"
			>
				Sign Out
			</a>
		</div>
	</div>
</div>
