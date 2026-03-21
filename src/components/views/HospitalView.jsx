import CapacityBar from "../ui/CapacityBar";
import EmergencyMap from "../map/EmergencyMap";
import TriageCard from "../ui/TriageCard";
import { TRIAGE_QUEUE } from "../../data/constants";

function formatEta(seconds) {
  const mins = String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0");
  const secs = String(Math.max(0, seconds) % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function HospitalView({ ambulances, hospitals, incidents, theme }) {
  const primaryHospital = hospitals[0];

  const incomingUnits = incidents.slice(0, 2).map((incident, idx) => ({
    unit: incident.assignedUnit,
    condition: incident.type.label,
    eta: formatEta(incident.eta),
    bay: `Bay ${idx + 1}`,
    priority: incident.priority
  }));

  const fallbackIncoming = [
    { unit: "AMB-03", condition: "Cardiac Arrest", eta: "05:10", bay: "Bay 1", priority: "P1" },
    { unit: "AMB-02", condition: "Severe Trauma", eta: "08:45", bay: "Bay 2", priority: "P2" }
  ];

  const displayedIncoming = incomingUnits.length ? incomingUnits : fallbackIncoming;

  const routeSet = incidents.slice(0, 3).flatMap((incident) => {
    const unit = ambulances.find((item) => item.name === incident.assignedUnit);
    if (!unit || !primaryHospital) return [];
    return [[[unit.lat, unit.lng], [incident.lat, incident.lng], [primaryHospital.lat, primaryHospital.lng]]];
  });

  return (
    <div className="flex h-[calc(100vh-6.5rem)] gap-4 p-4">

      {/* LEFT: Hospital Info */}
      <section className="flex w-[280px] shrink-0 min-h-0 flex-col rounded-xl border border-navy-700 bg-navy-800 p-5">
        <p className="font-display text-xs tracking-widest text-red-500">HOSPITAL COMMAND</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-slate-100">{primaryHospital.name}</h2>
        <p className="text-sm text-slate-500">Trauma Center - Level 1</p>

        <div className="mt-4 space-y-3">
          <CapacityBar label="Total Beds" used={primaryHospital.beds} total={24} />
          <CapacityBar label="ICU Beds" used={primaryHospital.icuBeds} total={6} />
          <CapacityBar label="ER Bays" used={primaryHospital.erBays} total={5} />
          <CapacityBar label="Operating Rooms" used={1} total={3} />
        </div>

        <div className="mt-5">
          <p className="mb-2 font-display text-xs tracking-widest text-slate-500">INCOMING UNITS</p>
          <div className="space-y-2">
            {displayedIncoming.map((unit) => (
              <div
                key={`${unit.unit}-${unit.bay}`}
                className={`rounded-lg border-l-4 bg-navy-700 p-3 ${
                  unit.priority === "P1" ? "border-red-500" : "border-amber-500"
                }`}
              >
                <p className="font-display text-sm font-semibold text-slate-100">{unit.unit}</p>
                <p className="text-xs text-slate-400">{unit.condition}</p>
                <p className="text-xs text-slate-500">ETA {unit.eta} | {unit.bay}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MIDDLE: Full Citywide Map */}
      <section className="flex-1 min-h-0 min-w-0">
        <EmergencyMap
          mode="hospital"
          ambulances={ambulances}
          hospitals={hospitals}
          incidents={incidents}
          center={[primaryHospital.lat, primaryHospital.lng]}
          zoom={13}
          routeSet={routeSet}
          theme={theme}
        />
      </section>

      {/* RIGHT: Incident Log */}
      <section className="flex w-[280px] shrink-0 min-h-0 flex-col rounded-xl border border-navy-700 bg-navy-800 p-5">
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
  );
}

export default HospitalView;
