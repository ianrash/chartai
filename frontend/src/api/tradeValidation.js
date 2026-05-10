export const INSTRUMENT_LIMITS = {
  XAUUSD: { maxSL: 150, minSL: 80, unit: 'pips', type: 'forex' },
  XAUUSDGOLD: { maxSL: 150, minSL: 80, unit: 'pips', type: 'forex' },
  GOLD: { maxSL: 150, minSL: 80, unit: 'pips', type: 'forex' },
  BTCUSD: { maxSL: 300, minSL: 150, unit: 'pips', type: 'crypto' },
  BTCUSDT: { maxSL: 300, minSL: 150, unit: 'pips', type: 'crypto' },
  BTC: { maxSL: 300, minSL: 150, unit: 'pips', type: 'crypto' },
  US500: { maxSL: 15, minSL: 8, unit: 'points', type: 'index' },
  SP500: { maxSL: 15, minSL: 8, unit: 'points', type: 'index' },
  SPX: { maxSL: 15, minSL: 8, unit: 'points', type: 'index' },
  US30: { maxSL: 80, minSL: 40, unit: 'points', type: 'index' },
  DOW: { maxSL: 80, minSL: 40, unit: 'points', type: 'index' },
  DJI: { maxSL: 80, minSL: 40, unit: 'points', type: 'index' },
  EURUSD: { maxSL: 30, minSL: 15, unit: 'pips', type: 'forex' },
  GBPUSD: { maxSL: 30, minSL: 15, unit: 'pips', type: 'forex' },
  EURGBP: { maxSL: 30, minSL: 15, unit: 'pips', type: 'forex' },
  US100: { maxSL: 25, minSL: 12, unit: 'points', type: 'index' },
  NASDAQ: { maxSL: 25, minSL: 12, unit: 'points', type: 'index' },
  NDX: { maxSL: 25, minSL: 12, unit: 'points', type: 'index' },
};

export const RATING_RR_MINIMUMS = {
  'A+': 3,
  'A': 2.5,
  'B': 2,
  'C': 2,
  'F': 999,
};

export function detectInstrument(instrument, symbol) {
  const check = (instrument || symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  for (const key of Object.keys(INSTRUMENT_LIMITS)) {
    if (check.includes(key)) return key;
  }
  return null;
}

export function getInstrumentLimits(instrument, symbol) {
  const key = detectInstrument(instrument, symbol);
  return INSTRUMENT_LIMITS[key] || INSTRUMENT_LIMITS.EURUSD;
}

export function validateSL(entry, stop, isBuy, instrument, symbol) {
  const limits = getInstrumentLimits(instrument, symbol);
  if (!entry || !stop) return { valid: false, warning: null };
  
  const distance = isBuy ? stop - entry : entry - stop;
  if (distance <= 0) return { valid: false, warning: 'Invalid SL direction' };
  
  if (distance > limits.maxSL) {
    return {
      valid: false,
      warning: `⚠ SL too wide — reduced to maximum ${limits.maxSL} ${limits.unit} allowed for this instrument`,
      adjusted: true
    };
  }
  
  if (distance < limits.minSL) {
    return {
      valid: false,
      warning: `⚠ SL too tight — stop hunt risk high — widened to minimum ${limits.minSL} ${limits.unit}`,
      adjusted: true
    };
  }
  
  return { valid: true, warning: null, distance };
}

export function validateRR(entry, target, stop, isBuy, rating) {
  if (!entry || !target || !stop) return { valid: false, warning: null };
  
  // const isSell = !isBuy;
  let rr;
  if (isBuy) {
    rr = (target - entry) / (entry - stop);
  } else {
    rr = (entry - target) / (stop - entry);
  }
  
  const minRR = RATING_RR_MINIMUMS[rating] || 2;
  
  if (rr < minRR) {
    return {
      valid: false,
      warning: `⚠ Valid R:R not achievable — consider skipping this setup`,
      rr: rr.toFixed(2)
    };
  }
  
  if (rr > 5) {
    return {
      valid: true,
      warning: `⚠ Extended R:R detected — ${rr.toFixed(1)}:1 may be unrealistic`,
      rr: rr.toFixed(2)
    };
  }
  
  return { valid: true, warning: null, rr: rr.toFixed(2) };
}

export function validateTradeSetup(trade, instrument, symbol, rating) {
  const results = { valid: true, warnings: [] };
  
  if (!trade?.execution) {
    results.valid = false;
    results.warnings.push('No trade execution data');
    return results;
  }
  
  // Fix NaN handling in parseFloat - add isNaN checks
  const entryRaw = trade.execution.entry || trade.execution.entry_zone?.split('-')[0];
  const entry = parseFloat(entryRaw);
  const stop = parseFloat(trade.execution.stop);
  const target = parseFloat(trade.execution.target);
  const isBuy = trade.bias?.toUpperCase() === 'BUY';

  // Handle NaN values from parseFloat
  if (isNaN(entry)) {
    results.valid = false;
    results.warnings.push('Invalid entry price');
    return results;
  }
  if (isNaN(stop)) {
    results.valid = false;
    results.warnings.push('Invalid stop loss price');
    return results;
  }
  if (isNaN(target)) {
    results.valid = false;
    results.warnings.push('Invalid target price');
    return results;
  }
  
  const slCheck = validateSL(entry, stop, isBuy, instrument, symbol);
  if (!slCheck.valid && slCheck.warning) {
    results.warnings.push(slCheck.warning);
    results.valid = false;
  }
  
  const rrCheck = validateRR(entry, target, stop, isBuy, rating);
  if (!rrCheck.valid && rrCheck.warning) {
    results.warnings.push(rrCheck.warning);
    results.valid = false;
  } else if (rrCheck.warning) {
    results.warnings.push(rrCheck.warning);
  }
  
  return results;
}
