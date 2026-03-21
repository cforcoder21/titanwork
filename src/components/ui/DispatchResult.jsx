function DispatchResult({ dispatch, remainingSeconds }) {
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
      <p className="mt-1 text-sm text-slate-300">Hospital: {dispatch.hospitalName}</p>
      <p className="text-sm text-slate-400">Distance: {dispatch.distanceKm} km</p>
      <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">Route Band: {dispatch.hospitalDistanceBand}</p>
      <div className="h-2 rounded-full bg-navy-600">
        <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default DispatchResult;
