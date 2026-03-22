<script lang="ts">
	let { data } = $props();

	const monthName = $derived(
		new Date(data.year, data.month - 1).toLocaleDateString('en-GB', {
			month: 'long',
			year: 'numeric'
		})
	);

	// Build calendar grid
	const calendarDays = $derived.by(() => {
		const firstOfMonth = new Date(data.year, data.month - 1, 1);
		const daysInMonth = new Date(data.year, data.month, 0).getDate();
		// Monday = 0, Sunday = 6
		const startDay = (firstOfMonth.getDay() + 6) % 7;

		const days: Array<{
			date: string;
			day: number;
			isCurrentMonth: boolean;
			isToday: boolean;
			tasks: { total: number; completed: number } | null;
			rating: number | null;
		}> = [];

		// Previous month padding
		const prevMonthDays = new Date(data.year, data.month - 1, 0).getDate();
		for (let i = startDay - 1; i >= 0; i--) {
			const d = prevMonthDays - i;
			const prevMonth = data.month === 1 ? 12 : data.month - 1;
			const prevYear = data.month === 1 ? data.year - 1 : data.year;
			const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			days.push({
				date: dateStr,
				day: d,
				isCurrentMonth: false,
				isToday: dateStr === data.today,
				tasks: null,
				rating: null
			});
		}

		// Current month
		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			days.push({
				date: dateStr,
				day: d,
				isCurrentMonth: true,
				isToday: dateStr === data.today,
				tasks: data.taskCountMap[dateStr] ?? null,
				rating: data.ratingMap[dateStr] ?? null
			});
		}

		// Next month padding to fill last row
		const remaining = 7 - (days.length % 7);
		if (remaining < 7) {
			for (let d = 1; d <= remaining; d++) {
				const nextMonth = data.month === 12 ? 1 : data.month + 1;
				const nextYear = data.month === 12 ? data.year + 1 : data.year;
				const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
				days.push({
					date: dateStr,
					day: d,
					isCurrentMonth: false,
					isToday: dateStr === data.today,
					tasks: null,
					rating: null
				});
			}
		}

		return days;
	});

	function getRatingDotColor(rating: number | null): string {
		if (rating === null) return '';
		const pct = Math.round(rating * 100);
		if (pct >= 80) return 'bg-rating-excellent';
		if (pct >= 60) return 'bg-rating-good';
		if (pct >= 40) return 'bg-rating-ok';
		if (pct >= 20) return 'bg-rating-low';
		return 'bg-rating-poor';
	}

	const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<header class="mb-6">
		<!-- Month navigation -->
		<div class="flex items-center justify-between">
			<a
				href="/calendar?month={data.prevMonth}"
				class="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
				aria-label="Previous month"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</a>
			<h1 class="text-xl font-bold text-surface-900 dark:text-surface-50">{monthName}</h1>
			<a
				href="/calendar?month={data.nextMonth}"
				class="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
				aria-label="Next month"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</header>

	<!-- Calendar grid -->
	<div class="rounded-xl bg-white shadow-card dark:bg-surface-800">
		<!-- Weekday headers -->
		<div class="grid grid-cols-7 border-b border-surface-100 dark:border-surface-700">
			{#each weekdays as day (day)}
				<div class="py-2 text-center text-xs font-medium text-surface-400">{day}</div>
			{/each}
		</div>

		<!-- Day cells -->
		<div class="grid grid-cols-7">
			{#each calendarDays as day, i (day.date)}
				{@const isLastRow = i >= calendarDays.length - 7}
				{@const isLastCol = (i + 1) % 7 === 0}
				<a
					href="/?date={day.date}"
					class="relative flex min-h-[4rem] flex-col items-center border-r border-b border-surface-50 p-1.5 transition-colors hover:bg-primary-50/50 sm:min-h-[5rem] sm:p-2 dark:border-surface-700/50 dark:hover:bg-primary-500/5
						{isLastRow ? 'border-b-0' : ''}
						{isLastCol ? 'border-r-0' : ''}
						{day.isCurrentMonth ? '' : 'opacity-30'}"
				>
					<!-- Day number -->
					<span
						class="flex h-7 w-7 items-center justify-center rounded-full text-sm {day.isToday
							? 'bg-primary-600 font-bold text-white dark:bg-primary-500'
							: 'text-surface-700 dark:text-surface-300'}"
					>
						{day.day}
					</span>

					<!-- Task indicators -->
					{#if day.tasks}
						<div class="mt-auto flex flex-col items-center gap-0.5">
							<!-- Rating dot -->
							{#if day.rating !== null}
								<div class="h-1.5 w-1.5 rounded-full {getRatingDotColor(day.rating)}"></div>
							{/if}
							<!-- Task count -->
							<span class="text-[10px] text-surface-400">
								{day.tasks.completed}/{day.tasks.total}
							</span>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	</div>

	<!-- Legend -->
	<div class="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-surface-400">
		<span class="flex items-center gap-1">
			<span class="h-2 w-2 rounded-full bg-rating-excellent"></span> 80%+
		</span>
		<span class="flex items-center gap-1">
			<span class="h-2 w-2 rounded-full bg-rating-good"></span> 60%+
		</span>
		<span class="flex items-center gap-1">
			<span class="h-2 w-2 rounded-full bg-rating-ok"></span> 40%+
		</span>
		<span class="flex items-center gap-1">
			<span class="h-2 w-2 rounded-full bg-rating-low"></span> 20%+
		</span>
		<span class="flex items-center gap-1">
			<span class="h-2 w-2 rounded-full bg-rating-poor"></span> &lt;20%
		</span>
	</div>
</div>
