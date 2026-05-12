import { useEffect, useRef, useState } from 'react';
import { UploadCloud, BrainCircuit, Crosshair, Check, ArrowRight, ChevronDown, LineChart, Layers, ShieldCheck, Target, BarChart2 } from 'lucide-react';
import './LandingPage.css';

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('is-visible'); },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const TICKERS = [
  { symbol: 'EUR/USD', trend: 'bullish' },
  { symbol: 'GBP/JPY', trend: 'bearish' },
  { symbol: 'XAU/USD', trend: 'bullish' },
  { symbol: 'BTC/USD', trend: 'bullish' },
  { symbol: 'NAS100', trend: 'bearish' },
  { symbol: 'US30', trend: 'neutral' },
  { symbol: 'SPX500', trend: 'bullish' },
  { symbol: 'GBP/USD', trend: 'neutral' },
  { symbol: 'AUD/USD', trend: 'bearish' },
  { symbol: 'USD/CAD', trend: 'bullish' },
];

function TickerTape() {
  const all = [...TICKERS, ...TICKERS];
  return (
    <div className="lp-ticker">
      <div className="lp-ticker-track">
        {all.map((t, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <span className={`lp-ticker-item ${t.trend}`}>{t.symbol}</span>
            <span className="lp-ticker-sep">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroChartSVG() {
  return (
    <div className="lp-hero-chart">
      <svg viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path d="M0,200 C60,185 100,150 160,165 C220,180 280,120 360,135 C440,150 500,80 580,95 C660,110 720,60 800,75 C880,90 940,40 1020,55 C1100,70 1160,30 1220,45 C1280,60 1340,20 1440,30 L1440,220 L0,220 Z" fill="rgba(200,130,10,0.05)" />
        <path d="M0,180 C80,165 120,130 180,148 C240,166 300,100 380,118 C460,136 520,70 600,88 C680,106 740,50 820,65 C900,80 960,35 1040,50 C1120,65 1180,25 1260,40 C1320,52 1380,20 1440,35" />
      </svg>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(null);
  const ref = useReveal();
  const items = [
    {
      q: 'What trading pairs does ChartAI support?',
      a: 'ChartAI works with any instrument — forex, crypto, indices, commodities, and stocks. Just upload screenshots from your charting platform and let the AI do the rest.',
    },
    {
      q: 'How accurate is the AI analysis?',
      a: 'Our model identifies structural patterns with precision. Every setup is graded A+ to F through a confluence checklist — so you filter out the noise and focus on high-probability trades.',
    },
    {
      q: 'Do I need coding or AI experience?',
      a: 'Upload your chart screenshots, select timeframes, and in seconds receive a complete trade plan with entry, stop, target, and R:R ratio.',
    },
    {
      q: 'Is my chart data secure?',
      a: 'Yes. Uploaded images are processed in real-time and never stored permanently on our servers. Your trading data stays yours.',
    },
  ];
  return (
    <div ref={ref} className="lp-reveal">
      {items.map((it, i) => (
        <div key={i} className={`lp-faq-item${open === i ? ' open' : ''}`}>
          <button className="lp-faq-question" onClick={() => setOpen(open === i ? null : i)}>
            {it.q}
            <ChevronDown size={16} className="lp-faq-chevron" />
          </button>
          <div className={`lp-faq-answer${open === i ? ' open' : ''}`}>
            <div className="lp-faq-answer-inner">{it.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal(), r5 = useReveal(), r6 = useReveal(), r7 = useReveal();

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0e', color: '#f4f4f5' }}>

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="lp-dot-grid" />
      </div>

      {/* NAV */}
      <nav className="lp-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="lp-nav-logo">
            <img src="/favicon.svg" alt="ChartAI" className="lp-nav-logo-mark" />
            <span className="font-bold text-base tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              Chart<span style={{ color: '#c8820a' }}>AI</span>
            </span>
          </div>
          <button onClick={onGetStarted} className="lp-nav-login">Login</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero relative px-5">
        <HeroChartSVG />
        <div className="max-w-6xl mx-auto relative z-10">
          <div style={{ maxWidth: 680 }}>
            <div className="lp-hero-child">
              <div className="lp-hero-label">
                <span className="lp-hero-label-dot" />
                <span>Trading Intelligence</span>
              </div>
            </div>

            <div className="lp-hero-child">
              <h1 className="lp-hero-title">
                Your charts,<br /><em>decoded by AI.</em>
              </h1>
            </div>

            <div className="lp-hero-child">
              <p className="lp-hero-sub">
                Upload multi-timeframe charts and receive institutional-grade trade setups — with order blocks, FVGs, liquidity zones, and a graded confluence score.
              </p>
            </div>

            <div className="lp-hero-child">
              <div className="lp-hero-actions">
                <button onClick={onGetStarted} className="lp-btn-primary">
                  Get Started Free <ArrowRight size={16} />
                </button>
                <button onClick={onGetStarted} className="lp-btn-secondary">
                  <LineChart size={15} /> See How It Works
                </button>
              </div>
            </div>

            <div className="lp-hero-child" style={{ marginTop: 40 }}>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {[
                  { v: '2,400+', l: 'Charts Analyzed' },
                  { v: '4 Tools', l: 'In Every Setup' },
                  { v: '< 10s', l: 'Analysis Time' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#c8820a', letterSpacing: '-0.02em' }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <TickerTape />

      {/* SHOWCASE */}
      <section className="py-16 sm:py-24 relative">
        <div ref={r1} className="lp-reveal max-w-5xl mx-auto px-5">
          <div className="lp-showcase">
            <img src="/images/dashboard-mobile.png" alt="ChartAI dashboard" loading="lazy" />
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#8888a0', marginTop: 16 }}>
            Works across desktop and mobile — no downloads required
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><div className="lp-divider" /></div>

      {/* HOW IT WORKS */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-5">
          <div ref={r2} className="lp-reveal" style={{ marginBottom: 48 }}>
            <div className="lp-section-tag">Process</div>
            <h2 className="lp-section-title">Three steps to a trade plan</h2>
            <p className="lp-section-sub">
              From raw screenshots to a complete trade plan — no experience needed.
            </p>
          </div>

          <div ref={r3} className="lp-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              {
                num: '01',
                icon: <UploadCloud size={20} color="#c8820a" />,
                title: 'Upload Charts',
                desc: 'Drop your higher and lower timeframe screenshots. Supports any pair, crypto, index, or commodity — from any charting platform.',
              },
              {
                num: '02',
                icon: <BrainCircuit size={20} color="#c8820a" />,
                title: 'AI Reads Structure',
                desc: 'The model identifies order blocks, fair value gaps, liquidity sweeps, BOS/CHoCH breaks, and key demand and supply zones.',
              },
              {
                num: '03',
                icon: <Crosshair size={20} color="#c8820a" />,
                title: 'Execute the Plan',
                desc: 'Receive a graded setup (A+ to F) with precise entry zone, stop loss, take profit, R:R ratio, and a confluence checklist.',
              },
            ].map((step, i) => (
              <div key={i} className="lp-step-card">
                <div className="lp-step-num">{step.num}</div>
                <div className="lp-step-icon">{step.icon}</div>
                <h3 className="lp-step-title">{step.title}</h3>
                <p className="lp-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><div className="lp-divider" /></div>

      {/* WHY TRADERS USE IT */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-5">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'start' }}>
            <div ref={r4} className="lp-reveal">
              <div className="lp-section-tag">Why ChartAI</div>
              <h2 className="lp-section-title">Built for traders<br />who want precision</h2>
              <p style={{ fontSize: 15, color: '#b0b0c2', lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
                Whether you're learning Smart Money Concepts or a seasoned trader looking to speed up your workflow — ChartAI gives you a professional-grade edge in seconds.
              </p>

              <div className="lp-feature-list">
                {[
                  'Identifies <strong>Order Blocks</strong> & <strong>FVGs</strong> automatically',
                  'Multi-timeframe trend alignment — HTF & LTF in one view',
                  'Graded setups (A+ to F) with exact entry, SL, and TP',
                  'Works with any charting platform — no integrations needed',
                ].map((t, i) => (
                  <div key={i} className="lp-feature-item">
                    <div className="lp-feature-check">
                      <Check size={11} color="#2a9461" />
                    </div>
                    <span className="lp-feature-text" dangerouslySetInnerHTML={{ __html: t }} />
                  </div>
                ))}
              </div>
            </div>

            <div ref={r5} className="lp-reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="lp-showcase">
                <img src="/images/trader-ai.png" alt="Trader using ChartAI" loading="lazy" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: <Layers size={18} color="#c8820a" />, title: 'Multi-Timeframe', desc: 'HTF bias with LTF precision. Contradictions are flagged to protect your capital.' },
                  { icon: <BarChart2 size={18} color="#c8820a" />, title: 'Smart Money Concepts', desc: 'Detects OB, FVG, liquidity pools, BOS, CHoCH, and premium/discount zones.' },
                  { icon: <ShieldCheck size={18} color="#c8820a" />, title: 'Risk Management', desc: 'SL buffers, target levels, and minimum R:R thresholds enforced on every setup.' },
                  { icon: <Target size={18} color="#c8820a" />, title: 'Setup Grading', desc: 'A+ to F confluence checklist keeps you out of C and F rated noise.' },
                ].map((f, i) => (
                  <div key={i} className="lp-feat-card" style={{ flex: 1 }}>
                    <div className="lp-feat-icon">{f.icon}</div>
                    <h4 className="lp-feat-title">{f.title}</h4>
                    <p className="lp-feat-desc">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><div className="lp-divider" /></div>

      {/* COMMUNITY */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-5">
          <div ref={r6} className="lp-reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div className="lp-section-tag">Community</div>
              <h2 className="lp-section-title">Trusted by traders worldwide</h2>
              <p style={{ fontSize: 15, color: '#b0b0c2', lineHeight: 1.7, marginBottom: 28 }}>
                From solo retail traders to prop firm teams, ChartAI helps people make more informed decisions. Our AI removes emotional bias and delivers objective, data-driven trade plans — every time.
              </p>
              <button onClick={onGetStarted} className="lp-btn-primary" style={{ alignSelf: 'flex-start' }}>
                Join Free <ArrowRight size={16} />
              </button>
            </div>
            <div className="lp-showcase">
              <img src="/images/traders-team.png" alt="Traders community" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><div className="lp-divider" /></div>

      {/* PRICING */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-5">
          <div ref={r7} className="lp-reveal" style={{ marginBottom: 48 }}>
            <div className="lp-section-tag">Pricing</div>
            <h2 className="lp-section-title">Simple, transparent pricing</h2>
            <p className="lp-section-sub">Start free. No credit card required.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Free */}
            <div className="lp-price-card">
              <div className="lp-price-tier">Free</div>
              <div className="lp-price-name">Free</div>
              <div className="lp-price-tagline">Perfect for getting started</div>
              <div className="lp-price-amount">
                <span className="lp-price-num free">$0</span>
                <span className="lp-price-period">/mo</span>
              </div>
              <ul className="lp-price-features">
                {[
                  '5 analyses per day',
                  'Basic confluence grading',
                  'Single timeframe upload',
                  'Community support',
                ].map((f, i) => (
                  <li key={i}>
                    <Check size={14} color="#2a9461" className="lp-price-check" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="lp-price-btn lp-price-btn-default">Get Started</button>
            </div>

            {/* Pro */}
            <div className="lp-price-card featured">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <div className="lp-price-tier featured">Popular</div>
                <span className="lp-coming-badge">Coming Soon</span>
              </div>
              <div className="lp-price-name">Pro</div>
              <div className="lp-price-tagline">For serious traders</div>
              <div className="lp-price-amount">
                <span className="lp-price-num">$19</span>
                <span className="lp-price-period">/mo</span>
              </div>
              <ul className="lp-price-features">
                {[
                  'Unlimited analyses',
                  'Advanced SMC detection',
                  'Multi-timeframe upload',
                  'Priority AI processing',
                  'Trade history & export',
                  'Email support',
                ].map((f, i) => (
                  <li key={i}>
                    <Check size={14} color="#c8820a" className="lp-price-check" />
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled className="lp-price-btn lp-price-btn-disabled">Notify Me</button>
            </div>

            {/* Enterprise */}
            <div className="lp-price-card">
              <div className="lp-price-tier">Enterprise</div>
              <div className="lp-price-name">Enterprise</div>
              <div className="lp-price-tagline">For prop firms and teams</div>
              <div className="lp-price-amount">
                <span className="lp-price-num">$49</span>
                <span className="lp-price-period">/mo</span>
              </div>
              <ul className="lp-price-features">
                {[
                  'Everything in Pro',
                  'Team dashboards',
                  'API access',
                  'Custom AI tuning',
                  'White-label options',
                  'Dedicated support',
                ].map((f, i) => (
                  <li key={i}>
                    <Check size={14} color="#a1a1aa" className="lp-price-check" />
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled className="lp-price-btn lp-price-btn-disabled">Notify Me</button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><div className="lp-divider" /></div>

      {/* FAQ */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-3xl mx-auto px-5">
          <div style={{ marginBottom: 40 }}>
            <div className="lp-section-tag">FAQ</div>
            <h2 className="lp-section-title">Questions? Answers.</h2>
          </div>
          <FAQ />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><div className="lp-divider" /></div>

      {/* CTA */}
      <section className="lp-cta">
        <div className="max-w-6xl mx-auto px-5">
          <div style={{ maxWidth: 580 }}>
            <h2 className="lp-cta-title">
              Stop guessing.<br />
              <span style={{ color: '#c8820a' }}>Start executing.</span>
            </h2>
            <p className="lp-cta-sub">
              Join traders building a systematic, data-driven edge in the market. Free to start — no credit card needed.
            </p>
            <div className="lp-cta-actions">
              <button onClick={onGetStarted} className="lp-btn-primary">
                Start for Free <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="max-w-6xl mx-auto px-5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="lp-nav-logo" style={{ marginBottom: 0 }}>
            <img src="/favicon.svg" alt="ChartAI" className="lp-nav-logo-mark" />
            <span className="font-bold text-sm tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              Chart<span style={{ color: '#c8820a' }}>AI</span>
            </span>
          </div>
          <p className="lp-footer-text">© {new Date().getFullYear()} ChartAI — Not financial advice. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
