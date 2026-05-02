import { useState, useCallback, useEffect, useRef } from "react";
import UploadZone from "./components/UploadZone";
import AnalysisCard from "./components/AnalysisCard";
import TradeSetup from "./components/TradeSetup";
import ConfidenceBar from "./components/ConfidenceBar";
import ConfluenceChecklist from "./components/ConfluenceChecklist";
import HistorySidebar from "./components/HistorySidebar";
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
  Type
} from "lucide-react";
import "./index.css";

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
      const data = await analyzeChart(charts, symbol, sessionDate);
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
    const tickedCount = analysis?.confluence_checklist ? Object.values(analysis.confluence_checklist).filter(Boolean).length : 0;
    const confidence = Math.round((tickedCount / 6) * 100);

    const newEntry = {
      id: Date.now(),
      symbol: symbol || "Unknown",
      date: new Date(sessionDate).toLocaleString(),
      bias: trade.bias,
      entry: trade.execution?.entry_zone || trade.execution?.entry || "Market",
      rr: trade.execution?.risk_reward || "—",
      confidence: confidence,
      status: "Pending",
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

  const trendCfg = analysis
    ? TREND_CONFIG[analysis.overall_trend] ?? TREND_CONFIG.Neutral
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Panel: Inputs & Upload */}
          <div className="flex flex-col gap-6">
            <div className="card space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label flex items-center gap-2"><Type size={12} /> Instrument / Pair</label>
                  <input 
                    type="text" 
                    placeholder="e.g. XAUUSD"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-2 text-sm text-main focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="label flex items-center gap-2"><Calendar size={12} /> Session Time</label>
                  <input 
                    type="datetime-local" 
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-2 text-sm text-main focus:outline-none focus:border-accent transition-colors"
                  />
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
                      <h2 className="text-xl font-bold text-main">{symbol || "Trade Analysis"}</h2>
                      <p className="text-xs text-muted">{new Date(sessionDate).toLocaleString()} • {analysis.session_context} Session</p>
                    </div>
                    {trendCfg && (
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{ color: trendCfg.color, backgroundColor: `${trendCfg.color}15`, border: `1px solid ${trendCfg.color}33` }}
                      >
                        <trendCfg.Icon size={12} />
                        {analysis.overall_trend} Trend
                      </div>
                    )}
                  </div>
                  <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-main text-xs transition-all">
                    <Download size={14} /> Export PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnalysisCard
                    icon={Layers}
                    label="HTF Bias"
                    value={analysis.market_structure?.htf_summary}
                    bias={analysis.market_structure?.htf_bias}
                    accent="#6c63ff"
                  />
                  <AnalysisCard
                    icon={ShieldAlert}
                    label="LTF Confirmation"
                    value={analysis.market_structure?.ltf_summary}
                    bias={analysis.market_structure?.ltf_bias}
                    accent="#a855f7"
                  />
                  
                  <div className="md:col-span-2">
                    <ConfluenceChecklist data={analysis.confluence_checklist} />
                  </div>

                  <AnalysisCard
                    icon={Activity}
                    label="Active Patterns"
                    value={analysis.patterns?.map(p => p.name).join(", ") || "No patterns detected"}
                    accent="#f97316"
                  />
                  
                  <AnalysisCard
                    icon={BarChart2}
                    label="Key Price Zones"
                    value={`Demand: ${analysis.key_levels?.demand_zones?.[0]?.range || '—'}\nSupply: ${analysis.key_levels?.supply_zones?.[0]?.range || '—'}`}
                    accent="#facc15"
                  />

                  <AnalysisCard
                    icon={Zap}
                    label="Indicators"
                    value={analysis.indicators?.summary || "No specific indicators detected"}
                    sub={analysis.indicators?.detected?.join(", ")}
                    accent="#10b981"
                  />
                </div>

                {analysis.executive_summary && (
                  <div className="card border-l-4 border-accent bg-accent/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} className="text-accent" />
                      <h3 className="text-sm font-bold text-main">Executive Summary</h3>
                      <span className="ml-auto badge bg-accent/20 text-accent">Rating: {analysis.probability_rating || 'N/A'}</span>
                    </div>
                    <p className="text-sm text-main leading-relaxed italic">"{analysis.executive_summary}"</p>
                  </div>
                )}

                <TradeSetup trade={analysis.trade_setup} alternative={analysis.alternative_scenario} onSave={handleSaveSetup} />
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
        <p className="text-muted text-xs">ChartAI v2.0 • Pro Trading Intelligence • Not Financial Advice</p>
      </footer>
    </div>
  );
}
