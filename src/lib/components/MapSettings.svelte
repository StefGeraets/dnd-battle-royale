<script lang="ts">
	import type { GameEngine } from '$lib/game.svelte';
	import { MAP_PRESETS, STORM_THEMES } from '../game.config';

	type Props = {
		game: GameEngine;
	};

	let { game }: Props = $props();

	const ENABLE_CUSTOM_UPLOAD = false;

	let isLocked = $derived(game.elapsedTime > 0);

	// function handleFileUpload(e: Event) {
	// 	const input = e.target as HTMLInputElement;
	// 	if (input.files && input.files[0]) {
	// 		const file = input.files[0];

	// 		if (file.size > 3 * 1024 * 1024) {
	// 			alert('Image size is to large');
	// 			return;
	// 		}

	// 		const reader = new FileReader();
	// 		reader.onload = (e) => {
	// 			if (typeof e.target?.result === 'string') {
	// 				game.setMapImage(e.target.result);
	// 			}
	// 		};
	// 		reader.readAsDataURL(file);
	// 	}
	// }
</script>

<div class="rounded bg-zinc-900 shadow-lg space-y-4">
	<h2 class="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
		<span>Map & Atmosphere</span>
		{#if isLocked}
			<span class="text-red-500 flex items-center gap-1">🔒 Locked</span>
		{/if}
	</h2>

	<div class={isLocked ? 'opacity-50 pointer-events-none grayscale' : ''}>
		<label for="stormType" class="mb-2 block text-xs text-zinc-500">Storm Type</label>
		<div class="grid grid-cols-3 gap-2">
			{#each Object.values(STORM_THEMES) as theme}
				<button
					disabled={isLocked}
					class="rounded border px-2 py-1 text-xs font-bold transition-all cursor-pointer text-white {game.stormThemeId ===
					theme.id
						? 'scale-105 shadow-md'
						: 'opacity-60 hover:opacity-100'}"
					style="background-color: {theme.primary}; border-color: {theme.accent};"
					onclick={() => game.setStormTheme(theme.id)}
				>
					{theme.label}
				</button>
			{/each}
		</div>
	</div>

	<div class={isLocked ? 'opacity-50 pointer-events-none grayscale' : ''}>
		<label for="mapPreset" class="mb-2 block text-xs text-zinc-500">Select Map</label>
		<div class="grid grid-cols-1 gap-2">
			{#each MAP_PRESETS as preset}
				<button
					disabled={isLocked}
					class="flex items-center gap-3 rounded bg-zinc-800 p-2 border border-zinc-700 hover:bg-zinc-700 text-left transition-colors cursor-pointer
          {game.mapImage === preset.url ? 'border-blue-500 ring-1 ring-blue-500' : ''}"
					onclick={() => game.applyMapPreset(preset)}
				>
					<div
						class="h-8 w-8 rounded bg-cover bg-center"
						style="background-image: url({preset.url})"
					></div>
					<span class="text-xs font-bold text-zinc-200">{preset.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- <div
		class="relative rounded border border-zinc-700 border-dashed p-4 text-center opacity-75 {isLocked
			? 'opacity-30'
			: ''}"
	>
		{#if !ENABLE_CUSTOM_UPLOAD}
			<div
				class="absolute inset-0 z-10 flex items-center justify-center rounded bg-zinc-900/80 backdrop-blur-[1px]"
			>
				<div class="text-center">
					<div class="text-xs font-bold text-yellow-500 mb-1">⭐ Supporter Feature</div>
					<button
						class="bg-yellow-600 hover:bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded"
					>
						Unlock Custom Maps
					</button>
				</div>
			</div>
		{/if}

		<div class="opacity-30 blur-[1px]">
			<label for="upload" class="mb-1 block text-xs text-zinc-500">Upload Map</label>
			<input name="upload" type="file" disabled class="block w-full text-xs text-zinc-500" />
		</div>
	</div>

	<div>
		<details class="text-[10px] text-zinc-600">
			<summary class="cursor-pointer hover:text-zinc-400">Advanced: Manual Theme Color</summary>
			<div class="mt-2 flex gap-2">
				<input
					type="color"
					value={game.themeColor}
					oninput={(e) => game.setThemeColor(e.currentTarget.value)}
					class="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
				/>
				<span class="text-xs text-zinc-400">Background Tint</span>
			</div>
		</details>
	</div> -->

	{#if isLocked}
		<div class="mt-2 rounded bg-zinc-800 p-2 text-center text-[10px] text-zinc-400">
			Settings locked while game is active. <br />
			<span class="text-zinc-500">Reset campaign to edit.</span>
		</div>
	{/if}
</div>
