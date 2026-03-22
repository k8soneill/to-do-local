<script lang="ts">
	import TaskCard from '$lib/components/TaskCard.svelte';

	let { data } = $props();

	function getRatingTextColor(rating: number): string {
		const pct = Math.round(rating * 100);
		if (pct >= 80) return 'text-rating-excellent';
		if (pct >= 60) return 'text-rating-good';
		if (pct >= 40) return 'text-rating-ok';
		if (pct >= 20) return 'text-rating-low';
		return 'text-rating-poor';
	}

	function getRatingStrokeColor(rating: number): string {
		const pct = Math.round(rating * 100);
		if (pct >= 80) return 'stroke-rating-excellent';
		if (pct >= 60) return 'stroke-rating-good';
		if (pct >= 40) return 'stroke-rating-ok';
		if (pct >= 20) return 'stroke-rating-low';
		return 'stroke-rating-poor';
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
	}

	function formatDateLong(dateStr: string): string {
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		});
	}

	function isToday(dateStr: string): boolean {
		return data.today === dateStr;
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	{#if data.mode === 'overview'}
		<header class="mb-6">
			<h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">History</h1>
		</header>

		{#if data.stats.totalDays > 0}
			<!-- Stats card -->
			<div class="mb-6 rounded-xl bg-white p-4 shadow-card dark:bg-surface-800">
				<div class="grid grid-cols-3 gap-4">
					<div class="text-center">
						<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
							{data.stats.totalDays}
						</p>
						<p class="text-xs text-surface-400">Days tracked</p>
					</div>
					<div class="text-center">
						<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
							{data.stats.perfectDays}
						</p>
						<p class="text-xs text-surface-400">Perfect days</p>
					</div>
					<div class="text-center">
						<p class="text-2xl font-bold {getRatingTextColor(data.stats.avgRating)}">
							{Math.round(data.stats.avgRating * 100)}%
						</p>
						<p class="text-xs text-surface-400">Avg completion</p>
					</div>
				</div>
				{#if data.streaks.current > 0 || data.streaks.best > 0}
					<div
						class="mt-3 flex items-center justify-center gap-3 border-t border-surface-100 pt-3 dark:border-surface-700"
					>
						{#if data.streaks.current > 0}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-600 dark:bg-accent-500/10 dark:text-accent-400"
							>
								{'\u{1F525}'}
								{data.streaks.current}d streak
							</span>
						{/if}
						{#if data.streaks.best > 0}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
							>
								{'\u{1F3C6}'}
								{data.streaks.best}d best
							</span>
						{/if}
						<span class="text-xs text-surface-400">
							({Math.round(data.streaks.threshold * 100)}%+ to count)
						</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if data.days.length === 0}
			<div class="py-16 text-center">
				<div class="text-surface-300 dark:text-surface-600">
					<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<p class="mt-3 text-surface-400">No history yet</p>
				<p class="mt-1 text-sm text-surface-300 dark:text-surface-500">
					Complete some tasks and they'll appear here
				</p>
			</div>
		{:else}
			<ul class="space-y-2">
				{#each data.days as day (day.date)}
					{@const pct = Math.round(day.rating * 100)}
					<li>
						<a
							href="/history?date={day.date}"
							class="flex items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-card transition-all hover:shadow-card-hover dark:bg-surface-800"
						>
							<!-- Mini progress ring -->
							<div class="relative h-10 w-10 shrink-0">
								<svg class="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
									<circle
										cx="20"
										cy="20"
										r="16"
										fill="none"
										stroke-width="3"
										class="stroke-surface-100 dark:stroke-surface-700"
									/>
									<circle
										cx="20"
										cy="20"
										r="16"
										fill="none"
										stroke-width="3"
										stroke-linecap="round"
										class={getRatingStrokeColor(day.rating)}
										style="stroke-dasharray: {2 * Math.PI * 16}; stroke-dashoffset: {2 *
											Math.PI *
											16 *
											(1 - day.rating)};"
									/>
								</svg>
								<span
									class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-surface-700 dark:text-surface-300"
								>
									{pct}
								</span>
							</div>

							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-surface-900 dark:text-surface-100">
									{formatDate(day.date)}
									{#if isToday(day.date)}
										<span class="ml-1 text-xs text-primary-500">(today)</span>
									{/if}
								</p>
								<p class="text-xs text-surface-400">
									{day.completedTasks} of {day.totalTasks} tasks
								</p>
							</div>

							<!-- Arrow -->
							<svg
								class="h-4 w-4 shrink-0 text-surface-300 dark:text-surface-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		<!-- Detail view for a specific date -->
		{@const categoryMap = Object.fromEntries(
			data.categories.map((c: { id: string; name: string; color: string }) => [c.id, c])
		)}
		<header class="mb-6">
			<a
				href="/history"
				class="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				All days
			</a>
			<h1 class="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
				{formatDateLong(data.date)}
				{#if isToday(data.date)}
					<span class="text-sm font-normal text-primary-500">(today)</span>
				{/if}
			</h1>

			{#if data.rating}
				{@const pct = Math.round(data.rating.rating * 100)}
				<div class="mt-4 flex gap-4 rounded-xl bg-white p-4 shadow-card dark:bg-surface-800">
					<div class="relative h-16 w-16 shrink-0">
						<svg class="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
							<circle
								cx="32"
								cy="32"
								r="28"
								fill="none"
								stroke-width="5"
								class="stroke-surface-100 dark:stroke-surface-700"
							/>
							<circle
								cx="32"
								cy="32"
								r="28"
								fill="none"
								stroke-width="5"
								stroke-linecap="round"
								class={getRatingStrokeColor(data.rating.rating)}
								style="stroke-dasharray: {2 * Math.PI * 28}; stroke-dashoffset: {2 *
									Math.PI *
									28 *
									(1 - data.rating.rating)};"
							/>
						</svg>
						<span
							class="absolute inset-0 flex items-center justify-center text-sm font-bold text-surface-900 dark:text-surface-100"
						>
							{pct}%
						</span>
					</div>
					<div class="flex flex-col justify-center">
						<p class="text-sm text-surface-500 dark:text-surface-400">
							{data.rating.completedTasks} of {data.rating.totalTasks} completed
						</p>
					</div>
				</div>
			{/if}
		</header>

		{#if data.tasks.length === 0}
			<div class="py-16 text-center">
				<p class="text-lg text-surface-400">No tasks on this day</p>
			</div>
		{:else}
			<ul class="space-y-2">
				{#each data.tasks as task (task.id)}
					{@const category = task.categoryId ? categoryMap[task.categoryId] : null}
					<li>
						<TaskCard
							title={task.title}
							priority={task.priority}
							completedAt={task.completedAt}
							{category}
						/>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
