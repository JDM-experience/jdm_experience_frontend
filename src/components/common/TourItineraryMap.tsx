import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import { Typography } from 'antd';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { TOUR_ITINERARY } from '@/constants';

// Leaflet's default marker icon URLs are resolved relative to its CSS file, which
// breaks under bundlers. Point them at the bundler-resolved asset URLs instead.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ROUTE_POSITIONS: [number, number][] = TOUR_ITINERARY.map((stop) => [stop.latitude, stop.longitude]);

/** Every tour follows the same fixed itinerary, so this map is identical across tour pages. */
export function TourItineraryMap() {
  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5}>Tour Itinerary</Typography.Title>
      <div style={{ borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer
          bounds={ROUTE_POSITIONS}
          boundsOptions={{ padding: [24, 24] }}
          scrollWheelZoom={false}
          style={{ height: 320, width: '100%' }}
        >
          {/* CARTO's Voyager basemap renders place names in English/Latin script rather than
              the local script that OpenStreetMap's default tiles use in Japan, while still
              showing street and building detail (unlike the flatter Positron/light_all style). */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Polyline positions={ROUTE_POSITIONS} pathOptions={{ color: '#000000', weight: 3 }} />
          {TOUR_ITINERARY.map((stop, index) => (
            <Marker key={stop.label} position={[stop.latitude, stop.longitude]}>
              <Popup>
                {index + 1}. {stop.label}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
