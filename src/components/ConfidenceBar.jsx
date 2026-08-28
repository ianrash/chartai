import { useEffect, useRef, useMemo } from "react";

const LOW = { r: 242, g: 54, b: 69 };
const MED = { r: 209, g: 163, b: 63 };
const HIGH = { r: 8, g: 153, b: 129 };

function lerpColor(t, c1, c2) {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r},${g},${b})`;
}

function scoreToColor(score) {
  const p = Math.max(0, Math.min(100, score ?? 0));
  if (p <= 50) return lerpColor(p / 50, LOW, MED);
  return lerpColor((p - 50) / 50, MED, HIGH);
}

export default function ConfidenceBar({ confidence, score }) {
  const barRef = useRef(null);
  const percentage = score ?? 0;
  const color = useMemo(() => scoreToColor(score), [score]);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty("--bar-width", `${percentage}%`);
    }
  }, [percentage]);

  return (
    <div className="card-flat animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <span className="label">AI Confidence</span>
        <div className="flex items-center gap-2">
          <span
            className="badge font-semibold"
            style={{ background: `${color.replace("rgb", "rgba").replace(")", ",0.13)")}`, color }}
          >
            {confidence ?? "—"}
          </span>
        </div>
      </div>
      <div className="flex items-baseline justify-end mb-2">
        <span className="mono text-xl font-bold tabular" style={{ color }}>
          {score !== undefined ? `${score}%` : "—"}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
        <div
          ref={barRef}
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            background: color,
            width: 0,
          }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="label" style={{ fontSize: "10px" }}>Low</span>
        <span className="label" style={{ fontSize: "10px" }}>Medium</span>
        <span className="label" style={{ fontSize: "10px" }}>High</span>
      </div>
    </div>
  );
}
