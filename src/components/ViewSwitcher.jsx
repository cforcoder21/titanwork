import { Building2, Heart, Truck } from "lucide-react";

const tabs = [
  { id: "patient", label: "Patient View", icon: Heart },
  { id: "driver", label: "Driver View", icon: Truck },
  { id: "hospital", label: "Hospital Command", icon: Building2 }
];

function ViewSwitcher({ activeView, onChange }) {
  return (
    <div className="fixed inset-x-0 top-14 z-40 flex h-12 items-center justify-center border-b border-navy-700 bg-navy-800">
      <div className="flex items-center gap-2 rounded-full bg-navy-900/70 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeView;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 rounded-full px-5 py-1.5 font-display text-sm transition-colors ${
                isActive
                  ? "bg-red-500 font-semibold text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ViewSwitcher;
