'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check if already running as standalone PWA
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      if (isStandalone) {
        setIsInstalled(true);
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setInstallSuccess(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          setInstallSuccess(true);
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    } else {
      setShowInstructions(true);
    }
  };

  if (isInstalled) return null;

  if (installSuccess) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-mono text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> App Installed
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-semibold transition-all border shadow-xs cursor-pointer ${
          deferredPrompt
            ? 'bg-amber-400 hover:bg-amber-300 text-paper-900 border-amber-500 animate-pulse font-bold'
            : 'bg-paper-100 hover:bg-paper-200 text-academic-navy border-paper-300'
        }`}
        title={
          deferredPrompt
            ? 'Click to install SleepLab on your device'
            : 'Click for instructions to install / reinstall SleepLab'
        }
      >
        <Download className="w-3.5 h-3.5 text-academic-navy" />
        <span>{deferredPrompt ? 'Install App' : 'Install PWA'}</span>
      </button>

      {showInstructions && (
        <div className="fixed inset-0 bg-paper-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 border border-paper-300 rounded-lg max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-3 right-3 text-paper-400 hover:text-paper-700 font-mono text-sm px-2 py-1"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-academic-gold" />
              <h3 className="font-serif text-lg font-bold text-academic-navy">
                Install SleepLab as a PWA
              </h3>
            </div>
            <p className="text-xs text-paper-700 leading-relaxed mb-4">
              Browsers suppress the automated prompt after uninstalling or if the page hasn&apos;t reloaded. You can install or reinstall anytime manually:
            </p>
            <div className="bg-paper-100 border border-paper-200 rounded p-3 text-xs text-paper-800 space-y-2 font-mono mb-4">
              <div className="flex items-start gap-2">
                <span className="font-bold text-academic-navy">Chrome/Edge (Desktop):</span>
                <span>Click the <strong>Install</strong> icon in the address bar (right side), or menu <strong>⋮ → Save and share → Install SleepLab</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-academic-navy">Android (Chrome):</span>
                <span>Tap <strong>⋮ menu → Add to Home screen / Install app</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-academic-navy">iOS (Safari):</span>
                <span>Tap <strong>Share button (↑) → Add to Home Screen</strong>.</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-4 py-1.5 bg-academic-navy text-white text-xs font-mono font-semibold rounded hover:bg-academic-navy/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
