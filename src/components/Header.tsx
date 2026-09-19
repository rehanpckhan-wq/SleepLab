import React from 'react';
import { FlaskConical, Calendar, Award } from 'lucide-react';

interface HeaderProps {
  currentDayNumber: number;
  totalEntriesCount: number;
  avgSleepFormatted: string;
  avgRecoveryScore: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDayNumber,
  totalEntriesCount,
  avgSleepFormatted,
  avgRecoveryScore,
}) => {
  return (
    <header className="border-b border-paper-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-1.5 rounded bg-academic-navy text-white text-xs font-mono font-semibold tracking-wider uppercase">
                <FlaskConical className="w-4 h-4 mr-1" /> Phase 1 Data Collection
              </span>
              <span className="text-xs font-mono text-academic-muted border-l border-paper-300 pl-2">
                N=1 Study
              </span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-paper-900 mt-2 tracking-tight">
              SleepLab
            </h1>
            <p className="text-sm font-sans text-academic-slate mt-1">
              30-Day Personal Sleep & Recovery Experiment
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-paper-50 border border-paper-300 rounded px-4 py-3 min-w-[240px]">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase font-mono tracking-wider text-academic-muted font-semibold">
                  Study Progress
                </div>
                <div className="text-xs font-mono font-bold text-academic-navy">
                  {Math.min(100, Math.round((totalEntriesCount / 30) * 100))}%
                </div>
              </div>
              <div className="text-xl font-mono font-bold text-academic-navy mt-0.5">
                {totalEntriesCount} <span className="text-sm font-normal text-academic-muted">/ 30 entries</span>
              </div>
              <div className="w-full bg-paper-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-academic-navy h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.round((totalEntriesCount / 30) * 100))}%` }}
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
