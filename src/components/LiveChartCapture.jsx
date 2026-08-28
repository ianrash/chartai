import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import html2canvas from "html2canvas";
import { createChart, CandlestickSeries, ColorType, CrosshairMode } from "lightweight-charts";
import { Camera, RefreshCw, Loader2, Search, Activity } from "lucide-react";

const MARKETS = [
  { id: 'crypto', label: 'Crypto' },
  { id: 'forex', label: 'Forex' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'indices', label: 'Indices' },
  { id: 'commodities', label: 'Commodities' },
];

const SYMBOLS = {
  crypto: [
    'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'SOLUSD', 'ADAUSD', 'DOGEUSD',
    'LTCUSD', 'LINKUSD', 'AVAXUSD', 'DOTUSD', 'UNIUSD', 'ATOMUSD', 'APTUSD',
    'ARBUSD', 'OPUSD', 'SUIUSD', 'TONUSD', 'TRXUSD', 'SHIBUSD', 'PEPEUSD',
    'NEARUSD', 'FILUSD', 'ETCUSD', 'XLMUSD', 'XMRUSD', 'AAVEUSD', 'MKRUSD',
    'SNXUSD', 'INJUSD', 'GRTUSD', 'SEIUSD', 'JUPUSD', 'WIFUSD', 'BONKUSD',
    'FLOKIUSD', 'RENDERUSD', 'TIAUSD', 'PENDLEUSD', 'ENSUSD', 'LDOUSD',
    'STXUSD', 'ORDIUSD', '1000SATSUSD', 'WLDUSD', 'CRVUSD', 'BLURUSD',
    'IMXUSD', 'ALGOUSD', 'VETUSD', 'XTZUSD', 'HBARUSD', 'ICPUSD',
  ],
  forex: [
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD',
    'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY',
    'EURAUD', 'EURCHF', 'EURCAD', 'EURNZD', 'GBPAUD', 'GBPCAD', 'GBPCHF',
    'AUDCAD', 'AUDCHF', 'AUDNZD', 'CADCHF', 'EURHUF', 'EURTRY', 'EURSEK',
    'USDMXN', 'USDZAR', 'USDTRY', 'USDSGD', 'USDHKD', 'USDNOK', 'USDSEK',
    'SGDJPY', 'NOKJPY',
  ],
  stocks: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'NFLX',
    'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'CSCO', 'QCOM', 'JPM', 'BAC',
    'WFC', 'V', 'MA', 'DIS', 'PYPL', 'KO', 'PEP', 'PFE', 'JNJ', 'MRK',
    'WMT', 'COST', 'MCD', 'NKE', 'XOM', 'CVX', 'BA', 'CAT', 'GS', 'MS',
    'UBER', 'SHOP', 'PLTR', 'COIN', 'SQ', 'RIVN', 'LCID', 'SOFI', 'MSTR', 'HOOD',
  ],
  indices: [
    '^GSPC', '^IXIC', '^DJI', '^RUT', '^VIX', '^NDX', '^GDAXI', '^FTSE',
    '^N225', '^HSI', '^STOXX50E', '^BVSP', '^KS11', '^AORD', '^SSEC',
  ],
  commodities: [
    'GC=F', 'SI=F', 'PL=F', 'PA=F', 'CL=F', 'BZ=F', 'NG=F', 'HG=F',
    'ZC=F', 'ZW=F', 'ZS=F', 'OJ=F', 'SB=F', 'KC=F', 'CC=F', 'CT=F',
  ],
};

const CRYPTO_SET = new Set(SYMBOLS.crypto);

const TIMEFRAMES = [
  { value: '5m', label: '5m', binance: '5m' },
  { value: '15m', label: '15m', binance: '15m' },
  { value: '30m', label: '30m', binance: '30m' },
  { value: '1h', label: '1H', binance: '1h' },
  { value: '4h', label: '4H', binance: '4h' },
  { value: '1d', label: 'D', binance: '1d' },
  { value: '1w', label: 'W', binance: '1w' },
];

const BINANCE_HOSTS = [
  'https://data-api.binance.vision',
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
];

const YAHOO_HOSTS = [
  '/__yahoo',
];

const YAHOO_INTERVAL = {
  '5m': '5m', '15m': '15m', '30m': '30m', '1h': '60m', '4h': '60m', '1d': '1d', '1w': '1wk',
};
const YAHOO_RANGE = {
  '5m': '2d', '15m': '5d', '30m': '1mo', '1h': '1mo', '4h': '3mo', '1d': '1y', '1w': '2y',
};

const toBinanceSymbol = (s) => s.replace(/USD$/i, 'USDT');

function yahooSymbolFor(market, symbol) {
  const s = symbol.trim().toUpperCase();
  switch (market) {
    case 'forex': return s.includes('=') ? s : `${s}=X`;
    case 'commodities': return s.includes('=') ? s : `${s}=F`;
    case 'indices': return s.startsWith('^') ? s : `^${s}`;
    default: return s;
  }
}

