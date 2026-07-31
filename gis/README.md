# Kathmandu Pilates Site Selection Map — v1.1 repair build

Static, GitHub-Pages-ready GIS website for the Sumita Pilates location study.

## What v1.1 fixes

- Repairs the broken/partial Leaflet map layout seen on GitHub Pages.
- Adds a local Leaflet layout fallback so tiles and markers remain positioned even if the CDN stylesheet is delayed or blocked.
- Uses the current OpenStreetMap standard tile endpoint: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
- Calls `invalidateSize()` on load, resize, map-container resize and mobile-sidebar transitions.
- Separates Kathmandu candidate areas from Lalitpur/Valley comparison benchmarks.
- Renames 500 m / 1 km / 2 km circles to **radial buffers** rather than calling them travel catchments.
- Makes Site A's 77.5 score explicitly an **area screening score**; property suitability remains pending a site survey.
- Reduces label clutter by making detailed labels zoom-dependent.
- Adds a visible tile-loading status/warning.
- Adds a dedicated **Fit Kathmandu** view while retaining **Fit all** for Valley benchmarks.

## Existing data included by the branch

- Exact benchmark pin: **27.722780, 85.321130**
- Kathmandu candidate areas with provisional screening scores
- Lalitpur comparison areas
- Known Pilates competitor layer
- Health / market anchor layer
- Google Maps links for mapped features
- CSV/KML exports already present in the repository

## Important terminology

The candidate scores are **strategic screening scores**, not property valuations, market-share estimates, or authoritative GIS suitability scores.

The 500 m / 1 km / 2 km circles are straight-line radial buffers. Proper travel catchments should later be calculated as road-network isochrones (for example 5-, 10- and 15-minute access zones).

## Next analytical upgrade

The next version should move from manual area scores to evidence-backed component scoring with explicit fields for:

- premium-market fit
- resident/daytime catchment
- wellness ecosystem
- office/hotel/international activity
- accessibility
- competition white-space
- parking/site environment
- evidence source and verification date
- coordinate precision/confidence

Property-level ranking should remain separate from area-level ranking and should add rent, floor area, parking, road width, lift/stairs, natural light, ceiling height, frontage and access.