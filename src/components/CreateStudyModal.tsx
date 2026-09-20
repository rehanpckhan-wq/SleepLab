import React, { useState, useEffect } from 'react';
import { StudyProtocol } from '@/types/sleeplab';
import {
  saveStudyAsync,
  calculateEndDate,
  getLocalEntries,
  autoAttachEntriesToStudyAsync,
} from '@/lib/storage';
import { FlaskConical, Save, X, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';

interface CreateStudyModalProps {
  isOpen: boolean;
  userId?: string | null;
  onClose: () => void;
  onStudyCreated: (newStudy: StudyProtocol) => void;
}

export const CreateStudyModal: React.FC<CreateStudyModalProps> = ({
  isOpen,
  userId,
  onClose,
  onStudyCreated,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [durationDays, setDurationDays] = useState(30);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-attach prompt state
  const [overlappingCount, setOverlappingCount] = useState<number>(0);
  const [showAttachPrompt, setShowAttachPrompt] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDurationDays(30);
      setDescription('');
      setErrorMsg(null);
      setShowAttachPrompt(false);
      setOverlappingCount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const endDate = calculateEndDate(startDate, durationDays);

  const checkOverlappingEntries = () => {
    const entries = getLocalEntries();
    const matches = entries.filter((e) => e.date >= startDate && e.date <= endDate);
    return matches.length;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Study title cannot be empty.');
      return;
    }
    if (durationDays < 1) {
      setErrorMsg('Duration must be at least 1 day.');
      return;
    }

    const matches = checkOverlappingEntries();
    if (matches > 0 && !showAttachPrompt) {
      setOverlappingCount(matches);
      setShowAttachPrompt(true);
      return;
    }

    executeCreateStudy(false);
  };

  const executeCreateStudy = async (attachEntries: boolean) => {
    setSaving(true);
    setErrorMsg(null);

    const newStudyId = `study-${Date.now()}`;
    const newStudy: StudyProtocol = {
      id: newStudyId,
      title: title.trim(),
      startDate,
      durationDays,
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveStudyAsync(newStudy, userId);

      if (attachEntries) {
        await autoAttachEntriesToStudyAsync(newStudyId, startDate, endDate, userId);
      }

      onStudyCreated(newStudy);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create new study protocol.');
    } finally {
      setSaving(false);
    }
  };

  const PRESETS = [7, 14, 21, 30, 45, 60, 90];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans">
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl shadow-lg max-w-lg w-full p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight">
              Create New N=1 Study Protocol
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

        {showAttachPrompt ? (
          <div className="space-y-4 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg p-5">
            <div className="flex items-center gap-2 text-[var(--accent)] font-medium text-sm">
              <Layers className="w-5 h-5" />
              <span>Found Existing Observations ({overlappingCount} entries)</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              We detected <strong className="text-[var(--text-primary)]">{overlappingCount} existing daily entries</strong> recorded between {startDate} and {endDate}.
              Would you like to attach these entries to your new study <strong>&quot;{title}&quot;</strong>?
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => executeCreateStudy(false)}
                className="w-full sm:w-auto px-4 py-2 border border-[var(--border-default)] rounded-md text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
              >
                No, Start Fresh
              </button>
              <button
                type="button"
                onClick={() => executeCreateStudy(true)}
                className="w-full sm:w-auto px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium rounded-md transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Attach {overlappingCount} Entries & Create
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePreSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Study Title <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Magnesium Glycinate 400mg vs Sleep Quality"
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Start Date <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Duration (Days) <span className="text-[var(--danger)]">*</span>
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
                <span className="text-xs text-[var(--text-tertiary)]">days total</span>
              </div>

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

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Hypothesis / Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="State your N=1 hypothesis (e.g. Taking 400mg Magnesium 1h before bed increases recovery index)..."
                className="w-full p-3 border border-[var(--border-default)] rounded-md text-xs font-serif bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>

            {/* Calculated Timeline Box */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 text-xs font-sans space-y-1">
              <div className="flex justify-between items-center text-[var(--text-secondary)]">
                <span>Protocol Window:</span>
                <span className="text-[var(--text-primary)] font-medium">{durationDays} Days</span>
              </div>
              <div className="flex justify-between items-center text-[var(--text-primary)] font-medium text-xs border-t border-[var(--border-default)] pt-1.5">
                <span>{startDate}</span>
                <span className="text-[var(--text-tertiary)]">→</span>
                <span>{endDate}</span>
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
                <Save className="w-4 h-4" /> {saving ? 'Creating...' : 'Create Study Protocol'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
