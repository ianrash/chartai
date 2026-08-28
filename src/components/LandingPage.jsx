import { useEffect, useRef, useState } from 'react';
import {
  UploadCloud,
  BrainCircuit,
  Crosshair,
  Check,
  ArrowRight,
  ChevronDown,
  LineChart,
  Layers,
  ShieldCheck,
  Target,
  BarChart2,
} from 'lucide-react';
import './LandingPage.css';

const useReveal = (() => {
  let sharedObserver = null;
  const getObserver = () => {
    if (!sharedObserver) {
      sharedObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-visible');
          });
        },
        { threshold: 0.08 }
      );
    }
    return sharedObserver;
  };

  return () => {
    const ref = useRef(null);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      getObserver().observe(el);
      return () => getObserver().unobserve(el);
    }, []);
    return ref;
  };
})();

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
    <div className="lp-ticker" aria-hidden="true">
      <div className="lp-ticker-track">
        {all.map((t, i) => (
          <span key={i} className="lp-ticker-entry">
            <span className={`mono lp-ticker-item ${t.trend}`}>{t.symbol}</span>
            <span className="lp-ticker-sep" />
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroChartSVG() {
  return (
    <div className="lp-hero-chart" aria-hidden="true">
      <svg viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path
          className="lp-chart-area"
          d="M0,200 C60,185 100,150 160,165 C220,180 280,120 360,135 C440,150 500,80 580,95 C660,110 720,60 800,75 C880,90 940,40 1020,55 C1100,70 1160,30 1220,45 C1280,60 1340,20 1440,30 L1440,220 L0,220 Z"
        />
        <path
          className="lp-chart-line"
          d="M0,180 C80,165 120,130 180,148 C240,166 300,100 380,118 C460,136 520,70 600,88 C680,106 740,50 820,65 C900,80 960,35 1040,50 C1120,65 1180,25 1260,40 C1320,52 1380,20 1440,35"
        />
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
    <div ref={ref} className="lp-reveal lp-faq">
      {items.map((it, i) => (
        <div key={i} className={`lp-faq-item${open === i ? ' open' : ''}`}>
          <button
            className="lp-faq-question"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            aria-controls={`lp-faq-panel-${i}`}
            id={`lp-faq-btn-${i}`}
          >
            {it.q}
            <ChevronDown size={16} className="lp-faq-chevron" aria-hidden="true" />
          </button>
          <div
            id={`lp-faq-panel-${i}`}
            role="region"
            aria-labelledby={`lp-faq-btn-${i}`}
            className={`lp-faq-answer${open === i ? ' open' : ''}`}
          >
            <div className="lp-faq-answer-inner">{it.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Logo() {
  return (
    <a href="#top" className="lp-logo" aria-label="ChartAI home">
      <img src="/favicon.svg" alt="" className="lp-logo-mark" />
      <span className="lp-logo-word">
        Chart<span className="lp-logo-ai">AI</span>
      </span>
    </a>
  );
}

export default function LandingPage({ onGetStarted }) {
  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal(),
        r5 = useReveal(), r6 = useReveal(), r7 = useReveal();

  return (
    <div className="lp-page" id="top">

      {/* BACKGROUND */}
      <div className="lp-bg" aria-hidden="true">
        <div className="lp-dot-grid" />
      </div>

      {/* NAV */}
      <nav className="lp-nav glass" aria-label="Main navigation">
        <div className="lp-container lp-nav-inner">
          <Logo />
          <button onClick={onGetStarted} className="btn-ghost lp-nav-login">Login</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <HeroChartSVG />
        <div className="lp-container lp-hero-inner">
          <div className="lp-hero-child">
            <div className="lp-hero-label mono">
              <span className="lp-hero-label-dot" />
              Trading Intelligence
            </div>
          </div>

          <div className="lp-hero-child">
            <h1 className="lp-hero-title">
              Your charts,<br /><em>decoded by AI.</em>
            </h1>
          </div>

          <div className="lp-hero-child">
            <p className="lp-hero-sub">
              Upload multi-timeframe charts and receive institutional-grade trade setups —
              with order blocks, FVGs, liquidity zones, and a graded confluence score.
            </p>
          </div>

          <div className="lp-hero-child">
            <div className="lp-hero-actions">
              <button onClick={onGetStarted} className="btn-primary lp-btn-lg">
                Get Started Free <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button onClick={onGetStarted} className="btn-secondary lp-btn-lg">
                <LineChart size={15} aria-hidden="true" /> See How It Works
              </button>
            </div>
          </div>

          <div className="lp-hero-child">
            <dl className="lp-hero-stats">
              {[
                { v: '2,400+', l: 'Charts Analyzed' },
                { v: '4 Tools', l: 'In Every Setup' },
                { v: '<10s', l: 'Analysis Time' },
              ].map((s, i) => (
                <div key={i} className="lp-stat">
                  <dt className="lp-stat-label">{s.l}</dt>
                  <dd className="lp-stat-value">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <TickerTape />

      {/* SHOWCASE */}
      <section className="lp-section">
        <div ref={r1} className="lp-reveal lp-container-narrow">
          <figure className="lp-showcase">
            <img src="/images/dashboard-mobile.png" alt="ChartAI dashboard showing an AI trade analysis" loading="lazy" />
          </figure>
          <p className="lp-showcase-caption">
            Works across desktop and mobile — no downloads required
          </p>
        </div>
      </section>

      <div className="lp-container"><hr className="divider" /></div>

      {/* HOW IT WORKS */}
      <section className="lp-section">
        <div className="lp-container">
          <header ref={r2} className="lp-reveal lp-section-head">
            <p className="lp-microlabel">Process</p>
            <h2 className="lp-section-title">Three steps to a trade plan</h2>
            <p className="lp-section-sub">
              From raw screenshots to a complete trade plan — no experience needed.
            </p>
          </header>

          <div ref={r3} className="lp-reveal lp-stagger lp-grid-3">
            {[
              {
                num: '01',
                icon: <UploadCloud size={18} aria-hidden="true" />,
                title: 'Upload Charts',
                desc: 'Drop your higher and lower timeframe screenshots. Supports any pair, crypto, index, or commodity — from any charting platform.',
              },
              {
                num: '02',
                icon: <BrainCircuit size={18} aria-hidden="true" />,
                title: 'AI Reads Structure',
                desc: 'The model identifies order blocks, fair value gaps, liquidity sweeps, BOS/CHoCH breaks, and key demand and supply zones.',
              },
              {
                num: '03',
                icon: <Crosshair size={18} aria-hidden="true" />,
                title: 'Execute the Plan',
                desc: 'Receive a graded setup (A+ to F) with precise entry zone, stop loss, take profit, R:R ratio, and a confluence checklist.',
              },
            ].map((step, i) => (
              <article key={i} className="lp-card lp-step-card">
                <div className="lp-step-top">
                  <span className="icon-tile icon-tile-accent">{step.icon}</span>
                  <span className="mono lp-step-num">{step.num}</span>
                </div>
                <h3 className="lp-step-title">{step.title}</h3>
                <p className="lp-step-desc">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-container"><hr className="divider" /></div>

      {/* WHY */}
      <section className="lp-section">
        <div className="lp-container lp-stack-lg">
          <div ref={r4} className="lp-reveal">
            <p className="lp-microlabel">Why ChartAI</p>
            <h2 className="lp-section-title">Built for traders<br />who want precision</h2>
            <p className="lp-lede">
              Whether you're learning Smart Money Concepts or a seasoned trader looking to speed up
              your workflow — ChartAI gives you a professional-grade edge in seconds.
            </p>

            <ul className="lp-feature-list">
              {[
                ['Identifies ', 'Order Blocks', ' & ', 'FVGs', ' automatically'],
                ['Multi-timeframe trend alignment — HTF & LTF in one view'],
                ['Graded setups (A+ to F) with exact entry, SL, and TP'],
                ['Works with any charting platform — no integrations needed'],
              ].map((parts, i) => (
                <li key={i} className="lp-feature-item">
                  <span className="lp-feature-check"><Check size={11} strokeWidth={3} aria-hidden="true" /></span>
                  <span className="lp-feature-text">
                    {Array.isArray(parts)
                      ? parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p))
                      : parts}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div ref={r5} className="lp-reveal lp-why-media">
            <figure className="lp-showcase lp-why-img">
              <img src="/images/trader-ai.png" alt="Trader reviewing an AI-generated chart analysis" loading="lazy" />
            </figure>
            <div className="lp-feat-col">
              {[
                { icon: <Layers size={16} aria-hidden="true" />, title: 'Multi-Timeframe', desc: 'HTF bias with LTF precision. Contradictions are flagged to protect your capital.' },
                { icon: <BarChart2 size={16} aria-hidden="true" />, title: 'Smart Money Concepts', desc: 'Detects OB, FVG, liquidity pools, BOS, CHoCH, and premium/discount zones.' },
                { icon: <ShieldCheck size={16} aria-hidden="true" />, title: 'Risk Management', desc: 'SL buffers, target levels, and minimum R:R thresholds enforced on every setup.' },
                { icon: <Target size={16} aria-hidden="true" />, title: 'Setup Grading', desc: 'A+ to F confluence checklist keeps you out of C and F rated noise.' },
              ].map((f, i) => (
                <article key={i} className="lp-card lp-feat-card">
                  <span className="icon-tile icon-tile-accent">{f.icon}</span>
                  <h3 className="lp-feat-title">{f.title}</h3>
                  <p className="lp-feat-desc">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="lp-container"><hr className="divider" /></div>

      {/* COMMUNITY */}
      <section className="lp-section">
        <div ref={r6} className="lp-reveal lp-container lp-split">
          <div>
            <p className="lp-microlabel">Community</p>
            <h2 className="lp-section-title">Trusted by traders worldwide</h2>
            <p className="lp-lede">
              From solo retail traders to prop firm teams, ChartAI helps people make more informed
              decisions. Our AI removes emotional bias and delivers objective, data-driven trade
              plans — every time.
            </p>
            <button onClick={onGetStarted} className="btn-primary lp-btn-lg">
              Join Free <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <figure className="lp-showcase">
            <img src="/images/traders-team.png" alt="A team of traders collaborating around market data" loading="lazy" />
          </figure>
        </div>
      </section>

      <div className="lp-container"><hr className="divider" /></div>

      {/* PRICING */}
      <section className="lp-section">
        <div className="lp-container">
          <header ref={r7} className="lp-reveal lp-section-head">
            <p className="lp-microlabel">Pricing</p>
            <h2 className="lp-section-title">Simple, transparent pricing</h2>
            <p className="lp-section-sub">Start free. No credit card required.</p>
          </header>

          <div className="lp-grid-3">
            {/* Free — available */}
            <article className="lp-card lp-price-card is-active">
              <div className="lp-price-head">
                <h3 className="lp-price-name">Free</h3>
                <span className="chip-accent badge">Available</span>
              </div>
              <p className="lp-price-tagline">Perfect for getting started</p>
              <p className="lp-price-amount">
                <span className="lp-price-num">$0</span>
                <span className="lp-price-period">/mo</span>
              </p>
              <ul className="lp-price-features">
                {[
                  '5 analyses per day',
                  'Basic confluence grading',
                  'Single timeframe upload',
                  'Community support',
                ].map((f, i) => (
                  <li key={i}><Check size={14} className="lp-price-check" aria-hidden="true" />{f}</li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="btn-primary lp-price-btn">Get Started</button>
            </article>

            {/* Pro — coming soon */}
            <article className="lp-card lp-price-card is-disabled" aria-disabled="true">
              <div className="lp-price-head">
                <h3 className="lp-price-name">Pro</h3>
                <span className="lp-coming-badge">Coming Soon</span>
              </div>
              <p className="lp-price-tagline">For serious traders</p>
              <p className="lp-price-amount">
                <span className="lp-price-num">$19</span>
                <span className="lp-price-period">/mo</span>
              </p>
              <ul className="lp-price-features">
                {[
                  'Unlimited analyses',
                  'Advanced SMC detection',
                  'Multi-timeframe upload',
                  'Priority AI processing',
                  'Trade history & export',
                  'Email support',
                ].map((f, i) => (
                  <li key={i}><Check size={14} className="lp-price-check" aria-hidden="true" />{f}</li>
                ))}
              </ul>
              <button disabled className="btn-secondary lp-price-btn">Coming Soon</button>
            </article>

            {/* Enterprise — coming soon */}
            <article className="lp-card lp-price-card is-disabled" aria-disabled="true">
              <div className="lp-price-head">
                <h3 className="lp-price-name">Enterprise</h3>
                <span className="lp-coming-badge">Coming Soon</span>
              </div>
              <p className="lp-price-tagline">For prop firms and teams</p>
              <p className="lp-price-amount">
                <span className="lp-price-num">$49</span>
                <span className="lp-price-period">/mo</span>
              </p>
              <ul className="lp-price-features">
                {[
                  'Everything in Pro',
                  'Team dashboards',
                  'API access',
                  'Custom AI tuning',
                  'White-label options',
                  'Dedicated support',
                ].map((f, i) => (
                  <li key={i}><Check size={14} className="lp-price-check" aria-hidden="true" />{f}</li>
                ))}
              </ul>
              <button disabled className="btn-secondary lp-price-btn">Coming Soon</button>
            </article>
          </div>
        </div>
      </section>

      <div className="lp-container"><hr className="divider" /></div>

      {/* FAQ */}
      <section className="lp-section">
        <div className="lp-container-narrow">
          <header className="lp-section-head">
            <p className="lp-microlabel">FAQ</p>
            <h2 className="lp-section-title">Questions? Answers.</h2>
          </header>
          <FAQ />
        </div>
      </section>

      <div className="lp-container"><hr className="divider" /></div>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-box">
            <h2 className="lp-cta-title">
              Stop guessing.<br /><span className="tone-accent">Start executing.</span>
            </h2>
            <p className="lp-cta-sub">
              Join traders building a systematic, data-driven edge in the market.
              Free to start — no credit card needed.
            </p>
            <div className="lp-hero-actions">
              <button onClick={onGetStarted} className="btn-primary lp-btn-lg">
                Start for Free <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <Logo />
          <p className="lp-footer-text">
            © {new Date().getFullYear()} ChartAI — Not financial advice. All rights reserved. · by ianrash
          </p>
        </div>
      </footer>

    </div>
  );
}
