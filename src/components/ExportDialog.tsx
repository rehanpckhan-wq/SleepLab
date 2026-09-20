import React, { useState } from 'react';
import { DailyEntry, StudyConfig } from '@/types/sleeplab';
import { Printer, X, FileText, Calendar, CheckCircle2, Layers } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border-2 border-paper-300 rounded shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 font-sans">
        <div className="flex items-center justify-between border-b border-paper-200 pb-4">
          <div className="flex items-center gap-2 text-academic-navy">
            <Printer className="w-5 h-5 text-academic-accent" />
            <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight">
              Export Research Report (PDF)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-academic-muted hover:text-paper-900 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-sans text-academic-slate">
            Select the scope of daily observation reports to compile into your PDF document:
          </p>

          <div className="space-y-3 font-mono text-xs">
            {/* Option 1: All Completed Days */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded border transition-colors cursor-pointer ${
                scope === 'all'
                  ? 'bg-paper-50 border-academic-navy text-academic-navy font-semibold'
                  : 'bg-white border-paper-300 text-paper-900 hover:bg-paper-50'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
                className="mt-0.5 accent-academic-navy"
              />
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-academic-accent" /> All Completed Study Days (Days 1–{maxLoggedDay})
                </div>
                <div className="text-[11px] font-sans text-academic-slate">
                  Compiles every recorded observation day into a multi-page research report with study cover page.
                </div>
              </div>
            </label>

            {/* Option 2: Current Selected Day */}
            {selectedEntry && (
              <label
                className={`flex items-start gap-3 p-3.5 rounded border transition-colors cursor-pointer ${
                  scope === 'current'
                    ? 'bg-paper-50 border-academic-navy text-academic-navy font-semibold'
                    : 'bg-white border-paper-300 text-paper-900 hover:bg-paper-50'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === 'current'}
                  onChange={() => setScope('current')}
                  className="mt-0.5 accent-academic-navy"
                />
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-academic-accent" /> Current Day Only (Day {selectedEntry.dayNumber})
                  </div>
                  <div className="text-[11px] font-sans text-academic-slate">
                    Exports only Day {selectedEntry.dayNumber} ({selectedEntry.date}) report.
                  </div>
                </div>
              </label>
            )}

            {/* Option 3: Custom Day Range */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded border transition-colors cursor-pointer ${
                scope === 'range'
                  ? 'bg-paper-50 border-academic-navy text-academic-navy font-semibold'
                  : 'bg-white border-paper-300 text-paper-900 hover:bg-paper-50'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                checked={scope === 'range'}
                onChange={() => setScope('range')}
                className="mt-0.5 accent-academic-navy"
              />
              <div className="space-y-2 w-full">
                <div className="font-bold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-academic-accent" /> Custom Day Range
                </div>

                {scope === 'range' && (
                  <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <span>From Day</span>
                    <input
                      type="number"
                      min="1"
                      max={maxLoggedDay}
                      value={fromDay}
                      onChange={(e) => setFromDay(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1 border border-paper-300 rounded font-bold text-center bg-white"
                    />
                    <span>to Day</span>
                    <input
                      type="number"
                      min={fromDay}
                      max={maxLoggedDay}
                      value={toDay}
                      onChange={(e) => setToDay(Math.min(maxLoggedDay, parseInt(e.target.value) || fromDay))}
                      className="w-16 px-2 py-1 border border-paper-300 rounded font-bold text-center bg-white"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-paper-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-academic-slate hover:text-paper-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTriggerExport}
            className="px-5 py-2 bg-academic-navy hover:bg-academic-slate text-white text-xs font-mono font-bold rounded transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-300" /> Generate & Print PDF
          </button>
        </div>
      </div>
    </div>
  );
};
