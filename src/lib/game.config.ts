export const GRID_SIZE = 24;

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
		radius: 40, // Shrink to 35%
		duration: 15, // Take 30s to move
		label: 'Round 1'
	},
	{
		id: 2,
		triggerTime: 2, // At 1:00:00
		radius: 25,
		duration: 30,
		label: 'Round 2'
	},
	{
		id: 3,
		triggerTime: 3,
		radius: 10,
		duration: 30,
		label: 'Round 3'
	},
	{
		id: 4,
		triggerTime: 4,
		radius: 1, // Closes completely
		duration: 60,
		label: 'Final Shrink'
	}
];
