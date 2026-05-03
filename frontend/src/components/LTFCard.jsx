import { ShieldAlert, TrendingUp, TrendingDown, Minus, Target, Zap, Activity, AlertTriangle, Clock } from "lucide-react";

const BIAS_CONFIG = {
  Bullish: { color: "var(--bullish)", Icon: TrendingUp, bg: "rgba(34, 197, 94, 0.1)" },
  Bearish: { color: "var(--bearish)", Icon: TrendingDown, bg: "rgba(239, 68, 68, 0.1)" },
  Neutral: { color: "var(--neutral)", Icon: Minus, bg: "rgba(250, 204, 21, 0.1)" },
};

export default function LTFCard({ data }) {
  if (!data) {
    return (
      <div className="card border-l-4 border-[#a855f7]">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert size={14} className="text-[#a855f7]" />
          <span className="label">LTF Confirmation</span>
        </div>
        <p className="text-muted text-sm">No LTF data available</p>
      </div>
    );
  }

  const biasCfg = BIAS_CONFIG[data.trend?.confirmation === "Confirms HTF" ? "Bullish" : data.trend?.confirmation === "Contradicts HTF" ? "Bearish" : "Neutral"];
  const inducement = data.inducement;
  const killZone = data.kill_zone;

  return (
    <div className="card border-l-4 border-[#a855f7] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-[#a855f7]" />
          <span className="label">LTF Confirmation</span>
        </div>
        {biasCfg && (
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ color: biasCfg.color, backgroundColor: biasCfg.bg }}
          >
            <biasCfg.Icon size={10} />
            {data.trend?.confirmation === "Confirms HTF" ? "Confirming" : data.trend?.confirmation === "Contradicts HTF" ? "Contradicting" : "Neutral"}
          </div>
        )}
      </div>

      {/* LTF TREND DIRECTION */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <TrendingUp size={10} /> LTF TREND DIRECTION
        </div>
        <p className="text-xs text-main">
          <span className="text-[#a855f7] font-semibold">Confirms:</span> {data.trend?.confirmation || "—"} • 
          <span className="text-[#a855f7] font-semibold"> Momentum:</span> {data.trend?.momentum || "—"}
        </p>
        <p className="text-xs text-muted">Recent structure: {data.trend?.recent_structure || "—"}</p>
      </div>

      {/* LTF ORDER BLOCK */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Target size={10} /> LTF ORDER BLOCK
        </div>
        <p className="text-xs text-main">
          <span className="text-[#a855f7] font-semibold">Zone:</span> {data.order_block?.range || "—"} • 
          <span className="text-[#a855f7] font-semibold"> Status:</span> {data.order_block?.status || "—"} • 
          <span className="text-[#a855f7] font-semibold"> Quality:</span> {data.order_block?.quality || "—"}
        </p>
        <p className="text-xs text-muted">
          <span className="text-[#a855f7] font-semibold">Entry Zone:</span> {data.order_block?.limit_entry_zone || "—"}
        </p>
        <p className="text-xs text-muted">Alignment: {data.order_block?.alignment_with_htf || "—"}</p>
      </div>

      {/* LTF FVG */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Zap size={10} /> LTF FVG
        </div>
        {data.fvg?.open_fvgs?.length > 0 ? (
          data.fvg.open_fvgs.map((fvg, idx) => (
            <p key={idx} className="text-xs text-main">
              <span className="text-[#a855f7] font-semibold">{fvg.position}:</span> {fvg.range}
            </p>
          ))
        ) : (
          <p className="text-xs text-muted">No open FVGs</p>
        )}
        <p className="text-xs text-muted">
          Fill before entry: {data.fvg?.likely_to_fill_before_entry ? "Yes" : "No"} • 
          Role: {data.fvg?.role || "—"}
        </p>
      </div>

      {/* LTF DISPLACEMENT */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Activity size={10} /> LTF DISPLACEMENT
        </div>
        <p className="text-xs text-main">
          <span className="text-[#a855f7] font-semibold">Strongest candle:</span> {data.displacement?.strongest_candle || "—"}
        </p>
        <p className="text-xs text-muted">{data.displacement?.implication || "—"}</p>
        <p className="text-xs text-muted">Created: {data.displacement?.created_structure || "—"}</p>
      </div>

      {/* LTF KILL ZONE */}
      {killZone?.is_active && (
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/30">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
            <Clock size={10} /> KILL ZONE ACTIVE
          </div>
          <p className="text-xs text-main">
            <span className="text-accent font-semibold">{killZone.name}</span> • Probability: {killZone.probability}
          </p>
        </div>
      )}

      {/* LTF INDUCEMENT */}
      {inducement?.present && (
        <div className="mt-2 p-2 rounded-lg bg-bearish/10 border border-bearish/30">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-bearish uppercase tracking-wider mb-1">
            <AlertTriangle size={10} /> ⚠ LTF INDUCEMENT DETECTED
          </div>
          
          {!inducement.is_swept && (
            <div className="mb-2 p-1.5 rounded bg-yellow-500/20 border border-yellow-500/40">
              <p className="text-[10px] text-yellow-400 font-semibold">
                {inducement.not_swept_warning || `⚠ Inducement not yet swept at ${inducement.lure_location} — wait for sweep before entering`}
              </p>
            </div>
          )}
          
          <p className="text-xs text-bearish">
            {inducement.flag_message || `Inducement at ${inducement.lure_location} — retail stops at ${inducement.retail_stops_at} — smart money to sweep before ${inducement.target_direction}`}
          </p>
          
          <div className="mt-2 space-y-1">
            <p className="text-[10px] text-muted">
              Stop hunt wick: {inducement.stop_hunt_wick ? "Yes" : "No"} • 
              EQH/EQL: {inducement.eqh_eql_present ? "Yes" : "No"} • 
              Fake breakout: {inducement.fake_breakout ? "Yes" : "No"}
            </p>
            <p className="text-[10px] text-muted">
              Swept: {inducement.is_swept ? "Yes" : "No"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}