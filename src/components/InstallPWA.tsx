'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--success-soft)] text-[var(--success)] rounded-md text-xs font-sans font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> App Installed
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-sans font-medium transition-all border shadow-xs cursor-pointer ${
          deferredPrompt
            ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-transparent font-semibold animate-pulse'
            : 'bg-[var(--surface-raised)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-default)]'
        }`}
        title={
          deferredPrompt
            ? 'Click to install SleepLab on your device'
            : 'Click for instructions to install / reinstall SleepLab'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{deferredPrompt ? 'Install App' : 'Install PWA'}</span>
      </button>

      {showInstructions && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl max-w-md w-full p-6 shadow-lg relative font-sans space-y-4">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
                Install SleepLab as a PWA
              </h3>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Browsers suppress the automated prompt after uninstalling or if the page hasn&apos;t reloaded. You can install or reinstall anytime manually:
            </p>

            <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg p-4 text-xs text-[var(--text-secondary)] space-y-3 font-sans">
              <div>
                <strong className="block text-[var(--text-primary)] font-medium mb-0.5">Chrome / Edge (Desktop):</strong>
                <span>Click the <strong>Install</strong> icon in the address bar (right side), or menu <strong>⋮ → Save and share → Install SleepLab</strong>.</span>
              </div>
              <div>
                <strong className="block text-[var(--text-primary)] font-medium mb-0.5">Android (Chrome):</strong>
                <span>Tap <strong>⋮ menu → Add to Home screen / Install app</strong>.</span>
              </div>
              <div>
                <strong className="block text-[var(--text-primary)] font-medium mb-0.5">iOS (Safari):</strong>
                <span>Tap <strong>Share button (↑) → Add to Home Screen</strong>.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-sans font-medium rounded-md transition-colors shadow-sm"
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
