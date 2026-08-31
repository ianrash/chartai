/**
 * tradeValidation.js - fixed to provide all exports required by App.jsx and TradeSetup.jsx
 * Restores missing exports that caused:
 *   "does not provide an export named 'calcRating' (at TradeSetup.jsx:4:10)"
 *   White screen / build failure with viteSingleFile
 */

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
  'C': 1.5,
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
  const distance = isBuy ? entry - stop : stop - entry;
  // distance should be positive (stop on correct side)
  const absDist = Math.abs(entry - stop);
  if (distance <= 0 && absDist !== 0) {
    // actually for BUY stop must be below entry, so entry - stop >0, for SELL stop above entry so stop - entry >0
    // above already handles, keep fallback
  }
  if (absDist > limits.maxSL) {
    return {
      valid: false,
      warning: `⚠ SL too wide — reduced to maximum ${limits.maxSL} ${limits.unit} allowed for this instrument`,
      adjusted: true,
    };
  }
  if (absDist < limits.minSL && absDist !== 0) {
    return {
      valid: false,
      warning: `⚠ SL too tight — stop hunt risk high — widened to minimum ${limits.minSL} ${limits.unit}`,
      adjusted: true,
    };
  }
  return { valid: true, warning: null, distance: absDist };
}

export function validateRR(entry, target, stop, isBuy, rating, exec) {
  if (!entry || !target || !stop) return { valid: false, warning: null };
  let effEntry = Number(entry);
  if (isNaN(effEntry) && exec) effEntry = parseEntry(exec, isBuy);
  const effTarget = Number(target);
  const effStop = Number(stop);
  let rr;
  if (isBuy) {
    rr = (effTarget - effEntry) / (effEntry - effStop);
  } else {
    rr = (effStop - effEntry) / (effEntry - effTarget);
  }
  if (!isFinite(rr) || rr <= 0) return { valid: false, warning: `⚠ Invalid R:R`, rr: String(rr) };
  const minRR = RATING_RR_MINIMUMS[rating] || 2;
  if (rr < minRR) {
    return {
      valid: false,
      warning: `⚠ Valid R:R not achievable — consider skipping this setup`,
      rr: rr.toFixed(2),
    };
  }
  if (rr > 5) {
    return {
      valid: true,
      warning: `⚠ Extended R:R detected — ${rr.toFixed(1)}:1 may be unrealistic`,
      rr: rr.toFixed(2),
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
  const isBuy = trade.bias?.toUpperCase() === 'BUY';
  const entry = parseEntry(trade.execution, isBuy);
  const stop = parseFloat(String(trade.execution.stop).replace(/,/g, ''));
  const target = parseFloat(String(trade.execution.target).replace(/,/g, ''));
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
  const rrCheck = validateRR(entry, target, stop, isBuy, rating, trade.execution);
  if (!rrCheck.valid && rrCheck.warning) {
    results.warnings.push(rrCheck.warning);
    results.valid = false;
  } else if (rrCheck.warning) {
    results.warnings.push(rrCheck.warning);
  }
  return results;
}

// --- New exports required by current App.jsx / TradeSetup.jsx ---

/**
 * calcRating - maps confluence checklist to probability rating
 * Checklist is object of booleans. Score = % of true values.
 * 85%+ => A+, 70%+ => A, 50%+ => B, 30%+ => C, else F
 */
export function calcRating(checklist) {
  if (!checklist || typeof checklist !== 'object' || Array.isArray(checklist)) return 'F';
  const values = Object.values(checklist);
  if (values.length === 0) return 'F';
  const trueCount = values.filter((v) => v === true || v === 'true' || v === 1 || v === '1').length;
  const score = Math.round((trueCount / values.length) * 100);
  if (score >= 85) return 'A+';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'F';
}

function parsePriceSafe(val) {
  if (val == null) return NaN;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/,/g, '').trim();
  const nums = str.match(/[\d]+\.?[\d]*/g);
  if (!nums || nums.length === 0) return NaN;
  return parseFloat(nums[0]);
}

function parseEntry(exec, isBuy) {
  if (exec.entry != null) {
    const e = parsePriceSafe(exec.entry);
    if (!isNaN(e)) return e;
  }
  if (exec.entry_zone != null) {
    const zone = String(exec.entry_zone).replace(/,/g, '').trim();
    const parts = zone.split(/[–\-]/).map(s => parseFloat(s.trim()));
    const a = parts[0], b = parts[1];
    if (!isNaN(a) && !isNaN(b)) return isBuy ? Math.max(a, b) : Math.min(a, b);
    if (!isNaN(a)) return a;
    if (!isNaN(b)) return b;
  }
  return NaN;
}

/**
 * computeAndEnforceRR - ensures trade's R:R meets minimum for rating.
 * If RR < min, extends target to meet min RR and adds warning fields
 * expected by TradeSetup.jsx: execution.risk_reward, r_multiple, rr_warning, extended_target, rr_adjusted
 */
export function computeAndEnforceRR(trade, rating) {
  if (!trade || !trade.execution) return trade;
  const exec = { ...trade.execution };
  const isBuy = trade.bias?.toUpperCase() === 'BUY';
  const entry = parseEntry(exec, isBuy);
  const stop = parsePriceSafe(exec.stop);
  let target = parsePriceSafe(exec.target);

  // If any price is NaN, cannot compute - leave RR as parsed from AI (or "—")
  if (isNaN(entry) || isNaN(stop) || isNaN(target)) return trade;

  const stopDist = Math.abs(entry - stop);
  if (stopDist === 0) return trade;

  let rr;
  if (isBuy) {
    rr = (target - entry) / (entry - stop);
  } else {
    rr = (stop - entry) / (entry - target);
  }
  if (!isFinite(rr) || rr <= 0) return trade;
  const minRR = RATING_RR_MINIMUMS[rating] || RATING_RR_MINIMUMS['B'];

  // Always overwrite with the recomputed value (trust our numbers, not the AI's)
  exec.risk_reward = `1:${rr.toFixed(2)}`;
  exec.r_multiple = Number(rr.toFixed(2));

  // Already meets requirement
  if (rr >= minRR && rr <= 5) {
    return { ...trade, execution: exec };
  }

  if (rr < minRR) {
    // Extend target to meet min RR
    const direction = isBuy ? 1 : -1;
    // For BUY: target = entry + stopDist * minRR, for SELL: target = entry - stopDist * minRR
    const newTarget = entry + direction * stopDist * minRR;
    exec.extended_target = String(newTarget.toFixed(2));
    exec.rr_warning = `R:R ${rr.toFixed(2)}:1 below ${rating} minimum ${minRR}:1 — target extended to ${exec.extended_target} to enforce ${minRR}:1`;
    exec.rr_adjusted = true;
    exec.risk_reward = `1:${minRR.toFixed(2)}`;
    exec.r_multiple = Number(minRR.toFixed(2));
    // keep original target but surface extended
    // also set sl_warning if needed
    return { ...trade, execution: exec };
  }

  if (rr > 5) {
    exec.rr_warning = `Extended R:R ${rr.toFixed(2)}:1 — may be unrealistic`;
    exec.risk_reward = `1:${rr.toFixed(2)}`;
    exec.r_multiple = Number(rr.toFixed(2));
    return { ...trade, execution: exec };
  }

  return { ...trade, execution: exec };
}

/**
 * calculateAccountGuard - reactive risk guard used in TradeSetup.jsx
 * Returns object expected by UI:
 * { status: 'safe'|'over_risking'|'wipeout_risk', idealLotSize, riskAmountDollars, minLotRiskDollars, minLotRiskPercent, statusMessage, guardedStop, guardedTarget, guardedRR }
 */
export function calculateAccountGuard({ accountBalance, riskPercent, entry, stop, target, isBuy, instrument, symbol }) {
  const balance = Number(accountBalance);
  const riskPct = Number(riskPercent);
  if (!balance || !riskPct || isNaN(entry) || isNaN(stop)) {
    return { status: 'error', statusMessage: 'Invalid account or price data' };
  }

  const riskAmountDollars = (balance * riskPct) / 100;
  const stopDistance = Math.abs(entry - stop);
  if (stopDistance === 0) {
    return { status: 'error', statusMessage: 'Stop distance is zero' };
  }

  // Estimate pip/value per lot - simplified
  // For forex ~ $10 per pip per lot, for indices/gold/crypto use scaled values
  const inst = detectInstrument(instrument, symbol);
  let valuePerPointPerLot = 10; // default forex
  const limits = getInstrumentLimits(instrument, symbol);
  if (limits.type === 'crypto') valuePerPointPerLot = 1;
  else if (limits.type === 'index') valuePerPointPerLot = 2;
  else if (inst && inst.includes('GOLD')) valuePerPointPerLot = 5;

  // Heuristic: price distance -> pips/points. For forex 1.0000 -> 1 pip = 0.0001, so distance 0.0010 = 10 pips
  // We approximate pipDistance = stopDistance * (entry > 100 ? 1 : 10000)
  let pipDistance;
  if (entry > 1000) pipDistance = stopDistance; // gold/btc etc treat as points
  else if (entry > 100) pipDistance = stopDistance * 100; // indices
  else pipDistance = stopDistance * 10000; // forex

  if (pipDistance < 0.1) pipDistance = stopDistance * 1000; // fallback

  const riskPerLot = pipDistance * valuePerPointPerLot;
  const riskPer01Lot = riskPerLot * 0.01;

  // Ideal lot size to risk exactly riskAmountDollars
  let idealLotSize = riskPerLot > 0 ? riskAmountDollars / riskPerLot : 0;
  idealLotSize = Math.max(0.01, Math.min(100, idealLotSize));
  // Round to 2 decimals
  idealLotSize = Math.round(idealLotSize * 100) / 100;

  const minLotRiskDollars = riskPer01Lot;
  const minLotRiskPercent = balance > 0 ? Number(((minLotRiskDollars / balance) * 100).toFixed(2)) : 0;

  let status;
  let statusMessage;

  if (minLotRiskDollars > riskAmountDollars * 3) {
    status = 'wipeout_risk';
    statusMessage = `Even minimum 0.01 lots risks $${minLotRiskDollars.toFixed(2)} (${minLotRiskPercent}% of account) — exceeds your ${riskPct}% limit by 3x. Tighten SL or reduce exposure.`;
  } else if (minLotRiskDollars > riskAmountDollars) {
    status = 'over_risking';
    statusMessage = `Minimum 0.01 lots risks $${minLotRiskDollars.toFixed(2)} (${minLotRiskPercent}%) — above your $${riskAmountDollars.toFixed(2)} (${riskPct}%) limit. SL will be auto-tightened.`;
  } else {
    status = 'safe';
    statusMessage = `Risk is controlled — ${idealLotSize.toFixed(2)} lots risks $${riskAmountDollars.toFixed(2)} (${riskPct}%). Stop distance ${pipDistance.toFixed(1)} pips.`;
  }

  // Guarded levels - tighten SL so 0.01 lots = exactly riskAmountDollars
  let guardedStop;
  let guardedTarget;
  let guardedRR;
  if (status !== 'safe') {
    // Solve for stop distance that makes 0.01 lots = riskAmount
    // riskPer01Lot = pipDistance * valuePerPointPerLot *0.01 => pipDistanceGuarded = riskAmount / (valuePerPointPerLot*0.01)
    const guardedPipDist = riskAmountDollars / (valuePerPointPerLot * 0.01);
    let guardedDistPrice;
    if (entry > 1000) guardedDistPrice = guardedPipDist;
    else if (entry > 100) guardedDistPrice = guardedPipDist / 100;
    else guardedDistPrice = guardedPipDist / 10000;
    if (guardedDistPrice < 0.00001) guardedDistPrice = guardedPipDist / 1000;

    guardedStop = isBuy ? entry - guardedDistPrice : entry + guardedDistPrice;
    guardedStop = Number(guardedStop.toFixed(5));
    // Preserve original RR if target exists
    if (target && !isNaN(target) && stopDistance > 0) {
      const originalRR = Math.abs(target - entry) / stopDistance;
      guardedRR = originalRR;
      const tgtDistGuarded = guardedDistPrice * originalRR;
      guardedTarget = isBuy ? entry + tgtDistGuarded : entry - tgtDistGuarded;
      guardedTarget = Number(guardedTarget.toFixed(5));
    }
  }

  return {
    status,
    statusMessage,
    idealLotSize,
    riskAmountDollars,
    minLotRiskDollars,
    minLotRiskPercent,
    guardedStop,
    guardedTarget,
    guardedRR,
  };
}

/**
 * postProcessAnalysis - called in App.jsx:343 after AI returns data
 * Ensures confluence_score, probability_rating, and trade_setup are normalized
 */
export function postProcessAnalysis(data) {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };

  // Ensure confluence_score from checklist if missing
  if (out.confluence_score == null && out.confluence_checklist) {
    const vals = Object.values(out.confluence_checklist);
    if (vals.length > 0) {
      const trueCount = vals.filter((v) => v === true || v === 'true' || v === 1).length;
      out.confluence_score = Math.round((trueCount / vals.length) * 100);
    }
  }

  // Ensure probability_rating from checklist if missing
  if (!out.probability_rating && out.confluence_checklist) {
    out.probability_rating = calcRating(out.confluence_checklist);
  }

  // Normalize trade_setup if exists - enforce RR
  if (out.trade_setup && out.trade_setup.bias && out.trade_setup.bias !== 'WAIT') {
    const rating = out.probability_rating || calcRating(out.confluence_checklist);
    out.trade_setup = computeAndEnforceRR(out.trade_setup, rating);
  }

  // Ensure key_levels defaults to avoid UI crashes
  if (!out.key_levels) out.key_levels = {};
  if (!out.htf_analysis) out.htf_analysis = {};
  if (!out.mtf_analysis) out.mtf_analysis = {};

  return out;
}

// Default export for compatibility if someone imports default
export default {
  calcRating,
  calculateAccountGuard,
  computeAndEnforceRR,
  postProcessAnalysis,
  validateSL,
  validateRR,
  validateTradeSetup,
};
