# Route sharing and active voice guidance design

## Share-link boundary

Each shareable saved route receives a high-entropy, URL-safe token. The server persists only a SHA-256 hash of that token; the original value is returned once to the route owner for copying or QR encoding. Generating a new link revokes prior links for that saved route. A public lookup returns only the configured source, destination, accessibility preference, and display label. Notes and tags remain private unless the route owner explicitly elects to include them.

## Public route handoff

The public route page resolves the token server-side through a public read-only procedure. It saves only configured campus identifiers in session launch state and opens the existing map route flow. It never reveals the owner identity, favourites collection, private route history, or any raw location data.

## Spoken active-navigation rules

Guidance is spoken only when voice is enabled and navigation is active. The client announces the start once, a waypoint instruction once when the active waypoint advances, and arrival once. It resets this announcement state whenever the user starts, stops, reroutes, or changes a route, preventing repeated synthesis on normal position updates. Guidance reuses the currently selected supported language and retains the existing visible controls.
