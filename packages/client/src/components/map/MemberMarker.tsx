import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { formatDistance, haversineDistance } from "@stay-connected/shared";
import { useLocationStore } from "../../stores/locationStore.ts";
import type { LocationSource } from "@stay-connected/shared";

interface Props {
  name: string;
  latitude: number;
  longitude: number;
  batteryLevel?: number;
  source?: LocationSource;
  timestamp?: number;
  isMe: boolean;
}

function createIcon(isMe: boolean, name: string): L.DivIcon {
  const color = isMe ? "#FF6B00" : "#3B82F6";
  const initial = name.charAt(0).toUpperCase();

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 14px;
        font-family: -apple-system, sans-serif;
      ">${initial}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export default function MemberMarker({
  name,
  latitude,
  longitude,
  batteryLevel,
  source,
  timestamp,
  isMe,
}: Props) {
  const myLocation = useLocationStore((s) => s.myLocation);

  let distanceText = "";
  if (!isMe && myLocation) {
    const dist = haversineDistance(
      myLocation.latitude,
      myLocation.longitude,
      latitude,
      longitude
    );
    distanceText = formatDistance(dist);
  }

  const lastSeenText = timestamp
    ? `${Math.round((Date.now() - timestamp) / 60000)} min ago`
    : "";

  return (
    <Marker position={[latitude, longitude]} icon={createIcon(isMe, name)}>
      <Popup>
        <div style={{ minWidth: 120, fontFamily: "-apple-system, sans-serif" }}>
          <strong style={{ fontSize: 14 }}>{isMe ? "You" : name}</strong>
          {distanceText && (
            <div style={{ color: "#FF6B00", fontWeight: 600, fontSize: 16, margin: "4px 0" }}>
              {distanceText}
            </div>
          )}
          {batteryLevel != null && batteryLevel >= 0 && (
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              Battery: {Math.round(batteryLevel * 100)}%
            </div>
          )}
          {source && (
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              Via: {source}
            </div>
          )}
          {lastSeenText && !isMe && (
            <div style={{ fontSize: 12, color: "#6B7280" }}>{lastSeenText}</div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
