<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import DateRangeFilter from '#lib/components/DateRangeFilter.svelte';
	import { formatCurrency } from '#lib/utils';
	import {
		RefreshCw,
		Check,
		Pencil
	} from '@lucide/svelte';

	import type { SheetRowItem } from '#lib/types';

	appState.initSheetsSyncDates();

	function formatAmount(val: number) {
		return formatCurrency(val, appState.settings.currencySymbol);
	}

	const newTransactions = $derived(
		appState.sheetsSync.result?.transactions.filter((t) => !t.alreadyImported) || []
	);

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

<div class="space-y-3.5 sm:space-y-4">
	<!-- Page Header -->
	<div class="border-b border-stone-800/80 pb-3">
		<h1 class="text-xl sm:text-2xl font-serif tracking-tight text-[#f5f2ea]">Google Sheets Import</h1>
	</div>

	<!-- Controls Card -->
	<div class="p-4 sm:p-5 rounded-2xl bg-[#171715] border border-stone-800/80 space-y-4 shadow-sm">
		<!-- Date Range Filters & Presets -->
		<DateRangeFilter
			bind:startDate={appState.sheetsSync.startDate}
			bind:endDate={appState.sheetsSync.endDate}
			presets={['7days', 'month', '30days']}
			title="Query Window"
		/>

		<!-- Action Trigger -->
		<div class="pt-3 border-t border-stone-800/60 flex items-center justify-end">
			<button
				type="button"
				onclick={handleFetch}
				disabled={appState.sheetsSync.isLoading}
				class="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2 rounded-xl bg-[#eeebe3] active:scale-95 hover:bg-white text-[#111110] text-xs font-semibold transition-all shadow-sm disabled:opacity-50 min-h-[40px] sm:min-h-[36px]"
			>
				<RefreshCw class="w-3.5 h-3.5 {appState.sheetsSync.isLoading ? 'animate-spin' : ''}" />
				<span>{appState.sheetsSync.isLoading ? 'Querying Google Sheets...' : 'Fetch Sheet Rows'}</span>
			</button>
		</div>
	</div>

	<!-- Fetched Results -->
	{#if appState.sheetsSync.result}
		<div class="p-4 sm:p-5 rounded-2xl bg-[#171715] border border-stone-800/80 space-y-4 shadow-sm">
			<!-- Table Header -->
			<div class="border-b border-stone-800/80 pb-4">
				<div class="text-sm font-semibold text-[#f5f2ea] flex items-center gap-2 flex-wrap">
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

			<!-- Rows List -->
			{#if appState.sheetsSync.result.transactions.length === 0}
				<div class="text-center py-10 text-stone-500 text-xs font-mono">
					No transactions found in this date window on Google Sheets.
				</div>
			{:else}
				<!-- Mobile Feed: Card List (sm:hidden) -->
				<div class="sm:hidden divide-y divide-stone-800/60 -mx-1">
					{#each appState.sheetsSync.result.transactions as tx (tx.id)}
						{#if tx.alreadyImported}
							<div class="p-3.5 flex flex-col gap-2 opacity-55">
								<div class="flex items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										<span class="inline-flex items-center gap-1 text-[9px] font-mono text-stone-500 px-1.5 py-0.5 rounded bg-[#111110] border border-stone-800">
											<Check class="w-2.5 h-2.5 text-[#82b896]" />
											<span>IN LEDGER</span>
										</span>
										<span class="text-stone-400 font-mono text-[11px] tabular-nums">{tx.date}</span>
									</div>

									<span class="font-mono tabular-nums text-xs font-semibold shrink-0 {tx.type === 'credit' ? 'text-[#82b896]' : 'text-[#e06c75]'}">
										{formatAmount(tx.amount)}
									</span>
								</div>

								<div class="font-medium text-xs text-stone-200 truncate">{tx.merchant}</div>
							</div>
						{:else}
							<button
								type="button"
								onclick={() => handleOpenImportModal(tx)}
								class="p-3.5 flex flex-col gap-2 transition-colors text-left w-full active:bg-[#1a1917] cursor-pointer min-h-[44px]"
							>
								<div class="flex items-center justify-between gap-2 w-full">
									<div class="flex items-center gap-2">
										<span class="inline-flex items-center gap-1 text-[9px] font-mono text-[#82b896] px-1.5 py-0.5 rounded bg-[#82b896]/10 border border-[#82b896]/20 font-semibold">
											<span>NEW</span>
										</span>
										<span class="text-stone-400 font-mono text-[11px] tabular-nums">{tx.date}</span>
									</div>

									<span class="font-mono tabular-nums text-xs font-semibold shrink-0 {tx.type === 'credit' ? 'text-[#82b896]' : 'text-[#e06c75]'}">
										{formatAmount(tx.amount)}
									</span>
								</div>

								<div class="flex items-center justify-between gap-2 pt-0.5 w-full">
									<div class="min-w-0 flex-1 font-medium text-xs text-stone-200 truncate">
										{tx.merchant}
									</div>

									<span class="px-2.5 py-1.5 rounded-lg bg-[#232320] text-stone-200 text-xs font-mono border border-stone-700/60 inline-flex items-center gap-1 shrink-0">
										<Pencil class="w-3 h-3" />
										<span>Edit & Import</span>
									</span>
								</div>
							</button>
						{/if}
					{/each}
				</div>

				<!-- Tablet & Desktop Table (hidden sm:block) -->
				<div class="hidden sm:block border border-stone-800/80 rounded-xl overflow-x-auto">
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
									</td>

									<!-- Amount -->
									<td class="px-3.5 py-2.5 whitespace-nowrap text-right font-mono tabular-nums font-semibold {tx.type === 'credit' ? 'text-[#82b896]' : 'text-[#e06c75]'}">
										{formatAmount(tx.amount)}
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
