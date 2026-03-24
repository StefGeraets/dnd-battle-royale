<script lang="ts">
	import type { GameEngine } from '../game.svelte';

	type Props = { game: GameEngine };
	let { game }: Props = $props();
</script>

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
