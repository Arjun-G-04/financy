<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import {
		Coins,
		FileSpreadsheet,
		Tag,
		Download,
		Upload,
		Trash2,
		Plus,
		Check,
		Database
	} from '@lucide/svelte';

	let newCategoryName = $state('');
	let spreadsheetId = $state(appState.settings.spreadsheetId || '');
	let isSavingSpreadsheet = $state(false);
	let isRestoring = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		spreadsheetId = appState.settings.spreadsheetId || '';
	});

	async function handleSaveCurrency(sym: string) {
		try {
			await appState.saveSettings({ currencySymbol: sym });
			appState.showToast('success', 'Currency Updated', `Prefix set to ${sym === '₹' ? 'INR (₹)' : 'USD ($)'}`);
		} catch (err: any) {
			appState.showToast('error', 'Update Failed', err.message);
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
			appState.showToast('success', 'Settings Saved', 'Spreadsheet ID linked successfully');
		} catch (err: any) {
			appState.showToast('error', 'Save Failed', err.message);
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
			appState.showToast('success', 'Category Added', `"${trimmed}" is now available`);
		} catch (err: any) {
			appState.showToast('error', 'Failed to Add Category', err.message);
		}
	}

	async function handleDeleteCategory(id: string, name: string) {
		if (!confirm(`Delete category "${name}"?`)) return;
		try {
			await appState.deleteCategory(id);
			appState.showToast('info', 'Category Removed', name);
		} catch (err: any) {
			appState.showToast('error', 'Delete Failed', err.message);
		}
	}

	function handleDownloadBackup() {
		window.open('/api/backup', '_blank');
	}

	function handleDownloadExcel() {
		window.open('/api/export/excel', '_blank');
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

			// Reload page to re-initialize SSR state
			appState.showToast('success', 'Backup Restored', `Loaded ${result.importedTransactions} transactions`);
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} catch (err: any) {
			appState.showToast('error', 'Restore Failed', err.message);
		} finally {
			isRestoring = false;
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-zinc-100">Settings</h1>
		<p class="text-sm text-zinc-400">Configure preferences, currency, categories, and database migrations.</p>
	</div>

	<!-- Currency Configuration Card -->
	<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
		<div class="flex items-center gap-2 text-zinc-100 font-bold text-base">
			<Coins class="w-5 h-5 text-emerald-400" />
			<span>Currency Configuration</span>
		</div>
		<p class="text-xs text-zinc-400">Select your primary currency symbol for display and math.</p>

		<div class="flex items-center gap-2 max-w-xs">
			<button
				onclick={() => handleSaveCurrency('₹')}
				class="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all {appState.settings.currencySymbol === '₹'
					? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm'
					: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'}"
			>
				INR (₹)
			</button>
			<button
				onclick={() => handleSaveCurrency('$')}
				class="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all {appState.settings.currencySymbol === '$'
					? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm'
					: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'}"
			>
				USD ($)
			</button>
		</div>
	</div>

	<!-- Google Spreadsheet ID Card -->
	<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
		<div class="flex items-center gap-2 text-zinc-100 font-bold text-base">
			<FileSpreadsheet class="w-5 h-5 text-emerald-400" />
			<span>Google Spreadsheet Link</span>
		</div>
		<p class="text-xs text-zinc-400">Target Google Sheet ID containing your transaction ledger.</p>

		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
			<input
				type="text"
				placeholder="e.g. 1LYv2aGTfpGBhfAKAPeEWLfEsJFLZN88FT-e8Zo60Rhw"
				bind:value={spreadsheetId}
				class="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition-colors"
			/>
			<button
				onclick={handleSaveSpreadsheet}
				disabled={isSavingSpreadsheet}
				class="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold transition-colors disabled:opacity-50"
			>
				{isSavingSpreadsheet ? 'Saving...' : 'Save Link'}
			</button>
		</div>
	</div>

	<!-- Category Management Card -->
	<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
		<div class="flex items-center gap-2 text-zinc-100 font-bold text-base">
			<Tag class="w-5 h-5 text-emerald-400" />
			<span>Manage Categories</span>
		</div>
		<p class="text-xs text-zinc-400">Add or remove custom transaction categorization labels.</p>

		<!-- Add Category Form -->
		<form onsubmit={handleAddCategory} class="flex items-center gap-2 max-w-md">
			<input
				type="text"
				placeholder="Add category (e.g. Investment)"
				bind:value={newCategoryName}
				class="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
			/>
			<button
				type="submit"
				class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-colors"
			>
				<Plus class="w-3.5 h-3.5" />
				Add
			</button>
		</form>

		<!-- Category Pills / List -->
		<div class="flex flex-wrap gap-2 pt-2">
			{#each appState.categories as cat (cat.id)}
				<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-200">
					<span>{cat.name}</span>
					<button
						onclick={() => handleDeleteCategory(cat.id, cat.name)}
						class="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors"
						title="Delete category"
						aria-label="Delete category"
					>
						<Trash2 class="w-3 h-3" />
					</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- Database Backup & Migration Card -->
	<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
		<div class="flex items-center gap-2 text-zinc-100 font-bold text-base">
			<Database class="w-5 h-5 text-emerald-400" />
			<span>Turso SQLite Backup & Migration</span>
		</div>
		<p class="text-xs text-zinc-400">
			Extract your full database state as JSON or restore an existing backup file.
		</p>

		<div class="flex flex-wrap items-center gap-3">
			<button
				onclick={handleDownloadBackup}
				class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors"
			>
				<Download class="w-4 h-4" />
				<span>Download Full Backup (JSON)</span>
			</button>

			<label class="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700">
				<Upload class="w-4 h-4" />
				<span>{isRestoring ? 'Restoring...' : 'Restore from JSON Backup'}</span>
				<input
					type="file"
					accept=".json"
					bind:this={fileInput}
					onchange={handleFileRestore}
					class="hidden"
				/>
			</label>
		</div>
	</div>

	<!-- Export to Excel Card -->
	<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
		<div class="flex items-center gap-2 text-zinc-100 font-bold text-base">
			<FileSpreadsheet class="w-5 h-5 text-emerald-400" />
			<span>Export Ledger & Reconciliation (Excel)</span>
		</div>
		<p class="text-xs text-zinc-400">
			Download your complete multi-sheet Excel spreadsheet (.xls) with Ledger and Reconciliation formulas.
		</p>

		<button
			onclick={handleDownloadExcel}
			class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-colors"
		>
			<Download class="w-4 h-4" />
			<span>Export to Excel (.xls)</span>
		</button>
	</div>
</div>
