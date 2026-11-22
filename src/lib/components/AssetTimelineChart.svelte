<script lang="ts">
	import type { AssetSnapshot } from '#lib/types';
	import { formatCurrency as formatCur } from '#lib/utils';
	import { appState } from '#lib/state.svelte';
	import { Activity, Clock } from '@lucide/svelte';

	let {
		history = [],
		currentTotalFinal = 0,
		currentTotalInitial = 0
	}: {
		history: AssetSnapshot[];
		currentTotalFinal: number;
		currentTotalInitial: number;
	} = $props();

	let containerEl = $state<HTMLDivElement | null>(null);
	let containerWidth = $state<number>(800);
	let hoveredIndex = $state<number | null>(null);

	function formatCurrency(val: number) {
		return formatCur(val, appState.settings.currencySymbol);
	}

	function formatTimestamp(ts: number, showTime: boolean = true) {
		const d = new Date(ts);
		const day = d.getDate();
		const month = d.toLocaleString('en-US', { month: 'short' });
		const hours = String(d.getHours()).padStart(2, '0');
		const mins = String(d.getMinutes()).padStart(2, '0');
		return showTime ? `${day} ${month}, ${hours}:${mins}` : `${day} ${month}`;
	}

	// Prepare data points
	interface Point {
		timestamp: number;
		value: number;
		initial: number;
		formattedTime: string;
		x: number;
		y: number;
	}

	const chartPoints = $derived.by<Point[]>(() => {
		// Clean and sort history
		let pointsList: Array<{ timestamp: number; value: number; initial: number }> = [];

		if (history && history.length > 0) {
			pointsList = history
				.filter((h) => typeof h.timestamp === 'number' && !isNaN(h.timestamp) && !isNaN(h.totalFinal))
				.map((h) => ({
					timestamp: h.timestamp,
					value: h.totalFinal,
					initial: h.totalInitial
				}))
				.sort((a, b) => a.timestamp - b.timestamp);
		}

		// If no points, create a current baseline point
		if (pointsList.length === 0) {
			const now = Date.now();
			pointsList = [
				{ timestamp: now - 3600000, value: currentTotalFinal, initial: currentTotalInitial },
				{ timestamp: now, value: currentTotalFinal, initial: currentTotalInitial }
			];
		} else if (pointsList.length === 1) {
			// Duplicate point slightly earlier for line rendering
			const p = pointsList[0];
			pointsList = [
				{ timestamp: p.timestamp - 3600000, value: p.value, initial: p.initial },
				p
			];
		}

		const minTime = pointsList[0].timestamp;
		const maxTime = pointsList[pointsList.length - 1].timestamp;
		const timeSpan = maxTime > minTime ? maxTime - minTime : 1;

		let minVal = Math.min(...pointsList.map((p) => p.value));
		let maxVal = Math.max(...pointsList.map((p) => p.value));

		// Add 10% breathing room to min and max
		if (minVal === maxVal) {
			minVal = Math.max(0, minVal * 0.9);
			maxVal = maxVal === 0 ? 1000 : maxVal * 1.1;
		} else {
			const valSpan = maxVal - minVal;
			minVal = Math.max(0, minVal - valSpan * 0.08);
			maxVal = maxVal + valSpan * 0.08;
		}

		const valRange = maxVal > minVal ? maxVal - minVal : 1;

		const viewBoxWidth = Math.max(containerWidth, 320);
		const viewBoxHeight = 220;
		const pad = { top: 20, right: 16, bottom: 36, left: 16 };
		const usableWidth = viewBoxWidth - pad.left - pad.right;
		const usableHeight = viewBoxHeight - pad.top - pad.bottom;

		return pointsList.map((p) => {
			const normX = (p.timestamp - minTime) / timeSpan;
			const normY = (p.value - minVal) / valRange;

			const x = pad.left + normX * usableWidth;
			const y = pad.top + (1 - normY) * usableHeight;

			return {
				timestamp: p.timestamp,
				value: p.value,
				initial: p.initial,
				formattedTime: formatTimestamp(p.timestamp, true),
				x,
				y
			};
		});
	});

	// SVG Path definitions
	const linePath = $derived.by(() => {
		if (chartPoints.length === 0) return '';
		return chartPoints.reduce((acc, pt, idx) => {
			return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
		}, '');
	});

	const areaPath = $derived.by(() => {
		if (chartPoints.length === 0) return '';
		const first = chartPoints[0];
		const last = chartPoints[chartPoints.length - 1];
		const bottomY = 220 - 36;
		return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
	});

	// Metrics
	const peakValue = $derived(
		chartPoints.length > 0 ? Math.max(...chartPoints.map((p) => p.value)) : 0
	);
	const lowValue = $derived(
		chartPoints.length > 0 ? Math.min(...chartPoints.map((p) => p.value)) : 0
	);

	function handleMouseMove(e: MouseEvent) {
		if (!containerEl || chartPoints.length === 0) return;
		const rect = containerEl.getBoundingClientRect();
		const mouseX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
		const scaleX = (mouseX / rect.width) * Math.max(containerWidth, 320);

		let closestIdx = 0;
		let minDiff = Infinity;
		for (let i = 0; i < chartPoints.length; i++) {
			const diff = Math.abs(chartPoints[i].x - scaleX);
			if (diff < minDiff) {
				minDiff = diff;
				closestIdx = i;
			}
		}
		hoveredIndex = closestIdx;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!containerEl || chartPoints.length === 0 || !e.touches[0]) return;
		const rect = containerEl.getBoundingClientRect();
		const touchX = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
		const scaleX = (touchX / rect.width) * Math.max(containerWidth, 320);

		let closestIdx = 0;
		let minDiff = Infinity;
		for (let i = 0; i < chartPoints.length; i++) {
			const diff = Math.abs(chartPoints[i].x - scaleX);
			if (diff < minDiff) {
				minDiff = diff;
				closestIdx = i;
			}
		}
		hoveredIndex = closestIdx;
	}

	const activeHovered = $derived(
		hoveredIndex !== null && chartPoints[hoveredIndex] ? chartPoints[hoveredIndex] : null
	);
