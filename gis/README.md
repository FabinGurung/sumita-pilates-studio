# Sumita Pilates Location Intelligence — GIS v1.2

Interactive, GitHub-Pages-ready GIS decision-support system for evaluating Pilates studio locations in Kathmandu Valley.

Current benchmark:

**Site A — Lazimpat / Panipokhari**  
Coordinates: **27.722780, 85.321130**

---

## What v1.2 changes

GIS v1.2 moves the project from a general map prototype toward a location-intelligence system.

The main experience is now centered on **Site A**, while Kathmandu-wide candidate ranking remains available as a secondary analytical view.

### New in v1.2

- Site-A-first startup view
- Four workspace panels:
  - Layers
  - Site A
  - Ranking
  - Method
- Separate Kathmandu candidates and Valley comparison benchmarks
- Runtime distance calculations from Site A
- Automatic nearest-Pilates ranking
- Automatic 500 m / 1 km / 2 km competitor counts
- Automatic mapped-anchor count within 500 m
- Independent radial-buffer controls
- Cleaner area-only permanent labels
- Competitor and anchor details shown through marker interaction
- Duplicate Lazimpat area centroid hidden at close Site A zoom
- Dataset status counts
- Explicit distinction between area screening and property suitability
- Evidence / coordinate-precision disclosure in map popups
- Mobile slide-in Location Intelligence panel
- Existing Leaflet rendering safeguards retained from v1.1

---

# Current project structure

```text
gis/
├── index.html
├── README.md
├── SOURCES.md
│
├── assets/
│   ├── app.js
│   └── styles.css
│
├── data/
│   ├── locations.js
│   └── locations.json
│
├── google-my-maps-import.csv
└── sumita-pilates-locations.kml