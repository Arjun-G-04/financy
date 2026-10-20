<script lang="ts">
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency as formatCur, formatDate, parseDate } from '#lib/utils';
	import { appState } from '#lib/state.svelte';
	import { TrendingDown } from '@lucide/svelte';

	let {
		transactions = [],
		startDate = '',
		endDate = ''
	}: {
		transactions: LocalTransaction[];
		startDate?: string;
		endDate?: string;
	} = $props();

	let svgContainer = $state<HTMLDivElement | null>(null);
	let containerWidth = $state<number>(0);
	let hoveredIndex = $state<number | null>(null);

	function formatCurrency(val: number) {
		return formatCur(val, appState.settings.currencySymbol);
	}

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Generate contiguous daily records and sum spend per day
	const dailyData = $derived.by(() => {
		const map: Record<string, { total: number; count: number }> = {};
		for (const tx of transactions) {
			if (!map[tx.date]) {
				map[tx.date] = { total: 0, count: 0 };
			}
			map[tx.date].total += tx.amount;
			map[tx.date].count += 1;
		}

		let start = startDate || (transactions[0]?.date ?? formatDate(new Date()));
		let end = endDate || formatDate(new Date());
		if (start > end) {
			const temp = start;
			start = end;
			end = temp;
		}

		const days: Array<{
			date: string;
			label: string;
			fullDate: string;
			amount: number;
			count: number;
		}> = [];

		const cur = parseDate(start);
		const target = parseDate(end);
		if (!cur || !target) return days;

		const maxDays = Math.round((target.getTime() - cur.getTime()) / 86400000) + 5;
		let iterations = 0;
		while (cur <= target && iterations < maxDays) {
			const dStr = formatDate(cur);
			const dayData = map[dStr] || { total: 0, count: 0 };
			const displayLabel = `${cur.getDate()} ${MONTHS[cur.getMonth()]}`;
			const fullDateLabel = `${DAYS[cur.getDay()]}, ${cur.getDate()} ${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`;

			days.push({
				date: dStr,
				label: displayLabel,
				fullDate: fullDateLabel,
				amount: dayData.total,
				count: dayData.count
			});

			cur.setDate(cur.getDate() + 1);
			iterations++;
		}

		return days;
	});

	// Metrics
	const totalSpend = $derived(dailyData.reduce((sum, d) => sum + d.amount, 0));
	const activeDaysCount = $derived(dailyData.filter((d) => d.amount > 0).length);
	const dailyAverage = $derived(dailyData.length > 0 ? totalSpend / dailyData.length : 0);

	const peakDay = $derived.by(() => {
		if (dailyData.length === 0) return { amount: 0, date: '', label: '' };
		let maxD = dailyData[0];
		for (const d of dailyData) {
			if (d.amount > maxD.amount) maxD = d;
		}
		return maxD;
	});

	// SVG Dimensions and Coordinates (dynamically fits 100% of container width)
	const viewBoxWidth = $derived(containerWidth > 0 ? containerWidth : 800);
	const viewBoxHeight = 220;
	const padding = { top: 24, right: 8, bottom: 36, left: 8 };
	const chartW = $derived(viewBoxWidth - padding.left - padding.right);
	const chartH = viewBoxHeight - padding.top - padding.bottom;

	const maxAmount = $derived.by(() => {
		let rawMax = 0;
		for (const d of dailyData) {
			if (d.amount > rawMax) rawMax = d.amount;
		}
		if (rawMax <= 0) return 100;
		return rawMax * 1.08;
	});

	const points = $derived.by(() => {
		if (dailyData.length === 0) return [];
		const n = dailyData.length;
		const baseline = padding.top + chartH;

		return dailyData.map((d, i) => {
			const x = n === 1 ? padding.left + chartW / 2 : padding.left + (i / (n - 1)) * chartW;
			const y = baseline - (d.amount / maxAmount) * chartH;
			return { x, y, day: d };
		});
	});

	// Catmull-Rom to Cubic Bézier conversion for smooth trend curve
	function getSmoothPath(pts: Array<{ x: number; y: number }>): string {
		if (pts.length === 0) return '';
		if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
		if (pts.length === 2) {
			return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
		}

		let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
		const baseline = padding.top + chartH;

		for (let i = 0; i < pts.length - 1; i++) {
			const p0 = i > 0 ? pts[i - 1] : pts[i];
			const p1 = pts[i];
			const p2 = pts[i + 1];
			const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

			const cp1x = p1.x + (p2.x - p0.x) / 6;
			const cp1y = Math.min(baseline, Math.max(padding.top - 5, p1.y + (p2.y - p0.y) / 6));

			const cp2x = p2.x - (p3.x - p1.x) / 6;
			const cp2y = Math.min(baseline, Math.max(padding.top - 5, p2.y - (p3.y - p1.y) / 6));

			path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
		}

		return path;
	}

	const linePath = $derived(getSmoothPath(points));

	const areaPath = $derived.by(() => {
		if (points.length < 2) return '';
		const baseline = padding.top + chartH;
		const startX = points[0].x.toFixed(1);
		const endX = points[points.length - 1].x.toFixed(1);
		return `${linePath} L ${endX} ${baseline} L ${startX} ${baseline} Z`;
	});

	// Select 5-6 evenly spaced X-axis labels
	const xLabels = $derived.by(() => {
		if (points.length === 0) return [];
		if (points.length <= 7) {
			return points.map((p, idx) => ({
				x: p.x,
				label: p.day.label,
				align: idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'
			}));
		}

		const count = viewBoxWidth > 900 ? 7 : viewBoxWidth > 500 ? 5 : 4;
		const result: Array<{ x: number; label: string; align: 'start' | 'middle' | 'end' }> = [];
		for (let i = 0; i < count; i++) {
			const idx = Math.round((i / (count - 1)) * (points.length - 1));
			const p = points[idx];
			result.push({
				x: p.x,
				label: p.day.label,
				align: i === 0 ? 'start' : i === count - 1 ? 'end' : 'middle'
			});
		}
		return result;
	});

	function handleMouseMove(e: MouseEvent) {
		if (!svgContainer || points.length === 0) return;
		const rect = svgContainer.getBoundingClientRect();
		const mouseX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
		const targetX = (mouseX / rect.width) * viewBoxWidth;

		let closestIdx = 0;
		let minDiff = Infinity;
		for (let i = 0; i < points.length; i++) {
			const diff = Math.abs(points[i].x - targetX);
			if (diff < minDiff) {
				minDiff = diff;
				closestIdx = i;
			}
		}
		hoveredIndex = closestIdx;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!svgContainer || points.length === 0 || !e.touches[0]) return;
		const rect = svgContainer.getBoundingClientRect();
		const touchX = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
		const targetX = (touchX / rect.width) * viewBoxWidth;

		let closestIdx = 0;
		let minDiff = Infinity;
		for (let i = 0; i < points.length; i++) {
			const diff = Math.abs(points[i].x - targetX);
			if (diff < minDiff) {
				minDiff = diff;
				closestIdx = i;
			}
		}
		hoveredIndex = closestIdx;
	}

	const hoveredPoint = $derived(
		hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null
	);
