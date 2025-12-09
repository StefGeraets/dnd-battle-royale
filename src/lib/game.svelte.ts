import { browser } from "$app/environment";
import { GAME_SCHEDULE } from "./game.config";

export type Point = {x: number; y: number };
export type Zone = { x: number; y: number; r: number };
export type GamePhase = 'IDLE' | 'WARNING' | 'SHRINKING' | 'STABLE';

const SYNC_CHANNEL = 'dnd_royale_sync';
export const GRID_ROWS = 20;
export const GRID_COLS = 20;

export class GameEngine {
  // REACTIVE STATE //

  // Time
  elapsedTime = $state(0);
  isRunning = $state(false);

  // Map state
  playerPos = $state<Point>({x: 1, y: 1});

  // Zone
  activeZone = $state<Zone>({x: 50, y: 50, r: 50});
  targetZone = $state<Zone>({x: 50, y: 50, r: 50});

  // Animation/Phase state
  phase = $state<GamePhase>('IDLE');
  shrinkStartTime = $state(0);
  shrinkDuration = $state(30000);

  schedule = GAME_SCHEDULE;
  nextRoundIndex = $state(0);

  // COMPUTED VALUES
  // Rendered zone
  currentZone = $derived.by(() => {
    if (this.phase !== 'SHRINKING') return this.activeZone;

    const progress = (this.elapsedTime - this.shrinkStartTime) / this.shrinkDuration;
    const p = Math.max(0, (Math.min(1, progress)));

    // If finished, we could auto-switch phase, but usually safer to wait for a tick
    return {
      x: this.activeZone.x + (this.targetZone.x - this.activeZone.x) * p,
      y: this.activeZone.y + (this.targetZone.y - this.activeZone.y) * p,
      r: this.activeZone.r + (this.targetZone.r - this.activeZone.r) * p,
    }
  });

  nextRound = $derived(this.schedule[this.nextRoundIndex] || null);

  // INTERNALS
  #isDm: boolean;
  #channel: BroadcastChannel | null = null;
  #worker: Worker | null = null;

  constructor(isDm: boolean = false) {
    this.#isDm = isDm;

    if (browser ) {
      console.log('setup');
      this.#channel = new BroadcastChannel(SYNC_CHANNEL);
      console.log('channel', this.#channel);

      if (this.#isDm) {
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
      this.#worker = new Worker('/time-worker.js');
      this.#worker.onerror = (err) => console.error('[GameEngine] Workor Error', err);
      this.#worker.onmessage = () => this.#tick();
    } catch (e) {
      console.error('[GameEngine] Failed to create worker:', e);
    }
    // Broadcast Loop: Whenever state changes, we could push updates.
    // For simplicity in a game loop, we broadcast on every Tick;
  }

  toggleTimer() {
    if (!this.#isDm) return;
    this.isRunning = !this.isRunning;
    this.#worker?.postMessage({ action: this.isRunning ? 'START' : 'STOP' });
    this.#broadcast();
  }

  #tick() {
    if (!this.isRunning) return;

    this.elapsedTime += 100;

    if(this.nextRound && (this.phase === 'STABLE' || this.phase === 'IDLE')) {
      const triggerMs = this.nextRound.triggerTime * 60 * 1000;

      if (this.elapsedTime >= triggerMs) {
        this.#executeScheduledShrink();
      }
    }

    if (this.phase === 'SHRINKING') {
      const progress = (this.elapsedTime - this.shrinkStartTime) / this.shrinkDuration;
      if (progress >= 1) {
        this.#finishShrink();
      }
    }

    this.#broadcast();
  }

  #broadcast() {
    // We send the raw state, not the derived values. 
    // Presenter calculates derived values locally.
    const payload = {
        elapsedTime: this.elapsedTime,
        isRunning: this.isRunning,
        phase: this.phase,
        shrinkStartTime: this.shrinkStartTime,
        shrinkDuration: this.shrinkDuration,
        nextRoundIndex: this.nextRoundIndex,
        
        playerPos: $state.snapshot(this.playerPos),
        activeZone: $state.snapshot(this.activeZone),
        targetZone: $state.snapshot(this.targetZone),
    };

    this.#channel?.postMessage(payload);
  }

  // ACTIONS

  movePlayer(dx: number, dy: number) {
    if (!this.#isDm) return;

    const newX = this.playerPos.x + dx;
    const newY = this.playerPos.y + dy;

    if (newX >= 0 && newX < GRID_COLS) this.playerPos.x = newX;
    if (newY >= 0 && newY < GRID_ROWS) this.playerPos.y = newY;
    
    if (!this.isRunning) this.#broadcast(); // Manually update if paused
  }

  setNextZoneCenter(x: number, y:number) {
    if (!this.#isDm || !this.nextRound) return;

    this.targetZone = {x, y, r: this.nextRound.radius };

    this.#broadcast();
  }

  startShrinking(durationSeconds: number) {
      if (!this.#isDm) return;
      
      this.shrinkDuration = durationSeconds * 1000;
      this.shrinkStartTime = this.elapsedTime;
      this.phase = 'SHRINKING';
      
      this.#broadcast();
    }

  #executeScheduledShrink() {
    if (!this.nextRound) return;

    console.log(`[GameEngine] Auto-triggering ${this.nextRound.label}`);

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

  #finishShrink() {
    // Commit the target as the new active
    this.activeZone = { ...this.targetZone };
    this.phase = 'STABLE';

    this.nextRoundIndex++;
  }

  // Presenter logic (Replica)

  #setupPresenter() {
    if (!this.#channel) return;
    this.#channel.onmessage = (event) => {
      const d = event.data;
      // Bulk update state
      this.elapsedTime = d.elapsedTime;
      this.isRunning = d.isRunning;
      this.phase = d.phase;
      this.shrinkStartTime = d.shrinkStartTime;
      this.shrinkDuration = d.shrinkDuration;
      this.nextRoundIndex = d.nextRoundIndex;
      
      this.playerPos = d.playerPos;
      this.activeZone = d.activeZone;
      this.targetZone = d.targetZone;
    }
  }
}