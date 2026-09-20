import React, { useEffect, useState } from 'react';
import { StudyConfig, StudyStatus } from '@/types/sleeplab';
import { calculateEndDate, getStudyStatus } from '@/lib/storage';
import { InstallPWA } from './InstallPWA';
import { FlaskConical, Calendar, Award, Cloud, User, LogOut, Settings, Moon, Sun, AlertTriangle, X } from 'lucide-react';

interface HeaderProps {
  studyConfig: StudyConfig;
  currentDayNumber: number;
  totalEntriesCount: number;
  avgSleepFormatted: string;
  avgRecoveryScore: number;
  userEmail?: string | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  onOpenStudySettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  studyConfig,
  currentDayNumber,
  totalEntriesCount,
  avgSleepFormatted,
  avgRecoveryScore,
  userEmail,
  onOpenAuthModal,
  onSignOut,
  onOpenStudySettings,
}) => {
  const endDate = calculateEndDate(studyConfig.startDate, studyConfig.durationDays);
  const status: StudyStatus = getStudyStatus(studyConfig.startDate, studyConfig.durationDays);
  const progressPct = Math.min(100, Math.round((totalEntriesCount / studyConfig.durationDays) * 100));
  const displayUsername = userEmail ? userEmail.split('@')[0] : null;

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);

  useEffect(() => {
    const currentTheme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('sleeplab_theme', nextTheme);
  };

  return (
    <header className="border-b border-[var(--border-default)] bg-[var(--canvas)] transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 space-y-5">
        
        {/* TIER 1: App Utility Chrome Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-default)]">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-sm font-sans font-semibold text-[var(--text-primary)]">
              <FlaskConical className="w-4 h-4 text-[var(--accent)]" /> SleepLab
            </span>
          </div>

          {/* Right: Compact Mobile-Friendly Action Group */}
          <div className="flex items-center gap-1.5">
            {/* Supabase Sync / Auth */}
            {displayUsername ? (
              <div className="flex items-center gap-1 bg-[var(--success-soft)] text-[var(--success)] px-2.5 py-1 rounded-md text-xs font-sans font-medium">
                <Cloud className="w-3.5 h-3.5" />
                <span>@{displayUsername}</span>
                <button
                  onClick={() => setShowSignOutConfirm(true)}
                  title="Sign Out"
                  className="ml-1 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                title="Sign In / Sync Data"
                className="flex items-center gap-1.5 text-xs font-sans font-medium text-[var(--text-primary)] bg-[var(--surface-raised)] hover:bg-[var(--border-default)] px-2.5 py-1.5 rounded-md border border-[var(--border-default)] transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden sm:inline">Sign In / Sync</span>
              </button>
            )}

            {/* Protocol Settings */}
            {onOpenStudySettings && (
              <button
                onClick={onOpenStudySettings}
                title="Configure Study Settings"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sans font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-raised)] hover:bg-[var(--border-default)] rounded-md border border-[var(--border-default)] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sans font-medium text-[var(--text-secondary)] bg-[var(--surface-raised)] hover:text-[var(--text-primary)] hover:bg-[var(--border-default)] rounded-md border border-[var(--border-default)] transition-colors"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[var(--warning)]" />
                  <span className="hidden sm:inline">Light</span>
                </>
              )}
            </button>

            {/* PWA Home Screen Install Button */}
            <InstallPWA />
          </div>
        </div>

        {/* TIER 2: Editorial Study Hero */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-3xl font-serif font-normal text-[var(--text-primary)] tracking-tight">
              {studyConfig.title}
            </h1>

            <span
              className={`text-[10px] sm:text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full ${
                status === 'Active'
                  ? 'bg-[var(--success-soft)] text-[var(--success)]'
                  : status === 'Upcoming'
                  ? 'bg-[var(--info-soft)] text-[var(--info)]'
                  : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-default)]'
              }`}
            >
              ● {status}
            </span>
          </div>

          <p className="text-xs font-sans text-[var(--text-secondary)] flex flex-wrap items-center gap-2">
            <span>{studyConfig.startDate} → {endDate}</span>
            <span className="text-[var(--text-tertiary)] hidden sm:inline">•</span>
            <span>{studyConfig.durationDays}-Day Longitudinal Protocol</span>
          </p>
        </div>

        {/* UNIFIED 3-COLUMN STAT STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg p-4">
          
          {/* Stat 1: Progress */}
          <div className="space-y-1.5 pb-3 sm:pb-0 border-b sm:border-b-0 border-[var(--border-default)]">
            <div className="flex items-center justify-between text-xs font-sans text-[var(--text-secondary)]">
              <span className="uppercase tracking-wider font-medium text-[10px]">Study Progress</span>
              <span className="font-semibold text-[var(--accent)]">{progressPct}%</span>
            </div>
            <div className="text-base sm:text-lg font-sans font-semibold text-[var(--text-primary)]">
              {totalEntriesCount} <span className="text-xs font-normal text-[var(--text-tertiary)]">/ {studyConfig.durationDays} entries</span>
            </div>
            <div className="w-full bg-[var(--border-default)] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[var(--accent)] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Stat 2: Avg Duration */}
          <div className="space-y-1.5 pb-3 sm:pb-0 sm:border-l sm:border-[var(--border-default)] sm:pl-4 border-b sm:border-b-0 border-[var(--border-default)]">
            <div className="flex items-center gap-1.5 text-xs font-sans text-[var(--text-secondary)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span className="uppercase tracking-wider font-medium text-[10px]">Avg Sleep Duration</span>
            </div>
            <div className="text-base sm:text-lg font-sans font-semibold text-[var(--text-primary)]">
              {totalEntriesCount > 0 ? avgSleepFormatted : '—'}
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] font-sans">Across logged entries</p>
          </div>

          {/* Stat 3: Avg Recovery Index */}
          <div className="space-y-1.5 sm:border-l sm:border-[var(--border-default)] sm:pl-4">
            <div className="flex items-center gap-1.5 text-xs font-sans text-[var(--text-secondary)]">
              <Award className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span className="uppercase tracking-wider font-medium text-[10px]">Avg Recovery Index</span>
            </div>
            <div className="text-base sm:text-lg font-sans font-semibold text-[var(--text-primary)] flex items-baseline gap-2">
              <span>{totalEntriesCount > 0 ? `${avgRecoveryScore}/50` : '—'}</span>
              {totalEntriesCount > 0 && (
                <span className="text-xs font-normal text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full">
                  {Math.round((avgRecoveryScore / 50) * 100)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] font-sans">Subjective recovery average</p>
          </div>

        </div>

      </div>

      {/* SIGN OUT WARNING CONFIRMATION MODAL */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl shadow-lg max-w-md w-full p-6 space-y-5 font-sans">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
                <h3 className="text-lg font-serif font-normal text-[var(--text-primary)]">Sign Out of SleepLab?</h3>
              </div>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to sign out of <strong className="text-[var(--text-primary)]">@{displayUsername}</strong>?
              Your study observations are safely saved to your account. You can log back in anytime.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans font-medium text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  if (onSignOut) onSignOut();
                }}
                className="px-4 py-2 bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white text-xs font-sans font-medium rounded-md transition-colors shadow-sm flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
