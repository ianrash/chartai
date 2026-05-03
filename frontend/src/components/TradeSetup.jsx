import { Save, AlertTriangle, Target, Zap, TrendingUp, TrendingDown, Clock, ShieldAlert } from "lucide-react";

const getProbabilityRating = (checklist) => {
  if (!checklist) return "F";
  const values = Object.values(checklist);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);
  if (score >= 90) return "A+";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "F";
};

export default function TradeSetup({ trade, onSave, confluenceChecklist }) {
  if (!trade) return null;

  const isWait = trade.bias?.toUpperCase() === "WAIT";
  const isBuy = trade.bias?.toUpperCase() === "BUY";
  const { execution } = trade;
  const rating = getProbabilityRating(confluenceChecklist);
  
  const ratingColors = {
    "A+": { bg: "bg-green-500/20", border: "border-green-500/40", text: "text-green-400" },
    "A": { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400" },
    "B": { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-400" },
    "C": { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-400" },
    "F": { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400" },
  };
  const r = ratingColors[rating] || ratingColors.F;

  return (
    <div className={`card overflow-hidden border-2 animate-fade-in ${isWait ? 'border-neutral/30' : isBuy ? 'border-bullish/30' : 'border-bearish/30'}`}>
      <div className={`px-5 py-3 flex items-center justify-between ${isWait ? 'bg-neutral/10' : isBuy ? 'bg-bullish/10' : 'bg-bearish/10'}`}>
        <div className="flex items-center gap-3">
          {isBuy ? <TrendingUp size={18} className="text-bullish" /> : isWait ? <Clock size={18} className="text-neutral" /> : <TrendingDown size={18} className="text-bearish" />}
          <h3 className="font-bold text-main">{trade.label || 'Trade Setup'}</h3>
          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${r.bg} ${r.border} ${r.text}`}>
            {rating}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${isWait ? 'bg-neutral/20 text-neutral' : isBuy ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'}`}>
            {trade.bias} {trade.status && `• ${trade.status}`}
          </span>
          <button 
            onClick={() => onSave(trade)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent/20 hover:bg-accent/40 text-accent text-xs font-bold transition-all"
          >
            <Save size={14} />
            Save Setup
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Order Type Banners */}
        {execution?.order_type?.toUpperCase() === "LIMIT" ? (
          <div className="p-3 rounded-xl bg-neutral/10 border border-neutral/30 flex items-start gap-3">
            <AlertTriangle size={18} className="text-neutral flex-shrink-0 mt-0.5" />
            <p className="text-xs text-neutral font-medium leading-relaxed">
              <span className="font-bold">⚠ Do not enter market.</span> Place your limit order at the entry zone and wait for price to come to you. Market entering this setup will result in poor entry price and premature stop loss hit.
            </p>
          </div>
        ) : execution?.order_type?.toUpperCase() === "MARKET" ? (
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 flex items-start gap-3">
            <Zap size={18} className="text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-accent font-medium leading-relaxed">
              <span className="font-bold">Enter on confirmation candle close only.</span> Do not enter mid-candle or before close.
            </p>
          </div>
        ) : null}

        {/* Trigger Condition Highlight */}
        <div className="bg-surface-2 p-3 rounded-xl border border-white/5">
          <p className="label mb-1">Entry Trigger Required</p>
          <p className="text-main font-bold italic">"{execution?.trigger_condition || 'Confirmation required'}"</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="label">Entry Zone</p>
            <p className="value">{execution?.entry_zone || execution?.entry || "—"}</p>
          </div>
          <div>
            <p className="label">Stop Loss</p>
            <p className="value text-bearish">{execution?.stop || "—"}</p>
          </div>
          <div>
            <p className="label">Target</p>
            <p className="value text-bullish">{execution?.target || "—"}</p>
          </div>
          <div>
            <p className="label">R:R Ratio</p>
            <p className={`value ${execution?.r_multiple < 2 ? 'text-neutral' : 'text-accent'}`}>
              {execution?.risk_reward || (execution?.r_multiple ? `1:${execution.r_multiple}` : "—")}
            </p>
          </div>
        </div>

        {/* Alternative Scenario */}
        {trade.alternative_scenario && (
          <div className="bg-surface-2 p-4 rounded-xl border border-dashed border-muted/30">
            <div className="flex items-center gap-2 mb-2 text-muted">
              <ShieldAlert size={14} />
              <p className="text-xs font-bold uppercase tracking-wider">Alternative Scenario / Plan B</p>
            </div>
            <p className="text-sm text-main leading-relaxed">{trade.alternative_scenario}</p>
          </div>
        )}

        {/* RR Warning & Extended Target */}
        {execution?.rr_warning && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral/5 border border-neutral/20">
            <div className="flex items-center gap-2 text-neutral">
              <AlertTriangle size={16} />
              <span className="text-sm font-bold">R:R Enforcement Notice</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{execution.rr_warning}</p>
            {execution.extended_target && (
              <div className="flex items-center gap-2 mt-1">
                <Target size={14} className="text-bullish" />
                <span className="text-xs font-semibold text-main">Suggested Extended Target: <span className="text-bullish font-bold">{execution.extended_target}</span></span>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-4 justify-between">
          <div>
            <p className="label flex items-center gap-1"><ShieldAlert size={12} /> Invalidation</p>
            <p className="text-xs text-muted mt-1">{trade.invalidation_level || "Close below structure"}</p>
          </div>
          <div className="text-right">
            <p className="label">Order Type</p>
            <p className="text-sm font-bold text-main">{execution?.order_type || "Market"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