async function fetchBinanceCandles(symbol, interval, limit = 500) {
  let lastErr;
  for (const host of BINANCE_HOSTS) {
    try {
      const res = await fetch(
        `${host}/api/v3/klines?symbol=${toBinanceSymbol(symbol)}&interval=${interval}&limit=${limit}`
      );
      if (!res.ok) throw new Error(`Data fetch failed (${res.status})`);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error('Unexpected data shape');
      return raw.map(k => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
      }));
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Could not load price data');
}

function aggregate(candles, n) {
  const out = [];
  for (let i = 0; i < candles.length; i += n) {
    const group = candles.slice(i, i + n);
    if (group.length === 0) continue;
    const open = group[0].open;
    const close = group[group.length - 1].close;
    out.push({
      time: group[0].time,
      open,
      high: Math.max(...group.map(c => c.high)),
      low: Math.min(...group.map(c => c.low)),
      close,
    });
  }
  return out;
}

function trimCandles(candles, max) {
  return candles.length > max ? candles.slice(candles.length - max) : candles;
}

function arrayEmpty(arr) {
  return !arr || arr.length === 0;
}

async function fetchYahooCandles(market, symbol, interval, limit = 500) {
  const ysymbol = yahooSymbolFor(market, symbol);
  const yinterval = YAHOO_INTERVAL[interval];
  const yrange = YAHOO_RANGE[interval];
  let lastErr;
  for (const host of YAHOO_HOSTS) {
    try {
      const url = `${host}/v8/finance/chart/${ysymbol}?interval=${yinterval}&range=${yrange}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`Data fetch failed (${res.status})`);
      const data = await res.json();
      const r = data?.chart?.result?.[0];
      if (!r || !r.timestamp) throw new Error('No data returned for symbol');
      const ts = r.timestamp;
      const q = r.indicators?.quote?.[0] || {};
      const rows = [];
      for (let i = 0; i < ts.length; i++) {
        if (q.open?.[i] == null || q.high?.[i] == null || q.low?.[i] == null || q.close?.[i] == null) continue;
        rows.push({
          time: ts[i],
          open: q.open[i],
          high: q.high[i],
          low: q.low[i],
          close: q.close[i],
        });
      }
      if (rows.length === 0) throw new Error('No candles returned');
      let candles = rows.length > 2 * limit ? trimCandles(rows, limit) : rows;
      if (interval === '4h') candles = aggregate(candles, 4);
      return trimCandles(candles, limit);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Could not load price data');
}

async function fetchCandles(market, symbol, interval, limit = 500) {
  if (market === 'crypto' || CRYPTO_SET.has(symbol.toUpperCase())) {
    return fetchBinanceCandles(symbol, interval, limit);
  }
  return fetchYahooCandles(market, symbol, interval, limit);
}

function priceDecimals(price) {
  if (price >= 1000) return 1;
  if (price >= 1) return 3;
  return 6;
}

function formatPrice(price) {
  if (price == null || isNaN(price)) return '—';
  return price.toLocaleString('en-US', { minimumFractionDigits: priceDecimals(price), maximumFractionDigits: priceDecimals(price) });
}

const MARKET_HINT = {
  crypto: 'Type any crypto/USD pair to switch — dozens supported.',
  forex: 'Type any FX pair, e.g. EURUSD, GBPJPY, USDJPY.',
  stocks: 'Type any stock ticker, e.g. AAPL, TSLA, NVDA, MSFT.',
  indices: 'Type an index, e.g. ^GSPC, ^IXIC, ^DJI, ^VIX.',
  commodities: 'Type a commodity, e.g. GC=F (gold), CL=F (oil), SI=F (silver).',
};

export default function LiveChartCapture({ onCapture, symbol: propSymbol, timeframe: propTimeframe }) {
  const [market, setMarket] = useState('crypto');
  const [symbol, setSymbol] = useState(propSymbol || 'BTCUSD');
  const [symbolInput, setSymbolInput] = useState(propSymbol || 'BTCUSD');
  const [timeframe, setTimeframe] = useState(propTimeframe || '1h');
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const plotRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const intervalRef = useRef(null);

  const tvToAppTf = useMemo(() => ({
    '5m': 'M5', '15m': 'M15', '30m': 'M30', '1h': 'H1', '4h': 'H4', '1d': 'D1', '1w': 'W1'
  }), []);

  const destroyChart = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }
    setLive(false);
  }, []);

  const loadChart = useCallback(async () => {
    if (!containerRef.current) return;
    const tf = TIMEFRAMES.find(t => t.value === timeframe);
    setLoading(true);
    setLive(false);
    setError(null);
    try {
      const data = await fetchCandles(market, symbol, tf.value);
      destroyChart();
      const chart = createChart(containerRef.current, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: '#0f1117' },
          textColor: '#9aa0ad',
          fontFamily: "'Inter', system-ui, sans-serif",
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.04)' },
          horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
        timeScale: { borderColor: 'rgba(255,255,255,0.08)', rightOffset: 6 },
      });
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#089981',
        downColor: '#f23645',
        borderUpColor: '#089981',
        borderDownColor: '#f23645',
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
      });
      series.setData(data);
      chart.timeScale().fitContent();
      chartRef.current = chart;
      seriesRef.current = series;

      const last = data[data.length - 1];
      setLastPrice(last ? last.close : null);

      intervalRef.current = setInterval(async () => {
        try {
          const latest = await fetchCandles(market, symbol, tf.value, 250);
          if (arrayEmpty(latest) || !seriesRef.current || !chartRef.current) return;
          const bar = latest[latest.length - 1];
          seriesRef.current.update(bar);
          setLastPrice(bar.close);
          setLive(true);
        } catch {
          // keep last known values on transient network errors
        }
      }, 5000);

      setLive(true);
      setReady(true);
    } catch (err) {
      console.error('Live chart load failed:', err);
      setError(`Could not load live data for "${symbol}". Check the symbol and market (e.g. crypto BTCUSD, forex EURUSD, stock AAPL, index ^GSPC, gold GC=F).`);
      setReady(true);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, market, destroyChart]);

  useEffect(() => {
    const t = setTimeout(() => { loadChart(); }, 0);
    return () => { clearTimeout(t); destroyChart(); };
  }, [loadChart, destroyChart]);

  useEffect(() => {
    const onResize = () => { if (chartRef.current) chartRef.current.applyOptions({ width: containerRef.current?.clientWidth || 0 }); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const applySymbol = () => {
    const clean = symbolInput.trim().toUpperCase();
    if (!clean) return;
    if (clean !== symbol) {
      setSymbol(clean);
      setError(null);
    }
  };

  const onMarketChange = (m) => {
    setMarket(m);
    const first = SYMBOLS[m][0];
    setSymbolInput(first);
    setSymbol(first);
    setError(null);
  };

  const capture = async () => {
    if (!plotRef.current) return;
    setCapturing(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 450));
      const canvas = await html2canvas(plotRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f1117',
        logging: false,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create image');
      const file = new File([blob], `${symbol}_${timeframe}.png`, { type: 'image/png' });
      const tfLabel = TIMEFRAMES.find(t => t.value === timeframe)?.label || timeframe;
      onCapture && onCapture({
        file,
        symbol,
        market,
        tfValue: timeframe,
        timeframeLabel: tfLabel,
        appTimeframe: tvToAppTf[timeframe],
        chartKind: 'live',
        source: 'live-chart',
        lastPrice,
      });
    } catch (err) {
      console.error('Capture failed:', err);
      setError('Could not capture the chart. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const suggested = SYMBOLS[market] || SYMBOLS.crypto;
  const marketKey = CRYPTO_SET.has(symbol.toUpperCase()) ? 'crypto' : market;

  return (
    <div className="card p-0 overflow-hidden animate-fade-in-up">
      <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2">
          <div className="icon-tile icon-tile-accent !w-8 !h-8"><Camera size={16} /></div>
          <h3 className="font-semibold text-main text-sm">Live Chart Capture</h3>
          {(live || ready) && symbol && (
            <span className="badge chip-bullish flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--bullish)' }} />
              LIVE {symbol} {formatPrice(lastPrice)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
            Market
            <select value={market} onChange={e => onMarketChange(e.target.value)} className="field !w-auto !py-1.5">
              {MARKETS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
            <input
              list="livechart-symbols"
              value={symbolInput}
              onChange={e => setSymbolInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applySymbol(); }}
              onBlur={applySymbol}
              placeholder={`e.g. ${suggested[0] || 'BTCUSD'}`}
              className="field !w-44 !py-1.5 !pl-8"
            />
            <datalist id="livechart-symbols">
              {suggested.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="field !w-auto !py-1.5">
            {TIMEFRAMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={capture} disabled={capturing || !ready || loading} className="btn-primary !py-1.5 !text-xs">
            {capturing
              ? <><Loader2 size={13} className="animate-spin" /> Capturing…</>
              : <><Camera size={13} /> Capture for analysis</>}
          </button>
        </div>
      </div>
      <div className="p-3">
        <div ref={plotRef} className="rounded-xl overflow-hidden border relative" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <div ref={containerRef} className="w-full h-[520px]" />
          {(!ready || loading) && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              <RefreshCw size={14} className="animate-spin" /> Loading live chart…
            </div>
          )}
        </div>
        {error && <p className="text-xs mt-2" style={{ color: 'var(--bearish)' }}>{error}</p>}
        <div className="flex items-center gap-2 mt-2">
          <Activity size={12} style={{ color: live ? 'var(--bullish)' : 'var(--muted)' }} />
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {live
              ? <>Streaming live <strong style={{ color: 'var(--text-main)' }}>{symbol}</strong> price updates every 5s. {MARKET_HINT[marketKey] || ''}</>
              : <>Live price updates will begin once the chart loads.</>}
          </p>
        </div>
      </div>
    </div>
  );
}
