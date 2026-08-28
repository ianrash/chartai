import { useState, useMemo } from 'react';
import { Search, Star, TrendingUp, TrendingDown, Activity, Filter, Bell, Plus, Zap, BarChart3, Target, Layers } from 'lucide-react';
import { loadWatchlist, saveWatchlist, loadAlerts, saveAlerts } from '../services/tradeHistory';

const MOCK_ASSETS = [
  { symbol:'EURUSD', market:'Forex', pattern:'Bullish Flag', momentum:'Bullish', volume:'Spike', strength: 82, trend:'Bullish', price:'1.0845', change:'+0.32%' },
  { symbol:'XAUUSD', market:'Metals', pattern:'Double Bottom', momentum:'Reversal', volume:'High', strength: 78, trend:'Bullish', price:'2650.10', change:'+1.12%' },
  { symbol:'BTCUSD', market:'Crypto', pattern:'Falling Wedge', momentum:'Bearish', volume:'Low', strength: 64, trend:'Bearish', price:'68200', change:'-0.84%' },
  { symbol:'US500', market:'Indices', pattern:'Ascending Triangle', momentum:'Bullish', volume:'Normal', strength: 88, trend:'Bullish', price:'5820.5', change:'+0.56%' },
  { symbol:'GBPUSD', market:'Forex', pattern:'Head & Shoulders', momentum:'Bearish', volume:'Spike', strength: 71, trend:'Bearish', price:'1.2740', change:'-0.45%' },
  { symbol:'SOLUSD', market:'Crypto', pattern:'Bull Flag', momentum:'Bullish', volume:'Spike', strength: 90, trend:'Bullish', price:'178.2', change:'+3.2%' },
  { symbol:'US30', market:'Indices', pattern:'Channel Up', momentum:'Bullish', volume:'Normal', strength: 68, trend:'Bullish', price:'43820', change:'+0.22%' },
  { symbol:'ETHUSD', market:'Crypto', pattern:'Symmetrical Triangle', momentum:'Neutral', volume:'Low', strength: 55, trend:'Neutral', price:'3420', change:'-0.11%' },
  { symbol:'USDJPY', market:'Forex', pattern:'Rising Wedge', momentum:'Bearish', volume:'High', strength: 74, trend:'Bearish', price:'149.80', change:'-0.20%' },
  { symbol:'AAPL', market:'Stocks', pattern:'Cup & Handle', momentum:'Bullish', volume:'Spike', strength: 86, trend:'Bullish', price:'238.40', change:'+1.02%' },
  { symbol:'NVDA', market:'Stocks', pattern:'Bullish Pennant', momentum:'Bullish', volume:'High', strength: 92, trend:'Bullish', price:'142.30', change:'+2.1%' },
  { symbol:'TSLA', market:'Stocks', pattern:'Double Top', momentum:'Bearish', volume:'High', strength: 60, trend:'Bearish', price:'298.10', change:'-1.8%' },
];

const PRESETS = [
  { id:'momentum', label:'Momentum Burst', filter: a=> a.momentum==='Bullish' && a.volume==='Spike' },
  { id:'reversal', label:'Reversal Watch', filter: a=> a.pattern.includes('Double')||a.pattern.includes('Head') },
  { id:'highScore', label:'A+ Setups (80+)', filter: a=> a.strength>=80 },
  { id:'crypto', label:'Crypto Leaders', filter: a=> a.market==='Crypto' },
];

