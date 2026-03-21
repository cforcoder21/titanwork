import { useEffect, useState } from "react";

function formatClock(date) {
  return date.toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function useClock() {
  const [time, setTime] = useState(formatClock(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatClock(new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return time;
}
