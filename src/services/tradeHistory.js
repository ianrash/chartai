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

const LS_ACCOUNT = 'chartai_account';

function parsePrice(v) {
  const n = parseFloat(String(v || '').replace(/,/g, ''));
  return isFinite(n) ? n : null;
}

export function loadAccountSettings() {
  try { return JSON.parse(localStorage.getItem(LS_ACCOUNT) || '{"balance":10000,"riskPercent":1}'); }
  catch { return { balance: 10000, riskPercent: 1 }; }
}
export function saveAccountSettings(settings) {
  try { localStorage.setItem(LS_ACCOUNT, JSON.stringify(settings)); } catch { /* ignore */ }
}

// Compute R-multiple from geometry (entry/stop/target) or realized P&L.
// Signed: positive = win, negative = loss (-1R), null = pending/insufficient data.
export function computeRMultiple(trade) {
  if (trade.risk != null && trade.risk !== '' && !isNaN(Number(trade.risk))) return Number(trade.risk);
  if (trade.pnl != null && !isNaN(Number(trade.pnl))) {
    const entry = parsePrice(trade.entry), stop = parsePrice(trade.stop);
    if (isFinite(entry) && isFinite(stop) && entry !== stop) { const r = Number(trade.pnl) / Math.abs(entry - stop); if (isFinite(r)) return Math.round(r * 100) / 100; }
  }
  const entry = parsePrice(trade.entry), stop = parsePrice(trade.stop), target = parsePrice(trade.target);
  if (isFinite(entry) && isFinite(stop) && entry !== stop && isFinite(target)) {
    const r = Math.abs(target - entry) / Math.abs(entry - stop);
    if (trade.status === 'Win') return Math.round(r * 100) / 100;
    if (trade.status === 'Loss') return -1;
  }
  return null;
}

// Auto-compute P&L from balance × risk% × R-multiple.
export function computeAutoPnl(trade, balance, riskPercent) {
  const r = computeRMultiple(trade);
  if (r == null) return null;
  const riskAmount = Number(balance || 0) * Number(riskPercent || 0) / 100;
  if (riskAmount <= 0) return null;
  if (r < 0) return Math.round(-riskAmount * 100) / 100;
  return Math.round(riskAmount * r * 100) / 100;
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
    // ---- Journal-only fields ----
    stop: trade.stop ?? null,
    target: trade.target ?? null,
    risk: trade.risk ?? null,          // manual R-multiple override (auto if null)
    emotion: trade.emotion ?? '',
    lesson: trade.lesson ?? '',
    followedPlan: trade.followedPlan ?? null,
    brokenRules: trade.brokenRules ?? [],
    setupType: trade.setupType ?? null,          // Breakout|Reversal|Continuation|Scalp|Swing|News
    marketCondition: trade.marketCondition ?? null, // Trending|Ranging|Choppy|Volatile|Quiet
    thesis: trade.thesis ?? '',                  // why I took this trade
    whatWentWell: trade.whatWentWell ?? '',
    whatToImprove: trade.whatToImprove ?? '',
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

// Compute win/loss streaks from resolved trades.
export function computeStreaks(trades) {
  const resolved = trades.filter(t => t.status === 'Win' || t.status === 'Loss');
  resolved.sort((a,b) => new Date(a.created_at||a.date) - new Date(b.created_at||b.date));
  let currentWin=0, currentLoss=0, maxWin=0, maxLoss=0;
  resolved.forEach(t=>{
    if(t.status==='Win'){ currentWin++; currentLoss=0; maxWin=Math.max(maxWin,currentWin); }
    else { currentLoss++; currentWin=0; maxLoss=Math.max(maxLoss,currentLoss); }
  });
  return { currentWin, currentLoss, maxWin, maxLoss };
}

// Map a symbol to an instrument group for filtering.
const GROUP_HINTS = [
  { group: 'crypto',  re: /BTC|ETH|SOL|XRP|DOGE|LTC|ADA|BNB|USDT|XLM|DOT|AVAX|MATIC|LINK|Crypto/i },
  { group: 'index',   re: /SPX|SP500|US500|NDX|US100|NAS|DJI|US30|DOW|IXIC|RUT|VIX|^GSPC|^DJI|^IXIC|^RUT|^VIX/i },
  { group: 'commodity', re: /GC=|CL=|SI=|HG=|NG=|XAU|XAG|GOLD|OIL|WTI|Brent|Copper|Silver/ },
  { group: 'forex',   re: /USD|EUR|GBP|JPY|CHF|AUD|NZD|CAD|XAUUSD|GOLD/i },
];
export function symbolGroup(symbol) {
  const s = String(symbol || '');
  for (const h of GROUP_HINTS) if (h.re.test(s)) return h.group;
  return 'other';
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
  const headers = ['id','symbol','date','bias','entry','stop','target','risk','rr','rating','status','pnl','notes','emotion','lesson','followedPlan','brokenRules','setupType','marketCondition','thesis','whatWentWell','whatToImprove'];
  const rows = trades.map(t=> headers.map(h=> {
    const v = h==='brokenRules' ? (t.brokenRules||[]).join('|') : t[h];
    return `"${String(v??'').replace(/"/g,'""')}"`;
  }).join(','));
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
      stop: obj.stop||null,
      target: obj.target||null,
      risk: obj.risk? Number(obj.risk): null,
      rr: obj.rr||'—',
      rating: obj.rating||'B',
      status: obj.status||'Pending',
      pnl: obj.pnl? Number(obj.pnl): null,
      notes: obj.notes||'',
      emotion: obj.emotion||'',
      lesson: obj.lesson||'',
      followedPlan: obj.followedPlan==='true'? true: obj.followedPlan==='false'? false: (obj.followedPlan??null),
      brokenRules: (obj.brokenRules? String(obj.brokenRules).split('|').map(s=>s.trim()).filter(Boolean): []),
      setupType: obj.setupType||null,
      marketCondition: obj.marketCondition||null,
      thesis: obj.thesis||'',
      whatWentWell: obj.whatWentWell||'',
      whatToImprove: obj.whatToImprove||'',
      score: 0,
      analysis: null,
    };
  });
}

