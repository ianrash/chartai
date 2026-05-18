import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

export default function BiasStrengthMeter({ htfAnalysis, overallTrend }) {
  if (!htfAnalysis?.trend) {
    return null;
  }

  const direction = htfAnalysis.trend.direction || 'Neutral';
  const valuation = htfAnalysis.trend.valuation || 'Standard';
  
  // Calculate strength based on multiple factors
  let strength = 50; // 0-100, 50 = neutral
  
  // From trend direction
  if (direction === 'Bullish') strength += 30;
  else if (direction === 'Bearish') strength -= 30;
  
  // From valuation (Premium = stronger bias, Discount = weaker)
  if (valuation === 'Premium') {
    if (direction === 'Bullish') strength += 10;
    else if (direction === 'Bearish') strength -= 10;
  } else if (valuation === 'Discount') {
    if (direction === 'Bullish') strength -= 10;
    else if (direction === 'Bearish') strength += 10;
  }
  
  // From structure - BOS indicates strong trending move
  if (htfAnalysis.trend?.structure_details?.toLowerCase().includes('bos')) {
    if (direction === 'Bullish') strength += 10;
    else if (direction === 'Bearish') strength -= 10;
  }
  
  // Clamp 0-100
  strength = Math.max(0, Math.min(100, strength));
  
  // Color interpolation
  const getColor = (val) => {
    if (val < 35) return 'var(--bearish)';
    if (val > 65) return 'var(--bullish)';
    return 'var(--neutral)';
  };
  
  const getLabel = (val) => {
    if (val < 20) return 'Strong Bearish';
    if (val < 35) return 'Bearish';
    if (val < 45) return 'Weak Bearish';
    if (val < 55) return 'Neutral';
    if (val < 65) return 'Weak Bullish';
    if (val < 80) return 'Bullish';
    return 'Strong Bullish';
  };

  const isBullish = strength > 50;
  const isBearish = strength < 50;
  const bgColor = getColor(strength);
  const label = getLabel(strength);

  return (
    <div className="card border-l-4 border-[#8b5cf6] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[#8b5cf6]" />
          <span className="label">HTF Bias Strength</span>
        </div>
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ color: bgColor, backgroundColor: `${bgColor}15`, border: `1px solid ${bgColor}33` }}
        >
          {direction === 'Bullish' ? <TrendingUp size={10} /> : direction === 'Bearish' ? <TrendingDown size={10} /> : <Minus size={10} />}
          {label}
        </div>
      </div>

      {/* Strength Bar */}
      <div className="relative">
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
          {/* Gradient background */}
          <div 
            className="h-full w-full"
            style={{
              background: 'linear-gradient(90deg, var(--bearish) 0%, var(--neutral) 50%, var(--bullish) 100%)',
              opacity: 0.3
            }}
          />
          {/* Active fill */}
          <div 
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.abs(strength - 50) * 2}%`,
              background: isBullish ? 'var(--bullish)' : isBearish ? 'var(--bearish)' : 'var(--neutral)',
              left: isBullish ? '50%' : `${100 - (strength)}%`
            }}
          />
        </div>
        
        {/* Center line */}
        <div 
          className="absolute top-0 left-1/2 w-0.5 h-3 -translate-x-1/2"
          style={{ background: 'var(--text-secondary)', opacity: 0.5 }}
        />
        
        {/* Position marker */}
        <div 
          className="absolute top-0 w-4 h-3 -translate-x-1/2 rounded-full transition-all duration-500"
          style={{ 
            left: `${strength}%`,
            background: bgColor,
            boxShadow: `0 0 8px ${bgColor}`
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <TrendingDown size={10} /> Bearish
        </span>
        <span>Neutral</span>
        <span className="flex items-center gap-1">
          Bullish <TrendingUp size={10} />
        </span>
      </div>

      {/* Strength percentage */}
      <div className="text-center">
        <span 
          className="text-lg font-bold font-display"
          style={{ color: bgColor }}
        >
          {direction === 'Neutral' ? '—' : `${Math.abs(strength - 50) * 2}%`}
        </span>
        <span className="text-xs text-muted ml-1">strength</span>
      </div>

      {/* Additional context */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>Valuation:</span>
        <span 
          className="px-2 py-0.5 rounded"
          style={{ 
            background: valuation === 'Premium' ? 'var(--bullish-glow)' : valuation === 'Discount' ? 'var(--bearish-glow)' : 'var(--accent-glow)',
            color: valuation === 'Premium' ? 'var(--bullish)' : valuation === 'Discount' ? 'var(--bearish)' : 'var(--accent)'
          }}
        >
          {valuation}
        </span>
        {htfAnalysis.trend?.structure_details && (
          <>
            <span className="ml-2">Structure:</span>
            <span className="text-main">{htfAnalysis.trend.structure_details.split('.')[0]}</span>
          </>
        )}
      </div>
    </div>
  );
}