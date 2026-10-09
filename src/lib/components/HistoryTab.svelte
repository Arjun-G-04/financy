<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/server/db';
	import {
		Search,
		Filter,
		Tag,
		Calendar,
		Pencil,
		Trash2,
		X,
		ArrowDownRight,
		ArrowUpRight,
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
		const sym = appState.settings.currencySymbol || '₹';
		return `${sym}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	async function handleDelete(tx: LocalTransaction) {
		if (!confirm(`Delete "${tx.name}" (${formatCurrency(tx.amount)})?`)) return;
		try {
			await appState.deleteTransaction(tx.id);
			appState.showToast('info', 'Transaction Deleted', tx.name);
		} catch (err: any) {
			appState.showToast('error', 'Delete Failed', err.message);
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
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-100">Transaction History</h1>
			<p class="text-sm text-zinc-400">Search, filter, and inspect ledger records.</p>
		</div>

		<button
			onclick={() => {
				appState.editingTransaction = null;
				appState.isTransactionModalOpen = true;
			}}
			class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors shadow-sm"
		>
			<Plus class="w-4 h-4 stroke-[2.5]" />
			Add Transaction
		</button>
	</div>

	<!-- Filter Controls -->
	<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
			<!-- Search -->
			<div class="relative">
				<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					placeholder="Search description..."
					bind:value={searchQuery}
					class="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
				/>
			</div>

			<!-- Category Selector -->
			<div class="relative">
				<select
					bind:value={selectedCategory}
					class="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
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
					class="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
				/>
			</div>

			<!-- End Date -->
			<div>
				<input
					type="date"
					placeholder="End Date"
					bind:value={endDate}
					class="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
				/>
			</div>
		</div>

		<!-- Type Filter & Reset Bar -->
		<div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
			<div class="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
				<button
					onclick={() => (selectedType = 'all')}
					class="px-3 py-1 rounded-lg text-xs font-semibold transition-colors {selectedType === 'all'
						? 'bg-zinc-800 text-zinc-100'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					All ({filteredTransactions.length})
				</button>
				<button
					onclick={() => (selectedType = 'debit')}
					class="px-3 py-1 rounded-lg text-xs font-semibold transition-colors {selectedType === 'debit'
						? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					Debits
				</button>
				<button
					onclick={() => (selectedType = 'credit')}
					class="px-3 py-1 rounded-lg text-xs font-semibold transition-colors {selectedType === 'credit'
						? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					Credits
				</button>
			</div>

			{#if hasActiveFilters}
				<button
					onclick={resetFilters}
					class="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
				>
					<X class="w-3.5 h-3.5" />
					Reset filters
				</button>
			{/if}
		</div>
	</div>

	<!-- Totals Summary Pill Bar -->
	<div class="grid grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
		<div>
			<div class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Filtered Income</div>
			<div class="text-sm font-bold text-emerald-400 mt-0.5">{formatCurrency(totals.credit)}</div>
		</div>
		<div>
			<div class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Filtered Expense</div>
			<div class="text-sm font-bold text-rose-400 mt-0.5">{formatCurrency(totals.debit)}</div>
		</div>
		<div>
			<div class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Filtered Net</div>
			<div class="text-sm font-bold {totals.net >= 0 ? 'text-zinc-100' : 'text-rose-400'} mt-0.5">
				{formatCurrency(totals.net)}
			</div>
		</div>
	</div>

	<!-- Transactions List Table -->
	<div class="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-sm">
		{#if filteredTransactions.length === 0}
			<div class="py-16 text-center text-zinc-500">
				<p>No matching transactions found.</p>
				{#if hasActiveFilters}
					<button
						onclick={resetFilters}
						class="mt-2 text-xs text-emerald-400 hover:underline"
					>
						Clear filters
					</button>
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="bg-zinc-950/70 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
						<tr>
							<th class="px-5 py-3.5">Date</th>
							<th class="px-5 py-3.5">Description</th>
							<th class="px-5 py-3.5">Category</th>
							<th class="px-5 py-3.5 text-right">Amount</th>
							<th class="px-5 py-3.5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-800/60">
						{#each filteredTransactions as tx (tx.id)}
							<tr class="hover:bg-zinc-800/30 transition-colors group">
								<td class="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-400 font-mono">
									{tx.date}
								</td>
								<td class="px-5 py-3.5 text-zinc-100 font-medium">
									{tx.name}
								</td>
								<td class="px-5 py-3.5 whitespace-nowrap">
									{#if tx.category}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
											<Tag class="w-3 h-3 text-zinc-400" />
											{tx.category}
										</span>
									{:else}
										<span class="text-xs text-zinc-600">—</span>
									{/if}
								</td>
								<td class="px-5 py-3.5 whitespace-nowrap text-right font-bold {tx.type === 'credit' ? 'text-emerald-400' : 'text-zinc-200'}">
									{tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
								</td>
								<td class="px-5 py-3.5 whitespace-nowrap text-right">
									<div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
										<button
											onclick={() => {
												appState.editingTransaction = tx;
												appState.isTransactionModalOpen = true;
											}}
											class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
											title="Edit"
										>
											<Pencil class="w-4 h-4" />
										</button>
										<button
											onclick={() => handleDelete(tx)}
											class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
											title="Delete"
										>
											<Trash2 class="w-4 h-4" />
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
