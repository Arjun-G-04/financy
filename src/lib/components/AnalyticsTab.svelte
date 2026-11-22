<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import DatePicker from '#lib/components/DatePicker.svelte';
	import AllocationRing from '#lib/components/AllocationRing.svelte';
import DailySpendChart from '#lib/components/DailySpendChart.svelte';
	import { formatCurrency as formatCur, formatDate, getCategoryColor, getPresetDateRange } from '#lib/utils';
	import { Calendar, Eye, EyeOff, RotateCcw, PieChart } from '@lucide/svelte';

	let timeRange = $state<'this_month' | 'last_month' | 'custom' | 'all'>('this_month');
	let customStartDate = $state('');
	let customEndDate = $state('');
	let excludedCategories = $state<string[]>([]);
	let hoveredCategory = $state<string | null>(null);

	function formatCurrency(val: number) {
		return formatCur(val, appState.settings.currencySymbol);
	}

	const now = new Date();
	const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

	// Set default custom dates if not set
	function initCustomDates() {
		if (!customStartDate || !customEndDate) {
			const { start, end } = getPresetDateRange('month');
			customStartDate = start;
			customEndDate = end;
		}
	}

	const filteredTxs = $derived.by(() => {
		if (timeRange === 'this_month') {
			return appState.transactions.filter((t) => t.date.startsWith(thisMonthStr));
		}
		if (timeRange === 'last_month') {
			return appState.transactions.filter((t) => t.date.startsWith(lastMonthStr));
		}
		if (timeRange === 'custom') {
			return appState.transactions.filter((t) => {
				if (customStartDate && t.date < customStartDate) return false;
				if (customEndDate && t.date > customEndDate) return false;
				return true;
			});
		}
		return appState.transactions;
	});

	// Active date boundaries for trend projections
	const activeDateWindow = $derived.by(() => {
		if (timeRange === 'this_month') {
			const start = `${thisMonthStr}-01`;
			const end = formatDate(now);
			return { start, end };
		}
		if (timeRange === 'last_month') {
			const start = `${lastMonthStr}-01`;
			const lastDay = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).getDate();
			const end = `${lastMonthStr}-${String(lastDay).padStart(2, '0')}`;
			return { start, end };
		}
		if (timeRange === 'custom') {
			return { start: customStartDate, end: customEndDate };
		}
		// 'all'
		if (activeExpenseTxs.length > 0) {
			const dates = activeExpenseTxs.map((t) => t.date).sort();
			return { start: dates[0], end: dates[dates.length - 1] };
		}
		return { start: formatDate(new Date(now.getTime() - 30 * 86400000)), end: formatDate(now) };
	});

	// Totals of all debit/credit in the selected date window (before category exclusions)
	const rawTotals = $derived.by(() => {
		let credit = 0;
		let debit = 0;
		for (const tx of filteredTxs) {
			if (tx.type === 'credit') credit += tx.amount;
			else debit += tx.amount;
		}
		return { credit, debit, net: credit - debit };
	});

	// All available expense categories in this timeframe for exclusion controls
	const allAvailableCategories = $derived.by(() => {
		const expenseTxs = filteredTxs.filter((t) => t.type === 'debit');
		const set = new Set<string>();
		for (const tx of expenseTxs) {
			set.add(tx.category || 'Uncategorized');
		}
		return Array.from(set).sort();
	});

	// Active filtered transactions taking category exclusions into account
	const activeExpenseTxs = $derived.by(() => {
		const excludedSet = new Set(excludedCategories);
		return filteredTxs.filter((t) => {
			if (t.type !== 'debit') return false;
			const cat = t.category || 'Uncategorized';
			return !excludedSet.has(cat);
		});
	});

	const activeExpenseTotal = $derived(
		activeExpenseTxs.reduce((sum, tx) => sum + tx.amount, 0)
	);

	const totals = $derived({
		credit: rawTotals.credit,
		debit: activeExpenseTotal,
		net: rawTotals.credit - activeExpenseTotal
	});

	const categoryBreakdown = $derived.by(() => {
		const map: Record<string, number> = {};

		for (const tx of activeExpenseTxs) {
			const cat = tx.category || 'Uncategorized';
			map[cat] = (map[cat] || 0) + tx.amount;
		}

		const total = activeExpenseTotal > 0 ? activeExpenseTotal : 1;
		const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
		return sorted.map(([name, amount]) => ({
			name,
			amount,
			percentage: (amount / total) * 100,
			color: getCategoryColor(name)
		}));
	});

	function toggleExcludeCategory(catName: string) {
		if (excludedCategories.includes(catName)) {
			excludedCategories = excludedCategories.filter((c) => c !== catName);
		} else {
			excludedCategories = [...excludedCategories, catName];
		}
	}

	function resetExclusions() {
		excludedCategories = [];
	}
