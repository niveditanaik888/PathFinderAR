

## 2026-10-09 motion, audit dashboard, and staged multi-floor demo

- [x] Add idle/stride limb animation, dynamic ground shadow, and turn-aware camera interpolation to the Three.js walking person.
- [x] Add an authenticated administrator audit-log viewer with date, action, and entity filters plus CSV export.
- [x] Add a floating Ground/F1/F2 selector and sample multi-floor route graph, explicitly isolated as demo-only until authorised indoor evidence exists.
- [x] Add browser coverage for the audit dashboard and rerun focused 3D/admin tests.


## 2026-10-11 homepage product completion

- [x] Replace the oversized first viewport with a balanced responsive two-column AIET hero using the real campus visual, fallback image, immediate primary/secondary CTAs, 3D/AR links, and verified destination context.
- [x] Add a prominent configured-destination search directly below the hero with clear action, category filters, suggestions, selection-to-planner handoff, empty state, and responsive touch controls.
- [x] Add the “Your Campus, Connected” four-card feature grid for Explore Campus, Interactive 2D Map, Immersive 3D Campus, and AR Navigation.
- [x] Add the compact Campus Information Strip and the dedicated “See AIET in a New Dimension” preview while preserving the current gallery, planner, assistant, multilingual, AR, official-site, and footer flows.
- [x] Validate with 145 automated tests, TypeScript checking, production build, desktop/mobile visual review, and the existing AIET verified-data boundary.


## 2026-10-11 route-backed browser AR guidance

- [x] Consume the existing selected source/destination handoff and shared campus route graph on the Browser AR Guidance page.
- [x] Add camera loading, HTTPS/browser support checks, permission-denied messaging, live rear-camera preview, and stream cleanup on exit or return to map.
- [x] Add browser geolocation permission/error handling, live watch updates, route-progress advancement, deviation recovery, and explicit unavailable/signal-lost states.
- [x] Add device-orientation permission handling, bearing-relative arrow guidance, and clear unavailable/unreliable heading messaging without claiming calibrated world-space AR.
- [x] Add route-backed AR browser coverage and verify the existing map progress flow remains passing.
- [x] Run the full 150-test suite, TypeScript check, production build, and desktop/mobile AR visual review; physical device camera/GPS/compass validation remains required before claiming hardware readiness.


## 2026-10-11 authentic AIET campus gallery

- [x] Remove the old rotated group photograph, perspective distortion, orbit marker, automatic rotation, and decorative 360 treatment from the homepage showcase.
- [x] Replace it with six authentic supplied AIET campus/building photographs already present in the project archive.
- [x] Add responsive editorial gallery layout, natural proportions, lazy loading, per-image fallback, descriptive alt text, and subtle hover treatment.
- [x] Add accessible lightbox controls with previous/next, counter, close button, Escape/arrow-key navigation, and mobile swipe gestures.
- [x] Keep “Find this location” limited to existing verified Main Entrance, Main Library, and CSE route destinations.
- [x] Preserve the map, route planner, 3D viewer, AR Guidance, navigation, branding, and verified-data boundary; validate with 153 tests, TypeScript, production build, and desktop/mobile review.


## 2026-10-11 official Alva’s logo homepage balance

- [x] Reuse the exact existing official Alva’s Education Foundation logo asset from the project header.
- [x] Replace the excessive right-side whitespace in the connected-campus section with a balanced logo panel.
- [x] Preserve the eyebrow, headline, supporting copy, warm off-white/burgundy visual system, and original four feature-card order and functionality.
- [x] Verify responsive desktop and mobile stacking, natural logo proportions, no horizontal overflow, and accessible alt text.
- [x] Validate with 153 automated tests, TypeScript checking, production build, and desktop/mobile visual review.


## 2026-10-11 compact Real AIET Photographs archive

- [x] Compact the archive hero into a responsive 45/55 text-and-description layout with clamp typography.
- [x] Replace oversized archive cards with compact 4:3 three/four-column desktop, tablet, and mobile grids.
- [x] Add working All, Campus Buildings, Campus Life, Arrivals, and New Building filters.
- [x] Preserve individual supplied AIET images, accessible viewer controls, lazy loading, route handoffs, and graceful image-error states.
- [x] Validate with 154 automated tests, TypeScript, whitespace checks, production build, and desktop/mobile visual review.


## 2026-10-11 Alvas Robo verified retrieval

- [x] Audit and preserve the existing AI-backed assistant, route conversation flow, multilingual voice input, voice replies, and navigation handoffs.
- [x] Retrieve active destination records through the existing database repository with the existing verified PathFinder fallback only when the database is unavailable.
- [x] Return actual configured locations for list requests with categories, route/data boundaries, accessibility notes, and official-source context.
- [x] Handle unconfigured “New Block” honestly instead of mapping it to an unrelated configured building.
- [x] Add verified AIET institution, programme, and official-source context to the server-side LLM prompt with retrieved content treated as untrusted reference data.
- [x] Add regression coverage and pass the full automated suite, TypeScript validation, whitespace checks, and production build.
