<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/server/db';
	import {
		ArrowRight,
		Pencil,
		Trash2,
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
		const sym = appState.settings.currencySymbol || '₹';
		return `${sym}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

<div class="space-y-8">
	<!-- Top Section: Capital Statement & Time Toggle -->
	<div class="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4 border-b border-stone-800/80 pb-6">
		<div class="space-y-1">
			<div class="text-[11px] font-medium tracking-wider text-stone-500 uppercase">Statement of Position</div>
			<div class="text-4xl sm:text-5xl font-mono tabular-nums font-semibold tracking-tight text-[#f5f2ea]">
				{formatCurrency(stats.net)}
			</div>
			<div class="text-xs text-stone-400 flex items-center gap-2 pt-0.5">
				<span>{filteredTransactions.length} recorded operations</span>
				<span class="text-stone-600">•</span>
				<span class="text-[#82b896] font-mono tabular-nums">{stats.savingsRate}% retention</span>
			</div>
		</div>

		<!-- Time Switcher -->
		<div class="flex items-center p-0.5 bg-[#171715] border border-stone-800 rounded-lg text-xs">
			<button
				onclick={() => (timeFilter = 'all')}
				class="px-3 py-1 rounded-md transition-colors {timeFilter === 'all'
					? 'bg-[#22211e] text-[#f5f2ea] shadow-sm'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				All
			</button>
			<button
				onclick={() => (timeFilter = 'this_month')}
				class="px-3 py-1 rounded-md transition-colors {timeFilter === 'this_month'
					? 'bg-[#22211e] text-[#f5f2ea] shadow-sm'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				This Month
			</button>
			<button
				onclick={() => (timeFilter = 'last_month')}
				class="px-3 py-1 rounded-md transition-colors {timeFilter === 'last_month'
					? 'bg-[#22211e] text-[#f5f2ea] shadow-sm'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				Last Month
			</button>
		</div>
	</div>

	<!-- Minimal Flow Indicators Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[11px] text-stone-500 font-medium uppercase tracking-wider">Total Inflow</div>
			<div class="text-xl font-mono tabular-nums font-semibold text-[#82b896]">
				+{formatCurrency(stats.income)}
			</div>
		</div>

		<div class="p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[11px] text-stone-500 font-medium uppercase tracking-wider">Total Outflow</div>
			<div class="text-xl font-mono tabular-nums font-semibold text-stone-300">
				-{formatCurrency(stats.expense)}
			</div>
		</div>

		<div class="p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[11px] text-stone-500 font-medium uppercase tracking-wider">HDFC & KVB Cash</div>
			<div class="text-xl font-mono tabular-nums font-semibold text-stone-300">
				{formatCurrency((parseFloat(appState.settings.reconciliation.hdfc) || 0) + (parseFloat(appState.settings.reconciliation.kvb) || 0) + (parseFloat(appState.settings.reconciliation.cash) || 0))}
			</div>
		</div>

		<div class="p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[11px] text-stone-500 font-medium uppercase tracking-wider">Credits Receivable</div>
			<div class="text-xl font-mono tabular-nums font-semibold text-[#82b896]">
				{formatCurrency(parseFloat(appState.settings.reconciliation.creditsOwed) || 0)}
			</div>
		</div>
	</div>

	<!-- Recent Operations Stream -->
	<div class="space-y-3">
		<div class="flex items-center justify-between pb-1">
			<div class="text-xs uppercase tracking-wider font-semibold text-stone-400">Recent Operations</div>
			<button
				onclick={() => (appState.activeTab = 'history')}
				class="text-xs text-stone-400 hover:text-stone-200 transition-colors inline-flex items-center gap-1"
			>
				<span>View all {appState.transactions.length}</span>
				<ArrowRight class="w-3.5 h-3.5" />
			</button>
		</div>

		<div class="border border-stone-800/80 rounded-xl bg-[#171715] divide-y divide-stone-800/60 overflow-hidden">
			{#if recentTransactions.length === 0}
				<div class="py-12 text-center text-stone-500 text-xs">
					No records found.
				</div>
			{:else}
				{#each recentTransactions as tx (tx.id)}
					<div class="px-4 py-3 flex items-center justify-between hover:bg-[#1d1c19] transition-colors group">
						<div class="flex items-center gap-3 min-w-0">
							<span class="text-xs font-mono tabular-nums text-stone-500 shrink-0">{tx.date}</span>
							<span class="text-sm font-medium text-stone-200 truncate">{tx.name}</span>
							{#if tx.category}
								<span class="text-[11px] text-stone-400 px-2 py-0.5 rounded bg-[#1f1e1b] border border-stone-800 shrink-0">
									{tx.category}
								</span>
							{/if}
						</div>

						<div class="flex items-center gap-4 shrink-0">
							<span class="font-mono tabular-nums text-sm font-semibold {tx.type === 'credit' ? 'text-[#82b896]' : 'text-stone-200'}">
								{tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
							</span>

							<!-- Action Buttons -->
							<div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
								<button
									onclick={() => {
										appState.editingTransaction = tx;
										appState.isTransactionModalOpen = true;
									}}
									class="p-1 rounded text-stone-400 hover:text-stone-200 transition-colors"
									title="Edit"
								>
									<Pencil class="w-3.5 h-3.5" />
								</button>
								<button
									onclick={() => handleDelete(tx)}
									class="p-1 rounded text-stone-400 hover:text-rose-400 transition-colors"
									title="Delete"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
