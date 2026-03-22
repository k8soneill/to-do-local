import { db } from '$lib/server/db';
import { tasks, dailyRatings, categories } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getStreaks } from '$lib/server/streaks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const dateParam = url.searchParams.get('date');
	const today = new Date().toISOString().split('T')[0];

	// If a specific date is requested, show that day's detail
	if (dateParam) {
		const dayTasks = await db.select().from(tasks).where(eq(tasks.date, dateParam)).all();
		const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
		dayTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

		const dayRating = await db
			.select()
			.from(dailyRatings)
			.where(eq(dailyRatings.date, dateParam))
			.all();

		const allCategories = await db.select().from(categories).all();

		return {
			mode: 'detail' as const,
			date: dateParam,
			today,
			tasks: dayTasks,
			rating: dayRating[0] ?? null,
			categories: allCategories
		};
	}

	// Otherwise show overview of all days with ratings
	const ratings = await db.select().from(dailyRatings).orderBy(desc(dailyRatings.date)).all();

	// Also find days that have tasks but no rating yet
	const allTaskDates = await db
		.selectDistinct({ date: tasks.date })
		.from(tasks)
		.orderBy(desc(tasks.date))
		.all();

	const ratingsByDate = Object.fromEntries(ratings.map((r) => [r.date, r]));

	const days = allTaskDates.map((td) => {
		const rating = ratingsByDate[td.date];
		return {
			date: td.date,
			totalTasks: rating?.totalTasks ?? 0,
			completedTasks: rating?.completedTasks ?? 0,
			rating: rating?.rating ?? 0
		};
	});

	// Summary stats
	const totalDays = days.length;
	const perfectDays = days.filter((d) => d.rating === 1).length;
	const avgRating = totalDays > 0 ? days.reduce((sum, d) => sum + d.rating, 0) / totalDays : 0;

	const streaks = await getStreaks(today);

	return {
		mode: 'overview' as const,
		today,
		days,
		stats: { totalDays, perfectDays, avgRating },
		streaks
	};
};
