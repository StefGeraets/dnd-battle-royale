<script lang="ts">
	import { GameEngine } from '$lib/game.svelte';
	import MapCanvas from '$lib/components/MapCanvas.svelte';
	import PresenterCurtain from '../../lib/components/PresenterCurtain.svelte';

	// Initialize Engine as Presenter (Replica)
	const game = new GameEngine(false);
</script>

<div
	class="h-screen w-screen flex items-center justify-center overflow-hidden transition-colors duration-1000"
	style="background-color: {game.themeColor}"
>
	<MapCanvas {game} isDm={false} />

	<PresenterCurtain show={game.isPresenterHidden} />
</div>
