import { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Clock, DollarSign, Target, Activity, Calendar, Scale, ShieldAlert, Flame, TrendingDown as LossDay } from 'lucide-react';

function fmtR(v) {
  if (v == null || isNaN(v)) return '—';
  return `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}R`;
}

export default function JournalStats({ stats }) {
  if (!stats) return null;
  const cards = [
    { label:'Total Trades', value: stats.total, icon: Activity, color:'var(--accent)' },
    { label:'Win Rate', value: `${stats.winRate}%`, icon: Trophy, color:'var(--bullish)' },
    { label:'Wins / Losses', value: `${stats.wins} / ${stats.losses}`, icon: stats.wins>=stats.losses? TrendingUp: TrendingDown, color: stats.wins>=stats.losses?'var(--bullish)':'var(--bearish)' },
    { label:'Pending', value: stats.pending, icon: Clock, color:'var(--neutral)' },
    { label:'Total P&L', value: `${stats.totalPnl>=0?'+':''}$${stats.totalPnl.toFixed(2)}`, icon: DollarSign, color: stats.totalPnl>=0?'var(--bullish)':'var(--bearish)' },
    { label:'Total R', value: fmtR(stats.totalR), icon: Scale, color:'var(--accent)' },
    { label:'Avg R', value: fmtR(stats.avgR), icon: Target, color:'var(--accent)' },
    { label:'Expectancy /R', value: fmtR(stats.expectancyR), icon: TrendingUp, color: (stats.expectancyR??0)>=0?'var(--bullish)':'var(--bearish)' },
    { label:'Profit Factor', value: stats.profitFactor!=null? (isFinite(stats.profitFactor)? Number(stats.profitFactor).toFixed(2): '∞') : '—', icon: Target, color:'var(--bullish)' },
    { label:'Discipline', value: stats.disciplineScore!=null? `${stats.disciplineScore}%` : '—', icon: ShieldAlert, color: (stats.disciplineScore??0)>=70?'var(--bullish)':(stats.disciplineScore??0)>=40?'var(--neutral)':'var(--bearish)' },
    { label:'Best Day', value: stats.bestDay? `${stats.bestDay.key.slice(5)} +$${Number(stats.bestDay.pnl).toFixed(0)}` : '—', icon: Flame, color:'var(--bullish)' },
    { label:'Worst Day', value: stats.worstDay? `${stats.worstDay.key.slice(5)} $${Number(stats.worstDay.pnl).toFixed(0)}` : '—', icon: LossDay, color:'var(--bearish)' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map(c=> (
          <div key={c.label} className="rounded-xl p-3 flex items-center gap-3" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:`${c.color}15`, color:c.color}}><c.icon size={16}/></div>
            <div className="min-w-0"><p className="text-[10px] text-muted uppercase tracking-wider">{c.label}</p><p className="text-sm font-bold text-main truncate">{c.value}</p></div>
          </div>
        ))}
      </div>
      {stats.streaks && <StreaksCard streaks={stats.streaks} />}
      {(stats.bySetupType || stats.byCondition) && <SetupConditionStats bySetupType={stats.bySetupType} byCondition={stats.byCondition} bestSetupType={stats.bestSetupType} />}
    </div>
  );
}

