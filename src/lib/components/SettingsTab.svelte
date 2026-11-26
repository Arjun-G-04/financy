<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { getCategoryColor } from '#lib/utils';
	import {
		Download,
		Upload,
		Trash2,
		Plus,
		Check,
		Settings
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
			const url =
				format === 'excel'
					? `${config.url}?tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`
					: config.url;
			await downloadFile(url, filename, config.title);
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

<div class="space-y-4 sm:space-y-5">
	<!-- Top Section: Physical Instrument Faceplate -->
	<section class="hw-chassis rounded-2xl p-4 sm:p-6 lg:p-7 relative shadow-2xl space-y-4 sm:space-y-5">
		<!-- Faceplate Header -->
		<div class="flex items-center justify-between border-b border-[#292924] pb-4 px-1 sm:px-2">
			<div class="flex items-center gap-2.5 sm:gap-3">
				<Settings class="w-6 h-6 sm:w-7 sm:h-7 text-[#82b896] stroke-[2.2]" />
				<span class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
					SYSTEM CONFIGURATION & STORAGE
				</span>
			</div>
		</div>

		<!-- Currency Configuration -->
		<div class="space-y-3 pt-1">
			<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-300">
				PRIMARY CURRENCY PREFIX
			</div>
			<p class="text-xs font-mono text-stone-500">
				Base denomination symbol applied across ledger mathematical telemetry.
			</p>

			<div class="flex items-center gap-1.5 max-w-xs w-full bg-[#0c0c0a] p-1 rounded-xl border border-[#262622]">
				<button
					type="button"
					onclick={() => handleSaveCurrency('₹')}
					class="flex-1 py-2 sm:py-1.5 rounded-lg text-xs font-mono tabular-nums transition-all min-h-[40px] sm:min-h-0 flex items-center justify-center cursor-pointer {appState.settings.currencySymbol === '₹'
						? 'bg-[#22221e] text-[#f5f2ea] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
						: 'text-stone-400 hover:text-stone-200 hover:bg-[#181815]'}"
				>
					INR (₹)
				</button>
				<button
					type="button"
					onclick={() => handleSaveCurrency('$')}
					class="flex-1 py-2 sm:py-1.5 rounded-lg text-xs font-mono tabular-nums transition-all min-h-[40px] sm:min-h-0 flex items-center justify-center cursor-pointer {appState.settings.currencySymbol === '$'
						? 'bg-[#22221e] text-[#f5f2ea] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
						: 'text-stone-400 hover:text-stone-200 hover:bg-[#181815]'}"
				>
					USD ($)
				</button>
			</div>
		</div>
	</section>

	<!-- Google Spreadsheet ID Card -->
	<section class="hw-chassis p-5 sm:p-6 rounded-2xl border border-[#292924] space-y-3.5 shadow-xl">
		<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
			GOOGLE SPREADSHEET INTEGRATION
		</div>
		<p class="text-xs font-mono text-stone-500">
			Linked Google Sheet document ID for bidirectional operational sync.
		</p>

		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-2xl pt-1">
			<input
				type="text"
				placeholder="1LYv2aGTfpGBhfAK..."
				bind:value={spreadsheetId}
				class="flex-1 px-3.5 py-2.5 sm:py-2 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
			/>
			<button
				type="button"
				onclick={handleSaveSpreadsheet}
				disabled={isSavingSpreadsheet}
				class="hw-keycap-primary px-5 py-2.5 sm:py-2 text-xs font-mono font-bold tracking-wider cursor-pointer shadow-md disabled:opacity-50 min-h-[42px] sm:min-h-[38px] flex items-center justify-center"
			>
				{isSavingSpreadsheet ? 'SAVING...' : 'LINK SPREADSHEET'}
			</button>
		</div>
	</section>

	<!-- Category Management Card -->
	<section class="hw-chassis p-5 sm:p-6 rounded-2xl border border-[#292924] space-y-4 shadow-xl">
		<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
			LEDGER TAXONOMY & CATEGORIES
		</div>
		<p class="text-xs font-mono text-stone-500">
			Account classifications for debits, credits, and capital allocation.
		</p>

		<form onsubmit={handleAddCategory} class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-md pt-1">
			<input
				type="text"
				placeholder="New category label..."
				bind:value={newCategoryName}
				class="flex-1 px-3.5 py-2.5 sm:py-2 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
			/>
			<button
				type="submit"
				class="hw-keycap-primary px-5 py-2.5 sm:py-2 text-xs font-mono font-bold tracking-wider cursor-pointer shadow-md min-h-[42px] sm:min-h-[38px] flex items-center justify-center shrink-0"
			>
				ADD CATEGORY
			</button>
		</form>

		<div class="flex flex-wrap gap-2 pt-1">
			{#each appState.categories as cat (cat.id)}
				<div class="hw-keycap inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-mono text-stone-200 min-h-[36px] sm:min-h-0 shadow-xs">
					<span class="w-2 h-2 rounded-full shrink-0" style="background-color: {getCategoryColor(cat.name)};"></span>
					<span class="font-bold">{cat.name}</span>
					<button
						type="button"
						onclick={() => handleDeleteCategory(cat.id, cat.name)}
						class="text-stone-500 hover:text-[#e06c75] transition-colors p-1 cursor-pointer"
						title="Delete"
						aria-label="Delete {cat.name}"
					>
						<Trash2 class="w-3.5 h-3.5" />
					</button>
				</div>
			{/each}
		</div>
	</section>

	<!-- Database Backup & Migration Card -->
	<section class="hw-chassis p-5 sm:p-6 rounded-2xl border border-[#292924] space-y-4 shadow-xl">
		<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
			TURSO DATABASE STORAGE & EXPORTS
		</div>
		<p class="text-xs font-mono text-stone-500">
			Sovereign Turso libSQL records can be dumped or restored as encrypted snapshots.
		</p>

		<div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 pt-1">
			<button
				type="button"
				onclick={() => handleExport('backup')}
				disabled={activeExport !== null}
				class="hw-keycap flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono text-stone-200 cursor-pointer shadow-sm min-h-[42px] sm:min-h-[38px] disabled:opacity-50"
			>
				<Download class="w-3.5 h-3.5 text-[#f97316]" />
				<span>{activeExport === 'backup' ? 'EXPORTING...' : 'DOWNLOAD JSON BACKUP'}</span>
			</button>

			<label class="hw-keycap cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono text-stone-200 shadow-sm min-h-[42px] sm:min-h-[38px]">
				<Upload class="w-3.5 h-3.5 text-[#82b896]" />
				<span>{isRestoring ? 'RESTORING...' : 'RESTORE JSON BACKUP'}</span>
				<input
					type="file"
					accept=".json"
					bind:this={fileInput}
					onchange={handleFileRestore}
					class="hidden"
				/>
			</label>

			<button
				type="button"
				onclick={() => handleExport('excel')}
				disabled={activeExport !== null}
				class="hw-keycap flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono text-stone-200 cursor-pointer shadow-sm min-h-[42px] sm:min-h-[38px] disabled:opacity-50"
			>
				<Download class="w-3.5 h-3.5 text-stone-400" />
				<span>{activeExport === 'excel' ? 'EXPORTING...' : 'EXPORT EXCEL (.XLS)'}</span>
			</button>

			<button
				type="button"
				onclick={() => handleExport('csv')}
				disabled={activeExport !== null}
				class="hw-keycap flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono text-stone-200 cursor-pointer shadow-sm min-h-[42px] sm:min-h-[38px] disabled:opacity-50"
			>
				<Download class="w-3.5 h-3.5 text-stone-400" />
				<span>{activeExport === 'csv' ? 'EXPORTING...' : 'EXPORT CSV (.CSV)'}</span>
			</button>
		</div>
	</section>

	<!-- User Session Card -->
	<section class="hw-chassis p-5 sm:p-6 rounded-2xl border border-[#292924] space-y-3.5 shadow-xl">
		<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
			AUTHENTICATED OPERATOR SESSION
		</div>
		<div class="flex items-center justify-between gap-4 pt-1">
			<div class="min-w-0">
				<div class="text-sm font-mono font-bold text-stone-200 truncate">{appState.user?.name || 'Authorized Account'}</div>
				<div class="text-xs text-stone-500 font-mono truncate">{appState.user?.email || 'Protected Session'}</div>
			</div>

			<a
				href="/auth/logout"
				class="hw-keycap px-4 py-2 rounded-lg text-stone-400 hover:text-rose-400 hover:border-rose-900/50 font-mono text-xs transition-colors min-h-[40px] sm:min-h-0 flex items-center shrink-0 cursor-pointer shadow-sm"
			>
				SIGN OUT
			</a>
		</div>
	</section>
</div>
