<script lang="ts">
	import { scale } from 'svelte/transition';

	interface Category {
		id: string;
		name: string;
		color: string;
	}

	interface Props {
		title: string;
		priority: 'low' | 'medium' | 'high';
		completedAt: string | null;
		category?: Category | null;
		interactive?: boolean;
		onToggle?: () => void;
		onDelete?: () => void;
	}

	let {
		title,
		priority,
		completedAt,
		category = null,
		interactive = false,
		onToggle,
		onDelete
	}: Props = $props();

	const isCompleted = $derived(!!completedAt);

	const priorityBadgeColors: Record<string, string> = {
		high: 'bg-priority-high-bg text-priority-high',
		medium: 'bg-priority-medium-bg text-priority-medium',
		low: 'bg-priority-low-bg text-priority-low'
	};

	const priorityBorderColors: Record<string, string> = {
		high: 'border-l-priority-high',
		medium: 'border-l-priority-medium',
		low: 'border-l-priority-low'
	};
</script>

<div
	class="{interactive
		? 'group'
		: ''} flex items-center gap-3 rounded-xl border-l-4 bg-white px-4 py-3.5 shadow-card dark:bg-surface-800 {interactive
		? 'transition-all hover:shadow-card-hover'
		: ''} {isCompleted
		? 'border-l-surface-300 dark:border-l-surface-600'
		: priorityBorderColors[priority]}"
>
	<!-- Checkbox / indicator -->
	{#if interactive}
		<button
			onclick={onToggle}
			class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors {isCompleted
				? 'border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400'
				: 'border-surface-300 hover:border-primary-400 dark:border-surface-600 dark:hover:border-primary-500'}"
			aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
		>
			{#if isCompleted}
				<svg
					in:scale={{ duration: 200, start: 0 }}
					class="h-3 w-3 text-white"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			{/if}
		</button>
	{:else}
		<span
			class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {isCompleted
				? 'border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400'
				: 'border-surface-300 dark:border-surface-600'}"
		>
			{#if isCompleted}
				<svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			{/if}
		</span>
	{/if}

	<!-- Task content -->
	<div class="min-w-0 flex-1">
		<span
			class="block truncate text-sm {isCompleted
				? 'text-surface-400 line-through dark:text-surface-500'
				: 'text-surface-800 dark:text-surface-100'}"
		>
			{title}
		</span>
		{#if category}
			<span class="mt-0.5 block text-xs" style="color: {category.color};">
				{category.name}
			</span>
		{/if}
	</div>

	<!-- Priority badge -->
	<span
		class="hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline {priorityBadgeColors[
			priority
		]}"
	>
		{priority}
	</span>

	<!-- Delete button (interactive only, visible on hover) -->
	{#if interactive && onDelete}
		<button
			onclick={onDelete}
			class="shrink-0 rounded-lg p-1 text-surface-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger-light hover:text-danger dark:text-surface-600 dark:hover:bg-danger/10"
			aria-label="Delete task"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
				/>
			</svg>
		</button>
	{/if}
</div>
