import { Layers, TrendingUp, TrendingDown, Minus, Target, Zap, Activity, AlertTriangle } from "lucide-react";
import DOMPurify from "dompurify";

const BIAS_CONFIG = {
  Bullish: { chipClass: "chip-bullish", Icon: TrendingUp },
  Bearish: { chipClass: "chip-bearish", Icon: TrendingDown },
  Neutral: { chipClass: "chip-neutral", Icon: Minus },
};

function SectionLabel({ Icon, children }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={11} style={{ color: "var(--accent)" }} />
      <span className="label">{children}</span>
    </div>
  );
}

export default function HTFCard({ data }) {
  if (!data) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="icon-tile icon-tile-accent">
            <Layers size={15} />
          </div>
          <span className="label">HTF Bias</span>
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>No HTF data available</p>
      </div>
    );
  }

  const biasCfg = BIAS_CONFIG[data.trend?.direction] || BIAS_CONFIG.Neutral;
  const inducement = data.inducement;

  // Convert a value to a display string, handling objects and arrays
  const toDisplayString = (val) => {
    if (val == null) return "—";
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.map(toDisplayString).join(", ");
    if (typeof val === 'object') return val.price || val.range || val.name || val.level || JSON.stringify(val);
    return String(val);
  };

  const sweptPools = Array.isArray(data.liquidity?.swept_pools) 
    ? data.liquidity.swept_pools.map(toDisplayString).join(", ") 
    : (data.liquidity?.swept_pools ? toDisplayString(data.liquidity.swept_pools) : "None");
  const untouchedTargets = Array.isArray(data.liquidity?.untouched_targets) 
    ? data.liquidity.untouched_targets.map(toDisplayString).join(", ") 
    : (data.liquidity?.untouched_targets ? toDisplayString(data.liquidity.untouched_targets) : "None");

  return (
    <div className="analysis-context-card card flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="card-header !mb-0">
          <div className="icon-tile icon-tile-accent">
            <Layers size={15} />
          </div>
          <span className="label">HTF Bias</span>
        </div>
        {biasCfg && (
          <div
            className={`badge uppercase tracking-wider ${biasCfg.chipClass}`}
            style={{ fontSize: "10px", fontWeight: 700 }}
          >
            <biasCfg.Icon size={10} />
            {data.trend?.direction || "Neutral"}
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* HTF TREND DIRECTION */}
      <div className="space-y-1">
        <SectionLabel Icon={TrendingUp}>HTF Trend Direction</SectionLabel>
        <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
          <span style={{ color: "var(--muted)" }}>Trend:</span>{" "}
          <span className="font-semibold">{DOMPurify.sanitize(data.trend?.direction || "—")}</span>
          {" • "}
          <span style={{ color: "var(--muted)" }}>Valuation:</span>{" "}
          <span className="font-semibold">{DOMPurify.sanitize(data.trend?.valuation || "—")}</span>
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          BOS/CHoCH: {DOMPurify.sanitize(data.trend?.structure_details || "—")}
        </p>
      </div>

      <hr className="divider" />

      {/* HTF ORDER BLOCK */}
      <div className="space-y-1">
        <SectionLabel Icon={Target}>HTF Order Block</SectionLabel>
        <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
          <span style={{ color: "var(--muted)" }}>Zone:</span>{" "}
          <span className="font-semibold mono">{DOMPurify.sanitize(data.order_block?.range_high ? `${data.order_block.range_low || '?'} – ${data.order_block.range_high}` : data.order_block?.range_low || "—")}</span>
          {" • "}
          <span style={{ color: "var(--muted)" }}>Status:</span>{" "}
          <span className="font-semibold">{DOMPurify.sanitize(data.order_block?.status || "—")}</span>
          {" • "}
          <span style={{ color: "var(--muted)" }}>Quality:</span>{" "}
          <span className="font-semibold">{DOMPurify.sanitize(data.order_block?.quality || "—")}</span>
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          {DOMPurify.sanitize(data.order_block?.displacement_move || "—")}
        </p>
      </div>

      <hr className="divider" />

      {/* HTF FVG */}
      <div className="space-y-1">
        <SectionLabel Icon={Zap}>HTF FVG</SectionLabel>
        <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
          <span style={{ color: "var(--muted)" }}>Above:</span>{" "}
          <span className="font-semibold mono">{DOMPurify.sanitize(toDisplayString(data.fvg?.nearest_above))}</span>
          {" • "}
          <span style={{ color: "var(--muted)" }}>Below:</span>{" "}
          <span className="font-semibold mono">{DOMPurify.sanitize(toDisplayString(data.fvg?.nearest_below))}</span>
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          Fill: {DOMPurify.sanitize(data.fvg?.fill_probability || "—")} • 
          {data.fvg?.likely_to_fill_before_continuation ? " Likely to fill before continuation" : " Unlikely to fill"}
        </p>
      </div>

      <hr className="divider" />

      {/* HTF LIQUIDITY */}
      <div className="space-y-1">
        <SectionLabel Icon={Activity}>HTF Liquidity</SectionLabel>
        <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
          <span style={{ color: "var(--muted)" }}>BSL:</span>{" "}
          <span className="font-semibold mono tone-bearish">{DOMPurify.sanitize(data.liquidity?.bsl_location || "—")}</span>
          {" • "}
          <span style={{ color: "var(--muted)" }}>SSL:</span>{" "}
          <span className="font-semibold mono tone-bullish">{DOMPurify.sanitize(data.liquidity?.ssl_location || "—")}</span>
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          Swept: {DOMPurify.sanitize(sweptPools)} • 
          Targets: {DOMPurify.sanitize(untouchedTargets)}
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          Next target: <span className="mono">{DOMPurify.sanitize(toDisplayString(data.liquidity?.next_likely_target || data.liquidity?.next_target))}</span>
        </p>
      </div>

      <hr className="divider" />

      {/* HTF MARKET STRUCTURE */}
      <div className="space-y-1">
        <SectionLabel Icon={Activity}>HTF Market Structure</SectionLabel>
        <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
          <span style={{ color: "var(--muted)" }}>Last Event:</span>{" "}
          <span className="font-semibold">{DOMPurify.sanitize(data.market_structure?.last_event || "—")}</span>
          {" • "}
          <span style={{ color: "var(--muted)" }}>Price:</span>{" "}
          <span className="font-semibold mono">{DOMPurify.sanitize(data.market_structure?.event_price || "—")}</span>
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          {DOMPurify.sanitize(data.market_structure?.implication || "—")}
        </p>
      </div>

      {/* HTF INDUCEMENT */}
      {inducement?.present && (
        <div
          className="mt-2 p-2.5 rounded-lg"
          style={{ background: "var(--bearish-glow)", border: "1px solid rgba(242, 54, 69, 0.25)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={11} style={{ color: "var(--bearish)" }} />
            <span className="label" style={{ color: "var(--bearish)" }}>HTF Inducement Detected</span>
          </div>
          <p className="text-[13px]" style={{ color: "var(--bearish)" }}>
            {DOMPurify.sanitize(inducement.flag_message || `Inducement at ${inducement.location} — direction: ${inducement.direction_of_fake_move || "—"}, expected real move: ${inducement.expected_real_move || "—"}`)}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
            Swept: {inducement.is_swept ? "Yes" : "No"} | Location: {DOMPurify.sanitize(inducement.location || "—")}
          </p>
        </div>
      )}
    </div>
  );
}
