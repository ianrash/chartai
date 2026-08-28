import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const alreadyDismissed = localStorage.getItem('chartai_pwa_dismissed');
    if (alreadyDismissed) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem('chartai_pwa_dismissed', 'installed');
      }
    } catch (e) {
      console.error('PWA install failed:', e);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('chartai_pwa_dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="modal-panel max-w-md mx-auto flex items-center gap-3 animate-fade-in-up" style={{ padding: '14px 16px' }}>
        <div
          className="icon-tile"
          style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--accent-glow)', color: 'var(--accent)' }}
        >
          <Download size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
            Install ChartAI
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Add to home screen for offline access
          </p>
        </div>

        <button onClick={handleInstall} className="btn-primary flex-shrink-0" style={{ padding: '7px 14px', fontSize: 12 }}>
          Install
        </button>

        <button onClick={handleDismiss} className="icon-btn flex-shrink-0" style={{ width: 28, height: 28 }} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
