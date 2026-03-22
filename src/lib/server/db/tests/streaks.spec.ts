import { describe, it, expect } from 'vitest';
import { calculateStreaks, STREAK_THRESHOLD } from '../../streaks';
import type { RatingEntry } from '../../streaks';

function rating(date: string, pct: number): RatingEntry {
	return { date, rating: pct };
}

describe('calculateStreaks', () => {
	it('returns zeros for empty data', () => {
		const result = calculateStreaks([], '2026-03-19');
		expect(result).toEqual({ current: 0, best: 0, threshold: STREAK_THRESHOLD });
	});

	it('counts a single qualifying day as streak of 1', () => {
		const result = calculateStreaks([rating('2026-03-19', 1.0)], '2026-03-19');
		expect(result.current).toBe(1);
		expect(result.best).toBe(1);
	});

	it('counts consecutive qualifying days', () => {
		const ratings = [
			rating('2026-03-17', 0.9),
			rating('2026-03-18', 0.85),
			rating('2026-03-19', 1.0)
		];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(3);
		expect(result.best).toBe(3);
	});

	it('breaks streak on a gap day', () => {
		const ratings = [
			rating('2026-03-16', 1.0),
			// 2026-03-17 missing
			rating('2026-03-18', 0.9),
			rating('2026-03-19', 1.0)
		];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(2);
		expect(result.best).toBe(2);
	});

	it('breaks streak on a non-qualifying day', () => {
		const ratings = [
			rating('2026-03-17', 1.0),
			rating('2026-03-18', 0.5), // below threshold
			rating('2026-03-19', 1.0)
		];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(1);
		expect(result.best).toBe(1);
	});

	it('threshold boundary: 80% qualifies', () => {
		const ratings = [rating('2026-03-18', 0.8), rating('2026-03-19', 0.8)];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(2);
		expect(result.best).toBe(2);
	});

	it('threshold boundary: 79% does not qualify', () => {
		const ratings = [rating('2026-03-18', 0.79), rating('2026-03-19', 0.8)];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(1);
		expect(result.best).toBe(1);
	});

	it('today not yet qualifying — starts from yesterday', () => {
		const ratings = [
			rating('2026-03-17', 0.9),
			rating('2026-03-18', 1.0)
			// today (2026-03-19) has no rating
		];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(2);
		expect(result.best).toBe(2);
	});

	it('today below threshold — starts from yesterday', () => {
		const ratings = [
			rating('2026-03-17', 0.9),
			rating('2026-03-18', 1.0),
			rating('2026-03-19', 0.5) // today below threshold
		];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(2);
		expect(result.best).toBe(2);
	});

	it('best streak is from the past, not current', () => {
		const ratings = [
			// Past streak of 4
			rating('2026-03-10', 1.0),
			rating('2026-03-11', 0.9),
			rating('2026-03-12', 0.85),
			rating('2026-03-13', 1.0),
			// Gap
			rating('2026-03-15', 0.3),
			// Current streak of 2
			rating('2026-03-18', 0.9),
			rating('2026-03-19', 1.0)
		];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(2);
		expect(result.best).toBe(4);
	});

	it('all days below threshold gives zero streaks', () => {
		const ratings = [
			rating('2026-03-17', 0.5),
			rating('2026-03-18', 0.3),
			rating('2026-03-19', 0.6)
		];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(0);
		expect(result.best).toBe(0);
	});

	it('handles non-consecutive rating entries correctly', () => {
		// Ratings exist but with gaps — only consecutive qualifying days count
		const ratings = [
			rating('2026-03-10', 1.0),
			rating('2026-03-12', 1.0), // gap on 11th
			rating('2026-03-14', 1.0) // gap on 13th
		];
		const result = calculateStreaks(ratings, '2026-03-14');
		expect(result.current).toBe(1);
		expect(result.best).toBe(1);
	});

	it('current streak includes today when qualifying', () => {
		const ratings = [
			rating('2026-03-18', 0.9),
			rating('2026-03-19', 0.85) // today qualifies
		];
		const result = calculateStreaks(ratings, '2026-03-19');
		expect(result.current).toBe(2);
		expect(result.best).toBe(2);
	});

	it('respects custom threshold', () => {
		const ratings = [rating('2026-03-18', 0.5), rating('2026-03-19', 0.6)];
		// With 50% threshold, both qualify
		const result = calculateStreaks(ratings, '2026-03-19', 0.5);
		expect(result.current).toBe(2);
		expect(result.threshold).toBe(0.5);
	});
});
