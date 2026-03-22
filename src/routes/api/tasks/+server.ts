import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import {
	parseJsonBody,
	validateTitle,
	validatePriority,
	validateDate,
	validationError
} from '$lib/server/validation';
import type { RequestHandler } from './$types';

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

export const GET: RequestHandler = async ({ url }) => {
	const date = url.searchParams.get('date');
	const categoryId = url.searchParams.get('categoryId');

	const conditions = [];
	if (date) conditions.push(eq(tasks.date, date));
	if (categoryId) conditions.push(eq(tasks.categoryId, categoryId));

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const result = await db.select().from(tasks).where(where).orderBy(asc(tasks.createdAt)).all();

	result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

	return json(result);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await parseJsonBody(request);
	if (body instanceof Response) return body;

	const { title, priority, categoryId, date } = body;

	const titleErr = validateTitle(title);
	if (titleErr) return validationError(titleErr);

	const dateErr = validateDate(date);
	if (dateErr) return validationError(dateErr);

	if (priority !== undefined) {
		const priorityErr = validatePriority(priority);
		if (priorityErr) return validationError(priorityErr);
	}

	const result = await db
		.insert(tasks)
		.values({
			title: (title as string).trim(),
			priority: (priority as 'low' | 'medium' | 'high') ?? 'medium',
			categoryId: (categoryId as string) ?? null,
			date: date as string
		})
		.returning();

	return json(result[0], { status: 201 });
};
