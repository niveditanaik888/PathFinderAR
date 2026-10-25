CREATE TABLE `indoor_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`buildingLabel` varchar(160) NOT NULL,
	`floorLabel` varchar(80) NOT NULL,
	`roomLabel` varchar(80) NOT NULL,
	`roomType` enum('room','lab','office','facility','entrance','staircase') NOT NULL DEFAULT 'room',
	`routeNodeExternalId` varchar(64),
	`description` text,
	`accessibilityInfo` text,
	`verificationSource` varchar(500) NOT NULL,
	`verificationStatus` enum('draft','verified','archived') NOT NULL DEFAULT 'draft',
	`isActive` boolean NOT NULL DEFAULT true,
	`verifiedAt` timestamp,
	`verifiedByUserId` int,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `indoor_locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `campus_3d_models` ADD `fileName` varchar(255);--> statement-breakpoint
ALTER TABLE `campus_3d_models` ADD `fileSizeBytes` int;--> statement-breakpoint
ALTER TABLE `campus_3d_models` ADD `approvalStatus` enum('draft','approved','retired') DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `campus_3d_models` ADD `sourceReference` varchar(500) DEFAULT 'AIET administrator-approved upload' NOT NULL;--> statement-breakpoint
ALTER TABLE `indoor_locations` ADD CONSTRAINT `indoor_locations_verifiedByUserId_users_id_fk` FOREIGN KEY (`verifiedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `indoor_locations` ADD CONSTRAINT `indoor_locations_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;