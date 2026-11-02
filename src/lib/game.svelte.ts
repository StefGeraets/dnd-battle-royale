import { browser } from '$app/env';
import {
	generateSchedule,
	GRID_SIZE,
	STORM_THEMES,
	QUALITY_STEPS_LOW,
	QUALITY_STEPS_MEDIUM,
	getDefaultState,
	STORAGE_KEYS,
	INITIAL_COMBATANTS,
	FINAL_SURVIVORS,
	type GameSnapshot
} from './game.config';
import { getAverageColor } from './utils/color';
import { SvelteSet } from 'svelte/reactivity';

export type Point = { x: number; y: number };
export type Zone = { x: number; y: number; r: number };
export type SpecialArea = { id: string; x: number; y: number; name: string };
export type GamePhase = 'IDLE' | 'WARNING' | 'SHRINKING' | 'STABLE';
export type KillEventPart = { text: string } | { token: 'A' | 'V' };
export type KillEvent = {
	id: string;
	attacker: string;
	victim: string;
	parts: KillEventPart[];
	timestamp: number;
	gameTime: number;
};
export type GraphicsQuality = 'HIGH' | 'MEDIUM' | 'LOW';

const SYNC_CHANNEL = 'dnd_royale_sync';

const MAX_FEED_ITEMS = 5;

function generateUniqueId(): string {
	return `${Date.now()}-${Math.floor(Math.random() * 1000000000)}`;
}

// Random Data Pools
const NAMES = [
	'Azog',
	'Gimli',
	'Legolas',
	'Thranduil',
	'Boromir',
	'Lurtz',
	'Gandalf',
	'Saruman',
	'Frodo',
	'Sam',
	'Merry',
	'Pippin',
	'Aragorn',
	'Gollum',
	'Sauron',
	'Galadriel',
	'Elrond',
	'Arwen',
	'Eowyn',
	'Faramir',
	'Denethor',
	'Theoden',
	'Eomer',
	'Grima',
	'Grognak',
	'Vex',
	'Percy',
	'Grog',
	'Scanlan',
	'Pike',
	'Keyleth',
	'Vax',
	'Taryon',
	'Jester',
	'Fjord',
	'Yasha',
	'Beau',
	'Caleb',
	'Nott',
	'Mollymauk',
	'Caduceus',
	'Unknown Soldier',
	'Goblin #42',
	'Town Guard',
	'Angry Peasant'
];

const KILL_TEMPLATES = [
	'{A} decapitated {V}',
	'{A} incinerated {V}',
	'{A} evaporated {V}',
	'{A} crushed {V} with a rock',
	'{A} backstabbed {V}',
	'{A} pushed {V} into the storm',
	'{A} sniped {V} from 300ft',
	'{A} melted {V}',
	'{A} blasted {V} off a cliff',
	'{A} betrayed {V}',
	'{A} ambushed {V}',
	'{A} fed {V} to a mimic',
	'{A} cast Power Word Kill on {V}',
	'{A} threw {V} into lava',
	"{V} stepped on {A}'s trap" // A passive kill example
];

export class GameEngine {
	// REACTIVE STATE //
	#defaults = getDefaultState();

