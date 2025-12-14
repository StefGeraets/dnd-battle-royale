<script lang="ts">
	let { show, title = 'The Game Will Begin Soon' } = $props();
</script>

<div
	class="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black text-white transition-opacity duration-1000 {show
		? 'opacity-100 pointer-events-auto'
		: 'opacity-0 pointer-events-none'}"
>
	<h1 class="text-4xl md:text-6xl font-black tracking-widest uppercase animate-pulse text-center">
		Battle Royale
	</h1>
	<div class="mt-4 h-1 w-32 bg-red-600"></div>
	<p class="mt-8 text-slate-400 font-mono tracking-widest text-sm">
		{title}
	</p>
</div>
