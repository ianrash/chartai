import { useMemo } from "react";
import { Save, AlertTriangle, Target, Zap, TrendingUp, TrendingDown, Clock, ShieldAlert, Copy, Activity, ShieldCheck, BarChart3 } from "lucide-react";
import DOMPurify from "dompurify";
import { calcRating, calculateAccountGuard } from "../api/tradeValidation";

const toLocaleSafe = (v) => {
  const n = Number(v);
  return isNaN(n) ? String(v) : n.toLocaleString();
};

const displayValue = (val) => {
  if (val == null || val === '...') return "—";
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return isNaN(val) ? "—" : val.toLocaleString();
  if (Array.isArray(val)) return val.map(displayValue).join(", ");
  if (typeof val === 'object') {
    if (val.range_high != null && val.range_low != null) {
      return `${toLocaleSafe(val.range_low)} – ${toLocaleSafe(val.range_high)}`;
    }
    if (val.price != null) return toLocaleSafe(val.price);
    if (val.range != null) return val.range;
    if (val.level != null) return val.level;
    return "—";
  }
  return String(val);
};

export default function TradeSetup({ trade, onSave, onCopy, confluenceChecklist, rating: propRating, alternative, accountBalance, riskPercent, instrument, symbol }) {
  if (!trade) return null;

  const isWait = trade.bias?.toUpperCase() === "WAIT";
  const isBuy = trade.bias?.toUpperCase() === "BUY";
  const { execution } = trade;
  const rating = propRating ?? trade.rating ?? calcRating(confluenceChecklist);

  // --- Reactive Account Guard Computation ---
  const accountGuard = useMemo(() => {
    if (!accountBalance || !riskPercent || !execution) return null;

    // Extract numeric prices from execution
    const parsePrice = (val) => {
      if (val == null) return NaN;
      if (typeof val === 'number') return val;
      const str = String(val).replace(/,/g, '').trim();
      const nums = str.match(/[\d]+\.?[\d]*/g);
      if (!nums || nums.length === 0) return NaN;
      const parsed = nums.map(parseFloat).filter(n => String(n).includes('.') || String(n).length >= 2);
      if (parsed.length === 0) return NaN;
      if (parsed.length === 1) return parsed[0];
      return (parsed[0] + parsed[1]) / 2;
    };

    const entry = parsePrice(execution.entry_zone || execution.entry);
    const stop = parsePrice(execution.stop);
    const target = parsePrice(execution.target);

    if (isNaN(entry) || isNaN(stop)) return null;

    return calculateAccountGuard({
      accountBalance,
      riskPercent,
      entry,
      stop,
      target: isNaN(target) ? undefined : target,
      isBuy,
      instrument: instrument || symbol || '',
    });
  }, [accountBalance, riskPercent, execution, isBuy, instrument, symbol]);

  const ratingColors = {
    "A+": { bg: "var(--bullish-glow)", border: "rgba(8, 153, 129, 0.4)", text: "var(--bullish)" },
    "A": { bg: "var(--accent-glow)", border: "rgba(41, 98, 255, 0.4)", text: "var(--accent)" },
    "B": { bg: "var(--neutral-glow)", border: "rgba(209, 163, 63, 0.4)", text: "var(--neutral)" },
    "C": { bg: "rgba(249, 115, 22, 0.15)", border: "rgba(249, 115, 22, 0.4)", text: "#f97316" },
    "F": { bg: "var(--bearish-glow)", border: "rgba(242, 54, 69, 0.4)", text: "var(--bearish)" },
  };
  const r = ratingColors[rating] || ratingColors.F;

  const accentColor = isWait ? "var(--neutral)" : isBuy ? "var(--bullish)" : "var(--bearish)";
  const accentGlow = isWait ? "var(--neutral-glow)" : isBuy ? "var(--bullish-glow)" : "var(--bearish-glow)";
  const BiasIcon = isBuy ? TrendingUp : isWait ? Clock : TrendingDown;

  return (
    <div className="card flex flex-col gap-2 sm:gap-4 animate-fade-in-up mt-2 sm:mt-4">
      {/* Header – compact row */}
      <div className="flex items-center justify-between gap-1 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="icon-tile shrink-0" style={{ background: accentGlow, color: accentColor }}>
            <BiasIcon size={17} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold truncate" style={{ color: "var(--text-main)" }}>
              {trade.label || "Trade Setup"}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
              <span className={`badge ${isWait ? "chip-neutral" : isBuy ? "chip-bullish" : "chip-bearish"}`}>
                {trade.bias}
              </span>
              <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{trade.status || "Awaiting"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Conviction badge */}
          <div className="flex flex-col items-end">
            <span className="label" style={{ fontSize: "9px" }}>Conviction</span>
            <span
              className="badge mono"
              style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.text }}
            >
              {rating}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onCopy && (
              <button onClick={() => onCopy(trade)} className="icon-btn w-8 h-8" title="Copy Setup">
                <Copy size={14} />
              </button>
            )}
            <button onClick={() => onSave(trade)} className="icon-btn w-8 h-8" title="Save Setup">
              <Save size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* Order-type explainer strip */}
        {execution?.order_type?.toUpperCase()?.includes("LIMIT") ? (
          <div className="card-flat !p-3 flex items-center gap-2.5">
            <Clock size={14} className="shrink-0" style={{ color: "var(--neutral)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-main)" }}>Limit Order</strong> — Price must come to entry zone. Do not market execute.
            </span>
          </div>
        ) : execution?.order_type?.toUpperCase()?.includes("STOP") ? (
          <div className="card-flat !p-3 flex items-center gap-2.5">
            <Activity size={14} className="shrink-0 tone-accent" />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-main)" }}>Breakout Stop</strong> — Price must push through entry zone to trigger.
            </span>
          </div>
        ) : execution?.order_type?.toUpperCase()?.includes("MARKET") ? (
          <div className="card-flat !p-3 flex items-center gap-2.5">
            <Zap size={14} className="shrink-0 tone-accent" />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-main)" }}>Market Execution</strong> — Enter after confirmation candle close.
            </span>
          </div>
        ) : null}

        {/* Advisory text for limit orders */}
        {execution?.order_type?.toUpperCase()?.includes("LIMIT") && (
          <div className="card-flat !p-3" style={{ borderColor: "rgba(209, 163, 63, 0.25)", background: "var(--neutral-glow)" }}>
            <div className="flex items-start gap-2">
              <Clock size={12} className="shrink-0 mt-0.5" style={{ color: "var(--neutral)" }} />
              <p className="text-xs font-medium" style={{ color: "var(--neutral)" }}>
                Wait for market retracement to entry zone — confirm with candle close before entering.
              </p>
            </div>
          </div>
        )}

        {/* Key data grid – 2-col on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="card-flat relative overflow-hidden !p-3">
            <div className="absolute top-0 left-0 w-[2px] h-full" style={{ background: "var(--accent)" }}></div>
            <p className="label mb-1">Entry</p>
            <p className="mono text-sm font-bold truncate" style={{ color: "var(--text-main)" }}>{displayValue(execution?.entry_zone || execution?.entry)}</p>
          </div>
          <div className="card-flat relative overflow-hidden !p-3">
            <div className="absolute top-0 left-0 w-[2px] h-full" style={{ background: "var(--bearish)" }}></div>
            <p className="label mb-1">Stop</p>
            <p className="mono text-sm font-bold truncate" style={{ color: "var(--bearish)" }}>{displayValue(execution?.stop)}</p>
          </div>
          <div className="card-flat relative overflow-hidden !p-3">
            <div className="absolute top-0 left-0 w-[2px] h-full" style={{ background: "var(--bullish)" }}></div>
            <p className="label mb-1">Target</p>
            <p className="mono text-sm font-bold truncate" style={{ color: "var(--bullish)" }}>{displayValue(execution?.target)}</p>
          </div>
          <div className="card-flat relative overflow-hidden !p-3">
            <div className="absolute top-0 left-0 w-[2px] h-full" style={{ background: "var(--neutral)" }}></div>
            <p className="label mb-1">R:R</p>
            <p className="mono text-sm font-bold truncate" style={{ color: "var(--neutral)" }}>
              {execution?.risk_reward || (execution?.r_multiple ? `1:${execution.r_multiple}` : "—")}
            </p>
          </div>
        </div>

        {/* ── Account Guard Panel ── */}
        {accountGuard && accountGuard.status !== 'error' && (
          <div
            className="rounded-xl p-3 sm:p-4 relative overflow-hidden"
            style={{
              background:
                accountGuard.status === 'safe'
                  ? "var(--bullish-glow)"
                  : accountGuard.status === 'over_risking'
                  ? "var(--neutral-glow)"
                  : "var(--bearish-glow)",
              border:
                accountGuard.status === 'safe'
                  ? "1px solid rgba(8, 153, 129, 0.25)"
                  : accountGuard.status === 'over_risking'
                  ? "1px solid rgba(209, 163, 63, 0.25)"
                  : "1px solid rgba(242, 54, 69, 0.3)",
            }}
          >
            {/* Status header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} style={{
                  color:
                    accountGuard.status === 'safe'
                      ? "var(--bullish)"
                      : accountGuard.status === 'over_risking'
                      ? "var(--neutral)"
                      : "var(--bearish)",
                }} />
                <span className="label" style={{
                  color:
                    accountGuard.status === 'safe'
                      ? "var(--bullish)"
                      : accountGuard.status === 'over_risking'
                      ? "var(--neutral)"
                      : "var(--bearish)",
                }}>
                  {accountGuard.status === 'safe' ? 'Account Safe'
                   : accountGuard.status === 'over_risking' ? 'Over-Risking'
                   : 'Wipeout Risk'}
                </span>
              </div>
              {/* Lot size badge */}
              {accountGuard.status === 'safe' && (
                <span className="badge mono" style={{ background: "var(--bullish-glow)", border: "1px solid rgba(8, 153, 129, 0.3)", color: "var(--bullish)" }}>
                  {accountGuard.idealLotSize.toFixed(2)} lots
                </span>
              )}
              {accountGuard.status !== 'safe' && (
                <span
                  className={`badge mono ${accountGuard.status === 'over_risking' ? "" : "animate-pulse-slow"}`}
                  style={
                    accountGuard.status === 'over_risking'
                      ? { background: "var(--neutral-glow)", border: "1px solid rgba(209, 163, 63, 0.3)", color: "var(--neutral)" }
                      : { background: "var(--bearish-glow)", border: "1px solid rgba(242, 54, 69, 0.3)", color: "var(--bearish)" }
                  }
                >
                  0.01 lots = {accountGuard.minLotRiskPercent}%
                </span>
              )}
            </div>

            {/* Status message */}
            <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
              {accountGuard.statusMessage}
            </p>

            {/* Risk metrics row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="card-flat !p-2 text-center">
                <p className="label">Lot Size</p>
                <p className="mono text-sm font-bold tabular" style={{ color: accountGuard.status === 'safe' ? "var(--bullish)" : "var(--text-main)" }}>
                  {accountGuard.status === 'safe' ? accountGuard.idealLotSize.toFixed(2) : '0.01 (min)'}
                </p>
              </div>
              <div className="card-flat !p-2 text-center">
                <p className="label">Max Risk $</p>
                <p className="mono text-sm font-bold tabular" style={{ color: "var(--text-main)" }}>
                  ${accountGuard.riskAmountDollars.toFixed(2)}
                </p>
              </div>
              <div className="card-flat !p-2 text-center">
                <p className="label">Min Lot $</p>
                <p className="mono text-sm font-bold tabular" style={{
                  color:
                    accountGuard.status === 'safe'
                      ? "var(--text-main)"
                      : accountGuard.status === 'over_risking'
                      ? "var(--neutral)"
                      : "var(--bearish)",
                }}>
                  ${accountGuard.minLotRiskDollars.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Account-Guarded SL/TP — only shown when over-risking or wipeout */}
            {(accountGuard.status === 'over_risking' || accountGuard.status === 'wipeout_risk') && accountGuard.guardedStop && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={13} className="tone-accent" />
                  <span className="label tone-accent">Account-Guarded Levels</span>
                </div>
                <p className="text-[11px] mb-2" style={{ color: "var(--muted)" }}>
                  SL tightened so 0.01 lots risks exactly ${accountGuard.riskAmountDollars.toFixed(2)} ({riskPercent}%){accountGuard.guardedRR ? `, preserving ${accountGuard.guardedRR.toFixed(1)}:1 R:R.` : '.'}
                </p>
                <div className={`grid ${accountGuard.guardedTarget ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <div className="card-flat !p-2" style={{ background: "var(--bearish-glow)", border: "1px solid rgba(242, 54, 69, 0.2)" }}>
                    <p className="label" style={{ color: "var(--bearish)" }}>Guarded Stop</p>
                    <p className="mono text-sm font-bold tabular" style={{ color: "var(--bearish)" }}>{accountGuard.guardedStop.toLocaleString()}</p>
                  </div>
                  {accountGuard.guardedTarget && (
                    <div className="card-flat !p-2" style={{ background: "var(--bullish-glow)", border: "1px solid rgba(8, 153, 129, 0.2)" }}>
                      <p className="label" style={{ color: "var(--bullish)" }}>Guarded Target</p>
                      <p className="mono text-sm font-bold tabular" style={{ color: "var(--bullish)" }}>{accountGuard.guardedTarget.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trigger Conditions */}
        <div className="card-flat relative !pt-4">
          <span className="label absolute top-[7px] left-3">Trigger</span>
          <p className="text-[13px] italic font-medium mt-0.5" style={{ color: "var(--text-main)" }}>
            "{DOMPurify.sanitize(execution?.trigger_condition || 'Confirmation required')}"
          </p>
        </div>

        {/* Alternative Scenario */}
        {(alternative || trade.alternative_scenario) && (
          <div className="card-flat">
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldAlert size={12} style={{ color: "var(--muted)" }} />
              <span className="label">Alt Plan</span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{DOMPurify.sanitize(alternative || trade.alternative_scenario)}</p>
          </div>
        )}

        {/* SL Width Warning */}
        {execution?.sl_warning && (
          <div className="card-flat" style={{ background: "var(--bearish-glow)", border: "1px solid rgba(242, 54, 69, 0.25)" }}>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: "var(--bearish)" }}>
              <ShieldAlert size={13} />
              <span className="text-xs font-bold">SL Warning</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--bearish)" }}>{DOMPurify.sanitize(execution.sl_warning)}</p>
          </div>
        )}

        {/* R:R Enforcement Notice */}
        {execution?.rr_warning && (
          <div className="card-flat" style={{ background: "var(--neutral-glow)", border: "1px solid rgba(209, 163, 63, 0.25)" }}>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: "var(--neutral)" }}>
              <AlertTriangle size={13} />
              <span className="text-xs font-bold">R:R Notice</span>
            </div>
            <p className="text-xs leading-relaxed mb-1" style={{ color: "var(--neutral)" }}>{DOMPurify.sanitize(execution.rr_warning)}</p>
            {execution.rr_adjusted && execution.extended_target && (
              <div className="flex items-center gap-1.5 p-1.5 rounded-md" style={{ background: "var(--surface-3)" }}>
                <Target size={12} style={{ color: "var(--neutral)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Adjusted Target: <span className="font-bold mono" style={{ color: "var(--neutral)" }}>{execution.extended_target}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <hr className="divider" />
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="label shrink-0">Invalidation</span>
            <span className="text-xs font-medium mono truncate" style={{ color: "var(--text-main)" }}>{DOMPurify.sanitize(trade.invalidation_level || "Close below structure")}</span>
          </div>
          <span className="label shrink-0">
            {execution?.order_type || "Market"}
          </span>
        </div>
      </div>
    </div>
  );
}
