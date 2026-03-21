import { useEffect, useState, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";
import CapacityBar from "../ui/CapacityBar";
import EmergencyMap from "../map/EmergencyMap";
import TriageCard from "../ui/TriageCard";
import HospitalListModal from "../ui/HospitalListModal";
import { DELHI_CENTER, TRIAGE_QUEUE } from "../../data/constants";
import { ambulances as ambulanceSeed } from "../../data/simulate";

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
  if (!route?.length) return null;
  if (route.length === 1) return route[0];
  const clamped = Math.max(0, Math.min(1, progress));
  const segments = [];
  let totalLength = 0;
  for (let index = 0; index < route.length - 1; index += 1) {
    const [latA, lngA] = route[index];
    const [latB, lngB] = route[index + 1];
    const length = Math.hypot(latB - latA, lngB - lngA);
    segments.push({ start: route[index], end: route[index + 1], length });
    totalLength += length;
  }
  if (totalLength === 0) return route[0];
  const targetDistance = clamped * totalLength;
  let covered = 0;
  for (const segment of segments) {
    const nextCovered = covered + segment.length;
    if (targetDistance <= nextCovered) {
      const localProgress = segment.length === 0 ? 0 : (targetDistance - covered) / segment.length;
      const [latA, lngA] = segment.start;
      const [latB, lngB] = segment.end;
      return [latA + (latB - latA) * localProgress, lngA + (lngB - lngA) * localProgress];
    }
    covered = nextCovered;
  }
  return route[route.length - 1];
}

