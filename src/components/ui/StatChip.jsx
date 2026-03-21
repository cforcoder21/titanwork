function StatChip({ label, value, tone = "red" }) {
  const toneClasses =
    tone === "green"
      ? "border-green-500 bg-navy-700 text-green-400"
      : "border-red-500 bg-navy-700 text-red-400";

  return (
    <div>
      <p className="mb-1 font-display text-xs tracking-widest text-slate-500">{label}</p>
      <div className={`border-l-4 px-3 py-1 text-sm font-bold font-display transition-all duration-500 ${toneClasses}`}>
        {value}
      </div>
    </div>
  );
}

export default StatChip;
