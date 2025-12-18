<script lang="ts">
	import { fly } from 'svelte/transition';
	import { DONATION_URL } from '../game.config';
	let { onClose } = $props();
</script>

<div
	transition:fly={{ y: 20, duration: 500 }}
	class="fixed bottom-6 right-6 z-100 flex max-w-md items-start gap-4 rounded-xl border border-yellow-500/30 bg-zinc-900/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-md"
>
	<div
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 text-xl text-black shadow-lg"
	>
		☕
	</div>

	<div class="flex-1 space-y-1">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-bold uppercase tracking-wide text-white">Session Complete!</h3>
			<button
				onclick={onClose}
				class="ml-2 -mt-1 text-zinc-500 hover:text-white cursor-pointer"
				aria-label="Dismiss"
			>
				✕
			</button>
		</div>

		<p class="text-sm leading-relaxed text-zinc-300">
			Hope the battle was legendary! If you enjoyed this tool, consider fueling the next update.
		</p>

		<a
			href={DONATION_URL}
			target="_blank"
			class="mt-2 inline-flex items-center gap-2 text-md font-bold text-yellow-500 transition-colors hover:text-yellow-400 hover:underline"
		>
			<span>Support Development</span>
			<span>→</span>
		</a>
	</div>
</div>
