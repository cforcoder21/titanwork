import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

function HospitalMarker({ hospital }) {
  const icon = L.divIcon({
    className: "",
    html: '<div class="hospital-marker" style="font-size: 16px;">🏥</div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  return (
    <Marker position={[hospital.lat, hospital.lng]} icon={icon}>
      <Popup>
        <div className="space-y-1">
          <p className="font-display text-sm font-semibold">{hospital.name}</p>
          <p className="text-xs">Beds available: {hospital.beds}</p>
          <p className="text-xs">ICU beds: {hospital.icuBeds}</p>
        </div>
      </Popup>
    </Marker>
  );
}

export default HospitalMarker;
