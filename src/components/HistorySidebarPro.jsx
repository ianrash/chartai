import { X, Trash2, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, Download, Upload, Search } from "lucide-react";
import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import JournalStats, { CalendarHeatmap } from "./JournalStats";
import { computeStats, exportTradesCSV, parseCSV, bulkImportTrades } from "../services/tradeHistory";

export default function HistorySidebarPro({ history, onClose, onUpdateStatus, onDelete, onBulkImport, userId, onUpdateFields }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showStats, setShowStats] = useState(true);

  const stats = useMemo(()=> computeStats(history), [history]);

  const filtered = useMemo(()=>{
    return history.filter(h=>{
      if(filter!=='All' && h.status!==filter && h.bias!==filter) return false;
      if(search && !`${h.symbol} ${h.bias} ${h.entry} ${h.rating}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [history, filter, search]);

  const handleExport = ()=>{
    const csv = exportTradesCSV(history);
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

  const updateNotes = (item, notes)=> onUpdateFields && onUpdateFields(item.id, {notes});
  const updatePnl = (item, pnl)=> onUpdateFields && onUpdateFields(item.id, {pnl: pnl===''? null: Number(pnl)});

  return (
    <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
      <div className="absolute inset-0 overlay-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-[560px] h-full flex flex-col border-l animate-slide-left" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-pop)' }}>
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
          {showStats && <><JournalStats stats={stats}/><CalendarHeatmap byDay={stats.byDay}/></>}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-[160px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{color:'var(--muted)'}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symbol, bias..." className="field !py-2 text-xs !pl-8"/></div>
            {['All','Pending','Win','Loss','BUY','SELL'].map(f=> <button key={f} onClick={()=>setFilter(f)} className="pill !px-2.5 !py-1.5 !text-[10px]" style={filter===f? {background:'var(--accent)',color:'#fff',borderColor:'transparent'}:undefined}>{f}</button>)}
          </div>

          {filtered.length===0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><div className="w-16 h-16 rounded-2xl icon-tile mb-3" style={{width:'64px',height:'64px'}}><Clock size={28}/></div><p className="text-sm text-secondary">No trades match filter</p></div>
          ): filtered.map(item=> (
            <div key={item.id} className="card-flat group transition-colors" style={{ background: 'var(--surface)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`icon-tile ${item.bias==='BUY'? 'chip-bullish':'chip-bearish'}`}>{item.bias==='BUY'? <TrendingUp size={16}/>:<TrendingDown size={16}/>}</div>
                  <div><h4 className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{item.symbol} <span className="badge mono !text-[10px] ml-1" style={{background:'var(--surface)', border:'1px solid var(--border)', color:'var(--muted)'}}>{item.rating}</span></h4><p className="text-[10px]" style={{color:'var(--muted)'}}>{item.date}</p></div>
                </div>
                <button onClick={()=>{ if(confirm('Delete?')) onDelete(item.id); }} className="opacity-0 group-hover:opacity-100 icon-btn !w-7 !h-7 hover:!text-[color:var(--bearish)]"><Trash2 size={14}/></button>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div className="card-flat text-center !p-2"><p className="label !text-[9px]">Entry</p><p className="value mono truncate">{item.entry}</p></div>
                <div className="card-flat text-center !p-2"><p className="label !text-[9px]">R:R</p><p className="value mono tone-accent">{item.rr}</p></div>
                <div className="card-flat text-center !p-2"><p className="label !text-[9px]">P&L</p><p className="value mono tabular" style={{color:(item.pnl??0)>=0?'var(--bullish)':'var(--bearish)'}}>{item.pnl!=null? `$${Number(item.pnl).toFixed(2)}`:'—'}</p></div>
                <div className="card-flat text-center !p-2"><p className="label !text-[9px]">Broker</p><p className="text-[10px] font-semibold truncate" style={{color:'var(--muted)'}}>{item.broker||'Manual'}</p></div>
              </div>
              <div className="flex gap-1.5 mb-2 items-center">
                {['Pending','Win','Loss'].map(s=> <button key={s} onClick={()=>onUpdateStatus(item.id,s)} className="pill !px-3 !py-1 !text-[10px]" style={item.status===s? (s==='Win'? {background:'var(--bullish)',color:'#fff',borderColor:'transparent'}: s==='Loss'? {background:'var(--bearish)',color:'#fff',borderColor:'transparent'}:{background:'var(--accent)',color:'#fff',borderColor:'transparent'}):undefined}>{s}</button>)}
                <button onClick={()=> setExpandedId(expandedId===item.id? null:item.id)} className="icon-btn ml-auto"><ChevronDown size={14} style={{transform: expandedId===item.id?'rotate(180deg)':'none', transition:'transform 0.15s ease'}}/></button>
              </div>
              {expandedId===item.id && (
                <div className="space-y-2 pt-2 border-t animate-fade-in" style={{borderColor:'var(--border)'}}>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block"><span className="label !normal-case !tracking-normal block mb-1">P&L ($)</span><input type="number" defaultValue={item.pnl??''} onBlur={e=>updatePnl(item,e.target.value)} placeholder="e.g. 45.2" className="field text-xs"/></label>
                    <label className="block"><span className="label !normal-case !tracking-normal block mb-1">Notes</span><input defaultValue={item.notes||''} onBlur={e=>updateNotes(item,e.target.value)} placeholder="Why entered, mood..." className="field text-xs"/></label>
                  </div>
                  {item.analysis?.executive_summary && <p className="text-xs italic text-secondary">"{DOMPurify.sanitize(item.analysis.executive_summary)}"</p>}
                  {item.analysis?.trade_setup && <p className="text-xs text-secondary">Bias {DOMPurify.sanitize(item.analysis.trade_setup.bias)} | {DOMPurify.sanitize(item.analysis.trade_setup.execution?.entry||'')} | R:R {DOMPurify.sanitize(item.analysis.trade_setup.execution?.risk_reward||'—')}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
