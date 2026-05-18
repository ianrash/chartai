import { useEffect, useRef } from "react";

const LEVELS = {
  Low: { color: "#ef4444" },
  Medium: { color: "#facc15" },
  High: { color: "#22c55e" },
};

export default function ConfidenceBar({ confidence, score }) {
  const barRef = useRef(null);
  const level = LEVELS[confidence] ?? { color: "#8892a4" };
  const percentage = score ?? 0;

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty("--bar-width", `${percentage}%`);
    }
  }, [percentage, level.color]);

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <span className="label">AI Confidence</span>
        <div className="flex items-center gap-2">
          {score !== undefined && (
            <span className="text-sm font-semibold" style={{ color: level.color }}>
              {score}%
            </span>
          )}
          <span
            className="badge font-bold"
            style={{ background: `${level.color}22`, color: level.color }}
          >
            {confidence ?? "—"}
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full animate-fill-bar"
          style={{
            background: `linear-gradient(90deg, ${level.color}88, ${level.color})`,
            width: 0,
          }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-muted">Low</span>
        <span className="text-xs text-muted">Medium</span>
        <span className="text-xs text-muted">High</span>
      </div>
    </div>
  );
}
