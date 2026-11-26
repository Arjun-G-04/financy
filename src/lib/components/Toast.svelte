<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { X, Check, AlertTriangle, Info } from '@lucide/svelte';

	const VARIANT_CLASSES = {
		success: 'hw-toast-success',
		error: 'hw-toast-error',
		info: 'hw-toast-info'
	} as const;

	function dismiss(id: string) {
		appState.toasts = appState.toasts.filter((t) => t.id !== id);
	}
</script>

{#if appState.toasts.length > 0}
	<div
		class="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] md:bottom-5 right-0 md:right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3.5 md:px-0"
	>
		{#each appState.toasts as toast (toast.id)}
			<div
				in:fly={{ y: 14, duration: 180, easing: cubicOut }}
				out:fade={{ duration: 130 }}
				role={toast.type === 'error' ? 'alert' : 'status'}
				class="pointer-events-auto hw-toast-frame {VARIANT_CLASSES[toast.type]}"
			>
				<div class="hw-toast-panel p-3 sm:p-3.5 flex items-center gap-3">
					<!-- Recessed Status Indicator -->
					<div class="hw-toast-icon shrink-0 w-8 h-8 rounded-lg flex items-center justify-center">
						{#if toast.type === 'success'}
							<Check class="w-4 h-4 drop-shadow-[0_0_6px_var(--toast-accent)]" />
						{:else if toast.type === 'error'}
							<AlertTriangle class="w-4 h-4 drop-shadow-[0_0_6px_var(--toast-accent)]" />
						{:else}
							<Info class="w-4 h-4 drop-shadow-[0_0_6px_var(--toast-accent)]" />
						{/if}
					</div>

					<!-- Readout -->
					<div class="flex-1 min-w-0">
						<div
							class="text-[11px] font-mono font-bold uppercase tracking-wider truncate"
							style="color: var(--toast-accent);"
						>
							{toast.title}
						</div>
						{#if toast.message}
							<div class="text-[11px] font-mono tabular-nums text-stone-300 mt-0.5 break-words leading-snug">
								{toast.message}
							</div>
						{/if}
					</div>

					<!-- Tactile Keycap Dismiss -->
					<button
						type="button"
						onclick={() => dismiss(toast.id)}
						class="hw-keycap shrink-0 w-11 h-11 flex items-center justify-center text-[#9c9990] hover:text-[#eeebe3] cursor-pointer"
						aria-label="Dismiss notification"
					>
						<X class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}
