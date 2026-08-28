/**
 * Position Size Calculator Utilities
 * Handles lot size, margin, and pip value calculations for different instruments
 */

import { detectInstrument, INSTRUMENT_LIMITS } from '../api/tradeValidation';

// Standard contract sizes per instrument type
const CONTRACT_SIZES = {
  forex: 100000,    // Standard lot for forex
  crypto: 1,        // 1 BTC for BTCUSD
  index: 1,         // 1 contract for indices
  metal: 100,       // 100 oz for XAUUSD
};

// Pip/point values per standard lot
const PIP_VALUES = {
  forex: 10,       // $10 per pip for major forex pairs
  crypto: 0.01,     // $0.01 per pip for BTCUSD (pip 0.01 × 1 BTC contract)
  index: 1,        // $1 per point for indices (varies by broker)
  metal: 1,        // $1 per pip for metals
};

// Special pip values for specific instruments
const SPECIAL_PIP_VALUES = {
  XAUUSD: 1,        // Gold: $1 per pip (100 oz = 1 lot)
  XAUUSDGOLD: 1,
  GOLD: 1,
  US500: 0.5,       // S&P500: $0.50 per point
  SP500: 0.5,
  SPX: 0.5,
  US30: 1,          // Dow: $1 per point
  DOW: 1,
  DJI: 1,
  US100: 0.25,      // Nasdaq: $0.25 per point
  NASDAQ: 0.25,
  NDX: 0.25,
  EURGBP: 13,       // ~$13/pip for USD account (10 GBP × ~1.30 GBPUSD)
};

/**
 * Get the instrument type (forex, crypto, index)
 */
export function getInstrumentType(instrument, symbol) {
  const key = detectInstrument(instrument, symbol);
  if (key && INSTRUMENT_LIMITS[key]) {
    return INSTRUMENT_LIMITS[key].type;
  }
  return 'forex'; // default
}

/**
 * Get pip/point value for an instrument
 */
export function getPipValue(instrument, symbol) {
  const key = detectInstrument(instrument, symbol);
  if (key && SPECIAL_PIP_VALUES[key] !== undefined) {
    return SPECIAL_PIP_VALUES[key];
  }
  const type = getInstrumentType(instrument, symbol);
  return PIP_VALUES[type] || 10;
}

/**
 * Get contract size for an instrument
 */
export function getContractSize(instrument, symbol) {
  const key = detectInstrument(instrument, symbol);
  if (key && INSTRUMENT_LIMITS[key]) {
    const type = INSTRUMENT_LIMITS[key].type;
    return CONTRACT_SIZES[type] || 100000;
  }
  return 100000;
}

// Minimum price increment (1 pip/point in price terms) per instrument type
const PIP_SIZES = {
  forex: 0.0001,
  metal: 0.01,
  crypto: 0.01,
  index: 0.1,
};

/**
 * Get pip/point size in price terms for an instrument
 * e.g. EURUSD → 0.0001 (1 pip), USDJPY → 0.01, XAUUSD → 0.01
 */
export function getPipSize(instrument, symbol) {
  const key = detectInstrument(instrument, symbol);
  const type = key && INSTRUMENT_LIMITS[key] ? INSTRUMENT_LIMITS[key].type : 'forex';

  if (type === 'forex') {
    const name = (key || instrument || '').toUpperCase();
    if (name.includes('JPY') || name.includes('HKD')) {
      return 0.01;
    }
  }

  return PIP_SIZES[type] || 0.0001;
}

/**
 * Get the unit type (pips vs points)
 */
export function getUnitType(instrument, symbol) {
  const key = detectInstrument(instrument, symbol);
  if (key && INSTRUMENT_LIMITS[key]) {
    return INSTRUMENT_LIMITS[key].unit;
  }
  return 'pips';
}

/**
 * Calculate position size in lots
 * @param {number} accountBalance - Account balance in account currency
 * @param {number} riskPercent - Risk percentage (e.g., 2 for 2%)
 * @param {number} stopLossPips - Stop loss in pips/points
 * @param {string} instrument - Instrument symbol (e.g., "EURUSD", "XAUUSD")
 * @param {number} leverage - Leverage ratio (e.g., 100 for 1:100)
 * @returns {object} Position size calculation results
 */
