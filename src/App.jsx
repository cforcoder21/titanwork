import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import ViewSwitcher from "./components/ViewSwitcher";
import PatientView from "./components/views/PatientView";
import DriverView from "./components/views/DriverView";
import HospitalView from "./components/views/HospitalView";
import { useSimulation } from "./hooks/useSimulation";
import { EMERGENCY_TYPES } from "./data/constants";

const VIEW_ORDER = ["patient", "driver", "hospital"];

function App() {
  const [activeView, setActiveView] = useState("patient");
  const [activeDispatch, setActiveDispatch] = useState(null);
  const [theme, setTheme] = useState("light");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationPrompt, setLocationPrompt] = useState("GPS location not captured");
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoTick, setDemoTick] = useState(0);
  const { ambulances, hospitals, incidents, triggerIncident } = useSimulation();

  const currentViewIndex = useMemo(() => VIEW_ORDER.indexOf(activeView), [activeView]);

  const handleSos = (type, patientLocation) => {
    const dispatch = triggerIncident(type, patientLocation);
    setActiveDispatch(dispatch);
  };

  const triggerRandomIncident = () => {
    const type = EMERGENCY_TYPES[Math.floor(Math.random() * EMERGENCY_TYPES.length)];
    handleSos(type);
  };

  const toggleDemoMode = () => {
    setDemoMode((prev) => !prev);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

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

  const canEnterPlatform = phoneNumber.trim().length >= 8 && !!userLocation;

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
                onChange={(event) => setPhoneNumber(event.target.value.replace(/[^0-9+]/g, ""))}
                placeholder="Enter contact number"
                className="mt-2 w-full rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-red-500"
              />
            </label>

            <button
              type="button"
              onClick={handleCaptureLocation}
              className="mt-4 h-10 w-full rounded-xl border border-blue-500 bg-blue-500/10 font-display text-sm font-semibold tracking-wider text-blue-400 transition-colors hover:bg-blue-500/20"
            >
              CAPTURE GPS LOCATION
            </button>

            <p className="mt-2 text-xs text-slate-500">{locationPrompt}</p>

            <button
              type="button"
              onClick={() => setIsOnboardingComplete(true)}
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
          />
        ) : null}

        {activeView === "driver" ? (
          <DriverView
            ambulances={ambulances}
            activeDispatch={activeDispatch}
            theme={theme}
            userPhoneNumber={phoneNumber}
          />
        ) : null}

        {activeView === "hospital" ? (
          <HospitalView ambulances={ambulances} hospitals={hospitals} incidents={incidents} theme={theme} />
        ) : null}
      </main>
    </div>
  );
}

export default App;