<script lang="ts">
	import { appState } from '#lib/state.svelte';
	import { CheckCircle2, AlertCircle, Info, X } from '@lucide/svelte';
</script>

{#if appState.toasts.length > 0}
	<div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
		{#each appState.toasts as toast (toast.id)}
			<div
				class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 {toast.type === 'success'
					? 'bg-zinc-900/95 border-emerald-500/30 text-zinc-100'
					: toast.type === 'error'
						? 'bg-zinc-900/95 border-rose-500/30 text-zinc-100'
						: 'bg-zinc-900/95 border-zinc-700 text-zinc-100'}"
			>
				<div class="mt-0.5">
					{#if toast.type === 'success'}
						<CheckCircle2 class="w-5 h-5 text-emerald-400" />
					{:else if toast.type === 'error'}
						<AlertCircle class="w-5 h-5 text-rose-400" />
					{:else}
						<Info class="w-5 h-5 text-zinc-400" />
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-sm font-semibold">{toast.title}</div>
					{#if toast.message}
						<div class="text-xs text-zinc-400 mt-0.5 break-words">{toast.message}</div>
					{/if}
				</div>
				<button
					onclick={() => (appState.toasts = appState.toasts.filter((t) => t.id !== toast.id))}
					class="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
		{/each}
	</div>
{/if}
