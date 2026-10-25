# PathFinder Smart Campus

**PathFinder Smart Campus** is a responsive web-based campus navigation and guidance system. It combines a searchable destination catalog, a Leaflet/OpenStreetMap campus map, graph-based route calculation, browser geolocation, a camera-first AR guidance overlay, navigation history, and an administrator graph-management workspace.

> This repository is designed as a complete **major-project build**. Its preloaded campus entities are replaceable demonstration data, not surveyed real-world campus data. Review and replace them before an institutional deployment.

| Area | Implementation |
|---|---|
| Public experience | Landing page, responsive navigation, destination discovery, map navigation, AR guidance, and history |
| Routing | Dijkstra and A* shortest-path algorithms, priority queue, Haversine distance, walking-time estimate, accessibility and blocked-edge filtering |
| Browser features | `watchPosition`, permission/error handling, accuracy display, device orientation, secure camera access, map-first fallbacks |
| API | Typed tRPC feature procedures and REST compatibility at `POST /api/routes/calculate` |
| Database | MySQL/Drizzle schema for campus data, graph data, routes, waypoints, history, deviations, blocked paths, and search demand |
| Administration | Protected analytics, graph editor, node/edge CRUD procedures, blocked-route controls, and map inspection |

## Run locally

The managed project already has dependencies installed and a database migration applied. In a standalone clone, install dependencies, make `DATABASE_URL` available, apply `drizzle/0001_flat_revanche.sql`, seed the demonstration campus once, and start the development server.

```bash
pnpm install
pnpm tsx scripts/seed-demo.ts
pnpm dev
```

Use the following quality gates before submission or deployment.

```bash
pnpm check
pnpm test
pnpm build
```

## Project routes

| Route | Purpose |
|---|---|
| `/` | Public PathFinder Smart Campus landing page |
| `/destinations` | Debounced destination discovery with category and building filters |
| `/map` | Interactive Leaflet map, route preview, real-time location controls, and deviation state |
| `/ar` | Camera-based AR overlay with orientation permission and map fallback |
| `/history` | Personal route-session history interface |
| `/admin` | Role-protected operational dashboard and genuine database analytics |
| `/admin/graph` | Graph inspection, blocked-edge control, and node-management entry point |

## Demonstration campus dataset

The database contains **3 buildings, 6 floors, 23 graph nodes, 34 graph edges, and 16 destinations** after the one-time seeding process. It includes Main Gate, Computer Science Department, CSE Laboratory, AI Lab, Innovation Lab, Research Centre, Central Library, Cafeteria, Auditorium, Seminar Hall, Administration Block, Principal Office, Examination Cell, Student Hostel, Parking Area, and Sports Complex.

The sole source of these samples is `shared/pathfinder.ts`. Replace the named building records, graph nodes, graph edges, and destinations there, then rebuild the migration/seed plan with approved surveyed campus data. Never use the sample coordinates for emergency, accessibility, security, or real-world wayfinding claims.

## Routing API

The required compatibility endpoint is available at exactly:

```http
POST /api/routes/calculate
Content-Type: application/json

{
  "startNodeId": "gate",
  "destinationNodeId": "ai-lab",
  "algorithm": "auto",
  "accessibleOnly": false
}
```

The response includes the selected algorithm, ordered waypoints, total distance in metres, estimated walking time in seconds, processing metrics, and human-readable instructions. `auto` selects Dijkstra at or below the named `SMALL_GRAPH_NODE_THRESHOLD` and A* above it.

## Configuration constants

All routing and deviation constants are intentionally named and centralized in `shared/pathfinder.ts`.

| Constant | Default | Role |
|---|---:|---|
| `SMALL_GRAPH_NODE_THRESHOLD` | `50` | Determines automatic Dijkstra versus A* selection |
| `DEVIATION_THRESHOLD_METERS` | `20` | Declares the off-route distance threshold |
| `REROUTE_COOLDOWN_MS` | `15000` | Avoids continuous recalculation after an off-route event |
| `WALKING_SPEED_METERS_PER_SECOND` | `1.4` | Converts route length to an estimated walking time |

The off-route interface uses the required message: **“You're off the planned route.”**

## AR and browser capability behaviour

PathFinder derives its on-screen overlay heading using the required formula:

```text
relativeBearing = targetBearing − deviceHeading
```

The implementation normalizes that result for display. Camera, geolocation, and orientation requests are made only after a direct user action. The interface provides clear fallbacks when a browser does not support the relevant API, the user declines access, positioning is unavailable, the request times out, or indoor signal accuracy is insufficient. Secure contexts are required for geolocation and camera features, apart from localhost development. [1] [2]

## Authentication and roles

This implementation uses the project template’s secured OAuth session architecture rather than maintaining a separate password database. That choice avoids storing campus passwords in the application. Authenticated users may use personal history. Users with the `admin` role can access database-backed operational statistics and management procedures. Promote a trusted operator through the database management interface or controlled SQL; do not expose administrator promotion in the public client.

## Major-project safety and limitations

PathFinder is a **guidance aid**, not an emergency-navigation, accessibility-certification, or life-safety system. Validate routes, entrances, indoor floor transitions, accessibility facts, maintenance closures, and supported device/browser combinations through a supervised campus test plan before use. GPS accuracy is inherently variable, and common browser geolocation implementations report an accuracy radius rather than a guaranteed location point. [1]

The AR page is a browser camera overlay with capability detection and a map fallback. A production team may integrate WebXR/AR.js, BLE beacons, Wi-Fi RTT, QR markers, or an approved indoor-positioning provider after site-specific validation. Device-specific availability should be checked at runtime rather than assumed. [3]

## Repository structure

```text
client/src/pages/          Public, navigation, AR, history, and administration screens
client/src/components/     Navigation shell, Leaflet map, dashboard layout, UI elements
shared/pathfinder.ts       Campus demo data and configurable constants
shared/routing.ts          Dijkstra, A*, Haversine, bearing, instructions, and deviation logic
drizzle/schema.ts          MySQL schema
drizzle/0001_*.sql         Reviewed migration
server/db.ts               Database helpers and analytics aggregates
server/routers.ts          Typed tRPC application procedures
server/restRoutes.ts       POST /api/routes/calculate compatibility endpoint
server/seed.ts             Isolated demo-campus seed logic
scripts/seed-demo.ts       Controlled one-time seed entry point
docs/ARCHITECTURE.md       Detailed component and data-flow documentation
```

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API "MDN Web Docs: Geolocation API"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia "MDN Web Docs: MediaDevices.getUserMedia"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent "MDN Web Docs: DeviceOrientationEvent"
