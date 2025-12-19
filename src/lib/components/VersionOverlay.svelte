<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { APP_VERSION } from '$lib/app-metadata';
	import { latestRelease, RELEASES, ROADMAP, type RoadmapItem } from '$lib/release-notes';

	const appVersion: string = APP_VERSION;
	const STORAGE_KEY = 'dm_version_seen';

	let show = $state(false);

	onMount(() => {
		try {
			const lastSeen = localStorage.getItem(STORAGE_KEY);
			if (lastSeen !== appVersion) {
				show = true;
			}
		} catch {
			// Ignore storage errors (e.g. SSR or private mode)
			show = true;
		}
	});

	const roadmapStatus = $derived.by<{ item: RoadmapItem; done: boolean }[]>(() => {
		const completedIds = new Set<string>();
		for (const r of RELEASES) {
			for (const id of r.completedUpcoming ?? []) {
				completedIds.add(id);
			}
		}
		return ROADMAP.map((item) => ({
			item,
			done: completedIds.has(item.id)
		}));
	});

	function close() {
		show = false;
		
    localStorage.setItem(STORAGE_KEY, appVersion);
		
	}
</script>

{#if show}
	<div
		class="pointer-events-none fixed inset-0 z-50 flex items-start justify-center overflow-y-scroll"
	>
		<div
			class="pointer-events-auto mt-6 mb-24 w-full max-w-md px-4"
			transition:fly={{ y: -20, duration: 200 }}
		>
			<div
				class="rounded-2xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-sm text-xs text-zinc-100 space-y-3"
			>
				<div class="mb-2 flex items-start justify-between gap-2">
					<div>
						<div class="text-md font-bold uppercase tracking-[0.2em] text-zinc-500">
							Release Notes
						</div>
						<div class="text-sm text-zinc-400">
							Version <span class="font-mono font-semibold text-zinc-100">{appVersion}</span>
							{#if latestRelease.date}
								<span class="text-zinc-600"> · {latestRelease.date}</span>
							{/if}
						</div>
					</div>
					<button
						class="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs uppercase tracking-wide text-zinc-400 hover:border-zinc-500 hover:text-zinc-100 cursor-pointer"
						onclick={close}
					>
						Close
					</button>
				</div>

				<!-- All releases, newest first -->
				<div class="space-y-2">
					{#each RELEASES as release, i}
						<div
							class={`rounded-lg border p-2 ${
								i === 0
									? 'border-emerald-500/70 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
									: 'border-zinc-700 bg-zinc-900/60'
							}`}
						>
							<div class="mb-1 flex items-center justify-between gap-2">
								<div class="flex items-start gap-2">
									<span class="font-mono text-md font-semibold text-zinc-100">
										v{release.version}
									</span>
									{#if i === 0}
										<span
											class="rounded-full bg-emerald-600/20 px-2 py-px text-[10px] font-semibold uppercase tracking-wide text-emerald-300"
											>Latest</span
										>
									{/if}
								</div>
								{#if release.date}
									<span class="text-xs text-zinc-500">{release.date}</span>
								{/if}
							</div>

							{#if release.summary}
								<p class="mb-2 text-md text-zinc-300">
									{release.summary}
								</p>
							{/if}

							{#if release.features?.length}
								<div
									class="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 mb-0.5"
								>
									New in this version
								</div>
								<ul class="space-y-1 text-xs text-zinc-200">
									{#each release.features as f}
										<li class="flex items-start gap-2">
											<span class="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
											<span>{f}</span>
										</li>
									{/each}
								</ul>
							{/if}

							{#if release.completedUpcoming && release.completedUpcoming.length}
								<div class="mt-2 border-t border-zinc-800 pt-2">
									<div
										class="text-[10px] font-semibold uppercase tracking-wide text-sky-400 mb-0.5"
									>
										Completed from roadmap
									</div>
									<ul class="space-y-1 text-xs text-zinc-200">
										{#each release.completedUpcoming as id}
											{@const item: RoadmapItem | undefined = ROADMAP.find((r) => r.id === id)}
											{#if item}
												<li class="flex items-start gap-2">
													<span
														class="mt-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-black"
														>✓</span
													>
													<span>{item.label}</span>
												</li>
											{/if}
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Global roadmap, shown once -->
				{#if roadmapStatus.length}
					<div class="mt-2 border-t border-zinc-800 pt-2">
						<div class="mb-1 flex items-center justify-between gap-2">
							<div class="text-xs font-semibold uppercase tracking-wide text-sky-400">Roadmap</div>
							<div class="text-[11px] text-zinc-500">
								<span class="text-emerald-400">
									{roadmapStatus.filter((rs) => rs.done).length}
								</span>
								/
								<span>{roadmapStatus.length}</span>
								completed
							</div>
						</div>
						<ul class="space-y-0.5">
							{#each roadmapStatus as rs}
								<li class="flex items-start gap-2">
									<span
										class={`mt-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full text-xs font-bold ${
											rs.done
												? 'bg-emerald-500 text-black'
												: 'border border-zinc-600 text-zinc-400 bg-zinc-900'
										}`}
									>
										{rs.done ? '✓' : ''}
									</span>
									<span class={rs.done ? 'text-zinc-400 line-through' : 'text-zinc-200'}>
										{rs.item.label}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
