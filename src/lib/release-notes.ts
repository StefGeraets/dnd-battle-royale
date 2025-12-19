export type RoadmapItem = {
	id: string;
	label: string;
};

export type ReleaseNotes = {
	version: string;
	date: string;
	summary?: string;
	features: string[];
	// IDs of roadmap items that were delivered in this release
	completedUpcoming?: string[];
};

// Long‑lived roadmap. Items stay here across releases, and each
// release marks which ones it delivered via completedUpcoming.
export const ROADMAP: RoadmapItem[] = [
	{
		id: 'kill-pacing',
		label: 'More configurable kill pacing and custom combatant lists.'
	},
	{
		id: 'presenter-performance',
		label: 'DM is fine to not see fancy storm, but presenter should be.'
	},
	{
		id: 'custom-maps',
		label: 'Supporter-only custom map uploads and themes.'
	},
	{
		id: 'custom-combatants',
		label: 'Custom combatant name lists and team/party management.'
	},
	{
		id: 'multiple-parties',
		label: 'Multiple parties on the map.'
	},
];

// Generated from git commit history.
export const RELEASES: ReleaseNotes[] = [
	{
		version: '1.0.4',
		date: '2025-12-19',
		summary: 'Version screen to show app updates',
		features: [
			'Version overlay with release notes and roadmap tracking'
		],
		completedUpcoming: []
	},
	{
		version: '1.0.3',
		date: '2025-12-19',
		summary: 'Additional map presets and visual improvements',
		features: [
			'Added lava map and planes/desert map presets',
			'Automatic theme color matching for new map presets'
		],
		completedUpcoming: []
	},
	{
		version: '1.0.2',
		date: '2025-12-19',
		summary: 'Performance optimizations and bug fixes',
		features: [
			'Graphics quality controls (High / Medium / Low) for storm rendering',
			'Performance-friendly storm rendering with adjustable quality levels',
			'Improved storm animation smoothing across quality levels',
			'Fixed reset campaign functionality (countdown overlay now shows correctly)',
		],
		completedUpcoming: []
	},
	{
		version: '1.0.1',
		date: '2025-12-18',
		summary: 'Kill feed and engagement features',
		features: [
			'Kill feed showing random combatant eliminations',
			'Automatic kill pacing based on game duration',
			'Unique victim tracking (no duplicate kills)',
			'Kill feed stops when only 2 parties remain',
			'Donation popup after game completion'
		],
		completedUpcoming: []
	},
	{
		version: '1.0.0',
		date: '2025-12-16',
		summary: 'Initial public release',
		features: [
			'Automated zone shrinking with warning countdown and mission clock',
			'Dynamic game schedule with configurable duration',
			'DM control panel with game state management',
			'Synced DM and presenter screens via BroadcastChannel',
			'Map presets with automatic theme color detection',
			'Storm presets (fire, ice, poison, etc.)',
			'Loot chest placement and management',
			'Presenter screen curtain toggle',
			'Player position tracking and movement',
			'Distance outside safe zone calculation',
			'Game state persistence (localStorage)',
			'DM onboarding with feature explanations',
			'Keyboard shortcuts (arrow keys, space, Z, C, H)',
			'Map hover indicators for interaction',
			'Fullscreen toggle support',
			'Favicon and page titles',
			'Analytics integration'
		],
		completedUpcoming: []
	},
	{
		version: '0.1.0',
		date: '2025-12-08',
		summary: 'Initial development setup',
		features: [
			'Basic project structure and configuration',
			'Core game engine with time worker',
			'SVG map rendering and zone visualization',
			'Storm animation and visual effects',
			'Special area (chest) system',
			'Game schedule generation',
			'LocalStorage save/load functionality'
		],
		completedUpcoming: []
	}
];

export const latestRelease = RELEASES[0];


