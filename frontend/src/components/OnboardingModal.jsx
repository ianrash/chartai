import React, { useState, useEffect, useCallback } from 'react';
import {
  UploadCloud, BrainCircuit, Crosshair,
  ArrowRight, ChevronLeft, CheckCircle2,
  Layers, Zap, ShieldCheck, Check, X
} from 'lucide-react';
import './OnboardingModal.css';

const STEPS = [
  {
    id: 1,
    badge: 'Step 1 of 3',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.1)',
    icon: UploadCloud,
    title: <>Upload Your <span>Chart Screenshots</span></>,
    titleText: 'Upload Your Chart Screenshots',
    desc: 'Take screenshots of your charts from TradingView, MT4, MT5, or any platform — and drop them into ChartAI.',
    image: '/images/onboarding-step1.png',
    imageAlt: 'How to upload chart screenshots',
    tips: [
      { icon: '📊', color: 'rgba(59,130,246,0.2)', text: 'Upload a Higher Timeframe (H4/D1) and a Lower Timeframe (M15/M5)' },
      { icon: '✂️', color: 'rgba(108,99,255,0.2)', text: 'Crop tightly around the price action — no need for the full screen' },
      { icon: '🔖', color: 'rgba(34,197,94,0.2)', text: 'Select the correct timeframe label for each chart after uploading' },
      { icon: '🌐', color: 'rgba(245,158,11,0.2)', text: 'Works with any pair — Forex, Crypto, Indices, Commodities' },
    ],
  },
  {
    id: 2,
    badge: 'Step 2 of 3',
    accent: '#6c63ff',
    accentBg: 'rgba(108,99,255,0.1)',
    icon: BrainCircuit,
    title: <>The AI <span>Scans & Analyses</span></>,
    titleText: 'The AI Scans & Analyses',
    desc: 'Once you hit Analyze, our model reads the market structure across your timeframes and detects key institutional zones.',
    image: '/images/onboarding-step2.png',
    imageAlt: 'AI analyzing chart structure',
    tips: [
      { icon: '🔍', color: 'rgba(108,99,255,0.2)', text: 'Identifies Order Blocks, Fair Value Gaps, and Break of Structure (BOS)' },
      { icon: '📐', color: 'rgba(59,130,246,0.2)', text: 'Checks HTF bias alignment with LTF entry precision' },
      { icon: '⚡', color: 'rgba(245,158,11,0.2)', text: 'Scans for liquidity sweeps, CHoCH, and premium/discount zones' },
      { icon: '⏱️', color: 'rgba(34,197,94,0.2)', text: 'Full analysis delivered in under 10 seconds' },
    ],
  },
  {
    id: 3,
    badge: 'Step 3 of 3',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.1)',
    icon: Crosshair,
    title: <>Read Your <span>Trade Plan</span></>,
    titleText: 'Read Your Trade Plan',
    desc: 'Get a complete, graded trade plan with exact entry, stop loss, take profit, R:R ratio, and a full confluence checklist.',
    image: '/images/onboarding-step3.png',
    imageAlt: 'AI-generated trade plan report',
    tips: [
      { icon: '🏆', color: 'rgba(34,197,94,0.2)', text: 'Every setup is graded A+ to F — only take A or B rated setups' },
      { icon: '🎯', color: 'rgba(108,99,255,0.2)', text: 'Precise entry zone, stop loss buffer, and take profit levels included' },
      { icon: '📋', color: 'rgba(59,130,246,0.2)', text: 'Review the confluence checklist before placing any trade' },
      { icon: '💾', color: 'rgba(245,158,11,0.2)', text: 'Save setups to your history, export as PDF, or share to WhatsApp / Telegram' },
    ],
  },
];

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next');

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const goTo = useCallback((nextStep, dir = 'next') => {
    if (animating) return;
    setAnimating(true);
    setDirection(dir);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 300);
  }, [animating]);

  const handleNext = useCallback(() => {
    if (isLast) { onComplete(); return; }
    goTo(step + 1, 'next');
  }, [isLast, onComplete, goTo, step]);

  const handleBack = useCallback(() => {
    if (step === 0) return;
    goTo(step - 1, 'back');
  }, [step, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handleBack();
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, animating, handleNext, handleBack, onComplete]);

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="ChartAI Onboarding">
      <div className="onboarding-modal">

        {/* Skip */}
        <button className="ob-skip" onClick={onComplete} aria-label="Skip onboarding">
          Skip
        </button>

        {/* Dots */}
        <div className="ob-dots">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`ob-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
              onClick={() => i !== step && goTo(i, i > step ? 'next' : 'back')}
              role="button"
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Main content */}
        <div
          key={step}
          className={`ob-content ob-slide-enter`}
        >
          {/* Left: Text */}
          <div className="ob-text">
            <div
              className="ob-step-badge"
              style={{ background: current.accentBg, borderColor: `${current.accent}30`, color: current.accent }}
            >
              <current.icon size={12} />
              {current.badge}
            </div>

            <h2 className="ob-title">{current.title}</h2>
            <p className="ob-desc">{current.desc}</p>

            <ul className="ob-tips">
              {current.tips.map((tip, i) => (
                <li key={i} className="ob-tip">
                  <span
                    className="ob-tip-icon"
                    style={{ background: tip.color }}
                  >
                    {tip.icon}
                  </span>
                  <span>{tip.text}</span>
                </li>
              ))}
            </ul>

            <div className="ob-nav">
              {step > 0 && (
                <button className="ob-btn-back" onClick={handleBack} aria-label="Previous step">
                  <ChevronLeft size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Back
                </button>
              )}
              <button
                id={`ob-btn-step-${step + 1}`}
                className={`ob-btn-next ${isLast ? 'ob-btn-finish' : ''}`}
                onClick={handleNext}
              >
                {isLast ? (
                  <>
                    <CheckCircle2 size={16} />
                    Start Analyzing
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Image */}
          <div className="ob-image-panel">
            <img
              src={current.image}
              alt={current.imageAlt}
              className="ob-image"
              draggable={false}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="ob-progress-bar-wrap">
          <div className="ob-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
