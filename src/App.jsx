import { useState, useCallback, useEffect, useRef, Component } from "react";
import DOMPurify from "dompurify";

import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";
import OnboardingModal from "./components/OnboardingModal";
import { supabase } from "./supabaseClient";
import UploadZone from "./components/UploadZone";
import AnalysisCard from "./components/AnalysisCard";
import HTFCard from "./components/HTFCard";
import LTFCard from "./components/LTFCard";
import TradeSetup from "./components/TradeSetup";
import ChartZoomModal from "./components/ChartZoomModal";
import ConfluenceChecklist from "./components/ConfluenceChecklist";
import HistorySidebarPro from "./components/HistorySidebarPro";
import { ToastContainer } from "./components/Toast";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import ConfidenceBar from "./components/ConfidenceBar";
import BrokerConnect from "./components/BrokerConnect";
import Scanner from "./components/Scanner";
import TradingTerminal from "./components/TradingTerminal";
import ModelSelector from "./components/ModelSelector";
import KeyLevelsSummary from "./components/KeyLevelsSummary";
import WatchlistDrawer from "./components/WatchlistDrawer";

import { analyzeChart } from "./api/analyzeChart";
import { fetchNews } from "./api/news";
import { postProcessAnalysis, computeAndEnforceRR, calcRating, calculateAccountGuard } from "./api/tradeValidation";
import { loadTradeHistory, saveTradeToHistory, updateTradeStatus, deleteTrade, loadWatchlist, updateTradeFields, loadDailyUsage, incrementDailyUsage } from "./services/tradeHistory";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";
import {
  TrendingUp,
  TrendingDown,
  Minus,
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
  LogOut,
  X,
  LayoutGrid,
  Search,
  Link2,
  Settings,
  Star,
  Target,
  Newspaper,
  ExternalLink,
  User,
  Mail,
  Shield,
  Calendar,
  Clock
} from "lucide-react";
import "./index.css";

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
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg)', color: 'var(--text-main)' }}>
          <div className="modal-panel max-w-lg w-full p-6">
            <h1 className="text-base font-semibold mb-3" style={{ color: 'var(--bearish)' }}>Something went wrong</h1>
            <pre className="p-4 rounded-[10px] text-xs overflow-auto mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {DOMPurify.sanitize(this.state.error?.message || "Unknown error")}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const calculateConfluenceScore = (checklist) => {
  if (!checklist || typeof checklist !== 'object' || Array.isArray(checklist)) return 0;
  const values = Object.values(checklist);
  if (values.length === 0) return 0;
  const trueCount = values.filter(v => v === true || v === 'true' || v === 1).length;
  return Math.round((trueCount / values.length) * 100);
};

const getOrderBlockRange = (ob) => {
  if (!ob) return null;
  const hasHigh = ob.range_high != null && ob.range_high !== '';
  const hasLow = ob.range_low != null && ob.range_low !== '';
  if (hasHigh && hasLow) return `${ob.range_low} – ${ob.range_high}`;
  if (hasLow) return String(ob.range_low);
  if (hasHigh) return String(ob.range_high);
  return null;
};

const buildFallbackExecution = (isBuy, ob, analysis) => {
  const entryZone = getOrderBlockRange(ob) || "Identify OB zone";
  let stop, target;

  const levelStr = (level) => {
    if (!level) return null;
    if (typeof level === 'string') return level;
    return level.price || level.level || level.range || null;
  };

  if (isBuy) {
    const rawLow = parseFloat(ob?.range_low);
    stop = !isNaN(rawLow) ? String(rawLow * 0.999) : (ob?.range_low != null ? String(ob.range_low) : "Below structure");
    target = analysis.htf_analysis?.liquidity?.next_likely_target
      || levelStr(analysis.key_levels?.resistance?.[0])
      || levelStr(analysis.key_levels?.supply_zones?.[0])
      || "Next liquidity level";
  } else {
    const rawHigh = parseFloat(ob?.range_high);
    stop = !isNaN(rawHigh) ? String(rawHigh * 1.001) : (ob?.range_high != null ? String(ob.range_high) : "Above structure");
    target = analysis.htf_analysis?.liquidity?.next_likely_target
      || levelStr(analysis.key_levels?.support?.[0])
      || levelStr(analysis.key_levels?.demand_zones?.[0])
      || "Next liquidity level";
  }

  return { entryZone, stop, target };
};

const normalizeTrend = (t) => {
  if (!t) return "Neutral";
  const lower = t.toLowerCase();
  if (lower.includes("bullish")) return "Bullish";
  if (lower.includes("bearish")) return "Bearish";
  return "Neutral";
};

const calculateCorrectTrend = (analysis) => {
  if (!analysis) return { overall: "Neutral", htf: "Neutral", ltf: "Neutral" };

  const htf = normalizeTrend(analysis.htf_analysis?.trend?.direction);
  const ltfConf = analysis.mtf_analysis?.trend?.confirmation;

  let ltf = "Neutral";
  let overall = "Neutral";

  if (ltfConf === "Confirms HTF") {
    ltf = htf;
    overall = htf;
  } else if (ltfConf === "Contradicts HTF") {
    ltf = "Neutral";
    overall = "Neutral";
  } else {
    overall = htf;
  }

  return { overall, htf, ltf };
};

const TREND_CONFIG = {
  Bullish: { color: "var(--bullish)", Icon: TrendingUp },
  Bearish: { color: "var(--bearish)", Icon: TrendingDown },
  Neutral: { color: "var(--neutral)", Icon: Minus },
  Ranging: { color: "var(--neutral)", Icon: Minus },
};