</script>

<div class="hw-chassis p-4 sm:p-6 rounded-2xl border border-[#292924] space-y-4 shadow-xl">
	<!-- Header & Metrics -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#292924] pb-3">
		<div class="space-y-0.5">
			<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200 flex items-center gap-1.5">
				<Activity class="w-3.5 h-3.5 text-[#82b896]" />
				<span>VALUATION OSCILLOSCOPE (ASSET VS TIME)</span>
			</div>
			<div class="text-[11px] text-stone-500 font-mono">
				Historical trajectory recorded on snapshot dispatch
			</div>
		</div>

		<!-- Summary Telemetry Pills -->
		<div class="flex items-center gap-3 sm:gap-4 text-xs flex-wrap">
			<div class="flex flex-col">
				<span class="text-[10px] text-stone-500 uppercase font-mono">Peak Valuation</span>
				<span class="font-mono tabular-nums font-bold text-[#82b896]">
					{formatCurrency(peakValue)}
				</span>
			</div>
			<div class="flex flex-col">
				<span class="text-[10px] text-stone-500 uppercase font-mono">Floor Valuation</span>
				<span class="font-mono tabular-nums font-bold text-stone-300">
					{formatCurrency(lowValue)}
				</span>
			</div>
			<div class="flex flex-col">
				<span class="text-[10px] text-stone-500 uppercase font-mono">Snapshots Logged</span>
				<span class="font-mono tabular-nums font-bold text-[#f97316]">
					{history.length}
				</span>
			</div>
		</div>
	</div>

	<!-- Interactive Chart SVG Container -->
	<div
		bind:this={containerEl}
		bind:clientWidth={containerWidth}
		onmousemove={handleMouseMove}
		onmouseleave={() => (hoveredIndex = null)}
		ontouchmove={handleTouchMove}
		ontouchend={() => (hoveredIndex = null)}
		class="relative w-full h-[220px] select-none cursor-crosshair overflow-hidden rounded-xl bg-[#080c09] border border-[#18261b]"
		role="region"
		aria-label="Asset valuation timeline chart"
	>
		<svg
			class="w-full h-full overflow-visible"
			viewBox="0 0 {Math.max(containerWidth, 320)} 220"
			preserveAspectRatio="none"
		>
			<defs>
				<!-- Phosphor Green Glow Gradient -->
				<linearGradient id="assetPhosphorGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#82b896" stop-opacity="0.32" />
					<stop offset="65%" stop-color="#82b896" stop-opacity="0.08" />
					<stop offset="100%" stop-color="#82b896" stop-opacity="0" />
				</linearGradient>

				<!-- Subtle Grid Pattern -->
				<pattern id="hwGrid" width="40" height="40" patternUnits="userSpaceOnUse">
					<path d="M 40 0 L 0 0 0 40" fill="none" stroke="#16291b" stroke-width="0.7" stroke-dasharray="2 3" />
				</pattern>
			</defs>

			<!-- Ambient Oscilloscope Grid -->
			<rect width="100%" height="184" fill="url(#hwGrid)" opacity="0.45" />

			<!-- Baseline Horizon Line -->
			<line
				x1="16"
				y1="184"
				x2="{Math.max(containerWidth, 320) - 16}"
				y2="184"
				stroke="#1c3322"
				stroke-width="1"
			/>

			<!-- Gradient Area Fill -->
			{#if areaPath}
				<path d={areaPath} fill="url(#assetPhosphorGradient)" />
			{/if}

			<!-- Trajectory Polyline -->
			{#if linePath}
				<path
					d={linePath}
					fill="none"
					stroke="#82b896"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="drop-shadow-[0_0_8px_rgba(130,184,150,0.6)]"
				/>
			{/if}

			<!-- Key Data Points -->
			{#each chartPoints as pt, idx}
				{@const isLast = idx === chartPoints.length - 1}
				<!-- Circle dot -->
				<circle
					cx={pt.x}
					cy={pt.y}
					r={isLast ? 4 : 3}
					fill="#82b896"
					stroke="#080c09"
					stroke-width="2"
					class="transition-transform duration-150 {isLast ? 'hw-needle-glow' : ''}"
				/>
			{/each}

			<!-- Interactive Hover Indicator Crosshair -->
			{#if activeHovered}
				<line
					x1={activeHovered.x}
					y1="16"
					x2={activeHovered.x}
					y2="184"
					stroke="#f97316"
					stroke-width="1.2"
					stroke-dasharray="3 3"
				/>
				<circle
					cx={activeHovered.x}
					cy={activeHovered.y}
					r="5.5"
					fill="#f97316"
					stroke="#fff"
					stroke-width="2"
					class="drop-shadow-[0_0_8px_#f97316]"
				/>
			{/if}

			<!-- X-Axis Timestamp Ticks -->
			{#if chartPoints.length > 0}
				<!-- First Timestamp -->
				<text
					x={chartPoints[0].x}
					y="204"
					font-size="10"
					font-family="monospace"
					fill="#57534e"
					text-anchor="start"
				>
					{formatTimestamp(chartPoints[0].timestamp, false)}
				</text>

				<!-- Last Timestamp -->
				<text
					x={chartPoints[chartPoints.length - 1].x}
					y="204"
					font-size="10"
					font-family="monospace"
					fill="#82b896"
					text-anchor="end"
					font-weight="bold"
				>
					{formatTimestamp(chartPoints[chartPoints.length - 1].timestamp, true)}
				</text>
			{/if}
		</svg>

		<!-- Tooltip Card Over Cursor -->
		{#if activeHovered}
			{@const delta = activeHovered.value - activeHovered.initial}
			{@const pct = activeHovered.initial > 0 ? (delta / activeHovered.initial) * 100 : 0}
			<div
				class="pointer-events-none absolute z-30 p-2.5 rounded-lg bg-[#141411] border border-[#2e2e28] shadow-2xl text-xs space-y-1 backdrop-blur-md"
				style={`left: ${Math.min(Math.max(activeHovered.x - 70, 8), Math.max(containerWidth, 320) - 150)}px; top: ${Math.max(activeHovered.y - 75, 8)}px;`}
			>
				<div class="text-[10px] font-mono text-stone-400 flex items-center gap-1">
					<Clock class="w-3 h-3 text-[#f97316]" />
					<span>{activeHovered.formattedTime}</span>
				</div>
				<div class="text-sm font-mono font-bold text-[#82b896] tabular-nums">
					{formatCurrency(activeHovered.value)}
				</div>
				<div class="text-[10px] font-mono font-bold tabular-nums {pct >= 0 ? 'text-[#82b896]' : 'text-[#e06c75]'}">
					{pct >= 0 ? '+' : ''}{pct.toFixed(2)}% vs Invested
				</div>
			</div>
		{/if}
	</div>
</div>
