import { X, Trash2, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import DOMPurify from "dompurify";

export default function HistorySidebar({ history, onClose, onUpdateStatus, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderAnalysis = (item) => {
    if (!item.analysis) return null;
    const a = item.analysis;
    return (
      <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
        {a.htf_analysis && (
          <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
            <p className="text-[10px] label font-display uppercase mb-1.5">HTF Analysis</p>
            <p className="text-xs text-secondary">{DOMPurify.sanitize(a.htf_analysis.trend?.direction)} • {DOMPurify.sanitize(a.htf_analysis.structure?.overall || "—")}</p>
          </div>
        )}
        {a.ltf_analysis && (
          <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
            <p className="text-[10px] label font-display uppercase mb-1.5">LTF Analysis</p>
            <p className="text-xs text-secondary">{DOMPurify.sanitize(a.ltf_analysis.trend?.direction)} • {DOMPurify.sanitize(a.ltf_analysis.structure?.overall || "—")}</p>
          </div>
        )}
        {a.key_levels && (
          <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
            <p className="text-[10px] label font-display uppercase mb-1.5">Key Levels</p>
            <p className="text-xs text-secondary">
              Demand: {DOMPurify.sanitize(a.key_levels.demand_zones?.[0]?.range || "—")} | Supply: {DOMPurify.sanitize(a.key_levels.supply_zones?.[0]?.range || "—")}
            </p>
          </div>
        )}
        {a.executive_summary && (
          <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
            <p className="text-[10px] label font-display uppercase mb-1.5">Summary</p>
            <p className="text-xs text-secondary italic">"{DOMPurify.sanitize(a.executive_summary)}"</p>
          </div>
        )}
        {a.trade_setup && (
          <div className="rounded-xl p-3 border" style={{ background: 'var(--accent-glow)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <p className="text-[10px] label font-display uppercase mb-1.5">Trade Setup</p>
            <p className="text-xs text-secondary">
              Bias: {DOMPurify.sanitize(a.trade_setup.bias)} | Entry: {DOMPurify.sanitize(a.trade_setup.execution?.entry || "Market")} | R:R: {DOMPurify.sanitize(a.trade_setup.execution?.risk_reward || "—")}
            </p>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md h-full shadow-2xl flex flex-col border-l animate-slide-left" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-xl font-display font-bold text-main">Analysis History</h2>
            <p className="text-xs text-muted mt-1">Last {history.length} saved setups</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:scale-110 active:scale-95 transition-all text-muted hover:text-main" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <Clock size={36} className="text-muted" />
              </div>
              <p className="text-sm text-secondary font-display">No saved analyses yet</p>
              <p className="text-xs text-muted mt-2">Your saved trade setups will appear here</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="card p-4 hover:scale-[1.01] transition-all group" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bias === 'BUY' ? '' : ''}`} style={item.bias === 'BUY' ? { background: 'var(--bullish-glow)', color: 'var(--bullish)' } : { background: 'var(--bearish-glow)', color: 'var(--bearish)' }}>
                      {item.bias === 'BUY' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-bold text-main">{item.symbol}</h4>
                      <p className="text-[10px] text-muted">{item.date}</p>
                    </div>
                  </div>
                  <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:scale-110 active:scale-95 transition-all text-muted hover:text-bearish" style={{ background: 'var(--surface)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center rounded-lg py-2.5" style={{ background: 'var(--surface)' }}>
                    <p className="text-[10px] label font-display">Entry</p>
                    <p className="text-xs font-bold text-main mt-0.5">{item.entry}</p>
                  </div>
                  <div className="text-center rounded-lg py-2.5" style={{ background: 'var(--surface)' }}>
                    <p className="text-[10px] label font-display">R:R</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--accent)' }}>{item.rr}</p>
                  </div>
                  <div className="text-center rounded-lg py-2.5" style={{ background: 'var(--surface)' }}>
                    <p className="text-[10px] label font-display">Rating</p>
                    <p className="text-xs font-bold text-main mt-0.5">{item.rating || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {['Pending', 'Win', 'Loss'].map((status) => (
                      <button
                        key={status}
                        onClick={() => onUpdateStatus(item.id, status)}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold font-display transition-all hover:scale-105 active:scale-95 ${
                          item.status === status
                            ? status === 'Win' ? '' : status === 'Loss' ? '' : ''
                            : ''
                        }`}
                        style={
                          item.status === status
                            ? status === 'Win' 
                              ? { background: 'var(--bullish)', color: '#fff' }
                              : status === 'Loss'
                                ? { background: 'var(--bearish)', color: '#fff' }
                                : { background: 'var(--accent)', color: '#fff' }
                            : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
                        }
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  {item.analysis && (
                    <button 
                      onClick={() => toggleExpand(item.id)} 
                      className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95 flex items-center gap-1"
                      style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
                      title="View Analysis"
                    >
                      {expandedId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>

                {expandedId === item.id && renderAnalysis(item)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}