# Voice Navigation and Route Annotations

## Natural-language voice requests

The Assistant retains the existing multilingual transcription and deterministic conversation engine. A completed spoken request is treated exactly like typed input. Directional phrases such as “Navigate to the library,” plus configured multilingual aliases, resolve only against PathFinder campus destinations. When the request identifies a destination but not a source, the Assistant asks for the source or uses the user-selected route source when one is already present. The established Assistant-to-Map launch state remains the only route handoff.

## Saved-route annotations

Favourite routes remain owned by the authenticated user. Each favourite has one optional private note, limited to 600 characters, and zero to six normalized tags. Tags are trimmed, case-normalized for matching, restricted to 24 characters, and stored as rows in `favorite_route_tags` so they can be filtered safely without parsing serialized client data. A server-side update operation checks route ownership and replaces tags atomically from the user-provided validated list.

## Live-progress motion

Live map calculations and persisted progress snapshots are unchanged. The experience adds only presentational feedback: a spring-like progress-bar update, waypoint-state transitions, a small live-position pulse, and an arrival treatment. These effects use opacity and transforms where possible, stay below 300 ms for interaction feedback, and are disabled or simplified under `prefers-reduced-motion`.
