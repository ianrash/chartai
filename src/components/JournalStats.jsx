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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map(c=> (
        <div key={c.label} className="rounded-xl p-3 flex items-center gap-3" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:`${c.color}15`, color:c.color}}><c.icon size={16}/></div>
          <div className="min-w-0"><p className="text-[10px] text-muted uppercase tracking-wider">{c.label}</p><p className="text-sm font-bold text-main truncate">{c.value}</p></div>
        </div>
      ))}
    </div>
  );
}

export function CalendarHeatmap({ byDay }) {
  // last 35 days grid
  const days=[];
  const today=new Date();
  for(let i=34;i>=0;i--){ const d=new Date(today); d.setDate(today.getDate()-i); const key=d.toISOString().slice(0,10); days.push({date:d, key, data: byDay[key]}); }
  return (
    <div className="rounded-xl p-4" style={{background:'var(--surface-2)', border:'1px solid var(--border)'}}>
      <div className="flex items-center gap-2 mb-3"><Calendar size={14} className="text-accent"/><span className="text-xs font-bold text-main">Activity — last 35 days</span></div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(d=>{
          const data=d.data;
          const bg = !data? 'var(--surface)': data.wins>data.losses? 'var(--bullish)': data.losses>data.wins? 'var(--bearish)': 'rgba(251,191,36,0.6)';
          const opacity = !data? 1 : Math.min(1, 0.4 + data.count*0.2);
          return <div key={d.key} title={`${d.key}: ${data? `${data.count} trades, ${data.wins}W/${data.losses}L, ${Number(data.pnl).toFixed(0)}$`:'no trades'}`} className="aspect-square rounded-md flex items-center justify-center text-[8px] font-bold" style={{background: bg, opacity, color: data? '#fff':'var(--muted)', border:'1px solid var(--border)'}}>{d.date.getDate()}</div>;
        })}
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
