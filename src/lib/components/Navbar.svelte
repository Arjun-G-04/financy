<script lang="ts">
	import { appState, type TabType } from '#lib/state.svelte';
	import {
		LayoutDashboard,
		History,
		PieChart,
		Scale,
		Coins,
		FileSpreadsheet,
		Settings,
		LogOut
	} from '@lucide/svelte';
	import { formatCurrency } from '#lib/utils';

	const tabs: { id: TabType; label: string; icon: any }[] = [
		{ id: 'home', label: 'Overview', icon: LayoutDashboard },
		{ id: 'history', label: 'Ledger', icon: History },
		{ id: 'analytics', label: 'Analytics', icon: PieChart },
		{ id: 'reconcile', label: 'Reconcile', icon: Scale },
		{ id: 'assets', label: 'Assets', icon: Coins },
		{ id: 'import', label: 'Import', icon: FileSpreadsheet },
		{ id: 'settings', label: 'Settings', icon: Settings }
	];

	function handleTabSelect(id: TabType) {
		appState.activeTab = id;
	}
</script>

<header class="sticky top-0 z-40 w-full border-b border-[#242420] bg-[#141411]/95 backdrop-blur-md shadow-lg">
	<div class="max-w-[1700px] w-full mx-auto px-3.5 sm:px-6 lg:px-10">
		<div class="flex items-center justify-between h-16 sm:h-18">
			<!-- Brand with Titanium Nameplate -->
			<div class="flex items-center gap-3">
				<a href="/" class="flex items-center gap-2 group py-1">
					<div class="hw-metal-plate px-3 py-1 rounded-sm text-xs font-mono font-bold tracking-widest uppercase shadow-sm">
						FINANCY
					</div>
				</a>
			</div>

			<!-- Desktop Mechanical Keycap Navigation -->
			<nav class="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-[#0f0f0d] border border-[#262622]">
				{#each tabs as tab}
					<button
						onclick={() => handleTabSelect(tab.id)}
						class="px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center cursor-pointer {appState.activeTab === tab.id
							? 'bg-[#22221e] text-[#f5f2ea] border border-[#3d3d36] font-semibold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)]'
							: 'text-stone-400 hover:text-stone-200 hover:bg-[#181815]'}"
					>
						<span>{tab.label}</span>
					</button>
				{/each}
			</nav>

			<!-- Right: Recessed Total Assets Valuation Meter & Hardware Controls -->
			<div class="flex items-center gap-2 sm:gap-3">
				<!-- VFD Recessed Total Assets Valuation -->
				<div class="hw-vfd-display px-2.5 sm:px-3 py-1 flex flex-col text-right">
					<span class="text-[9px] uppercase tracking-wider text-[#82b896]/60 font-mono hidden sm:inline">TOTAL ASSETS VALUATION</span>
					<span class="text-xs sm:text-sm font-mono tabular-nums font-bold {appState.totalAssetFinal >= 0 ? 'text-[#82b896] drop-shadow-[0_0_8px_rgba(130,184,150,0.4)]' : 'text-[#e06c75] drop-shadow-[0_0_8px_rgba(224,108,117,0.4)]'}">
						{formatCurrency(appState.totalAssetFinal, appState.settings.currencySymbol)}
					</span>
				</div>

				<a
					href="/auth/logout"
					class="hw-keycap p-2 rounded-lg text-stone-400 hover:text-rose-400 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
					title="Sign Out"
					aria-label="Sign Out"
				>
					<LogOut class="w-3.5 h-3.5" />
				</a>
			</div>
		</div>
	</div>
</header>

<!-- Mobile Bottom Navigation Bar (Tactile Hardware Pocket Operator Style) -->
<nav
	aria-label="Mobile Navigation"
	class="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#2a2a24] bg-[#121210]/98 backdrop-blur-xl px-1.5 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-10px_25px_rgba(0,0,0,0.8)]"
>
	<div class="grid grid-cols-7 items-center gap-1">
		{#each tabs as tab}
			{@const TabIcon = tab.icon}
			<button
				onclick={() => handleTabSelect(tab.id)}
				class="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all min-h-[44px] cursor-pointer {appState.activeTab === tab.id
					? 'bg-[#1e1e1a] border border-[#383830] text-[#f5f2ea] shadow-inner font-semibold'
					: 'text-stone-500 hover:text-stone-300'}"
			>
				<TabIcon
					class="w-4 h-4 transition-transform {appState.activeTab === tab.id
						? 'scale-110 text-[#f97316]'
						: 'text-stone-500'}"
				/>
				<span class="text-[9px] mt-0.5 font-mono tracking-tight truncate max-w-full">
					{tab.label}
				</span>
				{#if appState.activeTab === tab.id}
					<span class="w-1 h-1 rounded-full bg-[#f97316] shadow-[0_0_4px_#f97316] mt-0.5"></span>
				{:else}
					<span class="w-1 h-1 rounded-full bg-transparent mt-0.5"></span>
				{/if}
			</button>
		{/each}
	</div>
</nav>
