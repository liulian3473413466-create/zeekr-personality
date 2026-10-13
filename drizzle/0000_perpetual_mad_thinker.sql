CREATE TABLE `participants` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`participant_key` text NOT NULL,
	`answers` text NOT NULL,
	`result` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`participant_key`) REFERENCES `participants`(`key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `results_request_unique` ON `results` (`request_id`);--> statement-breakpoint
CREATE INDEX `results_participant_idx` ON `results` (`participant_key`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`participant_key` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`participant_key`) REFERENCES `participants`(`key`) ON UPDATE no action ON DELETE no action
);
