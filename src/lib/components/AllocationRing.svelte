<script lang="ts">
	import { formatCurrency } from '#lib/utils';
	import { appState } from '#lib/state.svelte';

	interface CategoryItem {
		name: string;
		amount: number;
		percentage: number;
		color: string;
	}

	let {
		categories = [],
		totalAmount = 0
	}: {
		categories: CategoryItem[];
		totalAmount: number;
	} = $props();

	let hoveredCategory = $state<string | null>(null);

	const ringRadius = 70;
	const ringCircumference = 2 * Math.PI * ringRadius;

	const ringSegments = $derived.by(() => {
		let currentOffset = 0;
		return categories.map((cat) => {
			const strokeDasharray = `${(cat.percentage / 100) * ringCircumference} ${ringCircumference}`;
			const strokeDashoffset = -currentOffset;
			currentOffset += (cat.percentage / 100) * ringCircumference;
			return {
				...cat,
				strokeDasharray,
				strokeDashoffset
			};
		});
	});
</script>

<div class="p-5 rounded-2xl bg-[#171715] border border-stone-800/80 space-y-4 shadow-sm">
	<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">
		Expense Allocation
	</div>

	{#if categories.length === 0}
		<div class="py-10 text-center text-stone-500 text-xs font-mono">
			No debit entries to display for this selection.
		</div>
	{:else}
		<div class="flex items-center justify-center py-2">
			<!-- SVG Donut Ring -->
			<div class="relative w-56 h-56 flex items-center justify-center shrink-0">
				<svg
					class="w-full h-full -rotate-90 transform"
					viewBox="0 0 200 200"
					role="img"
					aria-label="Category allocation donut ring"
				>
					<!-- Background Ring Track -->
					<circle
						cx="100"
						cy="100"
						r={ringRadius}
						fill="transparent"
						stroke="#22211e"
						stroke-width="22"
					/>

					<!-- Segment Arcs -->
					{#each ringSegments as seg}
						<g
							role="button"
							tabindex="0"
							aria-label="{seg.name}: {seg.percentage.toFixed(1)}%"
							onclick={() => (hoveredCategory = hoveredCategory === seg.name ? null : seg.name)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									hoveredCategory = hoveredCategory === seg.name ? null : seg.name;
								}
							}}
							onmouseenter={() => (hoveredCategory = seg.name)}
							onmouseleave={() => (hoveredCategory = null)}
							onfocus={() => (hoveredCategory = seg.name)}
							onblur={() => (hoveredCategory = null)}
						>
							<circle
								cx="100"
								cy="100"
								r={ringRadius}
								fill="transparent"
								stroke={seg.color}
								stroke-width={hoveredCategory === seg.name ? '26' : '22'}
								stroke-dasharray={seg.strokeDasharray}
								stroke-dashoffset={seg.strokeDashoffset}
								class="transition-all duration-200 cursor-pointer"
								style="opacity: {hoveredCategory && hoveredCategory !== seg.name ? '0.35' : '1'};"
							/>
						</g>
					{/each}
				</svg>

				<!-- Center Summary Metric -->
				<div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
					{#if hoveredCategory}
						{@const hovered = categories.find((c) => c.name === hoveredCategory)}
						{#if hovered}
							<div class="text-[11px] text-stone-400 font-medium truncate max-w-[120px]">
								{hovered.name}
							</div>
							<div class="text-base font-serif font-semibold text-[#f5f2ea] tracking-tight mt-0.5">
								{formatCurrency(hovered.amount, appState.settings.currencySymbol)}
							</div>
							<div class="text-[11px] font-mono text-stone-500 tabular-nums">
								{hovered.percentage.toFixed(1)}%
							</div>
						{/if}
					{:else}
						<div class="text-[10px] text-stone-500 uppercase tracking-wider font-mono">
							Total Outflow
						</div>
						<div class="text-base font-serif font-semibold text-[#f5f2ea] tracking-tight mt-0.5">
							{formatCurrency(totalAmount, appState.settings.currencySymbol)}
						</div>
						<div class="text-[10px] font-mono text-stone-500">
							{categories.length} {categories.length === 1 ? 'category' : 'categories'}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