	// Time
	elapsedTime = $state(this.#defaults.elapsedTime);
	isRunning = $state(this.#defaults.isRunning);

	// Map state
	playerPos = $state(this.#defaults.playerPos);

	// Zone
	activeZone = $state(this.#defaults.activeZone);
	targetZone = $state(this.#defaults.targetZone);

	// Animation/Phase state
	phase = $state(this.#defaults.phase);
	shrinkStartTime = $state(this.#defaults.shrinkStartTime);
	shrinkDuration = $state(this.#defaults.shrinkDuration);

	totalGameHours = $state(this.#defaults.totalGameHours);
	secondsUntilShrink = $state(this.#defaults.secondsUntilShrink);
	isPresenterHidden = $state(this.#defaults.isPresenterHidden);
	schedule = $state(this.#defaults.schedule);
	nextRoundIndex = $state(this.#defaults.nextRoundIndex);

	// Combatants feed
	remainingCombatants = $state(this.#defaults.remainingCombatants);
	killFeed = $state(this.#defaults.killFeed);

	// Visual config
	mapImage = $state(this.#defaults.mapImage);
	themeColor = $state(this.#defaults.themeColor);
	stormThemeId = $state(this.#defaults.stormThemeId);
	specialAreas = $state(this.#defaults.specialAreas);
	graphicsQuality = $state(this.#defaults.graphicsQuality);

	// Non-null when the engine has a fatal error the DM needs to act on
	engineError = $state<string | null>(null);

	// COMPUTED VALUES
	distanceOutside = $derived.by(() => {
		const factor = GRID_SIZE / 100;

		const zx = this.currentZone.x * factor;
		const zy = this.currentZone.y * factor;
		const zr = this.currentZone.r * factor;

		const px = this.playerPos.x + 0.5;
		const py = this.playerPos.y + 0.5;

		const dx = px - zx;
		const dy = py - zy;
		const distFromCenter = Math.sqrt(dx * dx + dy * dy);

		return Math.max(0, distFromCenter - zr);
	});

	// Rendered zone
	currentZone = $derived.by(() => {
		if (this.phase !== 'SHRINKING') return this.activeZone;

		const progress = (this.elapsedTime - this.shrinkStartTime) / this.shrinkDuration;
		let p = Math.max(0, Math.min(1, progress));

		// Quantize progress for LOW quality to reduce update frequency
		if (this.graphicsQuality === 'LOW') {
			p = Math.round(p * QUALITY_STEPS_LOW) / QUALITY_STEPS_LOW;
		} else if (this.graphicsQuality === 'MEDIUM') {
			p = Math.round(p * QUALITY_STEPS_MEDIUM) / QUALITY_STEPS_MEDIUM;
		}

		// If finished, we could auto-switch phase, but usually safer to wait for a tick
		return {
			x: this.activeZone.x + (this.targetZone.x - this.activeZone.x) * p,
			y: this.activeZone.y + (this.targetZone.y - this.activeZone.y) * p,
			r: this.activeZone.r + (this.targetZone.r - this.activeZone.r) * p
		};
	});

	nextRound = $derived(this.schedule[this.nextRoundIndex] || null);

	// INTERNALS
	#isDm: boolean;
	#channel: BroadcastChannel | null = null;
	#worker: Worker | null = null;

	#killsTriggered = 0;
	#deadVictims = new SvelteSet<string>();

	constructor(isDm: boolean = false) {
		this.#isDm = isDm;

		if (browser) {
			this.#channel = new BroadcastChannel(SYNC_CHANNEL);
			if (this.#isDm) {
				this.#loadState();
				this.#setupDm();
			} else {
				this.#setupPresenter();
			}
		}
	}

	// Master Logic (DM only)
	#setupDm() {
		// Initialize worker
		try {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			this.#worker = new Worker(new URL('./time-worker.ts', import.meta.url), { type: 'module' });
			this.#worker.onerror = (err) => {
				console.error('[GameEngine] Worker Error', err);
				this.engineError =
					'The game timer has crashed. The clock will not advance. Please reload the page.';
			};
			this.#worker.onmessage = () => this.tick();
		} catch (e) {
			console.error('[GameEngine] Failed to create worker:', e);
			this.engineError = 'Failed to start the game timer. Please reload the page.';
		}

		this.#channel!.onmessage = (event) => {
			if (event.data.type === 'REQUEST_SYNC') {
				this.#broadcast();
			}
		};
	}

	toggleTimer() {
		if (!this.#isDm) return;
		this.isRunning = !this.isRunning;
		this.#worker?.postMessage({ action: this.isRunning ? 'START' : 'STOP' });
		this.#broadcast();
	}

	tick() {
		if (!this.#isDm || !this.isRunning) return;
		this.elapsedTime += 100;

		if (this.nextRound) {
			const shrinkStartMs = this.nextRound.triggerTime * 60 * 1000;
			const warningStartMs = shrinkStartMs - this.nextRound.warningDuration * 1000;

			// Warning phase
			if (this.elapsedTime >= warningStartMs && this.elapsedTime < shrinkStartMs) {
				if (this.phase !== 'WARNING') {
					this.phase = 'WARNING';
					this.targetZone.r = this.nextRound.radius;
				}

				// Countdown
				this.secondsUntilShrink = Math.ceil((shrinkStartMs - this.elapsedTime) / 1000);
			}

			if (this.elapsedTime >= shrinkStartMs && this.phase === 'WARNING') {
				this.executeScheduledShrink();
			}
		}

		if (this.phase === 'SHRINKING') {
			const progress = (this.elapsedTime - this.shrinkStartTime) / this.shrinkDuration;
			if (progress >= 1) {
				this.finishShrink();
			}
		}

		if (this.remainingCombatants > FINAL_SURVIVORS) {
			this.checkKillPacing();
		}

		this.#broadcast();
		if (this.elapsedTime % 1000 === 0) {
			this.#saveState();
		}
	}

	// ACTIONS

	movePlayer(dx: number, dy: number) {
		if (!this.#isDm) return;

		const newX = this.playerPos.x + dx;
		const newY = this.playerPos.y + dy;

		if (newX >= 0 && newX < GRID_SIZE) this.playerPos.x = newX;
		if (newY >= 0 && newY < GRID_SIZE) this.playerPos.y = newY;

		if (!this.isRunning) {
			this.#saveState();
			this.#broadcast(); // Manually update if paused
		}
	}

	setNextZoneCenter(x: number, y: number) {
		if (!this.#isDm || !this.nextRound) return;

		if (this.phase === 'SHRINKING') {
			return;
		}

		this.targetZone = { x, y, r: this.nextRound.radius };

		this.#saveState();
		this.#broadcast();
	}

	setTotalTime(hours: number) {
		if (!this.#isDm) return;
		this.totalGameHours = hours;
		this.schedule = generateSchedule(hours);

		this.#saveState();
		this.#broadcast();
	}

	togglePresenterCurtain() {
		if (!this.#isDm) return;
		this.isPresenterHidden = !this.isPresenterHidden;
		this.#saveState();
		this.#broadcast();
	}

	// CHEST ACTIONS
	addChest(gridX: number, gridY: number) {
		if (!this.#isDm) return;

		if (gridX + 1 >= GRID_SIZE || gridY + 1 >= GRID_SIZE) {
			console.warn('Chest out of bounds');
			return;
		}

		const hasOverlap = this.specialAreas.some((chest) => {
			const dx = Math.abs(chest.x - gridX);
			const dy = Math.abs(chest.y - gridY);
			return dx < 2 && dy < 2;
		});

		if (hasOverlap) {
			console.warn('Chest overlap existing area');
			return;
		}

		this.specialAreas.push({
			id: generateUniqueId(),
			x: gridX,
			y: gridY,
			name: `Chest ${this.specialAreas.length + 1}`
		});

		this.#saveState();
		this.#broadcast();
	}

	deleteChest(id: string) {
		if (!this.#isDm) return;
		this.specialAreas = this.specialAreas.filter((c) => c.id !== id);
		this.#saveState();
		this.#broadcast();
	}

	renameChest(id: string, newName: string) {
		if (!this.#isDm) return;
		const chest = this.specialAreas.find((c) => c.id === id);
		if (chest) {
			chest.name = newName;
			this.#saveState();
			this.#broadcast();
		}
	}

	executeScheduledShrink() {
		if (!this.nextRound) return;

		this.shrinkDuration = this.nextRound.duration * 1000;
		this.shrinkStartTime = this.elapsedTime;

		// If DM hasn't set a target center yet (no manual click),
		// we default to the CURRENT center (Concentric shrink)
		// We also ensure radius is correct from schedule.
		if (this.targetZone.r !== this.nextRound.radius) {
			this.targetZone.r = this.nextRound.radius;
		}

		this.phase = 'SHRINKING';
	}

	finishShrink() {
		this.activeZone = { ...this.targetZone };
		this.phase = 'STABLE';
		this.nextRoundIndex++;
	}

	checkKillPacing() {
		const totalDeathsNeeded = INITIAL_COMBATANTS - FINAL_SURVIVORS;
		const totalDurationMs = this.totalGameHours * 60 * 60 * 1000;
		const msPerDeath = totalDurationMs / totalDeathsNeeded;
		const targetDeaths = Math.floor(this.elapsedTime / msPerDeath);

		if (this.#killsTriggered < targetDeaths) {
			this.triggerRandomKill();
		}
	}

	triggerManualKill() {
		if (!this.#isDm) return;
		this.triggerRandomKill();
		this.#broadcast();
		this.#saveState();
	}

	triggerRandomKill() {
		if (this.remainingCombatants <= FINAL_SURVIVORS) return;

		// Recycle names once the pool is exhausted so kills can continue
		// for all 100 combatants regardless of how many unique names exist.
		if (this.#deadVictims.size >= NAMES.length) {
			this.#deadVictims.clear();
		}

		const livingNames = NAMES.filter((name) => !this.#deadVictims.has(name));

		const attacker = livingNames[Math.floor(Math.random() * livingNames.length)];
		const victimPool = livingNames.filter((n) => n !== attacker);
		const victim =
			victimPool.length > 0 ? victimPool[Math.floor(Math.random() * victimPool.length)] : attacker;

		const template = KILL_TEMPLATES[Math.floor(Math.random() * KILL_TEMPLATES.length)];

		const parts: KillEventPart[] = template
			.split(/(\{A\}|\{V\})/g)
			.filter((seg) => seg !== '')
			.map((seg) =>
				seg === '{A}'
					? { token: 'A' as const }
					: seg === '{V}'
						? { token: 'V' as const }
						: { text: seg }
			);

		const newKill: KillEvent = {
			id: generateUniqueId(),
			attacker,
			victim,
			parts,
			timestamp: Date.now(),
			gameTime: this.elapsedTime
		};

		this.killFeed = [newKill, ...this.killFeed].slice(0, MAX_FEED_ITEMS);
		this.remainingCombatants--;
		this.#killsTriggered++;
		this.#deadVictims.add(victim);
	}

	setStormTheme(id: string) {
		if (!this.#isDm) return;
		if (STORM_THEMES[id]) {
			this.stormThemeId = id;
			this.#broadcast();
			this.#saveState();
		}
	}

	applyMapPreset(preset: { url: string; color: string }) {
		if (!this.#isDm) return;
		this.mapImage = preset.url;
		this.themeColor = preset.color;
		this.#broadcast();
		this.#saveState();
	}

	// Visual actions
	setMapImage(url: string) {
		if (!this.#isDm) return;
		this.mapImage = url;

		getAverageColor(url).then((color) => {
			this.themeColor = color;
			this.#broadcast();
			this.#saveState();
		});

		this.#broadcast();
		this.#saveState();
	}

	setThemeColor(color: string) {
		if (!this.#isDm) return;
		this.themeColor = color;
		this.#broadcast();
		this.#saveState();
	}

	setGraphicsQuality(quality: GraphicsQuality) {
		if (!this.#isDm) return;
		this.graphicsQuality = quality;
		this.#broadcast();
		this.#saveState();
	}

	resetGame() {
		if (!this.#isDm) return;

		localStorage.removeItem(STORAGE_KEYS.save);

		this.#apply(getDefaultState());
		this.#killsTriggered = 0;
		this.#deadVictims = new SvelteSet();

		this.#worker?.postMessage({ action: 'STOP' });
		this.#broadcast();
	}

	#snapshot(): GameSnapshot {
		return {
			elapsedTime: this.elapsedTime,
			isRunning: this.isRunning,
			playerPos: $state.snapshot(this.playerPos),
			activeZone: $state.snapshot(this.activeZone),
			targetZone: $state.snapshot(this.targetZone),
			phase: this.phase,
			shrinkStartTime: this.shrinkStartTime,
			shrinkDuration: this.shrinkDuration,
			totalGameHours: this.totalGameHours,
			secondsUntilShrink: this.secondsUntilShrink,
			isPresenterHidden: this.isPresenterHidden,
			schedule: $state.snapshot(this.schedule),
			nextRoundIndex: this.nextRoundIndex,
			remainingCombatants: this.remainingCombatants,
			killFeed: $state.snapshot(this.killFeed),
			mapImage: this.mapImage,
			themeColor: this.themeColor,
			stormThemeId: this.stormThemeId,
			specialAreas: $state.snapshot(this.specialAreas),
			graphicsQuality: this.graphicsQuality
		};
	}

	#apply(d: GameSnapshot) {
		this.elapsedTime = d.elapsedTime;
		this.isRunning = d.isRunning;
		this.playerPos = d.playerPos;
		this.activeZone = d.activeZone;
		this.targetZone = d.targetZone;
		this.phase = d.phase;
		this.shrinkStartTime = d.shrinkStartTime;
		this.shrinkDuration = d.shrinkDuration;
		this.totalGameHours = d.totalGameHours;
		this.secondsUntilShrink = d.secondsUntilShrink;
		this.isPresenterHidden = d.isPresenterHidden;
		this.schedule = d.schedule;
		this.nextRoundIndex = d.nextRoundIndex;
		this.remainingCombatants = d.remainingCombatants;
		this.killFeed = d.killFeed;
		this.mapImage = d.mapImage;
		this.themeColor = d.themeColor;
		this.stormThemeId = d.stormThemeId;
		this.specialAreas = d.specialAreas;
		this.graphicsQuality = d.graphicsQuality;
	}

	// Presenter calculates derived values locally from the raw state.
	#broadcast() {
		this.#channel?.postMessage(this.#snapshot());
	}

	// Persist logic
	#saveState() {
		if (!this.#isDm) return;

		const data = {
			...this.#snapshot(),
			killsTriggered: this.#killsTriggered,
			deadVictims: Array.from(this.#deadVictims),
			timestamp: Date.now()
		};

		localStorage.setItem(STORAGE_KEYS.save, JSON.stringify(data));
	}

	#loadState() {
		if (!this.#isDm) return;

		const raw = localStorage.getItem(STORAGE_KEYS.save);
		if (!raw) return;

		try {
			const data = JSON.parse(raw);
			console.log('[GameEngine] Restoring saved game...', data);

			// Older saves may miss fields; those fall back to defaults
			this.#apply({ ...getDefaultState(), ...data });
			this.#killsTriggered = data.killsTriggered ?? 0;
			this.#deadVictims = new SvelteSet(data.deadVictims ?? []);

			// Note: We do NOT restore 'isRunning'.
			// It is safer to start PAUSED after a reload so the DM can get their bearings.
			this.isRunning = false;
		} catch (e) {
			console.error('[GameEngine] Failed to load save:', e);
		}
	}

	// Presenter logic (Replica)
	#setupPresenter() {
		if (!this.#channel) return;
		this.#channel.postMessage({ type: 'REQUEST_SYNC' });
		this.#channel.onmessage = (event) => {
			if (event.data.type === 'REQUEST_SYNC') {
				return;
			}

			this.#apply(event.data);
		};
	}
}
