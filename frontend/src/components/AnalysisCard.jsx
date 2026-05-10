import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import DOMPurify from "dompurify";

const BIAS_CONFIG = {
  Bullish: { color: "var(--bullish)", Icon: TrendingUp, bg: "rgba(34, 197, 94, 0.1)" },
  Bearish: { color: "var(--bearish)", Icon: TrendingDown, bg: "rgba(239, 68, 68, 0.1)" },
  Neutral: { color: "var(--neutral)", Icon: Minus, bg: "rgba(250, 204, 21, 0.1)" },
};

export default function AnalysisCard({ icon: Icon, label, value, sub, accent, bias, sections }) {
  const biasCfg = bias ? BIAS_CONFIG[bias] : null;

  if (sections && sections.length > 0) {
    return (
      <div 
        className="card flex flex-col gap-3 animate-slide-up hover:border-white/10 transition-colors duration-200"
        style={accent ? { borderLeft: `4px solid ${accent}` } : {}}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: accent ? `${accent}22` : "#6c63ff22" }}
              >
                <Icon size={14} style={{ color: accent || "#6c63ff" }} />
              </div>
            )}
            <span className="label">{label}</span>
          </div>
          {biasCfg && (
            <div 
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ color: biasCfg.color, backgroundColor: biasCfg.bg }}
            >
              <biasCfg.Icon size={10} />
              {bias}
            </div>
          )}
        </div>

        {sections.map((section, idx) => (
          <div key={section.title || `section-${idx}`} className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
              {section.icon && <section.icon size={10} />}
              {section.title}
            </div>
            <p className="text-xs text-main">{DOMPurify.sanitize(section.content)}</p>
            {section.sub && <p className="text-[10px] text-muted">{DOMPurify.sanitize(section.sub)}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="card flex flex-col gap-2 animate-slide-up hover:border-white/10 transition-colors duration-200"
      style={accent ? { borderLeft: `4px solid ${accent}` } : {}}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: accent ? `${accent}22` : "#6c63ff22" }}
            >
              <Icon size={14} style={{ color: accent || "#6c63ff" }} />
            </div>
          )}
          <span className="label">{label}</span>
        </div>
        {biasCfg && (
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ color: biasCfg.color, backgroundColor: biasCfg.bg }}
          >
            <biasCfg.Icon size={10} />
            {bias}
          </div>
        )}
      </div>
      <p className="text-xs text-main font-semibold leading-snug">{value ?? "—"}</p>
      {sub && <p className="text-[10px] text-muted leading-relaxed">{sub}</p>}
    </div>
  );
}
