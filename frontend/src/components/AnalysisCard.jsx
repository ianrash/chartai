import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import DOMPurify from "dompurify";

const BIAS_CONFIG = {
  Bullish: { color: "var(--bullish)", Icon: TrendingUp, bg: "var(--bullish-glow)", border: "rgba(16, 185, 129, 0.3)" },
  Bearish: { color: "var(--bearish)", Icon: TrendingDown, bg: "var(--bearish-glow)", border: "rgba(244, 63, 94, 0.3)" },
  Neutral: { color: "var(--neutral)", Icon: Minus, bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.3)" },
};

export default function AnalysisCard({ icon: Icon, label, value, sub, accent, bias, sections }) {
  const biasCfg = bias ? BIAS_CONFIG[bias] : null;
  const accentColor = accent || "var(--accent)";
  const accentGlow = accent ? `${accent}22` : "var(--accent-glow)";

  if (sections && sections.length > 0) {
    return (
      <div 
        className="card flex flex-col gap-4 animate-fade-in-up hover:scale-[1.01] transition-all duration-300"
        style={{ borderLeft: `3px solid ${accentColor}`, background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: accentGlow, boxShadow: `0 0 15px ${accentGlow}` }}
              >
                <Icon size={16} style={{ color: accentColor }} />
              </div>
            )}
            <span className="label font-display">{label}</span>
          </div>
          {biasCfg && (
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ color: biasCfg.color, backgroundColor: biasCfg.bg, border: `1px solid ${biasCfg.border}` }}
            >
              <biasCfg.Icon size={10} />
              {bias}
            </div>
          )}
        </div>

        {sections.map((section, idx) => (
          <div key={section.title || `section-${idx}`} className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-display font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {section.icon && <section.icon size={12} />}
              {section.title}
            </div>
            <p className="text-sm text-main leading-relaxed">{DOMPurify.sanitize(section.content)}</p>
            {section.sub && <p className="text-xs text-muted leading-relaxed">{DOMPurify.sanitize(section.sub)}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="card flex flex-col gap-3 animate-fade-in-up hover:scale-[1.01] transition-all duration-300"
      style={{ borderLeft: `3px solid ${accentColor}`, background: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: accentGlow, boxShadow: `0 0 15px ${accentGlow}` }}
            >
              <Icon size={16} style={{ color: accentColor }} />
            </div>
          )}
          <span className="label font-display">{label}</span>
        </div>
        {biasCfg && (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ color: biasCfg.color, backgroundColor: biasCfg.bg, border: `1px solid ${biasCfg.border}` }}
          >
            <biasCfg.Icon size={10} />
            {bias}
          </div>
        )}
      </div>
      <p className="text-base font-semibold text-main leading-snug">{value ?? "—"}</p>
      {sub && <p className="text-xs text-muted leading-relaxed">{sub}</p>}
    </div>
  );
}