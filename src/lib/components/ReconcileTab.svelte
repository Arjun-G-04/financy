<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { Scale, Check, RefreshCw, AlertTriangle, Clock } from '@lucide/svelte';

	let ccDebt = $state('0');
	let hdfc = $state('0');
	let kvb = $state('0');
	let cash = $state('0');
	let creditsOwed = $state('0');
	let lastUpdated = $state('');
	let isSaving = $state(false);

	$effect(() => {
		const r = appState.settings.reconciliation;
		ccDebt = r.ccDebt || '0';
		hdfc = r.hdfc || '0';
		kvb = r.kvb || '0';
		cash = r.cash || '0';
		creditsOwed = r.creditsOwed || '0';
		lastUpdated = r.lastUpdated || '';
	});

	const numCcDebt = $derived(parseFloat(ccDebt) || 0);
	const numHdfc = $derived(parseFloat(hdfc) || 0);
	const numKvb = $derived(parseFloat(kvb) || 0);
	const numCash = $derived(parseFloat(cash) || 0);
	const numCredits = $derived(parseFloat(creditsOwed) || 0);

	const theoreticalMoney = $derived(appState.netBalance + numCcDebt);
	const actualMoney = $derived(numHdfc + numKvb + numCash + numCredits);
	const netDifference = $derived(theoreticalMoney - actualMoney);

	function formatCurrency(val: number) {
		const sym = appState.settings.currencySymbol || '₹';
		return `${sym}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	async function handleSaveReconciliation() {
		isSaving = true;
		try {
			const now = new Date();
			const timestamp = now.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});

			await appState.saveSettings({
				reconciliation: {
					ccDebt,
					hdfc,
					kvb,
					cash,
					creditsOwed,
					lastUpdated: timestamp
				}
			});

			lastUpdated = timestamp;
			appState.showToast('success', 'Reconciliation Saved', `Updated at ${timestamp}`);
		} catch (err: any) {
			appState.showToast('error', 'Save Failed', err.message);
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-100">Asset & Bank Reconciliation</h1>
			<p class="text-sm text-zinc-400">Match theoretical ledger balance against actual cash & bank holdings.</p>
		</div>

		{#if lastUpdated}
			<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
				<Clock class="w-3.5 h-3.5 text-zinc-500" />
				<span>Last reconciled: <strong class="text-zinc-200">{lastUpdated}</strong></span>
			</div>
		{/if}
	</div>

	<!-- Reconciliation Math Highlight Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<!-- Theoretical Money -->
		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-1">
			<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
				Theoretical Money
			</span>
			<div class="text-2xl font-bold text-zinc-100">
				{formatCurrency(theoreticalMoney)}
			</div>
			<div class="text-xs text-zinc-500">
				Ledger Net ({formatCurrency(appState.netBalance)}) + CC Debt ({formatCurrency(numCcDebt)})
			</div>
		</div>

		<!-- Actual Money -->
		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-1">
			<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
				Actual Money
			</span>
			<div class="text-2xl font-bold text-zinc-100">
				{formatCurrency(actualMoney)}
			</div>
			<div class="text-xs text-zinc-500">
				HDFC + KVB + Cash + Credits Owed
			</div>
		</div>

		<!-- Net Difference -->
		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-1">
			<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
				Net Difference
			</span>
			<div class="text-2xl font-bold {Math.abs(netDifference) < 1 ? 'text-emerald-400' : 'text-rose-400'}">
				{formatCurrency(netDifference)}
			</div>
			<div class="text-xs text-zinc-500">
				{Math.abs(netDifference) < 1 ? 'Perfect match!' : 'Theoretical vs Actual mismatch'}
			</div>
		</div>
	</div>

	<!-- Input Forms Card -->
	<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-6">
		<div>
			<h2 class="text-lg font-bold text-zinc-100">Accounts & Balances</h2>
			<p class="text-xs text-zinc-400">Enter current real balances across your accounts and cash</p>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<!-- Credit Card Debt -->
			<div>
				<label for="ccDebt" class="block text-xs font-medium text-zinc-400 mb-1.5">
					Credit Card Unpaid Bill (CC Debt)
				</label>
				<div class="relative">
					<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="ccDebt"
						type="number"
						step="any"
						bind:value={ccDebt}
						class="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
					/>
				</div>
			</div>

			<!-- HDFC Bank -->
			<div>
				<label for="hdfc" class="block text-xs font-medium text-zinc-400 mb-1.5">
					HDFC Bank Balance
				</label>
				<div class="relative">
					<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="hdfc"
						type="number"
						step="any"
						bind:value={hdfc}
						class="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
					/>
				</div>
			</div>

			<!-- KVB Bank -->
			<div>
				<label for="kvb" class="block text-xs font-medium text-zinc-400 mb-1.5">
					KVB Bank Balance
				</label>
				<div class="relative">
					<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="kvb"
						type="number"
						step="any"
						bind:value={kvb}
						class="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
					/>
				</div>
			</div>

			<!-- Cash Balance -->
			<div>
				<label for="cash" class="block text-xs font-medium text-zinc-400 mb-1.5">
					Physical Cash in Hand
				</label>
				<div class="relative">
					<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="cash"
						type="number"
						step="any"
						bind:value={cash}
						class="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
					/>
				</div>
			</div>

			<!-- Credits Owed By Others -->
			<div class="sm:col-span-2">
				<label for="creditsOwed" class="block text-xs font-medium text-zinc-400 mb-1.5">
					Credits Owed to Me (Lent to others)
				</label>
				<div class="relative">
					<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="creditsOwed"
						type="number"
						step="any"
						bind:value={creditsOwed}
						class="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
					/>
				</div>
			</div>
		</div>

		<!-- Save Button -->
		<div class="flex justify-end pt-2 border-t border-zinc-800">
			<button
				onclick={handleSaveReconciliation}
				disabled={isSaving}
				class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold transition-colors disabled:opacity-50"
			>
				<Check class="w-4 h-4 stroke-[2.5]" />
				<span>{isSaving ? 'Saving...' : 'Save & Reconcile'}</span>
			</button>
		</div>
	</div>
</div>
