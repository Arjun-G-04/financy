<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import DatePicker from '#lib/components/DatePicker.svelte';
	import { formatCurrency, suggestCategory } from '#lib/utils';
	import {
		RefreshCw,
		Download,
		Check,
		ExternalLink,
		FileSpreadsheet,
		Calendar,
		ShieldCheck,
		ArrowUpRight,
		ArrowDownLeft,
		Settings,
		Pencil
	} from '@lucide/svelte';

	import type { SheetRowItem } from '#lib/types';

	let isImporting = $state(false);

	appState.initSheetsSyncDates();

	const newTransactions = $derived(
		appState.sheetsSync.result?.transactions.filter((t) => !t.alreadyImported) || []
	);

	const hasConfiguredSheet = $derived(
		Boolean(appState.settings.spreadsheetId && appState.settings.spreadsheetId.trim())
	);

	function setPreset(preset: '7days' | 'month' | '30days' | 'all') {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		const todayStr = `${y}-${m}-${d}`;

		if (preset === '7days') {
			const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const py = past.getFullYear();
			const pm = String(past.getMonth() + 1).padStart(2, '0');
			const pd = String(past.getDate()).padStart(2, '0');
			appState.sheetsSync.startDate = `${py}-${pm}-${pd}`;
			appState.sheetsSync.endDate = todayStr;
		} else if (preset === 'month') {
			appState.sheetsSync.startDate = `${y}-${m}-01`;
			appState.sheetsSync.endDate = todayStr;
		} else if (preset === '30days') {
			const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
			const py = past.getFullYear();
			const pm = String(past.getMonth() + 1).padStart(2, '0');
			const pd = String(past.getDate()).padStart(2, '0');
			appState.sheetsSync.startDate = `${py}-${pm}-${pd}`;
			appState.sheetsSync.endDate = todayStr;
		} else if (preset === 'all') {
			appState.sheetsSync.startDate = '';
			appState.sheetsSync.endDate = '';
		}
	}

	async function handleFetch() {
		const spreadsheetId = appState.settings.spreadsheetId?.trim();
		if (!spreadsheetId) {
			appState.showToast('error', 'Spreadsheet Missing', 'Link a spreadsheet in Settings first');
			appState.activeTab = 'settings';
			return;
		}

		appState.sheetsSync.isLoading = true;
		try {
			const res = await fetch('/api/sheets/fetch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					spreadsheetId,
					startDate: appState.sheetsSync.startDate || undefined,
					endDate: appState.sheetsSync.endDate || undefined
				})
			});
			const data = await res.json();
			if (!data.success) {
				throw new Error(data.error || 'Failed to fetch sheet data');
			}

			appState.sheetsSync.result = data;
			const uncommittedCount = data.transactions.filter((t: any) => !t.alreadyImported).length;
			appState.showToast(
				'success',
				'Synced with Google Sheets',
				`Found ${data.transactions.length} rows (${uncommittedCount} uncommitted)`
			);
		} catch (err: any) {
			console.error('Fetch error:', err);
			appState.showToast('error', 'Sync Failed', err.message);
		} finally {
			appState.sheetsSync.isLoading = false;
		}
	}

	async function handleImportAll() {
		if (!newTransactions.length) {
			appState.showToast('info', 'Notice', 'No uncommitted records to import');
			return;
		}

		isImporting = true;
		try {
			const defaultCat = appState.categories[0]?.name || 'General';

			const payload = newTransactions.map((tx) => {
				const suggested = suggestCategory(`${tx.merchant} ${tx.raw || ''}`, appState.categories);
				return {
					id: tx.id,
					date: tx.date,
					type: tx.type,
					amount: tx.amount,
					name: tx.merchant,
					category: suggested || defaultCat
				};
			});

			const res = await fetch('/api/sheets/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transactions: payload })
			});
			const data = await res.json();
			if (!data.success) {
				throw new Error(data.error || 'Import failed');
			}

			appState.showToast('success', 'Committed to Ledger', `Imported ${data.count} records`);
			await appState.refreshTransactions();

			if (appState.sheetsSync.result) {
				appState.sheetsSync.result.transactions = appState.sheetsSync.result.transactions.map((t) => ({
					...t,
					alreadyImported: true
				}));
			}
		} catch (err: any) {
			appState.showToast('error', 'Import Failed', err.message);
		} finally {
			isImporting = false;
		}
	}

	function handleOpenImportModal(tx: SheetRowItem) {
		if (tx.alreadyImported) return;
		appState.openSheetReviewModal(tx, handleConfirmImport);
	}

	async function handleConfirmImport(customized: {
		id: string;
		name: string;
		amount: number;
		type: 'credit' | 'debit';
		date: string;
		category: string | null;
	}) {
		const res = await fetch('/api/sheets/import', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				transactions: [customized]
			})
		});
		const data = await res.json();
		if (!data.success) throw new Error(data.error || 'Failed to save to ledger');

		appState.showToast('success', 'Imported to Ledger', `Committed "${customized.name}"`);
		await appState.refreshTransactions();

		if (appState.sheetsSync.result) {
			appState.sheetsSync.result.transactions = appState.sheetsSync.result.transactions.map((t) =>
				t.id === customized.id ? { ...t, alreadyImported: true } : t
			);
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="border-b border-stone-800/80 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
		<div>
			<div class="text-[11px] font-medium tracking-wider text-stone-500 uppercase">External Sync</div>
			<h1 class="text-2xl font-serif tracking-tight text-[#f5f2ea] mt-0.5">Google Sheets Pipeline</h1>
		</div>

		<!-- Status Pills -->
		<div class="flex items-center gap-2 flex-wrap">
			{#if hasConfiguredSheet}
				<a
					href="https://docs.google.com/spreadsheets/d/{appState.settings.spreadsheetId.trim()}"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171715] hover:bg-[#232320] border border-stone-800 text-[11px] font-mono text-stone-300 hover:text-stone-100 transition-colors"
					title="Open linked Google Sheet"
				>
					<FileSpreadsheet class="w-3.5 h-3.5 text-[#82b896]" />
					<span>Linked Sheet</span>
					<ExternalLink class="w-3 h-3 text-stone-500" />
				</a>
			{:else}
				<button
					type="button"
					onclick={() => (appState.activeTab = 'settings')}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#221c17] hover:bg-[#2e251e] border border-amber-900/60 text-[11px] font-mono text-amber-300 transition-colors"
				>
					<Settings class="w-3.5 h-3.5" />
					<span>Configure in Settings</span>
				</button>
			{/if}

			<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171715] border border-stone-800 text-[11px] font-mono">
				<ShieldCheck class="w-3.5 h-3.5 text-[#82b896]" />
				<span class="text-stone-300 truncate max-w-[200px]">{appState.user?.email || 'OAuth Session'}</span>
				<span class="inline-block w-1.5 h-1.5 rounded-full bg-[#82b896]"></span>
			</div>
		</div>
	</div>

	<!-- Controls Card -->
	<div class="p-5 rounded-2xl bg-[#171715] border border-stone-800/80 space-y-4 shadow-sm">
		<!-- Date Range Filters & Presets -->
		<div class="space-y-3">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
				<div class="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
					<Calendar class="w-3.5 h-3.5 text-stone-500" />
					<span>Query Window</span>
				</div>

				<!-- Quick Presets -->
				<div class="flex items-center gap-1.5 flex-wrap">
					<button
						type="button"
						onclick={() => setPreset('7days')}
						class="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#111110] hover:bg-[#232320] border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
					>
						Last 7 Days
					</button>
					<button
						type="button"
						onclick={() => setPreset('month')}
						class="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#111110] hover:bg-[#232320] border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
					>
						This Month
					</button>
					<button
						type="button"
						onclick={() => setPreset('30days')}
						class="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#111110] hover:bg-[#232320] border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
					>
						Last 30 Days
					</button>
					<button
						type="button"
						onclick={() => setPreset('all')}
						class="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#111110] hover:bg-[#232320] border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
					>
						All Rows
					</button>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div>
					<DatePicker
						bind:value={appState.sheetsSync.startDate}
						label="From Date"
						placeholder="Start date"
					/>
				</div>

				<div>
					<DatePicker
						bind:value={appState.sheetsSync.endDate}
						label="To Date"
						placeholder="End date"
					/>
				</div>
			</div>
		</div>

		<!-- Action Trigger -->
		<div class="pt-3 border-t border-stone-800/60 flex items-center justify-end">
			<button
				type="button"
				onclick={handleFetch}
				disabled={appState.sheetsSync.isLoading}
				class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#eeebe3] hover:bg-white text-[#111110] text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
			>
				<RefreshCw class="w-3.5 h-3.5 {appState.sheetsSync.isLoading ? 'animate-spin' : ''}" />
				<span>{appState.sheetsSync.isLoading ? 'Querying Google Sheets...' : 'Fetch Sheet Rows'}</span>
			</button>
		</div>
	</div>

	<!-- Fetched Results Table -->
	{#if appState.sheetsSync.result}
		<div class="p-5 rounded-2xl bg-[#171715] border border-stone-800/80 space-y-4 shadow-sm">
			<!-- Table Header & Batch Action -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
				<div>
					<div class="text-sm font-semibold text-[#f5f2ea] flex items-center gap-2">
						<span>{appState.sheetsSync.result.title}</span>
						{#if appState.sheetsSync.result.sheetTitle}
							<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#111110] text-stone-400 border border-stone-800">
								Tab: {appState.sheetsSync.result.sheetTitle}
							</span>
						{/if}
					</div>
					<div class="text-xs text-stone-500 font-mono mt-0.5">
						{appState.sheetsSync.result.transactions.length} rows scanned •
						<span class="text-[#82b896] font-semibold">{newTransactions.length} uncommitted</span> •
						<span class="text-stone-500">{appState.sheetsSync.result.transactions.length - newTransactions.length} in ledger</span>
					</div>
				</div>

				<button
					type="button"
					onclick={handleImportAll}
					disabled={isImporting || newTransactions.length === 0}
					class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#eeebe3] hover:bg-white text-[#111110] text-xs font-semibold transition-all disabled:opacity-40 shadow-sm"
				>
					<Download class="w-3.5 h-3.5 {isImporting ? 'animate-bounce' : ''}" />
					<span>{isImporting ? 'Committing...' : `Commit All New (${newTransactions.length})`}</span>
				</button>
			</div>

			<!-- Rows List -->
			{#if appState.sheetsSync.result.transactions.length === 0}
				<div class="text-center py-10 text-stone-500 text-xs font-mono">
					No transactions found in this date window on Google Sheets.
				</div>
			{:else}
				<div class="border border-stone-800/80 rounded-xl overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead class="bg-[#141412] border-b border-stone-800 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
							<tr>
								<th class="px-3.5 py-2.5">Status</th>
								<th class="px-3.5 py-2.5">Date</th>
								<th class="px-3.5 py-2.5">Description</th>
								<th class="px-3.5 py-2.5 text-right">Amount</th>
								<th class="px-3.5 py-2.5 text-right">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-stone-800/60">
							{#each appState.sheetsSync.result.transactions as tx (tx.id)}
								<tr
									onclick={() => handleOpenImportModal(tx)}
									class="hover:bg-[#1a1917] transition-colors {tx.alreadyImported
										? 'opacity-55'
										: 'cursor-pointer'}"
								>
									<!-- Status Badge -->
									<td class="px-3.5 py-2.5 whitespace-nowrap">
										{#if tx.alreadyImported}
											<span class="inline-flex items-center gap-1 text-[10px] font-mono text-stone-500 px-2 py-0.5 rounded bg-[#111110] border border-stone-800">
												<Check class="w-2.5 h-2.5 text-[#82b896]" />
												<span>IN LEDGER</span>
											</span>
										{:else}
											<span class="inline-flex items-center gap-1 text-[10px] font-mono text-[#82b896] px-2 py-0.5 rounded bg-[#82b896]/10 border border-[#82b896]/20 font-semibold">
												<span>NEW</span>
											</span>
										{/if}
									</td>

									<!-- Date -->
									<td class="px-3.5 py-2.5 whitespace-nowrap text-stone-400 font-mono tabular-nums">
										{tx.date}
									</td>

									<!-- Description -->
									<td class="px-3.5 py-2.5 text-stone-200">
										<div class="font-medium">{tx.merchant}</div>
										{#if tx.raw && tx.raw !== tx.merchant}
											<div class="text-[10px] text-stone-500 font-mono truncate max-w-xs">{tx.raw}</div>
										{/if}
									</td>

									<!-- Amount -->
									<td class="px-3.5 py-2.5 whitespace-nowrap text-right font-mono tabular-nums font-semibold {tx.type === 'credit' ? 'text-[#82b896]' : 'text-[#e06c75]'}">
										{formatCurrency(tx.amount)}
									</td>

									<!-- Action -->
									<td class="px-3.5 py-2.5 whitespace-nowrap text-right">
										{#if tx.alreadyImported}
											<span class="text-[11px] text-stone-500 font-mono">Synced</span>
										{:else}
											<button
												type="button"
												onclick={(e) => {
													e.stopPropagation();
													handleOpenImportModal(tx);
												}}
												class="px-2.5 py-1 rounded-md bg-[#232320] hover:bg-[#eeebe3] hover:text-[#111110] text-stone-200 text-[11px] font-mono transition-colors border border-stone-700/60 inline-flex items-center gap-1"
											>
												<Pencil class="w-3 h-3" />
												<span>Edit & Import</span>
											</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>
