import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import ViewSwitcher from "./components/ViewSwitcher";
import PatientView from "./components/views/PatientView";
import DriverView from "./components/views/DriverView";
import HospitalView from "./components/views/HospitalView";
import { useSimulation } from "./hooks/useSimulation";
import { DUMMY_PICKUP_LOCATIONS, EMERGENCY_TYPES } from "./data/constants";

const VIEW_ORDER = ["patient", "driver", "hospital"];

function App() {
  const [activeView, setActiveView] = useState("patient");
  const [activeDispatch, setActiveDispatch] = useState(null);
  const [theme, setTheme] = useState("light");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [locationPrompt, setLocationPrompt] = useState("GPS location not captured");
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoTick, setDemoTick] = useState(0);
  const [progressTick, setProgressTick] = useState(0);
  const { ambulances, hospitals, incidents, triggerIncident } = useSimulation();

  const currentViewIndex = useMemo(() => VIEW_ORDER.indexOf(activeView), [activeView]);

  // Shared progress computation for all views
  const sharedDispatchProgress = useMemo(() => {
    if (!activeDispatch?.incidentId) return 0;
    const totalSeconds = Math.max(1, activeDispatch.initialEtaSeconds || activeDispatch.etaMinutes * 60 || 1);
    const activeIncident = incidents.find((inc) => inc.id === activeDispatch.incidentId);
    if (activeIncident) {
      const remaining = Math.max(0, activeIncident.eta);
      return Math.max(0, Math.min(1, (totalSeconds - remaining) / totalSeconds));
    }
    const elapsed = Math.max(0, Math.floor((Date.now() - activeDispatch.dispatchedAt) / 1000));
    return Math.max(0, Math.min(1, elapsed / totalSeconds));
  }, [activeDispatch, incidents, progressTick]);

  // Progress ticker
  useEffect(() => {
    if (!activeDispatch?.incidentId) return undefined;
    const ticker = setInterval(() => setProgressTick((p) => p + 1), 500);
    return () => clearInterval(ticker);
  }, [activeDispatch?.incidentId]);

  const handleSos = (type, patientLocation) => {
    const dispatch = triggerIncident(type, patientLocation, phoneNumber);
    setActiveDispatch(dispatch);
  };

  const triggerRandomIncident = () => {
    const type = EMERGENCY_TYPES[Math.floor(Math.random() * EMERGENCY_TYPES.length)];
    handleSos(type);
  };

  const toggleDemoMode = () => setDemoMode((prev) => !prev);
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  useEffect(() => {
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setLocationPrompt("Geolocation not supported in this browser");
      return;
    }
    setLocationPrompt("Capturing GPS location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        };
        setUserLocation(next);
        setLocationPrompt(`GPS locked: ${next.lat}, ${next.lng}`);
      },
      () => setLocationPrompt("Location permission denied or unavailable"),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleDummyLocationSelection = () => {
    const selected = DUMMY_PICKUP_LOCATIONS.find((location) => location.id === selectedLocationId);
    if (!selected) {
      setLocationPrompt("Select a location from the list");
      return;
    }

    const next = { lat: selected.lat, lng: selected.lng };
    setUserLocation(next);
    setLocationPrompt(`Location locked: ${selected.label}`);
  };

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const isPhoneTooShort = phoneDigits.length > 0 && phoneDigits.length < 10;
  const isPhoneTooLong = phoneDigits.length > 10;
  const isPhoneValid = phoneDigits.length === 10;
  const canEnterPlatform = isPhoneValid && !!userLocation;

  const nearestHospitalPreview = useMemo(() => {
    if (!userLocation || !hospitals?.length) return null;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const haversine = (aLat, aLng, bLat, bLng) => {
      const R = 6371;
      const dLat = toRad(bLat - aLat);
      const dLng = toRad(bLng - aLng);
      const aa =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
      return R * c;
    };

    const nearest = hospitals
      .map((hospital) => ({
        hospital,
        distance: haversine(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng)
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (!nearest) return null;
    return {
      name: nearest.hospital.name,
      distanceKm: nearest.distance.toFixed(1)
    };
  }, [hospitals, userLocation]);

  const handleEnterPlatform = () => {
    if (!canEnterPlatform) return;
    setIsOnboardingComplete(true);
  };

  useEffect(() => {
    if (!demoMode) return undefined;
    const viewRotationTimer = setInterval(() => {
      setActiveView((prev) => {
        const idx = VIEW_ORDER.indexOf(prev);
        return VIEW_ORDER[(idx + 1) % VIEW_ORDER.length];
      });
    }, 9000);
    const incidentTimer = setInterval(() => {
      triggerRandomIncident();
      setDemoTick((prev) => prev + 1);
    }, 18000);
    triggerRandomIncident();
    return () => {
      clearInterval(viewRotationTimer);
      clearInterval(incidentTimer);
    };
  }, [demoMode]);

  return (
    <div className="min-w-[1280px] bg-navy-900 text-slate-100 font-body transition-colors duration-300">
      {!isOnboardingComplete ? (
        <div className="fixed inset-0 z-[5000] isolate flex items-center justify-center bg-navy-950/80 backdrop-blur-sm">
          <div className="relative z-[5001] w-[92%] max-w-md rounded-2xl border border-navy-600 bg-navy-900 p-6 shadow-[0_24px_40px_rgba(0,0,0,0.45)]">
            <p className="font-display text-xs tracking-widest text-red-500">WELCOME</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-100">Confirm Phone and GPS</h2>
            <p className="mt-1 text-sm text-slate-400">Enter your phone number and capture GPS location to continue.</p>
            <label className="mt-5 block">
              <span className="font-display text-xs tracking-widest text-slate-400">PHONE NUMBER</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, ""))}
                placeholder="Enter contact number"
                className="mt-2 w-full rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-red-500"
              />
              {isPhoneTooShort ? (
                <p className="mt-2 text-xs text-red-400">Phone number must be exactly 10 digits.</p>
              ) : null}
              {isPhoneTooLong ? (
                <p className="mt-2 text-xs text-red-400">Only 10-digit phone numbers are valid.</p>
              ) : null}
            </label>
            <button
              type="button"
              onClick={handleCaptureLocation}
              className="mt-4 h-10 w-full rounded-xl border border-blue-500 bg-blue-500/10 font-display text-sm font-semibold tracking-wider text-blue-400 transition-colors hover:bg-blue-500/20"
            >
              CAPTURE GPS LOCATION
            </button>
            <select
              value={selectedLocationId}
              onChange={(event) => setSelectedLocationId(event.target.value)}
              className="mt-3 w-full rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500"
            >
              <option value="">Select Other Pickup Location</option>
              {DUMMY_PICKUP_LOCATIONS.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDummyLocationSelection}
              className="mt-2 h-10 w-full rounded-xl border border-emerald-500 bg-emerald-500/10 font-display text-sm font-semibold tracking-wider text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              USE SELECTED LOCATION
            </button>
            <p className="mt-2 text-xs text-slate-500">{locationPrompt}</p>
            {nearestHospitalPreview ? (
              <p className="mt-1 text-xs text-emerald-400">
                Nearest Hospital: {nearestHospitalPreview.name} ({nearestHospitalPreview.distanceKm} km)
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleEnterPlatform}
              disabled={!canEnterPlatform}
              className="mt-5 h-11 w-full rounded-xl bg-red-500 font-display text-sm font-bold tracking-wider text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-navy-700 disabled:text-slate-500"
            >
              ENTER PLATFORM
            </button>
          </div>
        </div>
      ) : null}

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        demoMode={demoMode}
        onToggleDemoMode={toggleDemoMode}
        onQuickDispatch={triggerRandomIncident}
        currentView={activeView}
        viewIndex={currentViewIndex + 1}
        demoTick={demoTick}
      />
      <ViewSwitcher activeView={activeView} onChange={setActiveView} />

      <main className="pt-[6.5rem]">
        {activeView === "patient" ? (
          <PatientView
            ambulances={ambulances}
            hospitals={hospitals}
            incidents={incidents}
            onTriggerSos={handleSos}
            activeDispatch={activeDispatch}
            theme={theme}
            userPhoneNumber={phoneNumber}
            userLocation={userLocation}
            sharedProgress={sharedDispatchProgress}
          />
        ) : null}

        {activeView === "driver" ? (
          <DriverView
            ambulances={ambulances}
            activeDispatch={activeDispatch}
            theme={theme}
            userPhoneNumber={phoneNumber}
            sharedProgress={sharedDispatchProgress}
          />
        ) : null}

        {activeView === "hospital" ? (
          <HospitalView
            ambulances={ambulances}
            hospitals={hospitals}
            incidents={incidents}
            theme={theme}
            activeDispatch={activeDispatch}
            patientPhone={phoneNumber}
            sharedProgress={sharedDispatchProgress}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;