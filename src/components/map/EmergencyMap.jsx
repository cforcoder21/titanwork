import { Circle, CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import AmbulanceMarker from "./AmbulanceMarker";
import HospitalMarker from "./HospitalMarker";
import IncidentMarker from "./IncidentMarker";
import StatChip from "../ui/StatChip";

function EmergencyMap({
  mode,
  ambulances,
  hospitals,
  incidents,
  center,
  zoom,
  dispatchRoute,
  consumedDispatchRoute,
  routeSet,
  driverRoute,
  driverUnit,
  driverPosition,
  trackedUnit,
  userLocation,
  theme,
  showCoverage
}) {
  const tileUrl =
    theme === "light"
      ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-navy-700 bg-navy-800">
      <div className="flex items-center justify-between border-b border-navy-700 bg-navy-900 px-4 py-2">
        <p className="font-display text-xs tracking-widest text-slate-400">
          {mode === "hospital" ? "COVERAGE ZONE - 5KM RADIUS" : "CITYWIDE EMERGENCY GRID"}
        </p>

        {mode === "patient" ? (
          <div className="flex items-center gap-3">
            <StatChip label="RESPONSE TARGET" value="< 8 MIN" tone="red" />
            <StatChip label="AVAILABLE" value={`${ambulances.filter((u) => u.status === "available").length} UNITS`} tone="green" />
          </div>
        ) : null}
      </div>

      <div className="h-[calc(100%-53px)] w-full">
        <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom>
          <TileLayer url={tileUrl} />

          {mode === "driver" && driverUnit && driverPosition ? (
            <AmbulanceMarker unit={driverUnit} position={driverPosition} />
          ) : (
            ambulances.map((unit) => {
              const isTracked = trackedUnit && trackedUnit.id === unit.name;
              const unitForMarker = isTracked ? { ...unit, status: trackedUnit.status } : unit;
              return (
                <AmbulanceMarker
                  key={unit.id}
                  unit={unitForMarker}
                  position={isTracked ? trackedUnit.position : undefined}
                />
              );
            })
          )}

          {hospitals.map((hospital) => (
            <HospitalMarker key={hospital.id} hospital={hospital} />
          ))}

          {incidents.map((incident) => (
            <IncidentMarker key={incident.id} incident={incident} />
          ))}

          {mode === "patient" && userLocation ? (
            <>
              <CircleMarker
                center={[userLocation.lat, userLocation.lng]}
                radius={8}
                pathOptions={{ color: "#1D4ED8", fillColor: "#3B82F6", fillOpacity: 0.95, weight: 2 }}
              >
                <Popup>
                  <p className="font-display text-xs font-semibold">Your Current Location</p>
                </Popup>
              </CircleMarker>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={140}
                pathOptions={{ color: "#60A5FA", fillColor: "#60A5FA", fillOpacity: 0.12 }}
              />
            </>
          ) : null}

          {consumedDispatchRoute?.length > 1 ? (
            <Polyline positions={consumedDispatchRoute} color="#93C5FD" weight={6} opacity={0.85} />
          ) : null}

          {dispatchRoute?.length > 1 ? (
            <Polyline positions={dispatchRoute} color="#1A73E8" weight={5} />
          ) : null}

          {routeSet?.length
            ? routeSet.map((route, idx) => (
                <Polyline key={`route-${idx}`} positions={route} color="#1A73E8" weight={5} />
              ))
            : null}

          {driverRoute?.length ? <Polyline positions={driverRoute} color="#1A73E8" weight={5} /> : null}

          {showCoverage && hospitals[0] ? (
            <>
              <Circle center={[hospitals[0].lat, hospitals[0].lng]} radius={2000} pathOptions={{ color: "#EF4444", fillColor: "#EF4444", fillOpacity: 0.1 }} />
              <Circle center={[hospitals[0].lat, hospitals[0].lng]} radius={5000} pathOptions={{ color: "#F97316", fillColor: "#F97316", fillOpacity: 0.05 }} />
            </>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}

export default EmergencyMap;
