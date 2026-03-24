<script lang="ts">
	import { GameEngine } from '$lib/game.svelte';
	import MapCanvas from '$lib/components/MapCanvas.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import CountdownOverlay from '$lib/components/CountdownOverlay.svelte';
	import DmOnboarding from '$lib/components/DmOnboarding.svelte';
	import BuyCoffeeToast from '$lib/components/BuyCoffeeToast.svelte';
	import VersionOverlay from '$lib/components/VersionOverlay.svelte';
	import PreGameSetup from '$lib/components/PreGameSetup.svelte';
	import MissionClock from '$lib/components/MissionClock.svelte';
	import InteractionMode from '$lib/components/InteractionMode.svelte';
	// import KillFeed from '$lib/components/KillFeed.svelte';
	import { fly, slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { STORAGE_KEYS } from '$lib/game.config';

	const game = new GameEngine(true);

	let mode = $state<'ZONE' | 'CHEST'>('ZONE');
	let lastPlayedIndex = -1;
	let volume = $state(0.5);
	let selectedChestId = $state<string | null>(null);
	let showOnboarding = $state(true);
	let showDonationPopup = $state(false);
	let donationPopupSeen = $state(false);
	let showSetup = $state(true);

	let selectedChest = $derived(
		selectedChestId ? game.specialAreas.find((c) => c.id === selectedChestId) : null
	);
	let isGameOver = $derived(!game.nextRound && game.elapsedTime > 0);

	const DONATION_POPUP_DELAY_MS = 5 * 60 * 1000;

	onMount(() => {
		if (localStorage.getItem(STORAGE_KEYS.onboardingSeen) === 'true') {
			showOnboarding = false;
		}
	});

	$effect(() => {
		if (game.phase === 'SHRINKING' && game.nextRoundIndex !== lastPlayedIndex) {
			playSound();
			lastPlayedIndex = game.nextRoundIndex;
		}
	});

	$effect(() => {
		if (isGameOver && !donationPopupSeen) {
			const timer = setTimeout(() => (showDonationPopup = true), DONATION_POPUP_DELAY_MS);
			return () => clearTimeout(timer);
		}
	});

	function closeOnboarding() {
		showOnboarding = false;
		localStorage.setItem(STORAGE_KEYS.onboardingSeen, 'true');
	}

	function playSound() {
		const audio = new Audio(asset('/warhorn.mp3'));
		audio.volume = volume;
		audio.play().catch((e) => console.warn('Audio blocked', e));
	}

	function selectChest(id: string | null) {
		selectedChestId = id;
		if (id) mode = 'CHEST';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
		if (e.target instanceof HTMLInputElement) return;

		switch (e.code) {
			case 'ArrowUp': game.movePlayer(0, -1); break;
			case 'ArrowDown': game.movePlayer(0, 1); break;
			case 'ArrowLeft': game.movePlayer(-1, 0); break;
			case 'ArrowRight': game.movePlayer(1, 0); break;
			case 'KeyZ': mode = 'ZONE'; break;
			case 'KeyC': mode = 'CHEST'; break;
			case 'Space': e.preventDefault(); game.toggleTimer(); break;
			case 'KeyH': playSound(); break;
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

	{#if game.engineError}
		<div
			class="fixed top-0 inset-x-0 z-200 flex items-center gap-3 bg-red-700 px-4 py-2 text-sm text-white shadow-lg"
		>
			<span class="font-bold shrink-0">⚠ Engine Error</span>
			<span class="grow">{game.engineError}</span>
			<button
				class="shrink-0 rounded bg-white/20 px-3 py-1 font-bold hover:bg-white/30"
				onclick={() => window.location.reload()}>Reload</button
			>
		</div>
	{/if}

	<VersionOverlay />

	{#if showDonationPopup}
		<BuyCoffeeToast
			onClose={() => {
				showDonationPopup = false;
				donationPopupSeen = true;
			}}
		/>
	{/if}

	<!-- <KillFeed {game} /> -->

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
					class="text-xs text-zinc-400 hover:text-white cursor-pointer"
				>
					{showSetup ? 'Hide Setup' : 'Show Setup'}
				</button>
			</div>

			{#if showSetup}
				<div transition:slide>
					<PreGameSetup
						{game}
						{mode}
						onModeChange={(m) => (mode = m)}
						{volume}
						onVolumeChange={(v) => (volume = v)}
						onPlaySound={playSound}
					/>
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

			<MissionClock
				{game}
				onToggle={() => {
					if (!game.isRunning && game.elapsedTime === 0) showSetup = false;
					game.toggleTimer();
				}}
			/>

			<InteractionMode
				{game}
				{mode}
				onModeChange={(m) => (mode = m)}
				{selectedChest}
				onClearSelection={() => (selectedChestId = null)}
			/>

			<div class="mt-auto pt-4 border-t border-zinc-800">
				<button
					class="w-full text-xs text-red-400 bg-red-700/20 hover:text-red-500 hover:bg-red-950/30 p-2 rounded transition-colors border border-transparent hover:border-red-900/50"
					onclick={() => {
						if (confirm('ARE YOU SURE? This will wipe the current game state and restart at 00:00.')) {
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
