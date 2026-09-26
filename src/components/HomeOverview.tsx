'use client';

import React from 'react';
import { StudyProtocol, DailyEntry } from '@/types/sleeplab';
import { calculateEndDate, getStudyStatus } from '@/lib/storage';
import {
  Calendar,
  Award,
  PlusCircle,
  FileText,
  ListFilter,
  Download,
  Clock,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';
import { ViewMode } from './Sidebar';

interface HomeOverviewProps {
  activeStudy: StudyProtocol;
  entries: DailyEntry[];
  currentDayNumber: number;
  avgSleepFormatted: string;
  avgRecoveryScore: number;
  onNavigate: (view: ViewMode) => void;
  onSelectReport: (entry: DailyEntry) => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  activeStudy,
  entries,
  currentDayNumber,
  avgSleepFormatted,
  avgRecoveryScore,
  onNavigate,
  onSelectReport,
}) => {
  const endDate = calculateEndDate(activeStudy.startDate, activeStudy.durationDays);
  const status = getStudyStatus(activeStudy.startDate, activeStudy.durationDays);
  const progressPct = Math.min(100, Math.round((entries.length / activeStudy.durationDays) * 100));

  const recentEntries = entries.slice(-3).reverse();

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Active Protocol Hero Header Banner */}
      <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
                Active Protocol
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">• {status}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)] tracking-tight">
              {activeStudy.title}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-2">
              <span>{activeStudy.startDate} → {endDate}</span>
              <span>•</span>
              <span>{activeStudy.durationDays}-Day Longitudinal N=1 Study</span>
            </p>
          </div>

          <button
            onClick={() => onNavigate('log')}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold rounded-xl transition-all shadow-md shrink-0 self-start sm:self-center cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Log Today (Day {currentDayNumber})
          </button>
        </div>

        {/* Study Progress Bar */}
        <div className="space-y-2 relative z-10 pt-2 border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Protocol Progress</span>
            <span className="font-bold text-[var(--accent)]">{progressPct}%</span>
          </div>
          <div className="w-full bg-[var(--border-default)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[var(--accent)] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3-Column Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] uppercase font-semibold">
            <span>Total Logged</span>
            <FlaskConical className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {entries.length} <span className="text-xs font-normal text-[var(--text-tertiary)]">/ {activeStudy.durationDays} days</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">Observations recorded</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] uppercase font-semibold">
            <span>Avg Sleep Duration</span>
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {entries.length > 0 ? avgSleepFormatted : '—'}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">Mean time asleep</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] uppercase font-semibold">
            <span>Avg Recovery Index</span>
            <Award className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] flex items-baseline gap-2">
            <span>{entries.length > 0 ? `${avgRecoveryScore}/50` : '—'}</span>
            {entries.length > 0 && (
              <span className="text-xs font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full">
                {Math.round((avgRecoveryScore / 50) * 100)}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">Subjective metric average</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif text-[var(--text-primary)]">Quick Workspaces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('log')}
            className="p-4 bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] hover:border-[var(--accent)]/50 rounded-xl text-left space-y-3 transition-all duration-200 group shadow-xs cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Log Observation
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Record sleep metrics & daily protocol parameters.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="p-4 bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] hover:border-[var(--accent)]/50 rounded-xl text-left space-y-3 transition-all duration-200 group shadow-xs cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Logs & Trends
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Explore trend charts and historical entries.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="p-4 bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] hover:border-[var(--accent)]/50 rounded-xl text-left space-y-3 transition-all duration-200 group shadow-xs cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Reports Catalog
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                View single-day report cards and detailed analysis.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('export')}
            className="p-4 bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] hover:border-[var(--accent)]/50 rounded-xl text-left space-y-3 transition-all duration-200 group shadow-xs cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Export Center
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Generate PDF summaries or download raw JSON.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Entries Strip */}
      {recentEntries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif text-[var(--text-primary)]">Recent Observations</h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onSelectReport(entry)}
                className="p-4 bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-xl cursor-pointer space-y-2 transition-colors shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">Day {entry.dayNumber}</span>
                  <span className="text-[var(--text-tertiary)]">{entry.date}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--text-tertiary)]" /> {entry.sleep?.estimatedSleepTime || 'N/A'} - {entry.sleep?.naturalWakeTime || 'N/A'}
                  </span>
                  <span className="font-semibold text-[var(--accent)]">
                    Score: {entry.calculatedMetrics?.recoveryIndexScore || 0}/50
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