export default function Scanner({ onSelectSymbol }){
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState('All');
  const [preset, setPreset] = useState(null);
  const [watchlist, setWatchlist] = useState(()=> loadWatchlist());
  const [alerts, setAlerts] = useState(()=> loadAlerts());
  const [alertPrice, setAlertPrice] = useState('');

  const filtered = useMemo(()=>{
    let list = MOCK_ASSETS;
    if(preset){ const p=PRESETS.find(x=>x.id===preset); if(p) list=list.filter(p.filter); }
    if(market!=='All') list=list.filter(a=>a.market===market);
    if(query) list=list.filter(a=> `${a.symbol} ${a.pattern} ${a.momentum}`.toLowerCase().includes(query.toLowerCase()));
    return list.sort((a,b)=> b.strength - a.strength);
  }, [query, market, preset]);

  const toggleWatch = (sym)=>{
    const next = watchlist.includes(sym)? watchlist.filter(s=>s!==sym): [...watchlist, sym];
    setWatchlist(next); saveWatchlist(next);
  };
  const addAlert = (sym)=>{
    if(!alertPrice) return alert('Enter price');
    const entry={ id: Date.now().toString(), symbol:sym, price: alertPrice, createdAt: new Date().toISOString(), triggered:false };
    const next=[...alerts, entry]; setAlerts(next); saveAlerts(next); setAlertPrice('');
  };
  const removeAlert = (id)=>{ const next=alerts.filter(a=>a.id!==id); setAlerts(next); saveAlerts(next); };

  return (
    <div className="space-y-4">
      {/* Scanner */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{borderColor:'var(--border)'}}>
          <div className="flex items-center gap-3"><div className="icon-tile icon-tile-accent !w-9 !h-9"><BarChart3 size={18}/></div><div><h3 className="font-semibold text-main">Smart Scanner</h3><p className="text-[11px]" style={{color:'var(--muted)'}}>{MOCK_ASSETS.length*5}00+ assets • composite 0-100</p></div></div>
          <span className="badge" style={{background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--muted)'}}>{filtered.length} results</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{color:'var(--muted)'}}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search pattern, symbol..." className="field !py-2 !pl-8"/></div>
            <select value={market} onChange={e=>setMarket(e.target.value)} className="field !w-auto">{['All','Forex','Crypto','Stocks','Indices','Metals'].map(m=> <option key={m} value={m}>{m}</option>)}</select>
            <button onClick={()=>{setPreset(null); setMarket('All'); setQuery('');}} className="btn-secondary !px-3 !py-2 !text-xs"><Filter size={12}/>Clear</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p=> <button key={p.id} onClick={()=>setPreset(preset===p.id? null:p.id)} className="pill !py-1.5 !text-[10px]" style={preset===p.id? {background:'var(--accent)',color:'#fff',borderColor:'transparent'}:undefined}>{p.label}</button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{color:'var(--muted)'}}><th className="label text-left py-2 !text-[10px]">Symbol</th><th className="label text-left !text-[10px]">Pattern</th><th className="label text-left !text-[10px]">Momentum</th><th className="label text-left !text-[10px]">Vol</th><th className="label text-left !text-[10px]">Score</th><th className="label text-right !text-[10px]">Action</th></tr></thead>
              <tbody>
                {filtered.map(a=> (
                  <tr key={a.symbol} className="border-t transition-colors hover:bg-[color:var(--surface-2)]" style={{borderColor:'var(--border)'}}>
                    <td className="py-2.5"><div className="flex items-center gap-2"><span className="font-semibold text-main">{a.symbol}</span><span className="badge !text-[9px] !px-1.5 !py-0.5" style={{background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--muted)'}}>{a.market}</span></div><span className="mono text-[10px] tabular" style={{color:'var(--muted)'}}>{a.price} <span style={{color: a.change.startsWith('+')?'var(--bullish)':'var(--bearish)'}}>{a.change}</span></span></td>
                    <td><span className="badge chip-accent">{a.pattern}</span></td>
                    <td className="flex items-center gap-1 pt-2.5">{a.momentum==='Bullish'? <TrendingUp size={12} className="tone-bullish"/>: a.momentum==='Bearish'? <TrendingDown size={12} className="tone-bearish"/>:<Activity size={12} style={{color:'var(--muted)'}}/>} <span className="text-secondary">{a.momentum}</span></td>
                    <td><span className="text-[10px] text-secondary">{a.volume}</span></td>
                    <td><span className="font-semibold mono tabular" style={{color: a.strength>=80?'var(--bullish)': a.strength>=65?'var(--accent)':'var(--muted)'}}>{a.strength}</span></td>
                    <td className="text-right"><div className="flex justify-end gap-1"><button onClick={()=>toggleWatch(a.symbol)} className="icon-btn !w-7 !h-7" style={watchlist.includes(a.symbol)? {background:'var(--accent)', color:'#fff'}:{color:'var(--muted)'}}><Star size={12} fill={watchlist.includes(a.symbol)? '#fff':'none'}/></button><button onClick={()=> onSelectSymbol && onSelectSymbol(a.symbol)} className="icon-btn !w-7 !h-7 tone-accent"><Target size={12}/></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Watchlist + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-flat">
          <h4 className="text-xs font-semibold text-main flex items-center gap-1.5 mb-3"><Star size={12} className="tone-accent"/>Watchlist ({watchlist.length})</h4>
          {watchlist.length===0? <p className="text-xs py-4 text-center" style={{color:'var(--muted)'}}>Star assets from scanner</p>: (
            <div className="space-y-1.5">
              {watchlist.map(s=> {
                const asset=MOCK_ASSETS.find(a=>a.symbol===s);
                return <div key={s} className="flex items-center justify-between p-2 rounded-lg card-flat" style={{background:'var(--surface)'}}><span className="text-xs font-semibold text-main mono">{s} <span className="tabular" style={{color:'var(--muted)'}}>{asset?.price}</span></span><div className="flex gap-1"><button onClick={()=> onSelectSymbol && onSelectSymbol(s)} className="icon-btn !w-6 !h-6 tone-accent"><Layers size={12}/></button><button onClick={()=>toggleWatch(s)} className="badge chip-bearish cursor-pointer">Remove</button></div></div>;
              })}
            </div>
          )}
        </div>
        <div className="card-flat">
          <h4 className="text-xs font-semibold text-main flex items-center gap-1.5 mb-3"><Bell size={12} className="tone-accent"/>Price Alerts ({alerts.length})</h4>
          <div className="flex gap-2 mb-3"><input value={alertPrice} onChange={e=>setAlertPrice(e.target.value)} placeholder="Price e.g. 1.0850" className="field"/><button onClick={()=> addAlert(watchlist[0]||'EURUSD')} className="btn-primary !px-3 !py-2 !text-xs"><Plus size={12}/>Add</button></div>
          {alerts.length===0? <p className="text-xs py-2 text-center" style={{color:'var(--muted)'}}>No alerts — add price to get notified (local)</p>: (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {alerts.map(a=> <div key={a.id} className="flex items-center justify-between p-2 rounded-lg card-flat" style={{background:'var(--surface)'}}><span className="text-xs text-main mono">{a.symbol} @ {a.price}</span><button onClick={()=>removeAlert(a.id)} className="text-[10px] font-semibold tone-bearish">Delete</button></div>)}
            </div>
          )}
          <p className="text-[11px] mt-2 flex items-center gap-1" style={{color:'var(--muted)'}}><Zap size={10}/> Alerts are local — browser notification when price mocked.</p>
        </div>
      </div>
    </div>
  );
}
