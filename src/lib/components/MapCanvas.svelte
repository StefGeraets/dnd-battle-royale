<script lang="ts">
	import { onMount } from 'svelte';
	import { GameEngine } from '$lib/game.svelte';
	import { GRID_SIZE, STORM_THEMES } from '../game.config';

	type Props = {
		game: GameEngine;
		isDm?: boolean;
		mode?: 'ZONE' | 'CHEST';
		onSelectChest?: (id: string | null) => void;
	};

	let {
		game,
		isDm = false,
		mode = 'ZONE',
		onSelectChest = (id: string | null) => {}
	}: Props = $props();

	// We track the Image's position on screen to align the SVG
	let mapImageEl: HTMLImageElement;
	let metrics = $state({ x: 0, y: 0, s: 1 }); // Default to 1 to avoid div/0
	let theme = $derived(STORM_THEMES[game.stormThemeId] || STORM_THEMES['fire']);
	let stormRgb = $derived(hexToRgb(theme.primary));

	function updateMetrics() {
		if (mapImageEl) {
			const rect = mapImageEl.getBoundingClientRect();
			metrics = {
				x: rect.left,
				y: rect.top,
				s: rect.width
			};
		}
	}

	onMount(() => {
		// Calculate on load and resize
		updateMetrics();
		window.addEventListener('resize', updateMetrics);
		return () => window.removeEventListener('resize', updateMetrics);
	});

	// Constants
	const CELL_SIZE = 100 / GRID_SIZE;

	function handleMapClick(e: MouseEvent) {
		if (!isDm) return;

		// 1. Calculate click relative to the IMAGE (metrics), not the screen
		const relX = e.clientX - metrics.x;
		const relY = e.clientY - metrics.y;

		const rect = (e.currentTarget as SVGSVGElement)?.getBoundingClientRect();

		// 2. Convert to 0-100 scale
		const scaleX = (relX / metrics.s) * 100;
		const scaleY = (relY / metrics.s) * 100;

		// 3. Ignore clicks outside the actual map image area
		if (scaleX < 0 || scaleX > 100 || scaleY < 0 || scaleY > 100) return;

		const gridX = Math.floor(scaleX / CELL_SIZE);
		const gridY = Math.floor(scaleY / CELL_SIZE);

		if (mode === 'CHEST') {
			// 1. Check if we clicked ON an existing chest
			const clickedChest = game.specialAreas.find((c) => {
				// Chest covers x, x+1 and y, y+1
				return gridX >= c.x && gridX <= c.x + 1 && gridY >= c.y && gridY <= c.y + 1;
			});

			if (clickedChest) {
				onSelectChest(clickedChest.id);
			} else {
				game.addChest(gridX, gridY);
				// Also clear selection if we place a new one
				onSelectChest(null);
			}
		} else {
			// Zone mode
			const centerX = gridX * CELL_SIZE + CELL_SIZE / 2;
			const centerY = gridY * CELL_SIZE + CELL_SIZE / 2;
			game.setNextZoneCenter(centerX, centerY);
		}
	}

	function hexToRgb(hex: string) {
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16) / 255,
					g: parseInt(result[2], 16) / 255,
					b: parseInt(result[3], 16) / 255
				}
			: { r: 1, g: 0, b: 0 };
	}
</script>

