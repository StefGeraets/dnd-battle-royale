<script lang="ts">
	import { GameEngine } from '$lib/game.svelte';
	import MapCanvas from '$lib/components/MapCanvas.svelte';
	import MapSettings from '$lib/components/MapSettings.svelte';
	import Timeline from '../../lib/components/Timeline.svelte';

	const game = new GameEngine(true);

	let mode = $state<'ZONE' | 'CHEST'>('ZONE');
	let showSetup = $state(true);
	let lastPlayedIndex = -1;

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

	$effect(() => {
		if (game.phase === 'SHRINKING' && game.nextRoundIndex !== lastPlayedIndex) {
			playSound();
			lastPlayedIndex = game.nextRoundIndex;
		}
	});

	function playSound() {
		const audio = new Audio('/warhorn.mp3');
		audio.volume = 0.35;
		audio.play().catch((e) => console.warn('Audio blocked', e));
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	class="flex flex-col h-screen bg-zinc-950 text-white transition-colors duration-1000"
	style="background-color: {game.themeColor}"
>
	<div class="flex flex-1 gap-4 p-4 overflow-hidden">
		<div class="relative z-50 w-80 flex flex-col gap-4 overflow-y-auto">
			<h1 class="border-b border-red-900 pb-2 text-2xl font-bold text-red-500">DM Control</h1>
			<button
				onclick={() => (showSetup = !showSetup)}
				class="text-xs text-zinc-400 hover:text-white"
			>
				{showSetup ? 'Hide Setup' : 'Show Setup'}
			</button>

			{#if showSetup}
				<div class="rounded border border-zinc-700/50 bg-zinc-900 p-4 shadow-lg">
					<h2 class="mb-3 text-xs font-bold uppercase text-yellow-500">Game Setup</h2>

					<div class="mb-4">
						<label for="gameHours" class="block text-xs text-zinc-400 mb-1"
							>Total Game Duration (Hours)</label
						>
						<div class="flex gap-2">
							<input
								name="gameHours"
								type="number"
								step="0.5"
								min="0.5"
								max="12"
								value={game.totalGameHours}
								onchange={(e) => game.setTotalTime(+e.currentTarget.value)}
								class="w-20 rounded bg-zinc-800 p-1 text-sm text-white border border-zinc-600"
							/>
							<div class="text-xs flex items-center text-zinc-500">
								(Ends at {Math.floor(game.totalGameHours * 60)} mins)
							</div>
						</div>
					</div>

					<div class="mb-4">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-xs text-zinc-400 mb-1">Presenter Screen</label>
						<button
							class="w-full py-2 px-3 rounded text-sm font-bold transition-colors {game.isPresenterHidden
								? 'bg-red-600 text-white hover:bg-red-500'
								: 'bg-green-600 text-white hover:bg-green-500'}"
							onclick={() => game.togglePresenterCurtain()}
						>
							{game.isPresenterHidden ? '👁 REVEAL MAP' : '🙈 HIDE MAP'}
						</button>
						<p class="text-[10px] text-zinc-500 mt-1">
							{game.isPresenterHidden
								? 'Players see "Game Begins Soon" screen.'
								: 'Players can see the map.'}
						</p>
					</div>

					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-xs text-zinc-400 mb-1">Preparation</label>
						<button
							class="w-full py-2 px-3 rounded text-sm font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
							onclick={() => (mode = 'CHEST')}
						>
							🎁 Place Chests
						</button>
					</div>
				</div>
			{/if}

			{#if game.distanceOutside > 0}
				<div
					class="animate-pulse rounded border-2 border-red-600 bg-red-800 p-3 text-center shadow-xl"
				>
					<div class="text-xs font-bold uppercase text-red-200">⚠ Party in Storm</div>
					<div class="text-2xl font-black text-white">
						{(game.distanceOutside * 5).toFixed(0)} ft
					</div>
				</div>
			{/if}

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
				<h2 class="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">
					Upcoming Event
				</h2>

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

			<div class="rounded border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
				<h2 class="mb-2 text-xs font-bold uppercase text-gray-400">Interaction Mode</h2>
				<div class="flex gap-2">
					<button
						class="flex-1 py-2 text-sm font-bold rounded {mode === 'ZONE'
							? 'bg-blue-600 text-white'
							: 'bg-zinc-800 text-zinc-400'}"
						onclick={() => (mode = 'ZONE')}
					>
						🎯 Move Zone
					</button>
					<button
						class="flex-1 py-2 text-sm font-bold rounded {mode === 'CHEST'
							? 'bg-yellow-600 text-white'
							: 'bg-zinc-800 text-zinc-400'}"
						onclick={() => (mode = 'CHEST')}
					>
						🎁 Add Chest
					</button>
				</div>
				{#if mode === 'CHEST'}
					<p class="mt-2 text-xs text-yellow-200">Click map to spawn 2x2 chest area.</p>
				{/if}
			</div>

			<MapSettings {game} />

			<div class="mt-auto">
				<button
					class="w-full text-xs text-red-400 bg-red-700/20 hover:text-red-500 hover:bg-red-950/30 p-2 rounded transition-colors border border-transparent hover:border-red-900/50"
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

		<div class="flex-1 flex items-center justify-center rounded-xl shadow-inner">
			<MapCanvas {game} isDm={true} {mode} />
		</div>
	</div>

	<div class="relative z-50">
		<Timeline {game} />
	</div>
</div>
