import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameEngine } from './game.svelte';
import { FINAL_SURVIVORS, INITIAL_COMBATANTS, STORAGE_KEYS } from './game.config';

vi.mock('$app/env', () => ({ browser: true }));

// Delivers messages to every other open channel, like BroadcastChannel across tabs
class FakeChannel {
	static open = new Set<FakeChannel>();
	onmessage: ((e: { data: unknown }) => void) | null = null;
	constructor() {
		FakeChannel.open.add(this);
	}
	postMessage(data: unknown) {
		const copy = structuredClone(data);
		for (const c of FakeChannel.open) if (c !== this) c.onmessage?.({ data: copy });
	}
}

class FakeWorker {
	static last: FakeWorker;
	posted: unknown[] = [];
	onmessage = null;
	onerror = null;
	constructor() {
		FakeWorker.last = this;
	}
	postMessage(msg: unknown) {
		this.posted.push(msg);
	}
}

let store: Map<string, string>;

beforeEach(() => {
	store = new Map();
	FakeChannel.open.clear();
	vi.stubGlobal('BroadcastChannel', FakeChannel);
	vi.stubGlobal('Worker', FakeWorker);
	vi.stubGlobal('localStorage', {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => store.set(k, v),
		removeItem: (k: string) => store.delete(k)
	});
	vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

function tickUntil(game: GameEngine, ms: number) {
	while (game.elapsedTime < ms) game.tick();
}

describe('GameEngine', () => {
	it('runs a round through warning, shrink and stable', () => {
		const dm = new GameEngine(true);
		const round = dm.nextRound!;
		const shrinkAt = round.triggerTime * 60_000;
		const warnAt = shrinkAt - round.warningDuration * 1000;
		const durationMs = round.duration * 1000;
		dm.toggleTimer();

		tickUntil(dm, warnAt - 100);
		expect(dm.phase).toBe('IDLE');

		dm.tick();
		expect(dm.phase).toBe('WARNING');
		expect(dm.secondsUntilShrink).toBe(round.warningDuration);

		tickUntil(dm, shrinkAt);
		expect(dm.phase).toBe('SHRINKING');

		tickUntil(dm, shrinkAt + durationMs / 2);
		expect(dm.currentZone.r).toBeCloseTo((150 + round.radius) / 2);

		tickUntil(dm, shrinkAt + durationMs);
		expect(dm.phase).toBe('STABLE');
		expect(dm.activeZone.r).toBe(round.radius);
		expect(dm.nextRoundIndex).toBe(1);
	});

	it('paces kills down to the final survivors by the end of the game', () => {
		const dm = new GameEngine(true);
		dm.setTotalTime(0.5);
		dm.toggleTimer();

		tickUntil(dm, 0.5 * 60 * 60 * 1000);
		expect(dm.remainingCombatants).toBe(FINAL_SURVIVORS);

		for (let i = 0; i < 100; i++) dm.tick();
		expect(dm.remainingCombatants).toBe(FINAL_SURVIVORS);
		expect(dm.killFeed.length).toBe(5);
	});

	it('keeps the presenter in sync with DM actions', () => {
		const dm = new GameEngine(true);
		const presenter = new GameEngine(false);

		dm.movePlayer(0, 1);
		dm.addChest(3, 3);
		dm.triggerManualKill();

		expect(presenter.playerPos).toEqual({ x: 1, y: 2 });
		expect(presenter.specialAreas.map((a) => [a.x, a.y, a.name])).toEqual([[3, 3, 'Chest 1']]);
		expect(presenter.remainingCombatants).toBe(INITIAL_COMBATANTS - 1);
		expect(presenter.killFeed[0].id).toBe(dm.killFeed[0].id);

		presenter.movePlayer(1, 0);
		expect(dm.playerPos).toEqual({ x: 1, y: 2 });
	});

	it('reset clears the presenter, the save and stops the timer', () => {
		const dm = new GameEngine(true);
		const worker = FakeWorker.last;
		const presenter = new GameEngine(false);
		dm.toggleTimer();
		tickUntil(dm, 5000);
		dm.triggerManualKill();
		expect(presenter.elapsedTime).toBe(5000);

		dm.resetGame();

		expect(worker.posted.at(-1)).toEqual({ action: 'STOP' });
		expect(store.has(STORAGE_KEYS.save)).toBe(false);
		expect(presenter.elapsedTime).toBe(0);
		expect(presenter.isRunning).toBe(false);
		expect(presenter.remainingCombatants).toBe(INITIAL_COMBATANTS);
		expect(presenter.killFeed).toEqual([]);
	});

	it('restores a saved game paused', () => {
		const dm = new GameEngine(true);
		dm.toggleTimer();
		tickUntil(dm, 1000);
		dm.toggleTimer();
		dm.addChest(5, 5);
		dm.movePlayer(1, 0);
		dm.triggerManualKill();

		const restored = new GameEngine(true);

		expect(restored.isRunning).toBe(false);
		expect(restored.elapsedTime).toBe(1000);
		expect(restored.playerPos).toEqual({ x: 2, y: 1 });
		expect(restored.specialAreas.map((a) => [a.x, a.y])).toEqual([[5, 5]]);
		expect(restored.remainingCombatants).toBe(INITIAL_COMBATANTS - 1);
	});

	it('fills missing fields of an older save with defaults', () => {
		store.set(STORAGE_KEYS.save, JSON.stringify({ elapsedTime: 4200, remainingCombatants: 80 }));

		const restored = new GameEngine(true);

		expect(restored.elapsedTime).toBe(4200);
		expect(restored.remainingCombatants).toBe(80);
		expect(restored.graphicsQuality).toBe('HIGH');
		expect(restored.specialAreas).toEqual([]);
	});
});
