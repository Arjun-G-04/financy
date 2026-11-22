<script lang="ts">
	interface Props {
		value: number;
		symbol?: string;
		theme?: 'emerald' | 'rose';
		fontSizeClass?: string;
		triggerKey?: number;
	}

	let {
		value = 0,
		symbol = '₹',
		theme = 'emerald',
		fontSizeClass = 'text-3xl sm:text-4xl lg:text-5xl',
		triggerKey = 0
	}: Props = $props();

	// Drum sequence with 8 cycles of digits 0-9 (80 items total)
	// Provides high-velocity spinning at start before long ease-out deceleration
	const DRUM_DIGITS = [
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9
	];

	let isRolling = $state(false);
	let lastTriggerKey: number | null = null;

	$effect(() => {
		const currentKey = triggerKey;
		if (lastTriggerKey !== currentKey) {
			lastTriggerKey = currentKey;
			isRolling = false;
			const timer = setTimeout(() => {
				isRolling = true;
			}, 40);
			return () => clearTimeout(timer);
		}
	});

	interface SlotItem {
		id: string;
		char: string;
		isDigit: boolean;
		digit: number;
		delay: number;
	}

	const charItems = $derived.by<SlotItem[]>(() => {
		const safeVal = isNaN(value) ? 0 : value;
		const isNeg = safeVal < 0;
		const absVal = Math.abs(safeVal);
		const numStr = absVal.toLocaleString('en-IN', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
		const fullStr = `${isNeg ? '-' : ''}${symbol}${numStr}`;

		const chars = fullStr.split('');
		let digitIndex = 0;

		return chars.map((char, idx) => {
			const isDigit = /\d/.test(char);
			const digit = isDigit ? parseInt(char, 10) : 0;
			const delay = isDigit ? digitIndex * 25 : 0;
			if (isDigit) digitIndex++;

			return {
				id: `slot-${idx}-${isDigit ? 'd' : 's'}`,
				char,
				isDigit,
				digit,
				delay
			};
		});
	});

	const themeColorClass = $derived(
		theme === 'rose'
			? 'text-[#e06c75] drop-shadow-[0_0_10px_rgba(224,108,117,0.45)]'
			: 'text-[#82b896] drop-shadow-[0_0_10px_rgba(130,184,150,0.35)]'
	);

	const themeCellClass = $derived(
		theme === 'rose'
			? 'bg-[#0e0708] border-[#2e171b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.03)]'
			: 'bg-[#070c09] border-[#18261b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.03)]'
	);

	const slitShadowClass = $derived(
		theme === 'rose'
			? 'shadow-[0_0.5px_0_rgba(224,108,117,0.12)]'
			: 'shadow-[0_0.5px_0_rgba(130,184,150,0.12)]'
	);
</script>

<!-- Airport Terminal Display Board Container with iPhone Clock Rolling Drums -->
<div
	class="inline-flex items-center gap-[1.5px] sm:gap-[2.5px] select-none font-mono font-bold tracking-tight {fontSizeClass} {themeColorClass} max-w-full overflow-x-auto overflow-y-hidden py-0.5"
	role="status"
	aria-live="polite"
>
	{#each charItems as item (item.id)}
		{#if item.isDigit}
			<!-- Solari / Airport Terminal Digit Slot -->
			<div
				class="terminal-slot-cell w-[0.66em] h-[1.25em] relative rounded-[4px] border overflow-hidden shrink-0 block {themeCellClass}"
			>
				<!-- Horizontal Split-Flap Central Crease -->
				<div class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/70 z-20 {slitShadowClass}"></div>
				<!-- Top Flap Ambient Bevel Shading -->
				<div class="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/[0.04] z-10 border-b border-black/30"></div>

				<!-- Rolling Vertical Drum Column (iPhone Clock Mechanical Motion) -->
				<div
					class="absolute inset-x-0 top-0 flex flex-col items-center will-change-transform"
					style={isRolling
						? `transform: translateY(-${(60 + item.digit) * 1.25}em); transition: transform 2800ms cubic-bezier(0.08, 0.85, 0.2, 1) ${item.delay}ms;`
						: 'transform: translateY(0em); transition: none;'}
				>
					{#each DRUM_DIGITS as d}
						<div class="h-[1.25em] leading-[1.25em] w-full flex items-center justify-center shrink-0">
							{d}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Static Symbol / Punctuation Flap: Uniform w-[0.66em] width for all tiles -->
			<div
				class="terminal-slot-cell w-[0.66em] h-[1.25em] relative rounded-[4px] border flex items-center justify-center overflow-hidden shrink-0 {themeCellClass}"
			>
				<!-- Horizontal Split-Flap Central Crease -->
				<div class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/70 z-20 {slitShadowClass}"></div>
				<!-- Top Flap Ambient Bevel Shading -->
				<div class="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/[0.04] z-10 border-b border-black/30"></div>

				<div class="h-[1.25em] leading-[1.25em] flex items-center justify-center w-full">
					{item.char}
				</div>
			</div>
		{/if}
	{/each}
</div>
