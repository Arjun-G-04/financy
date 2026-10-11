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
	<title>Financy • Treasury & Ledger</title>
	<meta name="description" content="Personal Finance Ledger with Turso SQLite & Google Sheets Sync" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="theme-color" content="#111110" />
</svelte:head>

<div class="min-h-screen bg-[#111110] text-[#eeebe3] flex flex-col font-sans selection:bg-[#c9b48b]/30 selection:text-[#f8f5ee]">
	<Navbar />

	<main class="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-8 pb-24 md:pb-8">
		{#if appState.activeTab === 'home'}
			<HomeTab />
		{:else if appState.activeTab === 'history'}
			<HistoryTab />
		{:else if appState.activeTab === 'analytics'}
			<AnalyticsTab />
		{:else if appState.activeTab === 'reconcile'}
			<ReconcileTab />
		{:else if appState.activeTab === 'import'}
			<ImportTab />
		{:else if appState.activeTab === 'settings'}
			<SettingsTab />
		{/if}
	</main>

	<!-- Global Overlays -->
	<TransactionModal />
	<Toast />
</div>
