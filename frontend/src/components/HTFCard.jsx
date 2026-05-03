import { Layers, TrendingUp, TrendingDown, Minus, Target, Zap, Activity, AlertTriangle } from "lucide-react";

const BIAS_CONFIG = {
  Bullish: { color: "var(--bullish)", Icon: TrendingUp, bg: "rgba(34, 197, 94, 0.1)" },
  Bearish: { color: "var(--bearish)", Icon: TrendingDown, bg: "rgba(239, 68, 68, 0.1)" },
  Neutral: { color: "var(--neutral)", Icon: Minus, bg: "rgba(250, 204, 21, 0.1)" },
};

export default function HTFCard({ data }) {
  if (!data) {
    return (
      <div className="card border-l-4 border-[#6c63ff]">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={14} className="text-[#6c63ff]" />
          <span className="label">HTF Bias</span>
        </div>
        <p className="text-muted text-sm">No HTF data available</p>
      </div>
    );
  }

  const biasCfg = BIAS_CONFIG[data.trend?.direction] || BIAS_CONFIG.Neutral;
  const inducement = data.inducement;

  return (
    <div className="card border-l-4 border-[#6c63ff] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-[#6c63ff]" />
          <span className="label">HTF Bias</span>
        </div>
        {biasCfg && (
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ color: biasCfg.color, backgroundColor: biasCfg.bg }}
          >
            <biasCfg.Icon size={10} />
            {data.trend?.direction || "Neutral"}
          </div>
        )}
      </div>

      {/* HTF TREND DIRECTION */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <TrendingUp size={10} /> HTF TREND DIRECTION
        </div>
        <p className="text-xs text-main">
          <span className="text-[#6c63ff] font-semibold">Trend:</span> {data.trend?.direction || "—"} • 
          <span className="text-[#6c63ff] font-semibold"> Valuation:</span> {data.trend?.valuation || "—"}
        </p>
        <p className="text-xs text-muted">BOS/CHoCH: {data.trend?.structure_details || "—"}</p>
      </div>

      {/* HTF ORDER BLOCK */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Target size={10} /> HTF ORDER BLOCK
        </div>
        <p className="text-xs text-main">
          <span className="text-[#6c63ff] font-semibold">Zone:</span> {data.order_block?.range || "—"} • 
          <span className="text-[#6c63ff] font-semibold"> Status:</span> {data.order_block?.status || "—"} • 
          <span className="text-[#6c63ff] font-semibold"> Quality:</span> {data.order_block?.quality || "—"}
        </p>
        <p className="text-xs text-muted">{data.order_block?.displacement_move || "—"}</p>
      </div>

      {/* HTF FVG */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Zap size={10} /> HTF FVG
        </div>
        <p className="text-xs text-main">
          <span className="text-[#6c63ff] font-semibold">Above:</span> {data.fvg?.nearest_above || "—"} • 
          <span className="text-[#6c63ff] font-semibold"> Below:</span> {data.fvg?.nearest_below || "—"}
        </p>
        <p className="text-xs text-muted">
          Fill: {data.fvg?.fill_probability || "—"} • 
          {data.fvg?.likely_to_fill_before_continuation ? " Likely to fill before continuation" : " Unlikely to fill"}
        </p>
      </div>

      {/* HTF LIQUIDITY */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Activity size={10} /> HTF LIQUIDITY
        </div>
        <p className="text-xs text-main">
          <span className="text-bearish font-semibold">BSL:</span> {data.liquidity?.bsl_location || "—"} • 
          <span className="text-bullish font-semibold">SSL:</span> {data.liquidity?.ssl_location || "—"}
        </p>
        <p className="text-xs text-muted">
          Swept: {data.liquidity?.swept_pools?.join(", ") || "None"} • 
          Targets: {data.liquidity?.untouched_targets?.join(", ") || "None"}
        </p>
        <p className="text-xs text-muted">Next target: {data.liquidity?.next_target || "—"}</p>
      </div>

      {/* HTF MARKET PHASE */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Activity size={10} /> HTF MARKET PHASE
        </div>
        <p className="text-xs text-main">
          <span className="text-[#6c63ff] font-semibold">Phase:</span> {data.market_phase?.phase || "—"} • 
          <span className="text-[#6c63ff] font-semibold"> Range:</span> {data.market_phase?.dealing_range_percent || "—"}
        </p>
        <p className="text-xs text-muted">{data.market_phase?.implication || "—"}</p>
      </div>

      {/* HTF INDUCEMENT */}
      {inducement?.present && (
        <div className="mt-2 p-2 rounded-lg bg-bearish/10 border border-bearish/30">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-bearish uppercase tracking-wider mb-1">
            <AlertTriangle size={10} /> ⚠ HTF INDUCEMENT DETECTED
          </div>
          <p className="text-xs text-bearish">
            {inducement.flag_message || `Inducement at ${inducement.trap_location} — retail trapped ${inducement.direction} before real move ${inducement.real_move_direction}`}
          </p>
          <p className="text-[10px] text-muted mt-1">
            Type: {inducement.trap_type} | Location: {inducement.trap_location}
          </p>
        </div>
      )}
    </div>
  );
}