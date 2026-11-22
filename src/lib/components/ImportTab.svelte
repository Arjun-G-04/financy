<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import DateRangeFilter from '#lib/components/DateRangeFilter.svelte';
	import { formatCurrency } from '#lib/utils';
	import {
		RefreshCw,
		Check,
		Pencil,
		FileSpreadsheet
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

<div class="space-y-4 sm:space-y-5">
	<!-- Top Section: Physical Instrument Faceplate -->
	<section class="hw-chassis rounded-2xl p-4 sm:p-6 lg:p-7 relative shadow-2xl space-y-4 sm:space-y-5">
		<!-- Faceplate Header -->
		<div class="flex items-center justify-between border-b border-[#292924] pb-4 px-1 sm:px-2">
			<div class="flex items-center gap-2.5 sm:gap-3">
				<FileSpreadsheet class="w-6 h-6 sm:w-7 sm:h-7 text-[#82b896] stroke-[2.2]" />
				<span class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
					GOOGLE SHEETS DISPATCH & SYNC
				</span>
			</div>
		</div>

		<!-- Date Range Filters & Presets -->
		<div class="pt-1">
			<DateRangeFilter
				bind:startDate={appState.sheetsSync.startDate}
				bind:endDate={appState.sheetsSync.endDate}
				presets={['7days', 'month', '30days']}
				title="Query Window"
			/>
		</div>

		<!-- Action Trigger -->
		<div class="pt-3 border-t border-[#292924] flex items-center justify-end">
			<button
				type="button"
				onclick={handleFetch}
				disabled={appState.sheetsSync.isLoading}
				class="hw-keycap-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono font-bold tracking-wider cursor-pointer shadow-md disabled:opacity-50 min-h-[42px] sm:min-h-[38px]"
			>
				<RefreshCw class="w-3.5 h-3.5 stroke-[2.5] {appState.sheetsSync.isLoading ? 'animate-spin' : ''}" />
				<span>{appState.sheetsSync.isLoading ? 'QUERYING SPREADSHEET...' : 'FETCH SHEET ROWS'}</span>
			</button>
		</div>
	</section>

	<!-- Fetched Results -->
	{#if appState.sheetsSync.result}
		<section class="hw-chassis rounded-2xl p-4 sm:p-6 border border-[#292924] space-y-4 shadow-xl">
			<!-- Table Header -->
			<div class="border-b border-[#292924] pb-4">
				<div class="text-sm font-semibold text-[#f5f2ea] flex items-center gap-2 flex-wrap font-mono">
					<span>{appState.sheetsSync.result.title}</span>
					{#if appState.sheetsSync.result.sheetTitle}
						<span class="hw-metal-plate px-2.5 py-0.5 rounded-xs text-[10px] uppercase font-bold tracking-wider">
							TAB: {appState.sheetsSync.result.sheetTitle}
						</span>
					{/if}
				</div>
				<div class="text-xs text-stone-500 font-mono mt-1">
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
				<div class="sm:hidden divide-y divide-[#242420] -mx-1">
					{#each appState.sheetsSync.result.transactions as tx (tx.id)}
						{#if tx.alreadyImported}
							<div class="p-3.5 flex flex-col gap-2 opacity-55">
								<div class="flex items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										<span class="inline-flex items-center gap-1 text-[9px] font-mono text-stone-400 px-2 py-0.5 rounded bg-[#10100d] border border-[#262622]">
											<Check class="w-2.5 h-2.5 text-[#82b896]" />
											<span>IN LEDGER</span>
										</span>
										<span class="text-stone-400 font-mono text-[11px] tabular-nums">{tx.date}</span>
									</div>

									<span class="font-mono tabular-nums text-xs font-bold shrink-0 {tx.type === 'credit' ? 'text-[#82b896]' : 'text-[#e06c75]'}">
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
										<span class="inline-flex items-center gap-1 text-[9px] font-mono text-[#82b896] px-2 py-0.5 rounded bg-[#82b896]/10 border border-[#82b896]/30 font-bold">
											<span>NEW</span>
										</span>
										<span class="text-stone-400 font-mono text-[11px] tabular-nums">{tx.date}</span>
									</div>

									<span class="font-mono tabular-nums text-xs font-bold shrink-0 {tx.type === 'credit' ? 'text-[#82b896]' : 'text-[#e06c75]'}">
										{formatAmount(tx.amount)}
									</span>
								</div>

								<div class="flex items-center justify-between gap-2 pt-0.5 w-full">
									<div class="min-w-0 flex-1 font-medium text-xs text-stone-200 truncate">
										{tx.merchant}
									</div>

									<span class="hw-keycap px-2.5 py-1.5 rounded-lg text-stone-200 text-xs font-mono inline-flex items-center gap-1.5 shrink-0 shadow-xs">
										<Pencil class="w-3 h-3 text-[#f97316]" />
										<span>Edit & Import</span>
									</span>
								</div>
							</button>
						{/if}
					{/each}
				</div>

				<!-- Tablet & Desktop Table (hidden sm:block) -->
				<div class="hidden sm:block border border-[#292924] rounded-xl overflow-x-auto bg-[#0d0d0b]">
					<table class="w-full text-left text-xs">
						<thead class="bg-[#141411] border-b border-[#292924] text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
							<tr>
								<th class="px-4 py-3">Status</th>
								<th class="px-4 py-3">Date</th>
								<th class="px-4 py-3">Description</th>
								<th class="px-4 py-3 text-right">Amount</th>
								<th class="px-4 py-3 text-right">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[#242420]">
							{#each appState.sheetsSync.result.transactions as tx (tx.id)}
								<tr
									onclick={() => handleOpenImportModal(tx)}
									class="hover:bg-[#181815] transition-colors {tx.alreadyImported
										? 'opacity-55'
										: 'cursor-pointer'}"
								>
									<!-- Status Badge -->
									<td class="px-4 py-3 whitespace-nowrap">
										{#if tx.alreadyImported}
											<span class="inline-flex items-center gap-1 text-[10px] font-mono text-stone-400 px-2 py-0.5 rounded bg-[#10100d] border border-[#262622]">
												<Check class="w-2.5 h-2.5 text-[#82b896]" />
												<span>IN LEDGER</span>
											</span>
										{:else}
											<span class="inline-flex items-center gap-1 text-[10px] font-mono text-[#82b896] px-2 py-0.5 rounded bg-[#82b896]/10 border border-[#82b896]/30 font-bold">
												<span>NEW</span>
											</span>
										{/if}
									</td>

									<!-- Date -->
									<td class="px-4 py-3 whitespace-nowrap text-stone-400 font-mono tabular-nums">
										{tx.date}
									</td>

									<!-- Description -->
									<td class="px-4 py-3 text-stone-200">
										<div class="font-medium">{tx.merchant}</div>
									</td>

									<!-- Amount -->
									<td class="px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums font-bold {tx.type === 'credit' ? 'text-[#82b896]' : 'text-[#e06c75]'}">
										{formatAmount(tx.amount)}
									</td>

									<!-- Action -->
									<td class="px-4 py-3 whitespace-nowrap text-right">
										{#if tx.alreadyImported}
											<span class="text-[11px] text-stone-500 font-mono">Synced</span>
										{:else}
											<button
												type="button"
												onclick={(e) => {
													e.stopPropagation();
													handleOpenImportModal(tx);
												}}
												class="hw-keycap px-3 py-1.5 rounded-lg text-stone-200 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
											>
												<Pencil class="w-3 h-3 text-[#f97316]" />
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
		</section>
	{/if}
</div>
