<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/types';
	import { formatCurrency as formatCur } from '#lib/utils';
	import TransactionFeed from '#lib/components/TransactionFeed.svelte';
	import {
		ArrowRight,
		Plus,
		TrendingUp,
		TrendingDown,
		RotateCw,
		Coins
	} from '@lucide/svelte';
	import TerminalRoller from '#lib/components/TerminalRoller.svelte';

	const recentTransactions = $derived(appState.transactions.slice(0, 10));

	let boardKey = $state(1);
	let isReplaying = $state(false);

	const savingsRate = $derived(
		appState.totalCredit > 0
			? ((appState.netBalance / appState.totalCredit) * 100).toFixed(1)
			: '0.0'
	);

	let gaugeLoaded = $state(false);

	function triggerBoardRoll() {
		if (isReplaying) return;
		isReplaying = true;
		gaugeLoaded = false;
		boardKey++;

		setTimeout(() => {
			gaugeLoaded = true;
		}, 60);

		setTimeout(() => {
			isReplaying = false;
		}, 3100);
	}

	$effect(() => {
		const t = setTimeout(() => {
			gaugeLoaded = true;
		}, 60);
		return () => clearTimeout(t);
	});

	function formatCurrency(val: number) {
		return formatCur(val, appState.settings.currencySymbol);
	}

	function handleOpenModal() {
		appState.openTransactionModal();
	}

	async function handleDelete(tx: LocalTransaction) {
		if (!confirm(`Delete "${tx.name}" (${formatCurrency(tx.amount)})?`)) return;
		try {
			await appState.deleteTransaction(tx.id);
			appState.showToast('info', 'Deleted', tx.name);
		} catch (err: any) {
			appState.showToast('error', 'Error', err.message);
		}
	}
</script>

