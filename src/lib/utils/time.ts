/** Format a seconds value as M:SS (no leading zero on minutes) */
export function formatSeconds(secs: number): string {
	const m = Math.floor(secs / 60);
	const s = secs % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format a milliseconds value as MM:SS (zero-padded minutes) */
export function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
