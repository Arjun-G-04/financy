<script lang="ts">
	import { appState, type TabType } from '#lib/state.svelte';
	import {
		LayoutDashboard,
		History,
		PieChart,
		Scale,
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
		{ id: 'import', label: 'Import', icon: FileSpreadsheet },
		{ id: 'settings', label: 'Settings', icon: Settings }
	];

	function formatNetPosition(val: number) {
		return formatCurrency(val, appState.settings.currencySymbol);
	}
</script>

<header class="sticky top-0 z-40 w-full border-b border-stone-800/80 bg-[#111110]/95 backdrop-blur-md">
	<div class="w-full px-3.5 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-14 sm:h-16">
			<!-- Minimalist Brand -->
			<div class="flex items-center gap-2 sm:gap-3">
				<a href="/" class="flex items-baseline gap-1.5 sm:gap-2 group py-1">
					<span class="text-base sm:text-lg font-serif tracking-tight text-[#f5f2ea] group-hover:text-white transition-colors">
						Financy
					</span>
					<span class="hidden xs:inline text-[10px] sm:text-[11px] text-stone-500 font-mono tracking-wider uppercase">
						// Treasury
					</span>
				</a>
			</div>

			<!-- Desktop Nav -->
			<nav class="hidden md:flex items-center gap-1">
				{#each tabs as tab}
					<button
						onclick={() => (appState.activeTab = tab.id)}
						class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all {appState.activeTab === tab.id
							? 'bg-[#1c1c19] text-[#f5f2ea] border border-stone-700/80 shadow-sm'
							: 'text-stone-400 hover:text-stone-200 hover:bg-[#171715]'}"
					>
						{tab.label}
					</button>
				{/each}
			</nav>

			<!-- Right: Net Position & Actions -->
			<div class="flex items-center gap-2 sm:gap-3">
				<!-- Net Position (Always visible, compact on mobile) -->
				<div class="flex flex-col text-right">
					<span class="hidden sm:inline text-[10px] uppercase tracking-wider text-stone-500 font-medium">Net Position</span>
					<span class="text-[11px] sm:text-xs font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md bg-[#171715] sm:bg-transparent border border-stone-800/80 sm:border-0 {appState.netBalance >= 0 ? 'text-[#82b896]' : 'text-[#e06c75]'}">
						{formatNetPosition(appState.netBalance)}
					</span>
				</div>

				<a
					href="/auth/logout"
					class="p-2 sm:p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-[#1c1b18] transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
					title="Sign Out"
					aria-label="Sign Out"
				>
					<LogOut class="w-3.5 h-3.5" />
				</a>
			</div>
		</div>
	</div>
</header>

<!-- Mobile Bottom Navigation Bar (Thumb Friendly & App-like) -->
<nav
	aria-label="Mobile Navigation"
	class="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-800/90 bg-[#121210]/95 backdrop-blur-lg px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl"
>
	<div class="grid grid-cols-6 items-center">
		{#each tabs as tab}
			{@const TabIcon = tab.icon}
			<button
				onclick={() => (appState.activeTab = tab.id)}
				class="flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all min-h-[44px] {appState.activeTab === tab.id
					? 'text-[#f5f2ea] font-semibold'
					: 'text-stone-500 hover:text-stone-300'}"
			>
				<TabIcon
					class="w-4 h-4 transition-transform {appState.activeTab === tab.id
						? 'scale-110 text-[#c9b48b]'
						: 'text-stone-500'}"
				/>
				<span class="text-[9px] mt-0.5 tracking-tight truncate max-w-full">
					{tab.label}
				</span>
				{#if appState.activeTab === tab.id}
					<span class="w-1 h-1 rounded-full bg-[#c9b48b] mt-0.5"></span>
				{:else}
					<span class="w-1 h-1 rounded-full bg-transparent mt-0.5"></span>
				{/if}
			</button>
		{/each}
	</div>
</nav>
