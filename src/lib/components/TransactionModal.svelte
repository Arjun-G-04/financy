<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { X } from '@lucide/svelte';

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
			appState.showToast('error', 'Validation Error', 'Description cannot be empty');
			return;
		}
		if (isNaN(numAmount) || numAmount <= 0) {
			appState.showToast('error', 'Validation Error', 'Enter valid amount greater than 0');
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
				appState.editingTransaction ? 'Record Updated' : 'Record Created',
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
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
		<div class="relative w-full max-w-sm bg-[#171715] border border-stone-800 rounded-xl shadow-2xl p-5 space-y-4">
			<!-- Header -->
			<div class="flex items-center justify-between pb-3 border-b border-stone-800">
				<h3 class="text-sm font-semibold tracking-tight text-[#f5f2ea]">
					{appState.editingTransaction ? 'Edit Operation' : 'New Operation'}
				</h3>
				<button
					onclick={() => {
						appState.isTransactionModalOpen = false;
						appState.editingTransaction = null;
					}}
					class="text-stone-500 hover:text-stone-300 p-1 rounded transition-colors"
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-3 text-xs">
				<!-- Type Switcher -->
				<div>
					<span class="block text-[11px] text-stone-400 mb-1">Direction</span>
					<div class="grid grid-cols-2 gap-1.5 p-0.5 bg-[#111110] rounded-lg border border-stone-800">
						<button
							type="button"
							onclick={() => (type = 'debit')}
							class="py-1.5 rounded text-xs font-medium transition-colors {type === 'debit'
								? 'bg-[#22211e] text-rose-300 shadow-sm'
								: 'text-stone-400 hover:text-stone-200'}"
						>
							Debit (Outflow)
						</button>
						<button
							type="button"
							onclick={() => (type = 'credit')}
							class="py-1.5 rounded text-xs font-medium transition-colors {type === 'credit'
								? 'bg-[#22211e] text-[#82b896] shadow-sm'
								: 'text-stone-400 hover:text-stone-200'}"
						>
							Credit (Inflow)
						</button>
					</div>
				</div>

				<!-- Amount -->
				<div>
					<label for="modal-amount" class="block text-[11px] text-stone-400 mb-1">Amount</label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-mono text-sm">
							{appState.settings.currencySymbol || '₹'}
						</span>
						<input
							id="modal-amount"
							type="number"
							step="any"
							placeholder="0.00"
							bind:value={amount}
							required
							class="w-full pl-8 pr-3 py-2 bg-[#111110] border border-stone-800 rounded-lg text-stone-100 text-sm font-mono tabular-nums focus:outline-none focus:border-stone-600 transition-colors"
						/>
					</div>
				</div>

				<!-- Description / Name -->
				<div>
					<label for="modal-name" class="block text-[11px] text-stone-400 mb-1">Description</label>
					<input
						id="modal-name"
						type="text"
						placeholder="Merchant / Note"
						bind:value={name}
						required
						class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-stone-600 transition-colors"
					/>
				</div>

				<!-- Category -->
				<div>
					<label for="modal-category" class="block text-[11px] text-stone-400 mb-1">Category</label>
					<select
						id="modal-category"
						bind:value={category}
						class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-xs focus:outline-none focus:border-stone-600 transition-colors"
					>
						<option value="">Uncategorized</option>
						{#each appState.categories as cat}
							<option value={cat.name}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<!-- Date -->
				<div>
					<label for="modal-date" class="block text-[11px] text-stone-400 mb-1">Date</label>
					<input
						id="modal-date"
						type="date"
						bind:value={date}
						required
						class="w-full px-3 py-1.5 bg-[#111110] border border-stone-800 rounded-lg text-stone-300 text-xs font-mono focus:outline-none focus:border-stone-600 transition-colors"
					/>
				</div>

				<!-- Action Buttons -->
				<div class="flex items-center gap-2 pt-2 border-t border-stone-800/60">
					<button
						type="button"
						onclick={() => {
							appState.isTransactionModalOpen = false;
							appState.editingTransaction = null;
						}}
						class="flex-1 py-1.5 rounded-lg border border-stone-800 text-stone-400 hover:text-stone-200 text-xs transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex-1 py-1.5 rounded-lg bg-[#eeebe3] hover:bg-white text-[#111110] text-xs font-medium transition-colors disabled:opacity-50"
					>
						{isSubmitting ? 'Recording...' : appState.editingTransaction ? 'Save' : 'Record'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