function StreaksCard({ streaks }) {
  const cards = [
    { label:'Current Win Streak', value: streaks.currentWin, icon: TrendingUp, color:'var(--bullish)', accent: streaks.currentWin>0 },
    { label:'Current Loss Streak', value: streaks.currentLoss, icon: TrendingDown, color:'var(--bearish)', accent: streaks.currentLoss>0 },
    { label:'Max Win Streak', value: streaks.maxWin, icon: Flame, color:'var(--bullish)' },
    { label:'Max Loss Streak', value: streaks.maxLoss, icon: LossDay, color:'var(--bearish)' },
  ];
  return (
    <div className="rounded-xl p-3" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
      <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Streaks</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c=> (
          <div key={c.label} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{background:`${c.color}15`, color:c.color}}><c.icon size={12}/></div>
            <div><p className="text-[9px] text-muted uppercase leading-tight">{c.label}</p><p className={`text-sm font-bold ${c.accent?'animate-pulse-slow':''}`} style={{color:c.color}}>{c.value}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SETUP_COLORS = {Breakout:'#2962ff',Reversal:'#089981',Continuation:'#d1a33f',Scalp:'#9c6bcf',Swing:'#f23645',News:'#6b7280',Unspecified:'var(--muted)'};
const COND_COLORS = {Trending:'#089981',Ranging:'#2962ff',Choppy:'#d1a33f',Volatile:'#f23645',Quiet:'#6b7280',Unspecified:'var(--muted)'};

function SetupConditionStats({ bySetupType, byCondition, bestSetupType }) {
  const maxSetup = Math.max(...Object.values(bySetupType||{}), 1);
  const maxCond = Math.max(...Object.values(byCondition||{}), 1);
  return (
    <div className="rounded-xl p-3 space-y-3" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted uppercase tracking-wider">Setup Types</span>
        {bestSetupType && bestSetupType!=='Unspecified' && <span className="text-[9px] font-bold" style={{color:'var(--bullish)'}}>Best: {bestSetupType}</span>}
      </div>
      <div className="space-y-1.5">
        {Object.entries(bySetupType||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(
          <div key={k} className="flex items-center gap-2">
            <span className="text-[9px] text-muted w-[80px] truncate">{k}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'var(--surface-3)'}}>
              <div className="h-full rounded-full" style={{width:`${(v/maxSetup)*100}%`, background:SETUP_COLORS[k]||'var(--accent)', opacity:0.75}} />
            </div>
            <span className="text-[9px] font-bold" style={{color:SETUP_COLORS[k]||'var(--accent)'}}>{v}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Market Condition</p>
        <div className="space-y-1.5">
          {Object.entries(byCondition||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(
            <div key={k} className="flex items-center gap-2">
              <span className="text-[9px] text-muted w-[80px] truncate">{k}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'var(--surface-3)'}}>
                <div className="h-full rounded-full" style={{width:`${(v/maxCond)*100}%`, background:COND_COLORS[k]||'var(--accent)', opacity:0.75}} />
              </div>
              <span className="text-[9px] font-bold" style={{color:COND_COLORS[k]||'var(--accent)'}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const DOW = ['Su','M','T','W','T','F','S'];
const SENTIMENT = {
  bullish: ['rgba(8,153,129,0.15)','rgba(8,153,129,0.35)','rgba(8,153,129,0.55)','rgba(8,153,129,0.75)','rgba(8,153,129,1.0)'],
  bearish: ['rgba(242,54,69,0.15)','rgba(242,54,69,0.35)','rgba(242,54,69,0.55)','rgba(242,54,69,0.75)','rgba(242,54,69,1.0)'],
  neutral: ['rgba(209,163,63,0.15)','rgba(209,163,63,0.35)','rgba(209,163,63,0.55)','rgba(209,163,63,0.75)','rgba(209,163,63,1.0)'],
};
function sentOf(d) { if (!d) return 'neutral'; return d.wins > d.losses ? 'bullish' : d.losses > d.wins ? 'bearish' : 'neutral'; }
function lvl(count) { if (!count) return -1; return Math.min(4, Math.floor((count - 1) / 3)); }

export function CalendarHeatmap({ byDay }) {
  const [hover, setHover] = useState(null);
  const { weeks, monthLabels, todayKey } = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0,10);
    const thisSunday = new Date(today);
    thisSunday.setDate(today.getDate() - today.getDay());
    const weeks = []; const monthLabels = []; let prevMonth = -1;
    for (let w = 4; w >= 0; w--) {
      const ws = new Date(thisSunday); ws.setDate(thisSunday.getDate() - w * 7);
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(ws); date.setDate(ws.getDate() + d);
        const key = date.toISOString().slice(0,10);
        week.push({ date, key, data: byDay?.[key], isFuture: date > today });
        const m = date.getMonth();
        if (m !== prevMonth) { monthLabels.push({ col: d, label: date.toLocaleString('en',{month:'short'}) }); prevMonth = m; }
      }
      weeks.push(week);
    }
    return { weeks, monthLabels, todayKey };
  }, [byDay]);

  const periodStats = useMemo(() => {
    let totalPnl=0, totalTrades=0, wins=0, losses=0;
    Object.values(byDay||{}).forEach(d=>{ if(!d) return; totalPnl+=(d.pnl||0); totalTrades+=(d.count||0); wins+=(d.wins||0); losses+=(d.losses||0); });
    return { totalPnl, totalTrades, wins, losses, wr: totalTrades ? Math.round(wins/(wins+losses||1)*100) : 0 };
  }, [byDay]);

  const empty = !byDay || Object.keys(byDay).length === 0;

  if (empty) {
    return (
      <div className="rounded-xl p-5" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
        <div className="flex items-center gap-2 mb-3"><Calendar size={14} className="text-accent"/><span className="text-xs font-bold text-main">Activity</span></div>
        <div className="flex items-center justify-center py-10 text-sm text-muted">No trading data yet</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4" style={{background:'var(--surface-2)', border:'1px solid var(--border)', boxShadow:'0 0 28px var(--accent-glow), var(--shadow-card)'}}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Calendar size={14} className="text-accent"/><span className="text-xs font-bold text-main">Activity</span></div>
        <span className="text-[10px] text-muted uppercase tracking-wider">last 5 weeks</span>
      </div>
      <div className="max-w-[380px] mx-auto">
        <div className="flex gap-[3px] mb-1">
          {DOW.map(d=><div key={d} className="flex-1 h-[18px] flex items-center justify-center text-[9px] font-semibold text-muted">{d}</div>)}
        </div>
        <div className="flex gap-[3px] mb-[3px] h-[16px]">
          {Array.from({length:7},(_,di)=>{ const ml=monthLabels.find(m=>m.col===di); return <div key={di} className="flex-1 h-full flex items-center justify-center text-[9px] font-bold" style={{color:'var(--muted)'}}>{ml?.label||''}</div>; })}
        </div>
        {weeks.map((week,wi)=>(
          <div key={week[0].key} className="flex gap-[3px] mb-[3px]">
            {week.map((cell,di)=>{
              const l=cell.isFuture?-1:lvl(cell.data?.count);
              const sent=cell.isFuture?'neutral':sentOf(cell.data);
              const isToday=cell.key===todayKey;
              const colorArr=SENTIMENT[sent];
              const bg=l<0?'var(--surface)':colorArr[l];
              const hovered=hover?.key===cell.key;
              return (
                <div key={cell.key} className="heatmap-cell relative flex-1" style={{aspectRatio:'1',animationDelay:`${(wi*7+di)*35}ms`,animation:'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards',opacity:0}}
                     onMouseEnter={()=>setHover({key:cell.key,cell})} onMouseLeave={()=>setHover(null)}>
                   <div className="w-full h-full rounded-[5px] transition-all duration-150"
                        style={{background:bg,boxShadow:isToday?'0 0 0 2px var(--accent)':hovered?'0 0 12px var(--accent-glow)':'none',transform:hovered?'scale(1.1)':'scale(1)'}} />
                   {(cell.data?.wins || cell.data?.losses) && !cell.isFuture && (
                     <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none">
                       {Array.from({length: Math.min(cell.data?.wins||0, 5)}).map((_,i)=> <div key={`w-${i}`} className="w-1 h-1 rounded-full bg-[#089981]" />)}
                       {Array.from({length: Math.min(cell.data?.losses||0, 5)}).map((_,i)=> <div key={`l-${i}`} className="w-1 h-1 rounded-full bg-[#f23645]" />)}
                     </div>
                   )}
                   {hover?.key===cell.key && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg pointer-events-none"
                         style={{background:'rgba(18,21,26,0.97)',backdropFilter:'blur(12px)',border:'1px solid var(--border)',boxShadow:'0 8px 24px rgba(0,0,0,0.55)',zIndex:50,whiteSpace:'nowrap',opacity:hovered?1:0,transition:'opacity 0.12s ease'}}>
                      <div className="text-[11px] font-bold text-main mb-1">{cell.date.toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</div>
                      <div className="text-[10px] mb-0.5" style={{color:'var(--text-secondary)'}}>{cell.data?.count||0} trade{cell.data?.count!==1?'s':''} · {cell.data?.wins||0}W / {cell.data?.losses||0}L</div>
                      <div className="text-[12px] font-bold" style={{color:(cell.data?.pnl||0)>=0?'var(--bullish)':'var(--bearish)'}}>
                        {(cell.data?.pnl||0)>=0?'+':''}{Number(cell.data?.pnl||0).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-[9px] text-muted">Less</span>
          {[0,1,2,3,4].map(i=><div key={i} className="w-3 h-3 rounded-[3px]" style={{background:SENTIMENT.neutral[i],opacity:i===0?0.35:1}} />)}
          <span className="text-[9px] text-muted">More</span>
        </div>
        <div className="flex items-center justify-center gap-3 mt-2.5 pt-2.5" style={{borderTop:'1px solid var(--border)'}}>
          <span className="text-[10px] text-muted">Period P&L:</span>
          <span className="text-xs font-bold" style={{color:periodStats.totalPnl>=0?'var(--bullish)':'var(--bearish)'}}>
            {periodStats.totalPnl>=0?'+':''}{Number(periodStats.totalPnl).toFixed(2)}
          </span>
          <span className="text-[10px]" style={{color:'var(--muted)'}}>·</span>
          <span className="text-[10px]" style={{color:'var(--text-secondary)'}}>{periodStats.wr}% WR</span>
          <span className="text-[10px]" style={{color:'var(--muted)'}}>·</span>
          <span className="text-[10px]" style={{color:'var(--text-secondary)'}}>{periodStats.totalTrades} trades</span>
        </div>
      </div>
    </div>
  );
}

// Weekly or monthly profit curve (simple inline bars).
export function ProfitCurve({ series, unit }) {
  if (!series || series.length === 0) return null;
  const max = Math.max(...series.map(s=>Math.abs(s.pnl)), 1);
  return (
    <div className="rounded-xl p-4" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-main">Profit — by {unit}</span>
        <span className="text-[10px] text-muted uppercase tracking-wider">{series.length} periods</span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {series.map(s=>(
          <div key={s.key} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${s.key}: ${Number(s.pnl).toFixed(2)}$ (${s.count} trades)`}>
            <div className="w-full rounded-t" style={{ height: `${Math.max(2, (Math.abs(s.pnl)/max)*80)}px`, background: s.pnl>=0? 'var(--bullish)':'var(--bearish)', opacity: s.pnl===0?0.3:0.85 }} />
            <span className="text-[7px] text-muted truncate w-full text-center">{s.key.slice(-5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
