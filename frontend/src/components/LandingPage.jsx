import React, { useEffect, useRef, useMemo, useState } from 'react';
import { TrendingUp, Layers, Zap, ShieldCheck, Crosshair, BarChart2, ChevronRight, ChevronDown, UploadCloud, BrainCircuit, ArrowRight, Sparkles, Target, LineChart, Check, Crown, Clock } from 'lucide-react';
import './LandingPage.css';

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add('visible'); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Particles() {
  const items = useMemo(() => Array.from({ length: 15 }, (_, i) => ({ id: i, left: `${Math.random()*100}%`, delay: `${Math.random()*8}s`, dur: `${6+Math.random()*8}s`, size: `${2+Math.random()*3}px`, op: 0.2+Math.random()*0.4 })), []);
  return items.map(p => <div key={p.id} className="particle" style={{ left: p.left, bottom: '-10px', width: p.size, height: p.size, opacity: p.op, animation: `particleFloat ${p.dur} ${p.delay} ease-in-out infinite` }} />);
}

function HeroChartSVG() {
  return (<div className="price-line"><svg viewBox="0 0 1200 200" preserveAspectRatio="none"><path d="M0,180 C100,170 150,120 200,140 C250,160 300,80 400,100 C500,120 550,40 650,60 C750,80 800,30 900,50 C950,60 1000,20 1100,40 L1200,35" fill="none" stroke="url(#lg)" strokeWidth="2"/><defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6c63ff"/><stop offset="50%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#22c55e"/></linearGradient></defs></svg></div>);
}

const TICKERS = ['EUR/USD','GBP/JPY','XAU/USD','BTC/USD','NAS100','US30','SPX500','GBP/USD','AUD/USD','USD/CAD'];

function TickerTape() {
  const d = [...TICKERS,...TICKERS];
  return (<div className="w-full overflow-hidden border-y border-white/5 py-3" style={{background:'rgba(22,27,39,0.5)'}}><div className="ticker-tape">{d.map((t,i)=><span key={i} className="text-xs font-mono tracking-widest uppercase" style={{color:'var(--muted)',opacity:0.5}}>{t}</span>)}</div></div>);
}

function FAQ() {
  const [open, setOpen] = useState(null);
  const items = [
    { q: 'What trading pairs does ChartAI support?', a: 'ChartAI works with any instrument — forex pairs, crypto, indices, commodities, and stocks. Simply upload screenshots from any charting platform.' },
    { q: 'How accurate is the AI analysis?', a: 'Our model identifies structural patterns with high precision. Every setup is graded A+ to F so you can filter for only the highest-probability trades.' },
    { q: 'Do I need coding or AI experience?', a: 'Not at all. Upload your chart screenshots, and ChartAI handles the rest — delivering a complete trade plan in seconds.' },
    { q: 'Is my chart data secure?', a: 'Yes. Your uploaded images are processed in real-time and are never stored permanently. We take data privacy seriously.' },
  ];
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal max-w-3xl mx-auto flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={i} className="faq-item">
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
            <span className="font-semibold text-sm sm:text-base" style={{color:'var(--text-main)'}}>{it.q}</span>
            <ChevronDown size={18} style={{color:'var(--muted)', transform: open===i?'rotate(180deg)':'rotate(0)', transition:'transform 0.3s'}} />
          </button>
          <div className={`faq-answer ${open===i?'open':''}`}>
            <p className="text-sm leading-relaxed" style={{color:'var(--muted)'}}>{it.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const r1=useReveal(), r2=useReveal(), r3=useReveal(), r4=useReveal(), r5=useReveal(), r6=useReveal(), r7=useReveal();

  return (
    <div className="min-h-screen font-sans selection:bg-accent/30 selection:text-white" style={{background:'var(--bg)',color:'var(--text-main)'}}>

      {/* BG */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="landing-grid-bg"/><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/><Particles/>
      </div>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{background:'rgba(13,15,20,0.6)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#6c63ff,#4f46e5)',boxShadow:'0 0 20px rgba(108,99,255,0.4)'}}>
              <TrendingUp size={15} className="text-white"/>
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight">Chart<span style={{color:'#6c63ff'}}>AI</span></span>
          </div>
          <button onClick={onGetStarted} className="btn-nav">Sign In</button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 lg:pt-44 lg:pb-28 overflow-hidden flex flex-col items-center justify-center text-center px-4 sm:px-6" style={{minHeight:'85vh'}}>
        <HeroChartSVG/>
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="hero-enter hero-enter-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8" style={{background:'rgba(108,99,255,0.08)',border:'1px solid rgba(108,99,255,0.2)',color:'#6c63ff'}}>
            <Sparkles size={14}/><span>AI-Powered Trading Intelligence</span>
          </div>
          <h1 className="hero-enter hero-enter-2 text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-[1.1]">
            Your Charts.{' '}<span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg,#6c63ff,#3b82f6,#22c55e)',WebkitBackgroundClip:'text'}}>Decoded by AI.</span>
          </h1>
          <p className="hero-enter hero-enter-3 text-sm sm:text-lg lg:text-xl max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2" style={{color:'var(--muted)'}}>
            Upload your multi-timeframe charts and receive institutional-grade trade setups — complete with order blocks, fair value gaps, and graded confluence scoring.
          </p>
          <div className="hero-enter hero-enter-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <button onClick={onGetStarted} className="btn-glow">Get Started Free <ArrowRight size={18}/></button>
            <button onClick={onGetStarted} className="btn-ghost"><LineChart size={16}/>See How It Works</button>
          </div>
          <div className="hero-enter hero-enter-4 mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-6 sm:gap-8" style={{opacity:0.5}}>
            {[{val:'2,400+',label:'Charts Analyzed'},{val:'98%',label:'Accuracy Rate'},{val:'< 10s',label:'Analysis Time'}].map((s,i)=>(
              <div key={i} className="text-center">
                <div className="text-lg sm:text-xl font-bold stat-glow" style={{color:'#6c63ff'}}>{s.val}</div>
                <div className="text-[10px] sm:text-[11px] uppercase tracking-widest mt-1" style={{color:'var(--muted)'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TickerTape/>

      {/* ═══ SHOWCASE IMAGE ═══ */}
      <section className="py-12 sm:py-20 relative overflow-hidden">
        <div ref={r1} className="reveal max-w-5xl mx-auto px-4 sm:px-6">
          <div className="showcase-img"><img src="/images/dashboard-mobile.png" alt="ChartAI dashboard on laptop and mobile" loading="lazy"/></div>
          <p className="text-center text-xs sm:text-sm mt-4 sm:mt-6" style={{color:'var(--muted)'}}>ChartAI works seamlessly across desktop and mobile devices</p>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto"/>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div ref={r2} className="reveal text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4" style={{background:'rgba(108,99,255,0.08)',border:'1px solid rgba(108,99,255,0.15)',color:'#6c63ff'}}>How it works</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Three Steps to a Professional Edge</h2>
            <p className="text-sm sm:text-base max-w-xl mx-auto" style={{color:'var(--muted)'}}>From raw screenshots to a full trade plan in under 10 seconds.</p>
          </div>
          <div ref={r3} className="reveal-stagger grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {icon:UploadCloud,title:'Upload Charts',desc:'Drop your HTF and LTF chart screenshots. We accept any pair, crypto, index, or commodity.',color:'#3b82f6',num:'01'},
              {icon:BrainCircuit,title:'AI Scans Structure',desc:'Our model identifies order blocks, FVGs, liquidity sweeps, BOS/CHoCH, and key price zones.',color:'#6c63ff',num:'02'},
              {icon:Crosshair,title:'Execute the Plan',desc:'Get a graded setup (A+ to F) with precise entry, SL, TP, R:R, and confluence checklist.',color:'#22c55e',num:'03'},
            ].map((step,i)=>(
              <div key={i} className="glass-card group">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{background:`${step.color}15`,border:`1px solid ${step.color}30`}}>
                    <step.icon size={20} style={{color:step.color}}/>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{color:step.color,opacity:0.7}}>{step.num}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{color:'var(--muted)'}}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRADER IMAGE + TEXT ═══ */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div ref={r4} className="reveal max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="showcase-img order-2 md:order-1"><img src="/images/trader-ai.png" alt="Professional trader using AI analysis" loading="lazy"/></div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4" style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.15)',color:'#22c55e'}}>Built for Traders</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Institutional Analysis,<br/>At Your Fingertips</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-6" style={{color:'var(--muted)'}}>Whether you're a beginner learning Smart Money Concepts or a seasoned trader looking to speed up your workflow — ChartAI gives you a professional-grade edge in seconds.</p>
              <ul className="space-y-3">
                {['Identifies Order Blocks & FVGs automatically','Multi-timeframe trend alignment','Graded setups with exact entry & exit levels','Works with any charting platform'].map((t,i)=>(
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center mt-0.5" style={{background:'rgba(34,197,94,0.15)'}}><Check size={12} style={{color:'#22c55e'}}/></div>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto"/>

      {/* ═══ FEATURES ═══ */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div ref={r5} className="reveal text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4" style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.15)',color:'#22c55e'}}>Features</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Institutional-Grade Tools</h2>
            <p className="text-sm sm:text-base max-w-xl mx-auto" style={{color:'var(--muted)'}}>Built for traders who demand precision, not guesswork.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {[
              {icon:Layers,title:'Multi-Timeframe Confluence',desc:'Aligns HTF bias with LTF entry precision. Contradictions are flagged instantly to protect your capital.',accent:'#6c63ff'},
              {icon:BarChart2,title:'Smart Money Concepts',desc:'Detects Order Blocks, FVGs, liquidity pools, BOS, CHoCH, and premium/discount zones automatically.',accent:'#3b82f6'},
              {icon:ShieldCheck,title:'Built-In Risk Management',desc:'Every setup enforces SL buffers, target levels, and minimum R:R thresholds so you never overtrade.',accent:'#22c55e'},
              {icon:Target,title:'Setup Grading (A+ to F)',desc:'A comprehensive confluence checklist grades each setup, keeping you out of C and F rated noise.',accent:'#f59e0b'},
            ].map((f,i)=>(
              <div key={i} className="feature-card flex gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl flex items-center justify-center" style={{background:`${f.accent}12`,border:`1px solid ${f.accent}25`}}>
                  <f.icon size={18} style={{color:f.accent}}/>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold mb-1">{f.title}</h4>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{color:'var(--muted)'}}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TEAM IMAGE ═══ */}
      <section className="py-12 sm:py-20 relative overflow-hidden">
        <div ref={r6} className="reveal max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4" style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.15)',color:'#3b82f6'}}>Community</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Trusted by Traders Worldwide</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-6" style={{color:'var(--muted)'}}>From solo retail traders to small trading groups, ChartAI is helping people make more informed decisions. Our AI removes emotional bias and delivers objective, data-driven trade plans every time.</p>
              <button onClick={onGetStarted} className="btn-glow text-sm">Join the Community <ArrowRight size={16}/></button>
            </div>
            <div className="showcase-img"><img src="/images/traders-team.png" alt="Traders collaborating with AI tools" loading="lazy"/></div>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto"/>

      {/* ═══ PRICING ═══ */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div ref={r7} className="reveal text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4" style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.15)',color:'#f59e0b'}}>Pricing</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Simple, Transparent Pricing</h2>
            <p className="text-sm sm:text-base max-w-xl mx-auto" style={{color:'var(--muted)'}}>Start free. Upgrade when you're ready.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Free */}
            <div className="pricing-card">
              <h3 className="text-lg font-bold mb-1">Free</h3>
              <p className="text-xs mb-5" style={{color:'var(--muted)'}}>Perfect for getting started</p>
              <div className="flex items-end gap-1 mb-6"><span className="text-3xl sm:text-4xl font-extrabold">$0</span><span className="text-sm pb-1" style={{color:'var(--muted)'}}>/mo</span></div>
              <ul className="space-y-3 mb-8">
                {['5 analyses per day','Basic confluence grading','Single timeframe upload','Community support'].map((t,i)=>(
                  <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm"><Check size={14} style={{color:'#22c55e'}}/><span>{t}</span></li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 rounded-xl text-sm font-semibold transition-all" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'var(--text-main)'}}>Get Started</button>
            </div>

            {/* Pro — Coming Soon */}
            <div className="pricing-card featured">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold">Pro</h3>
                <span className="coming-soon-badge px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{background:'rgba(108,99,255,0.15)',color:'#6c63ff',border:'1px solid rgba(108,99,255,0.3)'}}>Coming Soon</span>
              </div>
              <p className="text-xs mb-5" style={{color:'var(--muted)'}}>For serious traders</p>
              <div className="flex items-end gap-1 mb-6"><span className="text-3xl sm:text-4xl font-extrabold">$19</span><span className="text-sm pb-1" style={{color:'var(--muted)'}}>/mo</span></div>
              <ul className="space-y-3 mb-8">
                {['Unlimited analyses','Advanced SMC detection','Multi-timeframe upload','Priority AI processing','Trade history & export','Email support'].map((t,i)=>(
                  <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm"><Check size={14} style={{color:'#6c63ff'}}/><span>{t}</span></li>
                ))}
              </ul>
              <button disabled className="w-full py-3 rounded-xl text-sm font-bold transition-all opacity-60 cursor-not-allowed flex items-center justify-center gap-2" style={{background:'linear-gradient(135deg,#6c63ff,#4f46e5)',color:'#fff'}}><Clock size={14}/>Notify Me</button>
            </div>

            {/* Enterprise — Coming Soon */}
            <div className="pricing-card sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold">Enterprise</h3>
                <span className="coming-soon-badge px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.3)'}}>Coming Soon</span>
              </div>
              <p className="text-xs mb-5" style={{color:'var(--muted)'}}>For prop firms & groups</p>
              <div className="flex items-end gap-1 mb-6"><span className="text-3xl sm:text-4xl font-extrabold">$49</span><span className="text-sm pb-1" style={{color:'var(--muted)'}}>/mo</span></div>
              <ul className="space-y-3 mb-8">
                {['Everything in Pro','Team dashboards','API access','Custom AI tuning','White-label options','Dedicated support'].map((t,i)=>(
                  <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm"><Check size={14} style={{color:'#f59e0b'}}/><span>{t}</span></li>
                ))}
              </ul>
              <button disabled className="w-full py-3 rounded-xl text-sm font-bold transition-all opacity-60 cursor-not-allowed flex items-center justify-center gap-2" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'var(--text-main)'}}><Clock size={14}/>Notify Me</button>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto"/>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
            <p className="text-sm sm:text-base" style={{color:'var(--muted)'}}>Got questions? We've got answers.</p>
          </div>
          <FAQ/>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto"/>

      {/* ═══ CTA ═══ */}
      <section className="cta-bg py-20 sm:py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"><div className="orb" style={{width:400,height:400,background:'radial-gradient(circle,rgba(108,99,255,0.15),transparent 70%)',top:'20%',left:'50%',transform:'translateX(-50%)',filter:'blur(80px)'}}/></div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight">
            Stop guessing.<br/><span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg,#6c63ff,#22c55e)',WebkitBackgroundClip:'text'}}>Start executing.</span>
          </h2>
          <p className="text-sm sm:text-lg mb-8 sm:mb-10 max-w-lg mx-auto" style={{color:'var(--muted)'}}>Join traders building a systematic, data-driven edge in the market.</p>
          <button onClick={onGetStarted} className="btn-glow text-sm sm:text-base">Start Analyzing Charts <ChevronRight size={20}/></button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 sm:py-8 text-center text-[11px] sm:text-xs" style={{borderTop:'1px solid rgba(255,255,255,0.04)',color:'var(--muted)'}}>
        <p>© {new Date().getFullYear()} ChartAI — All rights reserved.</p>
      </footer>
    </div>
  );
}
