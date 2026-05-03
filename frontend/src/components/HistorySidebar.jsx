import { X, Trash2, ExternalLink, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, Activity, Layers, BarChart2, Zap } from "lucide-react";
import { useState } from "react";

export default function HistorySidebar({ history, onClose, onUpdateStatus, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderAnalysis = (item) => {
    if (!item.analysis) return null;
    const a = item.analysis;
    return (
      <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
        {a.htf_analysis && (
          <div className="bg-black/20 rounded-lg p-2">
            <p className="text-[10px] label uppercase mb-1">HTF Analysis</p>
            <p className="text-xs text-main">{a.htf_analysis.trend?.direction} • {a.htf_analysis.structure?.overall || "—"}</p>
          </div>
        )}
        {a.ltf_analysis && (
          <div className="bg-black/20 rounded-lg p-2">
            <p className="text-[10px] label uppercase mb-1">LTF Analysis</p>
            <p className="text-xs text-main">{a.ltf_analysis.trend?.direction} • {a.ltf_analysis.structure?.overall || "—"}</p>
          </div>
        )}
        {a.key_levels && (
          <div className="bg-black/20 rounded-lg p-2">
            <p className="text-[10px] label uppercase mb-1">Key Levels</p>
            <p className="text-xs text-main">
              Demand: {a.key_levels.demand_zones?.[0]?.range || "—"} | Supply: {a.key_levels.supply_zones?.[0]?.range || "—"}
            </p>
          </div>
        )}
        {a.executive_summary && (
          <div className="bg-black/20 rounded-lg p-2">
            <p className="text-[10px] label uppercase mb-1">Summary</p>
            <p className="text-xs text-main italic">"{a.executive_summary}"</p>
          </div>
        )}
        {a.trade_setup && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-2">
            <p className="text-[10px] label uppercase mb-1">Trade Setup</p>
            <p className="text-xs text-main">
              Bias: {a.trade_setup.bias} | Entry: {a.trade_setup.execution?.entry || "Market"} | R:R: {a.trade_setup.execution?.risk_reward || "—"}
            </p>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col border-l border-white/10 animate-slide-left">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-main">Analysis History</h2>
            <p className="text-xs text-muted mt-1">Last {history.length} saved setups</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Clock size={40} className="mb-4" />
              <p className="text-sm">No saved analyses yet</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="card p-4 border border-white/5 bg-surface-2 hover:border-accent/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${item.bias === 'BUY' ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'}`}>
                      {item.bias === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-main">{item.symbol}</h4>
                      <p className="text-[10px] text-muted">{item.date}</p>
                    </div>
                  </div>
                  <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-bearish transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center bg-black/20 rounded-lg py-1.5">
                    <p className="text-[10px] label">Entry</p>
                    <p className="text-xs font-bold text-main">{item.entry}</p>
                  </div>
                  <div className="text-center bg-black/20 rounded-lg py-1.5">
                    <p className="text-[10px] label">R:R</p>
                    <p className="text-xs font-bold text-accent">{item.rr}</p>
                  </div>
                  <div className="text-center bg-black/20 rounded-lg py-1.5">
                    <p className="text-[10px] label">Rating</p>
                    <p className="text-xs font-bold text-main">{item.rating || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {['Pending', 'Win', 'Loss'].map((status) => (
                      <button
                        key={status}
                        onClick={() => onUpdateStatus(item.id, status)}
                        className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${
                          item.status === status
                            ? status === 'Win' ? 'bg-bullish text-white' : status === 'Loss' ? 'bg-bearish text-white' : 'bg-accent text-white'
                            : 'bg-white/5 text-muted hover:bg-white/10'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  {item.analysis && (
                    <button 
                      onClick={() => toggleExpand(item.id)} 
                      className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-all flex items-center gap-1"
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
