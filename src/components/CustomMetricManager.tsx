import React, { useState } from 'react';
import { CustomMetricDefinition } from '@/types/sleeplab';
import {
  getCustomMetricDefinitions,
  fetchCustomMetricDefinitionsAsync,
  archiveCustomMetricAsync,
  restoreCustomMetricAsync,
  reorderCustomMetricsAsync,
  deleteCustomMetricDefinitionAsync,
} from '@/lib/storage';
import { Settings, ArrowUp, ArrowDown, Edit2, Archive, RotateCcw, Plus, X, Trash2, ShieldAlert } from 'lucide-react';

interface CustomMetricManagerProps {
  userId?: string | null;
  onClose: () => void;
  onEditMetric: (metric: CustomMetricDefinition) => void;
  onCreateNewMetric: () => void;
  onMetricsUpdated: () => void;
}

export const CustomMetricManager: React.FC<CustomMetricManagerProps> = ({
  userId,
  onClose,
  onEditMetric,
  onCreateNewMetric,
  onMetricsUpdated,
}) => {
  const [metrics, setMetrics] = useState<CustomMetricDefinition[]>(getCustomMetricDefinitions());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const activeMetrics = metrics.filter((m) => m.active !== false);
  const archivedMetrics = metrics.filter((m) => m.active === false);

  const refreshList = async () => {
    const updated = await fetchCustomMetricDefinitionsAsync(userId);
    setMetrics(updated);
    onMetricsUpdated();
  };

  const handleArchive = async (id: string) => {
    setIsProcessing(true);
    await archiveCustomMetricAsync(id, userId);
    await refreshList();
    setIsProcessing(false);
  };

  const handleRestore = async (id: string) => {
    setIsProcessing(true);
    await restoreCustomMetricAsync(id, userId);
    await refreshList();
    setIsProcessing(false);
  };

  const handleDelete = async (id: string) => {
    setIsProcessing(true);
    await deleteCustomMetricDefinitionAsync(id, userId);
    setDeleteConfirmId(null);
    await refreshList();
    setIsProcessing(false);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeMetrics.length) return;

    setIsProcessing(true);
    const newActiveList = [...activeMetrics];
    const [moved] = newActiveList.splice(index, 1);
    newActiveList.splice(targetIndex, 0, moved);

    const orderedIds = [...newActiveList.map((m) => m.id), ...archivedMetrics.map((m) => m.id)];
    await reorderCustomMetricsAsync(orderedIds, userId);
    await refreshList();
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-default)] max-w-xl w-full p-6 space-y-5 shadow-lg font-sans max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="text-lg font-serif font-normal text-[var(--text-primary)]">Manage Custom Metrics</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable Container */}
        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
          {/* Active Metrics Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-primary)]">
                Active Tracking Metrics ({activeMetrics.length})
              </span>
              <button
                onClick={onCreateNewMetric}
                className="flex items-center gap-1 text-xs font-sans font-medium text-[var(--accent)] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Metric
              </button>
            </div>

            {activeMetrics.length === 0 ? (
              <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md text-xs font-sans text-[var(--text-tertiary)] italic">
                No active custom metrics. Click + Add Metric to create your first variable.
              </div>
            ) : (
              <div className="space-y-2">
                {activeMetrics.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-3 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md flex items-center justify-between gap-3 hover:border-[var(--border-strong)] transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-[var(--text-primary)] truncate">{m.name}</span>
                        <span className="text-[10px] font-sans px-2 py-0.5 bg-[var(--surface)] border border-[var(--border-default)] rounded-full text-[var(--text-secondary)] uppercase">
                          {m.type}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-[var(--text-tertiary)] truncate">{m.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-[var(--text-secondary)] hover:bg-[var(--border-default)] rounded-md disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === activeMetrics.length - 1}
                        className="p-1 text-[var(--text-secondary)] hover:bg-[var(--border-default)] rounded-md disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEditMetric(m)}
                        className="p-1 text-[var(--accent)] hover:bg-[var(--border-default)] rounded-md ml-1"
                        title="Edit metric"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleArchive(m.id)}
                        className="p-1 text-[var(--warning)] hover:bg-[var(--warning-soft)] rounded-md"
                        title="Archive metric"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Archived Metrics Section */}
          {archivedMetrics.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[var(--border-default)]">
              <div>
                <span className="text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] block">
                  Archived Metrics ({archivedMetrics.length})
                </span>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  Archived metrics no longer appear on daily logging forms, but past reports remain intact.
                </p>
              </div>

              <div className="space-y-2">
                {archivedMetrics.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md flex items-center justify-between gap-3 opacity-75"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-[var(--text-primary)]">{m.name}</span>
                        <span className="text-[10px] font-sans px-2 py-0.5 bg-[var(--surface)] rounded-full text-[var(--text-tertiary)] uppercase">
                          Archived
                        </span>
                      </div>
                      {m.description && <p className="text-xs text-[var(--text-tertiary)]">{m.description}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      {deleteConfirmId === m.id ? (
                        <div className="flex items-center gap-1.5 bg-[var(--danger-soft)] p-1 rounded-md border border-[var(--danger)]/30 text-xs">
                          <span className="text-[10px] font-sans text-[var(--danger)] flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Delete template?
                          </span>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="px-2 py-0.5 bg-[var(--danger)] text-white font-sans text-[10px] rounded"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-0.5 bg-[var(--surface)] text-[var(--text-primary)] font-sans text-[10px] rounded border border-[var(--border-default)]"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(m.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[var(--accent)] text-white text-xs font-sans rounded-md hover:bg-[var(--accent-hover)]"
                            title="Restore metric to active tracking"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(m.id)}
                            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--danger)] rounded-md"
                            title="Permanently delete metric template definition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-[var(--border-default)] flex-shrink-0">
          <button
            onClick={onCreateNewMetric}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] font-sans text-xs font-medium rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--accent)]" /> Create Custom Metric
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[var(--accent)] text-white text-xs font-sans font-medium rounded-md hover:bg-[var(--accent-hover)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
