import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDb } from './test-db';
import { dailyRatings } from '../schema';

describe('daily ratings upsert', () => {
	let db: ReturnType<typeof createTestDb>['db'];

	beforeEach(() => {
		({ db } = createTestDb());
	});

	it('creates a new daily rating', () => {
		const result = db
			.insert(dailyRatings)
			.values({ date: '2026-03-19', totalTasks: 5, completedTasks: 3, rating: 0.6 })
			.returning()
			.all();

		expect(result).toHaveLength(1);
		expect(result[0].date).toBe('2026-03-19');
		expect(result[0].totalTasks).toBe(5);
		expect(result[0].completedTasks).toBe(3);
		expect(result[0].rating).toBeCloseTo(0.6);
	});

	it('enforces unique date constraint', () => {
		db.insert(dailyRatings)
			.values({ date: '2026-03-19', totalTasks: 3, completedTasks: 1, rating: 0.33 })
			.run();

		expect(() => {
			db.insert(dailyRatings)
				.values({ date: '2026-03-19', totalTasks: 5, completedTasks: 5, rating: 1.0 })
				.run();
		}).toThrow();
	});

	it('updates an existing rating (upsert pattern)', () => {
		db.insert(dailyRatings)
			.values({ date: '2026-03-19', totalTasks: 3, completedTasks: 1, rating: 0.33 })
			.run();

		const updated = db
			.update(dailyRatings)
			.set({ totalTasks: 5, completedTasks: 4, rating: 0.8 })
			.where(eq(dailyRatings.date, '2026-03-19'))
			.returning()
			.all();

		expect(updated).toHaveLength(1);
		expect(updated[0].totalTasks).toBe(5);
		expect(updated[0].completedTasks).toBe(4);
		expect(updated[0].rating).toBeCloseTo(0.8);
	});

	it('stores a perfect day rating', () => {
		const result = db
			.insert(dailyRatings)
			.values({ date: '2026-03-19', totalTasks: 4, completedTasks: 4, rating: 1.0 })
			.returning()
			.all();

		expect(result[0].rating).toBe(1.0);
	});

	it('stores a zero completion rating', () => {
		const result = db
			.insert(dailyRatings)
			.values({ date: '2026-03-19', totalTasks: 3, completedTasks: 0, rating: 0 })
			.returning()
			.all();

		expect(result[0].rating).toBe(0);
		expect(result[0].completedTasks).toBe(0);
	});

	it('handles multiple dates independently', () => {
		db.insert(dailyRatings)
			.values({ date: '2026-03-19', totalTasks: 5, completedTasks: 5, rating: 1.0 })
			.run();
		db.insert(dailyRatings)
			.values({ date: '2026-03-20', totalTasks: 3, completedTasks: 1, rating: 0.33 })
			.run();

		const all = db.select().from(dailyRatings).all();
		expect(all).toHaveLength(2);

		const day1 = all.find((r) => r.date === '2026-03-19');
		const day2 = all.find((r) => r.date === '2026-03-20');
		expect(day1?.rating).toBe(1.0);
		expect(day2?.rating).toBeCloseTo(0.33);
	});
});
