import { json } from '@sveltejs/kit';

const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const MAX_TITLE_LENGTH = 500;
const MAX_NAME_LENGTH = 100;

export function validatePriority(priority: unknown): string | null {
	if (
		typeof priority !== 'string' ||
		!VALID_PRIORITIES.includes(priority as (typeof VALID_PRIORITIES)[number])
	) {
		return `priority must be one of: ${VALID_PRIORITIES.join(', ')}`;
	}
	return null;
}

export function validateDate(date: unknown): string | null {
	if (typeof date !== 'string' || !DATE_REGEX.test(date)) {
		return 'date must be in YYYY-MM-DD format';
	}
	return null;
}

export function validateTitle(title: unknown): string | null {
	if (typeof title !== 'string' || title.trim().length === 0) {
		return 'title is required and must be a non-empty string';
	}
	if (title.length > MAX_TITLE_LENGTH) {
		return `title must be ${MAX_TITLE_LENGTH} characters or less`;
	}
	return null;
}

export function validateCategoryName(name: unknown): string | null {
	if (typeof name !== 'string' || name.trim().length === 0) {
		return 'name is required and must be a non-empty string';
	}
	if (name.length > MAX_NAME_LENGTH) {
		return `name must be ${MAX_NAME_LENGTH} characters or less`;
	}
	return null;
}

export function validateColor(color: unknown): string | null {
	if (typeof color !== 'string' || !COLOR_REGEX.test(color)) {
		return 'color must be a valid hex color (e.g. #ff0000)';
	}
	return null;
}

export function validatePositiveInt(value: unknown, field: string): string | null {
	if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
		return `${field} must be a non-negative integer`;
	}
	return null;
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown> | Response> {
	try {
		return await request.json();
	} catch {
		return json({ error: 'Invalid JSON in request body' }, { status: 400 });
	}
}

export function validationError(message: string) {
	return json({ error: message }, { status: 400 });
}
