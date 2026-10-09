<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { RefreshCw, Download } from '@lucide/svelte';

	let accessToken = $state('');
	let spreadsheetId = $state(appState.settings.spreadsheetId || '');
	let startDate = $state('');
	let endDate = $state('');
	let isLoading = $state(false);
	let isImporting = $state(false);

	let fetchedResult = $state<{
		title: string;
		transactions: Array<{
			id: string;
			rawDate: string;
			date: string;
			type: 'credit' | 'debit';
			amount: number;
			merchant: string;
			raw: string;
			alreadyImported: boolean;
		}>;
	} | null>(null);

	$effect(() => {
		if (!spreadsheetId && appState.settings.spreadsheetId) {
			spreadsheetId = appState.settings.spreadsheetId;
		}
	});

	const newTransactions = $derived(
		fetchedResult?.transactions.filter((t) => !t.alreadyImported) || []
	);

	function formatCurrency(val: number) {
		const sym = appState.settings.currencySymbol || '₹';
		return `${sym}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	async function handleFetch() {
		if (!accessToken.trim()) {
			appState.showToast('error', 'Auth Error', 'Google OAuth Access Token required');
			return;
		}
		if (!spreadsheetId.trim()) {
			appState.showToast('error', 'Error', 'Spreadsheet ID required');
			return;
		}

		isLoading = true;
		try {
			const res = await fetch('/api/sheets/fetch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					accessToken: accessToken.trim(),
					spreadsheetId: spreadsheetId.trim(),
					startDate: startDate || undefined,
					endDate: endDate || undefined
				})
			});
			const data = await res.json();
			if (!data.success) {
				throw new Error(data.error || 'Failed to fetch sheet');
			}

			fetchedResult = data;
			appState.showToast(
				'success',
				'Fetched',
				`${data.transactions.length} rows (${data.transactions.filter((t: any) => !t.alreadyImported).length} new)`
			);
		} catch (err: any) {
			appState.showToast('error', 'Fetch Failed', err.message);
		} finally {
			isLoading = false;
		}
	}

	async function handleImport() {
		if (!newTransactions.length) {
			appState.showToast('info', 'Notice', 'No new records to import');
			return;
		}

		isImporting = true;
		try {
			const res = await fetch('/api/sheets/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transactions: newTransactions })
			});
			const data = await res.json();
			if (!data.success) {
				throw new Error(data.error || 'Import failed');
			}

			appState.showToast('success', 'Imported', `Inserted ${data.count} records`);
			await appState.refreshTransactions();

			if (fetchedResult) {
				fetchedResult.transactions = fetchedResult.transactions.map((t) => ({
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
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="border-b border-stone-800/80 pb-4">
		<div class="text-[11px] font-medium tracking-wider text-stone-500 uppercase">External Sync</div>
		<h1 class="text-2xl font-serif tracking-tight text-[#f5f2ea] mt-0.5">Google Sheets Pipeline</h1>
	</div>

	<!-- Configuration & Fetch -->
	<div class="p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3">
		<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">Connection Parameters</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div>
				<label for="accessToken" class="block text-xs text-stone-400 mb-1">OAuth Access Token</label>
				<input
					id="accessToken"
					type="password"
					placeholder="ya29.a0AfH6..."
					bind:value={accessToken}
					class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-xs font-mono focus:outline-none focus:border-stone-600 transition-colors"
				/>
			</div>

			<div>
				<label for="spreadsheetId" class="block text-xs text-stone-400 mb-1">Spreadsheet ID</label>
				<input
					id="spreadsheetId"
					type="text"
					placeholder="1LYv2aGTfpGBhf..."
					bind:value={spreadsheetId}
					class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-xs font-mono focus:outline-none focus:border-stone-600 transition-colors"
				/>
			</div>

			<div>
				<label for="startDate" class="block text-xs text-stone-400 mb-1">Filter Start Date</label>
				<input
					id="startDate"
					type="date"
					bind:value={startDate}
					class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-xs font-mono focus:outline-none focus:border-stone-600 transition-colors"
				/>
			</div>

			<div>
				<label for="endDate" class="block text-xs text-stone-400 mb-1">Filter End Date</label>
				<input
					id="endDate"
					type="date"
					bind:value={endDate}
					class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-xs font-mono focus:outline-none focus:border-stone-600 transition-colors"
				/>
			</div>
		</div>

		<div class="flex justify-end pt-2 border-t border-stone-800/60">
			<button
				onclick={handleFetch}
				disabled={isLoading}
				class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#eeebe3] hover:bg-white text-[#111110] text-xs font-medium transition-colors disabled:opacity-50"
			>
				<RefreshCw class="w-3.5 h-3.5 {isLoading ? 'animate-spin' : ''}" />
				<span>{isLoading ? 'Querying...' : 'Fetch Rows'}</span>
			</button>
		</div>
	</div>

	<!-- Fetched Results Preview -->
	{#if fetchedResult}
		<div class="p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-xs font-semibold text-[#f5f2ea]">{fetchedResult.title}</div>
					<div class="text-xs text-stone-500 font-mono">
						{fetchedResult.transactions.length} rows • <span class="text-[#82b896]">{newTransactions.length} uncommitted</span>
					</div>
				</div>

				<button
					onclick={handleImport}
					disabled={isImporting || newTransactions.length === 0}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eeebe3] hover:bg-white text-[#111110] text-xs font-medium transition-colors disabled:opacity-40"
				>
					<Download class="w-3.5 h-3.5" />
					<span>{isImporting ? 'Writing...' : `Commit ${newTransactions.length} to Turso`}</span>
				</button>
			</div>

			<div class="border border-stone-800 rounded-lg overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead class="bg-[#141412] border-b border-stone-800 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
						<tr>
							<th class="px-3 py-2">Status</th>
							<th class="px-3 py-2">Date</th>
							<th class="px-3 py-2">Description</th>
							<th class="px-3 py-2 text-right">Amount</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-stone-800/60">
						{#each fetchedResult.transactions as tx}
							<tr class="hover:bg-[#1d1c19]">
								<td class="px-3 py-2 whitespace-nowrap">
									{#if tx.alreadyImported}
										<span class="text-[10px] font-mono text-stone-500">EXISTS</span>
									{:else}
										<span class="text-[10px] font-mono text-[#82b896] font-semibold">NEW</span>
									{/if}
								</td>
								<td class="px-3 py-2 whitespace-nowrap text-stone-500 font-mono tabular-nums">
									{tx.date}
								</td>
								<td class="px-3 py-2 text-stone-200">
									{tx.merchant}
								</td>
								<td class="px-3 py-2 whitespace-nowrap text-right font-mono tabular-nums font-semibold {tx.type === 'credit' ? 'text-[#82b896]' : 'text-stone-200'}">
									{tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
