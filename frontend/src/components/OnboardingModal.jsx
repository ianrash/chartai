import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    title: <>Drop Your <span>Charts</span></>,
    titleText: 'Drop Your Charts',
    desc: 'Drop screenshots from TradingView, MT4, MT5, or any platform into ChartAI.',
    image: '/images/onboarding-step1.png',
    imageAlt: 'How to upload chart screenshots',
    tooltip: 'Step 1: Upload',
    tips: [
      { icon: '📊', color: 'rgba(59,130,246,0.2)', text: 'Use both a Higher Timeframe (H4/D1) and a Lower Timeframe (M15/M5)' },
      { icon: '✂️', color: 'rgba(108,99,255,0.2)', text: 'Crop tightly around the price action' },
      { icon: '🔖', color: 'rgba(34,197,94,0.2)', text: 'Label each chart with its correct timeframe' },
      { icon: '🌐', color: 'rgba(245,158,11,0.2)', text: 'Works with any instrument — Forex, Crypto, Indices, Commodities' },
    ],
  },
  {
    id: 2,
    badge: 'Step 2 of 3',
    accent: '#6c63ff',
    accentBg: 'rgba(108,99,255,0.1)',
    icon: BrainCircuit,
    title: <>AI Analyzes <span>Your Charts</span></>,
    titleText: 'AI Analyzes Your Charts',
    desc: 'Hit Analyze and our model scans market structure across your timeframes — detecting institutional zones in seconds.',
    image: '/images/onboarding-step2.png',
    imageAlt: 'AI analyzing chart structure',
    tooltip: 'Step 2: Analyze',
    tips: [
      { icon: '🔍', color: 'rgba(108,99,255,0.2)', text: 'Detects Order Blocks, Fair Value Gaps, and Break of Structure (BOS)' },
      { icon: '📐', color: 'rgba(59,130,246,0.2)', text: 'Aligns HTF bias with LTF entry precision' },
      { icon: '⚡', color: 'rgba(245,158,11,0.2)', text: 'Identifies liquidity sweeps, CHoCH, and premium/discount zones' },
      { icon: '⏱️', color: 'rgba(34,197,94,0.2)', text: 'Full analysis in under 10 seconds' },
    ],
  },
  {
    id: 3,
    badge: 'Step 3 of 3',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.1)',
    icon: Crosshair,
    title: <>Get Your <span>Trade Plan</span></>,
    titleText: 'Get Your Trade Plan',
    desc: 'Receive a complete, graded trade plan with exact entry, stop loss, take profit, R:R ratio, and confluence checklist.',
    image: '/images/onboarding-step3.png',
    imageAlt: 'AI-generated trade plan report',
    tooltip: 'Step 3: Trade Plan',
    tips: [
      { icon: '🏆', color: 'rgba(34,197,94,0.2)', text: 'Every setup graded A+ to F — only trade A or B rated setups' },
      { icon: '🎯', color: 'rgba(108,99,255,0.2)', text: 'Exact entry zone, stop loss buffer, and take profit levels included' },
      { icon: '📋', color: 'rgba(59,130,246,0.2)', text: 'Check the confluence checklist before trading' },
      { icon: '💾', color: 'rgba(245,158,11,0.2)', text: 'Save to history, export as PDF, or share via WhatsApp / Telegram' },
    ],
  },
];

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const contentRef = useRef(null);
  const nextBtnRef = useRef(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && !isLast) {
      goTo(step + 1, 'next');
    } else if (isRightSwipe && step > 0) {
      goTo(step - 1, 'back');
    }
  };

  const goTo = useCallback((nextStep, dir = 'next') => {
    if (animating) return;
    setAnimating(true);
    setDirection(dir);
    setImageLoaded(false);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 300);
  }, [animating]);

  const handleNext = useCallback(() => {
    if (isLast) {
      setShowCompletion(true);
      setTimeout(() => onComplete(), 400);
      return;
    }
    goTo(step + 1, 'next');
  }, [isLast, onComplete, goTo, step]);

  const handleBack = useCallback(() => {
    if (step === 0) return;
    goTo(step - 1, 'back');
  }, [step, goTo]);

  useEffect(() => {
    if (nextBtnRef.current) {
      nextBtnRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handleBack();
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, animating, handleNext, handleBack, onComplete]);

  const slideClass = direction === 'back' ? 'ob-slide-enter-back' : 'ob-slide-enter';

  return (
    <div 
      className="onboarding-overlay" 
      role="dialog" 
      aria-modal="true" 
      aria-label="ChartAI Onboarding"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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
              tabIndex={0}
              aria-label={`Go to ${s.tooltip}`}
              data-tooltip={s.tooltip}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  i !== step && goTo(i, i > step ? 'next' : 'back');
                }
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div
          ref={contentRef}
          key={step}
          className={`ob-content ${slideClass}`}
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
                ref={nextBtnRef}
                id={`ob-btn-step-${step + 1}`}
                className={`ob-btn-next ${isLast ? 'ob-btn-finish' : ''} ${showCompletion ? 'completing' : ''}`}
                onClick={handleNext}
                aria-label={isLast ? 'Start analyzing' : 'Next step'}
              >
                {showCompletion ? (
                  <>
                    <CheckCircle2 size={16} />
                    Done!
                  </>
                ) : isLast ? (
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
            <div className="ob-image-wrap">
              {!imageLoaded && <div className="ob-image-skeleton" />}
              <img
                src={current.image}
                alt={current.imageAlt}
                className={`ob-image ${imageLoaded ? 'loaded' : ''}`}
                draggable={false}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
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