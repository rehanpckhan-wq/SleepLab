import React, { useState, useEffect } from 'react';
import { StudyConfig } from '@/types/sleeplab';
import { calculateEndDate } from '@/lib/storage';
import { Settings, Save, X, AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl shadow-lg max-w-lg w-full p-6 sm:p-8 space-y-6 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight">
              Research Protocol Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] rounded-md p-3 text-xs font-sans flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Study Title */}
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Study Protocol Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. October Sleep Optimization Study"
              className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
            <p className="text-[11px] font-sans text-[var(--text-tertiary)] mt-1">
              Main research title used on headers, reports, and PDF exports.
            </p>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Study Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>

          {/* Duration in Days & Presets */}
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
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
                className="w-28 px-3 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans font-semibold text-[var(--text-primary)] bg-[var(--surface-raised)]"
              />
              <span className="text-xs font-sans text-[var(--text-tertiary)]">days total</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDurationDays(d)}
                  className={`px-2.5 py-1 text-xs font-sans rounded-full border transition-colors ${
                    durationDays === d
                      ? 'bg-[var(--accent)] text-white border-transparent font-medium'
                      : 'bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* End Date Preview Card */}
          <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 text-xs font-sans space-y-1.5">
            <div className="flex justify-between items-center text-[var(--text-secondary)]">
              <span>Calculated Study Timeline:</span>
              <span className="text-[var(--text-primary)] font-semibold">{durationDays} Days</span>
            </div>
            <div className="flex justify-between items-center text-[var(--text-primary)] font-medium text-xs border-t border-[var(--border-default)] pt-1.5">
              <span>{startDate}</span>
              <span className="text-[var(--text-tertiary)]">→</span>
              <span>{calculatedEnd}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-default)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-sans text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-sans font-medium rounded-md transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
