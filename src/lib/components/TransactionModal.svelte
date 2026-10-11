<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import DatePicker from '#lib/components/DatePicker.svelte';
	import { formatCurrency, suggestCategory } from '#lib/utils';
	import { X, ArrowDownLeft, ArrowUpRight, Check, FileText } from '@lucide/svelte';

	let date = $state(new Date().toISOString().split('T')[0]);
	let type = $state<'credit' | 'debit'>('debit');
	let amount = $state<string>('');
	let name = $state('');
	let category = $state<string>('');
	let isSubmitting = $state(false);

	const isReviewMode = $derived(Boolean(appState.sheetReviewContext));
	const reviewTx = $derived(appState.sheetReviewContext?.transaction);

	function handleNameChange(newName: string) {
		name = newName;
		const autoCat = suggestCategory(newName, appState.categories);
		if (autoCat) {
			category = autoCat;
		}
	}

	$effect(() => {
		if (appState.sheetReviewContext) {
			const tx = appState.sheetReviewContext.transaction;
			date = tx.date;
			type = tx.type;
			amount = String(tx.amount);
			name = tx.merchant || '';
			const autoCat = suggestCategory(`${tx.merchant} ${tx.raw || ''}`, appState.categories);
			category = autoCat || '';
		} else if (appState.editingTransaction) {
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
			category = '';
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
		if (!category || !category.trim()) {
			appState.showToast('error', 'Validation Error', 'Category must be selected');
			return;
		}

		isSubmitting = true;
		try {
			if (appState.sheetReviewContext) {
				await appState.sheetReviewContext.onConfirm({
					id: appState.sheetReviewContext.transaction.id,
					name: name.trim(),
					amount: numAmount,
					type,
					date,
					category: category.trim()
				});
				appState.closeTransactionModal();
			} else {
				await appState.saveTransaction({
					id: appState.editingTransaction?.id,
					date,
					type,
					amount: numAmount,
					name: name.trim(),
					category: category.trim()
				});

				const sign = type === 'credit' ? '+' : '-';
				const sym = appState.settings.currencySymbol || '₹';
				appState.showToast(
					'success',
					appState.editingTransaction ? 'Record Updated' : 'Record Created',
					`${sign}${sym}${numAmount.toFixed(2)}: ${name.trim()}`
				);
				appState.closeTransactionModal();
			}
		} catch (err: any) {
			appState.showToast('error', 'Operation Failed', err.message);
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if appState.isTransactionModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
	>
		<div
			class="relative w-full max-w-md bg-[#171715] border border-stone-800 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
		>
			<!-- Header -->
			<div class="flex items-center justify-between pb-3 border-b border-stone-800">
				<div>
					{#if isReviewMode}
						<div class="text-[10px] font-mono uppercase tracking-wider text-stone-500">
							Sheet Import Review
						</div>
						<h3 class="text-sm font-semibold tracking-tight text-[#f5f2ea] mt-0.5">
							Customize & Commit to Ledger
						</h3>
					{:else}
						<h3 class="text-sm font-semibold tracking-tight text-[#f5f2ea]">
							{appState.editingTransaction ? 'Edit Record' : 'New Record'}
						</h3>
					{/if}
				</div>
				<button
					type="button"
					onclick={() => appState.closeTransactionModal()}
					class="text-stone-500 hover:text-stone-300 p-1.5 rounded-lg hover:bg-[#232320] transition-colors"
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Sheet Original Reference Card (when in review mode) -->
			{#if isReviewMode && reviewTx}
				<div class="p-3 rounded-xl bg-[#111110] border border-stone-800/80 space-y-2 text-xs">
					<div class="flex items-center justify-between text-[11px] font-mono">
						<span class="text-stone-500 uppercase tracking-wider">Sheet Original</span>
						<span class="text-stone-400 tabular-nums">{reviewTx.rawDate || reviewTx.date}</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="text-xs text-stone-300 font-medium truncate max-w-[240px]">
							{reviewTx.merchant}
						</div>
						<div
							class="text-xs font-mono tabular-nums font-semibold {reviewTx.type === 'credit'
								? 'text-[#82b896]'
								: 'text-[#e06c75]'}"
						>
							{formatCurrency(reviewTx.amount, appState.settings.currencySymbol)}
						</div>
					</div>

					{#if reviewTx.raw && reviewTx.raw !== reviewTx.merchant}
						<div class="pt-1.5 border-t border-stone-800/60 text-[10px] text-stone-500 font-mono flex items-start gap-1">
							<FileText class="w-3 h-3 text-stone-600 shrink-0 mt-0.5" />
							<span class="truncate">{reviewTx.raw}</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-3.5 text-xs">
				<!-- Direction Switcher -->
				<div>
					<span class="block text-[11px] text-stone-400 mb-1 font-mono uppercase tracking-wider">Direction</span>
					<div class="grid grid-cols-2 gap-1.5 p-0.5 bg-[#111110] rounded-xl border border-stone-800">
						<button
							type="button"
							onclick={() => (type = 'debit')}
							class="py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 {type === 'debit'
								? 'bg-[#22211e] text-[#e06c75] shadow-sm font-semibold'
								: 'text-stone-400 hover:text-stone-200'}"
						>
							<ArrowUpRight class="w-3.5 h-3.5" />
							<span>Debit (Outflow)</span>
						</button>
						<button
							type="button"
							onclick={() => (type = 'credit')}
							class="py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 {type === 'credit'
								? 'bg-[#22211e] text-[#82b896] shadow-sm font-semibold'
								: 'text-stone-400 hover:text-stone-200'}"
						>
							<ArrowDownLeft class="w-3.5 h-3.5" />
							<span>Credit (Inflow)</span>
						</button>
					</div>
				</div>

				<!-- Description / Name -->
				<div>
					<label for="modal-name" class="block text-[11px] text-stone-400 mb-1 font-mono uppercase tracking-wider">
						Description / Payee
					</label>
					<input
						id="modal-name"
						type="text"
						placeholder="Merchant / Note"
						value={name}
						oninput={(e) => handleNameChange((e.target as HTMLInputElement).value)}
						required
						class="w-full px-3 py-2 bg-[#111110] border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-stone-600 transition-colors"
					/>
				</div>

				<!-- Amount -->
				<div>
					<label for="modal-amount" class="block text-[11px] text-stone-400 mb-1 font-mono uppercase tracking-wider">
						Amount ({appState.settings.currencySymbol || '₹'})
					</label>
					<div class="relative">
						<input
							id="modal-amount"
							type="number"
							step="any"
							min="0.01"
							placeholder="0.00"
							bind:value={amount}
							required
							class="w-full px-3 py-2 bg-[#111110] border border-stone-800 rounded-xl text-stone-100 text-xs font-mono tabular-nums focus:outline-none focus:border-stone-600 transition-colors"
						/>
					</div>
				</div>

				<!-- Category -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="modal-category" class="block text-[11px] text-stone-400 font-mono uppercase tracking-wider">
							Category *
						</label>
						{#if !category}
							<span class="text-[10px] text-[#e06c75] font-mono">Selection required</span>
						{/if}
					</div>

					<select
						id="modal-category"
						bind:value={category}
						required
						class="w-full px-3 py-2 bg-[#111110] border rounded-xl text-xs focus:outline-none transition-colors {!category
							? 'border-[#e06c75]/50 text-stone-500'
							: 'border-stone-800 text-stone-200 focus:border-stone-600'}"
					>
						<option value="" disabled selected>— Select a Category —</option>
						{#each appState.categories as cat}
							<option value={cat.name}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<!-- Date -->
				<div>
					<DatePicker
						bind:value={date}
						label="Transaction Date"
						clearable={false}
					/>
				</div>

				<!-- Action Buttons -->
				<div class="flex items-center gap-2 pt-3 border-t border-stone-800/60">
					<button
						type="button"
						onclick={() => appState.closeTransactionModal()}
						class="flex-1 py-2 rounded-xl border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-[#1a1917] text-xs font-medium transition-colors"
					>
						Cancel
					</button>

					<button
						type="submit"
						disabled={isSubmitting}
						class="flex-1 py-2 rounded-xl bg-[#eeebe3] hover:bg-white text-[#111110] text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
					>
						{#if isReviewMode}
							<Check class="w-3.5 h-3.5" />
							<span>{isSubmitting ? 'Recording...' : 'Commit to Ledger'}</span>
						{:else}
							<span>{isSubmitting ? 'Recording...' : appState.editingTransaction ? 'Update' : 'Record'}</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
