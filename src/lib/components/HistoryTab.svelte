<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency as formatCur } from '#lib/utils';
	import TransactionFeed from '#lib/components/TransactionFeed.svelte';
	import DateRangeFilter from '#lib/components/DateRangeFilter.svelte';
	import {
		Search,
		X,
		Plus
	} from '@lucide/svelte';

	let searchQuery = $state('');
	let selectedCategory = $state('');
	let selectedType = $state<'all' | 'credit' | 'debit'>('all');
	let startDate = $state('');
	let endDate = $state('');

	// Pagination / Lazy Loading State
	const PAGE_SIZE = 40;
	let visibleCount = $state(PAGE_SIZE);
	let sentinelEl = $state<HTMLDivElement | null>(null);

	const filteredTransactions = $derived.by(() => {
		return appState.transactions.filter((tx) => {
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const matchName = tx.name.toLowerCase().includes(q);
				const matchCat = tx.category ? tx.category.toLowerCase().includes(q) : false;
				if (!matchName && !matchCat) return false;
			}
			if (selectedCategory && tx.category !== selectedCategory) {
				return false;
			}
			if (selectedType !== 'all' && tx.type !== selectedType) {
				return false;
			}
			if (startDate && tx.date < startDate) {
				return false;
			}
			if (endDate && tx.date > endDate) {
				return false;
			}
			return true;
		});
	});

	// Reset lazy load count only when filter key actually changes
	let lastFilterKey = '';
	const currentFilterKey = $derived(`${searchQuery}:${selectedCategory}:${selectedType}:${startDate}:${endDate}`);

	$effect(() => {
		if (currentFilterKey !== lastFilterKey) {
			lastFilterKey = currentFilterKey;
			visibleCount = PAGE_SIZE;
		}
	});

	const visibleTransactions = $derived(filteredTransactions.slice(0, visibleCount));
	const hasMore = $derived(visibleCount < filteredTransactions.length);

	function loadMore() {
		if (visibleCount < filteredTransactions.length) {
			visibleCount = Math.min(visibleCount + PAGE_SIZE, filteredTransactions.length);
		}
	}

	// Observer for lazy loading on scroll
	$effect(() => {
		if (!sentinelEl) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMore();
				}
			},
			{
				root: null,
				rootMargin: '400px 0px',
				threshold: 0
			}
		);

		observer.observe(sentinelEl);

		return () => {
			observer.disconnect();
		};
	});

	const totals = $derived.by(() => {
		let credit = 0;
		let debit = 0;
		for (const tx of filteredTransactions) {
			if (tx.type === 'credit') credit += tx.amount;
			else debit += tx.amount;
		}
		return { credit, debit, net: credit - debit };
	});

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

	function resetFilters() {
		searchQuery = '';
		selectedCategory = '';
		selectedType = 'all';
		startDate = '';
		endDate = '';
	}

	const hasActiveFilters = $derived(
		!!searchQuery || !!selectedCategory || selectedType !== 'all' || !!startDate || !!endDate
	);
</script>

