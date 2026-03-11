import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create a custom pulsing icon for critical shipments
const createMarkerIcon = (color, isPulse) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="map-marker ${isPulse ? 'pulse-marker' : ''}" style="background-color: ${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10]
  });
};

const INITIAL_VIEW_STATE = {
  center: [20.5937, 78.9629], // India
  zoom: 4
};

export default function MapView({ shipments = [], onMarkerClick }) {
  const [activePopup, setActivePopup] = useState(null);

  const markers = useMemo(() => shipments.map((shipment, index) => {
    let color = 'var(--risk-safe)';
    if (shipment.risk_score >= 75) color = 'var(--risk-critical)';
    else if (shipment.risk_score >= 45) color = 'var(--risk-warning)';
      
    const isPulse = shipment.risk_score >= 75;
    const icon = createMarkerIcon(color, isPulse);

    return (
      <Marker
        key={`marker-${index}`}
        position={[shipment.latitude, shipment.longitude]}
        icon={icon}
        eventHandlers={{
          click: (e) => {
            setActivePopup(shipment);
            if(onMarkerClick) onMarkerClick(shipment);
          }
        }}
      >
        <Popup className="dark-popup" closeButton={false}>
          <div className="popup-content text-primary">
            <div className="font-bold">{shipment.id}</div>
            <div className="text-xs text-secondary mt-1">{shipment.route}</div>
            <div className="text-xs mt-1">Tier: <span className="text-primary">{shipment.tier}</span></div>
            <div className="text-xs mt-1 flex items-center gap-2">
                Risk: <div className="risk-bar flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden w-16 inline-block ml-1"><div style={{width: `${shipment.risk_score}%`, backgroundColor: color}} className="h-full"></div></div> {shipment.risk_score}%
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }), [shipments, onMarkerClick]);

  return (
    <MapContainer 
      center={INITIAL_VIEW_STATE.center} 
      zoom={INITIAL_VIEW_STATE.zoom} 
      style={{ width: '100%', height: '100%', background: '#0A0E1A' }}
      zoomControl={false}
    >
      {/* Dark theme tiles from CartoDB */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {markers}
    </MapContainer>
  );
}
