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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

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
  };

  if (isInstalled) return null;

  if (installSuccess) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-mono text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> App Installed
      </span>
    );
  }

  // Render install button when prompt is available, or instructions badge for manual installation
  return (
    <button
      onClick={deferredPrompt ? handleInstallClick : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-semibold transition-colors border shadow-xs ${
        deferredPrompt
          ? 'bg-amber-400 hover:bg-amber-300 text-paper-900 border-amber-500 cursor-pointer animate-pulse'
          : 'bg-paper-100 hover:bg-paper-200 text-academic-navy border-paper-300 cursor-pointer'
      }`}
      title={
        deferredPrompt
          ? 'Install SleepLab App on Home Screen / Desktop'
          : 'To install: Open browser menu (⋮ or Share) and select "Add to Home Screen" / "Install App"'
      }
    >
      <Download className="w-3.5 h-3.5 text-academic-navy" />
      <span>{deferredPrompt ? 'Install App' : 'Install PWA'}</span>
    </button>
  );
};
