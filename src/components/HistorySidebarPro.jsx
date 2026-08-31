import { X, Trash2, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, Download, Upload, Search, ShieldAlert, Scale, Plus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import DOMPurify from "dompurify";
import JournalStats, { CalendarHeatmap, ProfitCurve } from "./JournalStats";
import { computeStats, exportTradesCSV, parseCSV, bulkImportTrades, computeRMultiple, computeAutoPnl, symbolGroup, loadAccountSettings, saveAccountSettings, saveTradeToHistory } from "../services/tradeHistory";

const EMOTIONS = ['Confident','Neutral','Anxious','FOMO','Revenge','Patient','Fearful','Overconfident','Calm','Frustrated'];
const RULES = ['FOMO entry','Oversized position','No stop loss','Chased price','Early exit','Ignored daily limit','Held too long','Skipped checklist'];

export default function HistorySidebarPro({ history, onClose, onUpdateStatus, onDelete, onBulkImport, userId, onUpdateFields, setHistory }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [account, setAccount] = useState(loadAccountSettings);
  const [newTrade, setNewTrade] = useState({ symbol:'', bias:'BUY', entry:'', stop:'', target:'', status:'Pending' });

  const accountBalance = account.balance ?? 10000;
  const riskPercent = account.riskPercent ?? 1;
  const riskPerTrade = accountBalance * riskPercent / 100;

  useEffect(()=>{ saveAccountSettings(account); }, [account]);

  const stats = useMemo(()=> computeStats(history, accountBalance, riskPercent), [history, accountBalance, riskPercent]);

  const filtered = useMemo(()=>{
    return history.filter(h=>{
      if(filter!=='All' && h.status!==filter && h.bias!==filter) return false;
      if(groupFilter!=='All' && symbolGroup(h.symbol)!==groupFilter) return false;
      const iso = new Date(h.created_at||h.date);
      const dKey = isNaN(iso)? '': iso.toISOString().slice(0,10);
      if(dateFrom && dKey && dKey < dateFrom) return false;
      if(dateTo && dKey && dKey > dateTo) return false;
      if(search && !`${h.symbol} ${h.bias} ${h.entry} ${h.rating} ${h.emotion||''} ${h.notes||''} ${h.setupType||''} ${h.marketCondition||''}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [history, filter, groupFilter, dateFrom, dateTo, search]);

  const handleExport = ()=>{
    const csv = exportTradesCSV(filtered.length? filtered : history);
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`chartai_journal_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const handleImport = async (e)=>{
    const file=e.target.files?.[0]; if(!file) return;
    const text= await file.text();
    const trades= parseCSV(text);
    if(trades.length===0) return alert('No valid rows');
    const res = await bulkImportTrades(userId, trades);
    if(onBulkImport) onBulkImport(res);
    e.target.value='';
  };

  const updateField = (item, key, value)=> onUpdateFields && onUpdateFields(item.id, {[key]: value});
  const toggleRule = (item, rule)=>{
    const cur = item.brokenRules||[];
    const next = cur.includes(rule)? cur.filter(r=>r!==rule) : [...cur, rule];
    updateField(item, 'brokenRules', next);
  };
  const saveAccount = ()=>{ saveAccountSettings(account); setShowNewTrade(v=>!v); };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
      <div className="absolute inset-0 overlay-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-[640px] h-full flex flex-col border-l animate-slide-left" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-pop)' }}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div><h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>Journal Pro</h2><p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{history.length} trades • unlimited</p></div>
          <button onClick={onClose} className="icon-btn"><X size={18}/></button>
        </div>

        {/* Account balance panel */}
        <div className="rounded-xl p-3 mb-2" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted uppercase tracking-wider">Account</span>
            <button onClick={()=>setShowNewTrade(v=>!v)} className="btn-ghost !px-2 !py-1 !text-[10px]"><Plus size={12}/> New Trade</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5"><span className="text-[10px] text-muted">Balance</span>
              <input type="number" value={accountBalance} onChange={e=>setAccount(a=>({...a, balance:Number(e.target.value)||0}))} className="field !py-1 !text-xs !w-24"/></label>
            <label className="flex items-center gap-1.5"><span className="text-[10px] text-muted">Risk</span>
              <input type="number" step="0.1" value={riskPercent} onChange={e=>setAccount(a=>({...a, riskPercent:Number(e.target.value)||0}))} className="field !py-1 !text-xs !w-16"/></label>
            <span className="text-[10px]" style={{color:'var(--muted)'}}>Risk/trade: <b style={{color:'var(--text-main)'}}>${riskPerTrade.toFixed(2)}</b></span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px]" style={{color:'var(--muted)'}}>Equity: <b style={{color: (accountBalance+computeStats(history,accountBalance,riskPercent).totalPnl)>=0?'var(--bullish)':'var(--bearish)'}}>${(accountBalance+computeStats(history,accountBalance,riskPercent).totalPnl).toFixed(2)}</b></span>
            <span className="text-[10px]" style={{color:'var(--muted)'}}>Total P&L: <b style={{color: computeStats(history,accountBalance,riskPercent).totalPnl>=0?'var(--bullish)':'var(--bearish)'}}>${computeStats(history,accountBalance,riskPercent).totalPnl.toFixed(2)}</b></span>
            <span className="text-[10px]" style={{color:'var(--muted)'}}>Total R: <b style={{color:'var(--accent)'}}>{computeStats(history,accountBalance,riskPercent).totalR?.toFixed(2)??'—'}</b></span>
          </div>
        </div>

        {/* New Trade form */}
        {showNewTrade && (
          <div className="rounded-xl p-3 mb-2 space-y-2" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
            <div className="flex items-center justify-between"><span className="text-[10px] text-muted uppercase tracking-wider">Add Trade</span><button onClick={()=>setShowNewTrade(false)} className="icon-btn !w-5 !h-5"><X size={12}/></button></div>
            <div className="grid grid-cols-3 gap-1.5">
              <input className="field !py-1 !text-xs" placeholder="Symbol" value={newTrade.symbol} onChange={e=>setNewTrade(t=>({...t,symbol:e.target.value}))}/>
              <select className="field !py-1 !text-xs" value={newTrade.bias} onChange={e=>setNewTrade(t=>({...t,bias:e.target.value}))}>
                <option value="BUY">BUY</option><option value="SELL">SELL</option>
              </select>
              <input type="number" className="field !py-1 !text-xs" placeholder="Entry" value={newTrade.entry} onChange={e=>setNewTrade(t=>({...t,entry:e.target.value}))}/>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <input type="number" className="field !py-1 !text-xs" placeholder="Stop" value={newTrade.stop} onChange={e=>setNewTrade(t=>({...t,stop:e.target.value}))}/>
              <input type="number" className="field !py-1 !text-xs" placeholder="Target" value={newTrade.target} onChange={e=>setNewTrade(t=>({...t,target:e.target.value}))}/>
              <select className="field !py-1 !text-xs" value={newTrade.status} onChange={e=>setNewTrade(t=>({...t,status:e.target.value}))}>
                <option value="Pending">Pending</option><option value="Win">Win</option><option value="Loss">Loss</option>
              </select>
            </div>
            <button className="btn-primary !py-1.5 !text-xs w-full" onClick={()=>{
              const entry = { ...newTrade, id:crypto.randomUUID(), created_at:new Date().toISOString(), date:new Date().toLocaleString(), entry:newTrade.entry||'Market', rr:'—', rating:'B', score:0, emotion:'', lesson:'', followedPlan:null, brokenRules:[], setupType:null, marketCondition:null, thesis:'', whatWentWell:'', whatToImprove:'' };
              saveTradeToHistory(userId, entry);
              setHistory(prev=>[entry,...prev]);
              setNewTrade({ symbol:'', bias:'BUY', entry:'', stop:'', target:'', status:'Pending' });
              setShowNewTrade(false);
            }}>Save Trade</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stats toggle */}
          <div className="flex items-center justify-between">
            <button onClick={()=>setShowStats(v=>!v)} className="btn-ghost">{showStats? <ChevronUp size={14}/>:<ChevronDown size={14}/>} Stats & Calendar</button>
            <div className="flex gap-2">
              <label className="btn-secondary !px-3 !py-1.5 !text-xs cursor-pointer"><Upload size={12}/>Import<input type="file" accept=".csv" hidden onChange={handleImport}/></label>
              <button onClick={handleExport} className="btn-primary !px-3 !py-1.5 !text-xs"><Download size={12}/>Export CSV</button>
            </div>
          </div>
          {showStats && <>
            <JournalStats stats={stats}/>
            <ProfitCurve series={stats.monthSeries?.length>1? stats.monthSeries: stats.weekSeries} unit={stats.monthSeries?.length>1? 'month':'week'}/>
            <CalendarHeatmap byDay={stats.byDay}/>
            {stats.ruleBreaks && Object.keys(stats.ruleBreaks).length>0 && (
              <div className="rounded-xl p-4" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
                <div className="flex items-center gap-2 mb-3"><ShieldAlert size={14} className="text-accent"/><span className="text-xs font-bold text-main">Most broken rules</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(stats.ruleBreaks).sort((a,b)=>b[1]-a[1]).map(([r,c])=> <span key={r} className="pill !px-2.5 !py-1 !text-[10px]" style={{borderColor:'var(--bearish)'}}>{r} ×{c}</span>)}
                </div>
              </div>
            )}
          </>}

          {/* Filters */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative flex-1 min-w-[160px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{color:'var(--muted)'}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symbol, bias, notes, emotion..." className="field !py-2 text-xs !pl-8"/></div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {['All','forex','crypto','index','commodity'].map(g=> <button key={g} onClick={()=>setGroupFilter(g)} className="pill !px-2.5 !py-1.5 !text-[10px] capitalize" style={groupFilter===g? {background:'var(--accent)',color:'#fff',borderColor:'transparent'}:undefined}>{g=== 'index'? 'Indices': g==='commodity'? 'Commodities': g}</button>)}
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {['All','Pending','Win','Loss','BUY','SELL'].map(f=> <button key={f} onClick={()=>setFilter(f)} className="pill !px-2.5 !py-1.5 !text-[10px]" style={filter===f? {background:'var(--accent)',color:'#fff',borderColor:'transparent'}:undefined}>{f}</button>)}
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <label className="flex items-center gap-1.5 text-muted">From <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="field !py-1.5 !text-xs"/></label>
              <label className="flex items-center gap-1.5 text-muted">To <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="field !py-1.5 !text-xs"/></label>
              {(dateFrom||dateTo) && <button className="btn-ghost !p-1 !text-xs" onClick={()=>{setDateFrom('');setDateTo('');}}>Clear dates</button>}
            </div>
          </div>

          {filtered.length===0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><div className="w-16 h-16 rounded-2xl icon-tile mb-3" style={{width:'64px',height:'64px'}}><Clock size={28}/></div><p className="text-sm text-secondary">No trades match filter</p></div>
          ): filtered.map(item=> {
            const r = computeRMultiple(item);
            return (
            <div key={item.id} className="card-flat group transition-colors" style={{ background: item.status==='Win'? 'rgba(34,197,94,0.04)': item.status==='Loss'? 'rgba(239,68,68,0.04)': 'var(--surface)', borderLeft: item.status==='Win'? '3px solid var(--bullish)': item.status==='Loss'? '3px solid var(--bearish)': '3px solid transparent' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`icon-tile ${item.bias==='BUY'? 'chip-bullish':'chip-bearish'}`}>{item.bias==='BUY'? <TrendingUp size={16}/>:<TrendingDown size={16}/>}</div>
                  <div>
                    <h4 className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{item.symbol} <span className="badge mono !text-[10px] ml-0.5" style={{background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--muted)'}}>{item.rating}</span></h4>
                    <p className="text-[10px]" style={{color:'var(--muted)'}}>{item.date} • <span className="capitalize">{symbolGroup(item.symbol)}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`pill !px-2 !py-0.5 !text-[10px] capitalize ${item.status==='Win'?'!text-white':item.status==='Loss'?'!text-white':''}`} style={item.status==='Win'? {background:'var(--bullish)',borderColor:'transparent'}:item.status==='Loss'? {background:'var(--bearish)',borderColor:'transparent'}:{background:'var(--surface-2)'}}>{item.status}</span>
                  <button onClick={()=>{ if(confirm('Delete?')) onDelete(item.id); }} className="opacity-0 group-hover:opacity-100 icon-btn !w-7 !h-7 hover:!text-[color:var(--bearish)]"><Trash2 size={14}/></button>
                </div>
              </div>
              {/* Metrics: prices + auto R & P&L */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {[['Entry',item.entry],['Stop',item.stop||'—'],['Target',item.target||'—']].map(([l,v])=>(
                  <div key={l} className="flex items-center gap-1"><span className="text-[9px] text-muted uppercase tracking-wider">{l}</span><span className="value mono text-xs">{v}</span></div>
                ))}
                <span className="text-[10px]" style={{color:'var(--border)'}}>•</span>
                <div className="flex items-center gap-1"><span className="text-[9px] text-muted uppercase tracking-wider">R</span><span className="value mono tabular text-xs" style={{color: r!=null? (r>=0?'var(--bullish)':'var(--bearish)'):'var(--muted)'}}>{r!=null? `${r>0?'+':''}${r}R`:'—'}</span></div>
                <div className="flex items-center gap-1 ml-auto"><span className="text-[9px] text-muted uppercase tracking-wider">P&L</span><span className="value mono tabular text-xs" style={{color:(item.pnl??computeAutoPnl(item,accountBalance,riskPercent))>=0?'var(--bullish)':'var(--bearish)'}}>{((item.pnl??computeAutoPnl(item,accountBalance,riskPercent))!=null)? `$${Number(item.pnl??computeAutoPnl(item,accountBalance,riskPercent)).toFixed(2)}`:'—'}</span></div>
              </div>
              {/* Bottom: tags + discipline + expand */}
              <div className="flex gap-1.5 items-center flex-wrap">
                {item.emotion && <span className="pill !px-2 !py-0.5 !text-[10px] capitalize" style={{background:'var(--surface-2)'}}>{item.emotion}</span>}
                {item.followedPlan===true && <span className="pill !px-2 !py-0.5 !text-[10px]" style={{background:'rgba(34,197,94,0.15)',color:'#22c55e',borderColor:'transparent'}}>✓ Plan</span>}
                {item.followedPlan===false && <span className="pill !px-2 !py-0.5 !text-[10px]" style={{background:'rgba(239,68,68,0.15)',color:'#ef4444',borderColor:'transparent'}}>✗ Rule</span>}
                {(item.setupType||item.marketCondition) && <div className="flex gap-1 ml-auto">{item.setupType && <span className="chip !px-1.5 !py-0.5 !text-[9px] capitalize" style={{background:'var(--surface-2)', borderColor:'var(--accent)'}}>{item.setupType}</span>}{item.marketCondition && <span className="chip !px-1.5 !py-0.5 !text-[9px] capitalize" style={{background:'var(--surface-2)', borderColor:'var(--muted)'}}>{item.marketCondition}</span>}</div>}
                <button onClick={()=> setExpandedId(expandedId===item.id? null:item.id)} className="icon-btn ml-auto"><ChevronDown size={14} style={{transform: expandedId===item.id?'rotate(180deg)':'none', transition:'transform 0.15s ease'}}/></button>
              </div>
            {expandedId===item.id && (
                <div className="space-y-3 pt-2 border-t animate-fade-in" style={{borderColor:'var(--border)'}}>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block"><span className="label !normal-case !tracking-normal block mb-1">P&L ($)</span><input type="number" defaultValue={item.pnl??''} onBlur={e=>updateField(item,'pnl', e.target.value===''? null: Number(e.target.value))} placeholder="e.g. 45.2" className="field text-xs"/></label>
                    <label className="block"><span className="label !normal-case !tracking-normal block mb-1">R-multiple (auto if empty)</span><input type="number" step="0.01" defaultValue={item.risk??''} onBlur={e=>updateField(item,'risk', e.target.value===''? null: Number(e.target.value))} placeholder={r!=null? `auto: ${r}R`:'auto'} className="field text-xs"/></label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block"><span className="label !normal-case !tracking-normal block mb-1">Emotion</span>
                      <select className="field text-xs" defaultValue={item.emotion||''} onChange={e=>updateField(item,'emotion',e.target.value)}>
                        <option value="">— none —</option>
                        {EMOTIONS.map(e=> <option key={e} value={e}>{e}</option>)}
                      </select>
                    </label>
                    <label className="block"><span className="label !normal-case !tracking-normal block mb-1">Lesson</span><input defaultValue={item.lesson||''} onBlur={e=>updateField(item,'lesson',e.target.value)} placeholder="What to learn..." className="field text-xs"/></label>
                  </div>
                  <label className="block"><span className="label !normal-case !tracking-normal block mb-1">Notes</span><textarea defaultValue={item.notes||''} onBlur={e=>updateField(item,'notes',e.target.value)} placeholder="Why entered, context..." className="field text-xs"/></label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block"><span className="label !normal-case !tracking-normal block mb-1">Setup Type</span>
                      <select className="field text-xs" defaultValue={item.setupType||''} onChange={e=>updateField(item,'setupType',e.target.value||null)}>
                        <option value="">— none —</option>
                        {['Breakout','Reversal','Continuation','Scalp','Swing','News'].map(s=> <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="block"><span className="label !normal-case !tracking-normal block mb-1">Market Condition</span>
                      <select className="field text-xs" defaultValue={item.marketCondition||''} onChange={e=>updateField(item,'marketCondition',e.target.value||null)}>
                        <option value="">— none —</option>
                        {['Trending','Ranging','Choppy','Volatile','Quiet'].map(s=> <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="block"><span className="label !normal-case !tracking-normal block mb-1">Trade Thesis</span><textarea defaultValue={item.thesis||''} onBlur={e=>updateField(item,'thesis',e.target.value)} placeholder="Why I took this trade..." className="field text-xs"/></label>
                  <div className="rounded-xl p-3" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
                    <div className="flex items-center gap-2 mb-2"><span className="text-accent font-bold text-xs">✓</span><span className="text-[10px] font-bold text-main uppercase tracking-wider">What Went Well</span></div>
                    <textarea defaultValue={item.whatWentWell||''} onBlur={e=>updateField(item,'whatWentWell',e.target.value)} placeholder="Strengths of this trade..." className="field text-xs" rows={2}/>
                  </div>
                  <div className="rounded-xl p-3" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
                    <div className="flex items-center gap-2 mb-2"><span className="text-bearish font-bold text-xs">→</span><span className="text-[10px] font-bold text-main uppercase tracking-wider">What to Improve</span></div>
                    <textarea defaultValue={item.whatToImprove||''} onBlur={e=>updateField(item,'whatToImprove',e.target.value)} placeholder="Mistakes or lessons for next time..." className="field text-xs" rows={2}/>
                  </div>
                  <div className="rounded-xl p-3" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="label">Followed plan?</span>
                      <div className="segmented">
                        <button className={`segmented-item ${item.followedPlan===true?'active':''}`} onClick={()=>updateField(item,'followedPlan',true)}>Yes</button>
                        <button className={`segmented-item ${item.followedPlan===false?'active':''}`} onClick={()=>updateField(item,'followedPlan',false)}>No</button>
                        {item.followedPlan!=null && <button className="segmented-item" onClick={()=>updateField(item,'followedPlan',null)}>—</button>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2"><Scale size={13} className="text-accent shrink-0"/><span className="text-[10px] font-bold text-main">Rules broken</span></div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {RULES.map(rl=> {
                        const on = (item.brokenRules||[]).includes(rl);
                        return <button key={rl} onClick={()=>toggleRule(item,rl)} className="pill !px-2.5 !py-1 !text-[10px]" style={on? {background:'var(--bearish)',color:'#fff',borderColor:'transparent'}:undefined}>{rl}</button>;
                      })}
                    </div>
                  </div>
                   {item.analysis?.executive_summary && <p className="text-xs italic text-secondary">"{DOMPurify.sanitize(item.analysis.executive_summary)}"</p>}
                   {item.analysis?.trade_setup && <p className="text-xs text-secondary">Bias {DOMPurify.sanitize(item.analysis.trade_setup.bias)} | {DOMPurify.sanitize(item.analysis.trade_setup.execution?.entry||'')} | R:R {DOMPurify.sanitize(item.analysis.trade_setup.execution?.risk_reward||'—')}</p>}
                   <button className="btn-primary !py-2 !text-xs w-full mt-2" onClick={()=>{}}>Save Changes</button>
                 </div>
              )}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
