import { useState, useCallback, useEffect, useRef, Component } from "react";
import DOMPurify from "dompurify";

import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";
import OnboardingModal from "./components/OnboardingModal";
import { supabase } from "./supabaseClient";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {DOMPurify.sanitize(this.state.error?.message || "Unknown error")}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import UploadZone from "./components/UploadZone";
import AnalysisCard from "./components/AnalysisCard";
import HTFCard from "./components/HTFCard";
import LTFCard from "./components/LTFCard";
import TradeSetup from "./components/TradeSetup";
import ChartZoomModal from "./components/ChartZoomModal";
import ConfluenceChecklist from "./components/ConfluenceChecklist";
import HistorySidebar from "./components/HistorySidebar";
import { ToastContainer } from "./components/Toast";
import PwaInstallPrompt from "./components/PwaInstallPrompt";


import { analyzeChart } from "./api/analyzeChart";
import { loadTradeHistory, saveTradeToHistory, updateTradeStatus, deleteTrade } from "./services/tradeHistory";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  BarChart2,
  Zap,
  Activity,
  Cpu,
  RefreshCw,
  Moon,
  Sun,
  History,
  Download,
  AlertTriangle,
  Share2,
  Upload,
  Brain,
  FileCheck,
  LogOut
} from "lucide-react";
import "./index.css";

