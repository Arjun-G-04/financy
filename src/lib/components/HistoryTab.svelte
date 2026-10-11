<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency as formatCur } from '#lib/utils';
	import {
		Search,
		Pencil,
		Trash2,
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

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex items-baseline justify-between border-b border-stone-800/80 pb-4">
		<div>
			<div class="text-[11px] font-medium tracking-wider text-stone-500 uppercase">General Ledger</div>
			<h1 class="text-2xl font-serif tracking-tight text-[#f5f2ea] mt-0.5">Chronological Journal</h1>
		</div>

		<button
			onclick={() => {
				appState.editingTransaction = null;
				appState.isTransactionModalOpen = true;
			}}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eeebe3] hover:bg-white text-[#111110] font-medium text-xs transition-colors shadow-sm"
		>
			<Plus class="w-3.5 h-3.5 stroke-[2.2]" />
			<span>Record Entry</span>
		</button>
	</div>

	<!-- Minimal Filter Bar -->
	<div class="p-4 rounded-xl bg-[#171715] border border-stone-800/80 space-y-3">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
			<!-- Search -->
			<div class="relative">
				<Search class="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					placeholder="Search description..."
					bind:value={searchQuery}
					class="w-full pl-8 pr-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-xs placeholder:text-stone-600 focus:outline-none focus:border-stone-600 transition-colors"
				/>
			</div>

			<!-- Category Selector -->
			<div>
				<select
					bind:value={selectedCategory}
					class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-xs focus:outline-none focus:border-stone-600 transition-colors"
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
					class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-xs focus:outline-none focus:border-stone-600 transition-colors font-mono"
				/>
			</div>

			<!-- End Date -->
			<div>
				<input
					type="date"
					placeholder="End Date"
					bind:value={endDate}
					class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-xs focus:outline-none focus:border-stone-600 transition-colors font-mono"
				/>
			</div>
		</div>

		<!-- Type Filter & Reset Bar -->
		<div class="flex items-center justify-between gap-2 pt-2 border-t border-stone-800/50 text-xs">
			<div class="flex items-center gap-1 bg-[#111110] p-0.5 rounded-lg border border-stone-800">
				<button
					onclick={() => (selectedType = 'all')}
					class="px-2.5 py-1 rounded text-xs transition-colors {selectedType === 'all'
						? 'bg-[#22211e] text-[#f5f2ea]'
						: 'text-stone-400 hover:text-stone-200'}"
				>
					All ({filteredTransactions.length})
				</button>
				<button
					onclick={() => (selectedType = 'debit')}
					class="px-2.5 py-1 rounded text-xs transition-colors {selectedType === 'debit'
						? 'bg-[#22211e] text-rose-300'
						: 'text-stone-400 hover:text-stone-200'}"
				>
					Debits
				</button>
				<button
					onclick={() => (selectedType = 'credit')}
					class="px-2.5 py-1 rounded text-xs transition-colors {selectedType === 'credit'
						? 'bg-[#22211e] text-[#82b896]'
						: 'text-stone-400 hover:text-stone-200'}"
				>
					Credits
				</button>
			</div>

			{#if hasActiveFilters}
				<button
					onclick={resetFilters}
					class="flex items-center gap-1 text-stone-400 hover:text-stone-200 transition-colors"
				>
					<X class="w-3 h-3" />
					<span>Reset filters</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Totals Pill Strip -->
	<div class="grid grid-cols-3 gap-2 px-4 py-3 rounded-xl bg-[#171715] border border-stone-800/80 text-center text-xs">
		<div>
			<div class="text-[10px] text-stone-500 uppercase tracking-wider">Filtered Inflow</div>
			<div class="font-mono tabular-nums font-semibold text-[#82b896] mt-0.5">{formatCurrency(totals.credit)}</div>
		</div>
		<div>
			<div class="text-[10px] text-stone-500 uppercase tracking-wider">Filtered Outflow</div>
			<div class="font-mono tabular-nums font-semibold text-stone-300 mt-0.5">{formatCurrency(totals.debit)}</div>
		</div>
		<div>
			<div class="text-[10px] text-stone-500 uppercase tracking-wider">Filtered Net</div>
			<div class="font-mono tabular-nums font-semibold {totals.net >= 0 ? 'text-[#f5f2ea]' : 'text-[#e06c75]'} mt-0.5">
				{formatCurrency(totals.net)}
			</div>
		</div>
	</div>

	<!-- Journal Ledger Table -->
	<div class="border border-stone-800/80 rounded-xl bg-[#171715] overflow-hidden">
		{#if filteredTransactions.length === 0}
			<div class="py-16 text-center text-stone-500 text-xs">
				No matching entries.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead class="bg-[#141412] border-b border-stone-800 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
						<tr>
							<th class="px-4 py-3">Date</th>
							<th class="px-4 py-3">Description</th>
							<th class="px-4 py-3">Category</th>
							<th class="px-4 py-3 text-right">Amount</th>
							<th class="px-4 py-3 text-right"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-stone-800/60 font-sans">
						{#each filteredTransactions as tx (tx.id)}
							<tr class="hover:bg-[#1d1c19] transition-colors group">
								<td class="px-4 py-3 whitespace-nowrap text-stone-500 font-mono tabular-nums">
									{tx.date}
								</td>
								<td class="px-4 py-3 text-stone-200 font-medium">
									{tx.name}
								</td>
								<td class="px-4 py-3 whitespace-nowrap">
									{#if tx.category}
										<span class="px-2 py-0.5 rounded text-[11px] bg-[#1f1e1b] text-stone-400 border border-stone-800">
											{tx.category}
										</span>
									{:else}
										<span class="text-stone-600">—</span>
									{/if}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums text-sm font-semibold {tx.type === 'credit' ? 'text-[#82b896]' : 'text-[#e06c75]'}">
									{formatCurrency(tx.amount)}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-right">
									<div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
