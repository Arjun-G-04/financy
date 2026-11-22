<script lang="ts">
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency, getCategoryStyle, getTimeBucket, type TimeBucket } from '#lib/utils';
	import { appState } from '#lib/state.svelte';
	import { Pencil, Trash2 } from '@lucide/svelte';

	let {
		transactions = [],
		emptyMessage = 'No records found.',
		onDelete,
		class: className = ''
	}: {
		transactions: LocalTransaction[];
		emptyMessage?: string;
		onDelete: (tx: LocalTransaction) => void;
		class?: string;
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

	function handleDeleteClick(tx: LocalTransaction) {
		onDelete(tx);
	}
</script>

<div class="{className || 'hw-chassis rounded-xl border border-[#2b2b25] shadow-2xl'} overflow-hidden">
	{#if transactions.length === 0}
		<div class="py-12 sm:py-16 text-center text-stone-500 text-xs font-mono">
			{emptyMessage}
		</div>
	{:else}
		<!-- Mobile Feed: Touch-First Card Rows (sm:hidden) -->
		<div class="sm:hidden divide-y divide-[#23231f]">
			{#each groupedTransactions as group (group.title)}
				<!-- Group Divider -->
				<div class="px-3.5 py-2 bg-[#121210] border-y border-[#2a2a24] flex items-center justify-between text-[10px] font-mono">
					<span class="uppercase tracking-widest font-bold text-[#f97316]">{group.title}</span>
					<span class="px-1.5 py-0.2 rounded bg-[#181815] border border-[#2d2d27] text-stone-400 text-[9px] tabular-nums">{group.transactions.length}</span>
				</div>

				{#each group.transactions as tx (tx.id)}
					{@const catStyle = getCategoryStyle(tx.category)}
					<div
						class="p-3.5 flex items-center justify-between gap-3 bg-[#161613] hover:bg-[#1c1c18] active:bg-[#20201a] transition-colors"
					>
						<!-- Description & Metadata -->
						<div class="min-w-0 flex-1 space-y-1">
							<div class="font-medium text-xs text-stone-200 truncate">{tx.name}</div>
							<div class="flex items-center gap-1.5 text-[10px] text-stone-500">
								<span class="font-mono text-stone-400">{tx.date}</span>
								{#if tx.category}
									<span>•</span>
									<span
										class="hw-category-chip !text-[9px] !py-0.5 !px-2 max-w-[140px] truncate"
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
								class="font-mono tabular-nums text-xs font-bold self-center {tx.type === 'credit'
									? 'text-[#82b896] drop-shadow-[0_0_6px_rgba(130,184,150,0.3)]'
									: 'text-[#e06c75] drop-shadow-[0_0_6px_rgba(224,108,117,0.3)]'}"
							>
								{formatAmount(tx.amount)}
							</span>

							<div class="flex items-center gap-1">
								<button
									type="button"
									onclick={() => handleEdit(tx)}
									class="hw-keycap p-2 rounded-lg text-stone-400 hover:text-stone-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
									aria-label="Edit {tx.name}"
								>
									<Pencil class="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onclick={() => handleDeleteClick(tx)}
									class="hw-keycap p-2 rounded-lg text-stone-400 hover:text-rose-400 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
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
					class="bg-gradient-to-b from-[#1f1f1b] to-[#151512] border-b border-[#2d2d27] text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest shadow-inner"
				>
					<tr>
						<th class="px-5 py-3.5 align-middle">Date</th>
						<th class="px-5 py-3.5 align-middle">Description</th>
						<th class="px-5 py-3.5 align-middle">Category</th>
						<th class="px-5 py-3.5 text-right align-middle">Amount</th>
						<th class="px-5 py-3.5 text-right align-middle">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#24241f] font-sans">
					{#each groupedTransactions as group (group.title)}
						<!-- Group Divider Row -->
						<tr class="bg-[#121210] border-y border-[#2a2a24]">
							<td colspan="5" class="px-5 py-2 font-mono text-[10px]">
								<div class="flex items-center justify-between">
									<span class="uppercase tracking-widest font-bold text-[#f97316] flex items-center gap-1.5">
										<span class="w-1 h-1 rounded-full bg-[#f97316]"></span>
										{group.title}
									</span>
									<span class="px-2 py-0.5 rounded bg-[#171714] border border-[#292923] text-stone-400 text-[9px] tabular-nums font-mono">
										{group.transactions.length} records
									</span>
								</div>
							</td>
						</tr>

						{#each group.transactions as tx (tx.id)}
							{@const catStyle = getCategoryStyle(tx.category)}
							<tr
								class="hover:bg-[#1b1b17] transition-colors group"
							>
								<td class="px-5 py-3.5 whitespace-nowrap text-stone-400 font-mono tabular-nums align-middle text-xs">
									{tx.date}
								</td>
								<td class="px-5 py-3.5 text-stone-200 font-medium align-middle">
									{tx.name}
								</td>
								<td class="px-5 py-3.5 whitespace-nowrap align-middle">
									{#if tx.category}
										<span
											class="hw-category-chip"
											style={catStyle.badgeStyle}
										>
											{tx.category}
										</span>
									{:else}
										<span class="text-stone-600 font-mono text-[11px]">—</span>
									{/if}
								</td>
								<td
									class="px-5 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-sm font-bold align-middle {tx.type ===
									'credit'
										? 'text-[#82b896] drop-shadow-[0_0_6px_rgba(130,184,150,0.3)]'
										: 'text-[#e06c75] drop-shadow-[0_0_6px_rgba(224,108,117,0.3)]'}"
								>
									{formatAmount(tx.amount)}
								</td>
								<td class="px-5 py-3.5 whitespace-nowrap text-right align-middle">
									<div
										class="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity"
									>
										<button
											type="button"
											onclick={() => handleEdit(tx)}
											class="hw-keycap p-1.5 rounded-lg text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
											title="Edit"
											aria-label="Edit {tx.name}"
										>
											<Pencil class="w-3.5 h-3.5" />
										</button>
										<button
											type="button"
											onclick={() => handleDeleteClick(tx)}
											class="hw-keycap p-1.5 rounded-lg text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
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