export function computeStats(trades, balance, riskPercent) {
  const total = trades.length;
  const wins = trades.filter(t=> t.status==='Win').length;
  const losses = trades.filter(t=> t.status==='Loss').length;
  const pending = trades.filter(t=> t.status==='Pending').length;
  const winRate = total? Math.round((wins/(wins+losses||1))*100):0;
  const accBalance = Number(balance) || 0;
  const riskPct = Number(riskPercent) || 0;
  const riskPerTrade = accBalance * riskPct / 100;
  // P&L: use manual pnl when present, else auto-compute from balance/risk/R
  let totalPnl=0, best=0, worst=0;
  trades.forEach(t=>{
    let pnl = t.pnl;
    if ((pnl == null || isNaN(Number(pnl))) && accBalance > 0 && riskPct > 0) pnl = computeAutoPnl(t, accBalance, riskPct);
    if (pnl != null && !isNaN(Number(pnl))){ totalPnl+=Number(pnl); best=Math.max(best,Number(pnl)); worst=Math.min(worst,Number(pnl)); }
  });
  // grouping by symbol/bias
  const bySymbol={}; trades.forEach(t=>{ bySymbol[t.symbol]=(bySymbol[t.symbol]||0)+1; });
  const byBias={BUY:0,SELL:0}; trades.forEach(t=>{ if(t.bias==='BUY')byBias.BUY++; if(t.bias==='SELL')byBias.SELL++; });
  // calendar map date -> count/pnl
  const byDay={};
  trades.forEach(t=>{ const d=new Date(t.created_at||t.date); if(isNaN(d))return; const key=d.toISOString().slice(0,10); if(!byDay[key])byDay[key]={count:0,pnl:0,wins:0,losses:0}; byDay[key].count++; if(t.pnl!=null)byDay[key].pnl+=Number(t.pnl); if(t.status==='Win')byDay[key].wins++; if(t.status==='Loss')byDay[key].losses++; });
  // ---- R-multiple ----
  const rValues = trades.map(computeRMultiple).filter(r=> r!=null);
  const totalR = rValues.length? rValues.reduce((a,b)=>a+b,0):0;
  const avgR = rValues.length? Math.round((totalR/rValues.length)*100)/100: null;
  const expectancyR = total? Math.round((totalR/total)*100)/100 : null;
  const profitFactor = rValues.length? (()=>{ const g=rValues.filter(r=>r>0).reduce((a,b)=>a+b,0); const l=Math.abs(rValues.filter(r=>r<0).reduce((a,b)=>a+b,0)); return l>0? Math.round((g/l)*100)/100 : (g>0? Infinity : 0); })() : null;
  // ---- Discipline ----
  const decided = trades.filter(t=> t.followedPlan===true || t.followedPlan===false);
  const followedCount = decided.filter(t=> t.followedPlan===true).length;
  const disciplineScore = decided.length? Math.round((followedCount/decided.length)*100): null;
  const ruleBreaks = {};
  trades.forEach(t=>{ (t.brokenRules||[]).forEach(r=>{ ruleBreaks[r]=(ruleBreaks[r]||0)+1; }); });
  // ---- Streaks ----
  const streaks = computeStreaks(trades);
  // ---- By setup type & market condition ----
  const byCondition={}; trades.forEach(t=>{ const c=t.marketCondition||'Unspecified'; byCondition[c]=(byCondition[c]||0)+1; });
  const bySetupType={}; trades.forEach(t=>{ const s=t.setupType||'Unspecified'; bySetupType[s]=(bySetupType[s]||0)+1; });
  const setupStats={}; trades.forEach(t=>{ const s=t.setupType||'Unspecified'; if(!setupStats[s]) setupStats[s]={wins:0,total:0}; setupStats[s].total++; if(t.status==='Win') setupStats[s].wins++; });
  const bestSetupType = Object.entries(setupStats).filter(([,v])=>v.total>=3).sort((a,b)=>(b[1].wins/b[1].total)-(a[1].wins/a[1].total))[0]?.[0] || null;
  // ---- Weekly / monthly profit curve ----
  const byWeek={}, byMonth={};
  trades.forEach(t=>{ const d=new Date(t.created_at||t.date); if(isNaN(d))return;
    const pad=n=>String(n).padStart(2,'0');
    const weekKey=`${d.getFullYear()}-W${pad(Math.ceil((d.getDate())/7))}`;
    const monthKey=`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
    if(!byWeek[weekKey])byWeek[weekKey]={pnl:0,count:0};
    if(!byMonth[monthKey])byMonth[monthKey]={pnl:0,count:0};
    const p=Number(t.pnl)||0;
    byWeek[weekKey].pnl+=p; byWeek[weekKey].count++;
    byMonth[monthKey].pnl+=p; byMonth[monthKey].count++;
  });
  const weekSeries = Object.entries(byWeek).map(([k,v])=>({key:k,...v})).sort((a,b)=>a.key.localeCompare(b.key));
  const monthSeries = Object.entries(byMonth).map(([k,v])=>({key:k,...v})).sort((a,b)=>a.key.localeCompare(b.key));
  // ---- Best / worst DAY (by net pnl) ----
  let bestDay=null, worstDay=null;
  Object.entries(byDay).forEach(([key,v])=>{ if(v.count===0)return; if(!bestDay||v.pnl>bestDay.pnl) bestDay={key,...v}; if(!worstDay||v.pnl<worstDay.pnl) worstDay={key,...v}; });
  const resolvedCount = trades.filter(t=> t.status !== 'Pending').length;
  return { total, wins, losses, pending, winRate, totalPnl, best, worst, bySymbol, byBias, byDay,
    totalR, avgR, expectancyR, profitFactor,
    disciplineScore, ruleBreaks, decided,
    weekSeries, monthSeries, bestDay, worstDay,
    streaks, byCondition, bySetupType, bestSetupType,
    accountBalance: accBalance || null, riskPercent: riskPct || null, riskPerTrade,
    totalRisk: resolvedCount * riskPerTrade, equity: accBalance + totalPnl };
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
