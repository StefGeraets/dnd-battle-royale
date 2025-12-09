<script lang="ts">
	import { GRID_COLS, GRID_ROWS, type GameEngine } from '$lib/game.svelte';

	type Props = {
		game: GameEngine;
		isDm?: boolean;
	};
	let { game, isDm = false }: Props = $props();

	// GRID CONFIG
	const GRID_SIZE = 20;
	const CELL_SIZE = 100 / GRID_SIZE;
	const CELL_WIDTH = 100 / GRID_COLS;
	const CELL_HEIGHT = 100 / GRID_ROWS;

	// DM Interaction: Handle clicking a cell
	function handleMapClick(e: MouseEvent) {
		if (!isDm) return;

		// calc click position
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;

		// snap to grid center
		const cellX = Math.floor(x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
		const cellY = Math.floor(y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;

		// update target zone
		// we keep the current radius, just update center
		game.setNextZoneCenter(cellX, cellY);
	}
</script>

<div
	class="relative aspect-square w-full max-w-[80vh] overflow-hidden rounded shadow-xl border-4 border-zinc-900 bg-zinc-800"
>
	<img
		src="https://placehold.co/1000x1000/2a2a2a/FFF?text=Battle+Map"
		alt="Battle Map"
		class="absolute inset-0 h-full w-full object-cover"
	/>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<svg
		viewBox="0 0 100 100"
		class="absolute inset-0 w-full h-full cursor-crosshair"
		onclick={handleMapClick}
		role="application"
	>
		{#each Array(GRID_SIZE) as _, i}
			<line
				x1={i * CELL_SIZE}
				y1="0"
				x2={i * CELL_SIZE}
				y2="100"
				stroke="white"
				stroke-opacity="0.1"
				stroke-width="0.2"
			/>

			<line
				x1="0"
				y1={i * CELL_SIZE}
				x2="100"
				y2={i * CELL_SIZE}
				stroke="white"
				stroke-opacity="0.1"
				stroke-width="0.2"
			/>
		{/each}

		{#if isDm || game.phase === 'WARNING' || game.phase === 'SHRINKING'}
			<circle
				cx={game.targetZone.x}
				cy={game.targetZone.y}
				r={game.targetZone.r}
				fill="none"
				stroke={game.phase === 'SHRINKING' ? 'red' : 'yellow'}
				stroke-width="0.5"
				stroke-dasharray="2 1"
				class="opacity-60"
			/>

			{#if isDm}
				<circle cx={game.targetZone.x} cy={game.targetZone.y} r="0.5" fill="yellow" />
			{/if}
		{/if}

		<mask id="safeZoneMask">
			<rect x="0" y="0" width="100" height="100" fill="white" />
			<circle cx={game.currentZone.x} cy={game.currentZone.y} r={game.currentZone.r} fill="black" />
		</mask>

		<rect
			x="0"
			y="0"
			width="100"
			height="100"
			fill="red"
			fill-opacity="0.3"
			mask="url(#safeZoneMask)"
			class="pointer-events-none"
		/>

		<circle
			cx={game.currentZone.x}
			cy={game.currentZone.y}
			r={game.currentZone.r}
			fill="none"
			stroke="red"
			stroke-width="0.8"
			class="transition-all duration-75 ease-linear"
		/>

		<g
			transform="translate(
      {game.playerPos.x * CELL_WIDTH + CELL_WIDTH / 2}, 
      {game.playerPos.y * CELL_HEIGHT + CELL_HEIGHT / 2}
    )"
		>
			<circle
				r={Math.min(CELL_WIDTH, CELL_HEIGHT) * 0.35}
				fill="#3b82f6"
				stroke="white"
				stroke-width="0.3"
			/>
			<text
				y={-Math.min(CELL_WIDTH, CELL_HEIGHT) * 0.5}
				font-size="2"
				text-anchor="middle"
				fill="white"
				font-weight="bold">Party</text
			>
		</g>
	</svg>
</div>
