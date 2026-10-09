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
		Database
	} from '@lucide/svelte';

	const tabs: { id: TabType; label: string; icon: any }[] = [
		{ id: 'home', label: 'Home', icon: LayoutDashboard },
		{ id: 'history', label: 'History', icon: History },
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

<header class="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo & Status -->
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-lg">
						₹
					</div>
					<span class="text-lg font-bold tracking-tight text-zinc-100">financy</span>
				</div>
				<div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
					<span>Turso SQLite</span>
				</div>
			</div>

			<!-- Desktop Nav Tabs -->
			<nav class="hidden md:flex items-center gap-1">
				{#each tabs as tab}
					{@const Icon = tab.icon}
					<button
						onclick={() => (appState.activeTab = tab.id)}
						class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all {appState.activeTab === tab.id
							? 'bg-zinc-800 text-zinc-100 shadow-sm'
							: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'}"
					>
						<Icon class="w-4 h-4" />
						{tab.label}
					</button>
				{/each}
			</nav>

			<!-- Net Balance Badge & Add Button -->
			<div class="flex items-center gap-2.5">
				<div class="hidden sm:flex flex-col text-right">
					<span class="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Net Ledger</span>
					<span class="text-sm font-semibold {appState.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
						{formatCurrency(appState.netBalance)}
					</span>
				</div>

				<button
					onclick={() => {
						appState.editingTransaction = null;
						appState.isTransactionModalOpen = true;
					}}
					class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors shadow-sm"
				>
					<Plus class="w-4 h-4 stroke-[2.5]" />
					<span class="hidden xs:inline">Add</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile Sub-nav (Scrollable on small screens) -->
	<div class="md:hidden border-t border-zinc-900 bg-zinc-950/90 px-2 py-1.5 flex items-center justify-between overflow-x-auto gap-1">
		{#each tabs as tab}
			{@const Icon = tab.icon}
			<button
				onclick={() => (appState.activeTab = tab.id)}
				class="flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors {appState.activeTab === tab.id
					? 'text-emerald-400 bg-zinc-900'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				<Icon class="w-4 h-4 mb-0.5" />
				<span class="text-[11px]">{tab.label}</span>
			</button>
		{/each}
	</div>
</header>
