import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDb } from './test-db';
import { categories } from '../schema';

describe('categories CRUD', () => {
	let db: ReturnType<typeof createTestDb>['db'];

	beforeEach(() => {
		({ db } = createTestDb());
	});

	it('creates a category with defaults', () => {
		const result = db.insert(categories).values({ name: 'Work' }).returning().all();

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Work');
		expect(result[0].color).toBe('#6b7280');
		expect(result[0].id).toBeTruthy();
	});

	it('creates a category with custom color', () => {
		const result = db
			.insert(categories)
			.values({ name: 'Personal', color: '#ef4444' })
			.returning()
			.all();

		expect(result[0].color).toBe('#ef4444');
	});

	it('enforces unique category names', () => {
		db.insert(categories).values({ name: 'Work' }).run();

		expect(() => {
			db.insert(categories).values({ name: 'Work' }).run();
		}).toThrow();
	});

	it('lists all categories', () => {
		db.insert(categories).values({ name: 'Work' }).run();
		db.insert(categories).values({ name: 'Personal' }).run();
		db.insert(categories).values({ name: 'Errands' }).run();

		const result = db.select().from(categories).all();
		expect(result).toHaveLength(3);
	});

	it('updates a category name', () => {
		const created = db.insert(categories).values({ name: 'Old' }).returning().all();

		const updated = db
			.update(categories)
			.set({ name: 'New' })
			.where(eq(categories.id, created[0].id))
			.returning()
			.all();

		expect(updated[0].name).toBe('New');
	});

	it('updates a category color', () => {
		const created = db.insert(categories).values({ name: 'Work' }).returning().all();

		const updated = db
			.update(categories)
			.set({ color: '#22c55e' })
			.where(eq(categories.id, created[0].id))
			.returning()
			.all();

		expect(updated[0].color).toBe('#22c55e');
	});

	it('deletes a category', () => {
		const created = db.insert(categories).values({ name: 'Temp' }).returning().all();

		const deleted = db.delete(categories).where(eq(categories.id, created[0].id)).returning().all();

		expect(deleted).toHaveLength(1);
		expect(db.select().from(categories).all()).toHaveLength(0);
	});

	it('returns empty when deleting non-existent category', () => {
		const result = db.delete(categories).where(eq(categories.id, 'non-existent')).returning().all();
		expect(result).toHaveLength(0);
	});
});
