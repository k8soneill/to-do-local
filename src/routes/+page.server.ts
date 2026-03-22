import { db } from '$lib/server/db';
import { tasks, categories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getStreaks } from '$lib/server/streaks';
import type { PageServerLoad } from './$types';

function todayDate(): string {
	return new Date().toISOString().split('T')[0];
}

export const load: PageServerLoad = async ({ url }) => {
	const today = todayDate();
	const date = url.searchParams.get('date') ?? today;

	const allTasks = await db.select().from(tasks).where(eq(tasks.date, date)).all();
	const allCategories = await db.select().from(categories).all();
	const streaks = await getStreaks(today);

	const priorityOrder = { high: 0, medium: 1, low: 2 };
	allTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

	return {
		tasks: allTasks,
		categories: allCategories,
		date,
		today,
		streaks
	};
};
