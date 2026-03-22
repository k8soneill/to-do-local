import { describe, it, expect, beforeEach } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { createTestDb } from './test-db';
import { tasks, categories } from '../schema';

describe('tasks CRUD', () => {
	let db: ReturnType<typeof createTestDb>['db'];

	beforeEach(() => {
		({ db } = createTestDb());
	});

	it('creates a task with defaults', () => {
		const result = db
			.insert(tasks)
			.values({ title: 'Test task', date: '2026-03-19' })
			.returning()
			.all();

		expect(result).toHaveLength(1);
		expect(result[0].title).toBe('Test task');
		expect(result[0].priority).toBe('medium');
		expect(result[0].categoryId).toBeNull();
		expect(result[0].completedAt).toBeNull();
		expect(result[0].id).toBeTruthy();
		expect(result[0].createdAt).toBeTruthy();
	});

	it('creates a task with explicit priority', () => {
		const result = db
			.insert(tasks)
			.values({ title: 'Urgent', priority: 'high', date: '2026-03-19' })
			.returning()
			.all();

		expect(result[0].priority).toBe('high');
	});

	it('creates a task with a category', () => {
		const cat = db.insert(categories).values({ name: 'Work', color: '#3b82f6' }).returning().all();

		const result = db
			.insert(tasks)
			.values({ title: 'Task with cat', date: '2026-03-19', categoryId: cat[0].id })
			.returning()
			.all();

		expect(result[0].categoryId).toBe(cat[0].id);
	});

	it('lists tasks filtered by date', () => {
		db.insert(tasks).values({ title: 'Day 1', date: '2026-03-19' }).run();
		db.insert(tasks).values({ title: 'Day 2', date: '2026-03-20' }).run();
		db.insert(tasks).values({ title: 'Day 1 again', date: '2026-03-19' }).run();

		const result = db.select().from(tasks).where(eq(tasks.date, '2026-03-19')).all();
		expect(result).toHaveLength(2);
		expect(result.every((t) => t.date === '2026-03-19')).toBe(true);
	});

	it('lists tasks filtered by category', () => {
		const cat = db.insert(categories).values({ name: 'Work' }).returning().all();

		db.insert(tasks).values({ title: 'With cat', date: '2026-03-19', categoryId: cat[0].id }).run();
		db.insert(tasks).values({ title: 'Without cat', date: '2026-03-19' }).run();

		const result = db
			.select()
			.from(tasks)
			.where(and(eq(tasks.date, '2026-03-19'), eq(tasks.categoryId, cat[0].id)))
			.all();

		expect(result).toHaveLength(1);
		expect(result[0].title).toBe('With cat');
	});

	it('updates a task title', () => {
		const created = db
			.insert(tasks)
			.values({ title: 'Original', date: '2026-03-19' })
			.returning()
			.all();

		const updated = db
			.update(tasks)
			.set({ title: 'Updated' })
			.where(eq(tasks.id, created[0].id))
			.returning()
			.all();

		expect(updated[0].title).toBe('Updated');
	});

	it('marks a task as completed', () => {
		const created = db
			.insert(tasks)
			.values({ title: 'Do it', date: '2026-03-19' })
			.returning()
			.all();

		const now = new Date().toISOString();
		const updated = db
			.update(tasks)
			.set({ completedAt: now })
			.where(eq(tasks.id, created[0].id))
			.returning()
			.all();

		expect(updated[0].completedAt).toBe(now);
	});

	it('uncompletes a task', () => {
		const now = new Date().toISOString();
		const created = db
			.insert(tasks)
			.values({ title: 'Done', date: '2026-03-19', completedAt: now })
			.returning()
			.all();

		const updated = db
			.update(tasks)
			.set({ completedAt: null })
			.where(eq(tasks.id, created[0].id))
			.returning()
			.all();

		expect(updated[0].completedAt).toBeNull();
	});

	it('deletes a task', () => {
		const created = db
			.insert(tasks)
			.values({ title: 'Delete me', date: '2026-03-19' })
			.returning()
			.all();

		const deleted = db.delete(tasks).where(eq(tasks.id, created[0].id)).returning().all();
		expect(deleted).toHaveLength(1);

		const remaining = db.select().from(tasks).all();
		expect(remaining).toHaveLength(0);
	});

	it('returns empty when deleting non-existent task', () => {
		const result = db.delete(tasks).where(eq(tasks.id, 'non-existent')).returning().all();
		expect(result).toHaveLength(0);
	});

	it('returns empty when updating non-existent task', () => {
		const result = db
			.update(tasks)
			.set({ title: 'Nope' })
			.where(eq(tasks.id, 'non-existent'))
			.returning()
			.all();
		expect(result).toHaveLength(0);
	});

	it('sets categoryId to null when category is deleted', () => {
		const cat = db.insert(categories).values({ name: 'Temp' }).returning().all();
		db.insert(tasks).values({ title: 'Linked', date: '2026-03-19', categoryId: cat[0].id }).run();

		db.delete(categories).where(eq(categories.id, cat[0].id)).run();

		const result = db.select().from(tasks).all();
		expect(result[0].categoryId).toBeNull();
	});
});
