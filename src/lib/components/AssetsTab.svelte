<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { AssetEntry } from '#lib/types';
	import { formatCurrency as formatCur } from '#lib/utils';
	import TerminalRoller from '#lib/components/TerminalRoller.svelte';
	import AssetTimelineChart from '#lib/components/AssetTimelineChart.svelte';
	import AssetModal from '#lib/components/AssetModal.svelte';
	import {
		Coins,
		Plus,
		Camera,
		Trash2,
		Pencil,
		TrendingUp,
		TrendingDown,
		Clock
	} from '@lucide/svelte';

	let isModalOpen = $state(false);
	let selectedEntry = $state<AssetEntry | null>(null);
	let isCapturingSnapshot = $state(false);
	let boardKey = $state(1);

	function formatCurrency(val: number) {
		return formatCur(val, appState.settings.currencySymbol);
	}

	function formatTimestamp(ts?: number) {
		if (!ts) return 'Never';
		const d = new Date(ts);
		return d.toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getAssetMetrics(entry: AssetEntry) {
		const isSystem = entry.id === 'asset_liquid';
		const delta = entry.final - entry.initial;
		const pct = entry.initial > 0 ? (delta / entry.initial) * 100 : 0;
		return { isSystem, delta, pct };
	}

	const latestSnapshotTime = $derived.by(() => {
		if (!appState.assets.history || appState.assets.history.length === 0) return null;
		const last = appState.assets.history[appState.assets.history.length - 1];
		return last.timestamp;
	});

	function openAddModal() {
		selectedEntry = null;
		isModalOpen = true;
	}

	function openEditModal(entry: AssetEntry) {
		selectedEntry = entry;
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
		selectedEntry = null;
	}

	async function handleDelete(entry: AssetEntry) {
		if (!confirm(`Delete asset "${entry.name}"?`)) return;
		try {
			await appState.deleteAsset(entry.id);
			boardKey++;
			appState.showToast('info', 'Asset Deleted', `Removed "${entry.name}"`);
		} catch (err: any) {
			appState.showToast('error', 'Delete Failed', err.message);
		}
	}

	async function handleManualSnapshot() {
		if (isCapturingSnapshot) return;
		isCapturingSnapshot = true;
		try {
			const snap = await appState.recordAssetSnapshot();
			boardKey++;
			appState.showToast(
				'success',
				'Snapshot Recorded',
				`Valuation ${formatCurrency(snap.totalFinal)} at ${formatTimestamp(snap.timestamp)}`
			);
		} catch (err: any) {
			appState.showToast('error', 'Snapshot Failed', err.message);
		} finally {
			isCapturingSnapshot = false;
		}
	}
</script>

<div class="space-y-4 sm:space-y-5">
	<!-- Top Section: Physical Instrument Faceplate -->
	<section class="hw-chassis rounded-2xl p-4 sm:p-6 lg:p-7 relative shadow-2xl space-y-4 sm:space-y-5">
		<!-- Faceplate Header -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#292924] pb-4 px-1 sm:px-2 gap-3">
			<div class="flex items-center gap-2.5 sm:gap-3">
				<Coins class="w-6 h-6 sm:w-7 sm:h-7 text-[#82b896] stroke-[2.2]" />
				<div>
					<span class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
						ASSET HOLDINGS & VALUATION
					</span>
					{#if latestSnapshotTime}
						<div class="text-[10px] font-mono text-stone-500 flex items-center gap-1.5 mt-0.5">
							<Clock class="w-3 h-3 text-[#f97316]" />
							<span>Last recorded snapshot: {formatTimestamp(latestSnapshotTime)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Action Controls -->
			<div class="flex items-center gap-2 sm:gap-3 flex-wrap">
				<!-- Record Snapshot Button -->
				<button
					type="button"
					onclick={handleManualSnapshot}
					disabled={isCapturingSnapshot || appState.assets.entries.length === 0}
					class="hw-keycap flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-mono text-stone-300 hover:text-white cursor-pointer min-h-[40px] sm:min-h-[38px] shadow-sm disabled:opacity-50"
					title="Record current asset values to timestamp timeline"
				>
					<Camera class="w-3.5 h-3.5 text-[#f97316] {isCapturingSnapshot ? 'animate-spin' : ''}" />
					<span>{isCapturingSnapshot ? 'LOGGING...' : 'RECORD SNAPSHOT'}</span>
				</button>

				<!-- Tactile New Asset Button -->
				<button
					type="button"
					onclick={openAddModal}
					class="hw-keycap-primary flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider cursor-pointer min-h-[40px] sm:min-h-[38px] shadow-md"
				>
					<Plus class="w-3.5 h-3.5 stroke-[2.5]" />
					<span>NEW ASSET</span>
				</button>
			</div>
		</div>

		<!-- Telemetry Grid: VFD Meters -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
			<!-- Total Initial (Invested) -->
			<div class="hw-vfd-display p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-2">
				<div class="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold">
					TOTAL INVESTED (INITIAL)
				</div>
				<div class="py-0.5">
					<TerminalRoller
						value={appState.totalAssetInitial}
						symbol={appState.settings.currencySymbol || '₹'}
						theme="emerald"
						fontSizeClass="text-2xl sm:text-3xl"
						triggerKey={boardKey}
					/>
				</div>
				<div class="text-[10px] font-mono text-stone-500 pt-1 border-t border-[#1a281e]">
					Combined principal outlay
				</div>
			</div>

			<!-- Current Final Valuation -->
			<div class="hw-vfd-display p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-2">
				<div class="text-[10px] font-mono text-[#82b896]/70 uppercase tracking-widest font-bold">
					CURRENT VALUATION (FINAL)
				</div>
				<div class="py-0.5">
					<TerminalRoller
						value={appState.totalAssetFinal}
						symbol={appState.settings.currencySymbol || '₹'}
						theme={appState.totalAssetDelta >= 0 ? 'emerald' : 'rose'}
						fontSizeClass="text-2xl sm:text-3xl"
						triggerKey={boardKey}
					/>
				</div>
				<div class="text-[10px] font-mono text-stone-500 pt-1 border-t border-[#1a281e]">
					Total current asset valuation
				</div>
			</div>

			<!-- Portfolio Delta -->
			<div class="hw-vfd-display {appState.totalAssetDelta < 0 ? 'hw-vfd-rose' : ''} p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-mono uppercase tracking-widest font-bold {appState.totalAssetDelta >= 0 ? 'text-[#82b896]/70' : 'text-rose-300/70'}">
						PORTFOLIO DELTA
					</span>
					<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {appState.totalAssetDelta >= 0 ? 'bg-[#82b896]/15 text-[#82b896] border border-[#82b896]/30' : 'bg-[#e06c75]/15 text-[#e06c75] border border-[#e06c75]/30'}">
						{appState.totalAssetDelta >= 0 ? '+' : ''}{appState.totalAssetDeltaPercentage.toFixed(2)}%
					</span>
				</div>
				<div class="text-2xl sm:text-3xl font-mono tabular-nums font-bold truncate {appState.totalAssetDelta >= 0 ? 'text-[#82b896] drop-shadow-[0_0_8px_rgba(130,184,150,0.4)]' : 'text-[#e06c75] drop-shadow-[0_0_8px_rgba(224,108,117,0.4)]'}">
					{formatCurrency(appState.totalAssetDelta)}
				</div>
				<div class="text-[10px] font-mono text-stone-500 pt-1 border-t border-[#1a281e]">
					{appState.totalAssetDelta >= 0 ? 'Net capital appreciation' : 'Net capital depreciation'}
				</div>
			</div>
		</div>
	</section>

	<!-- Valuation Oscilloscope Graph (Plots Final Asset vs Time) -->
	<AssetTimelineChart
		history={appState.assets.history}
		currentTotalFinal={appState.totalAssetFinal}
		currentTotalInitial={appState.totalAssetInitial}
	/>

	<!-- Assets Holdings Feed with Seamless Protrusion -->
	<section class="relative">
		<!-- Extruded Flange Row -->
		<div class="flex items-end relative z-10 -mb-[1px]">
			<div
				class="bg-[#171714] border-t border-l border-r border-[#2e2e28] rounded-tl-xl rounded-tr-lg px-4 sm:px-6 py-2.5 min-h-[44px] flex items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
			>
				<span class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
					ASSET HOLDINGS ({appState.allAssetEntries.length})
				</span>
			</div>
		</div>

		<!-- Main Table / Cards Enclosure -->
		<div class="bg-[#171714] border border-[#2e2e28] rounded-b-2xl rounded-tr-2xl rounded-tl-none shadow-2xl overflow-hidden">
			{#if appState.allAssetEntries.length === 0}
				<div class="p-10 text-center space-y-3">
					<Coins class="w-8 h-8 text-stone-600 mx-auto" />
					<div class="text-stone-400 font-mono text-xs">No asset holdings recorded yet.</div>
					<button
						type="button"
						onclick={openAddModal}
						class="hw-keycap-primary px-4 py-2 text-xs font-mono font-bold tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md"
					>
						<Plus class="w-3.5 h-3.5" />
						<span>RECORD FIRST ASSET</span>
					</button>
				</div>
			{:else}
				<!-- Mobile Feed: Card List (sm:hidden) -->
				<div class="sm:hidden divide-y divide-[#242420]">
					{#each appState.allAssetEntries as entry (entry.id)}
						{@const { isSystem, delta, pct } = getAssetMetrics(entry)}
						<div class="p-4 space-y-2.5">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<span class="font-mono text-sm font-bold text-stone-100 truncate">{entry.name}</span>
									</div>
									{#if !isSystem}
										<div class="text-[10px] font-mono text-stone-500 mt-0.5">
											{formatTimestamp(entry.updatedAt)}
										</div>
									{/if}
								</div>

								<!-- Delta % Pill -->
								<span
									class="px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 {pct >= 0
										? 'bg-[#82b896]/15 text-[#82b896] border border-[#82b896]/30'
										: 'bg-[#e06c75]/15 text-[#e06c75] border border-[#e06c75]/30'}"
								>
									{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
								</span>
							</div>

							<!-- Initial vs Final Grid -->
							<div class="grid grid-cols-2 gap-2 text-xs font-mono bg-[#10100d] p-2.5 rounded-lg border border-[#242420]">
								<div>
									<div class="text-[10px] text-stone-500 uppercase">Initial</div>
									<div class="font-bold text-stone-300 tabular-nums">{formatCurrency(entry.initial)}</div>
								</div>
								<div>
									<div class="text-[10px] text-stone-500 uppercase">Final</div>
									<div class="font-bold text-stone-100 tabular-nums">{formatCurrency(entry.final)}</div>
								</div>
							</div>

							<!-- Delta Amount & Actions -->
							<div class="flex items-center justify-between pt-1">
								<div class="text-xs font-mono">
									<span class="text-stone-500 text-[10px] uppercase">Delta:</span>
									<span class="font-bold tabular-nums ml-1 {delta >= 0 ? 'text-[#82b896]' : 'text-[#e06c75]'}">
										{delta >= 0 ? '+' : ''}{formatCurrency(delta)}
									</span>
								</div>

								{#if isSystem}
									<div class="text-[10px] font-mono text-stone-500">
										LEDGER SYNC
									</div>
								{:else}
									<div class="flex items-center gap-1.5">
										<button
											type="button"
											onclick={() => openEditModal(entry)}
											class="hw-keycap p-1.5 rounded-md text-stone-400 hover:text-stone-200 cursor-pointer"
											title="Edit Asset"
											aria-label="Edit {entry.name}"
										>
											<Pencil class="w-3.5 h-3.5 text-[#f97316]" />
										</button>
										<button
											type="button"
											onclick={() => handleDelete(entry)}
											class="hw-keycap p-1.5 rounded-md text-stone-400 hover:text-[#e06c75] cursor-pointer"
											title="Delete Asset"
											aria-label="Delete {entry.name}"
										>
											<Trash2 class="w-3.5 h-3.5" />
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}

					<!-- Mobile Summary Card -->
					<div class="p-4 bg-[#11110f] border-t-2 border-[#2e2e28] space-y-2">
						<div class="text-xs font-mono uppercase tracking-wider font-bold text-stone-400">
							PORTFOLIO AGGREGATE TOTAL
						</div>
						<div class="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0a0a08] p-2.5 rounded-lg border border-[#242420]">
							<div>
								<div class="text-[10px] text-stone-500 uppercase">Total Initial</div>
								<div class="font-bold text-stone-300 tabular-nums">{formatCurrency(appState.totalAssetInitial)}</div>
							</div>
							<div>
								<div class="text-[10px] text-stone-500 uppercase">Total Final</div>
								<div class="font-bold text-[#82b896] tabular-nums">{formatCurrency(appState.totalAssetFinal)}</div>
							</div>
						</div>
						<div class="flex items-center justify-between text-xs font-mono pt-1">
							<span class="text-stone-400">Total Delta:</span>
							<span class="font-bold tabular-nums {appState.totalAssetDelta >= 0 ? 'text-[#82b896]' : 'text-[#e06c75]'}">
								{appState.totalAssetDelta >= 0 ? '+' : ''}{formatCurrency(appState.totalAssetDelta)}
								({appState.totalAssetDelta >= 0 ? '+' : ''}{appState.totalAssetDeltaPercentage.toFixed(2)}%)
							</span>
						</div>
					</div>
				</div>

				<!-- Desktop Table (hidden sm:block) -->
				<div class="hidden sm:block overflow-x-auto">
					<table class="w-full text-left text-xs font-mono">
						<thead class="bg-[#141411] border-b border-[#292924] text-[10px] font-bold text-stone-400 uppercase tracking-wider">
							<tr>
								<th class="px-4 py-3">Asset Classification</th>
								<th class="px-4 py-3 text-right">Initial Invested</th>
								<th class="px-4 py-3 text-right">Current Final</th>
								<th class="px-4 py-3 text-right">Delta Amount</th>
								<th class="px-4 py-3 text-center">Delta %</th>
								<th class="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[#242420]">
							{#each appState.allAssetEntries as entry (entry.id)}
								{@const { isSystem, delta, pct } = getAssetMetrics(entry)}
								<tr class="hover:bg-[#181815] transition-colors">
									<!-- Name & Timestamp -->
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<span class="font-bold text-stone-100">{entry.name}</span>
										</div>
										{#if !isSystem}
											<div class="text-[10px] text-stone-500 mt-0.5">
												Updated {formatTimestamp(entry.updatedAt)}
											</div>
										{/if}
									</td>

									<!-- Initial -->
									<td class="px-4 py-3 text-right text-stone-300 tabular-nums font-semibold">
										{formatCurrency(entry.initial)}
									</td>

									<!-- Final -->
									<td class="px-4 py-3 text-right text-stone-100 tabular-nums font-bold">
										{formatCurrency(entry.final)}
									</td>

									<!-- Delta Amount -->
									<td class="px-4 py-3 text-right tabular-nums font-bold {delta >= 0 ? 'text-[#82b896]' : 'text-[#e06c75]'}">
										{delta >= 0 ? '+' : ''}{formatCurrency(delta)}
									</td>

									<!-- Delta % Badge -->
									<td class="px-4 py-3 text-center">
										<span
											class="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tabular-nums {pct >= 0
												? 'bg-[#82b896]/15 text-[#82b896] border border-[#82b896]/30'
												: 'bg-[#e06c75]/15 text-[#e06c75] border border-[#e06c75]/30'}"
										>
											{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
										</span>
									</td>

									<!-- Actions -->
									<td class="px-4 py-3 text-right whitespace-nowrap">
										{#if isSystem}
											<div class="text-[10px] font-mono text-stone-500">
												LEDGER SYNC
											</div>
										{:else}
											<div class="flex items-center justify-end gap-1.5">
												<button
													type="button"
													onclick={() => openEditModal(entry)}
													class="hw-keycap p-1.5 rounded-md text-stone-400 hover:text-stone-200 cursor-pointer"
													title="Edit Asset"
													aria-label="Edit {entry.name}"
												>
													<Pencil class="w-3.5 h-3.5 text-[#f97316]" />
												</button>
												<button
													type="button"
													onclick={() => handleDelete(entry)}
													class="hw-keycap p-1.5 rounded-md text-stone-400 hover:text-[#e06c75] cursor-pointer"
													title="Delete Asset"
													aria-label="Delete {entry.name}"
												>
													<Trash2 class="w-3.5 h-3.5" />
												</button>
											</div>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>

						<!-- Summary / Total Row -->
						<tfoot class="bg-[#12120f] border-t-2 border-[#2e2e28] font-bold">
							<tr>
								<td class="px-4 py-3.5 text-stone-200 uppercase tracking-wider text-[11px]">
									TOTAL ASSETS PORTFOLIO
								</td>
								<td class="px-4 py-3.5 text-right text-stone-200 tabular-nums text-sm">
									{formatCurrency(appState.totalAssetInitial)}
								</td>
								<td class="px-4 py-3.5 text-right text-[#82b896] tabular-nums text-sm">
									{formatCurrency(appState.totalAssetFinal)}
								</td>
								<td class="px-4 py-3.5 text-right tabular-nums text-sm {appState.totalAssetDelta >= 0 ? 'text-[#82b896]' : 'text-[#e06c75]'}">
									{appState.totalAssetDelta >= 0 ? '+' : ''}{formatCurrency(appState.totalAssetDelta)}
								</td>
								<td class="px-4 py-3.5 text-center">
									<span
										class="inline-block px-3 py-1 rounded text-xs font-bold tabular-nums {appState.totalAssetDelta >= 0
											? 'bg-[#82b896]/20 text-[#82b896] border border-[#82b896]/40'
											: 'bg-[#e06c75]/20 text-[#e06c75] border border-[#e06c75]/40'}"
									>
										{appState.totalAssetDelta >= 0 ? '+' : ''}{appState.totalAssetDeltaPercentage.toFixed(2)}%
									</span>
								</td>
								<td class="px-4 py-3.5"></td>
							</tr>
						</tfoot>
					</table>
				</div>
			{/if}
		</div>
	</section>
</div>

<!-- Extracted Clean Asset Modal -->
<AssetModal
	isOpen={isModalOpen}
	entry={selectedEntry}
	onClose={closeModal}
	onSuccess={() => boardKey++}
/>
