import { useState, useCallback, useEffect, useRef } from "react";
import UploadZone from "./components/UploadZone";
import AnalysisCard from "./components/AnalysisCard";
import HTFCard from "./components/HTFCard";
import LTFCard from "./components/LTFCard";
import TradeSetup from "./components/TradeSetup";
import ConfluenceChecklist from "./components/ConfluenceChecklist";
import HistorySidebar from "./components/HistorySidebar";
import SessionCountdown from "./components/SessionCountdown";


import { analyzeChart } from "./api/analyzeChart";
import html2pdf from "html2pdf.js";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  BarChart2,
  Zap,
  ShieldAlert,
  Activity,
  Cpu,
  ChartCandlestick,
  RefreshCw,
  Moon,
  Sun,
  History,
  Download,
  Calendar,
  Type,
  AlertTriangle
} from "lucide-react";
import "./index.css";

const calculateConfluenceScore = (checklist) => {
  if (!checklist) return 0;
  const values = Object.values(checklist);
  return Math.round((values.filter(Boolean).length / values.length) * 100);
};

const getProbabilityRating = (confluencePercent) => {
  if (confluencePercent >= 90) return "A+";
  if (confluencePercent >= 75) return "A";
  if (confluencePercent >= 60) return "B";
  if (confluencePercent >= 40) return "C";
  return "F";
};

const calculateCorrectTrend = (analysis) => {
  if (!analysis) return { overall: "Neutral", htf: "Neutral", ltf: "Neutral" };
  
  const htfDir = analysis.htf_analysis?.trend?.direction || "Neutral";
  const ltfConf = analysis.ltf_analysis?.trend?.confirmation;
  
  let htf = htfDir;
  if (!["Bullish", "Bearish", "Neutral"].includes(htf)) htf = "Neutral";
  
  let ltf = "Neutral";
  if (ltfConf === "Confirms HTF" && htf === "Bullish") ltf = "Bullish";
  else if (ltfConf === "Confirms HTF" && htf === "Bearish") ltf = "Bearish";
  else if (ltfConf === "Contradicts HTF") ltf = "Neutral";
  
  let overall = htf;
  if (ltfConf === "Contradicts HTF") overall = "Neutral";
  
  return { overall, htf, ltf };
};

const TREND_CONFIG = {
  Bullish: { color: "var(--bullish)", Icon: TrendingUp },
  Bearish: { color: "var(--bearish)", Icon: TrendingDown },
  Neutral: { color: "var(--neutral)", Icon: Minus },
  Ranging: { color: "var(--neutral)", Icon: Minus },
};

