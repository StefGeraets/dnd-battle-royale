<script lang="ts">
	import type { GameEngine, SpecialArea } from '../game.svelte';
	import { fly, slide } from 'svelte/transition';
	import Icon from './Icon.svelte';

	type Props = {
		game: GameEngine;
		mode: 'ZONE' | 'CHEST';
		onModeChange: (m: 'ZONE' | 'CHEST') => void;
		selectedChest: SpecialArea | null | undefined;
		onClearSelection: () => void;
	};

	let { game, mode, onModeChange, selectedChest, onClearSelection }: Props = $props();
</script>

<div class="rounded border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
	<h2 class="mb-2 text-xs font-bold uppercase text-zinc-500">Interaction Mode</h2>

	<div class="flex gap-2">
		<button
			class="flex-1 py-2 text-sm font-bold rounded transition-colors {mode === 'ZONE'
				? 'bg-blue-600 text-white'
				: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}"
			onclick={() => onModeChange('ZONE')}
		>
			<Icon name="crosshair" size="16" /> Move Zone
		</button>
		<button
			class="flex-1 py-2 text-sm font-bold rounded transition-colors {mode === 'CHEST'
				? 'bg-yellow-600 text-white'
				: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}"
			onclick={() => onModeChange('CHEST')}
		>
			<Icon name="gift" size="16" /> Add Chest
		</button>
	</div>

	<div class="mt-3 min-h-15">
		{#if selectedChest && mode === 'CHEST'}
			<div
				transition:fly={{ y: -10, duration: 200 }}
				class="rounded border border-yellow-600/30 bg-yellow-900/20 p-3"
			>
				<div class="flex justify-between items-center mb-2">
					<h3 class="text-xs font-bold text-yellow-500">Edit Selected</h3>
					<button class="text-xs text-slate-400 hover:text-white" onclick={onClearSelection}>
						CANCEL
					</button>
				</div>

				<input
					type="text"
					value={selectedChest.name}
					oninput={(e) => game.renameChest(selectedChest!.id, e.currentTarget.value)}
					class="w-full rounded bg-zinc-800 p-1 text-xs text-white border border-yellow-700/50 focus:border-yellow-500 outline-none mb-2"
				/>

				<button
					class="w-full py-1 rounded-full text-xs font-bold bg-red-900/30 text-red-300 hover:bg-red-900 border border-red-900/50"
					onclick={() => {
						game.deleteChest(selectedChest!.id);
						onClearSelection();
					}}
				>
					Delete Area
				</button>
			</div>
		{:else if mode === 'CHEST'}
			<p
				class="text-center text-xs text-yellow-500/80"
				in:slide={{ axis: 'y' }}
				out:slide={{ axis: 'y' }}
			>
				Click empty grid to add 2x2 chest. <br />
				Click existing chest to edit.
			</p>
		{:else}
			<p
				class="text-center text-xs text-blue-400/80"
				in:slide={{ axis: 'y' }}
				out:slide={{ axis: 'y' }}
			>
				Click map to set the next Safe Zone center.<br />(Only active before shrink starts)
			</p>
		{/if}
	</div>
</div>
