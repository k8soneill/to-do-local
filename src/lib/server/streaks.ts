import { db } from '$lib/server/db';
import { dailyRatings } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const STREAK_THRESHOLD = 0.8;

export interface StreakInfo {
	current: number;
	best: number;
	threshold: number;
}

export interface RatingEntry {
	date: string;
	rating: number;
}

export function calculateStreaks(
	ratings: RatingEntry[],
	today: string,
	threshold: number = STREAK_THRESHOLD
): StreakInfo {
	if (ratings.length === 0) return { current: 0, best: 0, threshold };

	const qualifyingDates = new Set(ratings.filter((r) => r.rating >= threshold).map((r) => r.date));

	// Calculate current streak — walk backwards from today.
	// If today doesn't qualify yet (day not over), start from yesterday.
	let current = 0;
	const checkDate = new Date(today + 'T00:00:00');

	if (!qualifyingDates.has(today)) {
		checkDate.setDate(checkDate.getDate() - 1);
	}

	while (true) {
		const dateStr = checkDate.toISOString().split('T')[0];
		if (qualifyingDates.has(dateStr)) {
			current++;
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			break;
		}
	}

	// Calculate best streak — walk through all dates chronologically
	const allDates = ratings.map((r) => r.date).sort();
	let best = 0;
	let run = 0;
	let prevDate: Date | null = null;

	for (const dateStr of allDates) {
		const d = new Date(dateStr + 'T00:00:00');
		const isConsecutive = prevDate !== null && d.getTime() - prevDate.getTime() === 86400000;

		if (qualifyingDates.has(dateStr)) {
			run = isConsecutive ? run + 1 : 1;
			if (run > best) best = run;
		} else {
			run = 0;
		}
		prevDate = d;
	}

	return { current, best, threshold };
}

export async function getStreaks(today: string): Promise<StreakInfo> {
	const ratings = await db
		.select({ date: dailyRatings.date, rating: dailyRatings.rating })
		.from(dailyRatings)
		.orderBy(desc(dailyRatings.date))
		.all();

	return calculateStreaks(ratings, today);
}