export default function App() {
  const [charts, setCharts] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 16));
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  
  // History state
  const [history, setHistory] = useState(JSON.parse(localStorage.getItem("tradeHistory") || "[]"));
  const [showHistory, setShowHistory] = useState(false);

  const analysisRef = useRef(null);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("tradeHistory", JSON.stringify(history));
  }, [history]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const handleChartsChange = useCallback((newCharts) => {
    setCharts(newCharts);
    setAnalysis(null);
    setError(null);
  }, []);

  const handleAnalyze = async () => {
    if (charts.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeChart(charts, "Auto", "Auto");
      setAnalysis(data);
    } catch (err) {
      setError(err.message || "Analysis failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCharts([]);
    setAnalysis(null);
    setError(null);
    setSymbol("");
  };

  const handleSaveSetup = (trade) => {
    const checklist = analysis?.confluence_checklist || {};
    const score = calculateConfluenceScore(checklist);
    const rating = getProbabilityRating(score);

    const newEntry = {
      id: Date.now(),
      symbol: symbol || "Unknown",
      date: new Date(sessionDate).toLocaleString(),
      bias: trade.bias,
      entry: trade.execution?.entry_zone || trade.execution?.entry || "Market",
      rr: trade.execution?.risk_reward || "—",
      rating: rating,
      score: score,
      status: "Pending",
      analysis: analysis,
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 10));
    setShowHistory(true);
  };

  const updateHistoryStatus = (id, status) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  const deleteHistoryItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleExportPDF = () => {
    const element = analysisRef.current;
    if (!element) return;
    
    const opt = {
      margin: 0.2,
      filename: `ChartAI_${symbol || 'Analysis'}_${new Date().toLocaleDateString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const trendInfo = calculateCorrectTrend(analysis);
  const trendCfg = analysis
    ? TREND_CONFIG[trendInfo.overall] ?? TREND_CONFIG.Neutral
    : null;

  return (
    <div className="min-h-screen bg-bg font-sans pb-24 md:pb-10 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-white/5 bg-surface/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <ChartCandlestick size={16} className="text-white" />
            </div>
            <span className="text-main font-bold text-lg tracking-tight hidden sm:inline">
              ChartAI
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/5 text-muted transition-all">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setShowHistory(true)} className="p-2 rounded-lg hover:bg-white/5 text-muted transition-all relative">
              <History size={18} />
              {history.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-surface" />}
            </button>
            {(analysis || charts.length > 0) && (
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs sm:text-sm text-main transition-colors"
              >
                <RefreshCw size={14} />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Session Countdown Timer */}
      <SessionCountdown />

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Panel: Inputs & Upload */}
          <div className="flex flex-col gap-6">
            <div className="card bg-gradient-to-br from-accent/10 via-surface-2 to-accent/5 border-accent/30">
              <div className="text-center py-6">
                <p className="text-xl md:text-2xl font-bold text-accent tracking-widest uppercase">Your Chart, Your Edge</p>
                <p className="text-lg font-semibold text-main mt-2">Let's Build The Plan</p>
                <div className="flex justify-center gap-2 mt-4">
                  <div className="w-12 h-0.5 bg-accent/50 rounded"></div>
                  <div className="w-2 h-0.5 bg-accent rounded-full animate-pulse"></div>
                  <div className="w-12 h-0.5 bg-accent/50 rounded"></div>
                </div>
              </div>
            </div>

            <UploadZone charts={charts} onChartsChange={handleChartsChange} />

            {error && (
              <div className="card border border-bearish/30 bg-bearish/5 text-bearish text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Analyze Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/90 backdrop-blur-md border-t border-white/10 z-40 md:relative md:bg-transparent md:border-none md:p-0 md:backdrop-blur-none">
              <button
                className="btn-primary w-full text-base py-4 shadow-lg shadow-accent/20 md:shadow-none"
                onClick={handleAnalyze}
                disabled={charts.length < 2 || loading}
              >
                {loading ? (
                  <>
                    <Cpu size={18} className="animate-spin" />
                    Crunching Data…
                  </>
                ) : (
                  <>
                    <Activity size={18} />
                    {charts.length < 2 ? "Upload min. 2 charts" : "Analyze Setup"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Analysis Output */}
          <div className="flex flex-col gap-6" id="analysis-report" ref={analysisRef}>
            {!analysis && !loading && (
              <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Layers className="text-muted" size={24} />
                </div>
                <p className="text-main font-semibold mb-1">Waiting for data...</p>
                <p className="text-muted text-sm max-w-xs">Upload charts and set your symbol to generate a professional trade plan.</p>
              </div>
            )}

            {loading && (
              <div className="card flex flex-col items-center justify-center py-20 gap-6 animate-pulse-slow">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Cpu className="text-accent animate-spin" size={32} />
                </div>
                <div className="text-center">
                  <p className="text-main font-semibold mb-1">AI Analyst is working...</p>
                  <p className="text-muted text-sm">Identifying structure, sweeps, and confluence factors</p>
                </div>
              </div>
            )}

            {analysis && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-main">{symbol || "Trade Analysis"}</h2>
                        {(() => {
                          const score = calculateConfluenceScore(analysis.confluence_checklist);
                          const rating = getProbabilityRating(score);
                          const colors = {
                            "A+": { bg: "bg-green-500/20", border: "border-green-500/40", text: "text-green-400" },
                            "A": { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400" },
                            "B": { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-400" },
                            "C": { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-400" },
                            "F": { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400" },
                          };
                          const c = colors[rating] || colors.F;
                          return (
                            <span className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${c.bg} ${c.border} ${c.text}`}>
                              {rating}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted">{analysis.session_context} Session • {analysis.instrument_detected || "Unknown"}</p>
                    </div>
                    {trendCfg && (
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{ color: trendCfg.color, backgroundColor: `${trendCfg.color}15`, border: `1px solid ${trendCfg.color}33` }}
                      >
                        <trendCfg.Icon size={12} />
                        {trendInfo.overall} Trend
                      </div>
                    )}
                  </div>
                  <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-main text-xs transition-all">
                    <Download size={14} /> Export PDF
                  </button>
                </div>

                {/* Contradiction Warning */}
                {analysis.ltf_analysis?.trend?.confirmation === "Contradicts HTF" && (
                  <div className="p-3 rounded-lg bg-bearish/15 border border-bearish/40">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-bearish" />
                      <span className="text-xs font-bold text-bearish uppercase">WARNING: HTF and LTF are contradicting each other</span>
                    </div>
                    <p className="text-sm text-main mt-1">This is a lower probability setup. Reduce position size or wait for LTF to align with HTF before entering.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HTFCard data={analysis.htf_analysis} />
                  <LTFCard data={analysis.ltf_analysis} />
                  
                  {analysis.convergence?.present && (
                    <div className="md:col-span-2 p-3 rounded-lg bg-accent/10 border border-accent/40">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-accent" />
                        <span className="text-xs font-bold text-accent uppercase">CONVERGENCE DETECTED</span>
                      </div>
                      <p className="text-sm text-main mt-1">{analysis.convergence.note}</p>
                      {analysis.convergence.actionable_warning && (
                        <p className="text-xs text-bearish mt-2 font-semibold">{analysis.convergence.actionable_warning}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="md:col-span-2">
                    <ConfluenceChecklist data={analysis.confluence_checklist} />
                  </div>

                  <AnalysisCard
                    icon={Activity}
                    label="Active Patterns"
                    accent="#f97316"
                    sections={[
                      {
                        title: "DETECTED PATTERNS",
                        content: analysis.patterns?.map(p => `${p.name} (${p.timeframe || '4H'})`).join(", ") || "No patterns detected",
                      },
                      ...(analysis.patterns?.length > 0 ? analysis.patterns.map(p => ({
                        title: p.name.toUpperCase(),
                        content: p.implication || "",
                        sub: `TF: ${p.timeframe || '4H'} • Confidence: ${p.confidence}%`
                      })) : [])
                    ]}
                  />
                  
                  <AnalysisCard
                    icon={BarChart2}
                    label="Key Price Zones"
                    accent="#facc15"
                    sections={[
                      {
                        title: "DEMAND ZONES",
                        content: analysis.key_levels?.demand_zones?.[0]?.range || "—",
                        sub: `Status: ${analysis.key_levels?.demand_zones?.[0]?.status || "—"}`
                      },
                      {
                        title: "SUPPLY ZONES",
                        content: analysis.key_levels?.supply_zones?.[0]?.range || "—",
                        sub: `Status: ${analysis.key_levels?.supply_zones?.[0]?.status || "—"}`
                      },
                      {
                        title: "OPEN FVG",
                        content: analysis.key_levels?.open_fvg?.[0]?.range || "None",
                        sub: `Direction: ${analysis.key_levels?.open_fvg?.[0]?.direction || "—"} | Status: ${analysis.key_levels?.open_fvg?.[0]?.status || "—"}`
                      },
                      {
                        title: "LIQUIDITY SWEEPS",
                        content: `BSL: ${analysis.key_levels?.bsl_swept ? "Swept" : "Not swept"} | SSL: ${analysis.key_levels?.ssl_swept ? "Swept" : "Not swept"}`
                      }
                    ]}
                  />

                  <AnalysisCard
                    icon={Zap}
                    label="Indicators"
                    accent="#10b981"
                    sections={[
                      {
                        title: "SUMMARY",
                        content: analysis.indicators?.summary || "No specific indicators detected"
                      },
                      {
                        title: "DETECTED",
                        content: analysis.indicators?.detected?.join(", ") || "None"
                      }
                    ]}
                  />
                </div>

                {analysis.executive_summary && (
                  <div className="card border-l-4 border-accent bg-accent/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} className="text-accent" />
                      <h3 className="text-sm font-bold text-main">Executive Summary</h3>
                      {(() => {
                        const score = calculateConfluenceScore(analysis.confluence_checklist);
                        const rating = getProbabilityRating(score);
                        return <span className="ml-auto badge bg-accent/20 text-accent">Rating: {rating}</span>;
                      })()}
                    </div>
                    <p className="text-sm text-main leading-relaxed italic">"{analysis.executive_summary}"</p>
                  </div>
                )}

                <TradeSetup trade={analysis.trade_setup} alternative={analysis.alternative_scenario} onSave={handleSaveSetup} confluenceChecklist={analysis.confluence_checklist} />

              </div>
            )}
          </div>
        </div>
      </main>

      {/* History Sidebar */}
      {showHistory && (
        <HistorySidebar 
          history={history} 
          onClose={() => setShowHistory(false)} 
          onUpdateStatus={updateHistoryStatus}
          onDelete={deleteHistoryItem}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-8 text-center">
        <p className="text-muted text-xs">ChartAI v2.0 • Pro Trading Intelligence • Not Financial Advice • Created by IANRASH</p>
      </footer>
    </div>
  );
}
