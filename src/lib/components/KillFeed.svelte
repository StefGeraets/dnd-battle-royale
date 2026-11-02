<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { GameEngine } from '#lib/game.svelte.js';
	import { formatMs } from '#lib/utils/time.js';

	type Props = { game: GameEngine };
	let { game }: Props = $props();

	// Oldest entries (higher index) fade out
	const FADE_OPACITIES = [1, 0.8, 0.6, 0.4, 0.25];
</script>

<div class="flex flex-col gap-2">
	{#each game.killFeed as kill, i (kill.id)}
		<div
			animate:flip={{ duration: prefersReducedMotion.current ? 0 : 300, easing: quintOut }}
			in:fly={{ x: prefersReducedMotion.current ? 0 : 50, duration: 300 }}
			class="overflow-hidden rounded-lg border border-white/5 bg-black/75 px-3 py-2 shadow-lg transition-opacity duration-300"
			style="opacity: {FADE_OPACITIES[i] ?? 0.25}"
		>
			<div class="flex flex-wrap items-baseline justify-end gap-x-1 text-sm text-zinc-200">
				{#each kill.parts as part, j (j)}
					{#if 'token' in part}
						<span
							class={part.token === 'A' ? 'font-bold text-yellow-400' : 'font-bold text-red-400'}
						>
							{part.token === 'A' ? kill.attacker : kill.victim}
						</span>
					{:else}
						<span>{part.text}</span>
					{/if}
				{/each}
			</div>
			<div class="mt-0.5 text-right font-mono text-[10px] text-zinc-600">
				{formatMs(kill.gameTime)}
			</div>
		</div>
	{/each}
</div>
