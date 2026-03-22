import { db } from '$lib/server/db';
import { tasks, dailyRatings } from '$lib/server/db/schema';
import { and, gte, lte, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const today = new Date().toISOString().split('T')[0];
	const monthParam = url.searchParams.get('month');

	// Parse month param (YYYY-MM) or default to current month
	let year: number, month: number;
	if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
		[year, month] = monthParam.split('-').map(Number);
	} else {
		const now = new Date();
		year = now.getFullYear();
		month = now.getMonth() + 1;
	}

	// Get first and last day of month
	const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
	const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

	// Get task counts per day
	const taskCounts = await db
		.select({
			date: tasks.date,
			total: sql<number>`count(*)`,
			completed: sql<number>`count(${tasks.completedAt})`
		})
		.from(tasks)
		.where(and(gte(tasks.date, firstDay), lte(tasks.date, lastDay)))
		.groupBy(tasks.date)
		.all();

	// Get ratings for the month
	const ratings = await db
		.select({ date: dailyRatings.date, rating: dailyRatings.rating })
		.from(dailyRatings)
		.where(and(gte(dailyRatings.date, firstDay), lte(dailyRatings.date, lastDay)))
		.all();

	const taskCountMap = Object.fromEntries(
		taskCounts.map((tc) => [tc.date, { total: tc.total, completed: tc.completed }])
	);
	const ratingMap = Object.fromEntries(ratings.map((r) => [r.date, r.rating]));

	// Previous/next month
	const prevDate = new Date(year, month - 2, 1);
	const nextDate = new Date(year, month, 1);
	const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
	const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

	return {
		year,
		month,
		today,
		firstDay,
		lastDay,
		taskCountMap,
		ratingMap,
		prevMonth,
		nextMonth
	};
};
