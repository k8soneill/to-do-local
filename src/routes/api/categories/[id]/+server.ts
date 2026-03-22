import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
	parseJsonBody,
	validateCategoryName,
	validateColor,
	validationError
} from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await parseJsonBody(request);
	if (body instanceof Response) return body;

	const updates: Record<string, unknown> = {};

	if ('name' in body) {
		const err = validateCategoryName(body.name);
		if (err) return validationError(err);
		updates.name = (body.name as string).trim();
	}
	if ('color' in body) {
		const err = validateColor(body.color);
		if (err) return validationError(err);
		updates.color = body.color;
	}

	const result = await db
		.update(categories)
		.set(updates)
		.where(eq(categories.id, params.id))
		.returning();

	if (result.length === 0) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	return json(result[0]);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const result = await db.delete(categories).where(eq(categories.id, params.id)).returning();

	if (result.length === 0) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	return json({ success: true });
};
