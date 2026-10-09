<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { X, ArrowDownRight, ArrowUpRight } from '@lucide/svelte';

	let date = $state(new Date().toISOString().split('T')[0]);
	let type = $state<'credit' | 'debit'>('debit');
	let amount = $state<string>('');
	let name = $state('');
	let category = $state<string>('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (appState.editingTransaction) {
			const tx = appState.editingTransaction;
			date = tx.date;
			type = tx.type;
			amount = String(tx.amount);
			name = tx.name;
			category = tx.category || '';
		} else {
			date = new Date().toISOString().split('T')[0];
			type = 'debit';
			amount = '';
			name = '';
			category = appState.categories[0]?.name || '';
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const numAmount = parseFloat(amount);
		if (!name.trim()) {
			appState.showToast('error', 'Validation Error', 'Transaction description cannot be empty');
			return;
		}
		if (isNaN(numAmount) || numAmount <= 0) {
			appState.showToast('error', 'Validation Error', 'Please enter a valid amount greater than 0');
			return;
		}

		isSubmitting = true;
		try {
			await appState.saveTransaction({
				id: appState.editingTransaction?.id,
				date,
				type,
				amount: numAmount,
				name: name.trim(),
				category: category || null
			});

			appState.showToast(
				'success',
				appState.editingTransaction ? 'Transaction Updated' : 'Transaction Added',
				`${type === 'credit' ? '+' : '-'}${appState.settings.currencySymbol || '₹'}${numAmount.toFixed(2)}: ${name.trim()}`
			);
			appState.isTransactionModalOpen = false;
			appState.editingTransaction = null;
		} catch (err: any) {
			appState.showToast('error', 'Save Failed', err.message);
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if appState.isTransactionModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
		<div class="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6">
			<!-- Header -->
			<div class="flex items-center justify-between pb-4 border-b border-zinc-800">
				<h3 class="text-lg font-bold text-zinc-100">
					{appState.editingTransaction ? 'Edit Transaction' : 'New Transaction'}
				</h3>
				<button
					onclick={() => {
						appState.isTransactionModalOpen = false;
						appState.editingTransaction = null;
					}}
					class="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg transition-colors"
					aria-label="Close modal"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="mt-4 space-y-4">
				<!-- Type Switcher -->
				<div>
					<span class="block text-xs font-medium text-zinc-400 mb-1.5">Transaction Type</span>
					<div class="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
						<button
							type="button"
							onclick={() => (type = 'debit')}
							class="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all {type === 'debit'
								? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
								: 'text-zinc-400 hover:text-zinc-200'}"
						>
							<ArrowDownRight class="w-4 h-4" />
							Debit (Expense)
						</button>
						<button
							type="button"
							onclick={() => (type = 'credit')}
							class="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all {type === 'credit'
								? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
								: 'text-zinc-400 hover:text-zinc-200'}"
						>
							<ArrowUpRight class="w-4 h-4" />
							Credit (Income)
						</button>
					</div>
				</div>

				<!-- Amount -->
				<div>
					<label for="amount" class="block text-xs font-medium text-zinc-400 mb-1.5">Amount</label>
					<div class="relative">
						<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-base font-semibold">
							{appState.settings.currencySymbol || '₹'}
						</span>
						<input
							id="amount"
							type="number"
							step="any"
							placeholder="0.00"
							bind:value={amount}
							required
							class="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-base placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
						/>
					</div>
				</div>

				<!-- Description / Name -->
				<div>
					<label for="name" class="block text-xs font-medium text-zinc-400 mb-1.5">Description / Merchant</label>
					<input
						id="name"
						type="text"
						placeholder="e.g. Swiggy, Salary, Coffee"
						bind:value={name}
						required
						class="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
					/>
				</div>

				<!-- Category -->
				<div>
					<label for="category" class="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
					<select
						id="category"
						bind:value={category}
						class="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
					>
						<option value="">Uncategorized</option>
						{#each appState.categories as cat}
							<option value={cat.name}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<!-- Date -->
				<div>
					<label for="date" class="block text-xs font-medium text-zinc-400 mb-1.5">Date</label>
					<input
						id="date"
						type="date"
						bind:value={date}
						required
						class="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
					/>
				</div>

				<!-- Action Buttons -->
				<div class="flex items-center gap-2 pt-2">
					<button
						type="button"
						onclick={() => {
							appState.isTransactionModalOpen = false;
							appState.editingTransaction = null;
						}}
						class="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 text-sm font-semibold transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold transition-colors disabled:opacity-50"
					>
						{isSubmitting ? 'Saving...' : appState.editingTransaction ? 'Save Changes' : 'Add Transaction'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
