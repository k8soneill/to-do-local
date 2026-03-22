<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Tasks', icon: 'check' },
		{ href: '/calendar', label: 'Calendar', icon: 'calendar' },
		{ href: '/history', label: 'History', icon: 'clock' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Top navigation -->
	<nav
		class="sticky top-0 z-40 border-b border-surface-200 bg-white/80 backdrop-blur-lg dark:border-surface-700 dark:bg-surface-900/80"
	>
		<div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
			<!-- App name -->
			<a href="/" class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white dark:bg-primary-500"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<span class="text-lg font-bold text-surface-900 dark:text-surface-50">DoList</span>
			</a>

			<!-- Nav links -->
			<div class="flex items-center gap-1">
				{#each navItems as item (item.href)}
					{@const active = isActive(item.href)}
					<a
						href={item.href}
						class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors {active
							? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
							: 'text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200'}"
					>
						{#if item.icon === 'check'}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
								/>
							</svg>
						{:else if item.icon === 'calendar'}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						{:else if item.icon === 'clock'}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						{/if}
						{item.label}
					</a>
				{/each}
			</div>
		</div>
	</nav>

	<!-- Page content -->
	<main class="flex-1">
		{@render children()}
	</main>
</div>