export default function App() {
  const { session, loading: authLoading, logout } = useAuth();
  const [charts, setCharts] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState(null);
  const [retryAfter, setRetryAfter] = useState(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analysisTimestamp, setAnalysisTimestamp] = useState(null);
  const [news, setNews] = useState([]);
  const [newsSymbol, setNewsSymbol] = useState("");
  const [newsLoading, setNewsLoading] = useState(false);
  const newsForPromptRef = useRef("");

  // Daily analysis usage limit
  const DAILY_LIMIT = 3;
  const [usage, setUsage] = useState(() => loadDailyUsage(session?.user?.id));
  const usageAtLimit = usage.count >= DAILY_LIMIT;

  // Capital Protection global state (persisted to localStorage)
  const [accountBalance, setAccountBalance] = useState(() =>
    Number(localStorage.getItem("chartai_account_balance") || 10000)
  );
  const [riskPercent, setRiskPercent] = useState(() =>
    Number(localStorage.getItem("chartai_risk_percent") || 2)
  );

  // Theme state
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored && ['dark', 'light'].includes(stored) ? stored : "dark";
  });

  // History state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeView, setActiveView] = useState('analyze'); // analyze | terminal | scanner | brokers
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [watchlist, setWatchlist] = useState(() => loadWatchlist());
  const [showWatchlist, setShowWatchlist] = useState(false);

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

  const retryTimerRef = useRef(null);
  const toastTimersRef = useRef([]);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success", duration = 4000) => {
    const id = window.crypto?.randomUUID?.() || Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      const timer = setTimeout(() => removeToast(id), duration);
      toastTimersRef.current.push(timer);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Share menu
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Profile modal
  const [showProfile, setShowProfile] = useState(false);

  const analysisRef = useRef(null);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Persist Capital Protection settings
  useEffect(() => {
    localStorage.setItem("chartai_account_balance", String(accountBalance));
  }, [accountBalance]);
  useEffect(() => {
    localStorage.setItem("chartai_risk_percent", String(riskPercent));
  }, [riskPercent]);

  const usageUserIdRef = useRef(session?.user?.id);

  useEffect(() => {
    if (session?.user) {
      usageUserIdRef.current = session.user.id;
      setUsage(loadDailyUsage(session.user.id));
    } else {
      usageUserIdRef.current = undefined;
      setUsage(loadDailyUsage());
    }
  }, [session?.user?.id]);

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
      await logout();
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

  const loadNewsForSymbol = useCallback(async (sym) => {
    if (!sym) return;
    setNewsSymbol(sym);
    setNewsLoading(true);
    try {
      const items = await fetchNews(sym);
      setNews(items);
      const text = items.length
        ? items.map((n, i) => `${i + 1}. ${n.title}${n.publisher ? ` (${n.publisher})` : ""}`).join("\n")
        : "";
      newsForPromptRef.current = text;
    } catch (e) {
      console.warn("News load failed:", e.message);
      setNews([]);
      newsForPromptRef.current = "";
    } finally {
      setNewsLoading(false);
    }
  }, []);

  const handleAnalyze = async () => {
    const hasAllTimeframes = charts.every(c => c.timeframe);
    if (charts.length < 2 || !hasAllTimeframes) return;
    if (usageAtLimit) {
      setError(`Daily analysis limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Your free analyses for today are used up — please come back tomorrow.`);
      return;
    }
    setLoading(true);
    setLoadingStage(1);
    setError(null);
    setRetryAfter(null);
    try {
      setLoadingStage(2);
      const data = await analyzeChart(charts, "Auto", new Date().toISOString(), newsForPromptRef.current);
      setLoadingStage(3);
      if (data?.error) {
        setError(data.message || 'Analysis failed. Please try again.');
        if (data.retry_after) {
          setRetryAfter(data.retry_after);
          retryTimerRef.current = setInterval(() => {
            setRetryAfter(prev => {
              if (prev <= 1) {
                if (retryTimerRef.current) {
                  clearInterval(retryTimerRef.current);
                  retryTimerRef.current = null;
                }
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }
        return;
      }
      // Post-process: validate and enforce R:R rules
      const processedData = postProcessAnalysis(data);
      setAnalysis(processedData);
      setHasAnalyzed(true);
      setAnalysisTimestamp(new Date());
      setLoadingStage(4);

      // Record this successful analysis against the daily limit
      setUsage(incrementDailyUsage(session?.user?.id));

      // Debug: Log full API response to help troubleshoot
      console.log('=== API Response Debug ===');
      console.log('session_context:', data.session_context);
      console.log('indicators:', data.indicators);
      console.log('patterns:', data.patterns);
      console.log('key_levels:', data.key_levels);
      console.log('htf_analysis:', data.htf_analysis);
      console.log('mtf_analysis:', data.mtf_analysis);
      console.log('confluence_checklist:', data.confluence_checklist);
      console.log('=========================');

      // Fetch relevant news for the detected instrument / pair
      const detectedSymbol = processedData?.instrument_detected || data?.instrument_detected || symbol || "";
      if (detectedSymbol && detectedSymbol !== "Unidentified — no pair label visible on any chart") {
        loadNewsForSymbol(detectedSymbol.replace(/[•·]/g, "/"));
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Please try again or contact support.');
    } finally {
      setLoading(false);
      setLoadingStage(4);
      setTimeout(() => {
        setLoadingStage(prev => prev === 4 ? 0 : prev);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      toastTimersRef.current.forEach(clearTimeout);
      toastTimersRef.current = [];
    };
  }, []);

  const handleReset = () => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setCharts([]);
    setAnalysis(null);
    setError(null);
    setSymbol("");
    setHasAnalyzed(false);
    setAnalysisTimestamp(null);
    setZoomChart(null);
    setShowShareMenu(false);
    setNews([]);
    setNewsSymbol("");
    newsForPromptRef.current = "";
  };

  const handleSaveSetup = async (trade) => {
    const now = new Date();
    const ov = analysis?.overall_trend || '';
    const marketCondition = ov.toLowerCase().includes('range')||ov.toLowerCase().includes('sideways')?'Ranging':ov.toLowerCase().includes('trend')?'Trending':ov.toLowerCase().includes('chop')?'Choppy':ov.toLowerCase().includes('volatile')?'Volatile':ov.toLowerCase().includes('quiet')?'Quiet':null;
    const newEntry = {
      symbol: symbol || analysis?.instrument_detected || "Unknown",
      date: now.toLocaleString(),
      bias: trade.bias,
      entry: trade.execution?.entry_zone || trade.execution?.entry || "Market",
      stop: trade.execution?.stop || null,
      target: trade.execution?.target || null,
      rr: trade.execution?.risk_reward || (trade.execution?.r_multiple ? `1:${trade.execution.r_multiple}` : "—"),
      rating: analysis?.probability_rating || 'B',
      score: 0,
      status: "Pending",
      analysis: analysis,
      setupType: null,
      marketCondition,
      thesis: analysis?.executive_summary || analysis?.trade_setup?.trigger_condition || '',
      whatWentWell: '',
      whatToImprove: '',
    };

    if (session?.user) {
      const saved = await saveTradeToHistory(session.user.id, newEntry);
      if (saved) {
        setHistory(prev => [saved, ...prev]);
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
  const handleUpdateFields = async (id, fields) => {
    const updated = await updateTradeFields(session?.user?.id, id, fields);
    if (updated) setHistory(prev => prev.map(x => String(x.id) === String(id) ? updated : x));
  };
  const handleBrokerSync = (newTrades) => {
    if (newTrades && newTrades.length) setHistory(prev => [...newTrades, ...prev]);
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

    return `Pair: ${symbol || analysis?.instrument_detected || 'Unknown'}
Direction: ${trade?.bias || 'N/A'}
Session: ${analysis?.session_context || 'N/A'}
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
    } catch (err) {
      console.error('Copy failed:', err);
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
    } catch (err) {
      console.error('Share failed:', err);
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
    window.open(`https://t.me/share/url?text=${text}`, '_blank');
    setShowShareMenu(false);
    addToast("Opening Telegram", "info");
  };

  const trendInfo = calculateCorrectTrend(analysis);
  const trendCfg = analysis
    ? TREND_CONFIG[trendInfo.overall] ?? TREND_CONFIG.Neutral
    : null;
  const chartsWithTimeframe = charts.filter((chart) => chart.timeframe).length;
  const chartsReady = charts.length >= 2 && chartsWithTimeframe === charts.length;
  const activeWorkflowStep = analysis ? 3 : chartsReady ? 2 : charts.length >= 2 ? 1 : 0;
  const workflowSteps = [
    { label: "Upload", complete: charts.length >= 2, detail: `${charts.length}/2 charts` },
    { label: "Timeframes", complete: chartsReady, detail: `${chartsWithTimeframe}/${charts.length || 2} assigned` },
    { label: "Analyze", complete: Boolean(analysis), detail: analysis ? "Complete" : "Ready next" },
    { label: "Review", complete: Boolean(analysis), detail: analysis ? "Setup ready" : "Awaiting result" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-9 h-9 mx-auto mb-4 rounded-[10px] border-2 animate-spin"
            style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
          <p className="text-sm text-muted">Loading ChartAI…</p>
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

  return (
    <div className="app-shell min-h-screen bg-bg font-sans pb-24 md:pb-10 transition-colors duration-300">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      {/* Header */}
      <header className="glass border-b sticky top-0 z-50" style={{ borderBottomColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="ChartAI" style={{ width: 28, height: 28, borderRadius: 7 }} />
            <span className="text-main font-bold text-base tracking-tight">
              Chart<span style={{ color: 'var(--accent)' }}>AI</span>
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button onClick={toggleTheme} className="icon-btn" title="Theme">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => setShowModelSelector(true)} className="icon-btn" title="Model & Prompt">
              <Settings size={17} />
            </button>
            <button onClick={() => setShowHistory(true)} className="icon-btn" title="Journal Pro">
              <History size={17} />
              {history.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
            </button>
            <button onClick={() => setShowWatchlist(true)} className="icon-btn" title="Watchlist">
              <Star size={17} />
              {watchlist.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
            </button>
            <button onClick={() => setShowProfile(true)} className="icon-btn" title="Profile">
              <User size={17} />
            </button>
            <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
            {(analysis || charts.length > 0) && (
              <button onClick={handleReset} className="btn-secondary !px-3 !py-1.5 !text-xs">
                <RefreshCw size={13} />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
            <button onClick={handleSignOut} className="btn-ghost !px-3">
              <LogOut size={14} />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* View Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="segmented overflow-x-auto">
          {[
            {id:'analyze', label:'Analyze', icon: Activity},
            {id:'terminal', label:'Terminal', icon: LayoutGrid},
            {id:'scanner', label:'Scanner', icon: Search},
            {id:'brokers', label:'Brokers', icon: Link2},
          ].map(t=> (
            <button key={t.id} onClick={()=>setActiveView(t.id)} className={`segmented-item ${activeView===t.id ? 'active' : ''}`}>
              <t.icon size={13}/>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeView==='terminal' && (
          <div className="space-y-6">
            <TradingTerminal initialSymbol={symbol||'EURUSD'} watchlist={watchlist} />
          </div>
        )}
        {activeView==='scanner' && (
          <div className="space-y-6">
            <Scanner onSelectSymbol={(s)=>{ setSymbol(s); setActiveView('terminal'); addToast(`Selected ${s} → Terminal`,'info');}} />
          </div>
        )}
        {activeView==='brokers' && (
          <div className="space-y-6">
            <BrokerConnect userId={session?.user?.id} onSync={handleBrokerSync} />
            <div className="card-flat">
              <h4 className="text-xs font-semibold text-main mb-2">How Broker Sync Works</h4>
              <p className="text-xs text-muted leading-relaxed">Demo mode simulates OAuth & CSV sync. Production would use SnapTrade OAuth (40+ brokers) for sub-60s read-only sync. All trades land in Journal Pro with broker tag. Click Sync on any broker to generate mock fills for testing.</p>
            </div>
          </div>
        )}
        {activeView==='analyze' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(340px,0.72fr)_minmax(0,1.28fr)] gap-6 items-start max-w-6xl mx-auto w-full">

          {/* Left Panel: Inputs & Upload */}
          <div className="flex flex-col gap-5">
            <section className="workflow-card" aria-labelledby="workflow-title">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="label mb-1">Analysis workspace</p>
                  <h1 id="workflow-title" className="text-lg font-bold tracking-tight text-main">Build your trade plan</h1>
                  <p className="text-xs text-muted mt-1">Start with a higher and lower timeframe chart.</p>
                </div>
                <span className="badge chip-accent shrink-0">Step {analysis ? 4 : chartsReady ? 3 : charts.length >= 2 ? 2 : 1} of 4</span>
              </div>
              <ol className="workflow-steps" aria-label="Analysis progress">
                {workflowSteps.map((step, index) => (
                  <li key={step.label} className={`workflow-step ${step.complete ? "is-complete" : ""} ${!step.complete && index === activeWorkflowStep ? "is-current" : ""}`}>
                    <span className="workflow-step-number">{step.complete ? <FileCheck size={13} /> : index + 1}</span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-main">{step.label}</span>
                      <span className="block text-[10px] text-muted mt-0.5">{step.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <UploadZone charts={charts} onChartsChange={handleChartsChange} onChartClick={(chart) => setZoomChart(chart)} />

            {error && (
              <div className="card" style={{ background: 'var(--bearish-glow)', borderColor: 'rgba(242,54,69,0.3)' }}>
                <div className="flex items-start gap-2.5 text-bearish">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">{error}</p>
                    {retryAfter && (
                      <p className="mt-1.5 text-xs mono animate-pulse-slow">
                        Retry available in {retryAfter}s...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Analyze Button - Hidden after analysis is complete */}
            {!hasAnalyzed && (
              <div className="glass mobile-action-bar fixed bottom-0 left-0 right-0 p-4 z-40 md:relative md:bg-transparent md:backdrop-blur-none md:p-0" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-3 mb-2 px-1">
                  <span className="text-[11px] text-muted">Analyses used today</span>
                  <div className="flex items-center gap-1">
                    {[...Array(DAILY_LIMIT)].map((_, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-4 rounded-full"
                        style={{ background: i < usage.count ? 'var(--accent)' : 'var(--surface-3)' }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-main mono">{Math.min(usage.count, DAILY_LIMIT)}/{DAILY_LIMIT}</span>
                </div>
                {usageAtLimit ? (
                  <div className="w-full p-3 rounded-[10px] text-sm text-center font-medium" style={{ background: 'var(--bearish-glow)', color: 'var(--bearish)', border: '1px solid rgba(242,54,69,0.3)' }}>
                    <AlertTriangle size={15} className="inline mr-1.5 -mt-0.5" />
                    Daily limit reached — try again tomorrow
                  </div>
                ) : (
                  <button
                    className="btn-primary w-full !py-3.5 !text-sm"
                    onClick={handleAnalyze}
                    disabled={charts.length < 2 || loading || charts.some(c => !c.timeframe)}
                  >
                    {loading ? (
                      <>
                        <Cpu size={16} className="animate-spin" />
                        {loadingStage === 1 && "Uploading..."}
                        {loadingStage === 2 && "Analyzing..."}
                        {loadingStage === 3 && "Processing..."}
                      </>
                    ) : (
                      <>
                        <Activity size={16} />
                        {charts.length < 2 ? "Upload min. 2 charts" : charts.some(c => !c.timeframe) ? "Select all timeframes" : "Analyze Setup"}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            {loading && hasAnalyzed && (
              <div className="glass mobile-action-bar fixed bottom-0 left-0 right-0 p-4 z-40 md:relative md:bg-transparent md:backdrop-blur-none md:p-0" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="w-full py-3.5 rounded-[10px] flex items-center justify-center gap-2 text-sm font-semibold" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid rgba(41,98,255,0.25)' }}>
                  <Cpu size={16} className="animate-spin" />
                  {loadingStage === 1 && "Uploading..."}
                  {loadingStage === 2 && "Analyzing..."}
                  {loadingStage === 3 && "Processing..."}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Analysis Output */}
          <div className="analysis-report flex flex-col gap-6" id="analysis-report" ref={analysisRef}>
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
                      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center border transition-all duration-500 ${
                        loadingStage >= stage
                          ? "!text-white"
                          : "text-muted"
                      }`}
                        style={loadingStage >= stage
                          ? { background: 'var(--accent)', borderColor: 'transparent' }
                          : { background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                      >
                        <Icon size={16} className={loadingStage === stage ? "animate-pulse" : ""} />
                      </div>
                      <span className={`text-xs font-medium hidden sm:inline ${
                        loadingStage >= stage ? "text-main" : "text-muted"
                      }`}>{label}</span>
                      {idx < 2 && (
                        <div className="w-8 h-0.5 rounded transition-all duration-500" style={{ background: loadingStage > stage ? 'var(--accent)' : 'var(--surface-3)' }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Loading animation */}
                <div className="w-14 h-14 rounded-[14px] flex items-center justify-center" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(41,98,255,0.25)' }}>
                  <Cpu style={{ color: 'var(--accent)' }} className="animate-spin" size={26} />
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

            {!loading && !analysis && (
              <section className="analysis-preview card animate-fade-in-up" aria-labelledby="analysis-preview-title">
                <div className="card-header">
                  <div className="icon-tile icon-tile-accent"><Target size={16} /></div>
                  <div>
                    <p className="label">Your output</p>
                    <h2 id="analysis-preview-title" className="text-sm font-semibold text-main">A decision-ready setup will appear here</h2>
                  </div>
                </div>
                <div className="analysis-preview-score">
                  <div>
                    <p className="label">Setup grade</p>
                    <p className="text-2xl font-bold mono text-main mt-1">A−</p>
                  </div>
                  <div className="analysis-preview-meter" aria-hidden="true"><span /></div>
                  <span className="badge chip-bullish">Example</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    ["Entry zone", "1.0840–55"],
                    ["Stop loss", "1.0815"],
                    ["Target", "1.0920"],
                  ].map(([label, value]) => (
                    <div key={label} className="card-flat !p-3 min-w-0">
                      <p className="label !text-[9px]">{label}</p>
                      <p className="text-xs font-semibold mono text-main mt-1 truncate">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="analysis-preview-list">
                  <p><FileCheck size={14} /> Multi-timeframe bias and trend alignment</p>
                  <p><FileCheck size={14} /> Key levels, liquidity, and confluence checks</p>
                  <p><FileCheck size={14} /> A structured entry, stop, target, and R:R plan</p>
                </div>
                <p className="text-[11px] text-muted border-t pt-3 mt-4" style={{ borderColor: 'var(--border)' }}>
                  Upload at least two clear charts, then assign each timeframe to unlock analysis.
                </p>
              </section>
            )}

            {analysis && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold text-main tracking-tight">{symbol || "Trade Analysis"}</h2>
                        {analysis.probability_rating && (() => {
                          const pr = analysis.probability_rating;
                          const colors = {
                            "A+": "var(--bullish)",
                            "A": "var(--accent)",
                            "B": "var(--neutral)",
                            "C": "#f97316",
                            "F": "var(--bearish)",
                          };
                          const c = colors[pr] || colors.F;
                          return (
                            <span className="badge mono !text-[13px] !px-2.5 !py-1 rounded-lg"
                              style={{ color: c, background: 'color-mix(in srgb, ' + c + ' 14%, transparent)', border: '1px solid color-mix(in srgb, ' + c + ' 35%, transparent)' }}>
                              {pr}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted mt-0.5">{analysis.session_context} Session · {analysis.instrument_detected || "Unknown"}</p>
                      {analysisTimestamp && (
                        <p className="text-[10px] text-muted mt-0.5">Generated: {formatTimestamp(analysisTimestamp)}</p>
                      )}
                    </div>
                    {trendCfg && (
                      <div
                        className="badge uppercase tracking-wider"
                        style={{ color: trendCfg.color, backgroundColor: 'color-mix(in srgb, ' + trendCfg.color + ' 12%, transparent)', border: '1px solid color-mix(in srgb, ' + trendCfg.color + ' 30%, transparent)' }}
                      >
                        <trendCfg.Icon size={11} />
                        {trendInfo.overall}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={handleExportPDF} className="btn-secondary !px-3 !py-2 !text-xs">
                      <Download size={13} /> PDF
                    </button>
                    <div className="relative">
                      <button onClick={() => setShowShareMenu(!showShareMenu)} className="btn-secondary !px-3 !py-2 !text-xs">
                        <Share2 size={13} /> Share
                      </button>
                      {showShareMenu && (
                        <div className="menu-panel absolute right-0 top-full mt-2 w-48 z-50 animate-scale-in">
                          <button onClick={handleShareImage} className="menu-item !py-2.5">
                            <Share2 size={14} className="text-muted" /> Share as Image
                          </button>
                          <button onClick={handleShareWhatsApp} className="menu-item !py-2.5">
                            <span className="w-4 h-4 rounded-[5px] flex items-center justify-center text-[9px] font-black" style={{ background: 'var(--bullish-glow)', color: 'var(--bullish)' }}>W</span> WhatsApp
                          </button>
                          <button onClick={handleShareTelegram} className="menu-item !py-2.5">
                            <span className="w-4 h-4 rounded-[5px] flex items-center justify-center text-[9px] font-black" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>T</span> Telegram
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contradiction Warning */}
                {analysis.mtf_analysis?.trend?.confirmation === "Contradicts HTF" && (
                  <div className="p-3.5 rounded-[12px]" style={{ background: 'var(--bearish-glow)', border: '1px solid rgba(242,54,69,0.3)' }}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} style={{ color: 'var(--bearish)' }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--bearish)' }}>HTF and LTF are contradicting each other</span>
                    </div>
                    <p className="text-[13px] text-main mt-1.5">This is a lower probability setup. Reduce position size or wait for LTF to align with HTF before entering.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                  <HTFCard data={analysis.htf_analysis} />
                  <LTFCard data={analysis.mtf_analysis} htfDirection={analysis.htf_analysis?.trend?.direction} killZoneActive={analysis.kill_zone_active} />

                  {analysis.convergence?.present && (
                    <div className="2xl:col-span-2 p-3.5 rounded-[12px]" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(41,98,255,0.3)' }}>
                      <div className="flex items-center gap-2">
                        <Zap size={14} style={{ color: 'var(--accent)' }} />
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Convergence detected</span>
                      </div>
                      <p className="text-[13px] text-main mt-1.5">{analysis.convergence.note}</p>
                      {analysis.convergence.actionable_warning && (
                        <p className="text-xs mt-2 font-medium" style={{ color: 'var(--bearish)' }}>{analysis.convergence.actionable_warning}</p>
                      )}
                    </div>
                  )}

                  <div className="2xl:col-span-2">
                    <ConfluenceChecklist data={analysis.confluence_checklist} />
                  </div>

                  {analysis.confluence_score !== undefined && (
                    <div className="2xl:col-span-2">
                      <ConfidenceBar confidence={analysis.probability_rating} score={analysis.confluence_score} />
                    </div>
                  )}

                  <KeyLevelsSummary computedICT={analysis.computed_ict} />

                  <AnalysisCard
                    icon={Activity}
                    label="Active Patterns"
                    accent="#f97316"
                    sections={(() => {
                      const uploadedTFs = charts.map(c => c.timeframe);

                      let detectedPatterns = [];

                      // Get from patterns array - relaxed filtering to show more patterns
                      if (analysis.patterns && analysis.patterns.length > 0) {
                        // Normalize timeframe strings for comparison (e.g. "4H" matches "H4", "4h", etc.)
                        const normTF = (tf) => tf?.toUpperCase()?.replace(/\s/g, '') || '';
                        const uploadedNorm = uploadedTFs.map(normTF);

                        detectedPatterns = analysis.patterns.filter(p => {
                          const name = typeof p === 'object' ? p.name : p;
                          if (!name || typeof name !== 'string' || name.length < 2 || name === '...') return false;
                          // Accept pattern if no timeframe specified, or if timeframe matches any uploaded TF
                          const ptf = normTF(p.timeframe);
                          const tfMatch = !ptf || uploadedNorm.some(utf => utf.includes(ptf) || ptf.includes(utf));
                          return tfMatch;
                        });
                      }

                      // If no patterns from array, get from m1_analysis candlestick_patterns
                      if (detectedPatterns.length === 0) {
                        const patternSources = [];
                        const validPatterns = ["Bullish Engulfing", "Bearish Engulfing", "Hammer", "Shooting Star", "Morning Star", "Evening Star", "Three White Soldiers", "Three Black Crows", "Double Bottom", "Double Top", "Doji", "Spinning Top", "Inside Bar", "Outside Bar", "Tweezer Bottom", "Tweezer Top", "Bullish FVG", "Bearish FVG"];

                        // From m1 analysis - real candlestick patterns only
                        if (analysis.m1_analysis?.candlestick_patterns?.length > 0) {
                          analysis.m1_analysis.candlestick_patterns.forEach(p => {
                            if (typeof p === 'string' && validPatterns.some(vp => p.toLowerCase().includes(vp.toLowerCase()))) {
                              patternSources.push({ name: p, timeframe: "M1", confidence: 70 });
                            }
                          });
                        }
                        // From mtf analysis candlestick patterns
                        if (analysis.mtf_analysis?.candlestick_patterns?.length > 0) {
                          analysis.mtf_analysis.candlestick_patterns.forEach(p => {
                            if (typeof p === 'string' && validPatterns.some(vp => p.toLowerCase().includes(vp.toLowerCase()))) {
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
                            ? detectedPatterns.map(p => {
                                const name = typeof p === 'object' ? p.name : p;
                                const tf = typeof p === 'object' ? p.timeframe : 'Unknown';
                                return `${name} (${tf})`;
                              }).join(", ")
                            : "No clear candlestick patterns detected",
                        },
                        ...(detectedPatterns.length > 0 ? detectedPatterns.map(p => {
                          const name = typeof p === 'object' ? p.name : p;
                          const conf = typeof p === 'object' ? (p.confidence ?? '—') : '—';
                          const tf = typeof p === 'object' ? p.timeframe : 'Unknown';
                          return {
                            title: name.toUpperCase(),
                            content: `${tf} timeframe${conf !== '—' ? ` — ${conf}% confidence` : ''}`,
                            sub: null
                          };
                        }) : [])
                      ];
                    })()}
                  />

                  <AnalysisCard
                    icon={BarChart2}
                    label="Key Price Zones"
                    accent="#facc15"
                    sections={(() => {
                      const zoneRangeDisplay = (val) => {
                        if (val == null) return null;
                        if (typeof val === 'string') return val;
                        if (typeof val === 'object') {
                          if (typeof val.range === 'string' && val.range) return val.range;
                          if (val.price != null) return String(val.price);
                          if (val.range_low != null || val.range_high != null) {
                            return [val.range_low, val.range_high].filter((p) => p != null).join(" – ");
                          }
                          if (val.low != null || val.high != null) {
                            return [val.low, val.high].filter((p) => p != null).join(" – ");
                          }
                          return null;
                        }
                        return String(val);
                      };
                      const firstValidRange = (entries) => {
                        if (!Array.isArray(entries)) return null;
                        for (const entry of entries) {
                          const range = zoneRangeDisplay(entry);
                          if (range && !/unknown|unclear|\?|^\s*[—–-]$/i.test(range)) return range;
                        }
                        return null;
                      };
                      const allDemandZones = analysis.key_levels?.demand_zones || [];
                      const allSupplyZones = analysis.key_levels?.supply_zones || [];
                      const demandRange = firstValidRange(allDemandZones);
                      const supplyRange = firstValidRange(allSupplyZones);

                      let demand = allDemandZones.find((z) => zoneRangeDisplay(z)) || null;
                      let supply = allSupplyZones.find((z) => zoneRangeDisplay(z)) || null;
                      const demand2Zone = allDemandZones.find((z) => zoneRangeDisplay(z) && z !== demand) || null;
                      const supply2Zone = allSupplyZones.find((z) => zoneRangeDisplay(z) && z !== supply) || null;
                      let fvg = analysis.key_levels?.open_fvg?.find((z) => zoneRangeDisplay(z)) || null;

                      const obRange = (ob) => {
                        if (!ob) return null;
                        if (ob.range_high != null && ob.range_low != null) return `${ob.range_low} – ${ob.range_high}`;
                        return ob.range_high != null ? String(ob.range_high) : ob.range_low != null ? String(ob.range_low) : null;
                      };
                      const demandRangeFromOb = () => obRange(analysis.htf_analysis?.order_block) || obRange(analysis.mtf_analysis?.order_block);
                      const supplyRangeFromOb = () => obRange(analysis.mtf_analysis?.order_block) || obRange(analysis.htf_analysis?.order_block);
                      if (!demandRange) {
                        const r = demandRangeFromOb();
                        if (r) demand = { range: r, status: analysis.htf_analysis?.order_block?.status || analysis.mtf_analysis?.order_block?.status };
                      }
                      if (!supplyRange) {
                        const r = supplyRangeFromOb();
                        if (r) supply = { range: r, status: analysis.mtf_analysis?.order_block?.status || analysis.htf_analysis?.order_block?.status };
                      }
                      const fvgDisplay = (val) => zoneRangeDisplay(val) || "—";
                      if (!zoneRangeDisplay(fvg)) {
                        const htfFvg = analysis.htf_analysis?.fvg;
                        const mtfFvg = analysis.mtf_analysis?.fvg;
                        const src = (htfFvg && (htfFvg.nearest_above || htfFvg.nearest_below)) ? htfFvg : (mtfFvg && (mtfFvg.nearest_above || mtfFvg.nearest_below)) ? mtfFvg : null;
                        if (src) {
                          fvg = {
                            range: `${fvgDisplay(src.nearest_below)} - ${fvgDisplay(src.nearest_above)}`,
                            direction: "Above/Below",
                            status: src.fill_probability || ""
                          };
                        }
                      }
                      const demandStatus = demand?.status && !/unknown/i.test(demand.status) ? demand.status : "";
                      const supplyStatus = supply?.status && !/unknown/i.test(supply.status) ? supply.status : "";
                      const fvgStatus = fvg?.status && !/unknown/i.test(fvg.status) ? fvg.status : "";
                      const contentFor = (range, fallback) => (range && !/unknown|unclear|\?|^\s*[—–-]$/i.test(range)) ? range : fallback;

                      return [
                        {
                          title: "DEMAND ZONES (Buy Areas - Below Price)",
                          content: contentFor(zoneRangeDisplay(demand), "Not identified"),
                          sub: demandStatus ? `Status: ${demandStatus}` : ""
                        },
                        {
                          title: "DEMAND ZONE 2",
                          content: contentFor(zoneRangeDisplay(demand2Zone), "—")
                        },
                        {
                          title: "SUPPLY ZONES (Sell Areas - Above Price)",
                          content: contentFor(zoneRangeDisplay(supply), "Not identified"),
                          sub: supplyStatus ? `Status: ${supplyStatus}` : ""
                        },
                        {
                          title: "SUPPLY ZONE 2",
                          content: contentFor(zoneRangeDisplay(supply2Zone), "—")
                        },
                        {
                          title: "OPEN FVG",
                          content: contentFor(zoneRangeDisplay(fvg), "None"),
                          sub: fvg?.direction ? `Direction: ${fvg.direction}${fvgStatus ? ` | Status: ${fvgStatus}` : ""}` : ""
                        },
                        {
                          title: "LIQUIDITY SWEEPS",
                          content: (() => {
                            const swept = analysis.htf_analysis?.liquidity?.swept_pools;
                            const hasSwept = Array.isArray(swept) && swept.length > 0;
                            const bsl = analysis.htf_analysis?.liquidity?.bsl_location || "—";
                            const ssl = analysis.htf_analysis?.liquidity?.ssl_location || "—";
                            return `BSL: ${bsl} | SSL: ${ssl} | Swept: ${hasSwept ? "Yes" : "No"}`;
                          })()
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
                  <div className="card-flat">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="icon-tile icon-tile-accent" style={{ width: 26, height: 26, borderRadius: 7 }}>
                        <Zap size={13} />
                      </div>
                      <h3 className="text-sm font-semibold text-main">Executive Summary</h3>
                    </div>
                    <p className="text-[13px] text-secondary leading-relaxed">"{DOMPurify.sanitize(analysis.executive_summary)}"</p>
                  </div>
                )}

                {(() => {
                    // Build trade setup from any available data
                    let tradeData = analysis.trade_setup;
                    // If API says no setup present, WAIT, or played out — ignore to
                    // allow fallback generation from analysis data with proper entry ≠ stop
                    if (tradeData?.bias === "WAIT" || tradeData?.present === false) tradeData = null;
                    if (tradeData && analysis.setup_actionability?.status === "played_out") {
                      tradeData = null;
                    }

                    // Block counter-trend setups unless HTF reversal is confirmed
                    const isCounterTrend = (() => {
                      const htfDir = analysis.htf_analysis?.trend?.direction?.toLowerCase();
                      const hasReversal = analysis.htf_analysis?.trend?.structure_details?.toLowerCase().includes('choch')
                        || analysis.htf_analysis?.trend?.structure_details?.toLowerCase().includes('bos');
                      return (potentialDirection) => {
                        const dir = potentialDirection?.toLowerCase();
                        const htfBullish = htfDir?.includes('bullish');
                        const htfBearish = htfDir?.includes('bearish');
                        if (dir?.includes('sell') && htfBullish) return !hasReversal;
                        if (dir?.includes('buy') && htfBearish) return !hasReversal;
                        return false;
                      };
                    })();

                    if (!tradeData) {
                      // Check all possible trend fields
                      const htf = analysis.htf_analysis?.trend?.direction
                        || analysis.htf_bias
                        || analysis.htf_analysis?.trend?.bias
                        || analysis.htf_summary?.includes("Bullish") && "Bullish"
                        || analysis.htf_summary?.includes("Bearish") && "Bearish";

                      const htfOB = getOrderBlockRange(analysis.htf_analysis?.order_block);
                      const mtfOB = getOrderBlockRange(analysis.mtf_analysis?.order_block);

                      // Also check for demand/supply zones from any field
                      const demandZones = analysis.key_levels?.demand_zones
                        || analysis.htf_analysis?.demand_zone
                        || analysis.mtf_analysis?.demand_zone;
                      const supplyZones = analysis.key_levels?.supply_zones
                        || analysis.htf_analysis?.supply_zone
                        || analysis.mtf_analysis?.supply_zone;

                      // Compute actual rating from confluence checklist (not AI's probability_rating)
                      const rating = calcRating(analysis.confluence_checklist);
                      const confScore = calculateConfluenceScore(analysis.confluence_checklist) || 20;

                      if (htf && htf !== "Neutral") {
                        const isBuy = htf === "Bullish" || htf.toLowerCase().includes("bullish");
                        const isSell = htf === "Bearish" || htf.toLowerCase().includes("bearish");
                        const ob = isBuy
                          ? (analysis.htf_analysis?.order_block || analysis.mtf_analysis?.order_block)
                          : (analysis.mtf_analysis?.order_block || analysis.htf_analysis?.order_block);
                        const { entryZone, stop, target } = buildFallbackExecution(isBuy, ob, analysis);

                        // Lowered threshold to 20 to show more trades
                        if (confScore >= 20) {
                          tradeData = {
                            bias: isBuy ? "BUY" : isSell ? "SELL" : "WAIT",
                            label: isBuy ? "Bullish Setup" : isSell ? "Bearish Setup" : "Wait",
                            execution: {
                              entry_zone: entryZone,
                              entry: entryZone,
                              stop,
                              target,
                              order_type: "LIMIT",
                              trigger_condition: isBuy
                                ? `Wait for pullback to ${entryZone} for LIMIT BUY`
                                : `Wait for rally to ${entryZone} for LIMIT SELL`
                            },
                            invalidation_level: "Close beyond structure"
                          };
                          // Enforce R:R on fallback setup using computed rating
                          tradeData = computeAndEnforceRR(tradeData, rating);
                        }
                      }

                      // Fallback to overall_trend - lowered threshold to 20
                      if (!tradeData?.bias && analysis.overall_trend && analysis.overall_trend !== "Neutral") {
                        const isBuy = analysis.overall_trend === "Bullish" || analysis.overall_trend?.toLowerCase().includes("bullish");
                        if (isCounterTrend(isBuy ? 'BUY' : 'SELL')) {
                          tradeData = null;
                        } else {
                          const ob = isBuy
                            ? (analysis.htf_analysis?.order_block || analysis.mtf_analysis?.order_block)
                            : (analysis.mtf_analysis?.order_block || analysis.htf_analysis?.order_block);
                          const { entryZone, stop, target } = buildFallbackExecution(isBuy, ob, analysis);
                          if (confScore >= 20) {
                            tradeData = {
                              bias: isBuy ? "BUY" : "SELL",
                              label: isBuy ? "Bullish Setup" : "Bearish Setup",
                              execution: {
                                entry_zone: entryZone,
                                entry: entryZone,
                                stop,
                                target,
                                order_type: "LIMIT",
                                trigger_condition: `Confirm with candle close near ${entryZone}`
                              },
                              invalidation_level: "Close beyond structure"
                            };
                            // Enforce R:R on fallback setup using computed rating
                            tradeData = computeAndEnforceRR(tradeData, rating);
                          }
                        }
                      }

                      if ((!tradeData?.bias || tradeData.bias === "WAIT") && analysis.executive_summary) {
                        const execSummary = analysis.executive_summary.toLowerCase();
                        const hasBuySignal = execSummary.includes("buy") || execSummary.includes("long") || execSummary.includes("bullish") || execSummary.includes("call");
                        const hasSellSignal = execSummary.includes("sell") || execSummary.includes("short") || execSummary.includes("bearish") || execSummary.includes("put");

                        let summaryIsBuy = true;
                        if (hasBuySignal && hasSellSignal) {
                          const htfDir = analysis.htf_analysis?.trend?.direction?.toLowerCase();
                          if (htfDir?.includes("bullish")) {
                            summaryIsBuy = true;
                          } else if (htfDir?.includes("bearish")) {
                            summaryIsBuy = false;
                          } else {
                            summaryIsBuy = true;
                          }
                        } else if (hasBuySignal) {
                          summaryIsBuy = true;
                        } else if (hasSellSignal) {
                          summaryIsBuy = false;
                        } else {
                          summaryIsBuy = null;
                        }

                        if (summaryIsBuy != null) {
                          const tradeDir = summaryIsBuy ? "BUY" : "SELL";
                          if (isCounterTrend(tradeDir)) {
                            tradeData = null;
                          } else {
                            const ob = summaryIsBuy
                              ? (analysis.htf_analysis?.order_block || analysis.mtf_analysis?.order_block)
                              : (analysis.mtf_analysis?.order_block || analysis.htf_analysis?.order_block);
                            const { entryZone, stop, target } = buildFallbackExecution(summaryIsBuy, ob, analysis);
                            tradeData = {
                              bias: tradeDir,
                              label: summaryIsBuy ? "Bullish Setup" : "Bearish Setup",
                              execution: {
                                entry_zone: entryZone,
                                entry: entryZone,
                                stop,
                                target,
                                order_type: "LIMIT",
                                trigger_condition: analysis.executive_summary.slice(0, 100)
                              },
                              invalidation_level: "Close beyond structure"
                            };
                            tradeData = computeAndEnforceRR(tradeData, rating);
                          }
                        }
                      }
                    }

                    // Always show trade setup if it has a bias (BUY or SELL)
                    if (tradeData?.bias && tradeData.bias !== "WAIT") {
                      return (
                        <>
                          <TradeSetup trade={tradeData} alternative={analysis.alternative_scenario} onSave={handleSaveSetup} onCopy={handleCopySetup} confluenceChecklist={analysis.confluence_checklist} setupActionability={analysis.setup_actionability} accountBalance={accountBalance} riskPercent={riskPercent} instrument={analysis?.instrument_detected} symbol={symbol || analysis?.instrument_detected} rating={analysis.probability_rating} />
                        </>
                      );
                    }

                    // Check if HTF and LTF are actually aligned - if so, show trade setup even if executive_summary says otherwise
                    const htfTrend = analysis.htf_analysis?.trend?.direction;
                    const ltfConfirm = analysis.mtf_analysis?.trend?.confirmation;
                    const isAligned = (htfTrend === "Bearish" || htfTrend?.toLowerCase()?.includes("bearish")) && ltfConfirm === "Confirms HTF" ||
                                       (htfTrend === "Bullish" || htfTrend?.toLowerCase()?.includes("bullish")) && ltfConfirm === "Confirms HTF";

                    // If HTF and LTF are aligned, show the trade setup
                    if (isAligned) {
                      const isBuy = htfTrend === "Bullish" || htfTrend?.toLowerCase()?.includes("bullish");
                      const ob = isBuy
                        ? (analysis.htf_analysis?.order_block || analysis.mtf_analysis?.order_block)
                        : (analysis.mtf_analysis?.order_block || analysis.htf_analysis?.order_block);
                      const { entryZone, stop, target } = buildFallbackExecution(isBuy, ob, analysis);

                      let alignedTradeData = {
                        bias: isBuy ? "BUY" : "SELL",
                        label: isBuy ? "Bullish Setup" : "Bearish Setup",
                        execution: {
                          entry_zone: entryZone,
                          entry: entryZone,
                          stop,
                          target,
                          order_type: "LIMIT",
                          trigger_condition: `HTF & LTF aligned - ${isBuy ? 'Look for pullback to ' + entryZone : 'Look for rally to ' + entryZone}`
                        },
                        invalidation_level: "Close beyond structure"
                      };
                      // Enforce R:R on aligned fallback setup using computed rating
                      const alignedRating = analysis.probability_rating || calcRating(analysis.confluence_checklist);
                      alignedTradeData = computeAndEnforceRR(alignedTradeData, alignedRating);
                      return (
                        <>
                          <TradeSetup trade={alignedTradeData} alternative={analysis.alternative_scenario} onSave={handleSaveSetup} onCopy={handleCopySetup} confluenceChecklist={analysis.confluence_checklist} setupActionability={analysis.setup_actionability} accountBalance={accountBalance} riskPercent={riskPercent} instrument={analysis?.instrument_detected} symbol={symbol || analysis?.instrument_detected} rating={analysis.probability_rating} />
                        </>
                      );
                    }

                    // If only WAIT or no trade, show wait message with context
                    return (
                      <div className="card-flat" style={{ borderColor: 'rgba(209,163,63,0.3)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={15} className="tone-neutral" />
                          <h3 className="text-sm font-semibold text-main">No Clear Setup</h3>
                        </div>
                        <p className="text-xs text-muted">
                          {DOMPurify.sanitize(analysis.executive_summary || analysis.alternative_scenario || "Waiting for HTF and LTF alignment")}
                        </p>
                      </div>
                    );
                  })()}

                {/* Latest News for the pair */}
                <div className="card">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(41,98,255,0.25)' }}>
                        <Newspaper size={15} style={{ color: 'var(--accent)' }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-main">Market News — Today</h3>
                        <p className="text-[11px] text-muted">
                          {newsSymbol ? `Latest headlines relevant to ${newsSymbol}` : "Relevant headlines for this pair"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { const target = newsSymbol || analysis?.instrument_detected || symbol; if (target) loadNewsForSymbol(target); }}
                      className="btn-secondary !px-2.5 !py-1.5 !text-[11px]"
                      disabled={newsLoading}
                      title="Refresh news"
                    >
                      <RefreshCw size={12} className={newsLoading ? "animate-spin" : ""} /> Refresh
                    </button>
                  </div>

                  {newsLoading && news.length === 0 && (
                    <div className="flex items-center gap-2 py-6 text-sm text-muted">
                      <Cpu size={15} className="animate-spin" style={{ color: 'var(--accent)' }} />
                      Searching for the latest news...
                    </div>
                  )}

                  {!newsLoading && news.length === 0 && (
                    <div className="py-6 text-sm text-muted">
                      {newsSymbol
                        ? <>No recent news headlines found for <span className="text-main font-medium">{newsSymbol}</span>. Check back later or refresh.</>
                        : "Analyze a chart to load fresh market news for the detected pair."}
                    </div>
                  )}

                  {news.length > 0 && (
                    <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                      {news.map((item, idx) => (
                        <a
                          key={idx}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group py-3 first:pt-1 last:pb-1 flex items-start gap-3"
                        >
                          <span className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                            <ExternalLink size={11} className="text-muted group-hover:text-accent transition-colors" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] leading-snug text-main group-hover:text-accent transition-colors">
                              {item.title}
                            </span>
                            <span className="block text-[11px] text-muted mt-1">
                              {item.publisher && <span>{item.publisher}</span>}
                              {item.publisher && item.time ? " · " : ""}
                              {item.time ? new Date(item.time * 1000).toLocaleString() : ""}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-muted mt-2">News via Google News. Always verify current fundamentals before trading.</p>
                </div>

              </div>
            )}
          </div>
        </div>
        )}
      </main>

      {/* Journal Sidebar Pro */}
      {showHistory && (
        <HistorySidebarPro
          history={history}
          onClose={() => setShowHistory(false)}
          onUpdateStatus={updateHistoryStatus}
          onDelete={deleteHistoryItem}
          onUpdateFields={handleUpdateFields}
          onBulkImport={(newTrades)=> setHistory(prev=> [...newTrades, ...prev])}
          userId={session?.user?.id}
          setHistory={setHistory}
        />
      )}

      {/* Watchlist Drawer */}
      {showWatchlist && (
        <WatchlistDrawer onClose={() => setShowWatchlist(false)} />
      )}

      {/* Model Selector Modal */}
      {showModelSelector && (
        <div className="overlay-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={(e)=> { if(e.target===e.currentTarget) setShowModelSelector(false); }}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={()=> setShowModelSelector(false)} className="icon-btn absolute top-3 right-3 z-10" style={{ background: 'var(--surface-2)' }}><X size={16}/></button>
            <ModelSelector onClose={()=> { setShowModelSelector(false); addToast('Model & prompt saved','success'); }} />
          </div>
        </div>
      )}

      {/* Chart Zoom Modal */}
      {zoomChart && (
        <ChartZoomModal chart={zoomChart} onClose={() => setZoomChart(null)} />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div
          className="overlay-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfile(false); }}
        >
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProfile(false)}
              className="icon-btn absolute top-3 right-3 z-10"
              style={{ background: 'var(--surface-2)' }}
            >
              <X size={16} />
            </button>

            {(() => {
              const user = session?.user;
              const meta = user?.user_metadata || {};
              const name = meta.full_name || meta.name || "";
              const email = user?.email || meta.email || "No email";
              const initials = (name || email || "U").slice(0, 2).toUpperCase();
              const provider = (user?.app_metadata?.provider || meta.provider || "email").replace(/-/g, " ");

              const fmtDate = (ts) => {
                if (!ts) return "—";
                const d = new Date(ts);
                return isNaN(d) ? "—" : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
              };

              const rows = [
                { icon: Mail, label: "Email", value: email },
                { icon: Shield, label: "Provider", value: provider },
                { icon: Calendar, label: "Joined", value: fmtDate(user?.created_at) },
                { icon: Clock, label: "Last sign-in", value: fmtDate(user?.last_sign_in_at) },
                { icon: Activity, label: "Analyses today", value: `${Math.min(usage.count, DAILY_LIMIT)} / ${DAILY_LIMIT}` },
              ];

              return (
                <div className="card">
                  <div className="flex flex-col items-center text-center pt-2 pb-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid rgba(41,98,255,0.35)' }}
                    >
                      {initials}
                    </div>
                    <h3 className="text-base font-bold text-main mt-3">{name || email}</h3>
                    <p className="text-xs text-muted mt-0.5">ChartAI Member</p>
                  </div>

                  <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                    {rows.map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3 py-2.5">
                        <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <Icon size={14} className="text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
                          <p className="text-[13px] text-main font-medium truncate">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4">
                    <span className="text-[11px] text-muted" style={{ wordBreak: 'break-all' }}>
                      ID: {user?.id?.slice(0, 14)}...
                    </span>
                    <button onClick={handleSignOut} className="btn-ghost !px-3">
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
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
      <footer className="mt-16 py-8 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-muted text-xs">ChartAI v2.0.1 · Pro Trading Intelligence · Not Financial Advice · by ianrash</p>
      </footer>
    </div>
  );
}
