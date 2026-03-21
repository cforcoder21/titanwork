import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

function IncidentMarker({ incident }) {
  const icon = L.divIcon({
    className: "",
    html: '<div class="incident-marker"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  return (
    <Marker position={[incident.lat, incident.lng]} icon={icon}>
      <Popup>
        <div className="space-y-1">
          <p className="font-display text-sm font-semibold">Incident #{incident.id}</p>
          <p className="text-xs">Type: {incident.type.label}</p>
          <p className="text-xs">Priority: {incident.priority}</p>
        </div>
      </Popup>
    </Marker>
  );
}

export default IncidentMarker;
