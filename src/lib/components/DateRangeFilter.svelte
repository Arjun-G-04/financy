<script lang="ts">
	import { Calendar } from '@lucide/svelte';
	import DatePicker from '#lib/components/DatePicker.svelte';
	import { getPresetDateRange } from '#lib/utils';

	export type PresetType = 'all' | '7days' | 'month' | '30days';

	let {
		startDate = $bindable(''),
		endDate = $bindable(''),
		presets = ['all', '7days', 'month', '30days'],
		title = 'Query Window',
		onChange
	}: {
		startDate: string;
		endDate: string;
		presets?: PresetType[];
		title?: string;
		onChange?: () => void;
	} = $props();

	const presetLabels: Record<PresetType, string> = {
		'all': 'All Time',
		'7days': 'Last 7 Days',
		'month': 'This Month',
		'30days': 'Last 30 Days'
	};

	function setPreset(preset: PresetType) {
		if (preset === 'all') {
			startDate = '';
			endDate = '';
		} else {
			const dates = getPresetDateRange(preset);
			startDate = dates.start;
			endDate = dates.end;
		}
		onChange?.();
	}

	const activePreset = $derived.by(() => {
		if (!startDate && !endDate) {
			return presets.includes('all') ? 'all' : null;
		}

		for (const preset of ['7days', 'month', '30days'] as const) {
			if (!presets.includes(preset)) continue;
			const range = getPresetDateRange(preset);
			if (startDate === range.start && endDate === range.end) return preset;
		}
		return null;
	});
</script>

<div class="space-y-3">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
		<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-300 flex items-center gap-1.5">
			<Calendar class="w-3.5 h-3.5 text-stone-500" />
			<span>{title}</span>
		</div>

		<!-- Quick Presets Buttons: Recessed Tray with Keycaps -->
		<div class="grid grid-cols-2 xs:grid-cols-4 sm:flex items-center gap-1.5 w-full sm:w-auto p-1 bg-[#0c0c0a] border border-[#262622] rounded-xl">
			{#each presets as preset}
				<button
					type="button"
					onclick={() => setPreset(preset)}
					class="px-2.5 py-1.5 sm:py-1 rounded-lg text-[11px] font-mono transition-all text-center min-h-[34px] sm:min-h-0 cursor-pointer {activePreset === preset
						? 'bg-[#22221e] text-[#f5f2ea] border border-[#3d3d36] font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
						: 'text-stone-400 hover:text-stone-200 hover:bg-[#181815]'}"
				>
					{presetLabels[preset]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Date Pickers Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
		<div>
			<DatePicker
				bind:value={startDate}
				label="From Date"
				placeholder="Start date"
			/>
		</div>

		<div>
			<DatePicker
				bind:value={endDate}
				label="To Date"
				placeholder="End date"
			/>
		</div>
	</div>
</div>