<div class="space-y-4 sm:space-y-5">
	<!-- Top Section: Physical Instrument Faceplate (Statement of Position) -->
	<section class="hw-chassis rounded-2xl p-4 sm:p-6 lg:p-7 relative shadow-2xl space-y-4 sm:space-y-5">
		<!-- Faceplate Header -->
		<div class="flex items-center justify-between gap-4 border-b border-[#292924] pb-4 px-1 sm:px-2">
			<div class="flex items-center gap-3">
				<TrendingUp class="w-6 h-6 sm:w-7 sm:h-7 text-[#82b896] stroke-[2.2]" />
				<!-- Small Retry Telemetry Calibration Button -->
				<button
					type="button"
					onclick={triggerBoardRoll}
					class="hw-keycap p-1.5 rounded-md text-stone-400 hover:text-stone-200 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center shadow-sm"
					title="Replay terminal display board roll"
					aria-label="Replay terminal display board roll"
				>
					<RotateCw class="w-3.5 h-3.5 text-[#f97316] {isReplaying ? 'animate-spin' : ''}" />
				</button>
			</div>

			<!-- Tactile New Button -->
			<button
				type="button"
				onclick={handleOpenModal}
				class="hw-keycap-primary flex items-center justify-center gap-2 px-4 py-2 sm:py-2 text-xs font-mono font-bold tracking-wider cursor-pointer min-h-[42px] sm:min-h-[38px] shadow-md"
				aria-label="New Record"
			>
				<Plus class="w-3.5 h-3.5 stroke-[2.5]" />
				<span>NEW RECORD</span>
			</button>
		</div>

		<!-- Telemetry Grid: First Half (Current Net Capital) + Second Half (Horizontally Stacked Credit & Debit) -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
			<!-- First Half: Current Net Capital Display & Retention Gauge -->
			<div class="hw-vfd-display {appState.netBalance < 0 ? 'hw-vfd-rose' : ''} p-4 sm:p-6 space-y-4 flex flex-col justify-between">
				<div class="space-y-1.5">
					<div class="text-[10px] font-mono text-[#82b896]/70 uppercase tracking-widest">
						CURRENT NET CAPITAL
					</div>
					<div class="py-1">
						<TerminalRoller
							value={appState.netBalance}
							symbol={appState.settings.currencySymbol || '₹'}
							theme={appState.netBalance >= 0 ? 'emerald' : 'rose'}
							fontSizeClass="text-2xl sm:text-4xl lg:text-5xl"
							triggerKey={boardKey}
						/>
					</div>
				</div>

				<!-- Dynamic Analog Needle Retention Gauge -->
				<div class="pt-3 border-t border-[#1a281e] space-y-2">
					<div class="flex items-center justify-between text-[10px] font-mono text-[#82b896]/70">
						<span>CAPITAL RETENTION</span>
						<span>{savingsRate}% RETENTION</span>
					</div>
					<!-- Gauge Needle Track with Spring Power-on Calibration & Phosphor Respiration -->
					<div class="relative h-3.5 bg-[#0a100b] rounded border border-[#16291b] overflow-hidden flex items-center px-1">
						<div 
							class="h-2 rounded bg-gradient-to-r from-[#82b896]/30 via-[#f97316] to-[#82b896] transition-all duration-[2800ms] ease-out"
							style={`width: ${gaugeLoaded ? Math.min(Math.max(Number(savingsRate) || 0, 5), 100) : 0}%`}
						></div>
						<div 
							class="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#fff] transition-all duration-[2800ms] ease-out hw-needle-glow"
							style={`left: ${gaugeLoaded ? Math.min(Math.max(Number(savingsRate) || 0, 5), 98) : 0}%`}
						></div>
					</div>
				</div>

				<!-- Tally Readout -->
				<div class="flex items-center gap-2 text-[10px] font-mono text-stone-500 pt-1">
					<span>{appState.transactions.length} OPERATIONS CLEARED</span>
				</div>
			</div>

			<!-- Second Column: Total Assets Valuation + Side-by-Side Credit & Debit -->
			<div class="flex flex-col gap-3 sm:gap-4 justify-between">
				<!-- Total Final Assets Valuation Meter -->
				<div class="hw-vfd-display p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
							TOTAL ASSETS VALUATION
						</span>
						<div class="flex items-center gap-1.5">
							<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold {appState.totalAssetDelta >= 0 ? 'bg-[#82b896]/15 text-[#82b896] border border-[#82b896]/30' : 'bg-[#e06c75]/15 text-[#e06c75] border border-[#e06c75]/30'}">
								{appState.totalAssetDelta >= 0 ? '+' : ''}{appState.totalAssetDeltaPercentage.toFixed(1)}%
							</span>
							<Coins class="w-3.5 h-3.5 text-[#82b896]" />
						</div>
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
					<div class="text-[10px] font-mono text-stone-500 pt-1 border-t border-[#1a281e] flex items-center justify-between">
						<span>Invested: {formatCurrency(appState.totalAssetInitial)}</span>
						<button
							type="button"
							onclick={() => (appState.activeTab = 'assets')}
							class="text-[10px] font-mono text-[#f97316] hover:underline cursor-pointer"
						>
							View Assets &rarr;
						</button>
					</div>
				</div>

				<!-- Side-by-Side Row for Credit and Debit -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
					<!-- Credit Meter -->
					<div class="hw-vfd-display p-3 sm:p-4 flex flex-col justify-between space-y-1.5">
						<div class="flex items-center justify-between">
							<span class="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">CREDIT</span>
							<TrendingUp class="w-3.5 h-3.5 text-[#82b896]" />
						</div>
						<div class="py-0.5">
							<TerminalRoller
								value={appState.totalCredit}
								symbol={appState.settings.currencySymbol || '₹'}
								theme="emerald"
								fontSizeClass="text-lg sm:text-xl lg:text-2xl"
								triggerKey={boardKey}
							/>
						</div>
					</div>

					<!-- Debit Meter -->
					<div class="hw-vfd-display hw-vfd-rose p-3 sm:p-4 flex flex-col justify-between space-y-1.5">
						<div class="flex items-center justify-between">
							<span class="text-[10px] font-mono uppercase tracking-wider text-rose-300/70 font-bold">DEBIT</span>
							<TrendingDown class="w-3.5 h-3.5 text-[#e06c75]" />
						</div>
						<div class="py-0.5">
							<TerminalRoller
								value={appState.totalDebit}
								symbol={appState.settings.currencySymbol || '₹'}
								theme="rose"
								fontSizeClass="text-lg sm:text-xl lg:text-2xl"
								triggerKey={boardKey}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Unified Records Panel with Seamless Protrusions -->
	<section class="relative">
		<!-- Seamless Extruded Flange Row -->
		<div class="flex items-end justify-between relative z-10 -mb-[1px]">
			<!-- Left Protrusion (Recent Operations) -->
			<div
				class="bg-[#171714] border-t border-l border-r border-[#2e2e28] rounded-tl-xl rounded-tr-lg px-4 sm:px-6 py-2.5 min-h-[44px] flex items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
			>
				<span class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
					RECENT OPERATIONS
				</span>
			</div>

			<!-- Center Recessed Shelf bridging the two protrusions -->
			<div class="flex-1 border-b border-[#2e2e28] h-[1px] self-end"></div>

			<!-- Right Protrusion (View All Action) -->
			<button
				type="button"
				onclick={() => {
					appState.activeTab = 'history';
				}}
				class="bg-[#171714] border-t border-l border-r border-[#2e2e28] rounded-tl-lg rounded-tr-xl px-4 sm:px-6 py-2.5 min-h-[44px] flex items-center gap-2 text-xs font-mono text-stone-300 hover:text-white transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[#1c1c18] active:bg-[#131310]"
			>
				<span>View all {appState.transactions.length}</span>
				<ArrowRight class="w-3.5 h-3.5 text-[#f97316]" />
			</button>
		</div>

		<!-- Main Records Enclosure -->
		<div
			class="bg-[#171714] border-x border-b border-[#2e2e28] rounded-b-xl sm:rounded-b-2xl shadow-2xl overflow-hidden relative"
		>
			<TransactionFeed
				transactions={recentTransactions}
				emptyMessage="No operations recorded in local ledger."
				onDelete={handleDelete}
				class="w-full bg-transparent"
			/>
		</div>
	</section>
</div>
