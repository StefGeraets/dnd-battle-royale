<script lang="ts">
	import '../app.css';
	import faviconTouch from '$lib/assets/apple-touch-icon.png';
	import favicon16 from '$lib/assets/favicon-16x16.png';
	import favicon32 from '$lib/assets/favicon-32x32.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="apple-touch-icon" sizes="180x180" href={faviconTouch} />
	<link rel="icon" type="image/png" sizes="32x32" href={favicon32} />
	<link rel="icon" type="image/png" sizes="16x16" href={favicon16} />
	<title>D&D: Battle Royale - DM Command Center</title>
</svelte:head>

{@render children()}
