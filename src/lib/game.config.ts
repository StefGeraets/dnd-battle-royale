import { asset } from '$app/paths';

export const GRID_SIZE = 24;

// Default shrink animation duration in milliseconds
export const DEFAULT_SHRINK_DURATION_MS = 30000;

// Animation quantization steps per quality tier (higher = smoother)
export const QUALITY_STEPS_LOW = 30;
export const QUALITY_STEPS_MEDIUM = 60;

export type RoundConfig = {
	id: number;
	triggerTime: number; // In Minutes
	radius: number;
	duration: number; // In Seconds
  warningDuration: number; // In Seconds
	label: string;
};

export type StormTheme = {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Generates a schedule based on total hours.
 * Standard Logic (based on 2.5h):
 * - R1: 20% time (30m) -> Shrink to 35%
 * - R2: 40% time (60m) -> Shrink to 20%
 * - R3: 60% time (90m) -> Shrink to 10%
 * - R4: 80% time (120m)-> Shrink to 0% (Closed)
 */
export function generateSchedule(totalHours: number): RoundConfig[] {
  const totalMinutes = totalHours * 60;
  const totalSeconds = totalMinutes * 60;

  const config = [
    { 
        label: "Round 1: First Contraction", 
        targetRadius: 35, 
        triggerPct: 0.20,  // Happens at 20% of game
        warningPct: 0.02,  // 8% warning (Long)
        shrinkPct: 0.08    // 2% shrink duration (Slow)
    },
    { 
        label: "Round 2: Tightening",        
        targetRadius: 20, 
        triggerPct: 0.45, 
        warningPct: 0.015,  // 6% warning
        shrinkPct: 0.06   // 1.5% shrink
    },
    { 
        label: "Round 3: Sudden Death",      
        targetRadius: 10, 
        triggerPct: 0.70, 
        warningPct: 0.01,  // 4% warning
        shrinkPct: 0.04    // 1% shrink
    },
    { 
        label: "Round 4: Game Over",         
        targetRadius: 2,  
        triggerPct: 0.90, 
        warningPct: 0.007,  // 2% warning (Panic!)
        shrinkPct: 0.02   // 0.5% shrink (Snap!)
    }
  ];

  return config.map((c, i) => {
    return {
      id: i + 1,
      label: c.label,
      triggerTime: Math.floor(totalMinutes * c.triggerPct),
      radius: c.targetRadius,
      duration: Math.max(10, Math.floor(totalSeconds * c.shrinkPct)),
      warningDuration: Math.max(30, Math.floor(totalSeconds * c.warningPct))
    }
  })
}

export const STORM_THEMES: Record<string, StormTheme> = {
  fire: { 
      id: 'fire', label: 'Inferno', 
      primary: '#500000', secondary: '#200000', accent: '#ef4444' 
  },
  ice: { 
      id: 'ice', label: 'Blizzard', 
      primary: '#0c4a6e', secondary: '#082f49', accent: '#38bdf8' 
  },
  toxic: { 
      id: 'toxic', label: 'Acid Cloud', 
      primary: '#14532d', secondary: '#052e16', accent: '#4ade80' 
  },
  necrotic: { 
      id: 'necrotic', label: 'Death Fog', 
      primary: '#4c1d95', secondary: '#2e1065', accent: '#a78bfa' 
  },
  sandy: { 
      id: 'sandy', label: 'Sandstorm', 
      primary: '#713f12', secondary: '#451a03', accent: '#facc15' 
  }
}

export const MAP_PRESETS = [
  { 
    id: 'islands', 
    label: 'Rayrock Isles', 
    url: asset('/islands.webp'), 
    color: '#3C5D68' 
  },
  { 
    id: 'lava', 
    label: 'Moltenrock Peaks', 
    url: asset('/marwen.webp'), 
    color: '#FFE900' 
  },
  { 
    id: 'lake', 
    label: 'Northern Lakes', 
    url: asset('/lakes.webp'), 
    color: '#CAA86B' 
  },
  // { Implement later
  //   id: 'ice', 
  //   label: 'Fjord Blizzard', 
  //   url: asset('/fjord.webp'), 
  //   color: '#3D4E65' // water #3D4E65, ice: #F0ECE9
  // }
];

export const DONATION_URL = "https://buymeacoffee.com/StefBuilds";

/**
 * Single source of truth for all resettable game state defaults.
 * Used by GameEngine field initializers and resetGame().
 */
export function getDefaultState() {
  return {
    elapsedTime: 0,
    isRunning: false,
    playerPos: { x: 1, y: 1 },
    activeZone: { x: 50, y: 50, r: 150 },
    targetZone: { x: 50, y: 50, r: 150 },
    phase: 'IDLE' as const,
    shrinkStartTime: 0,
    shrinkDuration: DEFAULT_SHRINK_DURATION_MS,
    totalGameHours: 2.5,
    secondsUntilShrink: 0,
    isPresenterHidden: true,
    schedule: generateSchedule(2.5),
    nextRoundIndex: 0,
    remainingCombatants: 100, // INITIAL_COMBATANTS — duplicated to avoid circular import
    killFeed: [] as never[],
    mapImage: asset('/islands.webp'),
    themeColor: '#3C5D68',
    stormThemeId: 'fire',
    specialAreas: [] as never[],
    graphicsQuality: 'HIGH' as const,
  };
}

export const STORAGE_KEYS = {
  save: 'dnd_royale_save_v1',
  onboardingSeen: 'dm_onboarding_seen',
  versionSeen: 'dm_version_seen',
} as const;