</script>

<div class="space-y-4 sm:space-y-5">
	<!-- Top Section: Physical Instrument Faceplate -->
	<section class="hw-chassis rounded-2xl p-4 sm:p-6 lg:p-7 relative shadow-2xl space-y-4 sm:space-y-5">
		<!-- Faceplate Header -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#292924] pb-4 px-1 sm:px-2 gap-3">
			<div class="flex items-center gap-2.5 sm:gap-3">
				<PieChart class="w-6 h-6 sm:w-7 sm:h-7 text-[#82b896] stroke-[2.2]" />
				<span class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
					FINANCIAL TELEMETRY & ANALYTICS
				</span>
			</div>

			<!-- Time Switcher Tabs: Hardware Tactile Keycap Bay -->
			<div class="grid grid-cols-2 sm:flex items-center p-1 bg-[#0c0c0a] border border-[#262622] rounded-xl text-xs w-full sm:w-auto gap-1">
				<button
					type="button"
					onclick={() => (timeRange = 'this_month')}
					class="py-2 sm:py-1.5 px-3 text-center rounded-lg text-xs font-mono transition-all min-h-[36px] sm:min-h-0 cursor-pointer {timeRange === 'this_month'
						? 'bg-[#22221e] text-[#f5f2ea] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
						: 'text-stone-400 hover:text-stone-200 hover:bg-[#181815]'}"
				>
					THIS MONTH
				</button>
				<button
					type="button"
					onclick={() => (timeRange = 'last_month')}
					class="py-2 sm:py-1.5 px-3 text-center rounded-lg text-xs font-mono transition-all min-h-[36px] sm:min-h-0 cursor-pointer {timeRange === 'last_month'
						? 'bg-[#22221e] text-[#f5f2ea] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
						: 'text-stone-400 hover:text-stone-200 hover:bg-[#181815]'}"
				>
					LAST MONTH
				</button>
				<button
					type="button"
					onclick={() => {
						timeRange = 'custom';
						initCustomDates();
					}}
					class="py-2 sm:py-1.5 px-3 text-center rounded-lg text-xs font-mono transition-all min-h-[36px] sm:min-h-0 cursor-pointer {timeRange === 'custom'
						? 'bg-[#22221e] text-[#f5f2ea] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
						: 'text-stone-400 hover:text-stone-200 hover:bg-[#181815]'}"
				>
					CUSTOM RANGE
				</button>
				<button
					type="button"
					onclick={() => (timeRange = 'all')}
					class="py-2 sm:py-1.5 px-3 text-center rounded-lg text-xs font-mono transition-all min-h-[36px] sm:min-h-0 cursor-pointer {timeRange === 'all'
						? 'bg-[#22221e] text-[#f5f2ea] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
						: 'text-stone-400 hover:text-stone-200 hover:bg-[#181815]'}"
				>
					ALL TIME
				</button>
			</div>
		</div>

		<!-- Custom Date Range Picker Container -->
		{#if timeRange === 'custom'}
			<div class="p-4 rounded-xl bg-[#10100d] border border-[#292924] space-y-3">
				<div class="text-xs font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
					<Calendar class="w-3.5 h-3.5 text-stone-500" />
					<span>SELECT DATE INTERVAL</span>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<DatePicker
							bind:value={customStartDate}
							label="Start Date"
							placeholder="From"
						/>
					</div>
					<div>
						<DatePicker
							bind:value={customEndDate}
							label="End Date"
							placeholder="To"
						/>
					</div>
				</div>
			</div>
		{/if}

		<!-- Category Filtering / Exclusions Toolbar -->
		{#if allAvailableCategories.length > 0}
			<div class="p-3.5 sm:p-4 rounded-xl bg-[#10100d] border border-[#292924] space-y-2">
				<div class="flex items-center justify-between text-xs">
					<span class="text-stone-400 font-mono text-[11px] uppercase tracking-wider font-bold">
						FILTER CATEGORIES ({allAvailableCategories.length}):
					</span>
					{#if excludedCategories.length > 0}
						<button
							type="button"
							onclick={resetExclusions}
							class="text-[11px] font-mono text-[#f97316] hover:text-[#fb923c] flex items-center gap-1 transition-colors cursor-pointer"
						>
							<RotateCcw class="w-3 h-3" />
							<span>RESET ({excludedCategories.length} EXCLUDED)</span>
						</button>
					{/if}
				</div>

				<div class="flex flex-wrap gap-1.5 pt-1">
					{#each allAvailableCategories as cat}
						{@const isExcluded = excludedCategories.includes(cat)}
						<button
							type="button"
							onclick={() => toggleExcludeCategory(cat)}
							class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer
								{isExcluded
								? 'bg-[#080807] text-stone-500 border-[#22221d] line-through opacity-60 hover:opacity-100 hover:text-stone-300'
								: 'bg-[#1c1c19] text-stone-200 border-[#2e2e28] hover:border-stone-500 shadow-sm'}"
							title={isExcluded ? `Click to include ${cat}` : `Click to exclude ${cat}`}
						>
							{#if isExcluded}
								<EyeOff class="w-3 h-3 text-stone-500" />
							{:else}
								<Eye class="w-3 h-3 text-[#82b896]" />
							{/if}
							<span>{cat}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- VFD Telemetry Flow Meters -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
			<!-- Inflow Meter -->
			<div class="hw-vfd-display p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-2">
				<div class="text-[10px] font-mono uppercase tracking-wider text-[#82b896]/70 font-bold">
					INFLOW
				</div>
				<div class="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-[#82b896] drop-shadow-[0_0_8px_rgba(130,184,150,0.3)] truncate">
					{formatCurrency(totals.credit)}
				</div>
			</div>

			<!-- Active Outflow Meter -->
			<div class="hw-vfd-display hw-vfd-rose p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-2">
				<div class="text-[10px] font-mono uppercase tracking-wider text-rose-300/70 font-bold">
					ACTIVE OUTFLOW
				</div>
				<div class="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-[#e06c75] drop-shadow-[0_0_12px_rgba(224,108,117,0.5)] truncate">
					{formatCurrency(totals.debit)}
				</div>
				{#if rawTotals.debit !== totals.debit}
					<div class="text-[10px] font-mono text-stone-500">
						({formatCurrency(rawTotals.debit - totals.debit)} excluded)
					</div>
				{/if}
			</div>

			<!-- Active Net Flow Meter -->
			<div class="hw-vfd-display {totals.net < 0 ? 'hw-vfd-rose' : ''} p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-2">
				<div class="text-[10px] font-mono uppercase tracking-wider {totals.net >= 0 ? 'text-[#82b896]/70' : 'text-rose-300/70'} font-bold">
					ACTIVE NET FLOW
				</div>
				<div class="text-2xl sm:text-3xl font-mono tabular-nums font-bold {totals.net >= 0 ? 'text-[#82b896] drop-shadow-[0_0_8px_rgba(130,184,150,0.3)]' : 'text-[#e06c75] drop-shadow-[0_0_12px_rgba(224,108,117,0.5)]'} truncate">
					{formatCurrency(Math.abs(totals.net))}
				</div>
			</div>
		</div>
	</section>

	<!-- Category Allocation Ring Component -->
	<AllocationRing categories={categoryBreakdown} totalAmount={activeExpenseTotal} />

	<!-- Category List Card (Horizontal Bars Section) -->
	<section class="hw-chassis rounded-2xl p-5 sm:p-6 border border-[#292924] space-y-4 shadow-xl">
		<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
			EXPENSE BREAKDOWN BY CATEGORY
		</div>

		{#if categoryBreakdown.length === 0}
			<div class="py-8 text-center text-stone-500 text-xs font-mono">
				No debit entries recorded for this period.
			</div>
		{:else}
			<div class="space-y-3">
				{#each categoryBreakdown as cat}
					<div
						role="button"
						tabindex="0"
						onmouseenter={() => (hoveredCategory = cat.name)}
						onmouseleave={() => (hoveredCategory = null)}
						class="space-y-1.5 p-2 rounded-lg transition-colors {hoveredCategory === cat.name ? 'bg-[#1f1e1b]' : ''}"
					>
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-2">
								<span
									class="w-2 h-2 rounded-full shrink-0"
									style="background-color: {cat.color};"
								></span>
								<span class="font-mono text-xs font-bold text-stone-200">{cat.name}</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="font-mono tabular-nums text-stone-500">{cat.percentage.toFixed(1)}%</span>
								<span class="font-mono tabular-nums font-bold text-[#f5f2ea]">
									{formatCurrency(cat.amount)}
								</span>
							</div>
						</div>
						<div class="w-full h-2 rounded-full bg-[#0c0c0a] border border-[#242420] overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-300"
								style="width: {cat.percentage}%; background-color: {cat.color};"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Daily Spend Trend Chart Component (Spend per Day vs Days) -->
	<DailySpendChart
		transactions={activeExpenseTxs}
		startDate={activeDateWindow.start}
		endDate={activeDateWindow.end}
	/>
</div>
