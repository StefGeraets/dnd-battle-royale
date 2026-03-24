<script lang="ts">
	import type { GameEngine } from '../game.svelte';
	import { formatMs } from '../utils/time';

	type Props = {
		game: GameEngine;
		onToggle: () => void;
	};

	let { game, onToggle }: Props = $props();
</script>

<div class="rounded border border-zinc-700 bg-zinc-900 shadow-xl">
	<div class="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2">
		<span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mission Clock</span>
		<div class="flex items-center gap-2">
			<span
				class="h-2 w-2 rounded-full {game.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"
			></span>
			<span class="text-xs font-bold text-zinc-300">{game.isRunning ? 'LIVE' : 'PAUSED'}</span>
		</div>
	</div>

	<div class="p-4">
		<div class="mb-4 text-center font-mono text-5xl font-black tracking-tight text-white">
			{formatMs(game.elapsedTime)}
		</div>

		<div class="mb-4 space-y-1">
			<div class="flex justify-between text-xs">
				<span class="text-zinc-400">Current Phase</span>
				<span
					class="font-bold uppercase {game.phase === 'SHRINKING'
						? 'text-red-500 animate-pulse'
						: game.phase === 'WARNING'
							? 'text-yellow-500'
							: 'text-blue-400'}">{game.phase}</span
				>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
				{#if game.phase === 'SHRINKING'}
					<div
						class="h-full bg-red-500 transition-all duration-100 ease-linear"
						style="width: {((game.elapsedTime - game.shrinkStartTime) / game.shrinkDuration) * 100}%"
					></div>
				{:else if game.nextRound}
					{@const total = game.nextRound.triggerTime * 60 * 1000}
					<div
						class="h-full bg-zinc-700 transition-all duration-1000"
						style="width: {(game.elapsedTime / total) * 100}%"
					></div>
				{/if}
			</div>
		</div>

		<div class="mb-4 rounded bg-zinc-800 p-2 text-center text-xs">
			{#if game.nextRound}
				<span class="text-zinc-400">Next: </span>
				<span class="font-bold text-white">{game.nextRound.label}</span>
				<div class="mt-0.5 font-mono text-zinc-500">
					Target: {game.nextRound.triggerTime}:00
				</div>
			{:else}
				<span class="text-green-400 font-bold">ALL ROUNDS COMPLETE</span>
			{/if}
		</div>

		<button
			class="w-full rounded py-2 text-sm font-bold shadow-lg transition-transform text-white active:scale-95 {game.isRunning
				? 'bg-yellow-600 hover:bg-yellow-500'
				: 'bg-green-600 hover:bg-green-500'}"
			onclick={onToggle}
		>
			{game.isRunning ? 'PAUSE CLOCK' : 'START CLOCK'}
		</button>
	</div>
</div>
