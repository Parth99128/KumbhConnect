import { Polyline, Tooltip } from "react-leaflet";
import { haversineDistance, formatDistance } from "@stay-connected/shared";

interface Props {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  memberName: string;
}

export default function DistanceLine({
  fromLat,
  fromLng,
  toLat,
  toLng,
  memberName,
}: Props) {
  const distance = haversineDistance(fromLat, fromLng, toLat, toLng);
  const formatted = formatDistance(distance);

  // Midpoint for label placement
  const midLat = (fromLat + toLat) / 2;
  const midLng = (fromLng + toLng) / 2;

  return (
    <Polyline
      positions={[
        [fromLat, fromLng],
        [toLat, toLng],
      ]}
      pathOptions={{
        color: "#FF6B00",
        weight: 2,
        dashArray: "6, 8",
        opacity: 0.7,
      }}
    >
      <Tooltip permanent direction="center" className="distance-tooltip">
        <span style={{ fontWeight: 600, fontSize: 12 }}>
          {memberName}: {formatted}
        </span>
      </Tooltip>
    </Polyline>
  );
}
