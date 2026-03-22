CREATE TABLE `inventory_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_categories_name_unique` ON `inventory_categories` (`name`);--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category_id` text,
	`estimated_price` real,
	`frequency_days` integer,
	`last_purchased_at` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `inventory_categories`(`id`) ON UPDATE no action ON DELETE set null
);
