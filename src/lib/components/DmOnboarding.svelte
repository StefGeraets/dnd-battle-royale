<script lang="ts">
	import { fade, scale } from 'svelte/transition';
  import { asset } from '$app/paths';

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
				<h1 class="text-2xl font-bold text-white">Battle Royale DM Command Center</h1>
				<div class="flex items-center gap-2 text-sm text-slate-400">
					<span>Battle Royale Manager v1.0</span>
					<span class="text-slate-600">•</span>
					<a
						href={asset('/WUBG-Homebrewery.pdf')}
						target="_blank"
						class="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
					>
						📄 Open Rulebook (PDF)
					</a>
				</div>
			</div>
			<div class="text-4xl">👑</div>
		</div>

		<div class="overflow-y-auto p-6 space-y-8 text-zinc-300">
			<!-- 1. Hardware setup -->
			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-bold text-yellow-500">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-600/20 text-xs ring-1 ring-yellow-600"
					>
						1
					</span>
					Hardware & Display Setup
				</h2>
				<div class="ml-8 space-y-2 text-sm bg-zinc-800/50 p-4 rounded border border-zinc-800">
					<ul class="list-disc list-outside ml-4 space-y-1">
						<li>Connect your <strong>Second Monitor</strong> or TV (The "Presenter Screen").</li>
						<li>
							Open <a href="/presenter" target="_blank"
								><code
									class="bg-zinc-700 px-1 rounded text-white underline hover:decoration-blue-500 decoration-2 underline-offset-2"
									>/presenter</code
								></a
							> in a new browser window.
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

			<!-- 2. Game Setup -->
			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-bold text-blue-400">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs ring-1 ring-blue-600"
						>2</span
					>
					Game Configuration & Visuals
				</h2>
				<div class="ml-8 text-sm">
					<p class="mb-2">
						Before revealing the map to the players, use the <strong>Setup Panel</strong> in the sidebar
						to:
					</p>
					<ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
						<li class="bg-zinc-800 p-2 rounded border border-zinc-700">
							<strong class="text-white block">⏱ Total Duration</strong>
							Set the game length (e.g., 2.5 hours). The shrink schedule generates automatically based
							on this.
						</li>
						<li class="bg-zinc-800 p-2 rounded border border-zinc-700">
							<strong class="text-white block">🎨 Map & Atmosphere</strong>
							Select a <strong>Map Preset</strong> (Forest, Ruins, etc.) and a
							<strong>Storm Theme</strong> (Fire, Ice, Toxic) to match your campaign.
						</li>
					</ul>
				</div>
			</section>

			<!-- 3. Interactions -->
			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-bold text-green-400">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-green-600/20 text-xs ring-1 ring-green-600"
						>3</span
					>
					Interaction Modes
				</h2>
				<div class="ml-8 space-y-3 text-sm">
					<div class="grid gap-3">
						<div class="flex items-start gap-3">
							<div
								class="min-w-20 rounded border border-blue-900 bg-blue-900/20 p-2 text-center text-xs font-bold text-blue-400"
							>
								🎯 ZONE
							</div>
							<p>
								Click the map to set the <strong>Center</strong> for the next safe zone. You can only
								move the target while the ring is stationary (not shrinking).
							</p>
						</div>
						<div class="flex items-start gap-3">
							<div
								class="min-w-20 rounded border border-yellow-900 bg-yellow-900/20 p-2 text-center text-xs font-bold text-yellow-500"
							>
								🎁 CHEST
							</div>
							<div>
								<p class="mb-1">Click an empty square to place a <strong>2x2 Loot Area</strong>.</p>
								<p>Click an <strong>existing chest</strong> to Rename or Delete it.</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- 4. Running the game -->
			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-bold text-red-500">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-red-600/20 text-xs ring-1 ring-red-600"
					>
						4
					</span>
					Running the Game
				</h2>
				<div class="ml-8 text-sm bg-zinc-800/50 p-4 rounded border border-zinc-800">
					<ol class="list-decimal list-inside space-y-2">
						<li>
							Click <strong class="text-green-400">👁 REVEAL MAP</strong> when players are seated.
						</li>
						<li>Click <strong class="text-green-400">START GAME</strong> to begin the timer.</li>
						<li>
							<strong>Before</strong> the warning countdown appears, use
							<strong class="text-blue-400">🎯 Zone Mode</strong> to click the map and set the next safe
							center.
						</li>
						<ul>
							<li class="pl-4 text-zinc-400 italic">
								Note: Once the countdown starts, the new ring location is revealed to players on the
								main screen!
							</li>
						</ul>
						<li>
							If you don't click, the zone will simply shrink concentrically towards the current
							center.
						</li>
					</ol>
				</div>
			</section>

			<!-- 5. Shortcuts -->
			<section class="space-y-3">
				<h2 class="flex items-center gap-2 text-lg font-bold text-purple-400">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/20 text-xs ring-1 ring-purple-600"
					>
						5
					</span>
					Keyboard Shortcuts
				</h2>
				<div class="ml-8 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
					<div class="rounded bg-zinc-800 p-3 text-center border border-zinc-700">
						<kbd class="rounded bg-zinc-700 px-2 py-1 font-mono text-white border border-zinc-600"
							>SPACE</kbd
						>
						<div class="mt-2 text-xs text-zinc-400">Start / Pause</div>
					</div>
					<div class="rounded bg-zinc-800 p-3 text-center border border-zinc-700">
						<kbd class="rounded bg-zinc-700 px-2 py-1 font-mono text-white border border-zinc-600"
							>Z</kbd
						>
						<div class="mt-2 text-xs text-zinc-400">Zone Mode</div>
					</div>
					<div class="rounded bg-zinc-800 p-3 text-center border border-zinc-700">
						<kbd class="rounded bg-zinc-700 px-2 py-1 font-mono text-white border border-zinc-600"
							>C</kbd
						>
						<div class="mt-2 text-xs text-zinc-400">Chest Mode</div>
					</div>
					<div class="rounded bg-zinc-800 p-3 text-center border border-zinc-700">
						<kbd class="rounded bg-zinc-700 px-2 py-1 font-mono text-white border border-zinc-600"
							>ARROWS</kbd
						>
						<div class="mt-2 text-xs text-zinc-400">Move Party</div>
					</div>
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
