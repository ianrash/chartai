import { X, Trash2, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, Download, Upload, Search, ShieldAlert, Scale } from "lucide-react";
import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import JournalStats, { CalendarHeatmap, ProfitCurve } from "./JournalStats";
import { computeStats, exportTradesCSV, parseCSV, bulkImportTrades, computeRMultiple, symbolGroup } from "../services/tradeHistory";

const EMOTIONS = ['Confident','Neutral','Anxious','FOMO','Revenge','Patient','Fearful','Overconfident','Calm','Frustrated'];
const RULES = ['FOMO entry','Oversized position','No stop loss','Chased price','Early exit','Ignored daily limit','Held too long','Skipped checklist'];

export default function HistorySidebarPro({ history, onClose, onUpdateStatus, onDelete, onBulkImport, userId, onUpdateFields }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [showStats, setShowStats] = useState(true);

  const stats = useMemo(()=> computeStats(history), [history]);

  const filtered = useMemo(()=>{
    return history.filter(h=>{
      if(filter!=='All' && h.status!==filter && h.bias!==filter) return false;
      if(groupFilter!=='All' && symbolGroup(h.symbol)!==groupFilter) return false;
      const iso = new Date(h.created_at||h.date);
      const dKey = isNaN(iso)? '': iso.toISOString().slice(0,10);
      if(dateFrom && dKey && dKey < dateFrom) return false;
      if(dateTo && dKey && dKey > dateTo) return false;
      if(search && !`${h.symbol} ${h.bias} ${h.entry} ${h.rating} ${h.emotion||''} ${h.notes||''}`.toLowerCase().includes(search.toLowerCase())) return false;
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

  return (
    <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
      <div className="absolute inset-0 overlay-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-[640px] h-full flex flex-col border-l animate-slide-left" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-pop)' }}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div><h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>Journal Pro</h2><p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{history.length} trades • unlimited</p></div>
          <button onClick={onClose} className="icon-btn"><X size={18}/></button>
        </div>

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
            <div key={item.id} className="card-flat group transition-colors" style={{ background: 'var(--surface)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`icon-tile ${item.bias==='BUY'? 'chip-bullish':'chip-bearish'}`}>{item.bias==='BUY'? <TrendingUp size={16}/>:<TrendingDown size={16}/>}</div>
                  <div><h4 className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{item.symbol} <span className="badge mono !text-[10px] ml-1" style={{background:'var(--surface)', border:'1px solid var(--border)', color:'var(--muted)'}}>{item.rating}</span></h4><p className="text-[10px]" style={{color:'var(--muted)'}}>{item.date} <span className="capitalize">• {symbolGroup(item.symbol)}</span></p></div>
                </div>
                <button onClick={()=>{ if(confirm('Delete?')) onDelete(item.id); }} className="opacity-0 group-hover:opacity-100 icon-btn !w-7 !h-7 hover:!text-[color:var(--bearish)]"><Trash2 size={14}/></button>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="card-flat text-center !p-2"><p className="label !text-[9px]">Entry</p><p className="value mono truncate">{item.entry}</p></div>
                <div className="card-flat text-center !p-2"><p className="label !text-[9px]">R:R</p><p className="value mono tone-accent">{item.rr}</p></div>
                <div className="card-flat text-center !p-2"><p className="label !text-[9px]">R-mult</p><p className="value mono tabular" style={{color: r!=null? (r>=0?'var(--bullish)':'var(--bearish)'):'var(--muted)'}}>{r!=null? `${r>0?'+':''}${r}R`:'—'}</p></div>
                <div className="card-flat text-center !p-2"><p className="label !text-[9px]">P&L</p><p className="value mono tabular" style={{color:(item.pnl??0)>=0?'var(--bullish)':'var(--bearish)'}}>{item.pnl!=null? `$${Number(item.pnl).toFixed(2)}`:'—'}</p></div>
                <div className="card-flat text-center !p-2"><p className="label !text-[9px]">Broker</p><p className="text-[10px] font-semibold truncate" style={{color:'var(--muted)'}}>{item.broker||'Manual'}</p></div>
              </div>
              <div className="flex gap-1.5 mb-2 items-center">
                {['Pending','Win','Loss'].map(s=> <button key={s} onClick={()=>onUpdateStatus(item.id,s)} className="pill !px-3 !py-1 !text-[10px]" style={item.status===s? (s==='Win'? {background:'var(--bullish)',color:'#fff',borderColor:'transparent'}: s==='Loss'? {background:'var(--bearish)',color:'#fff',borderColor:'transparent'}:{background:'var(--accent)',color:'#fff',borderColor:'transparent'}):undefined}>{s}</button>)}
                {item.emotion && <span className="pill !px-2.5 !py-1 !text-[10px] capitalize" style={{background:'var(--surface-2)'}}>{item.emotion}</span>}
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
                </div>
              )}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
