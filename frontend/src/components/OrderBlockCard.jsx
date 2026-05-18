import { Target, Shield, ArrowRight, Gauge, Layers, Info } from "lucide-react";

const QUALITY_COLORS = {
  Premium: { text: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.2)" },
  Standard: { text: "#eab308", bg: "rgba(234, 179, 8, 0.1)", border: "rgba(234, 179, 8, 0.2)" },
  Weak: { text: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)" },
};

const STATUS_COLORS = {
  Fresh: { text: "#6366f1", bg: "rgba(99, 102, 241, 0.1)" },
  Tested: { text: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
  Mitigated: { text: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" },
};

export default function OrderBlockCard({ ob }) {
  const quality = QUALITY_COLORS[ob.quality] || QUALITY_COLORS.Standard;
  const status = STATUS_COLORS[ob.status] || STATUS_COLORS.Fresh;
  const isBullish = ob.type === "Bullish";

  return (
    <div className="card border-l-4 overflow-hidden relative group transition-all duration-300 hover:shadow-xl hover:shadow-accent/5"
         style={{ borderLeftColor: isBullish ? "var(--bullish)" : "var(--bearish)" }}>
      
      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[80px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-30`}
           style={{ backgroundColor: isBullish ? "var(--bullish)" : "var(--bearish)" }} />

      <div className="flex flex-col gap-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
                 style={{ backgroundColor: isBullish ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)" }}>
              <Layers size={20} style={{ color: isBullish ? "var(--bullish)" : "var(--bearish)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-main">{ob.type} Order Block</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted font-mono uppercase tracking-wider">{ob.timeframe}</span>
              </div>
              <p className="text-xs text-muted font-mono">{ob.zone}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                  style={{ color: quality.text, backgroundColor: quality.bg, borderColor: quality.border }}>
              {ob.quality}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: status.text, backgroundColor: status.bg }}>
              {ob.status}
            </span>
          </div>
        </div>

        {/* Strategy Details */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-2/50 p-2.5 rounded-xl border border-white/5 group/item hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-1.5 mb-1 text-muted">
              <Target size={12} className="group-hover/item:text-accent transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Entry Limit</span>
            </div>
            <p className="text-sm font-bold text-main font-mono">{ob.entry}</p>
          </div>
          <div className="bg-surface-2/50 p-2.5 rounded-xl border border-white/5 group/item hover:border-bearish/30 transition-colors">
            <div className="flex items-center gap-1.5 mb-1 text-muted">
              <Shield size={12} className="group-hover/item:text-bearish transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Stop Loss</span>
            </div>
            <p className="text-sm font-bold text-main font-mono">{ob.stop_loss}</p>
          </div>
          <div className="bg-surface-2/50 p-2.5 rounded-xl border border-white/5 group/item hover:border-bullish/30 transition-colors">
            <div className="flex items-center gap-1.5 mb-1 text-muted">
              <ArrowRight size={12} className="group-hover/item:text-bullish transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Target</span>
            </div>
            <p className="text-sm font-bold text-main font-mono">{ob.target}</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Gauge size={12} className="text-accent" />
              <span className="text-xs font-bold text-accent">R:R {ob.rr}</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Info size={12} className="text-muted flex-shrink-0" />
              <p className="text-[10px] text-muted truncate italic">"{ob.description}"</p>
            </div>
          </div>
        </div>
        
        {/* Confluences */}
        {ob.confluence && ob.confluence.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ob.confluence.map((c, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-md bg-accent/5 text-accent/80 border border-accent/10 font-medium">
                # {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
