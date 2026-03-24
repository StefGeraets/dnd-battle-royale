<script lang="ts">
	import type { GameEngine } from '../game.svelte';
	import MapSettings from './MapSettings.svelte';

	type Props = {
		game: GameEngine;
		mode: 'ZONE' | 'CHEST';
		onModeChange: (m: 'ZONE' | 'CHEST') => void;
		volume: number;
		onVolumeChange: (v: number) => void;
		onPlaySound: () => void;
	};

	let { game, mode, onModeChange, volume, onVolumeChange, onPlaySound }: Props = $props();
</script>

<div class="rounded border border-yellow-700/50 bg-zinc-900 p-4 shadow-lg space-y-4">
	<h2 class="text-[10px] font-bold uppercase tracking-wider text-yellow-500 mb-2">
		Pre-Game Configuration
	</h2>

	<div class={game.elapsedTime > 0 ? 'opacity-50' : ''}>
		<label for="gameHours" class="block text-xs text-zinc-400 mb-1">
			Total Game Duration (Hours)
			{#if game.elapsedTime > 0}
				<span class="text-[10px] text-red-400 ml-2">(Locked)</span>
			{/if}
		</label>
		<input
			name="gameHours"
			type="number"
			step="0.5"
			min="0.5"
			max="12"
			disabled={game.elapsedTime > 0}
			value={game.totalGameHours}
			onchange={(e) => game.setTotalTime(+e.currentTarget.value)}
			class="w-full rounded bg-zinc-800 p-1 text-sm text-white border border-zinc-600 disabled:cursor-not-allowed"
		/>
	</div>

	<div class="pt-2 border-t border-zinc-700">
		<MapSettings {game} />
	</div>

	<div class="pt-2 border-t border-zinc-700/50 {game.elapsedTime > 0 ? 'opacity-50' : ''}">
		<p class="mb-1 text-xs text-zinc-400">Preparation</p>
		<button
			class="w-full py-2 px-3 rounded text-sm font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 flex items-center justify-center gap-2"
			onclick={() => onModeChange('CHEST')}
		>
			🎁 Place Loot Chests
		</button>
		{#if mode === 'CHEST'}
			<p class="text-[10px] text-yellow-500/80 mt-1 text-center animate-pulse">
				Click empty grid cells to add chests.
			</p>
		{/if}
	</div>

	<div class="pt-2 border-t border-zinc-700/50">
		<p class="mb-1 text-xs text-zinc-400">Presenter Screen</p>
		<button
			class="w-full py-2 px-3 rounded text-sm font-bold transition-colors {game.isPresenterHidden
				? 'bg-red-600 hover:bg-red-500'
				: 'bg-green-600 hover:bg-green-500'}"
			onclick={() => game.togglePresenterCurtain()}
		>
			{game.isPresenterHidden ? '👁 REVEAL MAP' : '🙈 HIDE MAP'}
		</button>
	</div>

	<div>
		<label for="volume" class="block text-xs text-zinc-400 mb-1">Audio (Warhorn)</label>
		<div class="flex items-center gap-2">
			<button class="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs" onclick={onPlaySound}>
				▶ Test
			</button>
			<input
				name="volume"
				type="range"
				min="0"
				max="1"
				step="0.1"
				value={volume}
				oninput={(e) => onVolumeChange(+e.currentTarget.value)}
				class="flex-1 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
			/>
		</div>
	</div>
</div>
