<script lang="ts">
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency, getCategoryStyle, getTimeBucket, type TimeBucket } from '#lib/utils';
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

	function formatAmount(val: number) {
		return formatCurrency(val, appState.settings.currencySymbol);
	}

	const groupedTransactions = $derived.by(() => {
		const groups: Record<TimeBucket, LocalTransaction[]> = {
			'Today': [],
			'Yesterday': [],
			'Past 7 Days': [],
			'Past 30 Days': [],
			'Older': []
		};

		for (const tx of transactions) {
			const bucket = getTimeBucket(tx.date);
			groups[bucket].push(tx);
		}

		const order: TimeBucket[] = ['Today', 'Yesterday', 'Past 7 Days', 'Past 30 Days', 'Older'];
		return order
			.filter((title) => groups[title].length > 0)
			.map((title) => ({
				title,
				transactions: groups[title]
			}));
	});

	function handleEdit(tx: LocalTransaction) {
		appState.openTransactionModal(tx);
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
			{#each groupedTransactions as group (group.title)}
				<!-- Group Divider -->
				<div class="px-3.5 py-1.5 bg-[#141412] border-y border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-400">
					<span class="uppercase tracking-wider font-semibold text-stone-300">{group.title}</span>
					<span class="text-stone-500 text-[10px]">{group.transactions.length}</span>
				</div>

				{#each group.transactions as tx (tx.id)}
					{@const catStyle = getCategoryStyle(tx.category)}
					<div
						class="p-3.5 flex items-center justify-between gap-3 active:brightness-95 transition-all"
						style="background-color: {catStyle.bgColor};"
					>
						<!-- Description & Metadata -->
						<div class="min-w-0 flex-1">
							<div class="font-medium text-xs text-stone-200 truncate">{tx.name}</div>
							<div class="flex items-center gap-1.5 text-[10px] text-stone-500 mt-1">
								<span class="font-mono">{tx.date}</span>
								{#if tx.category}
									<span>•</span>
									<span
										class="px-1.5 py-0.5 rounded text-[10px] font-medium border truncate max-w-[120px]"
										style={catStyle.badgeStyle}
									>
										{tx.category}
									</span>
								{/if}
							</div>
						</div>

						<!-- Vertically Centered Amount & Action Buttons -->
						<div class="flex items-center gap-2.5 shrink-0 self-center">
							<span
								class="font-mono tabular-nums text-xs font-semibold self-center {tx.type === 'credit'
									? 'text-[#82b896]'
									: 'text-[#e06c75]'}"
							>
								{formatAmount(tx.amount)}
							</span>

							<div class="flex items-center gap-0.5">
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
					</div>
				{/each}
			{/each}
		</div>

		<!-- Tablet & Desktop Table: hidden on mobile, visible on sm+ -->
		<div class="hidden sm:block overflow-x-auto">
			<table class="w-full text-left text-xs border-collapse">
				<thead
					class="bg-[#141412] border-b border-stone-800 text-[10px] font-semibold text-stone-500 uppercase tracking-wider"
				>
					<tr>
						<th class="px-4 py-3 align-middle">Date</th>
						<th class="px-4 py-3 align-middle">Description</th>
						<th class="px-4 py-3 align-middle">Category</th>
						<th class="px-4 py-3 text-right align-middle">Amount</th>
						<th class="px-4 py-3 text-right align-middle"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-stone-800/60 font-sans">
					{#each groupedTransactions as group (group.title)}
						<!-- Group Divider Row -->
						<tr class="bg-[#141412]/90 border-y border-stone-800/80">
							<td colspan="5" class="px-4 py-1.5 font-mono text-[11px] text-stone-400">
								<div class="flex items-center justify-between">
									<span class="uppercase tracking-wider font-semibold text-stone-300">{group.title}</span>
									<span class="text-stone-500 text-[10px]">{group.transactions.length}</span>
								</div>
							</td>
						</tr>

						{#each group.transactions as tx (tx.id)}
							{@const catStyle = getCategoryStyle(tx.category)}
							<tr
								class="hover:brightness-110 transition-all group"
								style="background-color: {catStyle.bgColor};"
							>
								<td class="px-4 py-3 whitespace-nowrap text-stone-500 font-mono tabular-nums align-middle">
									{tx.date}
								</td>
								<td class="px-4 py-3 text-stone-200 font-medium align-middle">
									{tx.name}
								</td>
								<td class="px-4 py-3 whitespace-nowrap align-middle">
									{#if tx.category}
										<span
											class="px-2 py-0.5 rounded text-[11px] font-medium border"
											style={catStyle.badgeStyle}
										>
											{tx.category}
										</span>
									{:else}
										<span class="text-stone-600">—</span>
									{/if}
								</td>
								<td
									class="px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums text-sm font-semibold align-middle {tx.type ===
									'credit'
										? 'text-[#82b896]'
										: 'text-[#e06c75]'}"
								>
									{formatAmount(tx.amount)}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-right align-middle">
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
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
