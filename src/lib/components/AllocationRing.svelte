<script lang="ts">
	import { formatCurrency } from '#lib/utils';
	import { appState } from '#lib/state.svelte';
	import { PieChart } from '@lucide/svelte';

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
	let selectedCategory = $state<string | null>(null);
	const activeCategory = $derived(hoveredCategory ?? selectedCategory);

	const ringRadius = 70;
	const ringCircumference = 2 * Math.PI * ringRadius;
	const segmentGap = 2.5;

	const ringSegments = $derived.by(() => {
		let currentOffset = 0;
		const useGap = categories.length > 1;
		return categories.map((cat) => {
			const rawLen = (cat.percentage / 100) * ringCircumference;
			const gap = useGap ? Math.min(segmentGap, rawLen * 0.25) : 0;
			const visibleLen = Math.max(0.5, rawLen - gap);
			const strokeDasharray = `${visibleLen} ${ringCircumference}`;
			const strokeDashoffset = -currentOffset;
			currentOffset += rawLen;
			return {
				...cat,
				strokeDasharray,
				strokeDashoffset
			};
		});
	});

	// 24 radial hardware dial ticks
	const dialTicks = Array.from({ length: 24 }, (_, i) => i * 15);
</script>

<div class="hw-chassis p-5 sm:p-6 rounded-2xl border border-[#292924] space-y-4 shadow-xl">
	<div class="flex items-center justify-between border-b border-[#292924] pb-3">
		<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200 flex items-center gap-1.5">
			<PieChart class="w-3.5 h-3.5 text-[#c9b48b]" />
			<span>EXPENSE ALLOCATION GAUGE</span>
		</div>
		{#if categories.length > 0}
			<span class="text-[10px] font-mono uppercase tracking-wider text-stone-500 tabular-nums">
				{categories.length} {categories.length === 1 ? 'CHANNEL' : 'CHANNELS'}
			</span>
		{/if}
	</div>

	{#if categories.length === 0}
		<div class="py-10 text-center text-stone-500 text-xs font-mono">
			No debit entries to display for this selection.
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center py-2 gap-4">
			<!-- Recessed Hardware Dial Well -->
			<div class="relative w-56 h-56 sm:w-60 sm:h-60 rounded-full bg-[#0d0d0b] border border-[#262522] shadow-[inset_0_4px_16px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.05)] flex items-center justify-center shrink-0">
				<svg
					class="w-full h-full -rotate-90 transform"
					viewBox="0 0 200 200"
					role="img"
					aria-label="Category allocation gauge"
				>
					<!-- Outer Hardware Dial Ticks -->
					{#each dialTicks as deg}
						<line
							x1="100"
							y1="9"
							x2="100"
							y2={deg % 90 === 0 ? '15' : '12'}
							stroke={deg % 90 === 0 ? '#44423b' : '#282722'}
							stroke-width={deg % 90 === 0 ? '1.5' : '1'}
							transform="rotate({deg} 100 100)"
						/>
					{/each}

					<!-- Recessed Track Groove -->
					<circle
						cx="100"
						cy="100"
						r={ringRadius}
						fill="transparent"
						stroke="#171714"
						stroke-width="22"
					/>
					<circle
						cx="100"
						cy="100"
						r={ringRadius - 12}
						fill="transparent"
						stroke="#23221e"
						stroke-width="1"
					/>
					<circle
						cx="100"
						cy="100"
						r={ringRadius + 12}
						fill="transparent"
						stroke="#23221e"
						stroke-width="1"
					/>

					<!-- Segment Arcs -->
					{#each ringSegments as seg (seg.name)}
						{@const isActive = activeCategory === seg.name}
						<g
							role="button"
							tabindex="0"
							aria-pressed={selectedCategory === seg.name}
							aria-label="{seg.name}: {seg.percentage.toFixed(1)}%"
							onclick={() => (selectedCategory = selectedCategory === seg.name ? null : seg.name)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									selectedCategory = selectedCategory === seg.name ? null : seg.name;
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
								stroke-width={isActive ? '24' : '20'}
								stroke-dasharray={seg.strokeDasharray}
								stroke-dashoffset={seg.strokeDashoffset}
								class="transition-all duration-200 cursor-pointer"
								style="opacity: {activeCategory && !isActive ? '0.3' : '1'}; filter: {isActive ? `drop-shadow(0 0 6px ${seg.color})` : 'none'};"
							/>
						</g>
					{/each}
				</svg>

				<!-- Center Recessed VFD Readout -->
				<div class="absolute w-[108px] h-[108px] rounded-full bg-[#090b09] border border-[#222520] shadow-[inset_0_2px_10px_rgba(0,0,0,0.95)] flex flex-col items-center justify-center text-center pointer-events-none px-2">
					{#if activeCategory}
						{@const active = categories.find((c) => c.name === activeCategory)}
						{#if active}
							<div
								class="text-[9px] font-mono font-bold uppercase tracking-wider truncate max-w-[92px]"
								style="color: {active.color};"
							>
								{active.name}
							</div>
							<div class="text-sm font-mono tabular-nums font-bold text-[#eeebe3] tracking-tight mt-0.5">
								{formatCurrency(active.amount, appState.settings.currencySymbol)}
							</div>
							<div class="text-[10px] font-mono text-stone-400 tabular-nums mt-0.5">
								{active.percentage.toFixed(1)}%
							</div>
						{/if}
					{:else}
						<div class="text-[9px] text-[#e06c75]/75 uppercase tracking-wider font-mono font-bold">
							OUTFLOW
						</div>
						<div class="text-sm font-mono tabular-nums font-bold text-[#eeebe3] tracking-tight mt-0.5">
							{formatCurrency(totalAmount, appState.settings.currencySymbol)}
						</div>
						<div class="text-[9px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">
							{categories.length} {categories.length === 1 ? 'CAT' : 'CATS'}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
