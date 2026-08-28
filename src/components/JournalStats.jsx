import { Trophy, TrendingUp, TrendingDown, Clock, DollarSign, Target, Activity, Calendar } from 'lucide-react';

export default function JournalStats({ stats }) {
  if (!stats) return null;
  const cards = [
    { label:'Total Trades', value: stats.total, icon: Activity, color:'var(--accent)' },
    { label:'Win Rate', value: `${stats.winRate}%`, icon: Trophy, color:'var(--bullish)' },
    { label:'Wins / Losses', value: `${stats.wins} / ${stats.losses}`, icon: stats.wins>=stats.losses? TrendingUp: TrendingDown, color: stats.wins>=stats.losses?'var(--bullish)':'var(--bearish)' },
    { label:'Pending', value: stats.pending, icon: Clock, color:'var(--neutral)' },
    { label:'Total P&L', value: `${stats.totalPnl>=0?'+':''}$${stats.totalPnl.toFixed(2)}`, icon: DollarSign, color: stats.totalPnl>=0?'var(--bullish)':'var(--bearish)' },
    { label:'Best / Worst', value: `$${stats.best.toFixed(0)} / $${stats.worst.toFixed(0)}`, icon: Target, color:'var(--accent)' },
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
          return <div key={d.key} title={`${d.key}: ${data? `${data.count} trades, ${data.wins}W/${data.losses}L`:'no trades'}`} className="aspect-square rounded-md flex items-center justify-center text-[8px] font-bold" style={{background: bg, opacity, color: data? '#fff':'var(--muted)', border:'1px solid var(--border)'}}>{d.date.getDate()}</div>;
        })}
      </div>
    </div>
  );
}
