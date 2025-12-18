<script lang="ts">
    import { fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import type { GameEngine } from '$lib/game.svelte';

    let { game } = $props<{ game: GameEngine }>();
</script>

<div class="absolute right-4 top-4 z-30 flex flex-col items-end gap-2 overflow-hidden">
	<div
		class="flex items-center gap-3 rounded-xl border border-red-900/50 bg-black/80 px-5 py-3 shadow-2xl backdrop-blur"
	>
		<div class="text-right">
			<div class="text-[10px] font-bold uppercase tracking-widest text-red-500">Combatants</div>
			<div class="text-xs text-zinc-500">Remaining</div>
		</div>
		<div class="font-mono text-5xl font-black text-white tabular-nums">
			{game.remainingCombatants}
		</div>
	</div>

	<div class="flex flex-col gap-2 pt-2">
		{#each game.killFeed as kill (kill.id)}
			<div
				animate:flip={{ duration: 300 }}
				transition:fly|local={{ x: 50, duration: 300 }}
				class="relative overflow-hidden rounded p-2"
			>
				<div class="flex items-baseline justify-end gap-2 text-sm text-zinc-200 text-shadow-xs">
					{@html kill.msg}
				</div>
			</div>
		{/each}
	</div>
</div>
