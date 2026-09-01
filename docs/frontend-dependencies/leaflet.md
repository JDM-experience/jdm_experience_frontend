# Leaflet

**Package:** `leaflet` — v1.9.4, `@types/leaflet` (dev)
**Status:** in use

## What it is

An open-source JS mapping library. Renders tiles, markers, and popups without a hosted
map-provider account.

## Why this project uses it

The tour itinerary map needed no API key and no billing setup — Leaflet paired with CARTO's free
raster tiles (see `react-leaflet.md`) satisfies that with no external account required, unlike
Google Maps or Mapbox. CARTO's basemap was chosen over OpenStreetMap's default tile server
specifically because it renders place names in English/Latin script rather than the local
(Japanese) script OSM's default tiles use in Japan.

## Where it shows up

- `src/components/common/TourItineraryMap.tsx` — imports `leaflet/dist/leaflet.css` and applies the
  standard bundler workaround for Leaflet's default marker icon URLs (they're resolved relative to
  the CSS file by default, which breaks under Vite).
