<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { onMount } from 'svelte';
	import { on } from 'svelte/events';
	import { playMechanicalClick, warmAudioContext } from '#lib/sound';

	let { children }: LayoutProps = $props();

	onMount(() => {
		const offPointer = on(document, 'pointerdown', warmAudioContext, { capture: true, passive: true });
		const offKey = on(document, 'keydown', warmAudioContext, { capture: true, passive: true });
		const offClick = on(
			document,
			'click',
			(event) => {
				if (!(event.target instanceof Element)) return;
				const target = event.target.closest(
					'button, [role="button"], a.hw-keycap, a.hw-keycap-primary'
				);
				if (!target) return;
				if (
					target.hasAttribute('disabled') ||
					target.getAttribute('aria-disabled') === 'true' ||
					target.hasAttribute('data-no-sound')
				) {
					return;
				}

				const isPrimary =
					target.classList.contains('hw-keycap-primary') ||
					(target instanceof HTMLButtonElement && target.type === 'submit');
				void playMechanicalClick(isPrimary ? 'primary' : 'standard');
			},
			{ capture: true }
		);

		return () => {
			offPointer();
			offKey();
			offClick();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
