'use client';

import React, { useState, useMemo } from 'react';
import { DailyEntry, StudyConfig } from '@/types/sleeplab';
import { Search, FileText, Calendar, Award, ArrowRight, FlaskConical } from 'lucide-react';

interface ReportsViewProps {
  entries: DailyEntry[];
  studyConfig: StudyConfig;
  onSelectReport: (entry: DailyEntry) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  entries,
  studyConfig,
  onSelectReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dayDesc' | 'dayAsc' | 'scoreDesc'>('dayDesc');

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase().trim();

        const matchDate = e.date.toLowerCase().includes(term);
        const matchDay = `day ${e.dayNumber}`.includes(term) || `${e.dayNumber}` === term;
        const matchReportId = e.reportId?.toLowerCase().includes(term) ?? false;
        const matchNotes = e.evening?.notes?.toLowerCase().includes(term) ?? false;
        const matchConfounders = e.confounders?.some((c) => c.toLowerCase().includes(term)) ?? false;
        const matchAwakenings = e.sleep?.awakeningReasons?.some((r) => r.toLowerCase().includes(term)) ?? false;

        let matchCustom = false;
        if (e.additionalMetrics) {
          matchCustom = Object.values(e.additionalMetrics).some(
            (val) => typeof val === 'string' && val.toLowerCase().includes(term)
          );
        }

        return matchDate || matchDay || matchReportId || matchNotes || matchConfounders || matchAwakenings || matchCustom;
      })
      .sort((a, b) => {
        if (sortBy === 'dayAsc') return a.dayNumber - b.dayNumber;
        if (sortBy === 'scoreDesc') {
          const scoreA = a.calculatedMetrics?.recoveryIndexScore || 0;
          const scoreB = b.calculatedMetrics?.recoveryIndexScore || 0;
          return scoreB - scoreA;
        }
        return b.dayNumber - a.dayNumber;
      });
  }, [entries, searchTerm, sortBy]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-5">
        <div>
          <h1 className="text-2xl font-serif text-[var(--text-primary)]">Reports Catalog</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Browse and inspect analytical daily report cards for {studyConfig.title}.
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by date, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="dayDesc">Latest Days First</option>
            <option value="dayAsc">Oldest Days First</option>
            <option value="scoreDesc">Highest Recovery Score</option>
          </select>
        </div>
      </div>

      {/* Reports Card Grid */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-xl space-y-3">
          <FileText className="w-8 h-8 text-[var(--text-tertiary)] mx-auto" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">No Reports Found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            {searchTerm
              ? 'No entry matched your search filter.'
              : 'You have not logged any observations yet. Start by logging today!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => {
            const formattedDuration = entry.calculatedMetrics?.totalSleepFormatted || '0h 0m';
            const recoveryScore = entry.calculatedMetrics?.recoveryIndexScore || 0;

            return (
              <div
                key={entry.id}
                onClick={() => onSelectReport(entry)}
                className="group cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] hover:border-[var(--accent)]/50 rounded-xl p-4 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold">
                      <FlaskConical className="w-3 h-3" /> Day {entry.dayNumber}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {entry.date}
                    </span>
                  </div>

                  {/* Sleep & Recovery Summary Pills */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[var(--surface-raised)] p-2 rounded-lg border border-[var(--border-default)]">
                      <p className="text-[10px] uppercase font-medium text-[var(--text-tertiary)]">Duration</p>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {formattedDuration}
                      </p>
                    </div>
                    <div className="bg-[var(--surface-raised)] p-2 rounded-lg border border-[var(--border-default)]">
                      <p className="text-[10px] uppercase font-medium text-[var(--text-tertiary)]">Recovery</p>
                      <p className="font-semibold text-[var(--accent)] flex items-center gap-1">
                        <Award className="w-3 h-3" /> {recoveryScore}/50
                      </p>
                    </div>
                  </div>

                  {/* Snippet / Notes Preview */}
                  {entry.evening?.notes && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 italic bg-[var(--canvas)] p-2 rounded-md border border-[var(--border-default)]">
                      "{entry.evening.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)] text-xs font-medium text-[var(--accent)] group-hover:translate-x-0.5 transition-transform">
                  <span>View Full Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
