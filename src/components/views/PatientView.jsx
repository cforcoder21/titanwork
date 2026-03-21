import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Brain, CheckCircle2, Flame, Heart, X } from "lucide-react";
import { DELHI_CENTER, EMERGENCY_TYPES } from "../../data/constants";
import DispatchResult from "../ui/DispatchResult";
import EmergencyMap from "../map/EmergencyMap";
import VitalCard from "../ui/VitalCard";
import HospitalListModal from "../ui/HospitalListModal";

const iconMap = {
  Heart,
  AlertTriangle,
  Flame,
  Brain
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTimeHms(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function pathLength(path) {
  if (!path || path.length < 2) return 0;
  let total = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const [latA, lngA] = path[index];
    const [latB, lngB] = path[index + 1];
    total += Math.hypot(latB - latA, lngB - lngA);
  }
  return total;
}

function pickupRatioFromRoute(route) {
  if (!route || route.length < 3) return 0.5;
  const legOne = Math.hypot(route[1][0] - route[0][0], route[1][1] - route[0][1]);
  const legTwo = Math.hypot(route[2][0] - route[1][0], route[2][1] - route[1][1]);
  const total = legOne + legTwo;
  return total === 0 ? 0.5 : legOne / total;
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
    } catch {
      // Nodes may already be stopped.
    }
    carrier.disconnect();
    lfo.disconnect();
    lfoGain.disconnect();
    outputGain.disconnect();
  };
}

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

function splitRouteByProgress(route, progress) {
  if (!route?.length) {
    return { consumed: [], remaining: [] };
  }

  if (route.length === 1) {
    return { consumed: [route[0]], remaining: [route[0]] };
  }

  const currentPosition = interpolateRoute(route, progress);
  if (!currentPosition) {
    return { consumed: [], remaining: route };
  }

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

  if (totalLength === 0) {
    return { consumed: [route[0]], remaining: [route[route.length - 1]] };
  }

  const targetDistance = clamped * totalLength;
  let covered = 0;
  const consumed = [route[0]];
  const remaining = [currentPosition];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const nextCovered = covered + segment.length;
    if (targetDistance > nextCovered) {
      consumed.push(segment.end);
    } else {
      consumed.push(currentPosition);
      const suffix = route.slice(index + 1);
      remaining.push(...suffix);
      return { consumed, remaining };
    }
    covered = nextCovered;
  }

  return { consumed: route, remaining: [route[route.length - 1]] };
}

