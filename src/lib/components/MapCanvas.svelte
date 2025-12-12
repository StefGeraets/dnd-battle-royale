<script lang="ts">
	import { GRID_ROWS, GRID_COLS, GameEngine } from '$lib/game.svelte';
	import { onMount } from 'svelte';

	type Props = {
		game: GameEngine;
		isDm?: boolean;
	};

	let { game, isDm = false }: Props = $props();

	let mapImageEl: HTMLImageElement;
	let metrics = $state({ x: 0, y: 0, w: 1, h: 1 });

	// Calculate cell dimensions
	const CELL_WIDTH = 100 / GRID_COLS;
	const CELL_HEIGHT = 100 / GRID_ROWS;

	function updateMetrics() {
		if (mapImageEl) {
			const rect = mapImageEl.getBoundingClientRect();
			metrics = {
				x: rect.left,
				y: rect.top,
				w: rect.width,
				h: rect.height
			};
		}
	}

	onMount(() => {
		updateMetrics();
		window.addEventListener('resize', updateMetrics);
		return () => window.removeEventListener('resize', updateMetrics);
	});

	function handleMapClick(e: MouseEvent) {
		if (!isDm) return;

		// 1. Calculate click relative to the IMAGE (metrics), not the screen
		const relX = e.clientX - metrics.x;
		const relY = e.clientY - metrics.y;

		// 2. Convert to 0-100 scale
		const scaleX = (relX / metrics.w) * 100;
		const scaleY = (relY / metrics.h) * 100;

		// 3. Ignore clicks outside the actual map image area
		if (scaleX < 0 || scaleX > 100 || scaleY < 0 || scaleY > 100) return;

		// 4. Snap to Grid
		const cellX = Math.floor(scaleX / CELL_WIDTH) * CELL_WIDTH + CELL_WIDTH / 2;
		const cellY = Math.floor(scaleY / CELL_HEIGHT) * CELL_HEIGHT + CELL_HEIGHT / 2;

		game.setNextZoneCenter(cellX, cellY);
	}
</script>

<div class="relative flex items-center justify-center w-full h-full overflow-hidden bg-zinc-950">
	<img
		bind:this={mapImageEl}
		src={game.mapImage}
		alt="Battle Map"
		class="max-h-screen max-w-full object-contain shadow-2xl transition-opacity duration-500"
		style="opacity: 0.8;"
		onload={updateMetrics}
	/>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<svg
		class="fixed inset-0 z-10 h-full w-full {isDm
			? 'cursor-crosshair pointer-events-auto'
			: 'pointer-events-none'}"
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

			<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
				<feGaussianBlur stdDeviation="0.5" result="blur" />
				<feComposite in="SourceGraphic" in2="blur" operator="over" />
			</filter>

			<mask id="fsStormMask">
				<rect x="0" y="0" width="100" height="100" fill="white" />

				<g transform="translate({metrics.x}, {metrics.y})">
					<g transform="scale({metrics.w / 100}, {metrics.h / 100})">
						<circle
							cx={game.currentZone.x}
							cy={game.currentZone.y}
							r={game.currentZone.r}
							fill="url(#fadeEdge)"
						/>
					</g>
				</g>
			</mask>
		</defs>

		<rect
			x="0"
			y="0"
			width="100%"
			height="100%"
			fill="#500000"
			mask="url(#fsStormMask)"
			filter="url(#storm-fog)"
			class="opacity-90"
		/>

		<rect
			x="0"
			y="0"
			width="100%"
			height="100%"
			fill="#330000"
			fill-opacity="0.4"
			mask="url(#fsStormMask)"
		/>

		<g transform="translate({metrics.x}, {metrics.y}) scale({metrics.w / 100}, {metrics.h / 100})">
			<g stroke="white" stroke-opacity="0.15" stroke-width="0.1">
				{#each Array(GRID_COLS) as _, i}
					<line x1={i * CELL_WIDTH} y1="0" x2={i * CELL_WIDTH} y2="100" />
				{/each}
				{#each Array(GRID_ROWS) as _, i}
					<line x1="0" y1={i * CELL_HEIGHT} x2="100" y2={i * CELL_HEIGHT} />
				{/each}
			</g>

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
