<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency as formatCur } from '#lib/utils';
	import TransactionFeed from '#lib/components/TransactionFeed.svelte';
	import {
		ArrowRight,
		Plus
	} from '@lucide/svelte';

	const savingsRate = $derived(
		appState.totalCredit > 0
			? ((appState.netBalance / appState.totalCredit) * 100).toFixed(1)
			: '0.0'
	);

	const recentTransactions = $derived(appState.transactions.slice(0, 10));

	function formatCurrency(val: number) {
		return formatCur(val, appState.settings.currencySymbol);
	}

	async function handleDelete(tx: LocalTransaction) {
		if (!confirm(`Delete "${tx.name}" (${formatCurrency(tx.amount)})?`)) return;
		try {
			await appState.deleteTransaction(tx.id);
			appState.showToast('info', 'Deleted', tx.name);
		} catch (err: any) {
			appState.showToast('error', 'Error', err.message);
		}
	}
</script>

<div class="space-y-6 sm:space-y-8">
	<!-- Top Section: Capital Statement & Actions -->
	<div class="flex items-center justify-between gap-4 border-b border-stone-800/80 pb-5 sm:pb-6">
		<div class="space-y-1">
			<div class="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-500 uppercase">Statement of Position</div>
			<div class="text-3xl sm:text-5xl font-mono tabular-nums font-semibold tracking-tight text-[#f5f2ea] truncate">
				{formatCurrency(appState.netBalance)}
			</div>
			<div class="text-[11px] sm:text-xs text-stone-400 flex items-center gap-2 pt-0.5 flex-wrap">
				<span>{appState.transactions.length} operations</span>
				<span class="text-stone-600">•</span>
				<span class="text-[#82b896] font-mono tabular-nums">{savingsRate}% retention</span>
			</div>
		</div>

		<button
			type="button"
			onclick={() => appState.openTransactionModal()}
			class="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2 rounded-xl bg-[#eeebe3] active:scale-95 hover:bg-white text-[#111110] font-semibold text-xs transition-all shadow-sm min-h-[40px] sm:min-h-[36px]"
			aria-label="New Record"
		>
			<Plus class="w-3.5 h-3.5 stroke-[2.2]" />
			<span>New</span>
		</button>
	</div>

	<!-- Flow Indicators: 2 columns -->
	<div class="grid grid-cols-2 gap-2.5 sm:gap-4">
		<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[10px] sm:text-[11px] text-stone-500 font-medium uppercase tracking-wider truncate">Total Inflow</div>
			<div class="text-base sm:text-xl font-mono tabular-nums font-semibold text-[#82b896] truncate">
				{formatCurrency(appState.totalCredit)}
			</div>
		</div>

		<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[10px] sm:text-[11px] text-stone-500 font-medium uppercase tracking-wider truncate">Total Outflow</div>
			<div class="text-base sm:text-xl font-mono tabular-nums font-semibold text-[#e06c75] truncate">
				{formatCurrency(appState.totalDebit)}
			</div>
		</div>
	</div>

	<!-- Recent Operations Stream -->
	<div class="space-y-3">
		<div class="flex items-center justify-between pb-1">
			<div class="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-stone-400">Recent Operations</div>
			<button
				onclick={() => (appState.activeTab = 'history')}
				class="text-xs text-stone-400 hover:text-stone-200 transition-colors inline-flex items-center gap-1 min-h-[36px] sm:min-h-0"
			>
				<span>View all {appState.transactions.length}</span>
				<ArrowRight class="w-3.5 h-3.5" />
			</button>
		</div>

		<TransactionFeed
			transactions={recentTransactions}
			emptyMessage="No records found."
			onDelete={handleDelete}
		/>
	</div>
</div>
