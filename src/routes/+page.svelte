<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
	import TaskCard from '$lib/components/TaskCard.svelte';

	interface Task {
		id: string;
		title: string;
		priority: 'low' | 'medium' | 'high';
		categoryId: string | null;
		date: string;
		completedAt: string | null;
		createdAt: string;
	}

	let { data } = $props();

	// Local state — initialised from server, mutated optimistically
	let tasks = $state<Task[]>([]);
	let categories = $state<typeof data.categories>([]);

	// Sync from server when date changes (including initial load)
	let syncedDate = $state('');
	$effect(() => {
		if (data.date !== syncedDate) {
			syncedDate = data.date;
			tasks = [...data.tasks];
			categories = [...data.categories];
		}
	});

	let newTitle = $state('');
	let newPriority = $state<'low' | 'medium' | 'high'>('medium');
	let newCategoryId = $state<string | null>(null);
	let filterCategoryId = $state<string | null>(null);
	let loading = $state(false);
	let showCategoryManager = $state(false);
	let newCategoryName = $state('');
	let newCategoryColor = $state('#6366f1');
	let errorMessage = $state('');
	let addingCategory = $state(false);

	const isToday = $derived(data.date === data.today);

	function showError(msg: string) {
		errorMessage = msg;
		setTimeout(() => {
			errorMessage = '';
		}, 4000);
	}

	async function apiCall(fn: () => Promise<Response>): Promise<Response | null> {
		try {
			const res = await fn();
			if (!res.ok) {
				const body = await res.json().catch(() => ({ error: 'Request failed' }));
				showError(body.error ?? `Error: ${res.status}`);
				return null;
			}
			return res;
		} catch {
			showError('Network error — please try again');
			return null;
		}
	}

	function formatDateHeading(dateStr: string): string {
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
	}

	function offsetDate(dateStr: string, days: number): string {
		const d = new Date(dateStr + 'T00:00:00');
		d.setDate(d.getDate() + days);
		return d.toISOString().split('T')[0];
	}

	function navigateDate(days: number) {
		const newDate = offsetDate(data.date, days);
		if (newDate === data.today) {
			goto('/');
		} else {
			goto(`/?date=${newDate}`);
		}
	}

	const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

	function sortTasks(arr: Task[]): Task[] {
		return arr.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
	}

	async function addTask() {
		const title = newTitle.trim();
		if (!title || loading) return;

		// Optimistic: add to local state immediately with temp ID
		const tempId = `temp-${crypto.randomUUID()}`;
		const optimisticTask: Task = {
			id: tempId,
			title,
			priority: newPriority,
			categoryId: newCategoryId,
			date: data.date,
			completedAt: null,
			createdAt: new Date().toISOString()
		};
		tasks = sortTasks([...tasks, optimisticTask]);
		const savedTitle = newTitle;
		const savedPriority = newPriority;
		newTitle = '';
		newPriority = 'medium';

		// Sync to server
		loading = true;
		const res = await apiCall(() =>
			fetch('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					priority: savedPriority,
					categoryId: newCategoryId,
					date: data.date
				})
			})
		);

		if (res) {
			// Replace temp task with server version (gets real ID)
			const serverTask = await res.json();
			tasks = tasks.map((t) => (t.id === tempId ? serverTask : t));
		} else {
			// Rollback — remove the optimistic task, restore input
			tasks = tasks.filter((t) => t.id !== tempId);
			newTitle = savedTitle;
			newPriority = savedPriority;
		}
		loading = false;
	}

	async function toggleComplete(id: string, isCompleted: boolean) {
		// Optimistic: toggle locally
		const prevTasks = [...tasks];
		tasks = tasks.map((t) =>
			t.id === id ? { ...t, completedAt: isCompleted ? null : new Date().toISOString() } : t
		);

		// Sync to server
		const res = await apiCall(() =>
			fetch(`/api/tasks/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ completed: !isCompleted })
			})
		);

		if (!res) {
			// Rollback
			tasks = prevTasks;
		}
	}

	async function deleteTask(id: string) {
		const task = tasks.find((t) => t.id === id);
		if (!confirm(`Delete "${task?.title ?? 'this task'}"?`)) return;

		// Optimistic: remove locally
		const prevTasks = [...tasks];
		tasks = tasks.filter((t) => t.id !== id);

		// Sync to server
		const res = await apiCall(() => fetch(`/api/tasks/${id}`, { method: 'DELETE' }));

		if (!res) {
			// Rollback
			tasks = prevTasks;
		}
	}

	async function addCategory() {
		const name = newCategoryName.trim();
		if (!name || addingCategory) return;

		addingCategory = true;
		const res = await apiCall(() =>
			fetch('/api/categories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, color: newCategoryColor })
			})
		);
		if (res) {
			const newCat = await res.json();
			categories = [...categories, newCat];
			newCategoryName = '';
			newCategoryColor = '#6366f1';
		}
		addingCategory = false;
	}

	async function deleteCategory(id: string) {
		const cat = categories.find((c) => c.id === id);
		if (
			!confirm(
				`Delete category "${cat?.name ?? 'this category'}"? Tasks in this category will become uncategorised.`
			)
		)
			return;

		// Optimistic
		const prevCategories = [...categories];
		const prevTasks = [...tasks];
		categories = categories.filter((c) => c.id !== id);
		tasks = tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t));
		if (filterCategoryId === id) filterCategoryId = null;
		if (newCategoryId === id) newCategoryId = null;

		const res = await apiCall(() => fetch(`/api/categories/${id}`, { method: 'DELETE' }));

		if (!res) {
			categories = prevCategories;
			tasks = prevTasks;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') addTask();
	}

	function handleCategoryKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') addCategory();
	}

	const filteredTasks = $derived(
		filterCategoryId ? tasks.filter((t) => t.categoryId === filterCategoryId) : tasks
	);

	// Rating is based on ALL tasks, not filtered
	const allCompleted = $derived(tasks.filter((t) => t.completedAt).length);
	const allTotal = $derived(tasks.length);
	const ratingPct = $derived(allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0);

	function getRatingMessage(pct: number, total: number): string {
		if (total === 0) return '';
		if (pct === 100) return 'Perfect day! You crushed it! \u{1F525}';
		if (pct >= 80) return 'Almost there \u2014 strong finish! \u{1F4AA}';
		if (pct >= 60) return 'Good progress, keep pushing! \u{1F680}';
		if (pct >= 40) return "You're building momentum \u{26A1}";
		if (pct >= 20) return 'Every task counts \u2014 keep going! \u{1F331}';
		if (pct > 0) return "You've started \u2014 that's the hardest part! \u{2705}";
		return 'Ready to start? Pick one task and go! \u{1F3AF}';
	}

	function getRatingStrokeColor(pct: number): string {
		if (pct >= 80) return 'stroke-rating-excellent';
		if (pct >= 60) return 'stroke-rating-good';
		if (pct >= 40) return 'stroke-rating-ok';
		if (pct >= 20) return 'stroke-rating-low';
		return 'stroke-rating-poor';
	}

	// Debounced rating save
	let ratingTimeout: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		if (tasks.length > 0) {
			void allCompleted;
			void allTotal;
			if (ratingTimeout) clearTimeout(ratingTimeout);
			ratingTimeout = setTimeout(() => {
				fetch('/api/ratings', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						date: data.date,
						totalTasks: allTotal,
						completedTasks: allCompleted
					})
				});
			}, 500);
		}
	});

	const categoryMap = $derived(Object.fromEntries(categories.map((c) => [c.id, c])));
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<!-- Error toast -->
	{#if errorMessage}
		<div
			class="fixed top-4 right-4 z-50 rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger shadow-lg"
		>
			{errorMessage}
		</div>
	{/if}

	<header class="mb-8">
		<h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">
			{isToday ? "Today's Tasks" : 'Tasks'}
		</h1>

		<!-- Date navigation -->
		<div class="mt-2 flex items-center gap-3">
			<button
				onclick={() => navigateDate(-1)}
				class="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
				aria-label="Previous day"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
			<span class="text-sm font-medium text-surface-700 dark:text-surface-300">
				{formatDateHeading(data.date)}
			</span>
			<button
				onclick={() => navigateDate(1)}
				class="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
				aria-label="Next day"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
			{#if !isToday}
				<a
					href="/"
					class="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400"
				>
					Today
				</a>
			{/if}
		</div>

		{#if allTotal > 0 || data.streaks.current > 0 || data.streaks.best > 0}
			<div class="mt-4 flex gap-4 rounded-xl bg-white p-4 shadow-card dark:bg-surface-800">
				<!-- Circular progress ring -->
				{#if allTotal > 0}
					<div class="flex shrink-0 flex-col items-center">
						<div class="relative h-16 w-16">
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
									class={getRatingStrokeColor(ratingPct)}
									style="stroke-dasharray: {2 * Math.PI * 28}; stroke-dashoffset: {2 *
										Math.PI *
										28 *
										(1 - ratingPct / 100)}; transition: stroke-dashoffset 0.5s ease-out;"
								/>
							</svg>
							<span
								class="absolute inset-0 flex items-center justify-center text-sm font-bold text-surface-900 dark:text-surface-100"
							>
								{ratingPct}%
							</span>
						</div>
					</div>

					<!-- Stats text -->
					<div class="flex flex-1 flex-col justify-center gap-1">
						<p class="text-sm text-surface-500 dark:text-surface-400">
							{allCompleted} of {allTotal} completed
						</p>
						<p class="text-sm font-medium text-surface-700 dark:text-surface-300">
							{getRatingMessage(ratingPct, allTotal)}
						</p>
						<!-- Streak badges inline -->
						{#if data.streaks.current > 0 || data.streaks.best > 0}
							<div class="mt-1 flex gap-2">
								{#if data.streaks.current > 0}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-600 dark:bg-accent-500/10 dark:text-accent-400"
									>
										{'\u{1F525}'}
										{data.streaks.current}d
									</span>
								{/if}
								{#if data.streaks.best > 0}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
									>
										{'\u{1F3C6}'}
										{data.streaks.best}d best
									</span>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</header>

	<!-- Add task form -->
	<div class="mb-6 rounded-xl bg-white shadow-card dark:bg-surface-800">
		<!-- Input row -->
		<div class="flex items-center gap-2 px-4 py-3">
			<svg
				class="h-5 w-5 shrink-0 text-primary-400 dark:text-primary-500"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			<input
				type="text"
				bind:value={newTitle}
				onkeydown={handleKeydown}
				placeholder="Add a new task..."
				class="flex-1 bg-transparent py-0.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none dark:text-surface-100 dark:placeholder-surface-500"
				disabled={loading}
			/>
			<button
				onclick={addTask}
				disabled={loading || !newTitle.trim()}
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-30 dark:bg-primary-500 dark:hover:bg-primary-600"
				aria-label="Add task"
			>
				{#if loading}
					<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"
						></circle>
						<path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
						></path>
					</svg>
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				{/if}
			</button>
		</div>
		<!-- Options row -->
		<div
			class="flex items-center gap-2 border-t border-surface-100 px-4 py-2 dark:border-surface-700"
		>
			<select
				bind:value={newPriority}
				disabled={loading}
				class="rounded-lg border-0 bg-surface-50 px-2.5 py-1 text-xs text-surface-600 focus:ring-2 focus:ring-primary-100 focus:outline-none sm:text-sm dark:bg-surface-700 dark:text-surface-300"
			>
				<option value="high">High</option>
				<option value="medium">Medium</option>
				<option value="low">Low</option>
			</select>
			<select
				bind:value={newCategoryId}
				disabled={loading}
				class="rounded-lg border-0 bg-surface-50 px-2.5 py-1 text-xs text-surface-600 focus:ring-2 focus:ring-primary-100 focus:outline-none sm:text-sm dark:bg-surface-700 dark:text-surface-300"
			>
				<option value={null}>No category</option>
				{#each categories as cat (cat.id)}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Category filter + manage -->
	<div class="mb-6 flex flex-wrap items-center gap-2">
		<span class="text-xs text-surface-400">Filter:</span>
		<button
			onclick={() => (filterCategoryId = null)}
			class="rounded-full px-3 py-1 text-xs font-medium transition {filterCategoryId === null
				? 'bg-surface-900 text-white dark:bg-surface-100 dark:text-surface-900'
				: 'bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'}"
		>
			All
		</button>
		{#each categories as cat (cat.id)}
			<button
				onclick={() => (filterCategoryId = cat.id)}
				class="rounded-full px-3 py-1 text-xs font-medium transition"
				style={filterCategoryId === cat.id
					? `background-color: ${cat.color}; color: white;`
					: `background-color: ${cat.color}15; color: ${cat.color};`}
			>
				{cat.name}
			</button>
		{/each}
		<button
			onclick={() => (showCategoryManager = !showCategoryManager)}
			class="ml-auto text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
		>
			{showCategoryManager ? 'Close' : 'Manage categories'}
		</button>
	</div>

	<!-- Category manager -->
	{#if showCategoryManager}
		<div
			class="mb-6 rounded-xl border border-surface-200 bg-white p-4 shadow-card dark:border-surface-700 dark:bg-surface-800"
		>
			<h3 class="mb-3 text-sm font-medium text-surface-700 dark:text-surface-300">Categories</h3>
			<div class="mb-3 flex gap-2">
				<input
					type="text"
					bind:value={newCategoryName}
					onkeydown={handleCategoryKeydown}
					placeholder="Category name"
					class="flex-1 rounded-lg border border-surface-200 px-3 py-1.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
					disabled={addingCategory}
				/>
				<input
					type="color"
					bind:value={newCategoryColor}
					class="h-8 w-10 cursor-pointer rounded border border-surface-200 dark:border-surface-700"
					disabled={addingCategory}
				/>
				<button
					onclick={addCategory}
					disabled={!newCategoryName.trim() || addingCategory}
					class="rounded-lg bg-surface-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-surface-800 disabled:opacity-50 dark:bg-surface-100 dark:text-surface-900 dark:hover:bg-surface-200"
				>
					{addingCategory ? '...' : 'Add'}
				</button>
			</div>
			{#if categories.length === 0}
				<p class="text-xs text-surface-400">No categories yet</p>
			{:else}
				<ul class="space-y-1.5">
					{#each categories as cat (cat.id)}
						<li class="flex items-center gap-2 text-sm">
							<span class="h-3 w-3 rounded-full" style="background-color: {cat.color};"></span>
							<span class="flex-1 text-surface-700 dark:text-surface-300">{cat.name}</span>
							<button
								onclick={() => deleteCategory(cat.id)}
								class="text-xs text-surface-400 hover:text-danger"
							>
								Remove
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	<!-- Task list -->
	{#if filteredTasks.length === 0}
		<div class="py-16 text-center">
			{#if filterCategoryId && tasks.length > 0}
				<p class="text-lg text-surface-400">No tasks in this category</p>
				<p class="mt-1 text-sm">
					<button onclick={() => (filterCategoryId = null)} class="text-primary-500 hover:underline"
						>Show all tasks</button
					>
				</p>
			{:else}
				<div class="text-surface-300 dark:text-surface-600">
					<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
				<p class="mt-3 text-surface-400">No tasks for this day</p>
				<p class="mt-1 text-sm text-surface-300 dark:text-surface-500">
					Add a task above to get started
				</p>
			{/if}
		</div>
	{:else}
		<ul class="space-y-2">
			{#each filteredTasks as task (task.id)}
				{@const category = task.categoryId ? categoryMap[task.categoryId] : null}
				<li
					in:slide={{ duration: 200, easing: quintOut }}
					out:fly={{ x: 80, duration: 250, easing: quintOut }}
					animate:flip={{ duration: 200 }}
				>
					<TaskCard
						title={task.title}
						priority={task.priority}
						completedAt={task.completedAt}
						{category}
						interactive
						onToggle={() => toggleComplete(task.id, !!task.completedAt)}
						onDelete={() => deleteTask(task.id)}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</div>
