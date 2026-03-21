import { X, MapPin, Bed, Activity } from "lucide-react";

function HospitalListModal({ hospitals, onClose }) {
  if (!hospitals || hospitals.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-navy-600 bg-navy-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-slate-100">Hospital List</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-navy-700 transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <p className="text-slate-400">No hospitals available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl border border-navy-600 bg-navy-800 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-slate-100">Hospital List</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-navy-700 transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {hospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="rounded-lg border border-navy-600 bg-navy-700/50 p-4 hover:border-blue-500/50 hover:bg-navy-700 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display text-lg font-semibold text-slate-100">
                  {hospital.name}
                </h3>
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                  OPERATIONAL
                </span>
              </div>

              <p className="text-sm text-slate-400 mb-3">{hospital.type || "Trauma Center"}</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-400" />
                  <span className="text-xs text-slate-300">
                    {hospital.lat?.toFixed(4)}, {hospital.lng?.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed size={16} className="text-amber-400" />
                  <span className="text-xs text-slate-300">
                    {hospital.beds || 0} / {hospital.totalBeds || 24} beds
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-navy-600">
                <div className="text-center">
                  <p className="text-xs text-slate-500">ICU Beds</p>
                  <p className="font-display text-sm font-bold text-slate-100">
                    {hospital.icuBeds || 0} / {hospital.totalIcuBeds || 6}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">ER Bays</p>
                  <p className="font-display text-sm font-bold text-slate-100">
                    {hospital.erBays || 0} / {hospital.totalErBays || 5}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">OR</p>
                  <p className="font-display text-sm font-bold text-slate-100">
                    {hospital.operatingRooms || 0} / 3
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-navy-700 py-2 font-display text-sm font-semibold tracking-wider text-slate-200 hover:bg-navy-600 transition-colors"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

export default HospitalListModal;
