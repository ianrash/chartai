import { Layers, TrendingUp, TrendingDown, Minus, Target, Zap, Activity, AlertTriangle } from "lucide-react";
import DOMPurify from "dompurify";

const BIAS_CONFIG = {
  Bullish: { color: "var(--bullish)", Icon: TrendingUp, bg: "rgba(34, 197, 94, 0.1)" },
  Bearish: { color: "var(--bearish)", Icon: TrendingDown, bg: "rgba(239, 68, 68, 0.1)" },
  Neutral: { color: "var(--neutral)", Icon: Minus, bg: "rgba(250, 204, 21, 0.1)" },
};

const safe = (val, fallback = "—") =>
  val && val !== "undefined" && val !== "null" ? DOMPurify.sanitize(String(val)) : fallback;

export default function HTFCard({ data }) {
  if (!data) {
    return (
      <div className="card border-l-4 border-[#6c63ff]">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={14} className="text-[#6c63ff]" />
          <span className="label text-[10px] sm:text-xs">HTF Bias</span>
        </div>
        <p className="text-muted text-xs sm:text-sm">No HTF data available</p>
      </div>
    );
  }

  const biasCfg = BIAS_CONFIG[data.trend?.direction] || BIAS_CONFIG.Neutral;
  const inducement = data.inducement;

  // Liquidity — support both old (next_target) and new (next_likely_target) field names
  const sweptPools = Array.isArray(data.liquidity?.swept_pools)
    ? data.liquidity.swept_pools.join(", ") || "None"
    : "None";
  const untouchedTargets = Array.isArray(data.liquidity?.untouched_targets)
    ? data.liquidity.untouched_targets.join(", ") || "None"
    : "None";
  const nextTarget = data.liquidity?.next_likely_target || data.liquidity?.next_target;

  // Order block — support both old (range) and new (range_high / range_low) field names
  const obRange =
    data.order_block?.range ||
    (data.order_block?.range_high && data.order_block?.range_low
      ? `${data.order_block.range_low}–${data.order_block.range_high}`
      : null);

  // Dealing range — support both old (market_phase) and new (trend.dealing_range) locations
  const dealingRangePercent =
    data.market_phase?.dealing_range_percent ||
    data.trend?.dealing_range?.current_price_percent;
  const marketPhase = data.market_phase?.phase;
  const marketImplication = data.market_phase?.implication;

  // HTF inducement — support both old field names (trap_location, direction, real_move_direction)
  // and new field names (location, direction_of_fake_move, expected_real_move)
  const buildInducementMessage = (ind) => {
    const location =
      ind.location || ind.trap_location
        ? `at ${ind.location || ind.trap_location}`
        : "";
    const fakeDir =
      ind.direction_of_fake_move || ind.direction
        ? ` — retail trapped ${ind.direction_of_fake_move || ind.direction}`
        : "";
    const realDir =
      ind.expected_real_move || ind.real_move_direction
        ? ` before real move ${ind.expected_real_move || ind.real_move_direction}`
        : "";
    return `Inducement ${location}${fakeDir}${realDir}`.trim() || "Inducement detected";
  };

  const inducementType = inducement?.trap_type;
  const inducementLocation = inducement?.location || inducement?.trap_location;

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
            {safe(data.trend?.direction, "Neutral")}
          </div>
        )}
      </div>

      {/* HTF TREND DIRECTION */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <TrendingUp size={10} /> HTF TREND DIRECTION
        </div>
        <p className="text-xs text-main">
          <span className="text-[#6c63ff] font-semibold">Trend:</span> {safe(data.trend?.direction)} •{" "}
          <span className="text-[#6c63ff] font-semibold">Valuation:</span> {safe(data.trend?.valuation)}
        </p>
        <p className="text-xs text-muted">BOS/CHoCH: {safe(data.trend?.structure_details)}</p>
        {/* Dealing range inline if market_phase is absent */}
        {data.trend?.dealing_range && (
          <p className="text-xs text-muted">
            Range: {safe(data.trend.dealing_range.swing_low)} – {safe(data.trend.dealing_range.swing_high)} •{" "}
            Position: {safe(data.trend.dealing_range.current_price_percent)}
          </p>
        )}
      </div>

      {/* HTF ORDER BLOCK */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Target size={10} /> HTF ORDER BLOCK
        </div>
        <p className="text-xs text-main">
          <span className="text-[#6c63ff] font-semibold">Zone:</span> {safe(obRange)} •{" "}
          <span className="text-[#6c63ff] font-semibold">Status:</span> {safe(data.order_block?.status)} •{" "}
          <span className="text-[#6c63ff] font-semibold">Quality:</span> {safe(data.order_block?.quality)}
        </p>
        <p className="text-xs text-muted">{safe(data.order_block?.displacement_move)}</p>
      </div>

      {/* HTF FVG */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Zap size={10} /> HTF FVG
        </div>
        <p className="text-xs text-main">
          <span className="text-[#6c63ff] font-semibold">Above:</span> {safe(data.fvg?.nearest_above)} •{" "}
          <span className="text-[#6c63ff] font-semibold">Below:</span> {safe(data.fvg?.nearest_below)}
        </p>
        <p className="text-xs text-muted">
          Fill: {safe(data.fvg?.fill_probability)} •{" "}
          {data.fvg?.likely_to_fill_before_continuation
            ? "Likely to fill before continuation"
            : "Unlikely to fill"}
        </p>
      </div>

      {/* HTF LIQUIDITY */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Activity size={10} /> HTF LIQUIDITY
        </div>
        <p className="text-xs text-main">
          <span className="text-bearish font-semibold">BSL:</span> {safe(data.liquidity?.bsl_location)} •{" "}
          <span className="text-bullish font-semibold">SSL:</span> {safe(data.liquidity?.ssl_location)}
        </p>
        <p className="text-xs text-muted">
          Swept: {safe(sweptPools)} • Targets: {safe(untouchedTargets)}
        </p>
        <p className="text-xs text-muted">Next target: {safe(nextTarget)}</p>
      </div>

      {/* HTF MARKET PHASE — only show if data exists */}
      {(marketPhase || dealingRangePercent || marketImplication) && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
            <Activity size={10} /> HTF MARKET PHASE
          </div>
          <p className="text-xs text-main">
            <span className="text-[#6c63ff] font-semibold">Phase:</span> {safe(marketPhase)} •{" "}
            <span className="text-[#6c63ff] font-semibold">Range:</span> {safe(dealingRangePercent)}
          </p>
          <p className="text-xs text-muted">{safe(marketImplication)}</p>
        </div>
      )}

      {/* HTF MARKET STRUCTURE — new prompt field */}
      {data.market_structure && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
            <Activity size={10} /> HTF MARKET STRUCTURE
          </div>
          <p className="text-xs text-main">
            <span className="text-[#6c63ff] font-semibold">Last event:</span>{" "}
            {safe(data.market_structure?.last_event)} at {safe(data.market_structure?.event_price)}
          </p>
          <p className="text-xs text-muted">{safe(data.market_structure?.implication)}</p>
        </div>
      )}

      {/* HTF INDUCEMENT */}
      {inducement?.present && (
        <div className="mt-2 p-2 rounded-lg bg-bearish/10 border border-bearish/30">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-bearish uppercase tracking-wider mb-1">
            <AlertTriangle size={10} /> ⚠ HTF INDUCEMENT DETECTED
          </div>
          {/* FIXED: never interpolates undefined fields directly */}
          <p className="text-xs text-bearish">
            {safe(inducement.flag_message) !== "—"
              ? safe(inducement.flag_message)
              : buildInducementMessage(inducement)}
          </p>
          {(inducementType || inducementLocation) && (
            <p className="text-[10px] text-muted mt-1">
              {inducementType && <>Type: {safe(inducementType)}</>}
              {inducementType && inducementLocation && " | "}
              {inducementLocation && <>Location: {safe(inducementLocation)}</>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}