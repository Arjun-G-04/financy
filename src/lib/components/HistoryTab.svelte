<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency as formatCur } from '#lib/utils';
	import TransactionFeed from '#lib/components/TransactionFeed.svelte';
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
			<div class="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-500 uppercase">General Ledger</div>
			<h1 class="text-xl sm:text-2xl font-serif tracking-tight text-[#f5f2ea] mt-0.5">Chronological Journal</h1>
		</div>

		<button
			onclick={() => appState.openTransactionModal()}
			class="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-[#eeebe3] active:scale-95 hover:bg-white text-[#111110] font-medium text-xs transition-all shadow-sm min-h-[36px] sm:min-h-0"
		>
			<Plus class="w-3.5 h-3.5 stroke-[2.2]" />
			<span>Record Entry</span>
		</button>
	</div>

	<!-- Minimal Filter Bar -->
	<div class="p-3.5 sm:p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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

			<!-- Start Date -->
			<div>
				<input
					type="date"
					placeholder="Start Date"
					bind:value={startDate}
					class="w-full px-3 py-2 sm:py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-base sm:text-xs focus:outline-none focus:border-stone-600 transition-colors font-mono"
				/>
			</div>

			<!-- End Date -->
			<div>
				<input
					type="date"
					placeholder="End Date"
					bind:value={endDate}
					class="w-full px-3 py-2 sm:py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-base sm:text-xs focus:outline-none focus:border-stone-600 transition-colors font-mono"
				/>
			</div>
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
						? 'bg-[#22211e] text-rose-300 font-medium'
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
			<div class="font-mono tabular-nums font-semibold text-stone-300 mt-0.5 text-xs sm:text-sm truncate">{formatCurrency(totals.debit)}</div>
		</div>
		<div class="min-w-0">
			<div class="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-wider truncate">Filtered Net</div>
			<div class="font-mono tabular-nums font-semibold {totals.net >= 0 ? 'text-[#f5f2ea]' : 'text-[#e06c75]'} mt-0.5 text-xs sm:text-sm truncate">
				{formatCurrency(totals.net)}
			</div>
		</div>
	</div>

	<TransactionFeed
		transactions={filteredTransactions}
		emptyMessage="No matching entries."
		onDelete={handleDelete}
	/>
</div>
