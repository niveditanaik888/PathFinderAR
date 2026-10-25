CREATE TABLE `floor_plan_overlays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` varchar(64) NOT NULL,
	`buildingLabel` varchar(160) NOT NULL,
	`floorLabel` varchar(80) NOT NULL,
	`title` varchar(160) NOT NULL,
	`overlayUrl` text NOT NULL,
	`overlayKey` text,
	`mimeType` varchar(120) NOT NULL,
	`fileName` varchar(255),
	`fileSizeBytes` int,
	`approvalStatus` enum('draft','approved','retired') NOT NULL DEFAULT 'draft',
	`sourceReference` varchar(500) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `floor_plan_overlays_id` PRIMARY KEY(`id`),
	CONSTRAINT `floor_plan_overlay_floor_unique` UNIQUE(`zoneId`,`buildingLabel`,`floorLabel`)
);
--> statement-breakpoint
ALTER TABLE `floor_plan_overlays` ADD CONSTRAINT `floor_plan_overlays_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;