import { useState, useEffect } from "react";
import { getUgandaHour } from "../utils/timezone";

const SESSIONS = [
  { name: "Asian", start: 2, end: 10, fullName: "Asian" },
  { name: "London", start: 10, end: 18, fullName: "London" },
  { name: "New York", start: 16, end: 24, fullName: "New York" },
];

const formatTime = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function SessionCountdown() {
  const [sessionStates, setSessionStates] = useState([]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const ugandaHour = getUgandaHour(now);

      const states = SESSIONS.map((session) => {
        const { start, end, name, fullName } = session;
        let adjustedEnd = end;
        if (end < start) adjustedEnd = end + 24;

        if (ugandaHour >= start && ugandaHour < adjustedEnd) {
          const sessionEnd = new Date(now);
          sessionEnd.setHours(adjustedEnd, 0, 0, 0);
          if (sessionEnd.getTime() <= now.getTime()) {
            sessionEnd.setDate(sessionEnd.getDate() + 1);
          }
          const remaining = sessionEnd.getTime() - now.getTime();
          return { state: "ACTIVE", name, fullName: fullName + " Open", time: formatTime(remaining) };
        }

        const sessionStart = new Date(now);
        sessionStart.setHours(start, 0, 0, 0);
        if (sessionStart.getTime() <= now.getTime()) {
          sessionStart.setDate(sessionStart.getDate() + 1);
        }
        const remaining = sessionStart.getTime() - now.getTime();
        
        const isUpcoming = remaining < 24 * 60 * 60 * 1000;
        return { state: isUpcoming ? "UPCING" : "CLOSED", name, fullName, time: formatTime(remaining) };
      });

      setSessionStates(states);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b border-white/5 bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="md:grid md:grid-cols-3 md:gap-4 flex overflow-x-auto pb-2 md:pb-0 -mx-2 px-2 md:px-0">
          {sessionStates.map((s) => (
            <div
              key={s.name}
              className={`flex-shrink-0 md:flex-shrink px-3 py-2 rounded-lg mx-2 md:mx-0 md:px-4 md:py-3 text-xs sm:text-sm font-mono flex items-center gap-2 whitespace-nowrap ${
                s.state === "ACTIVE"
                  ? "bg-green-500/15 border border-green-500/40 text-green-400"
                  : s.state === "UPCING"
                  ? "bg-yellow-500/15 border border-yellow-500/40 text-yellow-400"
                  : "bg-gray-500/15 border border-gray-500/40 text-gray-400"
              }`}
            >
              <span className="text-base">{s.state === "ACTIVE" ? "🟢" : s.state === "UPCING" ? "🟡" : "🔴"}</span>
              <span className="font-semibold">{s.fullName}</span>
              <span className="hidden sm:inline">—</span>
              <span className="font-bold font-mono">
                {s.state === "ACTIVE" ? `ACTIVE — closes in ${s.time}` : `Opens in ${s.time}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}