const calculateConfluenceScore = (checklist) => {
  if (!checklist) return 0;
  const values = Object.values(checklist);
  if (values.length === 0) return 0;
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
  const { session, loading: authLoading } = useAuth();
  const [charts, setCharts] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [sessionDate] = useState(new Date().toISOString().slice(0, 16));
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState(null);
  const [retryAfter, setRetryAfter] = useState(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analysisTimestamp, setAnalysisTimestamp] = useState(null);
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored && ['dark', 'light'].includes(stored) ? stored : "dark";
  });
  
  // History state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Auth routing state
  const [showLogin, setShowLogin] = useState(false);

  // Onboarding — show once per user after first login
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('chartai_onboarding_done');
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem('chartai_onboarding_done', 'true');
    setShowOnboarding(false);
  };

  // Chart zoom modal
  const [zoomChart, setZoomChart] = useState(null);

  // Copy confirmation
  const [copyConfirm, setCopyConfirm] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success", duration = 4000) => {
    const id = window.crypto?.randomUUID?.() || Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Share menu
  const [showShareMenu, setShowShareMenu] = useState(false);

  const analysisRef = useRef(null);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (session?.user) {
      loadTradeHistory(session.user.id)
        .then(data => {
          setHistory(data);
          setHistoryLoading(false);
        })
        .catch(() => setHistoryLoading(false));
    } else {
      setHistory([]);
      setHistoryLoading(false);
    }
  }, [session]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out failed:', e);
      addToast("Failed to sign out", "error");
    }
  };

  const handleChartsChange = useCallback((newCharts) => {
    setCharts(newCharts);
    setAnalysis(null);
    setError(null);
    setZoomChart(null);
  }, []);

  const handleAnalyze = async () => {
    const hasAllTimeframes = charts.every(c => c.timeframe);
    if (charts.length < 2 || !hasAllTimeframes) return;
    setLoading(true);
    setLoadingStage(1);
    setError(null);
    setRetryAfter(null);
    try {
      setLoadingStage(2);
      const data = await analyzeChart(charts, "Auto", "Auto");
      setLoadingStage(3);
      if (data?.error) {
        setError(data.message || 'Analysis failed. Please try again.');
        if (data.retry_after) {
          setRetryAfter(data.retry_after);
          const timer = setInterval(() => {
            setRetryAfter(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }
        return;
      }
      setAnalysis(data);
      setHasAnalyzed(true);
      setAnalysisTimestamp(new Date());
      setLoadingStage(4);
    } catch {
      setError('Analysis failed. Please try again or contact support.');
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingStage(0), 1000);
    }
  };

  const handleReset = () => {
    setCharts([]);
    setAnalysis(null);
    setError(null);
    setSymbol("");
    setHasAnalyzed(false);
    setAnalysisTimestamp(null);
    setZoomChart(null);
    setShowShareMenu(false);
  };

  const handleSaveSetup = async (trade) => {
    const checklist = analysis?.confluence_checklist || {};
    const score = calculateConfluenceScore(checklist);
    const rating = getProbabilityRating(score);

    const newEntry = {
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
    
    if (session?.user) {
      const saved = await saveTradeToHistory(session.user.id, newEntry);
      if (saved) {
        setHistory(prev => [saved, ...prev].slice(0, 10));
        addToast("Trade saved to history", "success");
      } else {
        addToast("Failed to save trade", "error");
      }
    } else {
      addToast("Please sign in to save trades", "error");
    }
    setShowHistory(true);
  };

  const updateHistoryStatus = async (id, status) => {
    if (session?.user) {
      const updated = await updateTradeStatus(session.user.id, id, status);
      if (updated) {
        setHistory(prev => prev.map(item => item.id === id ? { ...item, status } : item));
      }
    } else {
      setHistory(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    }
  };

  const deleteHistoryItem = async (id) => {
    if (session?.user) {
      const deleted = await deleteTrade(session.user.id, id);
      if (deleted) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } else {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
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
    html2pdf().set(opt).from(element).save().then(() => {
      addToast("PDF exported successfully", "success");
    });
  };

  const formatTimestamp = (date) => {
    if (!date) return "";
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(',', ',');
  };

  const getSetupText = () => {
    const trade = analysis?.trade_setup;
    const score = calculateConfluenceScore(analysis?.confluence_checklist);
    const rating = getProbabilityRating(score);
    
    return `Pair: ${symbol || analysis?.instrument_detected || 'Unknown'}
Direction: ${trade?.bias || 'N/A'}
Session: ${analysis?.session_context || 'N/A'}
Rating: ${rating}
Entry Zone: ${trade?.execution?.entry_zone || trade?.execution?.entry || 'Market'}
Stop Loss: ${trade?.execution?.stop || '—'}
Target: ${trade?.execution?.target || '—'}
R:R: ${trade?.execution?.risk_reward || (trade?.execution?.r_multiple ? `1:${trade.execution.r_multiple}` : '—')}
Order Type: ${trade?.execution?.order_type || 'Market'}
Entry Trigger: ${trade?.execution?.trigger_condition || 'Confirmation required'}
Invalidation: ${trade?.invalidation_level || 'Close below structure'}
Generated: ${analysisTimestamp ? formatTimestamp(analysisTimestamp) : 'N/A'}`;
  };

  const handleCopySetup = async () => {
    try {
      await navigator.clipboard.writeText(getSetupText());
      addToast("Copied to clipboard", "success");
    } catch {
      addToast("Failed to copy", "error");
    }
  };

  const handleShareImage = async () => {
    const element = analysisRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (navigator.share) {
          const file = new File([blob], `ChartAI_${symbol || 'Analysis'}.png`, { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: 'ChartAI Analysis',
            text: getSetupText()
          });
          addToast("Image shared", "success");
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ChartAI_${symbol || 'Analysis'}.png`;
          a.click();
          URL.revokeObjectURL(url);
          addToast("Image downloaded", "success");
        }
      });
    } catch {
      addToast("Failed to share", "error");
    }
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getSetupText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareMenu(false);
    addToast("Opening WhatsApp", "info");
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(getSetupText());
    window.open(`https://t.me/share/url?url=${text}`, '_blank');
    setShowShareMenu(false);
    addToast("Opening Telegram", "info");
  };

  const trendInfo = calculateCorrectTrend(analysis);
  const trendCfg = analysis
    ? TREND_CONFIG[trendInfo.overall] ?? TREND_CONFIG.Neutral
    : null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 animate-spin" style={{ backgroundColor: 'var(--accent)' }}>
            <div className="w-full h-full rounded-xl" style={{ borderColor: 'transparent', borderTopColor: 'white', borderWidth: '3px' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return showLogin ? (
      <LoginPage onBack={() => setShowLogin(false)} />
    ) : (
      <LandingPage onGetStarted={() => setShowLogin(true)} />
    );
  }

  // Render onboarding on top of the app for first-time users
  if (showOnboarding) {
    return (
      <>
        <OnboardingModal onComplete={handleOnboardingComplete} />
        {/* App renders behind the modal so it's ready immediately */}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-sans pb-24 md:pb-10 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-white/5 bg-surface/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="ChartAI" style={{ width: 32, height: 32, borderRadius: 6 }} />
            <span className="text-main font-bold text-lg tracking-tight">
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
            <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs sm:text-sm text-main transition-colors"
              >
                <LogOut size={14} />
                <span className="hidden md:inline">Sign Out</span>
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
            <div className="card bg-gradient-to-br from-accent/10 via-surface-2 to-accent/5 border-accent/30">
              <div className="text-center py-4 sm:py-6">
                <p className="text-sm sm:text-xl md:text-2xl font-bold text-accent tracking-widest uppercase">Your Chart, Your Edge</p>
                <p className="text-sm sm:text-lg font-semibold text-main mt-2">Let's Build The Plan</p>
                <div className="flex justify-center gap-2 mt-4">
                  <div className="w-12 h-0.5 bg-accent/50 rounded"></div>
                  <div className="w-2 h-0.5 bg-accent rounded-full animate-pulse"></div>
                  <div className="w-12 h-0.5 bg-accent/50 rounded"></div>
                </div>
              </div>
            </div>

            <UploadZone charts={charts} onChartsChange={handleChartsChange} onChartClick={(chart) => setZoomChart(chart)} />

            {error && (
              <div className="card border border-bearish/30 bg-bearish/5 text-bearish text-sm">
                <div className="flex items-start gap-2">
                  <span>⚠️</span>
                  <div>
                    <p>{error}</p>
                    {retryAfter && (
                      <p className="mt-2 text-xs font-mono animate-pulse">
                        Retry available in {retryAfter}s...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Analyze Button - Hidden after analysis is complete */}
            {!hasAnalyzed && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/90 backdrop-blur-md border-t border-white/10 z-40 md:relative md:bg-transparent md:border-none md:p-0 md:backdrop-blur-none">
                <button
                  className="btn-primary w-full text-base py-4 shadow-lg shadow-accent/20 md:shadow-none"
                  onClick={handleAnalyze}
                  disabled={charts.length < 2 || loading || charts.some(c => !c.timeframe)}
                >
                  {loading ? (
                    <>
                      <Cpu size={18} className="animate-spin" />
                      {loadingStage === 1 && "Uploading..."}
                      {loadingStage === 2 && "Analyzing..."}
                      {loadingStage === 3 && "Processing..."}
                    </>
                  ) : (
                    <>
                      <Activity size={18} />
                      {charts.length < 2 ? "Upload min. 2 charts" : charts.some(c => !c.timeframe) ? "Select all timeframes" : "Analyze Setup"}
                    </>
                  )}
                </button>
              </div>
            )}
            {loading && hasAnalyzed && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/90 backdrop-blur-md border-t border-white/10 z-40 md:relative md:bg-transparent md:border-none md:p-0 md:backdrop-blur-none">
                <div className="w-full text-base py-4 bg-accent/20 text-accent rounded-xl flex items-center justify-center gap-2">
                  <Cpu size={18} className="animate-spin" />
                  {loadingStage === 1 && "Uploading..."}
                  {loadingStage === 2 && "Analyzing..."}
                  {loadingStage === 3 && "Processing..."}
                </div>
              </div>
            )}
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
              <div className="card flex flex-col items-center justify-center py-20 gap-6">
                {/* Progress stages */}
                <div className="flex items-center gap-2 sm:gap-4">
                  {[
                    { stage: 1, icon: Upload, label: "Uploading" },
                    { stage: 2, icon: Brain, label: "Analyzing" },
                    { stage: 3, icon: FileCheck, label: "Processing" },
                  ].map(({ stage, icon: Icon, label }, idx) => (
                    <div key={stage} className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${
                        loadingStage >= stage
                          ? "bg-accent border-accent text-white"
                          : "bg-surface-2 border-white/10 text-muted"
                      }`}>
                        <Icon size={18} className={loadingStage === stage ? "animate-pulse" : ""} />
                      </div>
                      <span className={`text-xs font-medium hidden sm:inline ${
                        loadingStage >= stage ? "text-main" : "text-muted"
                      }`}>{label}</span>
                      {idx < 2 && (
                        <div className={`w-8 h-0.5 rounded transition-all duration-500 ${
                          loadingStage > stage ? "bg-accent" : "bg-white/10"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Loading animation */}
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Cpu className="text-accent animate-spin" size={32} />
                </div>

                <div className="text-center">
                  <p className="text-main font-semibold mb-1">
                    {loadingStage === 1 && "Uploading charts..."}
                    {loadingStage === 2 && "AI Analyst is working..."}
                    {loadingStage === 3 && "Processing results..."}
                  </p>
                  <p className="text-muted text-sm">
                    {loadingStage === 1 && "Preparing your chart images"}
                    {loadingStage === 2 && "Identifying structure, sweeps, and confluence factors"}
                    {loadingStage === 3 && "Building your trade plan"}
                  </p>
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
                      {analysisTimestamp && (
                        <p className="text-[10px] text-muted/60 mt-0.5">Generated: {formatTimestamp(analysisTimestamp)}</p>
                      )}
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
                  <div className="flex items-center gap-2">
                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-main text-xs transition-all">
                      <Download size={14} /> Export PDF
                    </button>
                    <div className="relative">
                      <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-main text-xs transition-all">
                        <Share2 size={14} /> Share
                      </button>
                      {showShareMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                          <button onClick={handleShareImage} className="w-full px-4 py-3 text-left text-sm text-main hover:bg-white/5 flex items-center gap-3 transition-colors">
                            <Share2 size={14} /> Share as Image
                          </button>
                          <button onClick={handleShareWhatsApp} className="w-full px-4 py-3 text-left text-sm text-main hover:bg-white/5 flex items-center gap-3 transition-colors">
                            <span className="text-green-400 font-bold">W</span> Share to WhatsApp
                          </button>
                          <button onClick={handleShareTelegram} className="w-full px-4 py-3 text-left text-sm text-main hover:bg-white/5 flex items-center gap-3 transition-colors">
                            <span className="text-blue-400 font-bold">T</span> Share to Telegram
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
                  <LTFCard data={analysis.mtf_analysis} htfDirection={analysis.htf_analysis?.trend?.direction} />
                  
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
                    sections={(() => {
                      const uploadedTFs = charts.map(c => c.timeframe);
                      
                      let detectedPatterns = [];
                      
                      // Get from patterns array - REAL candlestick patterns only
                      if (analysis.patterns && analysis.patterns.length > 0) {
                        // Filter to only real candlestick patterns (not "Order Block" or "FVG")
                        // Only include patterns from uploaded timeframes
                        detectedPatterns = analysis.patterns.filter(p => 
                          (p.confidence > 0) && 
                          (!p.timeframe || uploadedTFs.includes(p.timeframe)) &&
                          !p.name?.toLowerCase().includes("order block") &&
                          !p.name?.toLowerCase().includes("fvg") &&
                          !p.name?.toLowerCase().includes("zone") &&
                          !p.name?.toLowerCase().includes("trend") &&
                          p.name?.length > 2
                        );
                      }
                      
                      // If no patterns from array, get from m1_analysis candlestick_patterns
                      if (detectedPatterns.length === 0) {
                        const patternSources = [];
                        const validPatterns = ["Bullish Engulfing", "Bearish Engulfing", "Hammer", "Shooting Star", "Morning Star", "Evening Star", "Three White Soldiers", "Three Black Crows", "Double Bottom", "Double Top", "Doji", "Spinning Top", "Inside Bar", "Outside Bar", "Tweezer Bottom", "Tweezer Top", "Bullish FVG", "Bearish FVG"];
                        
                        // From m1 analysis - real candlestick patterns only
                        if (analysis.m1_analysis?.candlestick_patterns?.length > 0) {
                          analysis.m1_analysis.candlestick_patterns.forEach(p => {
                            if (validPatterns.some(vp => p.toLowerCase().includes(vp.toLowerCase()))) {
                              patternSources.push({ name: p, timeframe: "M1", confidence: 70 });
                            }
                          });
                        }
                        // From mtf analysis candlestick patterns
                        if (analysis.mtf_analysis?.candlestick_patterns?.length > 0) {
                          analysis.mtf_analysis.candlestick_patterns.forEach(p => {
                            if (validPatterns.some(vp => p.toLowerCase().includes(vp.toLowerCase()))) {
                              patternSources.push({ name: p, timeframe: "MTF", confidence: 65 });
                            }
                          });
                        }
                        
                        detectedPatterns = patternSources;
                      }
                      
                      return [
                        {
                          title: "DETECTED PATTERNS",
                          content: detectedPatterns.length > 0 
                            ? detectedPatterns.map(p => `${p.name} (${p.timeframe})`).join(", ")
                            : "No clear candlestick patterns detected",
                        },
                        ...(detectedPatterns.length > 0 ? detectedPatterns.map(p => ({
                          title: p.name.toUpperCase(),
                          content: `${p.timeframe} timeframe - ${p.confidence}% confidence`,
                          sub: null
                        })) : [])
                      ];
                    })()}
                  />
                  
                  <AnalysisCard
                    icon={BarChart2}
                    label="Key Price Zones"
                    accent="#facc15"
                    sections={(() => {
                      // Get all demand and supply zones
                      const allDemandZones = analysis.key_levels?.demand_zones || [];
                      const allSupplyZones = analysis.key_levels?.supply_zones || [];
                      
                      // Use all available zones - use let so we can reassign in fallback
                      let demand = allDemandZones[0];
                      let supply = allSupplyZones[0];
                      const demand2 = allDemandZones[1];
                      const supply2 = allSupplyZones[1];
                      let fvg = analysis.key_levels?.open_fvg?.[0];
                      
                      // Fallback to HTF/MTF data if not in key_levels
                      if (!demand?.range && analysis.htf_analysis?.order_block?.range) {
                        const isBullish = analysis.htf_analysis?.trend?.direction === "Bullish";
                        if (isBullish) {
                          demand = { range: analysis.htf_analysis.order_block.range, status: analysis.htf_analysis.order_block.status };
                        }
                      }
                      if (!supply?.range && analysis.mtf_analysis?.order_block?.range) {
                        const isBearish = analysis.mtf_analysis?.trend?.direction === "Bearish" || analysis.htf_analysis?.trend?.direction === "Bearish";
                        if (isBearish) {
                          supply = { range: analysis.mtf_analysis.order_block.range, status: analysis.mtf_analysis.order_block.status };
                        }
                      }
                      if (!fvg?.range && (analysis.htf_analysis?.fvg?.nearest_above || analysis.htf_analysis?.fvg?.nearest_below)) {
                        fvg = { 
                          range: `${analysis.htf_analysis.fvg.nearest_below || '—'} - ${analysis.htf_analysis.fvg.nearest_above || '—'}`,
                          direction: "Above/Below",
                          status: analysis.htf_analysis.fvg.fill_probability || "Unknown"
                        };
                      }
                      
                      return [
                        {
                          title: "DEMAND ZONES (Buy Areas - Below Price)",
                          content: demand?.range || "Not identified",
                          sub: demand?.status ? `Status: ${demand.status}` : ""
                        },
                        {
                          title: "DEMAND ZONE 2",
                          content: demand2?.range || "—"
                        },
                        {
                          title: "SUPPLY ZONES (Sell Areas - Above Price)",
                          content: supply?.range || "Not identified",
                          sub: supply?.status ? `Status: ${supply.status}` : ""
                        },
                        {
                          title: "SUPPLY ZONE 2",
                          content: supply2?.range || "—"
                        },
                        {
                          title: "OPEN FVG",
                          content: fvg?.range || "None",
                          sub: fvg?.direction ? `Direction: ${fvg.direction} | Status: ${fvg.status || "—"}` : ""
                        },
                        {
                          title: "LIQUIDITY SWEEPS",
                          content: `BSL: ${analysis.key_levels?.bsl_swept || analysis.htf_analysis?.liquidity?.bsl_location ? "Swept" : "Not swept"} | SSL: ${analysis.key_levels?.ssl_swept || analysis.htf_analysis?.liquidity?.ssl_location ? "Swept" : "Not swept"}`
                        }
                      ];
                    })()}
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
                    <p className="text-sm text-main leading-relaxed italic">"{DOMPurify.sanitize(analysis.executive_summary)}"</p>
                  </div>
                )}

                {(() => {
                    // Build trade setup from any available data
                    let tradeData = analysis.trade_setup;
                    
                    // If no trade_setup, build from analysis data
                    if (!tradeData) {
                      // Check all possible trend fields
                      const htf = analysis.htf_analysis?.trend?.direction 
                        || analysis.htf_bias 
                        || analysis.htf_analysis?.trend?.bias
                        || analysis.htf_summary?.includes("Bullish") && "Bullish"
                        || analysis.htf_summary?.includes("Bearish") && "Bearish";
                      
                      const htfOB = analysis.htf_analysis?.order_block?.range 
                        || analysis.htf_analysis?.order_block;
                      const mtfOB = analysis.mtf_analysis?.order_block?.range 
                        || analysis.mtf_analysis?.order_block;
                      
                      // Also check for demand/supply zones from any field
                      const demandZones = analysis.key_levels?.demand_zones 
                        || analysis.htf_analysis?.demand_zone 
                        || analysis.mtf_analysis?.demand_zone;
                      const supplyZones = analysis.key_levels?.supply_zones 
                        || analysis.htf_analysis?.supply_zone 
                        || analysis.mtf_analysis?.supply_zone;
                      
                      const rating = analysis.probability_rating;
                      const confScore = analysis.confidence_score || (rating === "A+" ? 95 : rating === "A" ? 85 : rating === "B" ? 70 : rating === "C" ? 50 : 30);
                      
                      if (htf && htf !== "Neutral") {
                        const isBuy = htf === "Bullish" || htf.toLowerCase().includes("bullish");
                        const isSell = htf === "Bearish" || htf.toLowerCase().includes("bearish");
                        const entryZone = htfOB || mtfOB || (isBuy ? demandZones?.[0]?.range : supplyZones?.[0]?.range) || "Identify OB zone";
                        
                        // Only show trade if there's adequate confidence
                        if (confScore >= 40) {
                          tradeData = {
                            bias: isBuy ? "BUY" : isSell ? "SELL" : "WAIT",
                            label: isBuy ? "Bullish Setup" : isSell ? "Bearish Setup" : "Wait",
                            execution: {
                              entry_zone: entryZone,
                              entry: entryZone,
                              stop: htfOB || mtfOB || supplyZones?.[0]?.range || demandZones?.[0]?.range || "Structure close",
                              target: "Next liquidity level",
                              order_type: "LIMIT",
                              trigger_condition: isBuy 
                                ? `Wait for pullback to ${entryZone} for LIMIT BUY`
                                : `Wait for rally to ${entryZone} for LIMIT SELL`
                            },
                            invalidation_level: "Close beyond structure"
                          };
                        }
                      }
                      
                      // Fallback to overall_trend
                      if (!tradeData?.bias && analysis.overall_trend && analysis.overall_trend !== "Neutral") {
                        const isBuy = analysis.overall_trend === "Bullish" || analysis.overall_trend?.toLowerCase().includes("bullish");
                        const confScore2 = analysis.confidence_score || 50;
                        if (confScore2 >= 40) {
                          tradeData = {
                            bias: isBuy ? "BUY" : "SELL",
                            label: isBuy ? "Bullish Setup" : "Bearish Setup",
                            execution: {
                              entry_zone: "Awaiting confirmation",
                              entry: "Market",
                              stop: "Structure close",
                              target: "Next liquidity",
                              order_type: "MARKET",
                              trigger_condition: "Confirm with candle close"
                            },
                            invalidation_level: "Close beyond structure"
                          };
                        }
                      }
                    }
                    
                    // Always show trade setup if it has a bias (BUY or SELL)
                    if (tradeData?.bias && tradeData.bias !== "WAIT") {
                      return <TradeSetup trade={tradeData} alternative={analysis.alternative_scenario} onSave={handleSaveSetup} onCopy={handleCopySetup} confluenceChecklist={analysis.confluence_checklist} />;
                    }
                    
                    // If only WAIT or no trade, show wait message with context
                    return (
                      <div className="card border border-neutral/30 bg-neutral/5">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} className="text-neutral" />
                          <h3 className="text-sm font-bold text-main">No Clear Setup</h3>
                        </div>
                        <p className="text-xs text-muted">
                          {DOMPurify.sanitize(analysis.executive_summary || analysis.alternative_scenario || "Waiting for HTF and LTF alignment")}
                        </p>
                      </div>
                    );
                  })()}

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

      {/* Chart Zoom Modal */}
      {zoomChart && (
        <ChartZoomModal chart={zoomChart} onClose={() => setZoomChart(null)} />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* PWA Install Prompt */}
      <PwaInstallPrompt />

      {/* Share Menu Backdrop */}
      {showShareMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-8 text-center">
        <p className="text-muted text-xs">ChartAI v2.0 • Pro Trading Intelligence • Not Financial Advice • Created by IANRASH</p>
      </footer>
    </div>
  );
}
