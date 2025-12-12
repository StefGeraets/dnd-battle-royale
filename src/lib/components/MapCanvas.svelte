<script lang="ts">
	import { GRID_ROWS, GRID_COLS, GameEngine } from '$lib/game.svelte';

	type Props = {
		game: GameEngine;
		isDm?: boolean;
	};

	let { game, isDm = false }: Props = $props();

	// Calculate cell dimensions
	const CELL_WIDTH = 100 / GRID_COLS;
	const CELL_HEIGHT = 100 / GRID_ROWS;

	function handleMapClick(e: MouseEvent) {
		if (!isDm) return;
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;

		const cellX = Math.floor(x / CELL_WIDTH) * CELL_WIDTH + CELL_WIDTH / 2;
		const cellY = Math.floor(y / CELL_HEIGHT) * CELL_HEIGHT + CELL_HEIGHT / 2;

		game.setNextZoneCenter(cellX, cellY);
	}
</script>

<div
	class="relative aspect-square w-full max-w-[85vh] overflow-hidden rounded-lg border-4 border-zinc-900 bg-zinc-800 shadow-2xl"
>
	<img
		src={game.mapImage}
		alt="Battle Map"
		class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
		style="opacity: 0.8;"
	/>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<svg
		viewBox="0 0 100 100"
		class="absolute inset-0 h-full w-full {isDm ? 'cursor-crosshair' : ''}"
		onclick={handleMapClick}
		role="application"
	>
		<defs>
			<filter id="storm-fog" x="0%" y="0%" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
				<feColorMatrix
					type="matrix"
					values="1 0 0 0 0  
									0 0 0 0 0  
									0 0 0 0 0  
									0 0 0 0.4 0"
					in="noise"
					result="coloredNoise"
				/>
				<feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite" />
			</filter>

			<radialGradient id="fadeEdge" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
				<stop offset="90%" stop-color="black" />
				<stop offset="100%" stop-color="white" />
			</radialGradient>

			<mask id="stormMask">
				<rect x="0" y="0" width="100" height="100" fill="white" />

				<g transform="translate({game.currentZone.x}, {game.currentZone.y})">
					<circle r={game.currentZone.r} fill="url(#fadeEdge)" />
				</g>
			</mask>

			<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
				<feGaussianBlur stdDeviation="0.5" result="blur" />
				<feComposite in="SourceGraphic" in2="blur" operator="over" />
			</filter>
		</defs>

		<g stroke="white" stroke-opacity="0.15" stroke-width="0.1">
			{#each Array(GRID_COLS) as _, i}
				<line x1={i * CELL_WIDTH} y1="0" x2={i * CELL_WIDTH} y2="100" />
			{/each}
			{#each Array(GRID_ROWS) as _, i}
				<line x1="0" y1={i * CELL_HEIGHT} x2="100" y2={i * CELL_HEIGHT} />
			{/each}
		</g>

		<rect
			x="0"
			y="0"
			width="100"
			height="100"
			fill="#500000"
			mask="url(#stormMask)"
			filter="url(#storm-fog)"
			class="pointer-events-none opacity-90"
		/>

		<rect
			x="0"
			y="0"
			width="100"
			height="100"
			fill="#330000"
			fill-opacity="0.4"
			mask="url(#stormMask)"
			class="pointer-events-none"
		/>

		{#if isDm || game.phase === 'WARNING' || game.phase === 'SHRINKING'}
			<g class={game.phase === 'WARNING' ? 'animate-pulse' : ''}>
				<circle
					cx={game.targetZone.x}
					cy={game.targetZone.y}
					r={game.targetZone.r}
					fill="none"
					stroke={game.phase === 'SHRINKING' ? '#ff4444' : '#fbbf24'}
					stroke-width={game.phase === 'WARNING' ? '0.6' : '0.3'}
					stroke-dasharray="2 1"
					class="opacity-80 drop-shadow-md"
				/>
			</g>
			{#if isDm}
				<circle cx={game.targetZone.x} cy={game.targetZone.y} r="0.6" fill="#fbbf24" />
			{/if}
		{/if}

		<circle
			cx={game.currentZone.x}
			cy={game.currentZone.y}
			r={game.currentZone.r}
			fill="none"
			stroke="#ff3333"
			stroke-width="0.5"
			filter="url(#glow)"
			class="transition-all duration-75 ease-linear"
		/>

		<g
			transform="translate(
				{game.playerPos.x * CELL_WIDTH + CELL_WIDTH / 2}, 
				{game.playerPos.y * CELL_HEIGHT + CELL_HEIGHT / 2}
			)"
			class="transition-all duration-200 ease-out"
		>
			<circle r={Math.min(CELL_WIDTH, CELL_HEIGHT) * 0.35} fill="black" opacity="0.5" cy="0.5" />

			<circle
				r={Math.min(CELL_WIDTH, CELL_HEIGHT) * 0.35}
				fill="#3b82f6"
				stroke="white"
				stroke-width="0.5"
			/>
			<text
				y={Math.min(CELL_WIDTH, CELL_HEIGHT) * 0.15}
				font-size="2.5"
				text-anchor="middle"
				fill="white"
				font-weight="900"
				style="text-shadow: 0px 1px 2px rgba(0,0,0,0.8); font-family: sans-serif;"
			>
				P
			</text>
		</g>
	</svg>
</div>

<style>
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>
