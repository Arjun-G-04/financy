<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { PieChart, TrendingUp, TrendingDown, Calendar, Tag } from '@lucide/svelte';

	let timeRange = $state<'this_month' | 'last_month' | 'all'>('this_month');

	const now = new Date();
	const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

	const filteredTxs = $derived.by(() => {
		if (timeRange === 'this_month') {
			return appState.transactions.filter((t) => t.date.startsWith(thisMonthStr));
		}
		if (timeRange === 'last_month') {
			return appState.transactions.filter((t) => t.date.startsWith(lastMonthStr));
		}
		return appState.transactions;
	});

	const totals = $derived.by(() => {
		let credit = 0;
		let debit = 0;
		for (const tx of filteredTxs) {
			if (tx.type === 'credit') credit += tx.amount;
			else debit += tx.amount;
		}
		return { credit, debit, net: credit - debit };
	});

	// Palette for categories
	const categoryColors = [
		'#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
		'#06B6D4', '#84CC16', '#6366F1', '#14B8A6', '#F97316'
	];

	const categoryBreakdown = $derived.by(() => {
		const expenseTxs = filteredTxs.filter((t) => t.type === 'debit');
		const map: Record<string, number> = {};

		for (const tx of expenseTxs) {
			const cat = tx.category || 'Uncategorized';
			map[cat] = (map[cat] || 0) + tx.amount;
		}

		const totalExpense = totals.debit > 0 ? totals.debit : 1;
		const items = Object.entries(map).map(([name, amount], idx) => ({
			name,
			amount,
			percentage: (amount / totalExpense) * 100,
			color: categoryColors[idx % categoryColors.length]
		}));

		return items.sort((a, b) => b.amount - a.amount);
	});

	function formatCurrency(val: number) {
		const sym = appState.settings.currencySymbol || '₹';
		return `${sym}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-100">Financial Analytics</h1>
			<p class="text-sm text-zinc-400">Insights into your category spending distribution and cash flow.</p>
		</div>

		<div class="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
			<button
				onclick={() => (timeRange = 'this_month')}
				class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {timeRange === 'this_month'
					? 'bg-zinc-800 text-zinc-100 shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				This Month
			</button>
			<button
				onclick={() => (timeRange = 'last_month')}
				class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {timeRange === 'last_month'
					? 'bg-zinc-800 text-zinc-100 shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				Last Month
			</button>
			<button
				onclick={() => (timeRange = 'all')}
				class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {timeRange === 'all'
					? 'bg-zinc-800 text-zinc-100 shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				All Time
			</button>
		</div>
	</div>

	<!-- Income vs Expense Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm">
			<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Income</span>
			<div class="text-2xl font-bold text-emerald-400 mt-2">
				{formatCurrency(totals.credit)}
			</div>
			<div class="text-xs text-zinc-500 mt-1">Earnings in selected range</div>
		</div>

		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm">
			<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Expenses</span>
			<div class="text-2xl font-bold text-rose-400 mt-2">
				{formatCurrency(totals.debit)}
			</div>
			<div class="text-xs text-zinc-500 mt-1">Spending in selected range</div>
		</div>

		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm">
			<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Net Cash Flow</span>
			<div class="text-2xl font-bold {totals.net >= 0 ? 'text-zinc-100' : 'text-rose-400'} mt-2">
				{formatCurrency(totals.net)}
			</div>
			<div class="text-xs text-zinc-500 mt-1">Retained savings</div>
		</div>
	</div>

	<!-- Spending by Category Breakdown -->
	<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-6">
		<div>
			<h2 class="text-lg font-bold text-zinc-100">Category Spending Breakdown</h2>
			<p class="text-xs text-zinc-400">Where your expenses went in this timeframe</p>
		</div>

		{#if categoryBreakdown.length === 0}
			<div class="py-12 text-center text-zinc-500">
				No expenses found for this time range.
			</div>
		{:else}
			<div class="space-y-4">
				{#each categoryBreakdown as cat}
					<div class="space-y-1.5">
						<div class="flex items-center justify-between text-sm">
							<div class="flex items-center gap-2">
								<span
									class="w-3 h-3 rounded-full"
									style="background-color: {cat.color};"
								></span>
								<span class="font-medium text-zinc-200">{cat.name}</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-xs text-zinc-400 font-mono">
									{cat.percentage.toFixed(1)}%
								</span>
								<span class="font-bold text-zinc-100">
									{formatCurrency(cat.amount)}
								</span>
							</div>
						</div>
						<!-- Progress bar -->
						<div class="w-full h-2 rounded-full bg-zinc-950 overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-500"
								style="width: {cat.percentage}%; background-color: {cat.color};"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
