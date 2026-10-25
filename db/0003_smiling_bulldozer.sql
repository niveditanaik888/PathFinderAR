CREATE TABLE `favorite_route_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`favoriteRouteId` int NOT NULL,
	`tag` varchar(24) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_route_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_route_tag_unique` UNIQUE(`favoriteRouteId`,`tag`)
);
--> statement-breakpoint
ALTER TABLE `favorite_routes` ADD `note` varchar(600);--> statement-breakpoint
ALTER TABLE `favorite_route_tags` ADD CONSTRAINT `favorite_route_tags_favoriteRouteId_favorite_routes_id_fk` FOREIGN KEY (`favoriteRouteId`) REFERENCES `favorite_routes`(`id`) ON DELETE cascade ON UPDATE no action;