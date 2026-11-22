<script lang="ts">
	import type { AssetEntry } from '#lib/types';
	import { appState } from '#lib/state.svelte';
	import { formatCurrency as formatCur } from '#lib/utils';
	import { Coins, X, Check } from '@lucide/svelte';

	interface Props {
		isOpen: boolean;
		entry?: AssetEntry | null;
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { isOpen = false, entry = null, onClose, onSuccess }: Props = $props();

	let formName = $state('');
	let formInitial = $state('');
	let formFinal = $state('');
	let isSaving = $state(false);

	function formatCurrency(val: number) {
		return formatCur(val, appState.settings.currencySymbol);
	}

	$effect(() => {
		if (isOpen) {
			if (entry) {
				formName = entry.name;
				formInitial = String(entry.initial);
				formFinal = String(entry.final);
			} else {
				formName = '';
				formInitial = '';
				formFinal = '';
			}
		}
	});

	const parsedInitial = $derived(parseFloat(formInitial));
	const parsedFinal = $derived(parseFloat(formFinal));
	const isCalculable = $derived(
		formInitial.trim() !== '' &&
			formFinal.trim() !== '' &&
			!isNaN(parsedInitial) &&
			!isNaN(parsedFinal)
	);
	const projectedDelta = $derived(isCalculable ? parsedFinal - parsedInitial : 0);
	const projectedDeltaPct = $derived(
		isCalculable && parsedInitial > 0 ? (projectedDelta / parsedInitial) * 100 : 0
	);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmedName = formName.trim();
		if (!trimmedName) {
			appState.showToast('error', 'Validation Error', 'Asset name cannot be empty');
			return;
		}
		if (trimmedName.toLowerCase() === 'liquid') {
			appState.showToast('error', 'Validation Error', '"Liquid" is reserved for ledger net capital');
			return;
		}
		if (!isCalculable) {
			appState.showToast('error', 'Validation Error', 'Initial and Final values must be valid numbers');
			return;
		}

		isSaving = true;
		try {
			await appState.saveAsset({
				id: entry?.id,
				name: trimmedName,
				initial: parsedInitial,
				final: parsedFinal
			});
			appState.showToast(
				'success',
				entry ? 'Asset Updated' : 'Asset Created',
				`Logged "${trimmedName}" at ${formatCurrency(parsedFinal)}`
			);
			onSuccess?.();
			onClose();
		} catch (err: any) {
			appState.showToast('error', 'Save Failed', err.message);
		} finally {
			isSaving = false;
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="asset-modal-title"
	>
		<div class="hw-chassis w-full max-w-md rounded-2xl border border-[#2e2e28] p-5 sm:p-6 space-y-4 shadow-2xl relative">
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-[#292924] pb-3">
				<div class="flex items-center gap-2">
					<Coins class="w-5 h-5 text-[#82b896]" />
					<h2 id="asset-modal-title" class="text-xs font-mono uppercase tracking-wider font-bold text-stone-200">
						{entry ? 'EDIT ASSET HOLDING' : 'RECORD NEW ASSET'}
					</h2>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="hw-keycap p-1 rounded-md text-stone-400 hover:text-stone-200 cursor-pointer"
					aria-label="Close dialog"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Asset Name -->
				<div>
					<label for="asset-name" class="block text-xs font-mono text-stone-400 mb-1.5 uppercase tracking-wider">
						Asset Name / Classification
					</label>
					<input
						id="asset-name"
						type="text"
						placeholder="e.g. Mutual Funds, Gold Reserve, Crypto"
						bind:value={formName}
						required
						class="w-full px-3.5 py-2.5 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
					/>
				</div>

				<!-- Initial & Final Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
					<!-- Initial Value -->
					<div>
						<label for="asset-initial" class="block text-xs font-mono text-stone-400 mb-1.5 uppercase tracking-wider">
							Initial (Invested)
						</label>
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono font-bold pointer-events-none">
								{appState.settings.currencySymbol || '₹'}
							</span>
							<input
								id="asset-initial"
								type="number"
								step="any"
								placeholder="0.00"
								bind:value={formInitial}
								required
								class="w-full pl-8 pr-3 py-2.5 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
							/>
						</div>
					</div>

					<!-- Final Value -->
					<div>
						<label for="asset-final" class="block text-xs font-mono text-stone-400 mb-1.5 uppercase tracking-wider">
							Final (Current)
						</label>
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-mono font-bold pointer-events-none">
								{appState.settings.currencySymbol || '₹'}
							</span>
							<input
								id="asset-final"
								type="number"
								step="any"
								placeholder="0.00"
								bind:value={formFinal}
								required
								class="w-full pl-8 pr-3 py-2.5 bg-[#10100d] border border-[#292924] rounded-lg text-stone-200 text-base sm:text-xs font-mono tabular-nums focus:outline-none focus:border-[#c9b48b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
							/>
						</div>
					</div>
				</div>

				<!-- Dynamic Live Calculation Preview -->
				{#if isCalculable}
					<div class="p-3 bg-[#10100d] border border-[#262622] rounded-lg flex items-center justify-between text-xs font-mono">
						<span class="text-stone-400">Projected Delta:</span>
						<span class="font-bold tabular-nums {projectedDelta >= 0 ? 'text-[#82b896]' : 'text-[#e06c75]'}">
							{projectedDelta >= 0 ? '+' : ''}{formatCurrency(projectedDelta)} ({projectedDelta >= 0 ? '+' : ''}{projectedDeltaPct.toFixed(2)}%)
						</span>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-[#292924]">
					<button
						type="button"
						onclick={onClose}
						class="hw-keycap px-4 py-2 text-xs font-mono text-stone-300 hover:text-white cursor-pointer"
					>
						CANCEL
					</button>
					<button
						type="submit"
						disabled={isSaving}
						class="hw-keycap-primary flex items-center gap-1.5 px-5 py-2 text-xs font-mono font-bold tracking-wider cursor-pointer shadow-md disabled:opacity-50"
					>
						<Check class="w-3.5 h-3.5 stroke-[2.5]" />
						<span>{isSaving ? 'SAVING...' : entry ? 'UPDATE ASSET' : 'COMMIT ASSET'}</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
