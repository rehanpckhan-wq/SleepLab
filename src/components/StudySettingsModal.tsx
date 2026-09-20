import React, { useState, useEffect } from 'react';
import { StudyConfig } from '@/types/sleeplab';
import { calculateEndDate } from '@/lib/storage';
import { Settings, Calendar, Clock, Save, X, AlertTriangle } from 'lucide-react';

interface StudySettingsModalProps {
  isOpen: boolean;
  config: StudyConfig;
  onClose: () => void;
  onSave: (updatedConfig: StudyConfig) => Promise<void>;
}

export const StudySettingsModal: React.FC<StudySettingsModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(config.title);
  const [startDate, setStartDate] = useState(config.startDate);
  const [durationDays, setDurationDays] = useState(config.durationDays);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(config.title);
      setStartDate(config.startDate);
      setDurationDays(config.durationDays);
      setErrorMsg(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const calculatedEnd = calculateEndDate(startDate, durationDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Study title cannot be empty.');
      return;
    }
    if (durationDays < 1) {
      setErrorMsg('Study duration must be at least 1 day.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        ...config,
        title: title.trim(),
        startDate,
        durationDays,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update study configuration.');
    } finally {
      setSaving(false);
    }
  };

  const PRESETS = [7, 14, 21, 30, 45, 60, 90];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border-2 border-paper-300 rounded shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-paper-200 pb-4">
          <div className="flex items-center gap-2 text-academic-navy">
            <Settings className="w-5 h-5 text-academic-accent" />
            <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight">
              Research Protocol Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-academic-muted hover:text-paper-900 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded p-3 text-xs font-mono flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Study Title */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-academic-muted mb-1">
              Study Protocol Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. October Sleep Optimization Study"
              className="w-full px-3 py-2 border border-paper-300 rounded text-sm font-sans text-paper-900 focus:outline-none focus:border-academic-navy"
            />
            <p className="text-[11px] font-mono text-academic-muted mt-1">
              Main research title used on headers, reports, and PDF exports.
            </p>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-academic-muted mb-1">
              Study Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-paper-300 rounded text-sm font-mono text-paper-900 focus:outline-none focus:border-academic-navy"
            />
          </div>

          {/* Duration in Days & Presets */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-academic-muted mb-1">
              Study Duration (Days)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                max="365"
                required
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                className="w-28 px-3 py-2 border border-paper-300 rounded text-sm font-mono font-bold text-academic-navy focus:outline-none focus:border-academic-navy"
              />
              <span className="text-xs font-mono text-academic-muted">days total</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDurationDays(d)}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                    durationDays === d
                      ? 'bg-academic-navy text-white border-academic-navy font-bold'
                      : 'bg-paper-100 border-paper-300 text-academic-slate hover:bg-paper-200'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* End Date Preview Card */}
          <div className="bg-paper-50 border border-paper-300 rounded p-4 font-mono text-xs space-y-1.5">
            <div className="flex justify-between items-center text-academic-muted">
              <span>Calculated Study Timeline:</span>
              <span className="text-paper-900 font-bold">{durationDays} Days</span>
            </div>
            <div className="flex justify-between items-center text-academic-navy font-bold text-sm border-t border-paper-200 pt-1.5">
              <span>{startDate}</span>
              <span className="text-academic-muted font-normal text-xs">→</span>
              <span>{calculatedEnd}</span>
            </div>
          </div>

          {/* Caution Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-[11px] font-mono text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" /> Note on Protocol Changes
            </div>
            <p className="font-sans">
              Changing study duration or start date dynamically updates progress calculations and end dates. Existing Report IDs (`SL-YYYY-XXX`) and raw entries remain 100% preserved.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-paper-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-academic-slate hover:text-paper-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-academic-navy hover:bg-academic-slate text-white text-xs font-mono font-bold rounded transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving Protocol...' : 'Save Study Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
