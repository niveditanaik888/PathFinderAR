CREATE TABLE `campus_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slot` enum('hero','showcase','building','destination') NOT NULL DEFAULT 'showcase',
	`title` varchar(160) NOT NULL,
	`mediaUrl` text NOT NULL,
	`mediaKey` text,
	`mimeType` varchar(120) NOT NULL,
	`altText` varchar(300) NOT NULL,
	`caption` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campus_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorite_routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`sourceNodeExternalId` varchar(64) NOT NULL,
	`destinationExternalId` varchar(64) NOT NULL,
	`accessibleOnly` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favorite_routes_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_route_unique` UNIQUE(`userId`,`sourceNodeExternalId`,`destinationExternalId`,`accessibleOnly`)
);
--> statement-breakpoint
CREATE TABLE `route_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routeId` int NOT NULL,
	`userId` int NOT NULL,
	`currentWaypointIndex` int NOT NULL DEFAULT 0,
	`totalWaypoints` int NOT NULL,
	`remainingDistance` decimal(10,2) NOT NULL,
	`navigationState` enum('active','completed','stopped') NOT NULL DEFAULT 'active',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `route_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `route_progress_routeId_unique` UNIQUE(`routeId`)
);
--> statement-breakpoint
ALTER TABLE `campus_media` ADD CONSTRAINT `campus_media_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_routes` ADD CONSTRAINT `favorite_routes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `route_progress` ADD CONSTRAINT `route_progress_routeId_routes_id_fk` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `route_progress` ADD CONSTRAINT `route_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;