function formatEta(seconds) {
  const mins = String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0");
  const secs = String(Math.max(0, seconds) % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function formatTimestamp(ms) {
  if (!ms) return "--:--:--";
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function startAmbulanceSiren(context, durationMs = 5000) {
  if (!context) return () => {};

  const durationSeconds = durationMs / 1000;
  const now = context.currentTime;
  const carrier = context.createOscillator();
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  const outputGain = context.createGain();

  carrier.type = "sawtooth";
  carrier.frequency.setValueAtTime(760, now);
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.95, now);
  lfoGain.gain.setValueAtTime(300, now);

  outputGain.gain.setValueAtTime(0.0001, now);
  outputGain.gain.exponentialRampToValueAtTime(0.09, now + 0.08);
  outputGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

  lfo.connect(lfoGain);
  lfoGain.connect(carrier.frequency);
  carrier.connect(outputGain);
  outputGain.connect(context.destination);

  carrier.start(now);
  lfo.start(now);
  carrier.stop(now + durationSeconds + 0.05);
  lfo.stop(now + durationSeconds + 0.05);

  return () => {
    try {
      carrier.stop();
      lfo.stop();
    } catch {}
    carrier.disconnect();
    lfo.disconnect();
    lfoGain.disconnect();
    outputGain.disconnect();
  };
}

function formatTimeHms(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function pickupRatioFromRoute(route) {
  if (!route || route.length < 3) return 0.5;
  const legOne = Math.hypot(route[1][0] - route[0][0], route[1][1] - route[0][1]);
  const legTwo = Math.hypot(route[2][0] - route[1][0], route[2][1] - route[1][1]);
  const total = legOne + legTwo;
  return total === 0 ? 0.5 : legOne / total;
}

const priorityStyles = {
  P1: "border-red-500 bg-red-500/10",
  P2: "border-amber-500 bg-amber-500/10",
  P3: "border-slate-500 bg-slate-500/10",
};

const priorityBadgeStyles = {
  P1: "bg-red-500/20 text-red-400 border-red-500/40",
  P2: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  P3: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

const statusColors = {
  CRITICAL: "text-red-400",
  URGENT: "text-amber-400",
  STABLE: "text-green-400",
};

function IncomingUnitCard({ patient, unit, bay, activeDispatch, patientPhone, ambulanceData }) {
  const [showCrew, setShowCrew] = useState(false);
  const style = priorityStyles[patient.priority] || priorityStyles.P3;
  const badge = priorityBadgeStyles[patient.priority] || priorityBadgeStyles.P3;
  const statusColor = statusColors[patient.status] || "text-slate-400";

  const isLiveDispatch = activeDispatch && activeDispatch.ambulanceId === unit;
  const crewData = isLiveDispatch ? {
    driver: activeDispatch.driverName,
    conductor: activeDispatch.conductorName,
    medicalSupport: activeDispatch.medicalSupportName,
    conductorContact: activeDispatch.supportContacts?.conductor,
    medicalSupportContact: activeDispatch.supportContacts?.medicalSupport,
  } : ambulanceData ? {
    driver: ambulanceData.driver,
    conductor: ambulanceData.conductor,
    medicalSupport: ambulanceData.medicalSupport,
    conductorContact: ambulanceData.conductorContact,
    medicalSupportContact: ambulanceData.medicalSupportContact,
  } : null;

  const dispatchTime = isLiveDispatch ? formatTimestamp(activeDispatch.dispatchedAt) : "--:--:--";
  const distanceKm = isLiveDispatch ? activeDispatch.distanceKm : null;
  const routeBand = isLiveDispatch ? activeDispatch.hospitalDistanceBand : null;
  const hospitalName = isLiveDispatch ? activeDispatch.hospitalName : null;

  return (
    <div className={`mb-3 rounded-lg border-l-4 bg-navy-700 p-3 ${style}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-display text-sm font-semibold text-slate-100">
          {patient.priority} — {patient.condition}
        </p>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 font-display text-[10px] tracking-wider ${badge}`}>
          {patient.priority}
        </span>
      </div>

      <div className="mb-2 space-y-0.5">
        <p className="text-xs text-slate-300">
          👤 Patient Age: <span className="font-semibold text-white">{patient.age}</span>
        </p>
        <p className="text-xs text-slate-300">
          📞 Patient Contact:{" "}
          <span className="font-semibold text-white">{patientPhone || "Not provided"}</span>
        </p>
        <p className="text-xs text-slate-300">
          🕐 Dispatch Time: <span className="font-semibold text-white">{dispatchTime}</span>
        </p>
        <p className="text-xs text-slate-300">
          ⏱ ETA: <span className={`font-semibold ${statusColor}`}>{patient.eta}</span>
        </p>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-navy-600 px-1.5 py-0.5 font-display text-[10px] text-slate-200">🚑 {unit}</span>
        <span className="rounded bg-navy-600 px-1.5 py-0.5 font-display text-[10px] text-slate-200">📍 {bay}</span>
        {distanceKm && (
          <span className="rounded bg-navy-600 px-1.5 py-0.5 font-display text-[10px] text-slate-200">{distanceKm} km</span>
        )}
        {routeBand && (
          <span className="rounded bg-navy-600 px-1.5 py-0.5 font-display text-[10px] text-slate-200">{routeBand}</span>
        )}
      </div>

      {hospitalName && (
        <p className="mb-2 text-xs text-slate-300">
          🏥 <span className="font-semibold text-white">{hospitalName}</span>
        </p>
      )}

      {crewData && (
        <div className="mb-2 rounded-lg border border-navy-600 bg-navy-600 p-2">
          <p className="mb-1.5 font-display text-[10px] tracking-widest text-slate-300">ONBOARD CREW</p>
          <div className="space-y-1">
            <p className="text-xs text-slate-300">Driver: <span className="font-semibold text-white">{crewData.driver}</span></p>
            <p className="text-xs text-slate-300">Conductor: <span className="font-semibold text-white">{crewData.conductor}</span></p>
            <p className="text-xs text-slate-300">Medical: <span className="font-semibold text-white">{crewData.medicalSupport}</span></p>
          </div>
          <button
            type="button"
            onClick={() => setShowCrew((v) => !v)}
            className="mt-2 w-full rounded border border-navy-500 py-1 text-center font-display text-[10px] tracking-wider text-slate-300 hover:border-blue-400 hover:text-blue-400 transition-colors"
          >
            {showCrew ? "HIDE CONTACTS" : "SHOW CONTACTS"}
          </button>
          {showCrew && (
            <div className="mt-2 rounded bg-navy-800 p-2 space-y-1">
              <p className="text-[10px] text-slate-300">Conductor: <span className="font-semibold text-white">{crewData.conductorContact}</span></p>
              <p className="text-[10px] text-slate-300">Medical Support: <span className="font-semibold text-white">{crewData.medicalSupportContact}</span></p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="rounded border border-navy-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-green-500 hover:text-green-400"
        >
          ASSIGN BAY
        </button>
        <span className={`font-display text-[10px] font-bold tracking-wider ${statusColor}`}>
          {patient.status}
        </span>
      </div>
    </div>
  );
}

function HospitalView({ ambulances, hospitals, incidents, theme, activeDispatch, sharedProgress }) {
  const primaryHospital = hospitals[0];
  const [resolvedActiveRoute, setResolvedActiveRoute] = useState([]);
  const [showHospitalList, setShowHospitalList] = useState(false);

  const [pickupNotificationDone, setPickupNotificationDone] = useState(false);
  const [arrivalNotificationDone, setArrivalNotificationDone] = useState(false);
  const [showPickupPopup, setShowPickupPopup] = useState(false);
  const [showArrivalPopup, setShowArrivalPopup] = useState(false);
  const [pickupNotifiedAt, setPickupNotifiedAt] = useState("");
  const [arrivalNotifiedAt, setArrivalNotifiedAt] = useState("");
  const audioContextRef = useRef(null);
  const pickupSoundStopRef = useRef(null);

  const routeProgress = Math.max(0, Math.min(1, sharedProgress || 0));
  const mountProgressRef = useRef(routeProgress);

  useEffect(() => {
    mountProgressRef.current = routeProgress;
  }, [activeDispatch?.incidentId]);

  const ensureAudioContext = () => {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContextRef.current = new AudioContextCtor();
    return audioContextRef.current;
  };

  const unlockAudioContext = () => {
    const context = ensureAudioContext();
    if (!context) return;
    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }
  };

  useEffect(() => {
    const onFirstInteraction = () => unlockAudioContext();
    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstInteraction);
  }, []);

  useEffect(() => {
    return () => {
      if (pickupSoundStopRef.current) pickupSoundStopRef.current();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setPickupNotificationDone(false);
    setArrivalNotificationDone(false);
    setShowPickupPopup(false);
    setShowArrivalPopup(false);
  }, [activeDispatch?.incidentId]);

  useEffect(() => {
    if (!activeDispatch?.incidentId) return undefined;
    const activeRouteMap = resolvedActiveRoute.length > 1 ? resolvedActiveRoute : activeDispatch?.route;
    const threshold = pickupRatioFromRoute(activeRouteMap);
    
    if (routeProgress >= threshold && !pickupNotificationDone) {
      setPickupNotificationDone(true);
      if (mountProgressRef.current < threshold) {
        setPickupNotifiedAt(formatTimeHms());
        setShowPickupPopup(true);
        unlockAudioContext();
        pickupSoundStopRef.current = startAmbulanceSiren(ensureAudioContext(), 5000);
        setTimeout(() => setShowPickupPopup(false), 12000);
      }
    }
    if (routeProgress >= 1 && !arrivalNotificationDone) {
      setArrivalNotificationDone(true);
      if (mountProgressRef.current < 1) {
        setArrivalNotifiedAt(formatTimeHms());
        setShowArrivalPopup(true);
        setTimeout(() => setShowArrivalPopup(false), 10000);
      }
    }
  }, [routeProgress, sharedProgress, activeDispatch?.incidentId, resolvedActiveRoute, activeDispatch?.route, pickupNotificationDone, arrivalNotificationDone]);

  useEffect(() => {
    const activeRoute = activeDispatch?.route;
    if (!activeRoute?.length || activeRoute.length < 3) {
      setResolvedActiveRoute(activeRoute || []);
      return undefined;
    }

    setResolvedActiveRoute(activeRoute);
    let cancelled = false;

    (async () => {
      try {
        const firstLeg = await fetchRoadRoute(activeRoute[0], activeRoute[1]);
        const secondLeg = await fetchRoadRoute(activeRoute[1], activeRoute[2]);
        const mergedRoute = [...firstLeg, ...secondLeg.slice(1)];
        if (!cancelled && mergedRoute.length > 2) {
          setResolvedActiveRoute(mergedRoute);
        }
      } catch {
        if (!cancelled) setResolvedActiveRoute(activeRoute);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeDispatch?.route]);

  // Calculate active dispatch ambulance position based on shared progress
  const activeRoute = resolvedActiveRoute.length > 1 ? resolvedActiveRoute : activeDispatch?.route;

  const trackedAmbulance = activeDispatch
    ? (() => {
        const unit = ambulances.find((u) => u.name === activeDispatch.ambulanceId);
        const route = activeRoute || [
          [unit?.lat || 26.9284, unit?.lng || 75.8031],
          [activeDispatch.lat || 26.9124, activeDispatch.lng || 75.7873],
          [primaryHospital?.lat || 26.9056, primaryHospital?.lng || 75.8137]
        ];
        const position = interpolateRoute(route, sharedProgress || 0);
        return position
          ? {
              id: activeDispatch.ambulanceId,
              name: activeDispatch.ambulanceId,
              status: "dispatched",
              position,
              lat: position[0],
              lng: position[1]
            }
          : null;
      })()
    : null;

  const incomingPatients = TRIAGE_QUEUE.map((patient, idx) => {
    const incident = incidents[idx];
    const unitName = incident?.assignedUnit || activeDispatch?.ambulanceId || `AMB-0${idx + 1}`;
    const bay = `Bay ${idx + 1}`;
    const ambulanceData = ambulanceSeed.find((a) => a.name === unitName);
    const contact = incident?.patientContact || null;
    return { patient, unit: unitName, bay, ambulanceData, contact };
  });

  const routeSet = activeRoute
    ? [activeRoute]
    : incidents.slice(0, 3).flatMap((incident) => {
        const unit = ambulances.find((item) => item.name === incident.assignedUnit);
        if (!unit || !primaryHospital) return [];
        return [[[unit.lat, unit.lng], [incident.lat, incident.lng], [primaryHospital.lat, primaryHospital.lng]]];
      });

  return (
    <>
      <div
        className="flex gap-4 p-4 overflow-hidden"
        style={{ height: "calc(100vh - 6.5rem)", maxHeight: "calc(100vh - 6.5rem)" }}
      >
      {/* LEFT: Hospital Command — wide */}
      <section className="flex w-[360px] shrink-0 min-h-0 flex-col rounded-xl border border-navy-700 bg-navy-800 p-5 overflow-y-auto">
        <p className="font-display text-xs tracking-widest text-red-500">HOSPITAL COMMAND</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-slate-100">{primaryHospital.name}</h2>
        <p className="text-sm text-slate-500">Trauma Center - Level 1</p>

        <div className="mt-4 space-y-3">
          <CapacityBar label="Total Beds" used={primaryHospital.beds} total={24} />
          <CapacityBar label="ICU Beds" used={primaryHospital.icuBeds} total={6} />
          <CapacityBar label="ER Bays" used={primaryHospital.erBays} total={5} />
          <CapacityBar label="Operating Rooms" used={1} total={3} />
        </div>

        <button
          type="button"
          onClick={() => setShowHospitalList(true)}
          className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 font-display text-sm font-semibold tracking-wider text-white transition-all hover:bg-blue-700"
        >
          HOSPITAL LIST
        </button>

        <div className="mt-5">
          <p className="mb-2 font-display text-xs tracking-widest text-slate-500">
            INCOMING UNITS
            <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-red-400">
              {incomingPatients.length}
            </span>
          </p>
          <div>
            {incomingPatients.map(({ patient, unit, bay, ambulanceData, contact }) => (
              <IncomingUnitCard
                key={patient.id}
                patient={patient}
                unit={unit}
                bay={bay}
                activeDispatch={activeDispatch}
                patientPhone={contact}
                ambulanceData={ambulanceData}
              />
            ))}
          </div>
        </div>
      </section>

      {/* MIDDLE: Map — takes remaining space */}
      <section
        className="flex-1 min-w-0 min-h-0 overflow-hidden relative"
        style={{ height: "100%", maxHeight: "100%" }}
      >
        <EmergencyMap
          mode="hospital"
          ambulances={ambulances}
          hospitals={hospitals}
          incidents={incidents}
          center={DELHI_CENTER}
          zoom={12}
          routeSet={routeSet}
          trackedUnit={trackedAmbulance}
          theme={theme}
        />

          {showPickupPopup && activeDispatch ? (
            <div className="pointer-events-auto absolute right-4 top-4 z-30 w-[360px] animate-slide-up rounded-2xl border border-green-500/70 bg-navy-950/95 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <button
                type="button"
                className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                onClick={() => {
                  setShowPickupPopup(false);
                  if (pickupSoundStopRef.current) pickupSoundStopRef.current();
                }}
              >
                <X size={14} />
              </button>
              <div className="mb-2 pr-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <CheckCircle2 size={16} />
                </span>
                <p className="font-display text-[11px] font-semibold tracking-[0.2em] text-green-400">PATIENT PICKUP CONFIRMED</p>
              </div>
              <p className="font-display text-sm font-semibold leading-relaxed text-slate-100">
                {activeDispatch.ambulanceId} reached the patient and is now heading to {activeDispatch.hospitalName}.
              </p>
              <p className="mt-2 text-xs tracking-wider text-slate-400">TIME: {pickupNotifiedAt}</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
                <div
                  className="h-full w-full origin-left bg-green-500/80"
                  style={{ animation: `pickup-countdown 12000ms linear forwards` }}
                />
              </div>
            </div>
          ) : null}

          {showArrivalPopup && activeDispatch ? (
            <div
              className={`pointer-events-auto absolute right-4 z-30 w-[360px] animate-slide-up rounded-2xl border border-blue-400/70 bg-navy-950/95 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md ${
                showPickupPopup ? "top-44" : "top-4"
              }`}
            >
              <button
                type="button"
                className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                onClick={() => setShowArrivalPopup(false)}
              >
                <X size={14} />
              </button>
              <div className="mb-2 pr-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                  <CheckCircle2 size={16} />
                </span>
                <p className="font-display text-[11px] font-semibold tracking-[0.2em] text-blue-300">HOSPITAL ARRIVAL CONFIRMED</p>
              </div>
              <p className="font-display text-sm font-semibold leading-relaxed text-slate-100">
                Patient has reached {activeDispatch.hospitalName} and is now under treatment.
              </p>
              <p className="mt-2 text-xs tracking-wider text-slate-400">TIME: {arrivalNotifiedAt}</p>
            </div>
          ) : null}
      </section>

      {/* RIGHT: Incident Log — shorter */}
      <section className="flex w-[320px] shrink-0 min-h-0 flex-col rounded-xl border border-navy-700 bg-navy-800 p-5">
        <p className="mb-3 font-display text-xs tracking-widest text-slate-500">INCIDENT LOG</p>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {TRIAGE_QUEUE.map((item) => (
            <TriageCard key={item.id} item={item} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-navy-700 p-3 text-center">
            <p className="font-display text-xl font-bold text-slate-100">6.2 min</p>
            <p className="mt-1 font-display text-xs tracking-wider text-slate-500">Avg Response</p>
          </div>
          <div className="rounded-lg bg-navy-700 p-3 text-center">
            <p className="font-display text-xl font-bold text-slate-100">3 / 5</p>
            <p className="mt-1 font-display text-xs tracking-wider text-slate-500">Units Deployed</p>
          </div>
          <div className="rounded-lg bg-navy-700 p-3 text-center">
            <p className="font-display text-xl font-bold text-slate-100">12</p>
            <p className="mt-1 font-display text-xs tracking-wider text-slate-500">Incidents Today</p>
          </div>
        </div>
      </section>
      </div>

      {showHospitalList && (
        <HospitalListModal hospitals={hospitals} onClose={() => setShowHospitalList(false)} />
      )}
    </>
  );
}

export default HospitalView;