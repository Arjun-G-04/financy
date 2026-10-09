<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { X } from '@lucide/svelte';
</script>

{#if appState.toasts.length > 0}
	<div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
		{#each appState.toasts as toast (toast.id)}
			<div
				class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-200 {toast.type === 'success'
					? 'bg-[#181816]/95 border-[#82b896]/30 text-[#f5f2ea]'
					: toast.type === 'error'
						? 'bg-[#181816]/95 border-[#e06c75]/30 text-[#f5f2ea]'
						: 'bg-[#181816]/95 border-stone-800 text-[#f5f2ea]'}"
			>
				<div class="flex-1 min-w-0">
					<div class="text-xs font-semibold">{toast.title}</div>
					{#if toast.message}
						<div class="text-[11px] text-stone-400 mt-0.5 break-words font-mono">{toast.message}</div>
					{/if}
				</div>
				<button
					onclick={() => (appState.toasts = appState.toasts.filter((t) => t.id !== toast.id))}
					class="text-stone-500 hover:text-stone-300 transition-colors p-0.5"
					aria-label="Close"
				>
					<X class="w-3.5 h-3.5" />
				</button>
			</div>
		{/each}
	</div>
{/if}
