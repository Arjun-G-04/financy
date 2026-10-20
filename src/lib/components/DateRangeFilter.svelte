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
		<div class="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
			<Calendar class="w-3.5 h-3.5 text-stone-500" />
			<span>{title}</span>
		</div>

		<!-- Quick Presets Buttons -->
		<div class="grid grid-cols-2 xs:grid-cols-4 sm:flex items-center gap-1.5 w-full sm:w-auto">
			{#each presets as preset}
				<button
					type="button"
					onclick={() => setPreset(preset)}
					class="px-2.5 py-1.5 sm:py-1 rounded-lg sm:rounded-md text-[11px] font-mono transition-colors text-center min-h-[34px] sm:min-h-0 {activePreset === preset
						? 'bg-[#1c1c19] text-[#f5f2ea] border border-stone-600 shadow-sm font-medium'
						: 'bg-[#111110] hover:bg-[#232320] border border-stone-800 text-stone-400 hover:text-stone-200'}"
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
