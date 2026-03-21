import { useState } from "react";

function formatHms(timestamp) {
  if (!timestamp) return "--:--:--";
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function DispatchResult({ dispatch, remainingSeconds }) {
  const [showContacts, setShowContacts] = useState(false);
  if (!dispatch) return null;

  const totalSeconds = Math.max(1, dispatch.initialEtaSeconds || dispatch.etaMinutes * 60);
  const progress = Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100);
  const etaText = remainingSeconds < 60 ? `${remainingSeconds}s` : `${Math.ceil(remainingSeconds / 60)} min`;

  return (
    <div className="animate-slide-up rounded-xl border border-green-500 bg-navy-700 p-4">
      <p className="font-display text-xs tracking-widest text-green-500">DISPATCHED</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="font-display text-xl font-bold text-slate-100">UNIT {dispatch.ambulanceId}</p>
        <p className="font-display text-3xl font-bold text-green-400">{etaText}</p>
      </div>
      <p className="text-xs tracking-wider text-slate-500">TIME: {formatHms(dispatch.dispatchedAt)}</p>
      <p className="mt-1 text-sm text-slate-300">Hospital: {dispatch.hospitalName}</p>
      <p className="text-sm text-slate-400">Distance: {dispatch.distanceKm} km</p>
      <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">Route Band: {dispatch.hospitalDistanceBand}</p>

      <div className="mb-3 rounded-lg border border-blue-500/40 bg-blue-500/5 p-3">
        <p className="font-display text-[11px] font-semibold tracking-[0.2em] text-blue-300">ONBOARD CREW</p>

        <div className="mt-2 space-y-1.5 text-sm">
          <p className="text-slate-400">
            Driver: <span className="font-semibold text-slate-100">{dispatch.driverName || "--"}</span>
          </p>
          <p className="text-slate-400">
            Conductor: <span className="font-semibold text-slate-100">{dispatch.conductorName || "--"}</span>
          </p>
          <p className="text-slate-400">
            Medical Support: <span className="font-semibold text-slate-100">{dispatch.medicalSupportName || "--"}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowContacts((prev) => !prev)}
          className="mt-3 w-full rounded-md border border-blue-500 bg-blue-500/10 px-3 py-2 font-display text-xs font-bold tracking-wider text-blue-500 transition-colors hover:bg-blue-500/20"
        >
          {showContacts ? "HIDE CONTACTS" : "CONTACT THEM"}
        </button>

        {showContacts ? (
          <div className="mt-3 rounded-md border border-navy-600 bg-navy-800 p-3 text-sm tracking-wide text-slate-300">
            <p>Conductor: <span className="font-semibold text-slate-100">{dispatch.supportContacts?.conductor || "N/A"}</span></p>
            <p className="mt-1.5">Medical Support: <span className="font-semibold text-slate-100">{dispatch.supportContacts?.medicalSupport || "N/A"}</span></p>
          </div>
        ) : null}
      </div>

      <div className="h-2 rounded-full bg-navy-600">
        <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default DispatchResult;
