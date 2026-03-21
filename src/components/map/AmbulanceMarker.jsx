import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

function statusClass(status) {
  if (status === "available") return "amb-available";
  if (status === "dispatched") return "amb-dispatched";
  return "amb-enroute";
}

function AmbulanceMarker({ unit, position }) {
  const icon = L.divIcon({
    className: "",
    html: `<div class=\"amb-marker ${statusClass(unit.status)}\" style=\"font-size: 16px;\">🚑</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  return (
    <Marker position={position || [unit.lat, unit.lng]} icon={icon}>
      <Popup>
        <div className="space-y-1">
          <p className="font-display text-sm font-semibold">{unit.name}</p>
          <p className="text-xs capitalize">Status: {unit.status}</p>
          <p className="text-xs">Speed: 42 km/h</p>
        </div>
      </Popup>
    </Marker>
  );
}

export default AmbulanceMarker;
