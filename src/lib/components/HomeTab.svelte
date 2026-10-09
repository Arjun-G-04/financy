<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import type { LocalTransaction } from '#lib/server/db';
	import {
		TrendingUp,
		TrendingDown,
		Wallet,
		Percent,
		ArrowRight,
		Tag,
		Calendar,
		Plus,
		Trash2,
		Pencil
	} from '@lucide/svelte';

	let timeFilter = $state<'all' | 'this_month' | 'last_month'>('all');

	const now = new Date();
	const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

	const filteredTransactions = $derived.by(() => {
		if (timeFilter === 'this_month') {
			return appState.transactions.filter((t) => t.date.startsWith(thisMonthStr));
		}
		if (timeFilter === 'last_month') {
			return appState.transactions.filter((t) => t.date.startsWith(lastMonthStr));
		}
		return appState.transactions;
	});

	const stats = $derived.by(() => {
		let income = 0;
		let expense = 0;
		for (const tx of filteredTransactions) {
			if (tx.type === 'credit') income += tx.amount;
			else expense += tx.amount;
		}
		const net = income - expense;
		const savingsRate = income > 0 ? ((net / income) * 100).toFixed(1) : '0';
		return { income, expense, net, savingsRate };
	});

	const recentTransactions = $derived(appState.transactions.slice(0, 10));

	function formatCurrency(val: number) {
		const sym = appState.settings.currencySymbol || '₹';
		return `${sym}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	async function handleDelete(tx: LocalTransaction) {
		if (!confirm(`Delete "${tx.name}" (${formatCurrency(tx.amount)})?`)) return;
		try {
			await appState.deleteTransaction(tx.id);
			appState.showToast('info', 'Transaction Deleted', tx.name);
		} catch (err: any) {
			appState.showToast('error', 'Delete Failed', err.message);
		}
	}
</script>

<div class="space-y-6">
	<!-- Filter Row -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-100">Financial Overview</h1>
			<p class="text-sm text-zinc-400">Track and manage your income, expenses, and ledger.</p>
		</div>

		<div class="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
			<button
				onclick={() => (timeFilter = 'all')}
				class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {timeFilter === 'all'
					? 'bg-zinc-800 text-zinc-100 shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				All Time
			</button>
			<button
				onclick={() => (timeFilter = 'this_month')}
				class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {timeFilter === 'this_month'
					? 'bg-zinc-800 text-zinc-100 shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				This Month
			</button>
			<button
				onclick={() => (timeFilter = 'last_month')}
				class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {timeFilter === 'last_month'
					? 'bg-zinc-800 text-zinc-100 shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				Last Month
			</button>
		</div>
	</div>

	<!-- Top Metrics Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Net Balance Card -->
		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-sm">
			<div class="flex items-center justify-between text-zinc-400 mb-3">
				<span class="text-xs font-semibold uppercase tracking-wider">Net Balance</span>
				<div class="p-2 rounded-lg bg-zinc-800/60 text-zinc-300">
					<Wallet class="w-4 h-4" />
				</div>
			</div>
			<div class="text-2xl font-bold {stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
				{formatCurrency(stats.net)}
			</div>
			<div class="text-xs text-zinc-500 mt-1">
				{filteredTransactions.length} total entries
			</div>
		</div>

		<!-- Income Card -->
		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-sm">
			<div class="flex items-center justify-between text-zinc-400 mb-3">
				<span class="text-xs font-semibold uppercase tracking-wider">Total Income</span>
				<div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
					<TrendingUp class="w-4 h-4" />
				</div>
			</div>
			<div class="text-2xl font-bold text-zinc-100">
				{formatCurrency(stats.income)}
			</div>
			<div class="text-xs text-emerald-500/80 mt-1">Credits into ledger</div>
		</div>

		<!-- Expense Card -->
		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-sm">
			<div class="flex items-center justify-between text-zinc-400 mb-3">
				<span class="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
				<div class="p-2 rounded-lg bg-rose-500/10 text-rose-400">
					<TrendingDown class="w-4 h-4" />
				</div>
			</div>
			<div class="text-2xl font-bold text-zinc-100">
				{formatCurrency(stats.expense)}
			</div>
			<div class="text-xs text-rose-500/80 mt-1">Debits spent</div>
		</div>

		<!-- Savings Rate Card -->
		<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-sm">
			<div class="flex items-center justify-between text-zinc-400 mb-3">
				<span class="text-xs font-semibold uppercase tracking-wider">Savings Rate</span>
				<div class="p-2 rounded-lg bg-zinc-800/60 text-zinc-300">
					<Percent class="w-4 h-4" />
				</div>
			</div>
			<div class="text-2xl font-bold text-zinc-100">
				{stats.savingsRate}%
			</div>
			<div class="text-xs text-zinc-500 mt-1">Income retained</div>
		</div>
	</div>

	<!-- Recent Transactions Card List -->
	<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-bold text-zinc-100">Recent Transactions</h2>
				<p class="text-xs text-zinc-400">Latest activity recorded in ledger</p>
			</div>
			<button
				onclick={() => (appState.activeTab = 'history')}
				class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
			>
				<span>View all {appState.transactions.length}</span>
				<ArrowRight class="w-3.5 h-3.5" />
			</button>
		</div>

		{#if recentTransactions.length === 0}
			<div class="py-12 text-center text-zinc-500">
				<p>No transactions found in database.</p>
				<button
					onclick={() => {
						appState.editingTransaction = null;
						appState.isTransactionModalOpen = true;
					}}
					class="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-colors"
				>
					<Plus class="w-3.5 h-3.5" />
					Add your first transaction
				</button>
			</div>
		{:else}
			<div class="divide-y divide-zinc-800/60">
				{#each recentTransactions as tx (tx.id)}
					<div class="py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-800/30 px-2 rounded-xl transition-colors group">
						<!-- Merchant & Meta -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold text-zinc-100 truncate">{tx.name}</span>
								{#if tx.category}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">
										<Tag class="w-2.5 h-2.5" />
										{tx.category}
									</span>
								{/if}
							</div>
							<div class="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
								<span class="flex items-center gap-1">
									<Calendar class="w-3 h-3" />
									{tx.date}
								</span>
							</div>
						</div>

						<!-- Amount & Actions -->
						<div class="flex items-center gap-3">
							<span class="text-sm font-bold {tx.type === 'credit' ? 'text-emerald-400' : 'text-zinc-200'}">
								{tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
							</span>

							<!-- Action Buttons -->
							<div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
								<button
									onclick={() => {
										appState.editingTransaction = tx;
										appState.isTransactionModalOpen = true;
									}}
									class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
									title="Edit"
									aria-label="Edit"
								>
									<Pencil class="w-3.5 h-3.5" />
								</button>
								<button
									onclick={() => handleDelete(tx)}
									class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
									title="Delete"
									aria-label="Delete"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
