<script lang="ts">
	import { GameEngine } from '$lib/game.svelte';
	import MapCanvas from '$lib/components/MapCanvas.svelte';
	import MapSettings from '$lib/components/MapSettings.svelte';

	const game = new GameEngine(true);

	// Player movement
	function handleKeyDown(e: KeyboardEvent) {
		const step = 1;

		switch (e.code) {
			case 'ArrowUp':
				game.movePlayer(0, -step);
				break;
			case 'ArrowDown':
				game.movePlayer(0, step);
				break;
			case 'ArrowLeft':
				game.movePlayer(-step, 0);
				break;
			case 'ArrowRight':
				game.movePlayer(step, 0);
				break;
			case 'Space':
				game.toggleTimer();
				break;
		}
	}

	// Helper to format ms to MM:SS
	function formatTime(ms: number) {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	class="flex h-screen text-white gap-4 transition-colors duration-1000"
	style="background-color: {game.themeColor}"
>
	<div class="relative z-50 w-80 flex flex-col p-4 gap-4 overflow-y-auto">
		<h1 class="border-b border-red-900 pb-2 text-2xl font-bold text-red-500">DM Control</h1>

		<div class="bg-zinc-900 p-4 rounded border border-zinc-700 shadow-lg">
			<h2 class="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">Timer</h2>
			<div class="text-4xl font-mono mb-3">
				{formatTime(game.elapsedTime)}
			</div>
			<button
				class="px-4 py-3 rounded font-bold transition-colors w-full {game.isRunning
					? 'bg-yellow-600 hover:bg-yellow-500'
					: 'bg-green-600 hover:bg-green-500'}"
				onclick={() => game.toggleTimer()}
			>
				{game.isRunning ? 'PAUSE GAME' : 'START GAME'}
			</button>
		</div>

		<div class="rounded border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
			<h2 class="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">Current Phase</h2>

			<div
				class="mb-2 text-lg font-bold {game.phase === 'SHRINKING'
					? 'animate-pulse text-red-500'
					: 'text-blue-400'}"
			>
				{game.phase}
			</div>

			{#if game.phase === 'SHRINKING'}
				<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
					<div
						class="h-full bg-red-600 transition-all duration-100 ease-linear"
						style="width: {((game.elapsedTime - game.shrinkStartTime) / game.shrinkDuration) *
							100}%"
					></div>
				</div>
			{/if}
		</div>

		<div class="rounded border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
			<h2 class="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">Upcoming Event</h2>

			{#if game.nextRound}
				<div class="relative">
					<div class="mb-1 text-xl font-bold text-white">{game.nextRound.label}</div>

					<div class="flex justify-between text-sm text-zinc-400 mt-4">
						<span>Triggers at:</span>
						<span class="font-mono text-white">{game.nextRound.triggerTime}:00</span>
					</div>

					<div class="flex justify-between text-sm text-zinc-400 mt-4">
						<span>Target radius:</span>
						<span class="font-mono text-white">{game.nextRound.radius}%</span>
					</div>
				</div>

				{@const msUtil = game.nextRound.triggerTime * 60 * 1000 - game.elapsedTime}
				{@const totalDuration = game.nextRound.triggerTime * 60 * 1000}

				{#if msUtil > 0}
					<div class="w-full mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
						<div
							class="h-full bg-blue-600 transition-all duration-1000"
							style="width: {(game.elapsedTime / totalDuration) * 100}%"
						></div>
					</div>

					<div class="text-center text-xs mt-1 text-zinc-500">
						T-minus {formatTime(msUtil)}
					</div>
				{:else}
					<div class="mt-2 text-center text-sm text-red-400 font-bold uppercase">
						Triggering Now
					</div>
				{/if}

				{#if msUtil > 0}
					<div
						class="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded text-sm text-yellow-200"
					>
						<strong>DM Action:</strong> Click the map now to set the center for this round
						<br /><br />
						<em class="opacity-70 text-xs"
							>If no click, center stays at {game.activeZone.x.toFixed(0)}, {game.activeZone.y.toFixed(
								0
							)}.</em
						>
					</div>
				{/if}
			{:else}
				<div class="text-center text-green-500 font-bold">ALL ROUND COMPLETE</div>
			{/if}
		</div>

		<MapSettings {game} />

		<div class="p-2 border-t border-zinc-800">
			<details class="text-xs text-zinc-500">
				<summary class="cursor-pointer hover:text-zinc-300">Debug / Manual Override</summary>
				<div class="mt-2 flex flex-col gap-2">
					<button
						class="bg-red-900/50 p-1 rounded hover:bg-red-900"
						onclick={() => game.startShrinking(5)}>Force Shrink (5s)</button
					>
					<div>Target X: {game.targetZone.x.toFixed(1)}</div>
					<div>Target Y: {game.targetZone.y.toFixed(1)}</div>
				</div>
			</details>

			<div class="p-4 border-t border-zinc-800 mt-auto">
				<button
					class="w-full text-xs text-red-900 hover:text-red-500 hover:bg-red-950/30 p-2 rounded transition-colors border border-transparent hover:border-red-900/50"
					onclick={() => {
						if (
							confirm('ARE YOU SURE? This will wipe the current game state and restart at 00:00.')
						) {
							game.resetGame();
						}
					}}
				>
					⚠ RESET CAMPAIGN
				</button>
			</div>
		</div>
	</div>

	<div class="flex-1 flex items-center justify-center rounded-xl shadow-inner">
		<MapCanvas {game} isDm={true} />
	</div>
</div>
