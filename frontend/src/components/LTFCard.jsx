import { ShieldAlert, TrendingUp, TrendingDown, Minus, Target, Zap, Activity, AlertTriangle, Clock } from "lucide-react";
import DOMPurify from "dompurify";

const BULLISH_COLOR = "#22c55e";
const BEARISH_COLOR = "#ef4444";
const NEUTRAL_COLOR = "#facc15";

const safe = (val, fallback = "—") =>
  val && val !== "undefined" && val !== "null" ? DOMPurify.sanitize(String(val)) : fallback;

export default function LTFCard({ data, htfDirection }) {
  if (!data || data.status === "not_applicable") {
    return (
      <div className="card border-l-4 border-[#a855f7]">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert size={14} className="text-[#a855f7]" />
          <span className="label text-[10px] sm:text-xs">Ltf Confirmation</span>
        </div>
        <p className="text-muted text-xs sm:text-sm">
          {data?.reason || "No LTF data available"}
        </p>
      </div>
    );
  }

  const isConfirming = data.trend?.confirmation === "Confirms HTF";
  const htfIsBearish = htfDirection === "Bearish" || (typeof htfDirection === "string" && htfDirection.toLowerCase().includes("bearish"));
  const htfIsBullish = htfDirection === "Bullish" || (typeof htfDirection === "string" && htfDirection.toLowerCase().includes("bullish"));

  let confirmationColor = NEUTRAL_COLOR;
  let confirmationBg = "rgba(250, 204, 21, 0.1)";
  let confirmationIcon = Minus;

  if (isConfirming) {
    if (htfIsBearish) {
      confirmationColor = BEARISH_COLOR;
      confirmationBg = "rgba(239, 68, 68, 0.15)";
      confirmationIcon = TrendingDown;
    } else if (htfIsBullish) {
      confirmationColor = BULLISH_COLOR;
      confirmationBg = "rgba(34, 197, 94, 0.15)";
      confirmationIcon = TrendingUp;
    }
  } else if (data.trend?.confirmation?.toLowerCase().includes("conflict")) {
    confirmationColor = NEUTRAL_COLOR;
    confirmationBg = "rgba(250, 204, 21, 0.15)";
    confirmationIcon = AlertTriangle;
  }

  const inducement = data.inducement;
  const killZone = data.kill_zone;
  const openFvgs = Array.isArray(data.fvg?.open_fvgs) ? data.fvg.open_fvgs : [];

  // Build inducement message safely — no field ever prints as "undefined"
  const buildInducementMessage = (ind) => {
    const location = ind.lure_location ? `at ${ind.lure_location}` : "";
    const stops = ind.retail_stops_targeted_at ? ` — retail stops at ${ind.retail_stops_targeted_at}` : "";
    const direction = ind.target_direction_after_sweep ? ` — smart money targeting ${ind.target_direction_after_sweep}` : "";
    return `Inducement ${location}${stops}${direction}`.trim() || "Inducement detected";
  };

  // LTF OB: new prompt uses range_high/range_low, old used range — support both
  const obRange = data.order_block?.range ||
    (data.order_block?.range_high && data.order_block?.range_low
      ? `${data.order_block.range_low}–${data.order_block.range_high}`
      : null);

  // Displacement: new prompt uses candle_reference, old used strongest_candle — support both
  const displacementCandle = data.displacement?.candle_reference || data.displacement?.strongest_candle;
  const displacementNote = data.displacement?.created_structure
    ? `Created: ${data.displacement.created_structure}`
    : null;

  return (
    <div className="card border-l-4 border-[#a855f7] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-[#a855f7]" />
          <span className="label">Ltf Confirmation</span>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ color: confirmationColor, backgroundColor: confirmationBg }}
        >
          <confirmationIcon size={10} />
          {isConfirming
            ? "Confirming"
            : data.trend?.confirmation?.toLowerCase().includes("conflict")
            ? "Contradicting"
            : "Neutral"}
        </div>
      </div>

      {/* LTF TREND DIRECTION */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <TrendingUp size={10} /> LTF TREND DIRECTION
        </div>
        <p className="text-xs text-main">
          <span className="text-[#a855f7] font-semibold">Confirms:</span> {safe(data.trend?.confirmation)} •{" "}
          <span className="text-[#a855f7] font-semibold">Momentum:</span> {safe(data.trend?.momentum)}
        </p>
        {data.trend?.conflict_explanation && (
          <p className="text-xs text-yellow-400">⚠ {safe(data.trend.conflict_explanation)}</p>
        )}
        <p className="text-xs text-muted">Recent structure: {safe(data.trend?.recent_structure)}</p>
      </div>

      {/* LTF ORDER BLOCK */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Target size={10} /> LTF ORDER BLOCK
        </div>
        <p className="text-xs text-main">
          <span className="text-[#a855f7] font-semibold">Zone:</span> {safe(obRange)} •{" "}
          <span className="text-[#a855f7] font-semibold">Status:</span> {safe(data.order_block?.status)} •{" "}
          <span className="text-[#a855f7] font-semibold">Quality:</span> {safe(data.order_block?.quality)}
        </p>
        <p className="text-xs text-muted">
          <span className="text-[#a855f7] font-semibold">Entry Zone:</span>{" "}
          {safe(data.order_block?.limit_entry_zone)}
        </p>
        <p className="text-xs text-muted">Alignment: {safe(data.order_block?.alignment_with_htf)}</p>
      </div>

      {/* LTF FVG */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Zap size={10} /> LTF FVG
        </div>
        {openFvgs.length > 0 ? (
          openFvgs.map((fvg, idx) => (
            <p key={`${fvg?.position}-${idx}`} className="text-xs text-main">
              <span className="text-[#a855f7] font-semibold">{safe(fvg?.position)}:</span>{" "}
              {safe(fvg?.range)}
            </p>
          ))
        ) : (
          <p className="text-xs text-muted">No open FVGs</p>
        )}
        <p className="text-xs text-muted">
          Fill before entry: {data.fvg?.fill_likely_before_entry ?? data.fvg?.likely_to_fill_before_entry ? "Yes" : "No"} •{" "}
          Role: {safe(data.fvg?.role)}
        </p>
      </div>

      {/* LTF DISPLACEMENT */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
          <Activity size={10} /> LTF DISPLACEMENT
        </div>
        <p className="text-xs text-main">
          <span className="text-[#a855f7] font-semibold">Strongest candle:</span>{" "}
          {safe(displacementCandle)}
        </p>
        <p className="text-xs text-muted">{safe(data.displacement?.implication)}</p>
        {displacementNote && <p className="text-xs text-muted">{safe(displacementNote)}</p>}
      </div>

      {/* LTF KILL ZONE */}
      {killZone?.is_active && (
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/30">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
            <Clock size={10} /> KILL ZONE ACTIVE
          </div>
          <p className="text-xs text-main">
            <span className="text-accent font-semibold">{safe(killZone.name)}</span> • Probability:{" "}
            {safe(killZone.probability)}
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
                {safe(
                  inducement.warning ||
                  inducement.not_swept_warning ||
                  (inducement.lure_location
                    ? `⚠ Inducement not yet swept at ${inducement.lure_location} — wait for sweep before entering`
                    : "⚠ Inducement not yet swept — wait before entering")
                )}
              </p>
            </div>
          )}

          {/* FIXED: never interpolates undefined fields directly */}
          <p className="text-xs text-bearish">
            {safe(inducement.flag_message) !== "—"
              ? safe(inducement.flag_message)
              : buildInducementMessage(inducement)}
          </p>

          <div className="mt-2 space-y-1">
            <p className="text-[10px] text-muted">
              Stop hunt wick: {inducement.stop_hunt_wick ? "Yes" : "No"} •{" "}
              EQH/EQL: {inducement.eqh_eql_present ? "Yes" : "No"} •{" "}
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