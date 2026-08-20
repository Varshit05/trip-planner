import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Route, Stop } from '../../types/trip';

interface RouteMapProps {
  route: Route;
  stops: Stop[];
}

// Custom helper to adjust map bounds dynamically
const FitBounds: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [coords, map]);

  return null;
};

// Create a custom SVG pin icon based on the stop type
const getMarkerIcon = (type: Stop['type']) => {
  let color = '#64748b'; // Slate (Default)
  let iconHtml = '';

  switch (type) {
    case 'CURRENT':
      color = '#475569'; // Slate
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      break;
    case 'PICKUP':
      color = '#0d9488'; // Teal
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      break;
    case 'DROPOFF':
      color = '#6366f1'; // Indigo
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      break;
    case 'FUEL':
    case 'FUEL_BREAK':
      color = '#ea580c'; // Orange
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8"><path d="M19.78 4.22a1 1 0 0 0-1.4 0L17 5.61V3a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0V6.62l1.08-1.08a1 1 0 0 0 0-1.42zM12 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-1 12H5v-2h6v2zm0-4H5V9h6v2z"/></svg>`;
      break;
    case 'BREAK':
      color = '#d97706'; // Amber
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8"><path d="M20 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-2 16H6v-2h12v2zm0-4H6V5h12v10z"/></svg>`;
      break;
    case 'REST':
      color = '#2563eb'; // Blue
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8"><path d="M2 20h20v2H2v-2zm2-8h16v6H4v-6zm3 4h4v-2H7v2zm8 0h3v-2h-3v2zM5 8.12V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3.12a3 3 0 0 1-2.58 2.96L16 11v1h-8v-1l-.42-.92A3 3 0 0 1 5 8.12z"/></svg>`;
      break;
  }

  return L.divIcon({
    html: `
      <div class="relative w-8 h-8 flex items-center justify-center filter drop-shadow-md hover:scale-110 transition-transform cursor-pointer">
        ${iconHtml}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export const RouteMap: React.FC<RouteMapProps> = ({ route, stops }) => {
  const center: [number, number] = route.geometry[0] || [39.8283, -98.5795]; // Default center of US

  // Filter out any stops without valid coordinates
  const validStops = stops.filter(stop => typeof stop.latitude === 'number' && typeof stop.longitude === 'number');

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-slate-100 shadow-inner z-10 custom-leaflet-map">
      <MapContainer
        center={center}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Geometry Line */}
        {route.geometry.length > 0 && (
          <Polyline
            positions={route.geometry}
            pathOptions={{ color: '#0f766e', weight: 4, opacity: 0.8 }}
          />
        )}

        {/* Stop Markers */}
        {validStops.map((stop, idx) => (
          <Marker
            key={`${stop.type}-${idx}`}
            position={[stop.latitude, stop.longitude]}
            icon={getMarkerIcon(stop.type)}
          >
            <Popup>
              <div className="p-1 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{
                      backgroundColor:
                        stop.type === 'PICKUP' ? '#0d9488' :
                        stop.type === 'DROPOFF' ? '#6366f1' :
                        stop.type === 'FUEL' || stop.type === 'FUEL_BREAK' ? '#ea580c' :
                        stop.type === 'REST' ? '#2563eb' :
                        stop.type === 'BREAK' ? '#d97706' : '#475569'
                    }}
                  />
                  {stop.type === 'CURRENT' ? 'Current Location' : stop.type}
                </div>
                {stop.display_name && (
                  <p className="text-xs text-slate-500 line-clamp-2">{stop.display_name}</p>
                )}
                <div className="text-[11px] text-slate-400 font-semibold space-y-0.5">
                  <p>Arrival: {new Date(stop.time).toLocaleString()}</p>
                  {stop.duration_hours > 0 && (
                    <p>Duration: {stop.duration_hours} hr{stop.duration_hours > 1 ? 's' : ''}</p>
                  )}
                  {stop.reason && <p className="text-slate-500 font-normal italic">Reason: {stop.reason}</p>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Dynamically adjust viewport bounding box */}
        <FitBounds coords={route.geometry} />
      </MapContainer>
    </div>
  );
};
