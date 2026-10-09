<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { FileSpreadsheet, Download, Check, AlertCircle, RefreshCw, KeyRound } from '@lucide/svelte';

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
			appState.showToast('error', 'Authentication Error', 'Please enter your Google OAuth Access Token');
			return;
		}
		if (!spreadsheetId.trim()) {
			appState.showToast('error', 'Configuration Error', 'Spreadsheet ID cannot be empty');
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
				throw new Error(data.error || 'Failed to fetch spreadsheet data');
			}

			fetchedResult = data;
			appState.showToast(
				'success',
				'Sheet Loaded',
				`Fetched ${data.transactions.length} rows (${data.transactions.filter((t: any) => !t.alreadyImported).length} new)`
			);
		} catch (err: any) {
			appState.showToast('error', 'Fetch Failed', err.message);
		} finally {
			isLoading = false;
		}
	}

	async function handleImport() {
		if (!newTransactions.length) {
			appState.showToast('info', 'Import Info', 'No new transactions to import');
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
				throw new Error(data.error || 'Failed to import transactions');
			}

			appState.showToast(
				'success',
				'Import Completed',
				`Successfully imported ${data.count} transactions into Turso SQLite`
			);

			// Refresh local transactions
			await appState.refreshTransactions();

			// Mark as imported in local view
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
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-zinc-100">Google Sheets Import</h1>
		<p class="text-sm text-zinc-400">
			Sync transactions directly from your linked Google Sheet into Turso SQLite.
		</p>
	</div>

	<!-- Configuration & Fetch Card -->
	<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Access Token -->
			<div>
				<label for="accessToken" class="block text-xs font-medium text-zinc-400 mb-1.5">
					Google OAuth Access Token
				</label>
				<div class="relative">
					<KeyRound class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
					<input
						id="accessToken"
						type="password"
						placeholder="ya29.a0AfH6SM..."
						bind:value={accessToken}
						class="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
					/>
				</div>
			</div>

			<!-- Spreadsheet ID -->
			<div>
				<label for="spreadsheetId" class="block text-xs font-medium text-zinc-400 mb-1.5">
					Spreadsheet ID
				</label>
				<input
					id="spreadsheetId"
					type="text"
					placeholder="1LYv2aGTfpGBhfAK..."
					bind:value={spreadsheetId}
					class="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
				/>
			</div>

			<!-- Start Date -->
			<div>
				<label for="startDate" class="block text-xs font-medium text-zinc-400 mb-1.5">
					Start Date (Optional)
				</label>
				<input
					id="startDate"
					type="date"
					bind:value={startDate}
					class="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
				/>
			</div>

			<!-- End Date -->
			<div>
				<label for="endDate" class="block text-xs font-medium text-zinc-400 mb-1.5">
					End Date (Optional)
				</label>
				<input
					id="endDate"
					type="date"
					bind:value={endDate}
					class="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
				/>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
			<button
				onclick={handleFetch}
				disabled={isLoading}
				class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold transition-colors disabled:opacity-50"
			>
				<RefreshCw class="w-4 h-4 {isLoading ? 'animate-spin' : ''}" />
				<span>{isLoading ? 'Fetching Sheet...' : 'Fetch Transactions'}</span>
			</button>
		</div>
	</div>

	<!-- Fetched Results Preview -->
	{#if fetchedResult}
		<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h2 class="text-lg font-bold text-zinc-100">{fetchedResult.title}</h2>
					<p class="text-xs text-zinc-400">
						{fetchedResult.transactions.length} rows found • <strong class="text-emerald-400">{newTransactions.length} new</strong> ready to import
					</p>
				</div>

				<button
					onclick={handleImport}
					disabled={isImporting || newTransactions.length === 0}
					class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-bold transition-colors disabled:opacity-40"
				>
					<Download class="w-4 h-4" />
					<span>{isImporting ? 'Importing...' : `Import ${newTransactions.length} New Records`}</span>
				</button>
			</div>

			<!-- Table -->
			<div class="overflow-x-auto rounded-xl border border-zinc-800">
				<table class="w-full text-left text-sm">
					<thead class="bg-zinc-950 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
						<tr>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Date</th>
							<th class="px-4 py-3">Merchant</th>
							<th class="px-4 py-3 text-right">Amount</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-800/60">
						{#each fetchedResult.transactions as tx}
							<tr class="hover:bg-zinc-800/30">
								<td class="px-4 py-3 whitespace-nowrap">
									{#if tx.alreadyImported}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
											In Database
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
											New
										</span>
									{/if}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-xs text-zinc-400 font-mono">
									{tx.date}
								</td>
								<td class="px-4 py-3 text-zinc-100 font-medium">
									{tx.merchant}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-right font-bold {tx.type === 'credit' ? 'text-emerald-400' : 'text-zinc-200'}">
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
