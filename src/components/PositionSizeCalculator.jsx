import { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingDown, AlertCircle, DollarSign, Settings2, Layers, ArrowRight, Target } from 'lucide-react';
import { calculateAll, getContractSize, getPipSize, SUPPORTED_INSTRUMENTS, LEVERAGE_OPTIONS } from '../utils/positionSize';
import { detectInstrument } from '../api/tradeValidation';

export default function PositionSizeCalculator({ trade, instrument: propInstrument, globalAccountBalance, globalRiskPercent, onAccountBalanceChange, onRiskPercentChange }) {
  const [accountBalance, setAccountBalanceLocal] = useState(globalAccountBalance ?? 10000);
  const [riskPercent, setRiskPercentLocal] = useState(globalRiskPercent ?? 2);
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [leverage, setLeverage] = useState(100);
  const [instrument, setInstrument] = useState('EURUSD');
  const [showDetails, setShowDetails] = useState(false);

  // Auto-fill from trade setup when available
  useEffect(() => {
    if (trade?.execution) {
      const exec = trade.execution;

      if (exec.entry || exec.entry_zone) {
        const entryStr = exec.entry || exec.entry_zone;
        const entryNum = parseFloat(entryStr.toString().replace(/[^0-9.]/g, ''));
        if (!isNaN(entryNum) && entryNum > 0) {
          setEntryPrice(entryNum);
        }
      }

      if (exec.stop) {
        const stopNum = parseFloat(exec.stop.toString().replace(/[^0-9.]/g, ''));
        if (!isNaN(stopNum) && stopNum > 0) {
          setStopLossPrice(stopNum);
        }
      }

      if (exec.target) {
        const targetNum = parseFloat(exec.target.toString().replace(/[^0-9.]/g, ''));
        if (!isNaN(targetNum) && targetNum > 0) {
          setTakeProfitPrice(targetNum);
        }
      }
    }
  }, [trade]);

  // Try to detect instrument from prop or trade
  useEffect(() => {
    if (propInstrument) {
      const detected = detectInstrument(propInstrument);
      if (detected) setInstrument(detected);
    } else if (trade?.instrument_detected) {
      const detected = detectInstrument(trade.instrument_detected);
      if (detected) setInstrument(detected);
    }
  }, [propInstrument, trade]);

  const parsedEntry = entryPrice ? parseFloat(entryPrice) : 0;
  const parsedSL = stopLossPrice ? parseFloat(stopLossPrice) : 0;
  const parsedTP = takeProfitPrice ? parseFloat(takeProfitPrice) : 0;

  const pipSize = getPipSize(instrument);

  const slPips = parsedEntry > 0 && parsedSL > 0
    ? Math.abs(parsedEntry - parsedSL) / pipSize
    : 0;

  const tpDistance = parsedEntry > 0 && parsedTP > 0
    ? Math.abs(parsedTP - parsedEntry) / pipSize
    : 0;

  const rrRatio = slPips > 0 ? (tpDistance / slPips) : 0;

  const results = useMemo(() => {
    return calculateAll({
      accountBalance,
      riskPercent,
      stopLossPips: slPips > 0 ? slPips : (parsedEntry > 0 && parsedSL > 0 ? slPips : 30),
      entryPrice: isNaN(parsedEntry) ? 0 : parsedEntry,
      leverage,
      instrument,
    });
  }, [accountBalance, riskPercent, slPips, parsedEntry, leverage, instrument]);

  // Sync local state with global props when they change externally
  useEffect(() => {
    if (globalAccountBalance !== undefined && globalAccountBalance !== accountBalance) {
      setAccountBalanceLocal(globalAccountBalance);
    }
  }, [globalAccountBalance]);

  useEffect(() => {
    if (globalRiskPercent !== undefined && globalRiskPercent !== riskPercent) {
      setRiskPercentLocal(globalRiskPercent);
    }
  }, [globalRiskPercent]);

  // Wrap setters to also propagate to global parent
  const setAccountBalance = (val) => {
    setAccountBalanceLocal(val);
    if (onAccountBalanceChange) onAccountBalanceChange(val);
  };
  const setRiskPercent = (val) => {
    setRiskPercentLocal(val);
    if (onRiskPercentChange) onRiskPercentChange(val);
  };

  const handleInputChange = (setter) => (e) => {
    const value = e.target.value;
    if (value === '') {
      setter('');
    } else if (/^\d*\.?\d*$/.test(value)) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setter(num);
      }
    }
  };

  return (
    <div className="card flex flex-col gap-4 animate-fade-in-up mt-4">
      {/* Header */}
      <div className="card-header !mb-0">
        <div className="icon-tile icon-tile-accent !w-10 !h-10">
          <Calculator size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-main">
            Position Size Calculator
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Calculate lot size based on risk</p>
        </div>
      </div>

      {/* Input Grid */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Account Balance */}
          <div className="flex flex-col gap-1">
            <label className="label flex items-center gap-1">
              <DollarSign size={10} /> Account Balance
            </label>
            <input
              type="number"
              value={accountBalance}
              onChange={handleInputChange(setAccountBalance)}
              className="field"
              placeholder="10000"
              min="100"
              step="100"
            />
          </div>

          {/* Risk Percentage */}
          <div className="flex flex-col gap-1">
            <label className="label flex items-center gap-1">
              <TrendingDown size={10} /> Risk %
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={riskPercent}
                onChange={handleInputChange(setRiskPercent)}
                className="field flex-1"
                placeholder="2"
                min="0.1"
                max="10"
                step="0.1"
              />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>%</span>
            </div>
          </div>

          {/* Instrument */}
          <div className="flex flex-col gap-1">
            <label className="label flex items-center gap-1">
              <Layers size={10} /> Instrument
            </label>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="field"
            >
              <optgroup label="Metals">
                {SUPPORTED_INSTRUMENTS.filter(i => i.category === 'Metals').map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </optgroup>
              <optgroup label="Crypto">
                {SUPPORTED_INSTRUMENTS.filter(i => i.category === 'Crypto').map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </optgroup>
              <optgroup label="Forex">
                {SUPPORTED_INSTRUMENTS.filter(i => i.category === 'Forex').map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </optgroup>
              <optgroup label="Indices">
                {SUPPORTED_INSTRUMENTS.filter(i => i.category === 'Indices').map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Leverage */}
          <div className="flex flex-col gap-1">
            <label className="label flex items-center gap-1">
              <Settings2 size={10} /> Leverage
            </label>
            <select
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="field"
            >
              {LEVERAGE_OPTIONS.map(l => (
                <option key={l} value={l}>1:{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Entry / SL / TP Price Inputs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="label flex items-center gap-1">
              <ArrowRight size={10} /> Entry Price
            </label>
            <input
              type="number"
              value={entryPrice}
              onChange={handleInputChange(setEntryPrice)}
              className="field"
              placeholder="1.0850"
              step="0.0001"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="label flex items-center gap-1">
              <TrendingDown size={10} /> Stop Loss
            </label>
            <input
              type="number"
              value={stopLossPrice}
              onChange={handleInputChange(setStopLossPrice)}
              className="field"
              placeholder="1.0800"
              step="0.0001"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="label flex items-center gap-1">
              <Target size={10} /> Take Profit
            </label>
            <input
              type="number"
              value={takeProfitPrice}
              onChange={handleInputChange(setTakeProfitPrice)}
              className="field"
              placeholder="1.0950"
              step="0.0001"
            />
          </div>
        </div>

        {/* Computed SL pips and R:R */}
        {slPips > 0 && (
          <div className="flex items-center gap-4 mono text-xs tabular" style={{ color: 'var(--muted)' }}>
            <span>SL Distance: <strong style={{ color: 'var(--text-main)' }}>{slPips.toFixed(1)} {results.unit}</strong></span>
            {rrRatio > 0 && (
              <span>R:R <strong style={{ color: rrRatio >= 2 ? 'var(--bullish)' : 'var(--neutral)' }}>{rrRatio.toFixed(2)}</strong></span>
            )}
          </div>
        )}

        {/* Results Section */}
        <div className="mt-2">
          {results.error ? (
            <div className="p-4 rounded-xl border flex items-center gap-3" style={{ background: 'var(--bearish-glow)', borderColor: 'rgba(242,54,69,0.25)' }}>
              <AlertCircle size={18} className="tone-bearish flex-shrink-0" />
              <p className="text-sm tone-bearish">{results.error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Position Size - Primary Result */}
              <div className="col-span-2 sm:col-span-4 p-5 rounded-xl card-flat" style={{ background: 'var(--accent-glow)', borderColor: 'rgba(41,98,255,0.25)' }}>
                <p className="label mb-2" style={{ color: 'var(--accent)' }}>Position Size</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-main mono tabular">{results.lotSize?.toFixed(2) || '—'}</span>
                  <span className="text-sm font-medium text-secondary">lots</span>
                </div>
              </div>

              {/* Risk Amount */}
              <div className="card-flat flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: 'var(--bearish)' }}></div>
                <p className="label mb-1">Risk Amount</p>
                <p className="text-lg font-semibold mono tabular tone-bearish">${results.riskAmount?.toFixed(2) || '—'}</p>
              </div>

              {/* Margin Required */}
              <div className="card-flat flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: 'var(--accent)' }}></div>
                <p className="label mb-1">Margin Required</p>
                <p className="text-lg font-semibold mono tabular tone-accent">${results.margin?.toFixed(2) || '—'}</p>
              </div>

              {/* Pip Value */}
              <div className="card-flat flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: 'var(--neutral)' }}></div>
                <p className="label mb-1">Pip Value</p>
                <p className="text-sm font-semibold text-main mono tabular">${results.pipValue}/pip</p>
              </div>

              {/* Unit Type */}
              <div className="card-flat flex flex-col justify-center">
                <p className="label mb-1">Unit Type</p>
                <p className="text-sm font-semibold text-main capitalize">{results.unit}</p>
              </div>
            </div>
          )}
        </div>

        {/* Details Toggle */}
        {results.lotSize > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-ghost mx-auto"
          >
            {showDetails ? 'Hide calculation details' : 'Show calculation details'}
          </button>
        )}

        {/* Calculation Details */}
        {showDetails && results.lotSize > 0 && (
          <div className="card-flat mono text-xs tabular" style={{ color: 'var(--muted)' }}>
            <p className="mb-2 font-semibold" style={{ color: 'var(--text-main)' }}>Calculation:</p>
            <p>SL Pips = |{parsedEntry} - {parsedSL}| ÷ {pipSize} = {slPips.toFixed(1)} {results.unit}</p>
            {rrRatio > 0 && <p>R:R = {tpDistance.toFixed(1)} ÷ {slPips.toFixed(1)} = {rrRatio.toFixed(2)}</p>}
            <p>Risk Amount = ${accountBalance} × {riskPercent}% = ${results.riskAmount?.toFixed(2)}</p>
            <p>Lot Size = ${results.riskAmount?.toFixed(2)} ÷ ({slPips.toFixed(1)} {results.unit} × ${results.pipValue}/{results.unit}) = {results.lotSize?.toFixed(2)} lots</p>
            {parsedEntry > 0 && (
              <p>Margin = ({results.lotSize?.toFixed(2)} × {getContractSize(instrument).toLocaleString()} × ${parsedEntry}) ÷ {leverage}:1 = ${results.margin?.toFixed(2)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
