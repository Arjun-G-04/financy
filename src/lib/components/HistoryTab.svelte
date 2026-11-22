<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency as formatCur } from '#lib/utils';
	import TransactionFeed from '#lib/components/TransactionFeed.svelte';
	import DateRangeFilter from '#lib/components/DateRangeFilter.svelte';
	import {
		Search,
		X,
		Plus,
		History
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

<div class="space-y-4 sm:space-y-5">
	<!-- Top Section: Physical Instrument Faceplate -->
	<section class="hw-chassis rounded-2xl p-4 sm:p-6 lg:p-7 relative shadow-2xl space-y-4 sm:space-y-5">
		<!-- Faceplate Header -->
		<div class="flex items-center justify-between gap-4 border-b border-[#292924] pb-4 px-1 sm:px-2">
			<div class="flex items-center gap-2.5 sm:gap-3">
				<History class="w-6 h-6 sm:w-7 sm:h-7 text-[#82b896] stroke-[2.2]" />
				<span class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
					HISTORICAL LEDGER & JOURNAL
				</span>
			</div>

			<!-- Tactile New Button -->
			<button
				type="button"
				onclick={() => appState.openTransactionModal()}
				class="hw-keycap-primary flex items-center justify-center gap-2 px-4 py-2 sm:py-2 text-xs font-mono font-bold tracking-wider cursor-pointer min-h-[42px] sm:min-h-[38px] shadow-md"
				aria-label="Record Entry"
			>
				<Plus class="w-3.5 h-3.5 stroke-[2.5]" />
				<span>RECORD ENTRY</span>
			</button>
		</div>

		<!-- Telemetry Filter Console -->
		<div class="space-y-3.5 pt-1">
			<!-- Search and Category Filters -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
				<!-- Search -->
				<div class="relative">
					<Search class="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
					<input
						type="text"
						placeholder="Search description or note..."
						bind:value={searchQuery}
						class="w-full pl-8 pr-3 py-2.5 sm:py-2 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono placeholder:text-stone-600 focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] transition-colors"
					/>
				</div>

				<!-- Category Selector -->
				<div>
					<select
						bind:value={selectedCategory}
						class="w-full px-3 py-2.5 sm:py-2 bg-[#10100d] border border-[#292924] rounded-lg text-stone-300 text-base sm:text-xs font-mono focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] transition-colors"
					>
						<option value="">All Categories</option>
						{#each appState.categories as cat}
							<option value={cat.name}>{cat.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Date Range Filters & Presets -->
			<div class="pt-3 border-t border-[#292924]/80">
				<DateRangeFilter
					bind:startDate
					bind:endDate
					presets={['all', '7days', 'month', '30days']}
					title="Query Window"
				/>
			</div>

			<!-- Type Filter & Reset Bar -->
			<div class="flex items-center justify-between gap-2 pt-2 border-t border-[#292924]/60 text-xs flex-wrap">
				<div class="flex items-center gap-1 bg-[#0c0c0a] p-1 rounded-xl border border-[#262622] w-full sm:w-auto">
					<button
						type="button"
						onclick={() => (selectedType = 'all')}
						class="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-mono transition-all min-h-[36px] sm:min-h-0 cursor-pointer {selectedType === 'all'
							? 'bg-[#22221e] text-[#f5f2ea] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
							: 'text-stone-400 hover:text-stone-200 hover:bg-[#181815]'}"
					>
						ALL ({filteredTransactions.length})
					</button>
					<button
						type="button"
						onclick={() => (selectedType = 'debit')}
						class="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-mono transition-all min-h-[36px] sm:min-h-0 cursor-pointer {selectedType === 'debit'
							? 'bg-[#22221e] text-[#e06c75] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
							: 'text-stone-400 hover:text-rose-300 hover:bg-[#181815]'}"
					>
						DEBITS
					</button>
					<button
						type="button"
						onclick={() => (selectedType = 'credit')}
						class="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-mono transition-all min-h-[36px] sm:min-h-0 cursor-pointer {selectedType === 'credit'
							? 'bg-[#22221e] text-[#82b896] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
							: 'text-stone-400 hover:text-emerald-300 hover:bg-[#181815]'}"
					>
						CREDITS
					</button>
				</div>

				{#if hasActiveFilters}
					<button
						type="button"
						onclick={resetFilters}
						class="hw-keycap flex items-center gap-1 text-stone-300 hover:text-stone-100 py-1.5 px-2.5 rounded-lg text-xs font-mono min-h-[36px] sm:min-h-0 cursor-pointer"
					>
						<X class="w-3.5 h-3.5 text-[#f97316]" />
						<span>RESET FILTERS</span>
					</button>
				{/if}
			</div>
		</div>

		<!-- VFD Telemetry Flow Readouts -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
			<!-- Filtered Inflow -->
			<div class="hw-vfd-display p-3 sm:p-4 rounded-xl flex flex-col justify-between space-y-1">
				<div class="text-[9px] font-mono text-[#82b896]/70 uppercase tracking-widest">
					FILTERED INFLOW
				</div>
				<div class="text-xl sm:text-2xl font-mono tabular-nums font-bold text-[#82b896] drop-shadow-[0_0_8px_rgba(130,184,150,0.3)] truncate">
					{formatCurrency(totals.credit)}
				</div>
			</div>

			<!-- Filtered Outflow -->
			<div class="hw-vfd-display hw-vfd-rose p-3 sm:p-4 rounded-xl flex flex-col justify-between space-y-1">
				<div class="text-[9px] font-mono text-rose-300/70 uppercase tracking-widest">
					FILTERED OUTFLOW
				</div>
				<div class="text-xl sm:text-2xl font-mono tabular-nums font-bold text-[#e06c75] drop-shadow-[0_0_8px_rgba(224,108,117,0.4)] truncate">
					{formatCurrency(totals.debit)}
				</div>
			</div>

			<!-- Filtered Net Position -->
			<div class="hw-vfd-display {totals.net < 0 ? 'hw-vfd-rose' : ''} p-3 sm:p-4 rounded-xl flex flex-col justify-between space-y-1">
				<div class="text-[9px] font-mono {totals.net >= 0 ? 'text-[#82b896]/70' : 'text-rose-300/70'} uppercase tracking-widest">
					FILTERED NET
				</div>
				<div class="text-xl sm:text-2xl font-mono tabular-nums font-bold {totals.net >= 0 ? 'text-[#82b896] drop-shadow-[0_0_8px_rgba(130,184,150,0.3)]' : 'text-[#e06c75] drop-shadow-[0_0_8px_rgba(224,108,117,0.4)]'} truncate">
					{formatCurrency(totals.net)}
				</div>
			</div>
		</div>
	</section>

	<!-- Unified Records Panel with Seamless Protrusions -->
	<section class="relative">
		<!-- Seamless Extruded Flange Row -->
		<div class="flex items-end justify-between relative z-10 -mb-[1px]">
			<!-- Left Protrusion (Filtered Ledger) -->
			<div
				class="bg-[#171714] border-t border-l border-r border-[#2e2e28] rounded-tl-xl rounded-tr-lg px-4 sm:px-6 py-2.5 min-h-[44px] flex items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
			>
				<span class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
					FILTERED LEDGER ({filteredTransactions.length})
				</span>
			</div>

			<!-- Center Recessed Shelf bridging the two protrusions -->
			<div class="flex-1 border-b border-[#2e2e28] h-[1px] self-end"></div>
		</div>

		<!-- Transaction Feed Table with Matching Border -->
		<TransactionFeed
			transactions={visibleTransactions}
			class="rounded-b-2xl rounded-tr-2xl rounded-tl-none border-[#2e2e28]"
			emptyMessage="No matching ledger entries found."
			onDelete={handleDelete}
		/>

		<!-- Infinite Scroll Sentinel & Load Status -->
		{#if hasMore}
			<div bind:this={sentinelEl} class="py-6 flex flex-col items-center justify-center gap-2.5">
				<div class="flex items-center gap-2 text-xs font-mono text-stone-500">
					<div class="w-3.5 h-3.5 border-2 border-stone-600 border-t-[#f97316] rounded-full animate-spin"></div>
					<span>Showing {visibleTransactions.length} of {filteredTransactions.length} records • Scroll to load more</span>
				</div>
				<button
					type="button"
					onclick={loadMore}
					class="hw-keycap text-[11px] font-mono text-stone-300 hover:text-stone-100 px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
				>
					Load next {Math.min(PAGE_SIZE, filteredTransactions.length - visibleCount)} records
				</button>
			</div>
		{:else if filteredTransactions.length > PAGE_SIZE}
			<div class="py-6 text-center text-xs font-mono text-stone-500 border-t border-[#292924]/60">
				All {filteredTransactions.length} records cleared and loaded
			</div>
		{/if}
	</section>
</div>