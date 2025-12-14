export const GRID_SIZE = 24;

export type RoundConfig = {
	id: number;
	triggerTime: number;
	radius: number;
	duration: number;
	label: string;
};

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

  return [
    {
      id: 1,
      triggerTime: Math.floor(totalMinutes * 0.2), // At 30:00
      radius: 35, // Shrink to 35%
      duration: 15, // Take 30s to move
      label: 'Round 1'
    },
    {
      id: 2,
      triggerTime: Math.floor(totalMinutes * 0.4), // At 1:00:00
      radius: 20,
      duration: 30,
      label: 'Round 2'
    },
    {
      id: 3,
      triggerTime: Math.floor(totalMinutes * 0.6),
      radius: 10,
      duration: 30,
      label: 'Round 3'
    },
    {
      id: 4,
      triggerTime: Math.floor(totalMinutes * 0.8),
      radius: 1, // Closes completely
      duration: 60,
      label: 'Final Shrink'
    }
  ];
}
