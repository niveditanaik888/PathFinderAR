CREATE TABLE `floor_plan_markers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`overlayId` int NOT NULL,
	`indoorLocationId` int,
	`label` varchar(160) NOT NULL,
	`xPercent` int NOT NULL,
	`yPercent` int NOT NULL,
	`routeNodeExternalId` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `floor_plan_markers_id` PRIMARY KEY(`id`),
	CONSTRAINT `floor_plan_marker_label_unique` UNIQUE(`overlayId`,`label`)
);
--> statement-breakpoint
ALTER TABLE `floor_plan_overlays` ADD `isPriorityOffice` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `indoor_locations` ADD `searchAliases` text;--> statement-breakpoint
ALTER TABLE `indoor_locations` ADD `commonSearchTerms` text;--> statement-breakpoint
ALTER TABLE `floor_plan_markers` ADD CONSTRAINT `floor_plan_markers_overlayId_floor_plan_overlays_id_fk` FOREIGN KEY (`overlayId`) REFERENCES `floor_plan_overlays`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `floor_plan_markers` ADD CONSTRAINT `floor_plan_markers_indoorLocationId_indoor_locations_id_fk` FOREIGN KEY (`indoorLocationId`) REFERENCES `indoor_locations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `floor_plan_markers` ADD CONSTRAINT `floor_plan_markers_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;