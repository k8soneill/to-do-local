import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import {
	parseJsonBody,
	validateCategoryName,
	validateColor,
	validationError
} from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const result = await db.select().from(categories).all();
	return json(result);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await parseJsonBody(request);
	if (body instanceof Response) return body;

	const { name, color } = body;

	const nameErr = validateCategoryName(name);
	if (nameErr) return validationError(nameErr);

	if (color !== undefined) {
		const colorErr = validateColor(color);
		if (colorErr) return validationError(colorErr);
	}

	const result = await db
		.insert(categories)
		.values({ name: (name as string).trim(), color: (color as string) ?? '#6b7280' })
		.returning();

	return json(result[0], { status: 201 });
};
