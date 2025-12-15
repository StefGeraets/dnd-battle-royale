<script lang="ts">
	import type { GameEngine } from '../game.svelte';

	type Props = {
		game: GameEngine;
	};

	let { game }: Props = $props();

	function fmt(secs: number) {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

<div class="pointer-events-none fixed inset-x-0 top-10 z-60 flex justify-center">
	{#if game.phase === 'WARNING'}
		<div class="animate-in slide-in-from-top-4 fade-in duration-500">
			<div
				class="flex flex-col items-center gap-1 rounded-xl border-4 border-red-600 bg-red-950/90 px-8 py-4 text-white shadow-[0_0_50px_rgba(220,38,38,0.6)] backdrop-blur-sm"
			>
				<div class="text-xs font-black tracking-[0.2em] text-red-400 uppercase animate-pulse">
					Zone Destabilizing
				</div>

				<div
					class="font-mono text-6xl font-bold tabular-nums tracking-wider text-red-100"
					style="text-shadow: 4px 4px 0 #000;"
				>
					{fmt(game.secondsUntilShrink)}
				</div>
			</div>
		</div>
	{/if}
</div>
