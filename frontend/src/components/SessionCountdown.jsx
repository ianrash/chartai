import { useState, useEffect } from "react";

const SESSIONS = [
  { name: "London", start: 6, end: 9, fullName: "London Open" },
  { name: "New York", start: 12, end: 14, fullName: "New York Session" },
  { name: "Asian", start: 20, end: 22, fullName: "Asian Session" },
];

const formatCountdown = (diff) => {
  if (diff <= 0) return "00:00:00";
  
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = Math.floor(diff % 60);
  
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const getSessionState = (session, ugandaHour, now) => {
  const { start, end } = session;
  
  if (ugandaHour >= start && ugandaHour < end) {
    const endTime = new Date(now);
    endTime.setUTCHours(end - 3, 0, 0, 0);
    if (endTime <= now) endTime.setUTCDate(endTime.getUTCDate() + 1);
    const remaining = Math.max(0, (endTime - now) / 1000);
    return { state: "ACTIVE", remaining };
  }
  
  if (ugandaHour < start) {
    const nextTime = new Date(now);
    nextTime.setUTCHours(start - 3, 0, 0, 0);
    const remaining = Math.max(0, (nextTime - now) / 1000);
    return { state: "UPCING", remaining };
  }
  
  const nextTime = new Date(now);
  nextTime.setUTCHours(start + 21, 0, 0, 0);
  const remaining = Math.max(0, (nextTime - now) / 1000);
  return { state: "CLOSED", remaining };
};

export default function SessionCountdown() {
  const [now, setNow] = useState(() => new Date());
  const [sessions, setSessions] = useState(() => {
    const now = new Date();
    const ugandaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const ugandaHour = ugandaTime.getUTCHours();
    
    return SESSIONS.map(session => {
      const { state, remaining } = getSessionState(session, ugandaHour, now);
      return {
        name: session.name,
        fullName: session.fullName,
        state,
        formatted: formatCountdown(remaining),
      };
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const ugandaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
      const ugandaHour = ugandaTime.getUTCHours();
      
      const updated = SESSIONS.map(session => {
        const { state, remaining } = getSessionState(session, ugandaHour, now);
        return {
          name: session.name,
          fullName: session.fullName,
          state,
          formatted: formatCountdown(remaining),
        };
      });
      
      setSessions(updated);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getDisplayText = (session) => {
    switch (session.state) {
      case "ACTIVE":
        return `ACTIVE — closes in ${session.formatted}`;
      case "UPCING":
        return `Opens in ${session.formatted}`;
      case "CLOSED":
        return `Opens in ${session.formatted}`;
      default:
        return session.formatted;
    }
  };

  const getStatusIcon = (state) => {
    switch (state) {
      case "ACTIVE":
        return "🟢";
      case "UPCING":
        return "🟡";
      case "CLOSED":
        return "🔴";
      default:
        return "⚪";
    }
  };

  return (
    <div className="border-b border-white/5 bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="md:grid md:grid-cols-3 md:gap-4 flex overflow-x-auto pb-2 md:pb-0 -mx-2 px-2 md:px-0">
          {sessions.map((session) => (
            <div
              key={session.name}
              className={`
                flex-shrink-0 md:flex-shrink px-3 py-2 rounded-lg mx-2 md:mx-0 md:px-4 md:py-3
                text-xs sm:text-sm font-mono flex items-center gap-2 whitespace-nowrap
                ${
                  session.state === "ACTIVE"
                    ? "bg-green-500/15 border border-green-500/40 text-green-400"
                    : session.state === "UPCING"
                    ? "bg-yellow-500/15 border border-yellow-500/40 text-yellow-400"
                    : "bg-gray-500/15 border border-gray-500/40 text-gray-400"
                }
              `}
            >
              <span className="text-base">{getStatusIcon(session.state)}</span>
              <span className="font-semibold">{session.fullName}</span>
              <span className="hidden sm:inline">—</span>
              <span className="font-bold font-mono">{getDisplayText(session)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}