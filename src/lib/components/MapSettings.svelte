<script lang="ts">
	import type { GameEngine } from '$lib/game.svelte';

	type Props = {
		game: GameEngine;
	};

	let { game }: Props = $props();

	function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];

			if (file.size > 3 * 1024 * 1024) {
				alert('Image size is to large');
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				if (typeof e.target?.result === 'string') {
					game.setMapImage(e.target.result);
				}
			};
			reader.readAsDataURL(file);
		}
	}
</script>

<div class="rounded border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
	<h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Map Settings</h2>

	<div class="space-y-4">
		<div>
			<label for="fileUpload" class="mb-1 block text-xs text-zinc-500">Upload Map (Max 3MB)</label>
			<input
				name="fileUpload"
				type="file"
				accept="image/*"
				onchange={handleFileUpload}
				class="block w-full text-xs text-zinc-300 file:mr-4 file:rounded file:border-0 file:bg-zinc-700 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-zinc-600"
			/>
		</div>

		<div>
			<label for="imageUrl" class="mb-1 block text-xs text-zinc-500">Or Image URL</label>
			<input
				name="imageUrl"
				type="text"
				placeholder="https://..."
				value={game.mapImage}
				onchange={(e) => game.setMapImage(e.currentTarget.value)}
				class="w-full rounded bg-zinc-800 p-2 text-xs text-white border border-zinc-700 focus:border-blue-500 outline-none"
			/>
		</div>

		<div>
			<label for="bgColor" class="mb-1 block text-xs text-zinc-500">Ambiance Color</label>
			<div class="flex gap-2">
				<input
					name="bgColor"
					type="color"
					value={game.themeColor}
					oninput={(e) => game.setThemeColor(e.currentTarget.value)}
					class="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
				/>
				<div class="flex-1 text-xs text-zinc-400 flex items-center">
					{game.themeColor}
				</div>
			</div>
		</div>
	</div>
</div>
