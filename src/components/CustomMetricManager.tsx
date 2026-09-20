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
import { Settings, ArrowUp, ArrowDown, Edit2, Archive, RotateCcw, Plus, X, Trash2, ShieldAlert, Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-paper-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-paper-300 max-w-xl w-full p-6 space-y-5 shadow-xl font-sans max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-paper-200 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-academic-navy" />
            <h3 className="text-lg font-serif font-bold text-paper-900">Manage Custom Metrics</h3>
          </div>
          <button onClick={onClose} className="p-1 text-academic-muted hover:text-paper-900 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable Container */}
        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
          {/* Active Metrics Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-academic-navy">
                Active Tracking Metrics ({activeMetrics.length})
              </span>
              <button
                onClick={onCreateNewMetric}
                className="flex items-center gap-1 text-xs font-mono font-semibold text-academic-accent hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Metric
              </button>
            </div>

            {activeMetrics.length === 0 ? (
              <div className="p-4 bg-paper-50 border border-paper-200 rounded text-xs font-mono text-academic-muted italic">
                No active custom metrics. Click + Add Metric to create your first variable.
              </div>
            ) : (
              <div className="space-y-2">
                {activeMetrics.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-3 bg-white border border-paper-200 rounded flex items-center justify-between gap-3 hover:border-paper-300 transition-colors shadow-sm"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-paper-900 truncate">{m.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-paper-100 border border-paper-200 rounded text-academic-slate uppercase">
                          {m.type}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-academic-muted truncate">{m.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-academic-slate hover:bg-paper-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === activeMetrics.length - 1}
                        className="p-1 text-academic-slate hover:bg-paper-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEditMetric(m)}
                        className="p-1 text-academic-accent hover:bg-paper-100 rounded ml-1"
                        title="Edit metric"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleArchive(m.id)}
                        className="p-1 text-amber-700 hover:bg-amber-50 rounded"
                        title="Archive metric (removes from future forms, preserves historical data)"
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
            <div className="space-y-3 pt-3 border-t border-paper-200">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-academic-muted block">
                  Archived Metrics ({archivedMetrics.length})
                </span>
                <p className="text-[11px] text-academic-muted mt-0.5">
                  Archived metrics no longer appear on daily logging forms, but their past historical reports remain intact.
                </p>
              </div>

              <div className="space-y-2">
                {archivedMetrics.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-paper-50 border border-paper-200 rounded flex items-center justify-between gap-3 opacity-75"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-paper-900">{m.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-paper-200 rounded text-academic-slate uppercase">
                          Archived
                        </span>
                      </div>
                      {m.description && <p className="text-xs text-academic-muted">{m.description}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      {deleteConfirmId === m.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded border border-rose-200 text-xs">
                          <span className="text-[10px] font-mono text-rose-800 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Delete template?
                          </span>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="px-2 py-0.5 bg-rose-700 text-white font-mono text-[10px] rounded hover:bg-rose-800"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-0.5 bg-paper-200 text-paper-900 font-mono text-[10px] rounded"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(m.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-academic-navy text-white text-xs font-mono rounded hover:bg-academic-slate"
                            title="Restore metric to active tracking"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(m.id)}
                            className="p-1 text-academic-muted hover:text-rose-600 rounded"
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
        <div className="flex justify-between items-center pt-3 border-t border-paper-200 flex-shrink-0">
          <button
            onClick={onCreateNewMetric}
            className="flex items-center gap-1.5 px-4 py-2 bg-paper-100 hover:bg-paper-200 border border-paper-300 text-paper-900 font-mono text-xs rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Custom Metric
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-academic-navy text-white text-xs font-mono font-semibold rounded hover:bg-academic-slate transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
