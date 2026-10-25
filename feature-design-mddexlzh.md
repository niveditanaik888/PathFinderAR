# Live Navigation and Campus Content Design

## Live navigation progress

The browser remains the source of truth for real-time geolocation. Active navigation watches the user’s location only after explicit permission, derives the nearest planned waypoint, remaining distance, and completion state locally, and stops the watcher when navigation ends. The application stores no continuous location trail. A route session is updated only with the current waypoint index and calculated remaining distance, allowing a signed-in user to resume an active route without retaining unnecessary raw location history.

## Favourite routes

`favorite_routes` stores a signed-in user’s named shortcut to an existing configured source and destination. Each favourite includes source and destination external IDs, the accessibility preference, and timestamps. A unique user/source/destination/accessibility combination prevents accidental duplicates. Routes remain calculated from the current campus graph at launch, so blocked paths and updated campus topology are respected.

## Administrator-managed campus content

Existing `buildings`, `destinations`, and `graph_nodes` remain authoritative for location data. Their existing image fields are managed through protected administrator procedures. A new `campus_media` table manages configurable public visual slots such as the landing-page hero, with media type, managed storage URL, accessibility alt text, caption, ordering, and active status. The public landing experience uses a safe built-in fallback if no active managed item exists.

## Access and reliability

All favourites and route-session updates require authentication and are scoped to the current user. Campus management procedures require the existing administrator role. Uploaded imagery is sent through the existing managed storage workflow, with size and MIME-type validation at the server boundary. Client flows include sign-in, permission, offline, empty, and mutation-error states.
