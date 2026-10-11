<script lang="ts">
	import { Calendar, ChevronLeft, ChevronRight, X } from '@lucide/svelte';

	let {
		value = $bindable(''),
		label = '',
		placeholder = 'Pick date',
		id = '',
		clearable = true,
		disabled = false
	}: {
		value?: string;
		label?: string;
		placeholder?: string;
		id?: string;
		clearable?: boolean;
		disabled?: boolean;
	} = $props();

	let isOpen = $state(false);
	let containerRef: HTMLDivElement | null = $state(null);
	const defaultId = `datepicker-${Math.random().toString(36).substring(2, 9)}`;
	const elementId = $derived(id || defaultId);

	// Calendar navigation state
	let viewYear = $state(new Date().getFullYear());
	let viewMonth = $state(new Date().getMonth()); // 0-indexed

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	// When popover opens or value changes, sync the calendar view
	function syncViewToValue() {
		if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
			const [y, m] = value.split('-').map(Number);
			viewYear = y;
			viewMonth = m - 1;
		} else {
			const now = new Date();
			viewYear = now.getFullYear();
			viewMonth = now.getMonth();
		}
	}

	function toggleOpen() {
		if (disabled) return;
		if (!isOpen) {
			syncViewToValue();
		}
		isOpen = !isOpen;
	}

	function prevMonth() {
		if (viewMonth === 0) {
			viewMonth = 11;
			viewYear -= 1;
		} else {
			viewMonth -= 1;
		}
	}

	function nextMonth() {
		if (viewMonth === 11) {
			viewMonth = 0;
			viewYear += 1;
		} else {
			viewMonth += 1;
		}
	}

	interface CalendarCell {
		day: number;
		dateStr: string;
		isCurrentMonth: boolean;
		isToday: boolean;
		isSelected: boolean;
	}

	const calendarCells = $derived.by<CalendarCell[]>(() => {
		const cells: CalendarCell[] = [];
		const today = new Date();
		const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

		const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
		const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
		const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

		// Previous month padding days
		for (let i = firstDayOfWeek - 1; i >= 0; i--) {
			const d = daysInPrevMonth - i;
			const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
			const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
			const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			cells.push({
				day: d,
				dateStr,
				isCurrentMonth: false,
				isToday: dateStr === todayStr,
				isSelected: dateStr === value
			});
		}

		// Current month days
		for (let d = 1; d <= daysInCurrentMonth; d++) {
			const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			cells.push({
				day: d,
				dateStr,
				isCurrentMonth: true,
				isToday: dateStr === todayStr,
				isSelected: dateStr === value
			});
		}

		// Next month padding days to complete full weeks (up to 35 or 42)
		const targetTotal = cells.length > 35 ? 42 : 35;
		const remaining = targetTotal - cells.length;
		for (let d = 1; d <= remaining; d++) {
			const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
			const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
			const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			cells.push({
				day: d,
				dateStr,
				isCurrentMonth: false,
				isToday: dateStr === todayStr,
				isSelected: dateStr === value
			});
		}

		return cells;
	});

	function selectDate(dateStr: string) {
		value = dateStr;
		isOpen = false;
	}

	function selectToday() {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		value = `${y}-${m}-${d}`;
		isOpen = false;
	}

	function handleClear(e: MouseEvent) {
		e.stopPropagation();
		value = '';
		isOpen = false;
	}

	// Format display text
	const displayFormatted = $derived.by(() => {
		if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
		const [y, m, d] = value.split('-').map(Number);
		const shortMonth = monthNames[m - 1]?.substring(0, 3) || '';
		return `${String(d).padStart(2, '0')} ${shortMonth} ${y}`;
	});

	// Close on click outside or Escape
	function handleDocumentClick(e: MouseEvent) {
		if (isOpen && containerRef && !containerRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleDocumentClick} onkeydown={handleKeydown} />

<div class="relative w-full" bind:this={containerRef}>
	{#if label}
		<label for={elementId} class="block text-[11px] text-stone-500 mb-1 font-mono uppercase tracking-wider">
			{label}
		</label>
	{/if}

	<!-- Picker Trigger Wrapper -->
	<div
		class="w-full flex items-center justify-between px-3 py-1.5 bg-[#111110] hover:bg-[#181816] border border-stone-800 hover:border-stone-700/80 rounded-xl text-xs transition-colors focus-within:border-stone-600 {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
	>
		<button
			type="button"
			id={elementId}
			onclick={toggleOpen}
			{disabled}
			class="flex-1 flex items-center gap-2 min-w-0 text-left focus:outline-none py-0.5 group"
		>
			<Calendar class="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-300 shrink-0" />
			{#if value}
				<span class="font-mono tabular-nums text-stone-200 text-xs truncate">
					{displayFormatted}
				</span>
			{:else}
				<span class="text-stone-500 text-xs truncate font-mono">
					{placeholder}
				</span>
			{/if}
		</button>

		{#if clearable && value && !disabled}
			<button
				type="button"
				onclick={handleClear}
				title="Clear date"
				class="p-1 -mr-1 rounded-md hover:bg-stone-800 text-stone-500 hover:text-stone-300 transition-colors ml-1 shrink-0"
			>
				<X class="w-3 h-3" />
			</button>
		{/if}
	</div>

	<!-- Calendar Popover -->
	{#if isOpen}
		<div
			class="absolute z-50 mt-1.5 w-72 bg-[#171715] border border-stone-800 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100"
		>
			<!-- Month & Year Navigation Header -->
			<div class="flex items-center justify-between">
				<button
					type="button"
					onclick={prevMonth}
					class="p-1 rounded-lg hover:bg-[#232320] text-stone-400 hover:text-stone-200 transition-colors"
					aria-label="Previous Month"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>

				<div class="text-xs font-semibold text-[#f5f2ea] font-mono tracking-tight">
					{monthNames[viewMonth]} {viewYear}
				</div>

				<button
					type="button"
					onclick={nextMonth}
					class="p-1 rounded-lg hover:bg-[#232320] text-stone-400 hover:text-stone-200 transition-colors"
					aria-label="Next Month"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>

			<!-- Day Headers (Su, Mo, Tu...) -->
			<div class="grid grid-cols-7 gap-1 text-center">
				{#each dayHeaders as d}
					<div class="text-[10px] font-mono text-stone-500 font-semibold py-1">
						{d}
					</div>
				{/each}
			</div>

			<!-- Calendar Grid -->
			<div class="grid grid-cols-7 gap-1">
				{#each calendarCells as cell}
					<button
						type="button"
						onclick={() => selectDate(cell.dateStr)}
						class="h-7 w-full flex items-center justify-center rounded-lg text-xs font-mono tabular-nums transition-colors
							{cell.isSelected
							? 'bg-[#eeebe3] text-[#111110] font-bold shadow-sm'
							: cell.isCurrentMonth
								? 'text-stone-300 hover:bg-[#232320]'
								: 'text-stone-600 hover:bg-[#1a1917]'}
							{cell.isToday && !cell.isSelected ? 'border border-[#82b896]/50 text-[#82b896]' : ''}"
					>
						{cell.day}
					</button>
				{/each}
			</div>

			<!-- Footer Shortcuts -->
			<div class="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono">
				<button
					type="button"
					onclick={selectToday}
					class="text-[#82b896] hover:text-[#a1d6b4] transition-colors py-0.5 px-1.5 rounded hover:bg-[#82b896]/10"
				>
					Today
				</button>

				{#if clearable}
					<button
						type="button"
						onclick={() => {
							value = '';
							isOpen = false;
						}}
						class="text-stone-500 hover:text-stone-300 transition-colors py-0.5 px-1.5 rounded hover:bg-stone-800/50"
					>
						Clear
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
