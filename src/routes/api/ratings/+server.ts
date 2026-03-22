import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailyRatings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
	parseJsonBody,
	validateDate,
	validatePositiveInt,
	validationError
} from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await parseJsonBody(request);
	if (body instanceof Response) return body;

	const { date, totalTasks, completedTasks } = body;

	const dateErr = validateDate(date);
	if (dateErr) return validationError(dateErr);

	const totalErr = validatePositiveInt(totalTasks, 'totalTasks');
	if (totalErr) return validationError(totalErr);

	const completedErr = validatePositiveInt(completedTasks, 'completedTasks');
	if (completedErr) return validationError(completedErr);

	if ((completedTasks as number) > (totalTasks as number)) {
		return validationError('completedTasks cannot exceed totalTasks');
	}

	const rating =
		(totalTasks as number) > 0 ? (completedTasks as number) / (totalTasks as number) : 0;

	const existing = await db
		.select()
		.from(dailyRatings)
		.where(eq(dailyRatings.date, date as string))
		.all();

	if (existing.length > 0) {
		const result = await db
			.update(dailyRatings)
			.set({ totalTasks: totalTasks as number, completedTasks: completedTasks as number, rating })
			.where(eq(dailyRatings.date, date as string))
			.returning();
		return json(result[0]);
	}

	const result = await db
		.insert(dailyRatings)
		.values({
			date: date as string,
			totalTasks: totalTasks as number,
			completedTasks: completedTasks as number,
			rating
		})
		.returning();

	return json(result[0], { status: 201 });
};
