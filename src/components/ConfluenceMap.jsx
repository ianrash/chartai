import { Fibonacci } from "lucide-react";

export default function ConfluenceMap({ htfAnalysis, mtfAnalysis, m1Analysis }) {
  if (!htfAnalysis && !mtfAnalysis && !m1Analysis) return null;

  const parsePrice = (value) => {
    if (value == null) return null;
    const text = String(value).trim();
    if (!text) return null;
    if (/unknown|unclear|\?|^\s*[—–-]$/i.test(text)) return null;
    const matches = text.match(/-?\d+(?:\.\d+)?/g);
    if (!matches || matches.length === 0) return null;
    const nums = matches.map(Number);
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };

  const pricedZone = (fields) => {
    const zone = fields || {};
    const name = zone.name;
    const raw = zone.price;
    const parsed = parsePrice(raw);
    if (!name || parsed == null) return null;
    return { name, price: parsed, raw: raw ?? parsed, type: zone.type };
  };

  const getZones = (analysis, prefix) => {
    if (!analysis) return [];
    const zones = [];

    const ob = analysis.order_block;
    if (ob?.present) {
      const obZone = pricedZone({ name: `${prefix} OB`, price: ob.range_low ?? ob.range_high, type: "demand" });
      if (obZone) zones.push({ ...obZone, direction: ob.trend?.direction?.toLowerCase() || "unknown" });
    }

    if (analysis.fvg?.open_fvgs?.length) {
      analysis.fvg.open_fvgs.forEach((fvg, i) => {
        const fvgZone = pricedZone({ name: `${prefix} FVG ${i + 1}`, price: fvg.nearest_below ?? fvg.nearest_above, type: "gap" });
        if (fvgZone) zones.push(fvgZone);
      });
    }

    if (analysis.liquidity) {
      const liquidityZone = (suffix, price, type) => {
        const z = pricedZone({ name: `${prefix} ${suffix}`, price, type });
        if (z) zones.push(z);
      };
      liquidityZone("SSL", analysis.liquidity.ssl_location, "supply");
      liquidityZone("BSL", analysis.liquidity.bsl_location, "demand");
    }

    if (analysis.inducement?.present) {
      const ind = pricedZone({ name: `${prefix} Inducement`, price: analysis.inducement.location, type: "inducement" });
      if (ind) zones.push(ind);
    }

    return zones;
  };

  const htfZones = htfAnalysis ? getZones(htfAnalysis, "HTF") : [];
  const mtfZones = mtfAnalysis ? getZones(mtfAnalysis, "MTF") : [];
  const m1Zones = m1Analysis ? getZones(m1Analysis, "M1") : [];

  // Find converging zones (same price range across timeframes)
  const converging = [];
  const allZones = [...htfZones, ...mtfZones, ...m1Zones];

  const priceGroups = {};
  allZones.forEach((z) => {
    const parsed = parsePrice(z.price);
    if (parsed == null) return;
    const key = Math.round(parsed);
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
            <div key={z.name} className="text-[9px] text-muted mb-1">{z.name}: {z.price}</div>
          ))}
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-main">MTF Zones</p>
          {mtfZones.slice(0, 3).map((z) => (
            <div key={z.name} className="text-[9px] text-muted mb-1">{z.name}: {z.price}</div>
          ))}
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-green-400">M1 Zones</p>
          {m1Zones.slice(0, 3).map((z) => (
            <div key={z.name} className="text-[9px] text-muted mb-1">{z.name}: {z.price}</div>
          ))}
        </div>
      </div>
    </div>
  );
}