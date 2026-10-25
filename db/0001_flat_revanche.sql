CREATE TABLE `blocked_paths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`edgeId` int NOT NULL,
	`reason` text NOT NULL,
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `blocked_paths_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buildings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`address` text,
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buildings_id` PRIMARY KEY(`id`),
	CONSTRAINT `buildings_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `destination_searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`destinationId` int NOT NULL,
	`searchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `destination_searches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `destinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(64) NOT NULL,
	`buildingId` int,
	`floorId` int,
	`nodeId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(80) NOT NULL,
	`description` text,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`roomNumber` varchar(40),
	`accessibilityInfo` text,
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `destinations_id` PRIMARY KEY(`id`),
	CONSTRAINT `destinations_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `floors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buildingId` int NOT NULL,
	`floorNumber` int NOT NULL,
	`floorName` varchar(80) NOT NULL,
	`mapImageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `floors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `graph_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceNodeId` int NOT NULL,
	`destinationNodeId` int NOT NULL,
	`distance` decimal(10,2) NOT NULL,
	`estimatedTime` int NOT NULL,
	`isBidirectional` boolean NOT NULL DEFAULT true,
	`isBlocked` boolean NOT NULL DEFAULT false,
	`isAccessible` boolean NOT NULL DEFAULT true,
	`edgeType` varchar(40) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `graph_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `graph_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(64) NOT NULL,
	`buildingId` int,
	`floorId` int,
	`name` varchar(160) NOT NULL,
	`nodeType` varchar(40) NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`xCoordinate` decimal(10,2) NOT NULL,
	`yCoordinate` decimal(10,2) NOT NULL,
	`isAccessible` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `graph_nodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `graph_nodes_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `navigation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`routeId` int NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`completionStatus` enum('completed','stopped','abandoned') NOT NULL,
	`deviationCount` int NOT NULL DEFAULT 0,
	`actualDistance` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `navigation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_deviations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routeId` int NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`distanceFromRoute` decimal(10,2) NOT NULL,
	`rerouted` boolean NOT NULL DEFAULT false,
	CONSTRAINT `route_deviations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_waypoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routeId` int NOT NULL,
	`nodeId` int,
	`sequenceNumber` int NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`instruction` text,
	CONSTRAINT `route_waypoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`destinationId` int,
	`startLatitude` decimal(10,7),
	`startLongitude` decimal(10,7),
	`algorithm` varchar(20) NOT NULL,
	`totalDistance` decimal(10,2) NOT NULL,
	`estimatedTime` int NOT NULL,
	`routeStatus` enum('planned','active','completed','stopped','rerouted') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `routes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `blocked_paths` ADD CONSTRAINT `blocked_paths_edgeId_graph_edges_id_fk` FOREIGN KEY (`edgeId`) REFERENCES `graph_edges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `destination_searches` ADD CONSTRAINT `destination_searches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `destination_searches` ADD CONSTRAINT `destination_searches_destinationId_destinations_id_fk` FOREIGN KEY (`destinationId`) REFERENCES `destinations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `destinations` ADD CONSTRAINT `destinations_buildingId_buildings_id_fk` FOREIGN KEY (`buildingId`) REFERENCES `buildings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `destinations` ADD CONSTRAINT `destinations_floorId_floors_id_fk` FOREIGN KEY (`floorId`) REFERENCES `floors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `destinations` ADD CONSTRAINT `destinations_nodeId_graph_nodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `graph_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `floors` ADD CONSTRAINT `floors_buildingId_buildings_id_fk` FOREIGN KEY (`buildingId`) REFERENCES `buildings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `graph_edges` ADD CONSTRAINT `graph_edges_sourceNodeId_graph_nodes_id_fk` FOREIGN KEY (`sourceNodeId`) REFERENCES `graph_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `graph_edges` ADD CONSTRAINT `graph_edges_destinationNodeId_graph_nodes_id_fk` FOREIGN KEY (`destinationNodeId`) REFERENCES `graph_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `graph_nodes` ADD CONSTRAINT `graph_nodes_buildingId_buildings_id_fk` FOREIGN KEY (`buildingId`) REFERENCES `buildings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `graph_nodes` ADD CONSTRAINT `graph_nodes_floorId_floors_id_fk` FOREIGN KEY (`floorId`) REFERENCES `floors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `navigation_history` ADD CONSTRAINT `navigation_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `navigation_history` ADD CONSTRAINT `navigation_history_routeId_routes_id_fk` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `route_deviations` ADD CONSTRAINT `route_deviations_routeId_routes_id_fk` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `route_waypoints` ADD CONSTRAINT `route_waypoints_routeId_routes_id_fk` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `route_waypoints` ADD CONSTRAINT `route_waypoints_nodeId_graph_nodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `graph_nodes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `routes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `routes_destinationId_destinations_id_fk` FOREIGN KEY (`destinationId`) REFERENCES `destinations`(`id`) ON DELETE set null ON UPDATE no action;