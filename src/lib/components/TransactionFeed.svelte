<script lang="ts">
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency } from '#lib/utils';
	import { appState } from '#lib/state.svelte';
	import { Pencil, Trash2 } from '@lucide/svelte';

	let {
		transactions = [],
		emptyMessage = 'No records found.',
		onDelete
	}: {
		transactions: LocalTransaction[];
		emptyMessage?: string;
		onDelete: (tx: LocalTransaction) => void;
	} = $props();

	function handleEdit(tx: LocalTransaction) {
		appState.editingTransaction = tx;
		appState.isTransactionModalOpen = true;
	}
</script>

<div class="border border-stone-800/80 rounded-xl bg-[#171715] overflow-hidden">
	{#if transactions.length === 0}
		<div class="py-12 sm:py-16 text-center text-stone-500 text-xs font-mono">
			{emptyMessage}
		</div>
	{:else}
		<!-- Mobile Feed: Touch-First Card Rows (sm:hidden) -->
		<div class="sm:hidden divide-y divide-stone-800/60">
			{#each transactions as tx (tx.id)}
				<div class="p-3.5 flex items-center justify-between gap-3 active:bg-[#1a1917] transition-colors">
					<div class="min-w-0 flex-1 space-y-1">
						<div class="flex items-center justify-between gap-2">
							<span class="font-medium text-xs text-stone-200 truncate">{tx.name}</span>
							<span
								class="font-mono tabular-nums text-xs font-semibold shrink-0 {tx.type === 'credit'
									? 'text-[#82b896]'
									: 'text-[#e06c75]'}"
							>
								{formatCurrency(tx.amount)}
							</span>
						</div>
						<div class="flex items-center gap-2 text-[10px] text-stone-500">
							<span class="font-mono">{tx.date}</span>
							{#if tx.category}
								<span>•</span>
								<span
									class="px-1.5 py-0.5 rounded bg-[#1f1e1b] text-stone-400 border border-stone-800/80 truncate max-w-[120px]"
								>
									{tx.category}
								</span>
							{/if}
						</div>
					</div>

					<!-- Mobile touch targets -->
					<div class="flex items-center gap-1 shrink-0">
						<button
							type="button"
							onclick={() => handleEdit(tx)}
							class="p-2 rounded-lg text-stone-400 hover:text-stone-200 active:bg-stone-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
							aria-label="Edit {tx.name}"
						>
							<Pencil class="w-3.5 h-3.5" />
						</button>
						<button
							type="button"
							onclick={() => onDelete(tx)}
							class="p-2 rounded-lg text-stone-400 hover:text-rose-400 active:bg-rose-950/30 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
							aria-label="Delete {tx.name}"
						>
							<Trash2 class="w-3.5 h-3.5" />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Tablet & Desktop Table: hidden on mobile, visible on sm+ -->
		<div class="hidden sm:block overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead
					class="bg-[#141412] border-b border-stone-800 text-[10px] font-semibold text-stone-500 uppercase tracking-wider"
				>
					<tr>
						<th class="px-4 py-3">Date</th>
						<th class="px-4 py-3">Description</th>
						<th class="px-4 py-3">Category</th>
						<th class="px-4 py-3 text-right">Amount</th>
						<th class="px-4 py-3 text-right"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-stone-800/60 font-sans">
					{#each transactions as tx (tx.id)}
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
							<td
								class="px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums text-sm font-semibold {tx.type ===
								'credit'
									? 'text-[#82b896]'
									: 'text-[#e06c75]'}"
							>
								{formatCurrency(tx.amount)}
							</td>
							<td class="px-4 py-3 whitespace-nowrap text-right">
								<div
									class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<button
										type="button"
										onclick={() => handleEdit(tx)}
										class="p-1.5 rounded text-stone-400 hover:text-stone-200 transition-colors"
										title="Edit"
										aria-label="Edit {tx.name}"
									>
										<Pencil class="w-3.5 h-3.5" />
									</button>
									<button
										type="button"
										onclick={() => onDelete(tx)}
										class="p-1.5 rounded text-stone-400 hover:text-rose-400 transition-colors"
										title="Delete"
										aria-label="Delete {tx.name}"
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
