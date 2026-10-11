<script lang="ts">
	import { appState, type TabType } from '#lib/state.svelte';
	import {
		LayoutDashboard,
		History,
		PieChart,
		Scale,
		FileSpreadsheet,
		Settings,
		Plus,
		LogOut
	} from '@lucide/svelte';

	const tabs: { id: TabType; label: string; icon: any }[] = [
		{ id: 'home', label: 'Overview', icon: LayoutDashboard },
		{ id: 'history', label: 'Ledger', icon: History },
		{ id: 'analytics', label: 'Analytics', icon: PieChart },
		{ id: 'reconcile', label: 'Reconcile', icon: Scale },
		{ id: 'import', label: 'Import', icon: FileSpreadsheet },
		{ id: 'settings', label: 'Settings', icon: Settings }
	];

	function formatCurrency(val: number) {
		const sym = appState.settings.currencySymbol || '₹';
		return `${sym}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
</script>

<header class="sticky top-0 z-40 w-full border-b border-stone-800/80 bg-[#111110]/90 backdrop-blur-md">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="flex items-center justify-between h-16">
			<!-- Minimalist Brand -->
			<div class="flex items-center gap-3">
				<a href="/" class="flex items-baseline gap-2 group">
					<span class="text-base font-serif tracking-tight text-[#f5f2ea] group-hover:text-white transition-colors">
						Financy
					</span>
					<span class="text-[11px] text-stone-500 font-mono tracking-wider uppercase">
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

			<!-- Right: Net Position & New Action -->
			<div class="flex items-center gap-3">
				<div class="hidden sm:flex flex-col text-right">
					<span class="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Net Position</span>
					<span class="text-xs font-mono tabular-nums font-semibold {appState.netBalance >= 0 ? 'text-[#82b896]' : 'text-[#e06c75]'}">
						{formatCurrency(appState.netBalance)}
					</span>
				</div>

				<button
					onclick={() => {
						appState.editingTransaction = null;
						appState.isTransactionModalOpen = true;
					}}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eeebe3] hover:bg-white text-[#111110] font-medium text-xs transition-colors shadow-sm"
				>
					<Plus class="w-3.5 h-3.5 stroke-[2.2]" />
					<span>New</span>
				</button>

				<a
					href="/auth/logout"
					class="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-[#1c1b18] transition-colors"
					title="Sign Out"
					aria-label="Sign Out"
				>
					<LogOut class="w-3.5 h-3.5" />
				</a>
			</div>
		</div>
	</div>

	<!-- Mobile Nav Bar -->
	<div class="md:hidden border-t border-stone-800/80 bg-[#141412] px-2 py-1 flex items-center justify-between overflow-x-auto gap-1">
		{#each tabs as tab}
			<button
				onclick={() => (appState.activeTab = tab.id)}
				class="flex-1 py-1.5 px-2 rounded-md text-[11px] font-medium text-center transition-colors {appState.activeTab === tab.id
					? 'bg-[#1f1e1b] text-[#f5f2ea]'
					: 'text-stone-400 hover:text-stone-200'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>
</header>
