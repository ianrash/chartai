import { X, Trash2, Star } from "lucide-react";
import { useState } from "react";

export default function WatchlistDrawer({ onClose }) {
  const LS_WATCHLIST = "chartai_watchlist";
  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_WATCHLIST) || "[]");
    } catch {
      return [];
    }
  });

  const removeFromWatchlist = (symbol) => {
    const next = watchlist.filter((s) => s !== symbol);
    setWatchlist(next);
    localStorage.setItem(LS_WATCHLIST, JSON.stringify(next));
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full shadow-2xl flex flex-col border-l animate-slide-left" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-xl font-display font-bold text-main">Watchlist</h2>
            <p className="text-xs text-muted mt-1">Saved analysis symbols</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:scale-110 active:scale-95 transition-all text-muted hover:text-main" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <Star size={20} className="text-muted" />
              </div>
              <p className="text-sm text-secondary">No watchlist items yet</p>
              <p className="text-xs text-muted mt-2">Star assets from the Scanner to add them here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {watchlist.map((symbol) => (
                <div
                  key={symbol}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3">
                    <Star
                      size={14}
                      className={watchlist.includes(symbol) ? "text-accent" : "text-muted"}
                      onClick={() => removeFromWatchlist(symbol)}
                    />
                    <span className="text-xs font-bold text-main">{symbol}</span>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(symbol)}
                    className="text-[10px] text-bearish"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}