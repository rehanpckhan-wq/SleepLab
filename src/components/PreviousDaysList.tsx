import React, { useState } from 'react';
import { DailyEntry } from '@/types/sleeplab';
import { StudyConfig } from '@/types/sleeplab';
import { deleteEntry, deleteEntryAsync, seedSampleData, generateReportId } from '@/lib/storage';
import { Calendar, Clock, Award, Edit3, Trash2, Database, ChevronRight, AlertTriangle, FileText, Printer } from 'lucide-react';

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
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded border border-paper-200 p-8 text-center space-y-4 my-6 shadow-sm">
        <div className="w-12 h-12 bg-paper-100 rounded-full flex items-center justify-center mx-auto text-academic-muted">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-bold text-paper-900">No Experiment Entries Yet</h3>
          <p className="text-sm font-sans text-academic-slate mt-1 max-w-md mx-auto">
            You haven&apos;t logged any daily observations yet. Log your first day to start accumulating your dataset.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onNewLogClick}
            className="px-5 py-2.5 bg-academic-navy text-white font-mono text-xs font-semibold rounded hover:bg-academic-slate transition-colors"
          >
            Log Day 1 Observations
          </button>
          <button
            onClick={handleSeedData}
            className="flex items-center gap-1.5 px-4 py-2 bg-paper-100 border border-paper-300 text-paper-900 font-mono text-xs rounded hover:bg-paper-200 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-academic-muted" /> Load Demo Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-paper-200 pb-3 gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-paper-900">Logged Experiment Days</h2>
          <p className="text-xs text-academic-muted mt-0.5">
            Click any entry to open its research-style daily report or edit raw data.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenExportDialog && (
            <button
              onClick={onOpenExportDialog}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-100 hover:bg-paper-200 border border-paper-300 text-academic-navy font-mono text-xs font-semibold rounded transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-academic-accent" /> Export Combined PDF
            </button>
          )}
          <span className="text-xs font-mono text-academic-muted bg-paper-100 px-2.5 py-1.5 rounded border border-paper-200 font-semibold">
            {entries.length} of {studyConfig?.durationDays || 30} Days Logged
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          const isDeletingThis = deleteConfirmId === entry.id;

          return (
            <div
              key={entry.id}
              onClick={() => onViewReport(entry)}
              className="bg-white border border-paper-200 hover:border-academic-navy rounded p-4 transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-academic-navy text-white rounded">
                      Day {entry.dayNumber}
                    </span>
                    <span className="font-serif font-bold text-base text-paper-900">
                      — {formatDateLabel(entry.date)}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-academic-slate bg-paper-100 border border-paper-300 px-2 py-0.5 rounded">
                      Report ID: {entry.reportId || generateReportId(entry.date, entry.dayNumber)}
                    </span>
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-academic-slate pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-academic-accent" />
                      <span>{entry.calculatedMetrics.totalSleepFormatted} sleep</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        Recovery <strong>{entry.calculatedMetrics.recoveryIndexScore}/50</strong> ({entry.calculatedMetrics.recoveryIndexPercentage}%)
                      </span>
                    </div>

                    {entry.confounders.length > 0 && (
                      <div className="text-[11px] text-academic-muted">
                        Confounders: {entry.confounders.slice(0, 2).join(', ')}
                        {entry.confounders.length > 2 && ` +${entry.confounders.length - 2}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-paper-100 justify-end">
                  {isDeletingThis ? (
                    <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded border border-rose-200">
                      <span className="text-[11px] font-mono text-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Delete?
                      </span>
                      <button
                        onClick={(e) => handleDelete(entry.id, e)}
                        className="px-2 py-0.5 bg-rose-700 text-white font-mono text-[10px] rounded hover:bg-rose-800"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className="px-2 py-0.5 bg-paper-200 text-paper-900 font-mono text-[10px] rounded hover:bg-paper-300"
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
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-academic-navy text-white hover:bg-academic-slate font-mono text-xs font-semibold rounded transition-colors shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Report
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntry(entry);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-paper-100 hover:bg-paper-200 border border-paper-300 text-paper-900 font-mono text-xs rounded transition-colors"
                        title="Edit raw entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(entry.id);
                        }}
                        className="p-1.5 text-academic-muted hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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
