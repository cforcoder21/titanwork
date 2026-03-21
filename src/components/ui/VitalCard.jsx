function VitalCard({ label, value, unit, colorClass = "text-slate-100" }) {
  return (
    <div className="rounded-lg border border-navy-600 bg-navy-700 p-3 transition-all duration-500">
      <p className="font-display text-xs tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold transition-all duration-500 ${colorClass}`}>
        {value}
        {unit ? <span className="ml-1 text-sm text-slate-400">{unit}</span> : null}
      </p>
    </div>
  );
}

export default VitalCard;
