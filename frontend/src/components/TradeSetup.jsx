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
    "A+": { bg: "var(--bullish-glow)", border: "rgba(16, 185, 129, 0.4)", text: "var(--bullish)" },
    "A": { bg: "rgba(59, 130, 246, 0.2)", border: "rgba(59, 130, 246, 0.4)", text: "#3b82f6" },
    "B": { bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.4)", text: "var(--neutral)" },
    "C": { bg: "rgba(249, 115, 22, 0.15)", border: "rgba(249, 115, 22, 0.4)", text: "#f97316" },
    "F": { bg: "var(--bearish-glow)", border: "rgba(244, 63, 94, 0.4)", text: "var(--bearish)" },
  };
  const r = ratingColors[rating] || ratingColors.F;

  const biasStyle = isWait 
    ? { bg: 'rgba(251, 191, 36, 0.1)', color: 'var(--neutral)', border: 'rgba(251, 191, 36, 0.3)' }
    : isBuy 
      ? { bg: 'var(--bullish-glow)', color: 'var(--bullish)', border: 'rgba(16, 185, 129, 0.3)' }
      : { bg: 'var(--bearish-glow)', color: 'var(--bearish)', border: 'rgba(244, 63, 94, 0.3)' };

  return (
    <div className="card overflow-hidden border-2 animate-fade-in-up" style={{ borderColor: isWait ? 'rgba(251, 191, 36, 0.3)' : isBuy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)' }}>
      <div className="px-4 sm:px-6 py-4 flex flex-wrap gap-3 sm:gap-4 items-center" style={{ background: isWait ? 'rgba(251, 191, 36, 0.08)' : isBuy ? 'var(--bullish-glow)' : 'var(--bearish-glow)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isWait ? '' : ''}`} style={isWait ? { background: 'rgba(251, 191, 36, 0.15)', color: 'var(--neutral)' } : isBuy ? { background: 'var(--bullish)', color: '#fff' } : { background: 'var(--bearish)', color: '#fff' }}>
            {isBuy ? <TrendingUp size={18} /> : isWait ? <Clock size={18} /> : <TrendingDown size={18} />}
          </div>
          <h3 className="font-display font-bold text-main text-base whitespace-nowrap">{trade.label || 'Trade Setup'}</h3>
        </div>
        
        <span className="px-3 py-1.5 rounded-lg text-xs font-bold font-display border flex-shrink-0 order-3 sm:order-2" style={{ background: r.bg, borderColor: r.border, color: r.text }}>
          {rating}
        </span>
        
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto order-4 sm:order-3">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold font-display" style={{ background: biasStyle.bg, color: biasStyle.color, border: `1px solid ${biasStyle.border}` }}>
            {trade.bias} {trade.status && `• ${trade.status}`}
          </span>
          {onCopy && (
            <button 
              onClick={() => onCopy(trade)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
              style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
            >
              <Copy size={14} />
              <span className="hidden sm:inline">Copy</span>
            </button>
          )}
          <button 
            onClick={() => onSave(trade)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold font-display transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', color: '#fff' }}
          >
            <Save size={14} />
            Save Setup
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex flex-col gap-5">
        {execution?.order_type?.toUpperCase() === "LIMIT" ? (
          <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: 'rgba(251, 191, 36, 0.08)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--neutral)' }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-display font-bold" style={{ color: 'var(--neutral)' }}>Do not enter market.</p>
              <p className="text-xs text-secondary mt-1 leading-relaxed">Place your limit order at the entry zone and wait for price to come to you. Market entering this setup will result in poor entry price and premature stop loss hit.</p>
            </div>
          </div>
        ) : execution?.order_type?.toUpperCase() === "MARKET" ? (
          <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: 'var(--accent-glow)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <Zap size={20} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-display font-bold text-accent">Enter on confirmation candle close only.</p>
              <p className="text-xs text-secondary mt-1 leading-relaxed">Do not enter mid-candle or before close.</p>
            </div>
          </div>
        ) : null}

        <div className="p-4 rounded-xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <p className="label font-display text-[10px] sm:text-xs mb-2">Entry Trigger Required</p>
          <p className="text-sm font-display text-main font-semibold italic">"{DOMPurify.sanitize(execution?.trigger_condition || 'Confirmation required')}"</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <p className="label font-display text-[10px] sm:text-xs mb-1">Entry Zone</p>
            <p className="value text-sm font-semibold text-main truncate">{execution?.entry_zone || execution?.entry || "—"}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <p className="label font-display text-[10px] sm:text-xs mb-1">Stop Loss</p>
            <p className="value text-sm font-semibold truncate" style={{ color: 'var(--bearish)' }}>{execution?.stop || "—"}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <p className="label font-display text-[10px] sm:text-xs mb-1">Target</p>
            <p className="value text-sm font-semibold truncate" style={{ color: 'var(--bullish)' }}>{execution?.target || "—"}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <p className="label font-display text-[10px] sm:text-xs mb-1">R:R Ratio</p>
            <p className={`value text-sm font-semibold truncate ${(() => {
              const rMultiple = execution?.r_multiple || (execution?.risk_reward ? parseFloat(execution.risk_reward.split(':')[1]) : null);
              return (rMultiple !== null && rMultiple < 2) ? '' : '';
            })()}`} style={{ color: (() => {
              const rMultiple = execution?.r_multiple || (execution?.risk_reward ? parseFloat(execution.risk_reward.split(':')[1]) : null);
              return (rMultiple !== null && rMultiple < 2) ? 'var(--neutral)' : 'var(--accent)';
            })() }}>
              {execution?.risk_reward || (execution?.r_multiple ? `1:${execution.r_multiple}` : "—")}
            </p>
          </div>
        </div>

        {trade.alternative_scenario && (
          <div className="p-4 rounded-xl border border-dashed" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-3 text-muted">
              <ShieldAlert size={14} />
              <p className="text-xs font-display font-bold uppercase tracking-wider">Alternative Scenario / Plan B</p>
            </div>
            <p className="text-sm text-secondary leading-relaxed">{DOMPurify.sanitize(trade.alternative_scenario)}</p>
          </div>
        )}

        {execution?.rr_warning && (
          <div className="flex flex-col gap-3 p-4 rounded-xl border" style={{ background: 'rgba(251, 191, 36, 0.05)', borderColor: 'rgba(251, 191, 36, 0.2)' }}>
            <div className="flex items-center gap-2" style={{ color: 'var(--neutral)' }}>
              <AlertTriangle size={16} />
              <span className="text-sm font-display font-bold">R:R Enforcement Notice</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{DOMPurify.sanitize(execution.rr_warning)}</p>
            {execution.extended_target && (
              <div className="flex items-center gap-2 mt-1">
                <Target size={14} style={{ color: 'var(--bullish)' }} />
                <span className="text-xs font-semibold text-secondary">Suggested Extended Target: <span className="font-bold" style={{ color: 'var(--bullish)' }}>{execution.extended_target}</span></span>
              </div>
            )}
          </div>
        )}

        <div className="pt-5 border-t flex flex-col md:flex-row gap-4 justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="label flex items-center gap-1.5 font-display"><ShieldAlert size={12} /> Invalidation</p>
            <p className="text-xs text-muted mt-1.5">{DOMPurify.sanitize(trade.invalidation_level || "Close below structure")}</p>
          </div>
          <div className="text-right">
            <p className="label font-display">Order Type</p>
            <p className="text-sm font-bold text-main mt-0.5">{execution?.order_type || "Market"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}