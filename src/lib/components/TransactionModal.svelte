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

	function handleNameChange() {
		const autoCat = suggestCategory(name, appState.categories);
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
			const autoCat = suggestCategory([tx.merchant, tx.raw], appState.categories);
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
		class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
	>
		<div
			class="relative w-full max-w-md hw-chassis rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-5 space-y-4 max-h-[90vh] sm:max-h-[90vh] overflow-y-auto"
		>
			<!-- Mobile Drag Handle -->
			<div class="w-10 h-1 rounded-full bg-stone-700/80 mx-auto sm:hidden -mt-1 mb-2"></div>

			<!-- Header -->
			<div class="flex items-center justify-between pb-3 border-b border-[#2b2b25]">
				<div>
					{#if isReviewMode}
						<div class="text-[10px] font-mono uppercase tracking-wider text-stone-500">
							Sheet Import Review
						</div>
						<h3 class="text-sm font-semibold tracking-tight text-[#f5f2ea] mt-0.5 font-mono">
							Customize & Commit to Ledger
						</h3>
					{:else}
						<h3 class="text-sm font-bold tracking-tight text-[#f5f2ea] font-mono">
							{appState.editingTransaction ? 'EDIT' : 'NEW RECORD'}
						</h3>
					{/if}
				</div>
				<button
					type="button"
					onclick={() => appState.closeTransactionModal()}
					class="hw-keycap text-stone-400 hover:text-stone-200 p-2 sm:p-1.5 rounded-lg cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
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
				<!-- Direction Switcher (Physical Sliding Selector Toggle) -->
				<div>
					<span class="block text-[11px] text-stone-400 mb-1.5 font-mono uppercase tracking-wider">Direction</span>
					<div class="relative grid grid-cols-2 p-1 bg-[#0b0b09] rounded-xl border border-[#262622] shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)] select-none">
						<!-- Mechanical Sliding Thumb Shuttle -->
						<div
							class="absolute top-1 bottom-1 w-[calc(50%-4px)] left-1 rounded-lg pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] {type === 'credit'
								? 'translate-x-full bg-gradient-to-b from-[#1c2a20] to-[#111a14] border border-[#295236] shadow-[0_3px_8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15),0_0_12px_rgba(130,184,150,0.25)]'
								: 'translate-x-0 bg-gradient-to-b from-[#2a1c1d] to-[#1a1112] border border-[#52292f] shadow-[0_3px_8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15),0_0_12px_rgba(224,108,117,0.25)]'}"
						></div>

						<button
							type="button"
							onclick={() => (type = 'debit')}
							class="relative z-10 py-2.5 sm:py-2 rounded-lg text-xs font-mono font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[36px] cursor-pointer {type === 'debit'
								? 'text-[#e06c75] font-bold drop-shadow-[0_0_8px_rgba(224,108,117,0.4)]'
								: 'text-stone-400 hover:text-stone-200'}"
						>
							<ArrowUpRight class="w-3.5 h-3.5 transition-transform duration-200 {type === 'debit' ? 'scale-110' : ''}" />
							<span>Debit</span>
						</button>
						<button
							type="button"
							onclick={() => (type = 'credit')}
							class="relative z-10 py-2.5 sm:py-2 rounded-lg text-xs font-mono font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[36px] cursor-pointer {type === 'credit'
								? 'text-[#82b896] font-bold drop-shadow-[0_0_8px_rgba(130,184,150,0.4)]'
								: 'text-stone-400 hover:text-stone-200'}"
						>
							<ArrowDownLeft class="w-3.5 h-3.5 transition-transform duration-200 {type === 'credit' ? 'scale-110' : ''}" />
							<span>Credit</span>
						</button>
					</div>
				</div>

				<!-- Description / Name -->
				<div>
					<label for="modal-name" class="block text-[11px] text-stone-400 mb-1 font-mono uppercase tracking-wider">
						Description
					</label>
					<input
						id="modal-name"
						type="text"
						placeholder="Merchant / Note"
						bind:value={name}
						oninput={handleNameChange}
						required
						class="w-full px-3 py-2.5 sm:py-2 bg-[#111110] border border-stone-800 rounded-xl text-stone-200 text-base sm:text-xs focus:outline-none focus:border-stone-600 transition-colors"
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
							class="w-full px-3 py-2.5 sm:py-2 bg-[#111110] border border-stone-800 rounded-xl text-stone-100 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-stone-600 transition-colors"
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
						class="w-full px-3 py-2.5 sm:py-2 bg-[#111110] border rounded-xl text-base sm:text-xs focus:outline-none transition-colors {!category
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
				<div class="flex items-center gap-2 pt-3 border-t border-[#2b2b25]">
					<button
						type="button"
						onclick={() => appState.closeTransactionModal()}
						class="flex-1 py-3 sm:py-2.5 hw-keycap text-stone-300 hover:text-white text-xs font-mono font-medium transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center cursor-pointer"
					>
						CANCEL
					</button>

					<button
						type="submit"
						disabled={isSubmitting}
						class="flex-1 py-3 sm:py-2.5 hw-keycap-primary text-xs font-mono font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm min-h-[44px] sm:min-h-0 cursor-pointer"
					>
						{#if isReviewMode}
							<Check class="w-3.5 h-3.5 stroke-[2.5]" />
							<span>{isSubmitting ? 'COMMITTING...' : 'COMMIT TO LEDGER'}</span>
						{:else}
							<span>{isSubmitting ? 'RECORDING...' : appState.editingTransaction ? 'UPDATE RECORD' : 'COMMIT RECORD'}</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