export function calculatePositionSize(accountBalance, riskPercent, stopLossPips, instrument) {
  // Validate inputs
  if (!accountBalance || accountBalance <= 0) {
    return { error: 'Invalid account balance' };
  }
  if (!riskPercent || riskPercent <= 0 || riskPercent > 10) {
    return { error: 'Risk percentage must be between 0.1% and 10%' };
  }
  if (!stopLossPips || stopLossPips <= 0) {
    return { error: 'Stop loss must be greater than 0' };
  }

  // Calculate risk amount in account currency
  const riskAmount = accountBalance * (riskPercent / 100);

  // Get pip value for this instrument
  const pipValue = getPipValue(instrument, instrument);

  // Calculate lot size
  // Lot Size = Risk Amount / (Stop Loss Pips × Pip Value)
  let lotSize = riskAmount / (stopLossPips * pipValue);

  // Round down to 2 decimal places for safety
  lotSize = Math.floor(lotSize * 100) / 100;

  // Minimum lot size check
  if (lotSize < 0.01) {
    return {
      error: 'Position too small. Try increasing risk % or reducing stop loss.',
      lotSize: 0,
      riskAmount,
      pipValue,
    };
  }

  // Maximum lot size check (reasonable cap)
  const maxLots = 100;
  if (lotSize > maxLots) {
    lotSize = maxLots;
  }

  return {
    lotSize,
    riskAmount,
    riskPercent,
    stopLossPips,
    pipValue,
    unit: getUnitType(instrument),
    instrument: instrument || 'Unknown',
  };
}

/**
 * Calculate margin required for a position
 * @param {number} lotSize - Position size in lots
 * @param {number} entryPrice - Entry price
 * @param {number} leverage - Leverage ratio
 * @param {string} instrument - Instrument symbol
 * @returns {number} Required margin in account currency
 */
export function calculateMargin(lotSize, entryPrice, leverage = 100, instrument) {
  if (!lotSize || lotSize <= 0 || !entryPrice || entryPrice <= 0) {
    return 0;
  }
  if (!leverage || leverage <= 0) return 0;

  const contractSize = getContractSize(instrument);

  const margin = (lotSize * contractSize * entryPrice) / leverage;

  return Math.round(margin * 100) / 100;
}

/**
 * Calculate all position metrics
 * @param {object} params - Calculation parameters
 * @returns {object} Complete calculation results
 */
export function calculateAll(params) {
  const {
    accountBalance = 10000,
    riskPercent = 2,
    stopLossPips = 30,
    entryPrice = 0,
    leverage = 100,
    instrument = 'EURUSD',
    symbol = '',
  } = params;

  const position = calculatePositionSize(
    accountBalance,
    riskPercent,
    stopLossPips,
    instrument
  );

  if (position.error) {
    return {
      ...position,
      margin: 0,
      pipValue: getPipValue(instrument, symbol),
      unit: getUnitType(instrument, symbol),
    };
  }

  const margin = entryPrice > 0
    ? calculateMargin(position.lotSize, entryPrice, leverage, instrument)
    : 0;

  return {
    ...position,
    margin,
    leverage,
    entryPrice,
  };
}

/**
 * List of supported instruments for dropdown
 */
export const SUPPORTED_INSTRUMENTS = [
  { value: 'XAUUSD', label: 'XAUUSD (Gold)', category: 'Metals' },
  { value: 'XAUUSDGOLD', label: 'XAUUSD (Gold)', category: 'Metals' },
  { value: 'GOLD', label: 'Gold', category: 'Metals' },
  { value: 'BTCUSD', label: 'BTCUSD (Bitcoin)', category: 'Crypto' },
  { value: 'BTCUSDT', label: 'BTCUSDT', category: 'Crypto' },
  { value: 'EURUSD', label: 'EURUSD', category: 'Forex' },
  { value: 'GBPUSD', label: 'GBPUSD', category: 'Forex' },
  { value: 'EURGBP', label: 'EURGBP', category: 'Forex' },
  { value: 'US500', label: 'US500 (S&P500)', category: 'Indices' },
  { value: 'SP500', label: 'SP500 (S&P500)', category: 'Indices' },
  { value: 'US30', label: 'US30 (Dow Jones)', category: 'Indices' },
  { value: 'DOW', label: 'DOW (Dow Jones)', category: 'Indices' },
  { value: 'US100', label: 'US100 (Nasdaq)', category: 'Indices' },
  { value: 'NASDAQ', label: 'NASDAQ', category: 'Indices' },
];

/**
 * Leverage options
 */
export const LEVERAGE_OPTIONS = [10, 20, 50, 100, 200, 500];