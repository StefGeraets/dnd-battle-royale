<script lang="ts">
	import { GameEngine } from '$lib/game.svelte';
	import MapCanvas from '$lib/components/MapCanvas.svelte';
	import PresenterCurtain from '$lib/components/PresenterCurtain.svelte';
	import CountdownOverlay from '$lib/components/CountdownOverlay.svelte';
	import { onMount } from 'svelte';
	// import KillFeed from '$lib/components/KillFeed.svelte';

	// Initialize Engine as Presenter (Replica)
	const game = new GameEngine(false);

	let isFullscreen = $state(false);

	onMount(() => {
		const onFullscreenChange = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', onFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
	});

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((e) =>
				console.warn('[Presenter] Fullscreen request denied:', e)
			);
		} else {
			document.exitFullscreen().catch((e) =>
				console.warn('[Presenter] Exit fullscreen failed:', e)
			);
		}
	}
</script>

<div
	class="h-screen w-screen flex items-center justify-center overflow-hidden transition-colors duration-1000"
	style="background-color: {game.themeColor}"
>
	<MapCanvas {game} isDm={false} />

	<!-- <KillFeed {game} /> -->

	<PresenterCurtain show={game.isPresenterHidden} />

	<CountdownOverlay {game} />

	{#if !isFullscreen}
		<button
			class="fixed bottom-4 right-4 z-100 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded backdrop-blur border border-white/20 transition-opacity"
			aria-label="Enter fullscreen"
		onclick={toggleFullscreen}>⛶ Fullscreen</button
		>
	{/if}
</div>
