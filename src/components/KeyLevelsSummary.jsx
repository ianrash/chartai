import { TrendingUp } from "lucide-react";

const ICT_CONFIG = {
  entry: { color: "var(--bullish)", bg: "var(--bullish-glow)" },
  ote: { color: "var(--neutral)", bg: "var(--neutral-glow)" },
  discount: { color: "var(--bearish)", bg: "var(--bearish-glow)" },
  premium: { color: "var(--bullish)", bg: "var(--bullish-glow)" },
};

function formatPrice(price, decimals = 2) {
  if (price == null || isNaN(Number(price))) return "—";
  return Number(price).toFixed(decimals);
}

export default function KeyLevelsSummary({ computedICT }) {
  if (!computedICT) return null;
  const { swing_high, swing_low, range, entry_zone, entry_zone_low, entry_zone_high, ote_zone, ote_zone_low, ote_zone_high, discount={}, premium={} } = computedICT;
  return (
    <div className="card edge-card flex flex-col gap-4 animate-fade-in-up" style={{ borderLeftColor: "var(--accent)" }}>
      <div className="flex items-start gap-3">
        <div className="icon-tile icon-tile-accent">
          <TrendingUp size={15} />
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="label">ICT Key Levels</p>
          <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
            Swing High: <span className="mono">{formatPrice(swing_high)}</span>
          </p>
          <p className="text-[13px]" style={{ color: "var(--muted)" }}>
            Swing Low: <span className="mono">{formatPrice(swing_low)}</span>
          </p>
          <p className="text-[13px]" style={{ color: "var(--text-main)" }}>
            Range: <span className="mono tabular">{formatPrice(range)}</span>
          </p>
        </div>
      </div>

      <hr className="divider" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="label" style={{ color: ICT_CONFIG.entry.color }}>Entry Zone</p>
          <p className="text-[13px] font-semibold mono" style={{ color: ICT_CONFIG.entry.color }}>{entry_zone}</p>
          <p className="text-xs mono" style={{ color: "var(--muted)" }}>{formatPrice(entry_zone_low)} - {formatPrice(entry_zone_high)}</p>
        </div>
        <div>
          <p className="label" style={{ color: ICT_CONFIG.ote.color }}>OTE Zone</p>
          <p className="text-[13px] font-semibold mono" style={{ color: ICT_CONFIG.ote.color }}>{ote_zone}</p>
          <p className="text-xs mono" style={{ color: "var(--muted)" }}>{formatPrice(ote_zone_low)} - {formatPrice(ote_zone_high)}</p>
        </div>
      </div>

      <hr className="divider" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="label" style={{ color: ICT_CONFIG.discount.color }}>{discount.label}</p>
          <p className="text-[13px] font-semibold mono" style={{ color: ICT_CONFIG.discount.color }}>Below {formatPrice(discount.above)}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Premium boundary</p>
        </div>
        <div>
          <p className="label" style={{ color: ICT_CONFIG.premium.color }}>{premium.label}</p>
          <p className="text-[13px] font-semibold mono" style={{ color: ICT_CONFIG.premium.color }}>Above {formatPrice(premium.below)}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Equilibrium boundary</p>
        </div>
      </div>
    </div>
  );
}
