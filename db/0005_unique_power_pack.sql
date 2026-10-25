CREATE TABLE `campus_3d_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` varchar(64) NOT NULL,
	`title` varchar(160) NOT NULL,
	`modelUrl` text NOT NULL,
	`modelKey` text,
	`mimeType` varchar(120) NOT NULL,
	`scale` decimal(8,3) NOT NULL DEFAULT '1.000',
	`rotationY` decimal(8,3) NOT NULL DEFAULT '0.000',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campus_3d_models_id` PRIMARY KEY(`id`),
	CONSTRAINT `campus_3d_models_zoneId_unique` UNIQUE(`zoneId`)
);
--> statement-breakpoint
ALTER TABLE `campus_3d_models` ADD CONSTRAINT `campus_3d_models_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;