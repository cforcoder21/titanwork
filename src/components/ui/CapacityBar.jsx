function meterColor(used, total) {
  const ratio = used / total;
  if (ratio >= 0.9) return "bg-red-500";
  if (ratio >= 0.75) return "bg-amber-500";
  return "bg-green-500";
}

function CapacityBar({ label, used, total }) {
  const width = `${Math.min(100, (used / total) * 100)}%`;
  const fillColor = meterColor(used, total);

  return (
    <div className="rounded-lg border border-navy-600 bg-navy-700 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-display text-xs tracking-wider text-slate-400">{label}</p>
        <p className="font-display text-sm font-bold text-slate-100">
          {used}/{total}
        </p>
      </div>
      <div className="h-2 w-full rounded-full bg-navy-600">
        <div
          className={`animate-bar-fill h-2 rounded-full transition-all duration-500 ${fillColor}`}
          style={{ width, "--target-width": width }}
        />
      </div>
    </div>
  );
}

export default CapacityBar;
