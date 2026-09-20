import React from 'react';
import { StudyConfig, StudyStatus } from '@/types/sleeplab';
import { calculateEndDate, getStudyStatus } from '@/lib/storage';
import { InstallPWA } from './InstallPWA';
import { FlaskConical, Calendar, Award, Cloud, User, LogOut, Settings, Clock, CheckCircle2 } from 'lucide-react';

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

  return (
    <header className="border-b border-paper-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center p-1.5 rounded bg-academic-navy text-white text-xs font-mono font-semibold tracking-wider uppercase">
                <FlaskConical className="w-4 h-4 mr-1" /> SleepLab Research Notebook
              </span>

              {/* Status Badge */}
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  status === 'Active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : status === 'Upcoming'
                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                    : 'bg-paper-100 text-paper-800 border-paper-300'
                }`}
              >
                ● {status}
              </span>

              {/* Supabase Sync Badge */}
              {displayUsername ? (
                <div className="flex items-center gap-1.5 border-l border-paper-300 pl-2 text-xs font-mono text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>@{displayUsername}</span>
                  <button
                    onClick={onSignOut}
                    title="Sign Out"
                    className="ml-1 text-academic-muted hover:text-rose-700"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1 text-xs font-mono text-academic-navy hover:text-academic-slate bg-paper-100 hover:bg-paper-200 px-2.5 py-0.5 rounded border border-paper-300 transition-colors ml-1 font-semibold"
                >
                  <User className="w-3.5 h-3.5 text-academic-accent" /> Sign In / Sync
                </button>
              )}

              {/* PWA Home Screen Install Button */}
              <div className="border-l border-paper-300 pl-2">
                <InstallPWA />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-paper-900 tracking-tight">
                {studyConfig.title}
              </h1>
              {onOpenStudySettings && (
                <button
                  onClick={onOpenStudySettings}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-academic-slate hover:text-academic-navy hover:bg-paper-100 rounded border border-paper-300 transition-colors"
                  title="Configure Study Protocol Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-academic-accent" /> Protocol Settings
                </button>
              )}
            </div>

            {/* Study Overview Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-academic-slate mt-1.5">
              <span>Start: <strong className="text-paper-900">{studyConfig.startDate}</strong></span>
              <span>End: <strong className="text-paper-900">{endDate}</strong></span>
              <span>Duration: <strong className="text-academic-navy">{studyConfig.durationDays} Days</strong></span>
            </div>
          </div>

          {/* Study Progress Overview Card */}
          <div className="flex items-center gap-3">
            <div className="bg-paper-50 border border-paper-300 rounded px-4 py-3 min-w-[240px]">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase font-mono tracking-wider text-academic-muted font-semibold">
                  Study Progress
                </div>
                <div className="text-xs font-mono font-bold text-academic-navy">
                  {progressPct}%
                </div>
              </div>
              <div className="text-xl font-mono font-bold text-academic-navy mt-0.5">
                {totalEntriesCount} <span className="text-sm font-normal text-academic-muted">/ {studyConfig.durationDays} entries</span>
              </div>
              <div className="w-full bg-paper-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-academic-navy h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {totalEntriesCount > 0 && (
          <div className="mt-4 pt-3 border-t border-paper-100 flex flex-wrap gap-6 text-xs font-mono text-academic-slate">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-academic-muted" />
              <span>Avg Duration: <strong className="text-paper-900">{avgSleepFormatted}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-academic-muted" />
              <span>Avg Recovery Index: <strong className="text-paper-900">{avgRecoveryScore}/50</strong> ({Math.round((avgRecoveryScore / 50) * 100)}%)</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
