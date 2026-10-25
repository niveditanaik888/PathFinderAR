CREATE TABLE `favorite_route_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`favoriteRouteId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`includeAnnotations` boolean NOT NULL DEFAULT false,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_route_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_route_shares_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `favorite_route_shares` ADD CONSTRAINT `favorite_route_shares_favoriteRouteId_favorite_routes_id_fk` FOREIGN KEY (`favoriteRouteId`) REFERENCES `favorite_routes`(`id`) ON DELETE cascade ON UPDATE no action;