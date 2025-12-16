<script lang="ts">
	import { GameEngine } from '$lib/game.svelte';
	import MapCanvas from '$lib/components/MapCanvas.svelte';
	import MapSettings from '$lib/components/MapSettings.svelte';
	import Timeline from '../../lib/components/Timeline.svelte';
	import CountdownOverlay from '../../lib/components/CountdownOverlay.svelte';
	import DmOnboarding from '../../lib/components/DmOnboarding.svelte';
	import { fly, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	const game = new GameEngine(true);

	let mode = $state<'ZONE' | 'CHEST'>('ZONE');
	let lastPlayedIndex = -1;
	let volume = $state(0.5);
	let selectedChestId = $state<string | null>(null);
	let showOnboarding = $state(true); // TODO: Change when live

	let showSetup = $state(true);
	let selectedChest = $derived(
		selectedChestId ? game.specialAreas.find((c) => c.id === selectedChestId) : null
	);

	onMount(() => {
		const hasSeen = localStorage.getItem('dm_onboarding_seen');
		if (hasSeen === 'true') {
			showOnboarding = false;
		}
	});

	$effect(() => {
		if (game.phase === 'SHRINKING' && game.nextRoundIndex !== lastPlayedIndex) {
			playSound();
			lastPlayedIndex = game.nextRoundIndex;
		}
	});

	// Helper to format ms to MM:SS
	function formatTime(ms: number) {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	function closeOnboarding() {
		showOnboarding = false;
		localStorage.setItem('dm_onboarding_seen', 'true');
	}

	function playSound() {
		const audio = new Audio('/warhorn.mp3');
		audio.volume = volume;
		audio.play().catch((e) => console.warn('Audio blocked', e));
	}

	function selectChest(id: string | null) {
		selectedChestId = id;
		if (id) mode = 'CHEST';
	}

	// Keyboard Shortcuts
	function handleKeyDown(e: KeyboardEvent) {
		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
		if (e.target instanceof HTMLInputElement) return;
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
			case 'KeyZ':
				mode = 'ZONE';
				break;
			case 'KeyC':
				mode = 'CHEST';
				break;
			case 'Space':
				e.preventDefault();
				game.toggleTimer();
				break;
			case 'KeyH':
				playSound();
				break;
		}
	}
</script>

<svelte:window
	onkeydown={handleKeyDown}
	onbeforeunload={(e) => {
		if (game.isRunning || game.elapsedTime > 0) {
			e.preventDefault();
			e.returnValue = '';
		}
	}}
/>

<div
	class="flex flex-col h-screen bg-zinc-950 text-white transition-colors duration-1000"
	style="background-color: {game.themeColor}"
>
	{#if showOnboarding}
		<DmOnboarding onClose={closeOnboarding} />
	{/if}

	<CountdownOverlay {game} />

	<div class="flex flex-1 gap-4 p-4 overflow-hidden">
		<div class="relative z-50 w-80 flex flex-col gap-4 overflow-y-auto text-white">
			<div class="flex justify-between items-center border-b border-red-900 pb-2">
				<div class="flex items-center gap-2">
					<h1 class="text-2xl font-bold text-red-500">DM Control</h1>
					<button
						class="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 cursor-pointer"
						onclick={() => (showOnboarding = true)}
						title="Open Guide"
					>
						?
					</button>
				</div>
				<button
					onclick={() => (showSetup = !showSetup)}
					class="text-xs text-zinc-400 hover:text-white"
				>
					{showSetup ? 'Hide Setup' : 'Show Setup'}
				</button>
			</div>

			{#if showSetup}
				<div
					transition:slide
					class="rounded border border-yellow-700/50 bg-zinc-900 p-4 shadow-lg space-y-4"
				>
					<h2 class="text-[10px] font-bold uppercase tracking-wider text-yellow-500 mb-2">
						Pre-Game Configuration
					</h2>

					<div class={game.elapsedTime > 0 ? 'opacity-50' : ''}>
						<label for="gameHours" class="block text-xs text-zinc-400 mb-1">
							Total Game Duration (Hours)
							{#if game.elapsedTime > 0}
								<span class="text-[10px] text-red-400 ml-2">(Locked)</span>
							{/if}
						</label>
						<div class="flex gap-2">
							<input
								name="gameHours"
								type="number"
								step="0.5"
								min="0.5"
								max="12"
								disabled={game.elapsedTime > 0}
								value={game.totalGameHours}
								onchange={(e) => game.setTotalTime(+e.currentTarget.value)}
								class="w-full rounded bg-zinc-800 p-1 text-sm text-white border border-zinc-600 disabled:cursor-not-allowed"
							/>
						</div>
					</div>

					<div class="pt-2 border-t border-zinc-700">
						<MapSettings {game} />
					</div>

					<div class="pt-2 border-t border-zinc-700/50 {game.elapsedTime > 0 ? 'opacity-50' : ''}">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="mb-1 block text-xs text-zinc-400">Preparation</label>
						<button
							class="w-full py-2 px-3 rounded text-sm font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 flex items-center justify-center gap-2"
							onclick={() => (mode = 'CHEST')}
						>
							🎁 Place Loot Chests
						</button>
						{#if mode === 'CHEST'}
							<p class="text-[10px] text-yellow-500/80 mt-1 text-center animate-pulse">
								Click empty grid cells to add chests.
							</p>
						{/if}
					</div>

					<div class="pt-2 border-t border-zinc-700/50">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-xs text-zinc-400 mb-1">Presenter Screen</label>
						<button
							class="w-full py-2 px-3 rounded text-sm font-bold transition-colors {game.isPresenterHidden
								? 'bg-red-600 hover:bg-red-500'
								: 'bg-green-600 hover:bg-green-500'}"
							onclick={() => game.togglePresenterCurtain()}
						>
							{game.isPresenterHidden ? '👁 REVEAL MAP' : '🙈 HIDE MAP'}
						</button>
					</div>

					<div>
						<label for="volume" class="block text-xs text-zinc-400 mb-1">Audio (Warhorn)</label>
						<div class="flex items-center gap-2">
							<button
								class="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs"
								onclick={playSound}
							>
								▶ Test
							</button>
							<input
								name="volume"
								type="range"
								min="0"
								max="1"
								step="0.1"
								bind:value={volume}
								class="flex-1 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
							/>
						</div>
					</div>
				</div>
			{/if}

			{#if game.distanceOutside > 0}
				<div
					transition:fly={{ y: -20 }}
					class="animate-pulse rounded border-2 border-red-600 bg-red-800 p-3 text-center shadow-xl"
				>
					<div class="text-xs font-bold uppercase text-red-200">⚠ Party in Storm</div>
					<div class="text-2xl font-black text-white">
						{(game.distanceOutside * 5).toFixed(0)} ft
					</div>
				</div>
			{/if}

			<div class="overflow-hidden rounded border border-zinc-700 bg-zinc-900 shadow-xl">
				<div
					class="flex itemx-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2"
				>
					<span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400"
						>Mission Clock</span
					>
					<div class="flex items-center gap-2">
						<span
							class="span h-2 w-2 rounded-full {game.isRunning
								? 'bg-green-500 animate-pulse'
								: 'bg-red-500'}"
						></span>
						<span class="text-xs font-bold text-zinc-300">{game.isRunning ? 'LIVE' : 'PAUSED'}</span
						>
					</div>
				</div>

				<div class="p-4">
					<div class="mb-4 text-center font-mono text-5xl font-black tracking-tight text-white">
						{formatTime(game.elapsedTime)}
					</div>

					<div class="mb-4 space-y-1">
						<div class="flex-justify-between text-xs">
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
									style="width: {((game.elapsedTime - game.shrinkStartTime) / game.shrinkDuration) *
										100}%"
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
						onclick={() => {
							if (!game.isRunning && game.elapsedTime === 0) showSetup = false;
							game.toggleTimer();
						}}
					>
						{game.isRunning ? 'PAUSE CLOCK' : 'START CLOCK'}
					</button>
				</div>
			</div>

			<div class="rounded border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
				<h2 class="mb-2 text-xs font-bold uppercase text-zinc-500">Interaction Mode</h2>

				<div class="flex gap-2">
					<button
						class="flex-1 py-2 text-sm font-bold rounded transition-colors {mode === 'ZONE'
							? 'bg-blue-600 text-white'
							: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}"
						onclick={() => (mode = 'ZONE')}
					>
						🎯 Move Zone
					</button>
					<button
						class="flex-1 py-2 text-sm font-bold rounded transition-colors {mode === 'CHEST'
							? 'bg-yellow-600 text-white'
							: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}"
						onclick={() => (mode = 'CHEST')}
					>
						🎁 Add Chest
					</button>
				</div>

				<div class="mt-3 min-h-[60px]">
					{#if selectedChest && mode === 'CHEST'}
						<div
							transition:fly={{ y: -10, duration: 200 }}
							class="rounded border border-yellow-600/30 bg-yellow-900/20 p-3"
						>
							<div class="flex justify-between items-center mb-2">
								<h2 class="text-xs font-bold text-yellow-500">Edit Selected</h2>
								<button
									class="text-xs text-slate-400 hover:text-white"
									onclick={() => (selectedChestId = null)}
								>
									CANCEL
								</button>
							</div>

							<input
								type="text"
								value={selectedChest.name}
								oninput={(e) => game.renameChest(selectedChest.id, e.currentTarget.value)}
								class="w-full rounded bg-zinc-800 p-1 text-xs text-white border border-yellow-700/50 focus:border-yellow-500 outline-none mb-2"
							/>

							<button
								class="w-full py-1 rounded-full text-xs font-bold bg-red-900/30 text-red-300 hover:bg-red-900 border border-red-900/50"
								onclick={() => {
									game.deleteChest(selectedChest.id);
									selectedChestId = null;
								}}
							>
								Delete Area
							</button>
						</div>
					{:else if mode === 'CHEST'}
						<p
							class="text-center text-xs text-yellow-500/80"
							in:slide={{ axis: 'y' }}
							out:slide={{ axis: 'y' }}
						>
							Click empty grid to add 2x2 chest. <br />
							Click existing chest to edit.
						</p>
					{:else}
						<p
							class="text-center text-xs text-blue-400/80"
							in:slide={{ axis: 'y' }}
							out:slide={{ axis: 'y' }}
						>
							Click map to set the next Safe Zone center.<br />(Only active before shrink starts)
						</p>
					{/if}
				</div>
			</div>

			<div class="mt-auto pt-4 border-t border-zinc-800">
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
			<MapCanvas {game} isDm={true} {mode} onSelectChest={selectChest} />
		</div>
	</div>

	<div class="relative z-50">
		<Timeline {game} />
	</div>
</div>
