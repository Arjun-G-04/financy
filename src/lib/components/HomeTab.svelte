<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency as formatCur } from '#lib/utils';
	import TransactionFeed from '#lib/components/TransactionFeed.svelte';
	import {
		ArrowRight,
		Plus,
		ArrowUpRight
	} from '@lucide/svelte';

	let timeFilter = $state<'all' | 'this_month' | 'last_month'>('all');

	const now = new Date();
	const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

	const filteredTransactions = $derived.by(() => {
		if (timeFilter === 'this_month') {
			return appState.transactions.filter((t) => t.date.startsWith(thisMonthStr));
		}
		if (timeFilter === 'last_month') {
			return appState.transactions.filter((t) => t.date.startsWith(lastMonthStr));
		}
		return appState.transactions;
	});

	const stats = $derived.by(() => {
		let income = 0;
		let expense = 0;
		for (const tx of filteredTransactions) {
			if (tx.type === 'credit') income += tx.amount;
			else expense += tx.amount;
		}
		const net = income - expense;
		const savingsRate = income > 0 ? ((net / income) * 100).toFixed(1) : '0.0';
		return { income, expense, net, savingsRate };
	});

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
	<!-- Top Section: Capital Statement & Time Toggle -->
	<div class="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4 border-b border-stone-800/80 pb-5 sm:pb-6">
		<div class="space-y-1 w-full sm:w-auto">
			<div class="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-500 uppercase">Statement of Position</div>
			<div class="text-3xl sm:text-5xl font-mono tabular-nums font-semibold tracking-tight text-[#f5f2ea] truncate">
				{formatCurrency(stats.net)}
			</div>
			<div class="text-[11px] sm:text-xs text-stone-400 flex items-center gap-2 pt-0.5 flex-wrap">
				<span>{filteredTransactions.length} operations</span>
				<span class="text-stone-600">•</span>
				<span class="text-[#82b896] font-mono tabular-nums">{stats.savingsRate}% retention</span>
			</div>
		</div>

		<!-- Time Switcher (Full width on mobile) -->
		<div class="grid grid-cols-3 sm:flex items-center p-1 bg-[#171715] border border-stone-800 rounded-xl text-xs w-full sm:w-auto">
			<button
				onclick={() => (timeFilter = 'all')}
				class="py-2 sm:py-1 px-2.5 sm:px-3 text-center rounded-lg transition-colors min-h-[36px] sm:min-h-0 {timeFilter === 'all'
					? 'bg-[#22211e] text-[#f5f2ea] shadow-sm font-medium'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				All
			</button>
			<button
				onclick={() => (timeFilter = 'this_month')}
				class="py-2 sm:py-1 px-2.5 sm:px-3 text-center rounded-lg transition-colors min-h-[36px] sm:min-h-0 {timeFilter === 'this_month'
					? 'bg-[#22211e] text-[#f5f2ea] shadow-sm font-medium'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				This Month
			</button>
			<button
				onclick={() => (timeFilter = 'last_month')}
				class="py-2 sm:py-1 px-2.5 sm:px-3 text-center rounded-lg transition-colors min-h-[36px] sm:min-h-0 {timeFilter === 'last_month'
					? 'bg-[#22211e] text-[#f5f2ea] shadow-sm font-medium'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				Last Month
			</button>
		</div>
	</div>

	<!-- Minimal Flow Indicators: 2x2 on mobile, 4 columns on large -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
		<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[10px] sm:text-[11px] text-stone-500 font-medium uppercase tracking-wider truncate">Total Inflow</div>
			<div class="text-base sm:text-xl font-mono tabular-nums font-semibold text-[#82b896] truncate">
				+{formatCurrency(stats.income)}
			</div>
		</div>

		<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[10px] sm:text-[11px] text-stone-500 font-medium uppercase tracking-wider truncate">Total Outflow</div>
			<div class="text-base sm:text-xl font-mono tabular-nums font-semibold text-stone-300 truncate">
				-{formatCurrency(stats.expense)}
			</div>
		</div>

		<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[10px] sm:text-[11px] text-stone-500 font-medium uppercase tracking-wider truncate">Bank & Cash</div>
			<div class="text-base sm:text-xl font-mono tabular-nums font-semibold text-stone-300 truncate">
				{formatCurrency((parseFloat(appState.settings.reconciliation.hdfc) || 0) + (parseFloat(appState.settings.reconciliation.kvb) || 0) + (parseFloat(appState.settings.reconciliation.cash) || 0))}
			</div>
		</div>

		<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[10px] sm:text-[11px] text-stone-500 font-medium uppercase tracking-wider truncate">Receivables</div>
			<div class="text-base sm:text-xl font-mono tabular-nums font-semibold text-[#82b896] truncate">
				{formatCurrency(parseFloat(appState.settings.reconciliation.creditsOwed) || 0)}
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
