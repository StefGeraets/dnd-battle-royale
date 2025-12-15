export const GRID_SIZE = 24;

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
        targetRadius: 0,  
        triggerPct: 0.90, 
        warningPct: 0.005,  // 2% warning (Panic!)
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
    url: '/islands.jpg', 
    color: '#3C5D68' 
  },
  { 
    id: 'forest', 
    label: 'Deep Forest', 
    url: 'https://placehold.co/1000x1000/064e3b/FFF?text=Forest', 
    color: '#064e3b' 
  },
  { 
    id: 'desert', 
    label: 'Scorched Desert', 
    url: 'https://placehold.co/1000x1000/78350f/FFF?text=Desert', 
    color: '#451a03' 
  }
];
