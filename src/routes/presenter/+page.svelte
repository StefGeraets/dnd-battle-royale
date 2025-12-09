<script lang="ts">
	import { GameEngine } from '$lib/game.svelte';
	import MapCanvas from '$lib/components/MapCanvas.svelte';

	// Initialize Engine as Presenter (Replica)
	const game = new GameEngine(false);
</script>

<div class="h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
	<MapCanvas {game} isDm={false} />
</div>
