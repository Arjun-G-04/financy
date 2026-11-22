<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { Check, Clock, Scale } from '@lucide/svelte';

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

	const discrepancyColor = $derived.by(() => {
		if (Math.abs(netDifference) < 0.01) {
			return 'text-amber-400';
		}
		if (netDifference < 0) {
			return 'text-[#82b896]';
		}
		return 'text-[#e06c75]';
	});

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

<div class="space-y-4 sm:space-y-5">
	<!-- Top Section: Physical Instrument Faceplate -->
	<section class="hw-chassis rounded-2xl p-4 sm:p-6 lg:p-7 relative shadow-2xl space-y-4 sm:space-y-5">
		<!-- Faceplate Header -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#292924] pb-4 px-1 sm:px-2 gap-3">
			<div class="flex items-center gap-2.5 sm:gap-3">
				<Scale class="w-6 h-6 sm:w-7 sm:h-7 text-[#82b896] stroke-[2.2]" />
				<span class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
					ASSET HOLDINGS RECONCILIATION
				</span>
			</div>

			{#if lastUpdated}
				<div class="hw-vfd-display px-3 py-1.5 flex items-center gap-2 text-xs font-mono rounded-lg">
					<Clock class="w-3.5 h-3.5 text-[#f97316]" />
					<span class="text-stone-400 text-[10px] uppercase tracking-wider">AUDIT:</span>
					<span class="text-[#82b896] font-bold">{lastUpdated}</span>
				</div>
			{/if}
		</div>

		<!-- VFD Accounting Delta Strip -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
			<!-- Theoretical Money -->
			<div class="hw-vfd-display p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-2">
				<div class="text-[10px] font-mono text-[#82b896]/70 uppercase tracking-widest font-bold">
					THEORETICAL MONEY
				</div>
				<div class="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-[#82b896] drop-shadow-[0_0_8px_rgba(130,184,150,0.3)] truncate">
					{formatCurrency(theoreticalMoney)}
				</div>
				<div class="text-[10px] font-mono text-stone-500 pt-1 border-t border-[#1a281e]">
					Ledger Net + CC Debt
				</div>
			</div>

			<!-- Actual Money -->
			<div class="hw-vfd-display p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-2">
				<div class="text-[10px] font-mono text-[#82b896]/70 uppercase tracking-widest font-bold">
					ACTUAL MONEY
				</div>
				<div class="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-[#82b896] drop-shadow-[0_0_8px_rgba(130,184,150,0.3)] truncate">
					{formatCurrency(actualMoney)}
				</div>
				<div class="text-[10px] font-mono text-stone-500 pt-1 border-t border-[#1a281e]">
					Bank + Cash + Receivables
				</div>
			</div>

			<!-- Net Discrepancy -->
			<div class="hw-vfd-display {Math.abs(netDifference) < 0.01 ? '' : netDifference < 0 ? '' : 'hw-vfd-rose'} p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-2">
				<div class="text-[10px] font-mono {Math.abs(netDifference) < 0.01 ? 'text-[#82b896]/70' : netDifference < 0 ? 'text-[#82b896]/70' : 'text-rose-300/70'} uppercase tracking-widest font-bold">
					NET DISCREPANCY
				</div>
				<div class="text-2xl sm:text-3xl font-mono tabular-nums font-bold truncate {discrepancyColor} {Math.abs(netDifference) < 0.01 ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : netDifference < 0 ? 'drop-shadow-[0_0_8px_rgba(130,184,150,0.3)]' : 'drop-shadow-[0_0_12px_rgba(224,108,117,0.5)]'}">
					{formatCurrency(netDifference)}
				</div>
				<div class="text-[10px] font-mono text-stone-500 pt-1 border-t border-[#1a281e]">
					{Math.abs(netDifference) < 0.01 ? 'Balanced to zero' : 'Pending reconciliation'}
				</div>
			</div>
		</div>
	</section>

	<!-- Input Form Card -->
	<section class="hw-chassis p-5 sm:p-7 rounded-2xl border border-[#292924] space-y-5 shadow-2xl">
		<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
			RECORDED ACCOUNT BALANCES
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<!-- Credit Card Debt -->
			<div>
				<label for="ccDebt" class="block text-xs font-mono text-stone-400 mb-1.5 uppercase tracking-wider">
					Credit Card Debt (Unbilled / Unpaid)
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono font-bold pointer-events-none">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="ccDebt"
						type="number"
						step="any"
						bind:value={ccDebt}
						class="w-full pl-8 pr-3 py-2.5 sm:py-2 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
					/>
				</div>
			</div>

			<!-- HDFC Bank -->
			<div>
				<label for="hdfc" class="block text-xs font-mono text-stone-400 mb-1.5 uppercase tracking-wider">
					HDFC Bank Balance
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono font-bold pointer-events-none">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="hdfc"
						type="number"
						step="any"
						bind:value={hdfc}
						class="w-full pl-8 pr-3 py-2.5 sm:py-2 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
					/>
				</div>
			</div>

			<!-- KVB Bank -->
			<div>
				<label for="kvb" class="block text-xs font-mono text-stone-400 mb-1.5 uppercase tracking-wider">
					KVB Bank Balance
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono font-bold pointer-events-none">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="kvb"
						type="number"
						step="any"
						bind:value={kvb}
						class="w-full pl-8 pr-3 py-2.5 sm:py-2 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
					/>
				</div>
			</div>

			<!-- Cash -->
			<div>
				<label for="cash" class="block text-xs font-mono text-stone-400 mb-1.5 uppercase tracking-wider">
					Physical Cash in Hand
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono font-bold pointer-events-none">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="cash"
						type="number"
						step="any"
						bind:value={cash}
						class="w-full pl-8 pr-3 py-2.5 sm:py-2 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
					/>
				</div>
			</div>

			<!-- Credits Receivable -->
			<div class="sm:col-span-2">
				<label for="creditsOwed" class="block text-xs font-mono text-stone-400 mb-1.5 uppercase tracking-wider">
					Credits Receivable (Lent to third parties)
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono font-bold pointer-events-none">
						{appState.settings.currencySymbol || '₹'}
					</span>
					<input
						id="creditsOwed"
						type="number"
						step="any"
						bind:value={creditsOwed}
						class="w-full pl-8 pr-3 py-2.5 sm:py-2 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
					/>
				</div>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="flex justify-end pt-3 border-t border-[#292924]">
			<button
				onclick={handleSaveReconciliation}
				disabled={isSaving}
				class="hw-keycap-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono font-bold tracking-wider cursor-pointer shadow-md disabled:opacity-50 min-h-[42px] sm:min-h-[38px]"
			>
				<Check class="w-3.5 h-3.5 stroke-[2.5]" />
				<span>{isSaving ? 'UPDATING...' : 'UPDATE HOLDINGS'}</span>
			</button>
		</div>
	</section>
</div>