function PatientView({
  ambulances,
  hospitals,
  incidents,
  onTriggerSos,
  activeDispatch,
  theme,
  userPhoneNumber,
  userLocation,
  sharedProgress
}) {
  const [selectedType, setSelectedType] = useState(EMERGENCY_TYPES[0]);
  const [customEmergency, setCustomEmergency] = useState("");
  const [patientLocation, setPatientLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Live location not acquired");
  const [vitals, setVitals] = useState({
    heartRate: "--",
    bp: "--/--",
    spo2: "--",
    resp: "--"
  });
  const [isPatientOnboard, setIsPatientOnboard] = useState(false);
  const [showPickupPopup, setShowPickupPopup] = useState(false);
  const [pickupPopupDurationMs, setPickupPopupDurationMs] = useState(12000);
  const [showArrivalPopup, setShowArrivalPopup] = useState(false);
  const [pickupNotifiedAt, setPickupNotifiedAt] = useState("");
  const [arrivalNotifiedAt, setArrivalNotifiedAt] = useState("");
  const [showHospitalList, setShowHospitalList] = useState(false);
  const pickupPopupIncidentRef = useRef(null);
  const arrivalPopupIncidentRef = useRef(null);
  const pickupPopupHideTimerRef = useRef(null);
  const arrivalPopupHideTimerRef = useRef(null);
  const pickupSoundStopRef = useRef(null);
  const audioContextRef = useRef(null);
  const [resolvedRoute, setResolvedRoute] = useState([]);
  const [pickupThreshold, setPickupThreshold] = useState(0.5);

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
    if (userLocation) {
      setPatientLocation(userLocation);
      setLocationStatus(`Location locked: ${userLocation.lat}, ${userLocation.lng}`);
    }
  }, [userLocation]);

  useEffect(() => {
    const onFirstInteraction = () => unlockAudioContext();
    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstInteraction);
  }, []);

  useEffect(
    () => () => {
      if (pickupPopupHideTimerRef.current) {
        clearTimeout(pickupPopupHideTimerRef.current);
      }
      if (arrivalPopupHideTimerRef.current) {
        clearTimeout(arrivalPopupHideTimerRef.current);
      }
      if (pickupSoundStopRef.current) {
        pickupSoundStopRef.current();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    const monitoringActive = isPatientOnboard && !!activeDispatch;
    if (!monitoringActive) {
      setVitals({
        heartRate: "--",
        bp: "--/--",
        spo2: "--",
        resp: "--"
      });
      return undefined;
    }

    const updateVitals = () => {
      const systolic = randomInt(108, 126);
      const diastolic = randomInt(68, 84);
      setVitals({
        heartRate: randomInt(72, 95),
        bp: `${systolic}/${diastolic}`,
        spo2: randomInt(96, 99),
        resp: randomInt(14, 18)
      });
    };

    // Show live vitals instantly at pickup instead of waiting for first interval tick.
    updateVitals();

    const vitalsInterval = setInterval(() => {
      updateVitals();
    }, 3000);

    return () => clearInterval(vitalsInterval);
  }, [activeDispatch, isPatientOnboard]);

  const activeIncident = useMemo(
    () =>
      activeDispatch
        ? incidents.find((incident) => incident.id === activeDispatch.incidentId)
        : null,
    [activeDispatch, incidents]
  );

  const remainingSeconds = activeIncident ? activeIncident.eta : 0;

  const acquireLocation = () => {
    unlockAudioContext();
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported in this browser");
      return;
    }

    setLocationStatus("Acquiring GPS location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        };
        setPatientLocation(nextLocation);
        setLocationStatus(`Location locked: ${nextLocation.lat}, ${nextLocation.lng}`);
      },
      () => {
        setLocationStatus("Unable to fetch location. Please allow location permission.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  useEffect(() => {
    if (!activeDispatch?.route?.length) {
      setIsPatientOnboard(false);
      setShowPickupPopup(false);
      setShowArrivalPopup(false);
      setPickupNotifiedAt("");
      setArrivalNotifiedAt("");
      setResolvedRoute([]);
      return undefined;
    }

    const straightRoute = activeDispatch.route;
    setResolvedRoute(straightRoute);
    setPickupThreshold(pickupRatioFromRoute(straightRoute));

    let isCancelled = false;
    (async () => {
      try {
        const firstLeg = await fetchRoadRoute(straightRoute[0], straightRoute[1]);
        const secondLeg = await fetchRoadRoute(straightRoute[1], straightRoute[2]);
        const mergedRoute = [...firstLeg, ...secondLeg.slice(1)];
        if (!isCancelled && mergedRoute.length > 2) {
          const firstLegLength = pathLength(firstLeg);
          const secondLegLength = pathLength(secondLeg);
          const totalLength = firstLegLength + secondLegLength;
          setResolvedRoute(mergedRoute);
          setPickupThreshold(totalLength === 0 ? 0.5 : firstLegLength / totalLength);
        }
      } catch {
        if (!isCancelled) {
          setResolvedRoute(straightRoute);
          setPickupThreshold(pickupRatioFromRoute(straightRoute));
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [activeDispatch?.incidentId, activeDispatch?.route]);

  useEffect(() => {
    if (!activeDispatch?.incidentId) return undefined;

    if (routeProgress >= pickupThreshold && pickupPopupIncidentRef.current !== activeDispatch.incidentId) {
      pickupPopupIncidentRef.current = activeDispatch.incidentId;
      setIsPatientOnboard(true);
      if (mountProgressRef.current < pickupThreshold) {
        setPickupNotifiedAt(formatTimeHms());
        const popupDurationMs = randomInt(10, 15) * 1000;
        setPickupPopupDurationMs(popupDurationMs);
        setShowPickupPopup(true);

        if (pickupPopupHideTimerRef.current) {
          clearTimeout(pickupPopupHideTimerRef.current);
        }
        if (pickupSoundStopRef.current) {
          pickupSoundStopRef.current();
        }

        unlockAudioContext();
        pickupSoundStopRef.current = startAmbulanceSiren(ensureAudioContext(), 5000);
        pickupPopupHideTimerRef.current = setTimeout(() => {
          setShowPickupPopup(false);
          pickupPopupHideTimerRef.current = null;
        }, popupDurationMs);
      }
    }

    return undefined;
  }, [routeProgress, activeDispatch?.incidentId, pickupThreshold]);

  useEffect(() => {
    if (!activeDispatch?.incidentId) return undefined;

    if (routeProgress >= 1 && arrivalPopupIncidentRef.current !== activeDispatch.incidentId) {
      arrivalPopupIncidentRef.current = activeDispatch.incidentId;
      if (mountProgressRef.current < 1) {
        setArrivalNotifiedAt(formatTimeHms());
        setShowArrivalPopup(true);

        if (arrivalPopupHideTimerRef.current) {
          clearTimeout(arrivalPopupHideTimerRef.current);
        }

        arrivalPopupHideTimerRef.current = setTimeout(() => {
          setShowArrivalPopup(false);
          arrivalPopupHideTimerRef.current = null;
        }, 10000);
      }
    }

    return undefined;
  }, [routeProgress, activeDispatch?.incidentId]);

  useEffect(() => {
    if (activeDispatch?.incidentId) return;
    setIsPatientOnboard(false);
    setShowArrivalPopup(false);
    setPickupNotifiedAt("");
    setArrivalNotifiedAt("");
    if (pickupPopupHideTimerRef.current) {
      clearTimeout(pickupPopupHideTimerRef.current);
      pickupPopupHideTimerRef.current = null;
    }
    if (arrivalPopupHideTimerRef.current) {
      clearTimeout(arrivalPopupHideTimerRef.current);
      arrivalPopupHideTimerRef.current = null;
    }
    if (pickupSoundStopRef.current) {
      pickupSoundStopRef.current();
      pickupSoundStopRef.current = null;
    }
  }, [activeDispatch?.incidentId]);

  const trackedUnit = useMemo(() => {
    if (!resolvedRoute?.length || !activeDispatch?.ambulanceId) return null;

    const position = interpolateRoute(resolvedRoute, routeProgress);
    if (!position) return null;

    return {
      id: activeDispatch.ambulanceId,
      position,
      status: routeProgress < pickupThreshold ? "dispatched" : routeProgress < 1 ? "en-route" : "available"
    };
  }, [activeDispatch, pickupThreshold, resolvedRoute, routeProgress]);

  const routeSegments = useMemo(
    () => splitRouteByProgress(resolvedRoute || [], routeProgress),
    [resolvedRoute, routeProgress]
  );

  return (
    <>
      <div className="grid min-h-[calc(100vh-6.5rem)] grid-cols-5 gap-4 p-4">
      <section className="col-span-2 flex min-h-0 max-h-[calc(100vh-7.5rem)] flex-col gap-4 overflow-y-auto rounded-xl border border-navy-700 bg-navy-800 p-5">
        <div>
          <p className="font-display text-xs font-semibold tracking-widest text-red-500">PATIENT SOS</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-slate-100">Emergency Assist</h2>
          <p className="text-sm text-slate-500">Select emergency type and trigger instant dispatch.</p>
          <p className="mt-2 font-display text-xs tracking-widest text-slate-400">
            CONTACT: <span className="text-slate-200">{userPhoneNumber || "Not provided"}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {EMERGENCY_TYPES.map((type) => {
            const Icon = iconMap[type.icon];
            const isSelected = selectedType.id === type.id;
            return (
              <button
                type="button"
                key={type.id}
                onClick={() => setSelectedType(type)}
                className={`relative flex items-center gap-3 rounded-lg border p-4 text-left transition-all duration-200 ${
                  type.id === "other" && isSelected 
                    ? "col-span-2 border-red-500 bg-red-glow shadow-[0_0_12px_rgba(239,68,68,0.2)]" 
                    : type.id === "other"
                      ? "col-span-2 border-navy-600 bg-navy-700 hover:border-red-500 hover:bg-red-glow"
                      : isSelected
                        ? "border-red-500 bg-red-glow shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                        : "border-navy-600 bg-navy-700 hover:border-red-500 hover:bg-red-glow"
                }`}
              >
                <Icon
                  size={18}
                  className={
                    type.id === "cardiac"
                      ? "text-red-500"
                      : type.id === "stroke"
                        ? "text-violet-400"
                        : type.id === "trauma" || type.id === "other"
                          ? "text-amber-500"
                          : "text-amber-400"
                  }
                />
                <span className="font-display text-sm font-semibold text-slate-200">{type.label}</span>
                {isSelected ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" /> : null}
              </button>
            );
          })}
        </div>

        {selectedType.id === "other" && (
          <div className="mt-3">
            <textarea
              placeholder="Please specify medical emergency details..."
              value={customEmergency}
              onChange={(e) => setCustomEmergency(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 dark:border-navy-600 dark:bg-navy-700 p-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-red-500 dark:focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            unlockAudioContext();
            const emergencyToTrigger = selectedType.id === "other"
              ? { ...selectedType, label: customEmergency || "Other Emergency" }
              : selectedType;
            onTriggerSos(emergencyToTrigger, patientLocation);
          }}
          className="h-14 rounded-xl bg-red-500 font-display text-lg font-bold tracking-wider text-white transition-all hover:bg-red-600 animate-sos-pulse"
        >
          TRIGGER SOS DISPATCH
        </button>

        <button
          type="button"
          onClick={acquireLocation}
          className="h-11 rounded-xl border-2 border-sky-400/70 bg-gradient-to-r from-blue-500/25 to-cyan-500/20 font-display text-sm font-semibold tracking-[0.14em] text-sky-200 shadow-[0_8px_18px_rgba(56,189,248,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:from-blue-500/35 hover:to-cyan-500/30 hover:text-white hover:shadow-[0_12px_24px_rgba(56,189,248,0.28)] active:translate-y-0"
        >
          USE MY LOCATION
        </button>

        <p className="text-xs text-slate-500">{locationStatus}</p>
        <p className="text-xs text-slate-500">
          Monitoring: {isPatientOnboard && activeDispatch ? "ACTIVE - patient onboard" : "WAITING - starts after pickup"}
        </p>

        <DispatchResult dispatch={activeDispatch} remainingSeconds={remainingSeconds} />

        <div className="grid grid-cols-2 gap-3 pb-1">
          <VitalCard
            label="HEART RATE"
            value={vitals.heartRate}
            unit="BPM"
            colorClass={vitals.heartRate > 90 ? "text-red-400" : "text-green-400"}
          />
          <VitalCard label="BLOOD PRESSURE" value={vitals.bp} colorClass="text-slate-100" />
          <VitalCard label="SPO2" value={vitals.spo2} unit="%" colorClass="text-green-400" />
          <VitalCard label="RESP RATE" value={vitals.resp} unit="/min" colorClass="text-slate-100" />
        </div>

        <button
          type="button"
          onClick={() => setShowHospitalList(true)}
          className="rounded-xl bg-blue-600 py-2.5 font-display text-sm font-semibold tracking-wider text-white transition-all hover:bg-blue-700 mt-3"
        >
          HOSPITAL LIST
        </button>
      </section>

      <section className="col-span-3 min-h-0">
        <div className="relative h-full">
          <EmergencyMap
            mode="patient"
            ambulances={ambulances}
            hospitals={hospitals}
            incidents={activeIncident ? [activeIncident] : []}
            center={DELHI_CENTER}
            zoom={12}
            dispatchRoute={routeSegments.remaining}
            consumedDispatchRoute={routeSegments.consumed}
            trackedUnit={trackedUnit}
            userLocation={patientLocation}
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
              <p className="mt-2 text-xs tracking-wider text-slate-400">TIME: {pickupNotifiedAt || formatTimeHms()}</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
                <div
                  className="h-full w-full origin-left bg-green-500/80"
                  style={{ animation: `pickup-countdown ${pickupPopupDurationMs}ms linear forwards` }}
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
              <p className="mt-2 text-xs tracking-wider text-slate-400">TIME: {arrivalNotifiedAt || formatTimeHms()}</p>
            </div>
          ) : null}
        </div>
      </section>
      </div>

      {showHospitalList && (
        <HospitalListModal hospitals={hospitals} onClose={() => setShowHospitalList(false)} />
      )}
    </>
  );
}

export default PatientView;
