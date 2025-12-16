<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>D&D: Battle Royale - Presenter</title>
</svelte:head>

{@render children()}
