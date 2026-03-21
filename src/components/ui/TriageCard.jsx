const priorityStyles = {
  P1: "border-red-500 bg-red-500/10 text-red-400",
  P2: "border-amber-500 bg-amber-500/10 text-amber-400",
  P3: "border-slate-500 bg-slate-500/10 text-slate-300"
};

function TriageCard({ item }) {
  return (
    <div className={`mb-2 rounded-lg border-l-4 bg-navy-700 p-3 ${priorityStyles[item.priority] || priorityStyles.P3}`}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-display text-sm font-semibold text-slate-100">
          {item.priority} - {item.condition}
        </p>
        <span className="rounded-full border border-navy-600 px-2 py-0.5 font-display text-[10px] tracking-wider text-slate-200">
          {item.status}
        </span>
      </div>
      <p className="text-xs text-slate-400">Patient Age: {item.age}</p>
      <p className="mb-2 text-xs text-slate-500">ETA/Status: {item.eta}</p>
      <button
        type="button"
        className="rounded border border-navy-600 px-2 py-1 text-xs transition-colors hover:border-green-500 hover:text-green-400"
      >
        ASSIGN BAY
      </button>
    </div>
  );
}

export default TriageCard;