<div class="space-y-5 sm:space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between border-b border-stone-800/80 pb-4">
		<div>
			<h1 class="text-xl sm:text-2xl font-serif tracking-tight text-[#f5f2ea]">Chronological Journal</h1>
		</div>

		<button
			onclick={() => appState.openTransactionModal()}
			class="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2 rounded-xl bg-[#eeebe3] active:scale-95 hover:bg-white text-[#111110] font-semibold text-xs transition-all shadow-sm min-h-[40px] sm:min-h-[36px]"
		>
			<Plus class="w-3.5 h-3.5 stroke-[2.2]" />
			<span>Record Entry</span>
		</button>
	</div>

	<!-- Minimal Filter Bar -->
	<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3.5">
		<!-- Search and Category Filters -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
			<!-- Search -->
			<div class="relative">
				<Search class="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					placeholder="Search description..."
					bind:value={searchQuery}
					class="w-full pl-8 pr-3 py-2 sm:py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-base sm:text-xs placeholder:text-stone-600 focus:outline-none focus:border-stone-600 transition-colors"
				/>
			</div>

			<!-- Category Selector -->
			<div>
				<select
					bind:value={selectedCategory}
					class="w-full px-3 py-2 sm:py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-base sm:text-xs focus:outline-none focus:border-stone-600 transition-colors"
				>
					<option value="">All Categories</option>
					{#each appState.categories as cat}
						<option value={cat.name}>{cat.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Date Range Filters & Presets -->
		<div class="pt-3 border-t border-stone-800/60">
			<DateRangeFilter
				bind:startDate
				bind:endDate
				presets={['all', '7days', 'month', '30days']}
				title="Query Window"
			/>
		</div>

		<!-- Type Filter & Reset Bar -->
		<div class="flex items-center justify-between gap-2 pt-2 border-t border-stone-800/50 text-xs flex-wrap">
			<div class="flex items-center gap-1 bg-[#111110] p-0.5 rounded-lg border border-stone-800 w-full sm:w-auto">
				<button
					onclick={() => (selectedType = 'all')}
					class="flex-1 sm:flex-initial px-2.5 py-1.5 sm:py-1 rounded text-xs transition-colors min-h-[34px] sm:min-h-0 {selectedType === 'all'
						? 'bg-[#22211e] text-[#f5f2ea] font-medium'
						: 'text-stone-400 hover:text-stone-200'}"
				>
					All ({filteredTransactions.length})
				</button>
				<button
					onclick={() => (selectedType = 'debit')}
					class="flex-1 sm:flex-initial px-2.5 py-1.5 sm:py-1 rounded text-xs transition-colors min-h-[34px] sm:min-h-0 {selectedType === 'debit'
						? 'bg-[#22211e] text-[#e06c75] font-medium'
						: 'text-stone-400 hover:text-stone-200'}"
				>
					Debits
				</button>
				<button
					onclick={() => (selectedType = 'credit')}
					class="flex-1 sm:flex-initial px-2.5 py-1.5 sm:py-1 rounded text-xs transition-colors min-h-[34px] sm:min-h-0 {selectedType === 'credit'
						? 'bg-[#22211e] text-[#82b896] font-medium'
						: 'text-stone-400 hover:text-stone-200'}"
				>
					Credits
				</button>
			</div>

			{#if hasActiveFilters}
				<button
					onclick={resetFilters}
					class="flex items-center gap-1 text-stone-400 hover:text-stone-200 transition-colors py-1 px-2 rounded-md hover:bg-stone-800/40 text-xs min-h-[34px] sm:min-h-0"
				>
					<X class="w-3.5 h-3.5" />
					<span>Reset filters</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Totals Pill Strip -->
	<div class="grid grid-cols-3 gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 rounded-xl bg-[#171715] border border-stone-800/80 text-center text-xs">
		<div class="min-w-0">
			<div class="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-wider truncate">Filtered Inflow</div>
			<div class="font-mono tabular-nums font-semibold text-[#82b896] mt-0.5 text-xs sm:text-sm truncate">{formatCurrency(totals.credit)}</div>
		</div>
		<div class="min-w-0">
			<div class="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-wider truncate">Filtered Outflow</div>
			<div class="font-mono tabular-nums font-semibold text-[#e06c75] mt-0.5 text-xs sm:text-sm truncate">{formatCurrency(totals.debit)}</div>
		</div>
		<div class="min-w-0">
			<div class="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-wider truncate">Filtered Net</div>
			<div class="font-mono tabular-nums font-semibold {totals.net >= 0 ? 'text-[#f5f2ea]' : 'text-[#e06c75]'} mt-0.5 text-xs sm:text-sm truncate">
				{formatCurrency(totals.net)}
			</div>
		</div>
	</div>

	<!-- Transaction Feed (Lazy loaded on scroll) -->
	<TransactionFeed
		transactions={visibleTransactions}
		emptyMessage="No matching entries."
		onDelete={handleDelete}
	/>

	<!-- Infinite Scroll Sentinel & Load Status -->
	{#if hasMore}
		<div bind:this={sentinelEl} class="py-6 flex flex-col items-center justify-center gap-2">
			<div class="flex items-center gap-2 text-xs font-mono text-stone-500">
				<div class="w-3.5 h-3.5 border-2 border-stone-600 border-t-[#c9b48b] rounded-full animate-spin"></div>
				<span>Showing {visibleTransactions.length} of {filteredTransactions.length} records • Scroll to load more</span>
			</div>
			<button
				type="button"
				onclick={loadMore}
				class="text-[11px] font-mono text-stone-400 hover:text-stone-200 px-3 py-1.5 rounded-lg border border-stone-800 bg-[#171715] hover:bg-[#1c1c19] transition-colors"
			>
				Load next {Math.min(PAGE_SIZE, filteredTransactions.length - visibleCount)} records
			</button>
		</div>
	{:else if filteredTransactions.length > PAGE_SIZE}
		<div class="py-6 text-center text-xs font-mono text-stone-500 border-t border-stone-800/40">
			All {filteredTransactions.length} records loaded
		</div>
	{/if}
</div>