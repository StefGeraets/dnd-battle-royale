import { browser } from "$app/environment";
import { GAME_SCHEDULE, GRID_SIZE } from "./game.config";
import { getAverageColor } from "./utils/color";

export type Point = {x: number; y: number };
export type Zone = { x: number; y: number; r: number };
export type SpecialArea = { id: string; x: number; y: number; collected: boolean; name: string };
export type GamePhase = 'IDLE' | 'WARNING' | 'SHRINKING' | 'STABLE';

const SYNC_CHANNEL = 'dnd_royale_sync';
const SAVE_KEY = 'dnd_royale_save_v1';

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

  specialAreas = $state<SpecialArea[]>([]);

  // Visual config
  mapImage = $state('/battleRoyale.jpg');
  themeColor = $state('#3C5D68');

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
  })

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
      this.#worker.onerror = (err) => console.error('[GameEngine] Worker Error', err);
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
        this.executeScheduledShrink();
      }
    }

    if (this.phase === 'SHRINKING') {
      const progress = (this.elapsedTime - this.shrinkStartTime) / this.shrinkDuration;
      if (progress >= 1) {
        this.finishShrink();
      }
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

  setNextZoneCenter(x: number, y:number) {
    if (!this.#isDm || !this.nextRound) return;

    if (this.phase === 'SHRINKING') {
      return;
    }

    this.targetZone = {x, y, r: this.nextRound.radius };

    this.#saveState();
    this.#broadcast();
  }

  addChest(gridX: number, gridY: number) {
    if (!this.#isDm) return;

    if (gridX + 1 >= GRID_SIZE || gridY + 1 >= GRID_SIZE) return;

    this.specialAreas.push({
      id: crypto.randomUUID(),
      x: gridX,
      y: gridY,
      collected: false,
      name: `Chest ${this.specialAreas.length + 1}`
    });

    this.#saveState();
    this.#broadcast();
  }

  toggleChest(id: string) {
    if (!this.#isDm) return;
    const chest = this.specialAreas.find(c => c.id === id);
    if(chest) {
      chest.collected = !chest.collected;
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

  resetGame() {
    if (!this.#isDm) return;

    localStorage.removeItem(SAVE_KEY);

    window.location.reload();
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
        specialAreas: $state.snapshot(this.specialAreas),
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
      specialAreas: this.specialAreas,
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
      this.specialAreas = data.specialAreas || [];
      
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
      this.specialAreas = d.specialAreas || [];
      this.playerPos = d.playerPos;
      this.activeZone = d.activeZone;
      this.targetZone = d.targetZone;
    }
  }
}