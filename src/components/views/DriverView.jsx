import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import EmergencyMap from "../map/EmergencyMap";
import { DELHI_CENTER } from "../../data/constants";

const routeInstructions = [
  { dir: "left", road: "MI Road", distance: "400 m" },
  { dir: "right", road: "Tonk Road", distance: "1.1 km" },
  { dir: "left", road: "SMS Hospital Link Road", distance: "600 m" }
];

async function fetchRoadRoute(start, end) {
  const query = `${start[1]},${start[0]};${end[1]},${end[0]}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${query}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Routing service unavailable");
  const data = await response.json();
  const coordinates = data?.routes?.[0]?.geometry?.coordinates;
  if (!coordinates?.length) throw new Error("No route geometry returned");
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

function interpolateRoute(route, progress) {
  if (!route.length) return [26.9124, 75.7873];
  if (route.length === 1) return route[0];
  const totalSegments = route.length - 1;
  const scaled = progress * totalSegments;
  const segment = Math.min(totalSegments - 1, Math.floor(scaled));
  const localT = scaled - segment;
  const [lat1, lng1] = route[segment];
  const [lat2, lng2] = route[segment + 1];
  return [lat1 + (lat2 - lat1) * localT, lng1 + (lng2 - lng1) * localT];
}

function formatTimer(seconds) {
  const safe = Math.max(0, seconds);
  const mins = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function pickupRatioFromRoute(route) {
  if (!route || route.length < 3) return 0.5;
  const legOne = Math.hypot(route[1][0] - route[0][0], route[1][1] - route[0][1]);
  const legTwo = Math.hypot(route[2][0] - route[1][0], route[2][1] - route[1][1]);
  const total = legOne + legTwo;
  return total === 0 ? 0.5 : legOne / total;
}

function DriverView({ ambulances, activeDispatch, theme, userPhoneNumber, sharedProgress }) {
  const [speed, setSpeed] = useState(52);
  const [eta, setEta] = useState(420);
  const [distance, setDistance] = useState(3.2);
  const [pickupNotificationDone, setPickupNotificationDone] = useState(false);
  const [arrivalNotificationDone, setArrivalNotificationDone] = useState(false);
  const [resolvedRoute, setResolvedRoute] = useState([]);
  
  const routeProgress = Math.max(0, Math.min(1, sharedProgress || 0));

  const driverUnit = ambulances.find((unit) => unit.name === "AMB-03") || ambulances[0];

  const route = useMemo(() => {
    if (activeDispatch?.route?.length) return activeDispatch.route;
    return [
      [26.9423, 75.7719],
      [26.9236, 75.7835],
      [26.9127, 75.8018],
      [26.9056, 75.8137]
    ];
  }, [activeDispatch]);

  useEffect(() => {
    if (!route?.length || route.length < 3) {
      setResolvedRoute(route || []);
      return undefined;
    }

    setResolvedRoute(route);
    let cancelled = false;

    (async () => {
      try {
        const firstLeg = await fetchRoadRoute(route[0], route[1]);
        const secondLeg = await fetchRoadRoute(route[1], route[2]);
        const mergedRoute = [...firstLeg, ...secondLeg.slice(1)];
        if (!cancelled && mergedRoute.length > 2) {
          setResolvedRoute(mergedRoute);
        }
      } catch {
        if (!cancelled) setResolvedRoute(route);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [route]);

  useEffect(() => {
    const speedTimer = setInterval(() => {
      setSpeed((prev) => Math.max(38, Math.min(72, prev + Math.floor(Math.random() * 11) - 5)));
    }, 2000);
    const etaTimer = setInterval(() => {
      setEta((prev) => Math.max(0, prev - 1));
      setDistance((prev) => Math.max(0, Number((prev - 0.01).toFixed(2))));
    }, 1000);
    return () => {
      clearInterval(speedTimer);
      clearInterval(etaTimer);
    };
  }, []);

  useEffect(() => {
    if (!activeDispatch?.incidentId) return undefined;
    const threshold = pickupRatioFromRoute(route);
    if (routeProgress >= threshold && !pickupNotificationDone) {
      setPickupNotificationDone(true);
    }
    if (routeProgress >= 1 && !arrivalNotificationDone) {
      setArrivalNotificationDone(true);
    }
  }, [routeProgress, activeDispatch?.incidentId, route, pickupNotificationDone, arrivalNotificationDone]);

  const missionPatient = activeDispatch?.patientDetails || "Cardiac Arrest - Male 54";
  const missionPickup = activeDispatch?.pickupAddress || "MI Road, Jaipur";
  const missionDestination = activeDispatch?.hospitalName || "SMS Hospital Jaipur";
  const effectiveRoute = resolvedRoute.length > 1 ? resolvedRoute : route;
  const driverPosition = interpolateRoute(effectiveRoute, routeProgress);

  return (
    <div style={{
      display: "flex",
      width: "100%",
      height: "calc(100vh - 108px)",
      gap: "0.75rem",
      padding: "0.75rem",
      overflow: "hidden",
      boxSizing: "border-box"
    }}>

      {/* LEFT PANEL */}
      <div style={{
        width: "520px",
        flexShrink: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        boxSizing: "border-box",
        borderRadius: "0.75rem",
        border: "1px solid #1E293B",
        padding: "0.875rem"
      }} className="bg-navy-800">

        <div>
          <p className="font-display text-xs tracking-widest text-red-500">DRIVER VIEW</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
            <h2 className="font-display text-lg font-bold text-slate-100">Unit AMB-03</h2>
            <span className="rounded-full border border-amber-500 bg-amber-500/20 px-2 py-0.5 font-display text-xs text-amber-400">
              EN ROUTE
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
          <div className="rounded-lg border border-navy-600 bg-navy-700 p-2">
            <p className="font-display text-xs tracking-wider text-slate-500">SPEED</p>
            <p className="font-display text-base font-bold text-slate-100">{speed} km/h</p>
          </div>
          <div className="rounded-lg border border-navy-600 bg-navy-700 p-2">
            <p className="font-display text-xs tracking-wider text-slate-500">ETA</p>
            <p className="font-display text-base font-bold text-amber-400">{formatTimer(eta)}</p>
          </div>
          <div className="rounded-lg border border-navy-600 bg-navy-700 p-2">
            <p className="font-display text-xs tracking-wider text-slate-500">DISTANCE</p>
            <p className="font-display text-base font-bold text-slate-100">{distance} km</p>
          </div>
          <div className="rounded-lg border border-navy-600 bg-navy-700 p-2">
            <p className="font-display text-xs tracking-wider text-slate-500">STATUS</p>
            <p className="font-display text-xs font-bold text-red-400">Code 3 Siren</p>
          </div>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-navy-700 p-3">
          <p className="font-display text-xs tracking-wider text-red-500">ACTIVE MISSION</p>
          <p className="mt-1 text-xs text-slate-100">Patient: {missionPatient}</p>
          <p className="text-xs text-slate-400">Pickup: {missionPickup}</p>
          <p className="text-xs text-slate-300">Dest: {missionDestination}</p>
          <p className="text-xs text-slate-400">
            Contact: <span className="text-slate-100">{userPhoneNumber || "Not provided"}</span>
          </p>
          <span className="mt-1 inline-block rounded-full border border-red-500 bg-red-500/20 px-2 py-0.5 font-display text-xs text-red-400">
            P1 - CRITICAL
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", marginTop: "auto" }}>
          <button type="button" className="h-10 flex-1 rounded-xl bg-green-500 font-display text-sm font-bold text-white hover:bg-green-600">
            ARRIVED
          </button>
          <button type="button" className="h-10 flex-1 rounded-xl border border-slate-600 font-display text-xs font-bold text-slate-300 hover:border-red-500 hover:text-red-400">
            CALL HOSPITAL
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        width: "500px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        overflow: "hidden"
      }}>

        {/* Map */}
        <div style={{ flex: "0 0 58%", minHeight: 0, overflow: "hidden" }}>
          <EmergencyMap
            mode="driver"
            ambulances={ambulances}
            hospitals={[{ id: "dest", name: "SMS Hospital Jaipur", lat: 26.9056, lng: 75.8137, beds: 18, icuBeds: 4 }]}
            incidents={[{ id: "pickup", lat: route[1][0], lng: route[1][1], type: { label: "Pickup" }, priority: "P1" }]}
            center={DELHI_CENTER}
            zoom={12}
            driverRoute={effectiveRoute}
            driverUnit={driverUnit}
            driverPosition={driverPosition}
            theme={theme}
          />
        </div>

        {/* Directions */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          borderRadius: "0.75rem",
          border: "1px solid #1E293B",
          padding: "0.875rem"
        }} className="bg-navy-800">
          <p className="mb-2 font-display text-xs tracking-widest text-slate-500">TURN-BY-TURN DIRECTIONS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {routeInstructions.map((item, idx) => (
              <div
                key={item.road}
                style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
                className={`rounded-lg px-3 py-2 ${idx === 0 ? "border border-amber-500/40 bg-amber-500/10" : "border border-navy-600 bg-navy-700"}`}
              >
                <div style={{ width: "28px", height: "28px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "999px" }} className="bg-navy-600">
                  {item.dir === "left"
                    ? <ArrowLeft size={14} className="text-amber-400" />
                    : <ArrowRight size={14} className="text-amber-400" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p className={`text-sm font-semibold ${idx === 0 ? "text-amber-300" : "text-slate-300"}`}>{item.road}</p>
                  {idx === 0 && <p className="font-display text-xs tracking-wider text-amber-500/70">NEXT TURN</p>}
                </div>
                <span className="font-display text-xs text-slate-400">{item.distance}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default DriverView;