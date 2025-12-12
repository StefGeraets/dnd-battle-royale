import { browser } from "$app/environment";
import { GAME_SCHEDULE } from "./game.config";
import { getAverageColor } from "./utils/color";

export type Point = {x: number; y: number };
export type Zone = { x: number; y: number; r: number };
export type GamePhase = 'IDLE' | 'WARNING' | 'SHRINKING' | 'STABLE';

const SYNC_CHANNEL = 'dnd_royale_sync';
const SAVE_KEY = 'dnd_royale_save_v1';
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
  activeZone = $state<Zone>({x: 50, y: 50, r: 150});
  targetZone = $state<Zone>({x: 50, y: 50, r: 150});

  // Animation/Phase state
  phase = $state<GamePhase>('IDLE');
  shrinkStartTime = $state(0);
  shrinkDuration = $state(30000);

  schedule = GAME_SCHEDULE;
  nextRoundIndex = $state(0);

  // Visual config
  mapImage = $state('/battleRoyale.jpg');
  themeColor = $state('#0f172a');

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
      this.#worker = new Worker('/time-worker.js');
      this.#worker.onerror = (err) => console.error('[GameEngine] Workor Error', err);
      this.#worker.onmessage = () => this.#tick();
    } catch (e) {
      console.error('[GameEngine] Failed to create worker:', e);
    }
  
    this.#channel!.onmessage = (event) => {
      if (event.data.type === 'REQUEST_SYNC') {
        this.#broadcast();
      }
    }
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

    if (this.elapsedTime % 1000 === 0) {
      this.#saveState();
    }
  }

  // Visual actions
  setMapImage(url: string) {
    if (!this.#isDm) return;
    this.mapImage = url;

    getAverageColor(url).then(color => {
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
        mapImage: this.mapImage,
        themeColor: this.themeColor,
        
        playerPos: $state.snapshot(this.playerPos),
        activeZone: $state.snapshot(this.activeZone),
        targetZone: $state.snapshot(this.targetZone),
    };

    this.#channel?.postMessage(payload);
  }

  // Persist logic
  #saveState() {
    if (!this.#isDm) return;

    const data = {
      elapsedTime: this.elapsedTime,
      playerPos: this.playerPos,
      activeZone: this.activeZone,
      targetZone: this.targetZone,
      phase: this.phase,
      shrinkStartTime: this.shrinkStartTime,
      shrinkDuration: this.shrinkDuration,
      nextRoundIndex: this.nextRoundIndex,
      mapImage: this.mapImage,
      themeColor: this.themeColor,
      timestamp: Date.now()
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  #loadState() {
    if (!this.#isDm) return;

    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      console.log('[GameEngine] Restoring saved game...', data);

      // Restore all state
      this.elapsedTime = data.elapsedTime;
      this.playerPos = data.playerPos;
      this.activeZone = data.activeZone;
      this.targetZone = data.targetZone;
      this.phase = data.phase;
      this.shrinkStartTime = data.shrinkStartTime;
      this.shrinkDuration = data.shrinkDuration;
      this.nextRoundIndex = data.nextRoundIndex;
      this.mapImage = data.mapImage || this.mapImage;
      this.themeColor = data.themeColor || this.themeColor;
      
      // Note: We do NOT restore 'isRunning'. 
      // It is safer to start PAUSED after a reload so the DM can get their bearings.
      this.isRunning = false;
    } catch (e) {
      console.error('[GameEngine] Failed to load save:', e);
    }
  }

  resetGame() {
    if (!this.#isDm) return;

    localStorage.removeItem(SAVE_KEY);

    window.location.reload();
  }

  // ACTIONS

  movePlayer(dx: number, dy: number) {
    if (!this.#isDm) return;

    const newX = this.playerPos.x + dx;
    const newY = this.playerPos.y + dy;

    if (newX >= 0 && newX < GRID_COLS) this.playerPos.x = newX;
    if (newY >= 0 && newY < GRID_ROWS) this.playerPos.y = newY;
    
    if (!this.isRunning) {
      this.#broadcast(); // Manually update if paused
      this.#saveState();
    }
  }

  setNextZoneCenter(x: number, y:number) {
    if (!this.#isDm || !this.nextRound) return;

    this.targetZone = {x, y, r: this.nextRound.radius };

    this.#broadcast();
    this.#saveState();
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
      if (event.data.type === 'REQUEST_SYNC') {
        return;
      }

      const d = event.data;
      // Bulk update state
      this.elapsedTime = d.elapsedTime;
      this.isRunning = d.isRunning;
      this.phase = d.phase;
      this.shrinkStartTime = d.shrinkStartTime;
      this.shrinkDuration = d.shrinkDuration;
      this.nextRoundIndex = d.nextRoundIndex;
      this.mapImage = d.mapImage;
      this.themeColor = d.themeColor; 
      
      this.playerPos = d.playerPos;
      this.activeZone = d.activeZone;
      this.targetZone = d.targetZone;
    }

    this.#channel.postMessage({ type: 'REQUEST_SYNC' });
  }
}