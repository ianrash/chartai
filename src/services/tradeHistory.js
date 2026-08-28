import { supabase } from '../supabaseClient';

const LS_KEY = 'chartai_local_history';
const LS_WATCHLIST = 'chartai_watchlist';
const LS_ALERTS = 'chartai_alerts';
const LS_BROKERS = 'chartai_brokers';

// ----- Local helpers -----
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveLocal(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

export async function loadTradeHistory(userId) {
  // Try Supabase first
  if (supabase && userId) {
    const { data, error } = await supabase
      .from('trade_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      // merge with local unsynced?
      return data;
    }
    console.warn('Supabase load failed, falling back to local', error?.message);
  }
  return loadLocal().sort((a,b)=> new Date(b.created_at||b.date) - new Date(a.created_at||a.date));
}

export async function saveTradeToHistory(userId, trade) {
  const entry = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    symbol: trade.symbol,
    date: trade.date,
    bias: trade.bias,
    entry: trade.entry,
    rr: trade.rr,
    rating: trade.rating,
    score: trade.score,
    status: trade.status || 'Pending',
    analysis: trade.analysis,
    pnl: trade.pnl ?? null,
    tags: trade.tags ?? [],
    notes: trade.notes ?? '',
    broker: trade.broker ?? 'Manual',
  };
  if (supabase && userId) {
    const { data, error } = await supabase
      .from('trade_history')
      .insert([{ user_id: userId, symbol: entry.symbol, date: entry.date, bias: entry.bias, entry: entry.entry, rr: entry.rr, rating: entry.rating, score: entry.score, status: entry.status, analysis: entry.analysis }])
      .select().single();
    if (!error && data) return data;
    console.warn('Supabase save failed, saving locally', error?.message);
  }
  const arr = loadLocal();
  arr.unshift(entry);
  saveLocal(arr);
  return entry;
}

export async function updateTradeStatus(userId, tradeId, status) {
  if (supabase && userId) {
    const { data, error } = await supabase.from('trade_history').update({ status }).eq('id', tradeId).eq('user_id', userId).select().single();
    if (!error) return data;
  }
  const arr = loadLocal();
  const idx = arr.findIndex(x=> String(x.id)===String(tradeId));
  if (idx>=0) { arr[idx].status=status; saveLocal(arr); return arr[idx]; }
  return null;
}

export async function updateTradeFields(userId, tradeId, fields) {
  if (supabase && userId) {
    const { data, error } = await supabase.from('trade_history').update(fields).eq('id', tradeId).eq('user_id', userId).select().single();
    if (!error) return data;
  }
  const arr = loadLocal();
  const idx = arr.findIndex(x=> String(x.id)===String(tradeId));
  if (idx>=0) { arr[idx]={...arr[idx], ...fields}; saveLocal(arr); return arr[idx]; }
  return null;
}

export async function deleteTrade(userId, tradeId) {
  if (supabase && userId) {
    const { error, count } = await supabase.from('trade_history').delete({ count:'exact' }).eq('id', tradeId).eq('user_id', userId);
    if (!error && count>0) return true;
  }
  const arr = loadLocal();
  const filtered = arr.filter(x=> String(x.id)!==String(tradeId));
  if (filtered.length !== arr.length) { saveLocal(filtered); return true; }
  return false;
}

export async function bulkImportTrades(userId, trades) {
  const out=[];
  for (const t of trades) {
    const r = await saveTradeToHistory(userId, t);
    if (r) out.push(r);
  }
  return out;
}

