import { Cross, Moon, Siren, Sun } from "lucide-react";
import { useClock } from "../hooks/useClock";

function Header({ theme, onToggleTheme, demoMode, onToggleDemoMode, onQuickDispatch, currentView, viewIndex, demoTick }) {
  const time = useClock();

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-navy-700 bg-navy-950 px-6">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-3">
          <Cross size={20} className="text-red-500" />
          <p className="font-display text-sm font-bold tracking-widest text-slate-100">SMART EMERGENCY RESPONSE</p>
          <span className="h-5 w-px bg-navy-700" />
          <p className="font-display text-xs tracking-widest text-red-500">HACKERZ STREET 4.0</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse-blink rounded-full bg-red-500" />
          <span className="font-display text-xs tracking-widest text-red-500">LIVE</span>
          <span className="h-5 w-px bg-navy-700" />
          <button
            type="button"
            onClick={onQuickDispatch}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/50 bg-red-500/10 px-2 text-[11px] font-display tracking-widest text-red-400 transition-colors hover:bg-red-500/20"
          >
            <Siren size={13} />
            QUICK INCIDENT
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-800 px-2 text-[11px] font-display tracking-widest text-slate-300 transition-colors hover:border-slate-500"
          >
            {theme === "light" ? <Moon size={12} /> : <Sun size={12} />}
            {theme === "light" ? "DARK MODE" : "LIGHT MODE"}
          </button>
          <span className="h-5 w-px bg-navy-700" />
          <span className="font-display text-sm tracking-widest text-slate-300">{time}</span>
          <span className="rounded-lg border border-navy-600 bg-navy-800 px-2 py-1 font-display text-[11px] tracking-wider text-slate-300">
            VIEW {viewIndex}/3 - {currentView.toUpperCase()}
          </span>
          <span className="rounded-lg border border-navy-600 bg-navy-800 px-2 py-1 font-display text-[11px] tracking-wider text-slate-400">
            CYCLE {demoTick}
          </span>
          <span className="rounded-full border border-green-500 bg-green-glow px-3 py-1 font-display text-xs tracking-wider text-green-400">
            DISPATCH ACTIVE
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
