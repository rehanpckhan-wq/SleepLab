import React, { useState } from 'react';
import { DailyEntry, StudyConfig } from '@/types/sleeplab';
import { Printer, X, FileText, Calendar, Layers } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  entries: DailyEntry[];
  studyConfig: StudyConfig;
  selectedEntry?: DailyEntry | null;
  onClose: () => void;
  onExport: (scope: 'current' | 'all' | 'range', fromDay?: number, toDay?: number) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  entries,
  studyConfig,
  selectedEntry,
  onClose,
  onExport,
}) => {
  const [scope, setScope] = useState<'current' | 'all' | 'range'>('all');
  const [fromDay, setFromDay] = useState<number>(1);
  const [toDay, setToDay] = useState<number>(entries.length > 0 ? Math.max(...entries.map((e) => e.dayNumber)) : 1);

  if (!isOpen) return null;

  const maxLoggedDay = entries.length > 0 ? Math.max(...entries.map((e) => e.dayNumber)) : 1;

  const handleTriggerExport = () => {
    onExport(scope, fromDay, toDay);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl shadow-lg max-w-lg w-full p-6 sm:p-8 space-y-6 font-sans">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight">
              Export Research Report (PDF)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-sans text-[var(--text-secondary)]">
            Select the scope of daily observation reports to compile into your PDF document:
          </p>

          <div className="space-y-3 font-sans text-xs">
            {/* Option 1: All Completed Days */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors cursor-pointer ${
                scope === 'all'
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]'
                  : 'bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <div className="space-y-0.5">
                <div className="font-medium flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> All Completed Study Days (Days 1–{maxLoggedDay})
                </div>
                <div className="text-[11px] font-sans text-[var(--text-secondary)]">
                  Compiles every recorded observation day into a multi-page research report with study cover page.
                </div>
              </div>
            </label>

            {/* Option 2: Current Selected Day */}
            {selectedEntry && (
              <label
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors cursor-pointer ${
                  scope === 'current'
                    ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]'
                    : 'bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === 'current'}
                  onChange={() => setScope('current')}
                  className="mt-0.5 accent-[var(--accent)]"
                />
                <div className="space-y-0.5">
                  <div className="font-medium flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Current Day Only (Day {selectedEntry.dayNumber})
                  </div>
                  <div className="text-[11px] font-sans text-[var(--text-secondary)]">
                    Exports only Day {selectedEntry.dayNumber} ({selectedEntry.date}) report.
                  </div>
                </div>
              </label>
            )}

            {/* Option 3: Custom Day Range */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors cursor-pointer ${
                scope === 'range'
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]'
                  : 'bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                checked={scope === 'range'}
                onChange={() => setScope('range')}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <div className="space-y-2 w-full">
                <div className="font-medium flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Custom Day Range
                </div>

                {scope === 'range' && (
                  <div className="flex items-center gap-2 pt-1 font-sans text-xs">
                    <span>From Day</span>
                    <input
                      type="number"
                      min="1"
                      max={maxLoggedDay}
                      value={fromDay}
                      onChange={(e) => setFromDay(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1 border border-[var(--border-default)] rounded-md font-medium text-center bg-[var(--surface)] text-[var(--text-primary)]"
                    />
                    <span>to Day</span>
                    <input
                      type="number"
                      min={fromDay}
                      max={maxLoggedDay}
                      value={toDay}
                      onChange={(e) => setToDay(Math.min(maxLoggedDay, parseInt(e.target.value) || fromDay))}
                      className="w-16 px-2 py-1 border border-[var(--border-default)] rounded-md font-medium text-center bg-[var(--surface)] text-[var(--text-primary)]"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-sans text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTriggerExport}
            className="px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-sans font-medium rounded-md transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Generate PDF Report
          </button>
        </div>
      </div>
    </div>
  );
};
