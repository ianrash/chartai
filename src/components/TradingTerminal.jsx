import { useState } from 'react';
import { LayoutGrid, Star, ExternalLink } from 'lucide-react';

const DEFAULT_SYMBOLS = ['EURUSD','XAUUSD','BTCUSD','US500','AAPL','NVDA'];

export default function TradingTerminal({ initialSymbol='EURUSD', watchlist=[] }){
  const [symbol, setSymbol] = useState(initialSymbol);
  const [interval, setInterval] = useState('60');
  const [layout, setLayout] = useState('single'); // single | dual | quad
  const [symbols, setSymbols] = useState(()=> {
    const w = watchlist.length? watchlist.slice(0,4): DEFAULT_SYMBOLS.slice(0,4);
    return w;
  });

  const tvUrl = (sym, intv='60')=> `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${sym}&symbol=${sym}&interval=${intv}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=rgba(15,15,22,1)&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1`;

  const Grid = ()=>{
    if(layout==='single') return (
      <div className="w-full h-[520px] rounded-xl overflow-hidden border" style={{borderColor:'var(--border)', background:'var(--surface-2)'}}>
        <iframe title={symbol} src={tvUrl(symbol, interval)} className="w-full h-full border-0" loading="lazy" />
      </div>
    );
    if(layout==='dual') return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[symbols[0]||symbol, symbols[1]||'XAUUSD'].map(s=> (
          <div key={s} className="h-[420px] rounded-xl overflow-hidden border" style={{borderColor:'var(--border)', background:'var(--surface-2)'}}>
            <div className="px-3 py-1 text-[10px] font-medium mono flex justify-between" style={{background:'var(--surface)', color:'var(--muted)'}}><span>{s}</span><span>{interval}</span></div>
            <iframe title={s} src={tvUrl(s, interval)} className="w-full h-[390px] border-0"/>
          </div>
        ))}
      </div>
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(symbols.slice(0,4)).map(s=> (
          <div key={s} className="h-[320px] rounded-xl overflow-hidden border" style={{borderColor:'var(--border)', background:'var(--surface-2)'}}>
            <div className="px-3 py-1 text-[10px] font-medium mono" style={{background:'var(--surface)', color:'var(--muted)'}}>{s}</div>
            <iframe title={s} src={tvUrl(s, interval)} className="w-full h-[290px] border-0"/>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3" style={{borderColor:'var(--border)', background:'var(--surface)'}}>
        <div className="flex items-center gap-2"><div className="icon-tile icon-tile-accent !w-8 !h-8"><LayoutGrid size={16}/></div><h3 className="font-semibold text-main text-sm">Trading Terminal</h3></div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={symbol} onChange={e=>setSymbol(e.target.value)} className="field !w-auto !py-1.5">
            {[...new Set([...DEFAULT_SYMBOLS, ...watchlist])].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={interval} onChange={e=>setInterval(e.target.value)} className="field !w-auto !py-1.5">
            <option value="1">1m</option><option value="5">5m</option><option value="15">15m</option><option value="60">1H</option><option value="240">4H</option><option value="D">D</option><option value="W">W</option>
          </select>
          <div className="segmented">
            {['single','dual','quad'].map(l=> <button key={l} onClick={()=>setLayout(l)} className={`segmented-item ${layout===l?'active':''}`}>{l}</button>)}
          </div>
          <a href={`https://www.tradingview.com/chart/?symbol=${symbol}`} target="_blank" rel="noreferrer" className="btn-ghost"><ExternalLink size={12}/>TradingView</a>
        </div>
      </div>
      <div className="p-3 space-y-3">
        <Grid/>
        <div className="flex gap-2 flex-wrap">
          {(watchlist.length? watchlist: DEFAULT_SYMBOLS.slice(0,6)).map(s=> <button key={s} onClick={()=>setSymbol(s)} className="pill !py-1 !text-[10px]" style={symbol===s? {background:'var(--accent)',color:'#fff',borderColor:'transparent'}:undefined}><Star size={10}/>{s}</button>)}
        </div>
        <p className="text-[11px]" style={{color:'var(--muted)'}}>Live charts via TradingView widget. Add symbols to watchlist from Scanner. Drag not enabled — use layout buttons for multi-chart.</p>
      </div>
    </div>
  );
}
