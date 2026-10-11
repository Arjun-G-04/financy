<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { Check } from '@lucide/svelte';

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
			appState.showToast('success', 'Reconciled', `Updated ${timestamp}`);
		} catch (err: any) {
			appState.showToast('error', 'Error', err.message);
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="space-y-5 sm:space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-stone-800/80 pb-4 gap-1.5">
		<div>
			<div class="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-500 uppercase">Audit & Balance</div>
			<h1 class="text-xl sm:text-2xl font-serif tracking-tight text-[#f5f2ea] mt-0.5">Asset Holdings Reconciliation</h1>
		</div>

		{#if lastUpdated}
			<div class="text-[11px] sm:text-xs text-stone-500 font-mono">
				Audit date: <span class="text-stone-300">{lastUpdated}</span>
			</div>
		{/if}
	</div>

	<!-- Minimal Accounting Delta Strip -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
		<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[10px] text-stone-500 uppercase tracking-wider">Theoretical Money</div>
			<div class="text-lg sm:text-xl font-mono tabular-nums font-semibold text-[#f5f2ea] truncate">
				{formatCurrency(theoreticalMoney)}
			</div>
			<div class="text-[10px] sm:text-[11px] text-stone-500">Ledger Net + CC Debt</div>
		</div>

		<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[10px] text-stone-500 uppercase tracking-wider">Actual Money</div>
			<div class="text-lg sm:text-xl font-mono tabular-nums font-semibold text-[#f5f2ea] truncate">
				{formatCurrency(actualMoney)}
			</div>
			<div class="text-[10px] sm:text-[11px] text-stone-500">Bank + Cash + Receivables</div>
		</div>

		<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[10px] text-stone-500 uppercase tracking-wider">Net Discrepancy</div>
			<div class="text-lg sm:text-xl font-mono tabular-nums font-semibold truncate {Math.abs(netDifference) < 1 ? 'text-[#82b896]' : 'text-[#e06c75]'}">
				{formatCurrency(netDifference)}
			</div>
			<div class="text-[10px] sm:text-[11px] text-stone-500">
				{Math.abs(netDifference) < 1 ? 'Balanced to zero' : 'Pending reconciliation'}
			</div>
		</div>
	</div>

	<!-- Input Form Card -->
	<div class="p-4 sm:p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-4">
		<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">Recorded Account Balances</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
			<!-- Credit Card Debt -->
			<div>
				<label for="ccDebt" class="block text-xs text-stone-400 mb-1">
					Credit Card Debt (Unbilled / Unpaid)
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="ccDebt"
						type="number"
						step="any"
						bind:value={ccDebt}
						class="w-full pl-7 pr-3 py-2.5 sm:py-2 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-stone-600 transition-colors"
					/>
				</div>
			</div>

			<!-- HDFC Bank -->
			<div>
				<label for="hdfc" class="block text-xs text-stone-400 mb-1">
					HDFC Bank Balance
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="hdfc"
						type="number"
						step="any"
						bind:value={hdfc}
						class="w-full pl-7 pr-3 py-2.5 sm:py-2 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-stone-600 transition-colors"
					/>
				</div>
			</div>

			<!-- KVB Bank -->
			<div>
				<label for="kvb" class="block text-xs text-stone-400 mb-1">
					KVB Bank Balance
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="kvb"
						type="number"
						step="any"
						bind:value={kvb}
						class="w-full pl-7 pr-3 py-2.5 sm:py-2 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-stone-600 transition-colors"
					/>
				</div>
			</div>

			<!-- Cash -->
			<div>
				<label for="cash" class="block text-xs text-stone-400 mb-1">
					Physical Cash in Hand
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="cash"
						type="number"
						step="any"
						bind:value={cash}
						class="w-full pl-7 pr-3 py-2.5 sm:py-2 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-stone-600 transition-colors"
					/>
				</div>
			</div>

			<!-- Credits Receivable -->
			<div class="sm:col-span-2">
				<label for="creditsOwed" class="block text-xs text-stone-400 mb-1">
					Credits Receivable (Lent to third parties)
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="creditsOwed"
						type="number"
						step="any"
						bind:value={creditsOwed}
						class="w-full pl-7 pr-3 py-2.5 sm:py-2 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-stone-600 transition-colors"
					/>
				</div>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="flex justify-end pt-2 border-t border-stone-800/60">
			<button
				onclick={handleSaveReconciliation}
				disabled={isSaving}
				class="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg bg-[#eeebe3] active:scale-95 hover:bg-white text-[#111110] text-xs font-semibold transition-all disabled:opacity-50 min-h-[44px] sm:min-h-0 shadow-sm"
			>
				<Check class="w-3.5 h-3.5 stroke-[2.2]" />
				<span>{isSaving ? 'Saving...' : 'Update Holdings'}</span>
			</button>
		</div>
	</div>
</div>
