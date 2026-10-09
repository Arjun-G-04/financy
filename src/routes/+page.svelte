<script lang="ts">
	import type { PageData } from './$types';
	import { appState } from '#lib/state.svelte';
	import Navbar from '#lib/components/Navbar.svelte';
	import HomeTab from '#lib/components/HomeTab.svelte';
	import HistoryTab from '#lib/components/HistoryTab.svelte';
	import AnalyticsTab from '#lib/components/AnalyticsTab.svelte';
	import ReconcileTab from '#lib/components/ReconcileTab.svelte';
	import ImportTab from '#lib/components/ImportTab.svelte';
	import SettingsTab from '#lib/components/SettingsTab.svelte';
	import TransactionModal from '#lib/components/TransactionModal.svelte';
	import Toast from '#lib/components/Toast.svelte';

	let { data }: { data: PageData } = $props();

	// Initialize app state from SSR loader
	$effect.pre(() => {
		if (data) {
			appState.init(data);
		}
	});
</script>

<svelte:head>
	<title>Financy • Personal Finance & Ledger</title>
	<meta name="description" content="Personal Finance Ledger with Turso SQLite & Google Sheets Sync" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="theme-color" content="#09090b" />
</svelte:head>

<div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
	<Navbar />

	<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
		{#if appState.activeTab === 'home'}
			<HomeTab />
		{:else}
			{#if appState.activeTab === 'history'}
				<HistoryTab />
			{:else}
				{#if appState.activeTab === 'analytics'}
					<AnalyticsTab />
				{:else}
					{#if appState.activeTab === 'reconcile'}
						<ReconcileTab />
					{:else}
						{#if appState.activeTab === 'import'}
							<ImportTab />
						{:else}
							{#if appState.activeTab === 'settings'}
								<SettingsTab />
							{/if}
						{/if}
					{/if}
				{/if}
			{/if}
		{/if}
	</main>

	<!-- Footer -->
	<footer class="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
		<p>Financy • Turso SQLite Backend • SvelteKit & Svelte 5</p>
	</footer>

	<!-- Global Overlays -->
	<TransactionModal />
	<Toast />
</div>
