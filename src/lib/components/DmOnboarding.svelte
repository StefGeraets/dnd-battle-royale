<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	type Props = {
		onClose: () => void;
	};
	let { onClose }: Props = $props();
</script>

<div
	transition:fade={{ duration: 200 }}
	class="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
>
	<div
		transition:scale={{ start: 0.95, duration: 200 }}
		class="w-full max-w-3xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
	>
		<div class="border-b border-zinc-800 bg-zinc-950 p-6 flex justify-between items-center">
			<div>
				<h1 class="text-2xl font-bold text-white">Battle Royale DM Console</h1>
				<p class="text-sm text-zinc-400">Version 1.0 + Setup Guide</p>
			</div>
			<div class="text-4xl">👑</div>
		</div>

		<div class="overflow-y-auto p-6 space-y-8 text-zinc-300">
			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-bold text-yellow-500">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-600/20 text-xs ring-1 ring-yellow-600"
						>1</span
					>
					Hardware & Display Setup
				</h2>
				<div class="ml-8 space-y-2 text-sm bg-zinc-800/50 p-4 rounded border border-zinc-800">
					<ul class="list-disc list-outside ml-4 space-y-1">
						<li>Connect your <strong>Second Monitor</strong> or TV (The "Presenter Screen").</li>
						<li>
							Open <code class="bg-zinc-700 px-1 rounded text-white">/presenter</code> in a new browser
							window.
						</li>
						<li>
							Drag that window to the second screen and press <kbd
								class="bg-zinc-700 px-1 rounded text-white font-mono">F11</kbd
							> for Fullscreen.
						</li>
						<li>Keep this window (DM View) on your laptop or PC.</li>
					</ul>
				</div>
			</section>

			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-bold text-blue-400">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs ring-1 ring-blue-600"
						>2</span
					>
					Game Configuration
				</h2>
				<div class="ml-8 text-sm">
					<p class="mb-2">
						Before revealing the map to the players, use the <strong>Setup Panel</strong> in the sidebar
						to:
					</p>
					<ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
						<li class="bg-zinc-800 p-2 rounded border border-zinc-700">
							<strong class="text-white block">⏱ Total Duration</strong>
							Set the game length (e.g., 2.5 hours). The Shrink Schedule is automatically calculated from
							this.
						</li>
						<li class="bg-zinc-800 p-2 rounded border border-zinc-700">
							<strong class="text-white block">🎨 Map & Theme</strong>
							Choose a map preset and a Storm Theme (Fire, Ice, Toxic, etc.).
						</li>
					</ul>
				</div>
			</section>

			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-bold text-green-500">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-green-600/20 text-xs ring-1 ring-green-600"
						>3</span
					>
					Loot & Special Areas
				</h2>
				<div class="ml-8 space-y-3 text-sm">
					<p>
						Switch the Interaction Mode to <strong
							class="text-yellow-400 bg-yellow-900/30 px-1 rounded">🎁 Chest</strong
						>.
					</p>
					<div class="grid gap-3">
						<div class="flex gap-3 items-start">
							<div
								class="bg-zinc-800 p-2 rounded min-w-[60px] text-center text-xs font-bold border border-zinc-600"
							>
								Click Empty
							</div>
							<p>Creates a new <strong>2x2 Special Area</strong> (Chest) at that location.</p>
						</div>
						<div class="flex gap-3 items-start">
							<div
								class="bg-zinc-800 p-2 rounded min-w-[60px] text-center text-xs font-bold border border-zinc-600"
							>
								Click Chest
							</div>
							<p>
								Selects the chest. An <strong>Edit Panel</strong> will appear in the sidebar
								allowing you to <span class="text-white">Rename</span> or
								<span class="text-red-400">Delete</span> it.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-bold text-red-500">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-red-600/20 text-xs ring-1 ring-red-600"
						>4</span
					>
					Running the Game
				</h2>
				<div class="ml-8 text-sm bg-zinc-800/50 p-4 rounded border border-zinc-800">
					<ol class="list-decimal list-inside space-y-2">
						<li>
							Click <strong class="text-green-400">👁 REVEAL MAP</strong> when players are seated.
						</li>
						<li>Click <strong class="text-green-400">START GAME</strong> to begin the timer.</li>
						<li>
							When the <strong>Warning Countdown</strong> appears (Top Center), click the map in
							<strong class="text-blue-400">🎯 Zone Mode</strong> to choose the next safe center.
						</li>
						<li>If you don't click, it shrinks concentrically (to the current center).</li>
					</ol>
				</div>
			</section>
		</div>

		<div class="border-t border-zinc-800 bg-zinc-950 p-6 flex justify-end gap-3">
			<button
				class="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-900/20 cursor-pointer"
				onclick={onClose}
			>
				Let's Play
			</button>
		</div>
	</div>
</div>
