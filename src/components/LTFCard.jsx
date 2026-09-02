import { ShieldAlert, TrendingUp, TrendingDown, Minus, Target, Zap, Activity, AlertTriangle, Clock } from "lucide-react";
import DOMPurify from "dompurify";

const BULLISH_COLOR = "var(--bullish)";
const BEARISH_COLOR = "var(--bearish)";
const NEUTRAL_COLOR = "var(--neutral)";

const BULLISH_BG = "var(--bullish-glow)";
const BEARISH_BG = "var(--bearish-glow)";
const NEUTRAL_BG = "var(--neutral-glow)";

function SectionLabel({ Icon, children }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={11} style={{ color: "var(--accent)" }} />
      <span className="label">{children}</span>
    </div>
  );
}

export default function LTFCard({ data, htfDirection, killZoneActive }) {
  if (!data) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="icon-tile icon-tile-accent">
            <ShieldAlert size={15} />
          </div>
          <span className="label">LTF Confirmation</span>
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>No Ltf data available</p>
      </div>
    );
  }

  // Determine confirmation color based on HTF direction (highly robust & case-insensitive)
  const confirmationText = String(data.trend?.confirmation || '').toLowerCase();
  const isConfirming = confirmationText.includes("confirm") || confirmationText.includes("aligned");
  const isContradicting = confirmationText.includes("contradict") || confirmationText.includes("against") || confirmationText.includes("opposite");

  const htfIsBearish = htfDirection === "Bearish" || (typeof htfDirection === 'string' && htfDirection.toLowerCase().includes("bearish"));
  const htfIsBullish = htfDirection === "Bullish" || (typeof htfDirection === 'string' && htfDirection.toLowerCase().includes("bullish"));
  
  // If HTF is bearish and Ltf confirms = show red
  // If HTF is bullish and Ltf confirms = show green
  // If contradicting = show warning
  let confirmationColor = NEUTRAL_COLOR;
  let confirmationBg = NEUTRAL_BG;
  let ConfirmationIcon = Minus;
  
  if (isConfirming) {
    if (htfIsBearish) {
      confirmationColor = BEARISH_COLOR;
      confirmationBg = BEARISH_BG;
      ConfirmationIcon = TrendingDown;
    } else if (htfIsBullish) {
      confirmationColor = BULLISH_COLOR;
      confirmationBg = BULLISH_BG;
      ConfirmationIcon = TrendingUp;
    } else {
      // Default confirming indicator if HTF direction is not yet resolved
      confirmationColor = BULLISH_COLOR;
      confirmationBg = BULLISH_BG;
      ConfirmationIcon = TrendingUp;
    }
  } else if (isContradicting) {
    confirmationColor = NEUTRAL_COLOR;
    confirmationBg = NEUTRAL_BG;
    ConfirmationIcon = AlertTriangle;
  }

  const inducement = data.inducement;
  const openFvgs = Array.isArray(data.fvg?.open_fvgs) ? data.fvg.open_fvgs : [];

  return (
    <div className="analysis-context-card card flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="card-header !mb-0">
          <div className="icon-tile icon-tile-accent">
            <ShieldAlert size={15} />
          </div>
          <span className="label">LTF Confirmation</span>
        </div>
        <div
          className="badge uppercase tracking-wider"
          style={{ fontSize: "10px", fontWeight: 700, color: confirmationColor, background: confirmationBg }}
        >
          <ConfirmationIcon size={10} />
          {isConfirming ? "Confirming" : isContradicting ? "Contradicting" : "Neutral"}
        </div>
      </div>

      <hr className="divider" />

      {/* LTF TREND DIRECTION */}
      <div className="space-y-1">
        <SectionLabel Icon={TrendingUp}>LTF Trend Direction</SectionLabel>
        <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
          <span style={{ color: "var(--muted)" }}>Confirms:</span>{" "}
          <span className="font-semibold">{DOMPurify.sanitize(data.trend?.confirmation || "—")}</span>
          {" • "}
          <span style={{ color: "var(--muted)" }}>Momentum:</span>{" "}
          <span className="font-semibold">{DOMPurify.sanitize(data.trend?.momentum || "—")}</span>
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          Recent structure: {DOMPurify.sanitize(data.trend?.recent_structure || "—")}
        </p>
      </div>

      <hr className="divider" />

      {/* LTF ORDER BLOCK */}
      <div className="space-y-1">
        <SectionLabel Icon={Target}>LTF Order Block</SectionLabel>
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
          Entry Zone: <span className="mono">{DOMPurify.sanitize(data.order_block?.limit_entry_zone || "—")}</span>
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          Alignment: {DOMPurify.sanitize(data.order_block?.alignment_with_htf || "—")}
        </p>
      </div>

      <hr className="divider" />

      {/* LTF FVG */}
      <div className="space-y-1">
        <SectionLabel Icon={Zap}>LTF FVG</SectionLabel>
        {openFvgs.length > 0 ? (
          openFvgs.map((fvg, idx) => (
            <p key={`${fvg.position}-${idx}`} className="text-[13px]" style={{ color: "var(--text-main)" }}>
              <span style={{ color: "var(--muted)" }}>{DOMPurify.sanitize(fvg.position)}:</span>{" "}
              <span className="font-semibold mono">{DOMPurify.sanitize(fvg.range)}</span>
            </p>
          ))
        ) : (
          <p className="text-[13px]" style={{ color: "var(--muted)" }}>No open FVGs</p>
        )}
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          Fill before entry: {data.fvg?.fill_likely_before_entry ? "Yes" : "No"} • 
          Role: {DOMPurify.sanitize(data.fvg?.role || "—")}
        </p>
      </div>

      <hr className="divider" />

      {/* LTF DISPLACEMENT */}
      <div className="space-y-1">
        <SectionLabel Icon={Activity}>LTF Displacement</SectionLabel>
        <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
          <span style={{ color: "var(--muted)" }}>Strongest candle:</span>{" "}
          <span className="font-semibold">{DOMPurify.sanitize(data.displacement?.strongest_candle || "—")}</span>
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          {DOMPurify.sanitize(data.displacement?.implication || "—")}
        </p>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          Created: {DOMPurify.sanitize(data.displacement?.created_structure || "—")}
        </p>
      </div>

      {/* LTF KILL ZONE */}
      {killZoneActive?.active && (
        <div
          className="p-2.5 rounded-lg"
          style={{ background: "var(--neutral-glow)", border: "1px solid rgba(209, 163, 63, 0.25)" }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock size={11} style={{ color: "var(--neutral)" }} />
            <span className="label" style={{ color: "var(--neutral)" }}>Kill Zone Active</span>
          </div>
          <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
            <span className="font-semibold" style={{ color: "var(--neutral)" }}>{DOMPurify.sanitize(killZoneActive.name)}</span>
            {" • "}
            <span style={{ color: "var(--muted)" }}>Probability: {DOMPurify.sanitize(killZoneActive.probability_boost)}</span>
          </p>
        </div>
      )}

      {/* LTF INDUCEMENT */}
      {inducement?.present && (
        <div
          className="mt-2 p-2.5 rounded-lg"
          style={{ background: "var(--bearish-glow)", border: "1px solid rgba(242, 54, 69, 0.25)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={11} style={{ color: "var(--bearish)" }} />
            <span className="label" style={{ color: "var(--bearish)" }}>LTF Inducement Detected</span>
          </div>
          
          {!inducement.is_swept && (
            <div className="mb-2 p-1.5 rounded" style={{ background: "var(--neutral-glow)", border: "1px solid rgba(209, 163, 63, 0.3)" }}>
              <p className="text-[11px] font-semibold" style={{ color: "var(--neutral)" }}>
                {DOMPurify.sanitize(inducement.warning || `Inducement not yet swept at ${inducement.lure_location} — wait for sweep before entering`)}
              </p>
            </div>
          )}
          
          <p className="text-[13px]" style={{ color: "var(--bearish)" }}>
            {DOMPurify.sanitize(inducement.flag_message || `Inducement at ${inducement.lure_location} — retail stops at ${inducement.retail_stops_targeted_at} — smart money to sweep before ${inducement.target_direction_after_sweep}`)}
          </p>
          
          <div className="mt-2 space-y-1">
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              Stop hunt wick: {inducement.stop_hunt_wick ? "Yes" : "No"} • 
              EQH/EQL: {inducement.eqh_eql_present ? "Yes" : "No"} • 
              Fake breakout: {inducement.fake_breakout ? "Yes" : "No"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              Swept: {inducement.is_swept ? "Yes" : "No"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
