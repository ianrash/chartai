import { useState, useEffect } from 'react';
import { Link2, PlugZap, ShieldCheck, Upload, RefreshCw, Trash2, DollarSign, Building2, Key, AlertTriangle } from 'lucide-react';
import { loadBrokers, saveBrokers, parseCSV, bulkImportTrades } from '../services/tradeHistory';

const BROKERS = [
  { id:'mt4', label:'MetaTrader 4', cat:'Forex', auth:'OAuth / Investor Password' },
  { id:'mt5', label:'MetaTrader 5', cat:'Forex', auth:'OAuth' },
  { id:'ibkr', label:'Interactive Brokers', cat:'Stocks/Futures', auth:'OAuth' },
  { id:'tradovate', label:'Tradovate', cat:'Futures', auth:'API Key' },
  { id:'tastytrade', label:'Tastytrade', cat:'Options', auth:'OAuth' },
  { id:'schwab', label:'Schwab', cat:'Stocks', auth:'OAuth' },
  { id:'binance', label:'Binance', cat:'Crypto', auth:'API Key' },
  { id:'coinbase', label:'Coinbase', cat:'Crypto', auth:'OAuth' },
  { id:'ftmo', label:'FTMO', cat:'Prop', auth:'API Key' },
  { id:'generic', label:'Generic CSV', cat:'Any', auth:'CSV Upload' },
];

export default function BrokerConnect({ userId, onSync }){
  const [brokers, setBrokers] = useState(()=> loadBrokers());
  const [selected, setSelected] = useState('mt5');
  const [apiKey, setApiKey] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(()=> saveBrokers(brokers), [brokers]);

  const connect = ()=>{
    if(brokers.find(b=>b.id===selected)) return alert('Already connected');
    const b = BROKERS.find(x=>x.id===selected);
    const entry = { id: Date.now().toString(), brokerId:selected, label:b.label, status:'connected', connectedAt: new Date().toISOString(), lastSync:null, trades:0 };
    setBrokers(prev=> [...prev, entry]);
    // store apiKey read-only simulation
    if(apiKey) localStorage.setItem(`chartai_broker_${selected}_key`, apiKey);
    setApiKey('');
  };
  const disconnect = (id)=> setBrokers(prev=> prev.filter(b=>b.id!==id));
  const sync = async (broker)=>{
    setSyncing(true);
    // simulation: generate 2-3 mock fills
    await new Promise(r=> setTimeout(r, 900));
    const mockTrades = [
      { symbol:'EURUSD', date: new Date().toLocaleString(), bias: Math.random()>0.5?'BUY':'SELL', entry:'1.0845', rr:'1:2.1', rating:'B', status:'Win', pnl: (Math.random()*80-20).toFixed(2), broker: broker.label, score:0, analysis:null },
      { symbol:'XAUUSD', date: new Date().toLocaleString(), bias:'BUY', entry:'2650.5', rr:'1:1.8', rating:'A', status:'Pending', pnl:null, broker: broker.label, score:0, analysis:null },
    ];
    const imported = await bulkImportTrades(userId, mockTrades);
    setBrokers(prev=> prev.map(b=> b.id===broker.id? {...b, lastSync: new Date().toISOString(), trades:(b.trades||0)+imported.length}:b));
    onSync && onSync(imported);
    setSyncing(false);
  };
  const handleCSV = async (e)=>{
    const file=e.target.files?.[0]; if(!file) return;
    const text= await file.text();
    const trades= parseCSV(text).map(t=> ({...t, broker:'CSV Import'}));
    const imported= await bulkImportTrades(userId, trades);
    const entry = { id: Date.now().toString(), brokerId:'generic', label:'CSV Import', status:'connected', connectedAt: new Date().toISOString(), lastSync: new Date().toISOString(), trades: imported.length };
    setBrokers(prev=> [...prev, entry]);
    onSync && onSync(imported);
    e.target.value='';
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{borderColor:'var(--border)'}}>
        <div className="icon-tile icon-tile-accent !w-9 !h-9"><Link2 size={18}/></div>
        <div className="flex-1"><h3 className="font-semibold text-main">Broker Auto-Sync</h3><p className="text-[11px]" style={{color:'var(--muted)'}}>40+ brokers via OAuth • Read-only • 60s sync simulation</p></div>
        <span className="badge chip-bullish"><ShieldCheck size={10}/> Read-only</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select value={selected} onChange={e=>setSelected(e.target.value)} className="field">
            {BROKERS.map(b=> <option key={b.id} value={b.id}>{b.label} — {b.cat}</option>)}
          </select>
          <div className="relative"><Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{color:'var(--muted)'}}/><input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="API key / OAuth token (optional for demo)" className="field !pl-7"/></div>
          <button onClick={connect} className="btn-primary !px-4 !py-2 !text-xs"><PlugZap size={14}/>Connect</button>
        </div>

        <div className="flex items-center gap-2">
          <label className="btn-secondary flex-1 !py-2 !text-xs cursor-pointer" style={{borderStyle:'dashed', borderColor:'var(--border-hover)'}}><Upload size={12}/>Import CSV (any broker)<input type="file" accept=".csv" hidden onChange={handleCSV}/></label>
          <span className="text-[11px] whitespace-nowrap" style={{color:'var(--muted)'}}>or drag CSV into history</span>
        </div>

        {brokers.length===0 ? (
          <div className="py-8 text-center rounded-xl" style={{background:'var(--surface-2)', border:'1px dashed var(--border-hover)'}}>
            <Building2 size={28} className="mx-auto mb-2" style={{color:'var(--muted)'}}/><p className="text-sm font-semibold text-main">No brokers connected</p><p className="text-xs" style={{color:'var(--muted)'}}>Connect MT4/MT5, IBKR, Tradovate, Binance or import CSV. Demo mode syncs mock fills.</p>
            <p className="text-[11px] mt-2 flex items-center justify-center gap-1" style={{color:'var(--muted)'}}><AlertTriangle size={10}/> Demo: no real funds moved. Production would use SnapTrade OAuth.</p>
          </div>
        ): (
          <div className="space-y-2">
            {brokers.map(b=> (
              <div key={b.id} className="card-flat flex items-center gap-3">
                <div className="icon-tile chip-bullish !w-8 !h-8"><Building2 size={14}/></div>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-main">{b.label} <span className="text-[10px] font-normal" style={{color:'var(--muted)'}}>• {BROKERS.find(x=>x.id===b.brokerId)?.auth}</span></p><p className="text-[11px]" style={{color:'var(--muted)'}}>Connected {new Date(b.connectedAt).toLocaleDateString()} • {b.trades||0} trades • {b.lastSync? `Last sync ${new Date(b.lastSync).toLocaleTimeString()}`:'Never synced'}</p></div>
                <button disabled={syncing} onClick={()=>sync(b)} className="btn-primary !px-3 !py-1.5 !text-xs"><RefreshCw size={10} className={syncing?'animate-spin':''}/>Sync</button>
                <button onClick={()=>disconnect(b.id)} className="icon-btn hover:!text-[color:var(--bearish)]"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] flex items-center gap-1" style={{color:'var(--muted)'}}><DollarSign size={10}/> Multi-account supported. CSV fallback parses TradeStation/NinjaTrader/Thinkorswim formats via flexible parser.</p>
      </div>
    </div>
  );
}
