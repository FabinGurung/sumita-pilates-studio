# Kathmandu Pilates Site Selection Map

Static, GitHub-Pages-ready GIS website for the Sumita didi Pilates location study.

## What is included

- Exact benchmark pin: **27.722780, 85.321130**
- Kathmandu candidate areas with site-selection scores
- Lalitpur benchmark areas for comparison
- Known Pilates competitor layer
- Health / market anchor layer
- 500 m, 1 km and 2 km catchment rings around Site A
- Permanent labels, search, layer toggles and score filtering
- One-click Google Maps links for every mapped feature
- `google-my-maps-import.csv` for importing the dataset into Google My Maps
- `sumita-pilates-locations.kml` for GIS/Google Earth/My Maps use

## Why the base map is OpenStreetMap

Google Maps JavaScript maps require a Google Maps Platform API key and billing-enabled project. This site therefore uses Leaflet + OpenStreetMap so it works immediately on GitHub Pages without a key. Every popup includes an **Open in Google Maps** button.

If you later add a Google Maps API key, the frontend can be converted to a native Google Maps basemap while keeping the same `data/locations.js` dataset.

## Run locally

Opening `index.html` directly will often work, but serving the folder is more reliable:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a new repository, e.g. `sumita-pilates-kathmandu-gis`.
2. Upload the contents of this folder **keeping the folders intact**.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your branch (usually `main`) and `/ (root)`.
6. Save. GitHub will provide the public website URL.

## Data caution

- **Site A** is the exact user-provided pin.
- Neighborhood points are representative centroids for screening, not legal boundaries.
- Some business markers are approximate to their listed street/neighborhood; the popup states precision.
- Scores are a strategic screening model, not measured market-share or property valuation data.
- Before leasing, validate candidate properties using rent, parking, actual travel times, frontage, natural light, floor plan, local competition and customer interviews.
