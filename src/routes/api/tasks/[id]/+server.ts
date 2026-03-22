import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
	parseJsonBody,
	validateTitle,
	validatePriority,
	validationError
} from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await parseJsonBody(request);
	if (body instanceof Response) return body;

	const updates: Record<string, unknown> = {};

	if ('title' in body) {
		const err = validateTitle(body.title);
		if (err) return validationError(err);
		updates.title = (body.title as string).trim();
	}
	if ('priority' in body) {
		const err = validatePriority(body.priority);
		if (err) return validationError(err);
		updates.priority = body.priority;
	}
	if ('categoryId' in body) updates.categoryId = body.categoryId;
	if ('completed' in body) {
		updates.completedAt = body.completed ? new Date().toISOString() : null;
	}

	const result = await db.update(tasks).set(updates).where(eq(tasks.id, params.id)).returning();

	if (result.length === 0) {
		return json({ error: 'Task not found' }, { status: 404 });
	}

	return json(result[0]);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const result = await db.delete(tasks).where(eq(tasks.id, params.id)).returning();

	if (result.length === 0) {
		return json({ error: 'Task not found' }, { status: 404 });
	}

	return json({ success: true });
};
