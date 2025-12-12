export type RoundConfig = {
	id: number;
	triggerTime: number;
	radius: number;
	duration: number;
	label: string;
};

export const GAME_SCHEDULE: RoundConfig[] = [
	{
		id: 1,
		triggerTime: 1, // At 30:00
		radius: 35, // Shrink to 35%
		duration: 30, // Take 30s to move
		label: 'Round 1: First Contraction'
	},
	{
		id: 2,
		triggerTime: 2, // At 1:00:00
		radius: 20,
		duration: 60,
		label: 'Round 2: Tightening the Noose'
	},
	{
		id: 3,
		triggerTime: 90,
		radius: 10,
		duration: 60,
		label: 'Round 3: Sudden Death'
	},
	{
		id: 4,
		triggerTime: 120,
		radius: 0, // Closes completely
		duration: 120,
		label: 'Round 4: Game Over'
	}
];
