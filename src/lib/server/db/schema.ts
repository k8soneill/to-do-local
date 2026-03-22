import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique(),
	color: text('color').notNull().default('#6b7280'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const tasks = sqliteTable('tasks', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: text('priority', { enum: ['low', 'medium', 'high'] })
		.notNull()
		.default('medium'),
	categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
	date: text('date').notNull(),
	completedAt: text('completed_at'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

// Inventory

export const inventoryCategories = sqliteTable('inventory_categories', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique(),
	color: text('color').notNull().default('#6b7280'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const inventoryItems = sqliteTable('inventory_items', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	categoryId: text('category_id').references(() => inventoryCategories.id, { onDelete: 'set null' }),
	estimatedPrice: real('estimated_price'),
	frequencyDays: integer('frequency_days'),
	lastPurchasedAt: text('last_purchased_at'),
	notes: text('notes'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

// Ratings

export const dailyRatings = sqliteTable('daily_ratings', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	date: text('date').notNull().unique(),
	totalTasks: integer('total_tasks').notNull(),
	completedTasks: integer('completed_tasks').notNull(),
	rating: real('rating').notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});