</script>

<div class="p-4 sm:p-5 rounded-xl bg-[#171715] border border-stone-800/80 space-y-4">
	<!-- Header & Metrics -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/60 pb-3">
		<div class="space-y-0.5">
			<div class="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
				<TrendingDown class="w-3.5 h-3.5 text-[#e06c75]" />
				<span>Daily Spend Trend</span>
			</div>
			<div class="text-[11px] text-stone-500 font-mono">
				Spend per day across {dailyData.length} {dailyData.length === 1 ? 'day' : 'days'}
			</div>
		</div>

		<!-- Summary Pills -->
		<div class="flex items-center gap-3 sm:gap-4 text-xs flex-wrap">
			<div class="flex flex-col">
				<span class="text-[10px] text-stone-500 uppercase font-mono">Daily Avg</span>
				<span class="font-mono tabular-nums font-semibold text-stone-200">
					{formatCurrency(dailyAverage)}
				</span>
			</div>

			<div class="w-px h-6 bg-stone-800 hidden sm:block"></div>

			<div class="flex flex-col">
				<span class="text-[10px] text-stone-500 uppercase font-mono">Peak Day</span>
				<span class="font-mono tabular-nums font-semibold text-[#e06c75]">
					{formatCurrency(peakDay.amount)}
				</span>
			</div>

			<div class="w-px h-6 bg-stone-800 hidden sm:block"></div>

			<div class="flex flex-col">
				<span class="text-[10px] text-stone-500 uppercase font-mono">Active Days</span>
				<span class="font-mono tabular-nums font-semibold text-stone-300">
					{activeDaysCount}/{dailyData.length}
				</span>
			</div>
		</div>
	</div>

	<!-- Chart Area -->
	{#if dailyData.length === 0 || totalSpend === 0}
		<div class="py-12 text-center text-stone-500 text-xs font-mono">
			No debit entries recorded for this period.
		</div>
	{:else}
		<div
			bind:this={svgContainer}
			bind:clientWidth={containerWidth}
			role="region"
			aria-label="Daily spend trend graph"
			class="relative w-full select-none cursor-crosshair touch-pan-x"
			onmousemove={handleMouseMove}
			onmouseleave={() => (hoveredIndex = null)}
			ontouchmove={handleTouchMove}
			ontouchend={() => (hoveredIndex = null)}
		>
			<!-- Floating Tooltip Overlay -->
			{#if hoveredPoint}
				<div
					class="pointer-events-none absolute z-20 px-3 py-1.5 rounded-lg bg-[#111110]/95 border border-stone-700 shadow-2xl text-center transition-all duration-75"
					style="left: {Math.max(8, Math.min(92, (hoveredPoint.x / viewBoxWidth) * 100))}%; top: 4px; transform: translateX(-50%);"
				>
					<div class="text-[10px] text-stone-400 font-mono">{hoveredPoint.day.fullDate}</div>
					<div class="text-xs font-mono font-semibold text-[#e06c75]">
						{formatCurrency(hoveredPoint.day.amount)}
					</div>
					<div class="text-[9px] text-stone-500 font-mono">
						{hoveredPoint.day.count} {hoveredPoint.day.count === 1 ? 'transaction' : 'transactions'}
					</div>
				</div>
			{/if}

			<!-- SVG Graph -->
			<svg
				viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"
				preserveAspectRatio="none"
				class="w-full h-48 sm:h-60 overflow-visible"
			>
				<defs>
					<linearGradient id="spendTrendGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#e06c75" stop-opacity="0.25" />
						<stop offset="70%" stop-color="#e06c75" stop-opacity="0.04" />
						<stop offset="100%" stop-color="#e06c75" stop-opacity="0" />
					</linearGradient>
				</defs>

				<!-- Horizontal Reference Lines -->
				<line
					x1={padding.left}
					y1={padding.top}
					x2={viewBoxWidth - padding.right}
					y2={padding.top}
					stroke="#22211e"
					stroke-dasharray="3 3"
					stroke-width="1"
				/>
				<text
					x={viewBoxWidth - padding.right}
					y={padding.top - 6}
					text-anchor="end"
					class="text-[9px] font-mono fill-stone-600"
				>
					{formatCurrency(maxAmount)}
				</text>

				<line
					x1={padding.left}
					y1={padding.top + chartH / 2}
					x2={viewBoxWidth - padding.right}
					y2={padding.top + chartH / 2}
					stroke="#22211e"
					stroke-dasharray="3 3"
					stroke-width="1"
				/>
				<text
					x={viewBoxWidth - padding.right}
					y={padding.top + chartH / 2 - 4}
					text-anchor="end"
					class="text-[9px] font-mono fill-stone-600"
				>
					{formatCurrency(maxAmount / 2)}
				</text>

				<line
					x1={padding.left}
					y1={padding.top + chartH}
					x2={viewBoxWidth - padding.right}
					y2={padding.top + chartH}
					stroke="#262522"
					stroke-width="1"
				/>

				<!-- Gradient Area Fill -->
				{#if areaPath}
					<path d={areaPath} fill="url(#spendTrendGradient)" />
				{/if}

				<!-- Smooth Trend Line -->
				{#if linePath}
					<path
						d={linePath}
						fill="none"
						stroke="#e06c75"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				{/if}

				<!-- Subtle dots on days with spend -->
				{#each points as pt}
					{#if pt.day.amount > 0}
						<circle
							cx={pt.x}
							cy={pt.y}
							r="2.5"
							fill="#e06c75"
							class="opacity-75 transition-opacity"
						/>
					{/if}
				{/each}

				<!-- Hover Cursor Guideline and Highlight Indicator -->
				{#if hoveredPoint}
					<line
						x1={hoveredPoint.x}
						y1={padding.top}
						x2={hoveredPoint.x}
						y2={padding.top + chartH}
						stroke="#57534e"
						stroke-dasharray="3 3"
						stroke-width="1.2"
					/>
					<circle
						cx={hoveredPoint.x}
						cy={hoveredPoint.y}
						r="8"
						fill="#e06c75"
						fill-opacity="0.2"
					/>
					<circle
						cx={hoveredPoint.x}
						cy={hoveredPoint.y}
						r="4"
						fill="#e06c75"
						stroke="#171715"
						stroke-width="2"
					/>
				{/if}

				<!-- X-Axis Date Labels -->
				{#each xLabels as lbl}
					<text
						x={lbl.x}
						y={viewBoxHeight - 12}
						text-anchor={lbl.align}
						class="text-[10px] font-mono fill-stone-500"
					>
						{lbl.label}
					</text>
				{/each}
			</svg>
		</div>
	{/if}
</div>
