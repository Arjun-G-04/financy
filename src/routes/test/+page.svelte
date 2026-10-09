<script lang="ts">
	import {
		Terminal,
		Sliders,
		Sparkles,
		ArrowUpRight,
		ArrowDownRight,
		Search,
		Plus,
		Check,
		Filter,
		Calendar,
		Tag,
		Wallet,
		Scale,
		CreditCard,
		Building2,
		Banknote,
		HandCoins,
		ChevronRight,
		Command
	} from '@lucide/svelte';

	type DesignOption = 'terminal' | 'linear' | 'editorial';
	let selectedOption = $state<DesignOption>('terminal');

	// Realistic dummy data
	const dummyData = {
		netBalance: 257725.99,
		income: 142800.0,
		expense: 48250.0,
		savingsRate: 66.2,
		reconciliation: {
			hdfc: 187997,
			kvb: 2020,
			cash: 240,
			creditsOwed: 81727,
			ccDebt: 0,
			lastUpdated: '02 Oct 2026, 14:00'
		},
		categories: [
			{ name: 'Income', amount: 142800, percentage: 65, color: '#10b981' },
			{ name: 'Rent & Related', amount: 22000, percentage: 45.6, color: '#f59e0b' },
			{ name: 'Food & Dining', amount: 12450, percentage: 25.8, color: '#3b82f6' },
			{ name: 'Shopping', amount: 6800, percentage: 14.1, color: '#ec4899' },
			{ name: 'Transport', amount: 4200, percentage: 8.7, color: '#8b5cf6' },
			{ name: 'Utilities', amount: 2800, percentage: 5.8, color: '#06b6d4' }
		],
		transactions: [
			{ id: '1', date: '2026-10-06', name: 'Client Retainer Payment', category: 'Income', type: 'credit', amount: 75000 },
			{ id: '2', date: '2026-10-05', name: 'Swiggy Gourmet Dinner', category: 'Food & Dining', type: 'debit', amount: 1420 },
			{ id: '3', date: '2026-10-04', name: 'Apple Cloud & Developer', category: 'Utilities', type: 'debit', amount: 899 },
			{ id: '4', date: '2026-10-03', name: 'Monthly Apartment Rent', category: 'Rent & Related', type: 'debit', amount: 22000 },
			{ id: '5', date: '2026-10-02', name: 'Uber Premier Airport', category: 'Transport', type: 'debit', amount: 1650 },
			{ id: '6', date: '2026-10-01', name: 'Freelance Design Milestone', category: 'Income', type: 'credit', amount: 67800 },
			{ id: '7', date: '2026-09-30', name: 'Uniqlo Autumn Wardrobe', category: 'Shopping', type: 'debit', amount: 5490 }
		]
	};

	function fmt(val: number) {
		return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
</script>

<svelte:head>
	<title>Design Comparison • Financy</title>
</svelte:head>

<!-- Top Design Mode Switcher -->
<div class="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-zinc-800 px-4 py-3">
	<div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Design Lab:</span>
			<span class="text-xs text-zinc-500">Pick an aesthetic to preview</span>
		</div>

		<!-- Switcher Tabs -->
		<div class="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl gap-1">
			<button
				onclick={() => (selectedOption = 'terminal')}
				class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all {selectedOption === 'terminal'
					? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				<Terminal class="w-3.5 h-3.5" />
				<span>1. Terminal / Bloomberg</span>
			</button>

			<button
				onclick={() => (selectedOption = 'linear')}
				class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all {selectedOption === 'linear'
					? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				<Sliders class="w-3.5 h-3.5" />
				<span>2. Linear / Raycast</span>
			</button>

			<button
				onclick={() => (selectedOption = 'editorial')}
				class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all {selectedOption === 'editorial'
					? 'bg-stone-800 text-stone-100 border border-stone-600 shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				<Sparkles class="w-3.5 h-3.5" />
				<span>3. Swiss / Editorial</span>
			</button>
		</div>

		<a
			href="/"
			class="hidden md:inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
		>
			<span>Back to current app</span>
			<ChevronRight class="w-3.5 h-3.5" />
		</a>
	</div>
</div>

<!-- ========================================================================= -->
<!-- OPTION 1: TERMINAL / BLOOMBERG                                            -->
<!-- ========================================================================= -->
{#if selectedOption === 'terminal'}
	<div class="min-h-screen bg-[#07090b] text-[#d1d5db] font-mono text-xs selection:bg-amber-500/30 selection:text-amber-200 p-4 sm:p-6 lg:p-8 space-y-6">
		<!-- Terminal Header -->
		<div class="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<span class="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold tracking-widest uppercase">
					TERM // FINANCY-v2
				</span>
				<span class="text-zinc-600">|</span>
				<span class="text-zinc-400 text-[11px]">SYS: TURSO-libSQL [LOCAL:SYNCED]</span>
			</div>
			<div class="flex items-center gap-4 text-zinc-400 text-[11px]">
				<span>FEED: 2026-10-09</span>
				<span class="text-emerald-400 font-bold">● ONLINE</span>
			</div>
		</div>

		<!-- Ticker / Net Grid -->
		<div class="grid grid-cols-2 lg:grid-cols-4 border border-zinc-800 divide-x divide-y lg:divide-y-0 divide-zinc-800 bg-[#0c0e12]">
			<div class="p-4 space-y-1">
				<div class="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">NET_LEDGER_VAL</div>
				<div class="text-xl font-bold text-emerald-400 tracking-tight font-mono">{fmt(dummyData.netBalance)}</div>
				<div class="text-[10px] text-zinc-500">437 VERIFIED ENTRIES</div>
			</div>
			<div class="p-4 space-y-1">
				<div class="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">INFLOW_PERIOD</div>
				<div class="text-xl font-bold text-zinc-200 tracking-tight font-mono">+{fmt(dummyData.income)}</div>
				<div class="text-[10px] text-emerald-500/90">CREDIT FLOW</div>
			</div>
			<div class="p-4 space-y-1">
				<div class="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">OUTFLOW_PERIOD</div>
				<div class="text-xl font-bold text-zinc-200 tracking-tight font-mono">-{fmt(dummyData.expense)}</div>
				<div class="text-[10px] text-rose-400/90">DEBIT FLOW</div>
			</div>
			<div class="p-4 space-y-1">
				<div class="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">RETENTION_RATE</div>
				<div class="text-xl font-bold text-amber-400 tracking-tight font-mono">{dummyData.savingsRate}%</div>
				<div class="text-[10px] text-zinc-500">RATIO: [IN/OUT]</div>
			</div>
		</div>

		<!-- Main Two-Column Terminal Panel -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Ledger Stream (Left 2 cols) -->
			<div class="lg:col-span-2 border border-zinc-800 bg-[#0c0e12]">
				<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
					<div class="flex items-center gap-2">
						<span class="text-amber-400 font-bold">#</span>
						<span class="font-bold uppercase tracking-wider text-zinc-200">LEDGER_STREAM</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="text-zinc-500">[N] NEW</span>
						<span class="text-zinc-500">[/] FILTER</span>
					</div>
				</div>

				<div class="divide-y divide-zinc-800/80 font-mono">
					{#each dummyData.transactions as tx}
						<div class="px-4 py-2.5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
							<div class="flex items-center gap-3">
								<span class="text-zinc-500 text-[11px]">{tx.date}</span>
								<span class="px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 uppercase">
									{tx.category}
								</span>
								<span class="text-zinc-200 font-medium">{tx.name}</span>
							</div>
							<div class="text-right font-bold {tx.type === 'credit' ? 'text-emerald-400' : 'text-zinc-300'}">
								{tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Reconciliation & Holdings (Right 1 col) -->
			<div class="border border-zinc-800 bg-[#0c0e12] space-y-4">
				<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
					<span class="font-bold uppercase tracking-wider text-zinc-200">HOLDINGS_RECON</span>
					<span class="text-zinc-500 text-[10px]">Δ = ₹0.00</span>
				</div>

				<div class="p-4 space-y-3 font-mono">
					<div class="flex justify-between items-center py-1 border-b border-zinc-800/50">
						<span class="text-zinc-400">BANK_HDFC:</span>
						<span class="font-bold text-zinc-100">{fmt(dummyData.reconciliation.hdfc)}</span>
					</div>
					<div class="flex justify-between items-center py-1 border-b border-zinc-800/50">
						<span class="text-zinc-400">BANK_KVB:</span>
						<span class="font-bold text-zinc-100">{fmt(dummyData.reconciliation.kvb)}</span>
					</div>
					<div class="flex justify-between items-center py-1 border-b border-zinc-800/50">
						<span class="text-zinc-400">CASH_ON_HAND:</span>
						<span class="font-bold text-zinc-100">{fmt(dummyData.reconciliation.cash)}</span>
					</div>
					<div class="flex justify-between items-center py-1 border-b border-zinc-800/50">
						<span class="text-zinc-400">CREDITS_RECEIVABLE:</span>
						<span class="font-bold text-emerald-400">{fmt(dummyData.reconciliation.creditsOwed)}</span>
					</div>
					<div class="flex justify-between items-center py-1 border-b border-zinc-800/50">
						<span class="text-zinc-400">CC_UNPAID_DEBT:</span>
						<span class="font-bold text-zinc-400">{fmt(dummyData.reconciliation.ccDebt)}</span>
					</div>

					<div class="pt-3 border-t border-zinc-700/80 flex justify-between items-center text-[11px]">
						<span class="text-amber-400 font-bold uppercase">THEORETICAL_TOTAL:</span>
						<span class="text-amber-300 font-bold">{fmt(dummyData.netBalance)}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- OPTION 2: LINEAR / RAYCAST PRECISION                                      -->
<!-- ========================================================================= -->
{#if selectedOption === 'linear'}
	<div class="min-h-screen bg-[#08080a] text-zinc-200 font-sans selection:bg-zinc-800 selection:text-white p-4 sm:p-8 space-y-8">
		<!-- Minimalist Brand & Action Bar -->
		<div class="max-w-6xl mx-auto flex items-center justify-between border-b border-white/[0.06] pb-5">
			<div class="flex items-center gap-3">
				<div class="w-7 h-7 rounded-md bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-semibold text-zinc-200">
					F
				</div>
				<span class="text-sm font-semibold tracking-tight text-white">Financy</span>
				<span class="text-xs text-zinc-500">/</span>
				<span class="text-xs text-zinc-400">Ledger</span>
			</div>

			<div class="flex items-center gap-2">
				<div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400">
					<Search class="w-3.5 h-3.5 text-zinc-500" />
					<span>Search transactions...</span>
					<kbd class="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-zinc-400 font-mono">⌘K</kbd>
				</div>
				<button class="px-3 py-1.5 rounded-md bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-colors flex items-center gap-1.5">
					<Plus class="w-3.5 h-3.5 stroke-[2.5]" />
					<span>New</span>
				</button>
			</div>
		</div>

		<!-- Asymmetric Hero Section -->
		<div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
			<!-- Big Statement Left -->
			<div class="md:col-span-7 space-y-2">
				<div class="text-xs font-medium text-zinc-500 uppercase tracking-wider">Net Position</div>
				<div class="text-5xl font-semibold tracking-tight text-white font-mono">
					{fmt(dummyData.netBalance)}
				</div>
				<div class="text-xs text-zinc-400 flex items-center gap-2 pt-1">
					<span class="inline-flex items-center text-emerald-400 font-medium">
						<ArrowUpRight class="w-3.5 h-3.5 mr-0.5" />
						+66.2% savings rate
					</span>
					<span class="text-zinc-600">•</span>
					<span>Last synced 2 hours ago</span>
				</div>
			</div>

			<!-- Compact Metrics Right -->
			<div class="md:col-span-5 grid grid-cols-2 gap-3">
				<div class="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
					<div class="text-[11px] text-zinc-500 font-medium">Total Inflow</div>
					<div class="text-lg font-medium text-zinc-100 font-mono mt-1">+{fmt(dummyData.income)}</div>
				</div>
				<div class="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
					<div class="text-[11px] text-zinc-500 font-medium">Total Outflow</div>
					<div class="text-lg font-medium text-zinc-100 font-mono mt-1">-{fmt(dummyData.expense)}</div>
				</div>
			</div>
		</div>

		<!-- Clean Ledger Table with Hairlines -->
		<div class="max-w-6xl mx-auto rounded-lg border border-white/[0.06] bg-white/[0.01] overflow-hidden">
			<div class="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
				<span>Activity</span>
				<span>{dummyData.transactions.length} recent events</span>
			</div>

			<div class="divide-y divide-white/[0.04]">
				{#each dummyData.transactions as tx}
					<div class="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
						<div class="flex items-center gap-3">
							<span class="text-xs text-zinc-500 font-mono w-24">{tx.date}</span>
							<span class="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{tx.name}</span>
							<span class="text-xs text-zinc-500 px-2 py-0.5 rounded border border-white/[0.06] bg-white/[0.02]">
								{tx.category}
							</span>
						</div>
						<div class="font-mono text-sm font-medium {tx.type === 'credit' ? 'text-emerald-400' : 'text-zinc-300'}">
							{tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- OPTION 3: SWISS / EDITORIAL LUXURY                                        -->
<!-- ========================================================================= -->
{#if selectedOption === 'editorial'}
	<div class="min-h-screen bg-[#111110] text-[#eeebe3] font-sans selection:bg-[#c9b48b]/30 selection:text-[#f8f5ee] p-4 sm:p-8 lg:p-12 space-y-10">
		<!-- Editorial Masthead -->
		<div class="max-w-6xl mx-auto border-b border-stone-800 pb-6 flex items-baseline justify-between">
			<div>
				<div class="text-xs uppercase tracking-widest text-stone-500 font-semibold">Private Ledger & Treasury</div>
				<h1 class="text-3xl font-serif tracking-tight text-[#f5f2ea] mt-1">Financy Portfolio</h1>
			</div>
			<div class="text-right text-xs text-stone-400">
				<div>Oct 2026 Edition</div>
				<div class="text-stone-500 font-mono">Turso libSQL Encrypted</div>
			</div>
		</div>

		<!-- Split Pane: Treasury Sheet (Left) & Ledger Records (Right) -->
		<div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
			<!-- Left: Capital Summary & Asset Reconciliation -->
			<div class="lg:col-span-5 space-y-6">
				<!-- Big Balance Plate -->
				<div class="p-6 rounded-2xl bg-[#181816] border border-stone-800/80 shadow-lg space-y-4">
					<div class="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Net Worth</div>
					<div class="text-4xl font-serif text-[#f4efe4] tracking-tight">
						{fmt(dummyData.netBalance)}
					</div>
					<div class="h-px bg-stone-800"></div>

					<div class="grid grid-cols-2 gap-4 pt-1">
						<div>
							<div class="text-[11px] text-stone-500 uppercase tracking-wider">Month Inflow</div>
							<div class="text-base font-semibold text-[#82b896] mt-0.5">+{fmt(dummyData.income)}</div>
						</div>
						<div>
							<div class="text-[11px] text-stone-500 uppercase tracking-wider">Month Outflow</div>
							<div class="text-base font-semibold text-stone-300 mt-0.5">-{fmt(dummyData.expense)}</div>
						</div>
					</div>
				</div>

				<!-- Asset Holdings Card -->
				<div class="p-6 rounded-2xl bg-[#181816] border border-stone-800/80 space-y-4">
					<div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400">
						<span>Account Balances</span>
						<span class="text-stone-500">Reconciliation</span>
					</div>

					<div class="space-y-3 text-sm">
						<div class="flex justify-between items-center text-stone-300">
							<span>HDFC Bank</span>
							<span class="font-mono text-stone-100">{fmt(dummyData.reconciliation.hdfc)}</span>
						</div>
						<div class="flex justify-between items-center text-stone-300">
							<span>KVB Bank</span>
							<span class="font-mono text-stone-100">{fmt(dummyData.reconciliation.kvb)}</span>
						</div>
						<div class="flex justify-between items-center text-stone-300">
							<span>Cash in Hand</span>
							<span class="font-mono text-stone-100">{fmt(dummyData.reconciliation.cash)}</span>
						</div>
						<div class="flex justify-between items-center text-stone-300">
							<span>Credit Owed (Receivable)</span>
							<span class="font-mono text-[#82b896]">{fmt(dummyData.reconciliation.creditsOwed)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Right: Clean Ledger Journal -->
			<div class="lg:col-span-7 space-y-4">
				<div class="flex items-center justify-between pb-2 border-b border-stone-800">
					<span class="text-xs uppercase tracking-wider font-semibold text-stone-400">Chronological Journal</span>
					<span class="text-xs text-stone-500">7 transactions shown</span>
				</div>

				<div class="divide-y divide-stone-800/60">
					{#each dummyData.transactions as tx}
						<div class="py-4 flex items-center justify-between hover:bg-[#181816]/50 px-3 rounded-xl transition-colors">
							<div>
								<div class="text-sm font-medium text-[#f5f2ea]">{tx.name}</div>
								<div class="flex items-center gap-2 mt-1 text-xs text-stone-400">
									<span class="font-mono">{tx.date}</span>
									<span>•</span>
									<span class="text-stone-400">{tx.category}</span>
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm font-semibold {tx.type === 'credit' ? 'text-[#82b896]' : 'text-stone-200'}">
									{tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
