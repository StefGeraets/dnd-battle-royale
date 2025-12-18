<script lang="ts">
	import { GameEngine } from '$lib/game.svelte';
	import MapCanvas from '$lib/components/MapCanvas.svelte';
	import PresenterCurtain from '$lib/components/PresenterCurtain.svelte';
	import CountdownOverlay from '$lib/components/CountdownOverlay.svelte';
	import KillFeed from '$lib/components/KillFeed.svelte';

	// Initialize Engine as Presenter (Replica)
	const game = new GameEngine(false);

	let isFullscreen = $state(false);

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().then(() => (isFullscreen = true));
		} else {
			document.exitFullscreen().then(() => (isFullscreen = false));
		}
	}
</script>

<div
	class="h-screen w-screen flex items-center justify-center overflow-hidden transition-colors duration-1000"
	style="background-color: {game.themeColor}"
>
	<MapCanvas {game} isDm={false} />

	<KillFeed {game} />

	<PresenterCurtain show={game.isPresenterHidden} />

	<CountdownOverlay {game} />

	{#if !isFullscreen}
		<button
			class="fixed bottom-4 right-4 z-100 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded backdrop-blur border border-white/20 transition-opacity"
			onclick={toggleFullscreen}>⛶ Fullscreen</button
		>
	{/if}
</div>