export function exportTradesCSV(trades) {
  const headers = ['id','symbol','date','bias','entry','rr','rating','status','pnl','notes'];
  const rows = trades.map(t=> headers.map(h=> `"${String(t[h]??'').replace(/"/g,'""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length<2) return [];
  const headers = lines[0].split(',').map(h=> h.trim().replace(/^"|"$/g,''));
  return lines.slice(1).map(line=>{
    // naive split respecting quotes
    const vals=[]; let cur='', inQ=false;
    for (let i=0;i<line.length;i++){ const c=line[i]; if(c==='"'){ if(line[i+1]==='"'){cur+='"';i++;} else inQ=!inQ; } else if(c===','&&!inQ){ vals.push(cur);cur=''; } else cur+=c; }
    vals.push(cur);
    const obj={};
    headers.forEach((h,i)=> obj[h]= (vals[i]||'').replace(/^"|"$/g,''));
    return {
      symbol: obj.symbol||'Unknown',
      date: obj.date|| new Date().toLocaleString(),
      bias: obj.bias||'BUY',
      entry: obj.entry||'Market',
      rr: obj.rr||'—',
      rating: obj.rating||'B',
      status: obj.status||'Pending',
      pnl: obj.pnl? Number(obj.pnl): null,
      notes: obj.notes||'',
      score: 0,
      analysis: null,
    };
  });
}

export function computeStats(trades) {
  const total = trades.length;
  const wins = trades.filter(t=> t.status==='Win').length;
  const losses = trades.filter(t=> t.status==='Loss').length;
  const pending = trades.filter(t=> t.status==='Pending').length;
  const winRate = total? Math.round((wins/(wins+losses||1))*100):0;
  // P&L if pnl present else estimate from RR
  let totalPnl=0, best=0, worst=0;
  trades.forEach(t=>{ if(t.pnl!=null&&!isNaN(Number(t.pnl))){ totalPnl+=Number(t.pnl); best=Math.max(best,Number(t.pnl)); worst=Math.min(worst,Number(t.pnl)); }});
  // grouping by symbol/bias
  const bySymbol={}; trades.forEach(t=>{ bySymbol[t.symbol]=(bySymbol[t.symbol]||0)+1; });
  const byBias={BUY:0,SELL:0}; trades.forEach(t=>{ if(t.bias==='BUY')byBias.BUY++; if(t.bias==='SELL')byBias.SELL++; });
  // calendar map date -> count/pnl
  const byDay={};
  trades.forEach(t=>{ const d=new Date(t.created_at||t.date); if(isNaN(d))return; const key=d.toISOString().slice(0,10); if(!byDay[key])byDay[key]={count:0,pnl:0,wins:0,losses:0}; byDay[key].count++; if(t.pnl)byDay[key].pnl+=Number(t.pnl); if(t.status==='Win')byDay[key].wins++; if(t.status==='Loss')byDay[key].losses++; });
  return { total, wins, losses, pending, winRate, totalPnl, best, worst, bySymbol, byBias, byDay };
}

// Watchlist helpers
export function loadWatchlist(){ try{return JSON.parse(localStorage.getItem(LS_WATCHLIST)||'[]');}catch{return[];} }
export function saveWatchlist(list){ localStorage.setItem(LS_WATCHLIST, JSON.stringify(list)); }
export function loadAlerts(){ try{return JSON.parse(localStorage.getItem(LS_ALERTS)||'[]');}catch{return[];} }
export function saveAlerts(list){ localStorage.setItem(LS_ALERTS, JSON.stringify(list)); }
export function loadBrokers(){ try{return JSON.parse(localStorage.getItem(LS_BROKERS)||'[]');}catch{return[];} }
export function saveBrokers(list){ localStorage.setItem(LS_BROKERS, JSON.stringify(list)); }

// ----- Daily analysis usage limit -----
const LS_USAGE = 'chartai_usage_daily';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadDailyUsage(userId = 'guest') {
  try {
    const all = JSON.parse(localStorage.getItem(LS_USAGE) || '{}');
    const entry = all[userId] || {};
    if (entry.date !== todayKey()) {
      return { count: 0, date: todayKey(), limit: 3 };
    }
    return { count: entry.count || 0, date: entry.date, limit: 3 };
  } catch {
    return { count: 0, date: todayKey(), limit: 3 };
  }
}

export function incrementDailyUsage(userId = 'guest') {
  const key = todayKey();
  const current = loadDailyUsage(userId);
  const nextCount = (current.date === key ? current.count : 0) + 1;
  try {
    const all = JSON.parse(localStorage.getItem(LS_USAGE) || '{}');
    all[userId] = { date: key, count: nextCount };
    localStorage.setItem(LS_USAGE, JSON.stringify(all));
  } catch { /* ignore quota errors */ }
  return { count: nextCount, date: key, limit: 3 };
}
