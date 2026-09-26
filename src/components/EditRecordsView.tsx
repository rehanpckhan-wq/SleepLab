'use client';

import React, { useState, useMemo } from 'react';
import { DailyEntry, StudyConfig } from '@/types/sleeplab';
import { Search, SquarePen, Calendar, ArrowRight, Clock } from 'lucide-react';

interface EditRecordsViewProps {
  entries: DailyEntry[];
  studyConfig: StudyConfig;
  onSelectEntryToEdit: (entry: DailyEntry) => void;
}

export const EditRecordsView: React.FC<EditRecordsViewProps> = ({
  entries,
  studyConfig,
  onSelectEntryToEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          e.date.includes(term) ||
          `day ${e.dayNumber}`.includes(term) ||
          e.evening?.notes?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.dayNumber - a.dayNumber);
  }, [entries, searchTerm]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-5">
        <div>
          <h1 className="text-2xl font-serif text-[var(--text-primary)]">Edit Log Records</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Select any previously recorded observation to edit metrics or update notes for {studyConfig.title}.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search record by date or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Entry Cards List */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-xl space-y-3">
          <SquarePen className="w-8 h-8 text-[var(--text-tertiary)] mx-auto" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">No Records Found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            {searchTerm
              ? 'No entry matched your search criteria.'
              : 'No entry logs available for editing yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntryToEdit(entry)}
              className="group cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] hover:border-[var(--accent)]/50 rounded-xl p-4 transition-all duration-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--surface-raised)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]">
                    Day {entry.dayNumber}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {entry.date}
                  </span>
                </div>

                <div className="text-xs text-[var(--text-secondary)] space-y-1">
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--text-tertiary)]" /> Sleep: {entry.sleep?.estimatedSleepTime || 'N/A'} — Wake: {entry.sleep?.naturalWakeTime || 'N/A'}
                  </p>
                  {entry.evening?.notes && (
                    <p className="line-clamp-2 italic text-[var(--text-tertiary)] pt-1">
                      "{entry.evening.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)] text-xs font-semibold text-[var(--accent)] group-hover:translate-x-0.5 transition-transform">
                <span className="flex items-center gap-1">
                  <SquarePen className="w-3.5 h-3.5" /> Edit Record
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
