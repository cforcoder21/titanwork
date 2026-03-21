import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import EmergencyMap from "../map/EmergencyMap";

const routeInstructions = [
  { dir: "left", road: "MI Road", distance: "400 m" },
  { dir: "right", road: "Tonk Road", distance: "1.1 km" },
  { dir: "left", road: "SMS Hospital Link Road", distance: "600 m" }
];

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

function DriverView({ ambulances, activeDispatch, theme }) {
  const [speed, setSpeed] = useState(52);
  const [eta, setEta] = useState(420);
  const [distance, setDistance] = useState(3.2);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const speedTimer = setInterval(() => {
      setSpeed((prev) => Math.max(38, Math.min(72, prev + Math.floor(Math.random() * 11) - 5)));
    }, 2000);

    const etaTimer = setInterval(() => {
      setEta((prev) => Math.max(0, prev - 1));
      setDistance((prev) => Math.max(0, Number((prev - 0.01).toFixed(2))));
    }, 1000);

    const moveTimer = setInterval(() => {
      setProgress((prev) => (prev + 0.006 > 1 ? 0 : prev + 0.006));
    }, 500);

    return () => {
      clearInterval(speedTimer);
      clearInterval(etaTimer);
      clearInterval(moveTimer);
    };
  }, []);

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

  const missionPatient = activeDispatch?.patientDetails || "Cardiac Arrest - Male 54";
  const missionPickup = activeDispatch?.pickupAddress || "MI Road, Jaipur";
  const missionDestination = activeDispatch?.hospitalName || "SMS Hospital Jaipur";

  const driverPosition = interpolateRoute(route, progress);

  return (
    <div className="grid h-[calc(100vh-6.5rem)] grid-cols-20 gap-4 p-4">
      <section className="col-span-7 flex min-h-0 flex-col rounded-xl border border-navy-700 bg-navy-800 p-5">
        <p className="font-display text-xs tracking-widest text-red-500">DRIVER VIEW</p>
        <div className="mt-1 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-slate-100">Unit AMB-03</h2>
          <span className="rounded-full border border-amber-500 bg-amber-500/20 px-3 py-0.5 font-display text-xs text-amber-400">
            EN ROUTE
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-navy-600 bg-navy-700 p-3">
            <p className="font-display text-xs tracking-wider text-slate-500">SPEED</p>
            <p className="font-display text-xl font-bold text-slate-100 transition-all duration-500">{speed} km/h</p>
          </div>
          <div className="rounded-lg border border-navy-600 bg-navy-700 p-3">
            <p className="font-display text-xs tracking-wider text-slate-500">ETA</p>
            <p className="font-display text-xl font-bold text-amber-400 transition-all duration-500">{formatTimer(eta)}</p>
          </div>
          <div className="rounded-lg border border-navy-600 bg-navy-700 p-3">
            <p className="font-display text-xs tracking-wider text-slate-500">DISTANCE</p>
            <p className="font-display text-xl font-bold text-slate-100 transition-all duration-500">{distance} km remaining</p>
          </div>
          <div className="rounded-lg border border-navy-600 bg-navy-700 p-3">
            <p className="font-display text-xs tracking-wider text-slate-500">STATUS</p>
            <p className="font-display text-xl font-bold text-red-400">Code 3 - Lights & Siren</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-red-500/30 bg-navy-700 p-4">
          <p className="font-display text-xs tracking-wider text-red-500">ACTIVE MISSION</p>
          <p className="mt-1 text-sm text-slate-100">Patient: {missionPatient}</p>
          <p className="text-sm text-slate-400">Pickup: {missionPickup}</p>
          <p className="text-sm text-slate-300">Destination: {missionDestination} - Trauma Bay 2</p>
          <span className="mt-2 inline-block rounded-full border border-red-500 bg-red-500/20 px-2 py-0.5 font-display text-xs text-red-400">
            P1 - CRITICAL
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-navy-700 bg-navy-900/60 p-3">
          {routeInstructions.map((item, idx) => (
            <div
              key={item.road}
              className={`mb-2 flex items-center gap-3 rounded px-2 py-1 ${idx === 0 ? "border-l-2 border-amber-500 bg-amber-500/5" : ""}`}
            >
              {item.dir === "left" ? <ArrowLeft size={16} className="text-amber-400" /> : <ArrowRight size={16} className="text-amber-400" />}
              <p className="text-sm text-slate-300">{item.road}</p>
              <span className="ml-auto text-xs text-slate-500">{item.distance}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex gap-3 pt-4">
          <button type="button" className="h-12 flex-1 rounded-xl bg-green-500 font-display font-bold text-white transition-colors hover:bg-green-600">
            ARRIVED
          </button>
          <button
            type="button"
            className="h-12 flex-1 rounded-xl border border-slate-600 font-display font-bold text-slate-300 transition-colors hover:border-red-500 hover:text-red-400"
          >
            CALL HOSPITAL
          </button>
        </div>
      </section>

      <section className="col-span-13 min-h-0">
        <EmergencyMap
          mode="driver"
          ambulances={ambulances}
          hospitals={[
            { id: "dest", name: "SMS Hospital Jaipur", lat: 26.9056, lng: 75.8137, beds: 18, icuBeds: 4 }
          ]}
          incidents={[{ id: "pickup", lat: route[1][0], lng: route[1][1], type: { label: "Pickup" }, priority: "P1" }]}
          center={driverPosition}
          zoom={13}
          driverRoute={route}
          driverUnit={driverUnit}
          driverPosition={driverPosition}
          theme={theme}
        />
      </section>
    </div>
  );
}

export default DriverView;
