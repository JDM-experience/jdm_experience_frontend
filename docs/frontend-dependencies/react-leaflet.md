# react-leaflet

**Package:** `react-leaflet` — v5.0.0
**Status:** in use

## What it is

React component bindings for Leaflet (`MapContainer`, `TileLayer`, `Marker`, `Polyline`, `Popup`).

## Why this project uses it

Renders the tour itinerary map declaratively as React components instead of imperatively managing a
Leaflet map instance by hand. v5 requires React 19 (`peerDependencies: react ^19.0.0`), which
matches this project's React version exactly.

## Where it shows up

- `src/components/common/TourItineraryMap.tsx` — the only consumer, rendered from `TourDetail`.
  Every tour shows the same fixed 6-stop route (`TOUR_ITINERARY` in `src/constants/index.ts`) as a
  `Polyline` connecting numbered `Marker`s — the map itself takes no per-tour props. `MapContainer`
  auto-fits to the route via its `bounds` prop rather than a fixed `center`/`zoom`.