<div class="relative flex h-full w-full items-center justify-center overflow-hidden">
	<img
		bind:this={mapImageEl}
		src={game.mapImage}
		alt="Battle Map"
		class="max-h-screen max-w-full shadow-2xl transition-opacity duration-500 aspect-square object-cover"
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
					values="{stormRgb.r} 0 0 0 0
									0 {stormRgb.g} 0 0 0
									0 0 {stormRgb.b} 0 0 
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
				<feGaussianBlur stdDeviation="2" result="blur" />
				<feComposite in="SourceGraphic" in2="blur" operator="over" />
			</filter>

			<mask id="fsStormMask">
				<rect x="0" y="0" width="100%" height="100%" fill="white" />

				<g transform="translate({metrics.x}, {metrics.y})">
					<g transform="scale({metrics.s / 100})">
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
			fill={theme.primary}
			mask="url(#fsStormMask)"
			filter="url(#storm-fog)"
			class="opacity-90 transition-colors duration-1000"
		/>
		<rect
			x="0"
			y="0"
			width="100%"
			height="100%"
			fill={theme.secondary}
			fill-opacity="0.5"
			mask="url(#fsStormMask)"
			class="transition-colors duration-1000"
		/>

		<g transform="translate({metrics.x}, {metrics.y}) scale({metrics.s / 100})">
			<!-- grid lines -->
			<g stroke="white" stroke-opacity="0.15" stroke-width="0.1">
				{#each Array(GRID_SIZE + 1) as _, i}
					<line x1={i * CELL_SIZE} y1="0" x2={i * CELL_SIZE} y2="100" />
				{/each}
				{#each Array(GRID_SIZE + 1) as _, i}
					<line x1="0" y1={i * CELL_SIZE} x2="100" y2={i * CELL_SIZE} />
				{/each}
			</g>

			<!-- special areas -->
			{#each game.specialAreas as area}
				<g transform="translate({area.x * CELL_SIZE}, {area.y * CELL_SIZE})" class="outline-0">
					<rect
						width={CELL_SIZE * 2}
						height={CELL_SIZE * 2}
						fill="#facc15"
						fill-opacity="0.02"
						stroke="#facc15"
						stroke-width="0.2"
						stroke-dasharray="1 0.5"
					/>
					<text
						x={CELL_SIZE}
						y="-1.25"
						text-anchor="middle"
						dominant-baseline="middle"
						font-size="1.5"
						font-weight="bold"
						fill="white"
						stroke="black"
						stroke-width="0.05"
					>
						{area.name}
					</text>
				</g>
			{/each}

			{#if isDm || game.phase === 'WARNING' || game.phase === 'SHRINKING'}
				<g class={game.phase === 'WARNING' ? 'animate-pulse' : ''}>
					<circle
						cx={game.targetZone.x}
						cy={game.targetZone.y}
						r={game.targetZone.r}
						fill="none"
						stroke={game.phase === 'SHRINKING' ? '#ff4444' : '#fbbf24'}
						stroke-width="0.3"
						stroke-dasharray="2 1"
						class="opacity-80"
					/>
				</g>
				{#if isDm}
					<circle cx={game.targetZone.x} cy={game.targetZone.y} r="0.6" fill="#fbbf24" />
				{/if}
			{/if}

			{#if isDm && game.isPresenterHidden}
				<g transform="translate(38, 85)">
					<rect width="20" height="6" rx="1" fill="red" opacity="0.8" />
					<text x="10" y="4" font-size="3" text-anchor="middle" fill="white" font-weight="bold"
						>HIDDEN</text
					>
				</g>
			{/if}

			<circle
				cx={game.currentZone.x}
				cy={game.currentZone.y}
				r={game.currentZone.r}
				fill="none"
				stroke={theme.accent}
				stroke-width="0.5"
				filter="url(#glow)"
				class="transition-colors duration-1000"
			/>

			<g
				transform="translate(
                {game.playerPos.x * CELL_SIZE + CELL_SIZE / 2}, 
                {game.playerPos.y * CELL_SIZE + CELL_SIZE / 2}
            )"
			>
				<circle r={Math.min(CELL_SIZE, CELL_SIZE) * 0.35} fill="black" opacity="0.5" cy="0.5" />
				<circle
					r={Math.min(CELL_SIZE, CELL_SIZE) * 0.35}
					fill="#3b82f6"
					stroke="white"
					stroke-width="0.5"
				/>
				<text y="1" font-size="2.5" text-anchor="middle" fill="white" font-weight="900">P</text>
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
			opacity: 0.2;
		}
	}
</style>
