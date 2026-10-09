<script lang="ts">
	import { appState } from '#lib/state.svelte';

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

	const categoryBreakdown = $derived.by(() => {
		const expenseTxs = filteredTxs.filter((t) => t.type === 'debit');
		const map: Record<string, number> = {};

		for (const tx of expenseTxs) {
			const cat = tx.category || 'Uncategorized';
			map[cat] = (map[cat] || 0) + tx.amount;
		}

		const totalExpense = totals.debit > 0 ? totals.debit : 1;
		const items = Object.entries(map).map(([name, amount]) => ({
			name,
			amount,
			percentage: (amount / totalExpense) * 100
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
	<div class="flex items-baseline justify-between border-b border-stone-800/80 pb-4">
		<div>
			<div class="text-[11px] font-medium tracking-wider text-stone-500 uppercase">Capital Allocation</div>
			<h1 class="text-2xl font-serif tracking-tight text-[#f5f2ea] mt-0.5">Category Distribution</h1>
		</div>

		<!-- Time Switcher -->
		<div class="flex items-center p-0.5 bg-[#171715] border border-stone-800 rounded-lg text-xs">
			<button
				onclick={() => (timeRange = 'this_month')}
				class="px-3 py-1 rounded-md transition-colors {timeRange === 'this_month'
					? 'bg-[#22211e] text-[#f5f2ea] shadow-sm'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				This Month
			</button>
			<button
				onclick={() => (timeRange = 'last_month')}
				class="px-3 py-1 rounded-md transition-colors {timeRange === 'last_month'
					? 'bg-[#22211e] text-[#f5f2ea] shadow-sm'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				Last Month
			</button>
			<button
				onclick={() => (timeRange = 'all')}
				class="px-3 py-1 rounded-md transition-colors {timeRange === 'all'
					? 'bg-[#22211e] text-[#f5f2ea] shadow-sm'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				All
			</button>
		</div>
	</div>

	<!-- Minimal Flow Overview -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[11px] text-stone-500 font-medium uppercase tracking-wider">Inflow</div>
			<div class="text-xl font-mono tabular-nums font-semibold text-[#82b896]">
				+{formatCurrency(totals.credit)}
			</div>
		</div>

		<div class="p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[11px] text-stone-500 font-medium uppercase tracking-wider">Outflow</div>
			<div class="text-xl font-mono tabular-nums font-semibold text-stone-300">
				-{formatCurrency(totals.debit)}
			</div>
		</div>

		<div class="p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-1">
			<div class="text-[11px] text-stone-500 font-medium uppercase tracking-wider">Net Retained</div>
			<div class="text-xl font-mono tabular-nums font-semibold {totals.net >= 0 ? 'text-[#f5f2ea]' : 'text-[#e06c75]'}">
				{formatCurrency(totals.net)}
			</div>
		</div>
	</div>

	<!-- Category List Card -->
	<div class="p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-4">
		<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">Expense Breakdown by Category</div>

		{#if categoryBreakdown.length === 0}
			<div class="py-12 text-center text-stone-500 text-xs">
				No debit entries found in this timeframe.
			</div>
		{:else}
			<div class="space-y-3.5">
				{#each categoryBreakdown as cat}
					<div class="space-y-1">
						<div class="flex items-center justify-between text-xs">
							<span class="font-medium text-stone-300">{cat.name}</span>
							<div class="flex items-center gap-3">
								<span class="font-mono tabular-nums text-stone-500">{cat.percentage.toFixed(1)}%</span>
								<span class="font-mono tabular-nums font-semibold text-[#f5f2ea]">
									{formatCurrency(cat.amount)}
								</span>
							</div>
						</div>
						<div class="w-full h-1.5 rounded-full bg-[#111110] overflow-hidden">
							<div
								class="h-full rounded-full bg-stone-500 transition-all duration-300"
								style="width: {cat.percentage}%;"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
