import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import DOMPurify from "dompurify";

const BIAS_CONFIG = {
  Bullish: { chipClass: "chip-bullish", Icon: TrendingUp },
  Bearish: { chipClass: "chip-bearish", Icon: TrendingDown },
  Neutral: { chipClass: "chip-neutral", Icon: Minus },
};

export default function AnalysisCard({ icon: Icon, label, value, sub, accent, bias, sections }) {
  const biasCfg = bias ? BIAS_CONFIG[bias] : null;
  const accentColor = accent || "var(--accent)";
  const accentGlow = accent ? `${accent}22` : "var(--accent-glow)";

  if (sections && sections.length > 0) {
    return (
      <div 
        className="card edge-card flex flex-col gap-4 animate-fade-in-up transition-colors duration-200 hover:border-[var(--border-hover)]"
        style={{ borderLeftColor: accentColor }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: accentGlow }}
              >
                <Icon size={16} style={{ color: accentColor }} />
              </div>
            )}
            <span className="label">{label}</span>
          </div>
          {biasCfg && (
            <div className={`badge uppercase tracking-wider ${biasCfg.chipClass}`} style={{ fontSize: "10px", fontWeight: 700 }}>
              <biasCfg.Icon size={10} />
              {bias}
            </div>
          )}
        </div>

        {sections.map((section, idx) => (
          <div key={section.title ? `${section.title}-${idx}` : `section-${idx}`} className="space-y-1.5">
            <div className="flex items-center gap-2">
              {section.icon && <section.icon size={12} style={{ color: "var(--accent)" }} />}
              <span className="label">{section.title}</span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-main)" }}>{DOMPurify.sanitize(section.content)}</p>
            {section.sub && <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{DOMPurify.sanitize(section.sub)}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="card edge-card flex flex-col gap-3 animate-fade-in-up transition-colors duration-200 hover:border-[var(--border-hover)]"
      style={{ borderLeftColor: accentColor }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: accentGlow }}
            >
              <Icon size={16} style={{ color: accentColor }} />
            </div>
          )}
          <span className="label">{label}</span>
        </div>
        {biasCfg && (
          <div className={`badge uppercase tracking-wider ${biasCfg.chipClass}`} style={{ fontSize: "10px", fontWeight: 700 }}>
            <biasCfg.Icon size={10} />
            {bias}
          </div>
        )}
      </div>
      <p className="value text-base leading-snug">{value ?? "—"}</p>
      {sub && <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}
