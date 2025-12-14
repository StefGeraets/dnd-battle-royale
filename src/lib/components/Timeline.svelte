<script lang="ts">
	import type { GameEngine } from '../game.svelte';

	type Props = {
		game: GameEngine;
	};

	let { game }: Props = $props();

	let schedule = $derived(game.schedule);
	let lastEvent = $derived(schedule.length > 0 ? schedule[schedule.length - 1] : null);
	let totalDurationMs = $derived(lastEvent ? (lastEvent.triggerTime + 10) * 60 * 1000 : 60000);

	function getPct(ms: number) {
		return Math.min(100, (ms / totalDurationMs) * 100);
	}
</script>

<div
	class="relative h-20 w-full select-none overflow-hidden border-t border-zinc-700 bg-zinc-900/80"
>
	<div class="absolute inset-0 top-8 h-1 w-full bg-zinc-700"></div>

	{#each schedule as round}
		{@const startMs = round.triggerTime * 60 * 1000}
		{@const durationMs = round.duration * 1000}

		<div class="absolute top-8 h-3 w-px bg-zinc-500" style="left: {getPct(startMs)}%"></div>
		<div
			class="absolute top-11 -translate-x-1/2 text-[10px] text-zinc-400 font-mono"
			style="left: {getPct(startMs)}%"
		>
			{round.triggerTime}:00
		</div>

		<div
			class="absolute top-4 flex h-4 items-center justify-center truncate rounded border border-red-800 bg-red-900/60 px-1 text-[9px] text-red-200"
			style="left: {getPct(startMs)}%; width: {getPct(durationMs)}%;"
			title="{round.label}: Shrinking"
		>
			SHRINK
		</div>
	{/each}

	<div
		class="absolute bottom-0 top-0 z-10 w-0.5 bg-yellow-400 shadow-[0_0_10px_orange] transition-all duration-100 ease-linear"
		style="left: {getPct(game.elapsedTime)}%"
	>
		<div
			class="absolute top-0 -translate-x-1/2 rounded-b bg-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-black"
		>
			NOW
		</div>
	</div>
</div>
