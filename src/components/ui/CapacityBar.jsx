import { useState } from "react";

function meterColor(used, total) {
  const ratio = used / total;
  if (ratio >= 0.9) return "bg-red-500";
  if (ratio >= 0.75) return "bg-amber-500";
  return "bg-green-500";
}

function statusText(pct) {
  if (pct >= 90) return { text: "⚠ CRITICAL — Near Full Capacity", color: "text-red-400" };
  if (pct >= 75) return { text: "⚡ MODERATE — Monitor Closely", color: "text-amber-400" };
  return { text: "✓ NORMAL — Capacity Available", color: "text-green-400" };
}

function CapacityBar({ label, used: initialUsed, total }) {
  const [used, setUsed] = useState(initialUsed);
  const [showPopup, setShowPopup] = useState(false);

  const width = `${Math.min(100, (used / total) * 100)}%`;
  const fillColor = meterColor(used, total);
  const pct = Math.round(Math.min(100, (used / total) * 100));
  const status = statusText(pct);

  return (
    <>
      <div
        className="rounded-lg border border-navy-600 bg-navy-700 p-3 cursor-pointer hover:border-slate-500 transition-colors"
        onClick={() => setShowPopup(true)}
        title={`Click to manage ${label}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-xs tracking-wider text-slate-400">{label}</p>
          <div className="flex items-center gap-2">
            <p className="font-display text-sm font-bold text-slate-100">{used}/{total}</p>
            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16.414H8v-2a2 2 0 01.586-1.414z" />
            </svg>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-navy-600">
          <div
            className={`animate-bar-fill h-2 rounded-full transition-all duration-500 ${fillColor}`}
            style={{ width, "--target-width": width }}
          />
        </div>
      </div>

      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="w-80 rounded-2xl border border-navy-600 bg-navy-800 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="font-display text-xs tracking-widest text-red-500">MANAGE</p>
                <h3 className="font-display text-xl font-bold text-slate-100">{label}</h3>
              </div>
              <button onClick={() => setShowPopup(false)} className="mt-1 text-slate-500 hover:text-slate-200 text-2xl leading-none transition-colors">×</button>
            </div>

            <div className="mb-5 flex items-center justify-center gap-6">
              <button
                onClick={() => used > 0 && setUsed(u => u - 1)}
                disabled={used <= 0}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-navy-600 bg-navy-700 text-2xl font-bold text-slate-200 hover:bg-navy-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >−</button>
              <div className="text-center">
                <p className="font-display text-5xl font-bold text-slate-100 leading-none">
                  {used}<span className="text-2xl text-slate-500">/{total}</span>
                </p>
                <p className="mt-2 text-xs text-slate-500">{total - used} available</p>
              </div>
              <button
                onClick={() => used < total && setUsed(u => u + 1)}
                disabled={used >= total}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-navy-600 bg-navy-700 text-2xl font-bold text-slate-200 hover:bg-navy-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >+</button>
            </div>

            <div className="mb-5">
              <div className="h-2.5 w-full rounded-full bg-navy-600">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${meterColor(used, total)}`}
                  style={{ width: `${Math.min(100, (used / total) * 100)}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-slate-500">
                <span>0</span>
                <span className={`font-semibold ${status.color}`}>{pct}% occupied</span>
                <span>{total}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => used < total && setUsed(u => u + 1)}
                disabled={used >= total}
                className="rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >+ Book</button>
              <button
                onClick={() => used > 0 && setUsed(u => u - 1)}
                disabled={used <= 0}
                className="rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >− Release</button>
            </div>

            <p className={`text-center text-xs font-semibold ${status.color}`}>{status.text}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default CapacityBar;