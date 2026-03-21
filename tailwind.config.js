/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#03070F",
          900: "#0A0F1E",
          800: "#0F172A",
          700: "#1E293B",
          600: "#334155"
        },
        red: {
          600: "#DC2626",
          500: "#EF4444",
          400: "#F87171",
          glow: "rgba(239,68,68,0.15)"
        },
        amber: {
          500: "#F97316",
          400: "#FB923C"
        },
        green: {
          500: "#22C55E",
          400: "#4ADE80",
          glow: "rgba(34,197,94,0.15)"
        },
        slate: {
          100: "#F1F5F9",
          300: "#CBD5E1",
          500: "#64748B",
          700: "#334155"
        }
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
