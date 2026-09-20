import React, { useState } from 'react';
import { DailyEntry } from '@/types/sleeplab';
import { StudyConfig } from '@/types/sleeplab';
import { deleteEntryAsync, seedSampleData, generateReportId } from '@/lib/storage';
import { Calendar, Clock, Award, Edit3, Trash2, Database, AlertTriangle, FileText, Printer } from 'lucide-react';

interface PreviousDaysListProps {
  entries: DailyEntry[];
  userId?: string | null;
  studyConfig?: StudyConfig;
  onSelectEntry: (entry: DailyEntry) => void;
  onViewReport: (entry: DailyEntry) => void;
  onEntriesChanged: () => void;
  onNewLogClick: () => void;
  onOpenExportDialog?: () => void;
}

export const PreviousDaysList: React.FC<PreviousDaysListProps> = ({
  entries,
  userId,
  studyConfig,
  onSelectEntry,
  onViewReport,
  onEntriesChanged,
  onNewLogClick,
  onOpenExportDialog,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteEntryAsync(id, userId);
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
    setDeleteConfirmId(null);
    onEntriesChanged();
  };

  const handleSeedData = () => {
    seedSampleData();
    onEntriesChanged();
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (entries.length === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-8 text-center space-y-4 my-6 shadow-sm">
        <div className="w-12 h-12 bg-[var(--surface-raised)] rounded-full flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-normal text-[var(--text-primary)]">No Experiment Entries Yet</h3>
          <p className="text-xs font-sans text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
            You haven&apos;t logged any daily observations yet. Log your first day to start accumulating your dataset.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onNewLogClick}
            className="px-5 py-2 bg-[var(--accent)] text-white font-sans text-xs font-medium rounded-md hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            Log Day 1 Observations
          </button>
          <button
            onClick={handleSeedData}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-primary)] font-sans text-xs rounded-md hover:bg-[var(--border-default)] transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-[var(--text-tertiary)]" /> Load Demo Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-default)] pb-4 gap-3">
        <div>
          <h2 className="text-xl font-serif font-normal text-[var(--text-primary)]">Logged Experiment Days</h2>
          <p className="text-xs font-sans text-[var(--text-secondary)] mt-0.5">
            Click any entry to view its research report or edit observations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenExportDialog && (
            <button
              onClick={onOpenExportDialog}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] font-sans text-xs font-medium rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--accent)]" /> Export Combined PDF
            </button>
          )}
          <span className="text-xs font-sans text-[var(--text-secondary)] bg-[var(--surface-raised)] px-2.5 py-1.5 rounded-full border border-[var(--border-default)]">
            {entries.length} of {studyConfig?.durationDays || 30} Days Logged
          </span>
        </div>
      </div>

      {/* Ledger Journal Row Layout */}
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg divide-y divide-[var(--border-default)] overflow-hidden">
        {entries.map((entry) => {
          const isDeletingThis = deleteConfirmId === entry.id;

          return (
            <div
              key={entry.id}
              onClick={() => onViewReport(entry)}
              className="p-4 hover:bg-[var(--surface-raised)] transition-colors cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-sans text-xs font-medium px-2 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
                      Day {entry.dayNumber}
                    </span>
                    <span className="font-sans font-medium text-xs text-[var(--text-primary)]">
                      {formatDateLabel(entry.date)}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                      ID: {entry.reportId || generateReportId(entry.date, entry.dayNumber)}
                    </span>
                  </div>

                  {/* Notes / Narrative excerpt */}
                  {entry.evening.notes ? (
                    <p className="font-serif text-xs text-[var(--text-secondary)] line-clamp-1 italic pt-0.5">
                      &quot;{entry.evening.notes}&quot;
                    </p>
                  ) : null}

                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-[var(--text-secondary)] pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      <span>{entry.calculatedMetrics.totalSleepFormatted} sleep</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>
                        Recovery Index: <strong className="text-[var(--text-primary)] font-medium">{entry.calculatedMetrics.recoveryIndexScore}/50</strong> ({entry.calculatedMetrics.recoveryIndexPercentage}%)
                      </span>
                    </div>

                    {entry.confounders.length > 0 && (
                      <div className="text-[11px] text-[var(--text-tertiary)]">
                        Confounders: {entry.confounders.slice(0, 2).join(', ')}
                        {entry.confounders.length > 2 && ` +${entry.confounders.length - 2}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 justify-end">
                  {isDeletingThis ? (
                    <div className="flex items-center gap-2 bg-[var(--danger-soft)] p-1.5 rounded-md border border-[var(--danger)]/30">
                      <span className="text-xs font-sans text-[var(--danger)] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Delete?
                      </span>
                      <button
                        onClick={(e) => handleDelete(entry.id, e)}
                        className="px-2.5 py-0.5 bg-[var(--danger)] text-white font-sans text-xs rounded-md hover:bg-[var(--danger)]/90"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className="px-2.5 py-0.5 bg-[var(--surface)] text-[var(--text-primary)] font-sans text-xs rounded-md border border-[var(--border-default)]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewReport(entry);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] text-[var(--text-primary)] font-sans text-xs font-medium rounded-md border border-[var(--border-default)] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[var(--accent)]" /> View Report
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntry(entry);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-sans text-xs rounded-md border border-[var(--border-default)] transition-colors"
                        title="Edit raw entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(entry.id);
                        }}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-md transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
