import { useEffect, useRef } from "react";
import { MapContainer as LeafletMap, TileLayer, Circle, Popup, useMap } from "react-leaflet";
import { useLocationStore } from "../../stores/locationStore.ts";
import { KUMBH_MELA_BOUNDS } from "@stay-connected/shared";
import MemberMarker from "./MemberMarker.tsx";
import DistanceLine from "./DistanceLine.tsx";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icons
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapController() {
  const map = useMap();
  const myLocation = useLocationStore((s) => s.myLocation);
  const centered = useRef(false);

  useEffect(() => {
    if (myLocation && !centered.current) {
      map.setView([myLocation.latitude, myLocation.longitude], 16);
      centered.current = true;
    }
  }, [myLocation, map]);

  return null;
}

export default function MapContainer({ droneZones = [] }: { droneZones?: any[] }) {
  const myLocation = useLocationStore((s) => s.myLocation);
  const memberLocations = useLocationStore((s) => s.memberLocations);
  
  const members = Array.from(memberLocations.values());

  // Helper to determine the circle color based on crowd density from AI
  const getZoneColor = (density: number) => {
    if (density >= 0.8) return { color: '#dc2626', fillColor: '#ef4444' }; // Critical Red
    if (density >= 0.5) return { color: '#ea580c', fillColor: '#f97316' }; // Warning Orange
    return { color: '#eab308', fillColor: '#facc15' }; // Caution Yellow
  };

  return (
    <LeafletMap
      center={[25.4358, 81.8463]} // Default roughly to Prayagraj (Kumbh Mela)
      zoom={14}
      style={{ height: "100%", width: "100%", zIndex: 1 }}
      maxBounds={[[KUMBH_MELA_BOUNDS.south, KUMBH_MELA_BOUNDS.west], [KUMBH_MELA_BOUNDS.north, KUMBH_MELA_BOUNDS.east]]}
    >
      {/* We use OpenStreetMap tiles equivalent to what the mobile app fallback uses! */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render AI Drone Identified Zones */}
      {droneZones.map((zone) => {
        const style = getZoneColor(zone.crowd_density);
        return (
          <Circle
            key={zone.sector_id}
            center={[zone.center_lat, zone.center_lon]}
            radius={zone.radius_m}
            pathOptions={{
              color: style.color,
              fillColor: style.fillColor,
              fillOpacity: 0.4,
              weight: 2
            }}
          >
            <Popup>
              <div style={{ padding: '4px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Sector {zone.sector_id.split('-')[1]}</h4>
                <p style={{ margin: 0, fontSize: '12px' }}>
                  <strong>Density:</strong> {(zone.crowd_density * 100).toFixed(0)}%
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  AI Assessed
                </p>
              </div>
            </Popup>
          </Circle>
        );
      })}

      {/* Controller to handle panning */}
      <MapController />

      {/* Render Group Members */}
      {members.map((member) => (
        <MemberMarker 
          key={member.userId} 
          name={`User ${member.userId.slice(-4)}`} 
          latitude={member.latitude} 
          longitude={member.longitude} 
          batteryLevel={100} 
          isMe={false} 
        />
      ))}

      {/* Render Self */}
      {myLocation && (
        <MemberMarker 
          name="Me" 
          latitude={myLocation.latitude} 
          longitude={myLocation.longitude} 
          isMe={true} 
        />
      )}

      {/* Lines to Group Members for Geofencing */}
      {myLocation && members.map((member) => (
        <DistanceLine
          key={`line-${member.userId}`}
          fromLat={myLocation.latitude}
          fromLng={myLocation.longitude}
          toLat={member.latitude}
          toLng={member.longitude}
          memberName={`User ${member.userId.slice(-4)}`}
        />
      ))}
    </LeafletMap>
  );
}
