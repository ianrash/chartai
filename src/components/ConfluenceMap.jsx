import { Fibonacci } from "lucide-react";

export default function ConfluenceMap({ htfAnalysis, mtfAnalysis, m1Analysis }) {
  if (!htfAnalysis && !mtfAnalysis && !m1Analysis) return null;

  const getZones = (analysis, prefix) => {
    if (!analysis) return [];
    const zones = [];

    // Order Blocks
    if (analysis.order_block?.present) {
      zones.push({
        name: `${prefix} OB`,
        price: analysis.order_block.range_low,
        type: "demand",
        direction: analysis.order_block.trend?.direction?.toLowerCase() || "unknown",
      });
    }

    // Fair Value Gaps
    if (analysis.fvg?.open_fvgs?.length) {
      analysis.fvg.open_fvgs.forEach((fvg, i) => {
        zones.push({
          name: `${prefix} FVG ${i + 1}`,
          price: fvg.nearest_below || fvg.nearest_above,
          type: "gap",
        });
      });
    }

    // Liquidity
    if (analysis.liquidity) {
      if (analysis.liquidity.bsl_location) {
        zones.push({ name: `${prefix} SSL`, price: analysis.liquidity.ssl_location, type: "supply" });
      }
      if (analysis.liquidity.bsl_location) {
        zones.push({ name: `${prefix} BSL`, price: analysis.liquidity.bsl_location, type: "demand" });
      }
    }

    // Inducement
    if (analysis.inducement?.present) {
      zones.push({
        name: `${prefix} Inducement`,
        price: analysis.inducement.location,
        type: "inducement",
      });
    }

    return zones;
  };

  const htfZones = htfAnalysis ? getZones(htfAnalysis, "HTF") : [];
  const mtfZones = mtfAnalysis ? getZones(mtfAnalysis, "MTF") : [];
  const m1Zones = m1Analysis ? getZones(m1Analysis, "M1") : [];

  // Find converging zones (same price range across timeframes)
  const converging = [];
  const allZones = [...htfZones, ...mtfZones, ...m1Zones];

  // Group by rounded price
  const priceGroups = {};
  allZones.forEach((z) => {
    const key = Math.round(z.price);
    if (!priceGroups[key]) priceGroups[key] = [];
    priceGroups[key].push(z);
  });

  // Find prices that appear in 2+ timeframes
  Object.entries(priceGroups).forEach(([price, zones]) => {
    const timeframes = new Set(zones.map((z) => z.name.split(" ")[0]));
    if (timeframes.size >= 2 && zones.length >= 2) {
      converging.push({
        price: Number(price),
        zones,
      });
    }
  });

  return (
    <div className="card flex flex-col gap-4 p-4 animate-fade-in-up" style={{ borderLeft: "3px solid var(--accent)", background: "var(--surface)" }}>
      <div className="flex items-start gap-2">
        <Fibonacci size={14} style={{ color: "var(--accent)" }} />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">CONFLUENCE MAP</p>
          <p className="text-sm font-medium text-main">HTF • MTF • M1 Alignment</p>
        </div>
      </div>

      {converging.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {converging.slice(0, 6).map((item) => (
            <div
              key={item.price}
              className="p-2 rounded-lg bg-accent/10 border border-accent/20"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-accent">{item.price}</p>
              {item.zones.slice(0, 3).map((z) => (
                <div
                  key={z.name}
                  className="text-[9px] text-muted mt-1">{z.name}: {z.price}"
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-bullish">HTF Zones</p>
          {htfZones.slice(0, 3).map((z) => (
            <div key={z.name} className="text-[9px] text-muted mb-1">{z.name}</div>
          ))}
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-main">MTF Zones</p>
          {mtfZones.slice(0, 3).map((z) => (
            <div key={z.name} className="text-[9px] text-muted mb-1">{z.name}</div>
          ))}
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-green-400">M1 Zones</p>
          {m1Zones.slice(0, 3).map((z) => (
            <div key={z.name} className="text-[9px] text-muted mb-1">{z.name}</div>
          ))}
        </div>
      </div>
    </div>
  );
}