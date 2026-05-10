import { Save, AlertTriangle, Target, Zap, TrendingUp, TrendingDown, Clock, ShieldAlert, Copy } from "lucide-react";
import DOMPurify from "dompurify";

const calculateConfluenceScore = (checklist) => {
  if (!checklist) return 0;
  const values = Object.values(checklist);
  if (values.length === 0) return 0;
  return Math.round((values.filter(Boolean).length / values.length) * 100);
};

const getProbabilityRating = (confluencePercent) => {
  if (confluencePercent >= 90) return "A+";
  if (confluencePercent >= 75) return "A";
  if (confluencePercent >= 60) return "B";
  if (confluencePercent >= 40) return "C";
  return "F";
};

export default function TradeSetup({ trade, onSave, onCopy, confluenceChecklist, rating: propRating }) {
  if (!trade) return null;

  const isWait = trade.bias?.toUpperCase() === "WAIT";
  const isBuy = trade.bias?.toUpperCase() === "BUY";
  const { execution } = trade;
  const rating = propRating ?? getProbabilityRating(calculateConfluenceScore(confluenceChecklist));
  
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
      <div className={`px-3 sm:px-5 py-3 flex flex-wrap gap-2 sm:gap-3 ${isWait ? 'bg-neutral/10' : isBuy ? 'bg-bullish/10' : 'bg-bearish/10'}`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {isBuy ? <TrendingUp size={14} sm:size={18} className="text-bullish flex-shrink-0" /> : isWait ? <Clock size={14} sm:size={18} className="text-neutral flex-shrink-0" /> : <TrendingDown size={14} sm:size={18} className="text-bearish flex-shrink-0" />}
          <h3 className="font-bold text-main text-sm sm:text-base whitespace-nowrap">{trade.label || 'Trade Setup'}</h3>
        </div>
        
        <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold border ${r.bg} ${r.border} ${r.text} flex-shrink-0 order-3 sm:order-2`}>
          {rating}
        </span>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto order-4 sm:order-3">
          <span className={`badge text-[9px] sm:text-xs ${isWait ? 'bg-neutral/20 text-neutral' : isBuy ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'}`}>
            {trade.bias} {trade.status && `• ${trade.status}`}
          </span>
          {onCopy && (
            <button 
              onClick={() => onCopy(trade)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-main text-xs font-bold transition-all"
            >
              <Copy size={12} sm:size={14} />
              <span className="hidden sm:inline">Copy</span>
            </button>
          )}
          <button 
            onClick={() => onSave(trade)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent/20 hover:bg-accent/40 text-accent text-xs font-bold transition-all"
          >
            <Save size={14} />
            Save Setup
          </button>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-5">
        {execution?.order_type?.toUpperCase() === "LIMIT" ? (
          <div className="p-3 rounded-xl bg-neutral/10 border border-neutral/30 flex items-start gap-3">
            <AlertTriangle size={18} className="text-neutral flex-shrink-0 mt-0.5" />
            <p className="text-xs text-neutral font-medium leading-relaxed">
              <span className="font-bold">Do not enter market.</span> Place your limit order at the entry zone and wait for price to come to you. Market entering this setup will result in poor entry price and premature stop loss hit.
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

        <div className="bg-surface-2 p-2 sm:p-3 rounded-xl border border-white/5">
          <p className="label text-[10px] sm:text-xs mb-1">Entry Trigger Required</p>
          <p className="text-xs sm:text-sm text-main font-bold italic">"{DOMPurify.sanitize(execution?.trigger_condition || 'Confirmation required')}"</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div>
            <p className="label text-[10px] sm:text-xs">Entry Zone</p>
            <p className="value text-xs sm:text-base truncate">{execution?.entry_zone || execution?.entry || "—"}</p>
          </div>
          <div>
            <p className="label text-[10px] sm:text-xs">Stop Loss</p>
            <p className="value text-xs sm:text-base text-bearish truncate">{execution?.stop || "—"}</p>
          </div>
          <div>
            <p className="label text-[10px] sm:text-xs">Target</p>
            <p className="value text-xs sm:text-base text-bullish truncate">{execution?.target || "—"}</p>
          </div>
          <div>
            <p className="label text-[10px] sm:text-xs">R:R Ratio</p>
            <p className={`value text-xs sm:text-base ${execution?.r_multiple < 2 ? 'text-neutral' : 'text-accent'} truncate`}>
              {execution?.risk_reward || (execution?.r_multiple ? `1:${execution.r_multiple}` : "—")}
            </p>
          </div>
        </div>

        {trade.alternative_scenario && (
          <div className="bg-surface-2 p-3 sm:p-4 rounded-xl border border-dashed border-muted/30">
            <div className="flex items-center gap-2 mb-2 text-muted">
              <ShieldAlert size={12} sm:size={14} />
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Alternative Scenario / Plan B</p>
            </div>
            <p className="text-xs sm:text-sm text-main leading-relaxed">{DOMPurify.sanitize(trade.alternative_scenario)}</p>
          </div>
        )}

        {execution?.rr_warning && (
          <div className="flex flex-col gap-2 p-2 sm:p-3 rounded-xl bg-neutral/5 border border-neutral/20">
            <div className="flex items-center gap-2 text-neutral">
              <AlertTriangle size={12} sm:size={16} />
              <span className="text-xs sm:text-sm font-bold">R:R Enforcement Notice</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted leading-relaxed">{DOMPurify.sanitize(execution.rr_warning)}</p>
            {execution.extended_target && (
              <div className="flex items-center gap-2 mt-1">
                <Target size={10} sm:size={14} className="text-bullish" />
                <span className="text-[10px] sm:text-xs font-semibold text-main">Suggested Extended Target: <span className="text-bullish font-bold">{execution.extended_target}</span></span>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-2 sm:gap-4 justify-between">
          <div>
            <p className="label flex items-center gap-1"><ShieldAlert size={10} sm:size={12} /> Invalidation</p>
            <p className="text-[10px] sm:text-xs text-muted mt-1">{DOMPurify.sanitize(trade.invalidation_level || "Close below structure")}</p>
          </div>
          <div className="text-right">
            <p className="label">Order Type</p>
            <p className="text-xs sm:text-sm font-bold text-main">{execution?.order_type || "Market"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
