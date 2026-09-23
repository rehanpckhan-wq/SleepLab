'use client';

import React, { useState } from 'react';
import {
  StudyProtocol,
  StudySchema,
  StudyCategory,
  StudyMetric,
  MetricInputType,
  DependentRule,
} from '@/types/sleeplab';
import { getDefaultStudySchema } from '@/lib/defaultSchema';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  Settings,
  Lock,
  MoveUp,
  MoveDown,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
  RotateCcw,
  AlertTriangle,
  GitFork,
  Zap,
  Award,
  Copy,
  Download,
  Upload,
  Check,
  Share2,
  FileCode2,
  PackageCheck,
  Pencil,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface ProtocolSchemaEditorModalProps {
  isOpen: boolean;
  study: StudyProtocol;
  onClose: () => void;
  onSaveSchema: (updatedSchema: StudySchema) => Promise<void>;
}

// Helpers for Protocol Code Encoding/Decoding
function encodeProtocolPreset(schemaObj: StudySchema): string {
  try {
    const jsonStr = JSON.stringify(schemaObj);
    const encodedStr = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return `SLPROTO-${btoa(encodedStr)}`;
  } catch (err) {
    console.error('Failed to encode protocol preset:', err);
    return '';
  }
}

function decodeProtocolPreset(presetCode: string): StudySchema {
  let raw = presetCode.trim();
  if (raw.startsWith('SLPROTO-')) {
    raw = raw.replace('SLPROTO-', '');
  }

  let jsonStr = '';
  if (raw.startsWith('{')) {
    jsonStr = raw;
  } else {
    const decodedStr = atob(raw);
    jsonStr = decodeURIComponent(
      decodedStr
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }

  const parsed = JSON.parse(jsonStr) as StudySchema;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.categories) || !Array.isArray(parsed.metrics)) {
    throw new Error('Invalid Protocol Code. Format must contain categories and metrics.');
  }

  // Filter out removed legacy metrics
  parsed.metrics = (parsed.metrics || []).filter(
    (m) => m.id !== 'alarmWake' && m.id !== 'numberOfAwakenings'
  );

  if (!parsed.recoveryIndexMetricIds) {
    parsed.recoveryIndexMetricIds = parsed.metrics
      .filter((m) => m.type === 'slider' && m.active !== false)
      .slice(0, 5)
      .map((m) => m.id);
  }

  return parsed;
}


export const ProtocolSchemaEditorModal: React.FC<ProtocolSchemaEditorModalProps> = ({
  isOpen,
  study,
  onClose,
  onSaveSchema,
}) => {
  const initialSchema: StudySchema = study.schema || getDefaultStudySchema();

  const [schema, setSchema] = useState<StudySchema>(initialSchema);
  const [activeTab, setActiveTab] = useState<'categories' | 'recoveryIndex' | 'codeSharing'>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialSchema.categories[0]?.id || 'cat-sleep'
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preset Import/Export state
  const [importInput, setImportInput] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // New Category form state
  const [newCatName, setNewCatName] = useState('');

  // New Metric form state
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricType, setNewMetricType] = useState<MetricInputType | 'tags' | 'select_one'>('slider');
  const [newMetricMin, setNewMetricMin] = useState(1);
  const [newMetricMax, setNewMetricMax] = useState(10);
  const [newMetricUnit, setNewMetricUnit] = useState('');
  const [newMetricOptions, setNewMetricOptions] = useState('Option 1, Option 2');
  const [isAddingMetric, setIsAddingMetric] = useState(false);

  // Trigger Rule Builder modal/form state
  const [addingRuleParentId, setAddingRuleParentId] = useState<string | null>(null);
  const [ruleCondition, setRuleCondition] = useState<'equals' | 'greaterThan' | 'lessThan' | 'isTrue' | 'isFalse' | 'contains'>('equals');
  const [ruleTargetValue, setRuleTargetValue] = useState<string>('0');
  const [ruleSubMetricName, setRuleSubMetricName] = useState('');
  const [ruleSubMetricType, setRuleSubMetricType] = useState<MetricInputType | 'tags' | 'select_one'>('tags');
  const [ruleSubMetricOptions, setRuleSubMetricOptions] = useState<string>('Option 1, Option 2');
  const [editingRuleInfo, setEditingRuleInfo] = useState<{ parentMetricId: string; ruleId: string } | null>(null);

  // Custom Confirm Modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const raw = study.schema || getDefaultStudySchema();
      const cleanedSchema: StudySchema = {
        ...raw,
        metrics: (raw.metrics || []).filter(
          (m) => m.id !== 'alarmWake' && m.id !== 'numberOfAwakenings'
        ),
      };
      setSchema(cleanedSchema);
      if (!cleanedSchema.categories.some((c) => c.id === selectedCategoryId)) {
        setSelectedCategoryId(cleanedSchema.categories[0]?.id || 'cat-sleep');
      }
    }
  }, [isOpen, study.schema]);

  if (!isOpen) return null;

  const currentCategory = schema.categories.find((c) => c.id === selectedCategoryId);
  const currentCategoryMetrics = schema.metrics
    .filter((m) => m.categoryId === selectedCategoryId)
    .sort((a, b) => a.order - b.order);

  // All slider metrics across the entire schema for Recovery Index Configurator
  const allSliderMetrics = schema.metrics.filter((m) => m.type === 'slider' && m.active !== false);

  /* ========================================================================= */
  /* CATEGORY HANDLERS                                                         */
  /* ========================================================================= */

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCatId = `cat-custom-${Date.now()}`;
    const newCategory: StudyCategory = {
      id: newCatId,
      name: newCatName.trim(),
      order: schema.categories.length + 1,
      isSystemLocked: false,
    };
    setSchema((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
    setNewCatName('');
    setSelectedCategoryId(newCatId);
  };

  const handleRenameCategory = (catId: string, name: string) => {
    setSchema((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === catId ? { ...c, name } : c)),
    }));
  };

  const handleDeleteCategory = (catId: string) => {
    const cat = schema.categories.find((c) => c.id === catId);
    if (cat?.isSystemLocked) {
      setConfirmDialog({
        title: 'System Locked Category',
        message: 'The Sleep Parameters category is system-locked for sleep research and cannot be deleted.',
        confirmText: 'Understood',
        variant: 'info',
        onConfirm: () => setConfirmDialog(null),
      });
      return;
    }

    setConfirmDialog({
      title: `Delete Category "${cat?.name}"?`,
      message: `Are you sure you want to delete "${cat?.name}" and all metrics inside it? This action cannot be undone.`,
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        const updatedCategories = schema.categories.filter((c) => c.id !== catId);
        const updatedMetrics = schema.metrics.filter((m) => m.categoryId !== catId);
        const updatedRecoveryIds = schema.recoveryIndexMetricIds.filter(
          (id) => !schema.metrics.some((m) => m.id === id && m.categoryId === catId)
        );

        setSchema({
          categories: updatedCategories,
          metrics: updatedMetrics,
          recoveryIndexMetricIds: updatedRecoveryIds,
        });

        if (selectedCategoryId === catId) {
          setSelectedCategoryId(updatedCategories[0]?.id || '');
        }
        setConfirmDialog(null);
      },
    });
  };

  const handleMoveCategory = (catId: string, direction: 'up' | 'down') => {
    const index = schema.categories.findIndex((c) => c.id === catId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= schema.categories.length) return;

    const newCategories = [...schema.categories];
    const [moved] = newCategories.splice(index, 1);
    newCategories.splice(targetIndex, 0, moved);

    const reordered = newCategories.map((c, idx) => ({ ...c, order: idx + 1 }));
    setSchema((prev) => ({ ...prev, categories: reordered }));
  };

  /* ========================================================================= */
  /* METRIC HANDLERS                                                           */
  /* ========================================================================= */

  const handleAddMetric = () => {
    if (!newMetricName.trim() || !selectedCategoryId) return;
    const newMetricId = `m-${Date.now()}`;
    const newMetric: StudyMetric = {
      id: newMetricId,
      categoryId: selectedCategoryId,
      name: newMetricName.trim(),
      type: newMetricType,
      options: (newMetricType === 'tags' || newMetricType === 'select_one') ? newMetricOptions.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      config:
        newMetricType === 'slider' || newMetricType === 'number'
          ? { min: newMetricMin, max: newMetricMax, unit: newMetricUnit.trim() || undefined }
          : undefined,
      order: currentCategoryMetrics.length + 1,
      active: true,
    };

    setSchema((prev) => ({
      ...prev,
      metrics: [...prev.metrics, newMetric],
    }));

    setNewMetricName('');
    setNewMetricUnit('');
    setIsAddingMetric(false);
  };

  const handleToggleMetricActive = (metricId: string) => {
    const metric = schema.metrics.find((m) => m.id === metricId);
    if (metric?.isSystemLocked) return;

    setSchema((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => (m.id === metricId ? { ...m, active: !m.active } : m)),
    }));
  };

  const handleDeleteMetric = (metricId: string) => {
    const metric = schema.metrics.find((m) => m.id === metricId);
    if (metric?.isSystemLocked) {
      setConfirmDialog({
        title: 'System Locked Metric',
        message: `Metric "${metric.name}" is a core Sleep Parameter metric required for research calculations and cannot be deleted.`,
        confirmText: 'Understood',
        variant: 'info',
        onConfirm: () => setConfirmDialog(null),
      });
      return;
    }

    setConfirmDialog({
      title: `Delete Metric "${metric?.name}"?`,
      message: `Are you sure you want to delete metric "${metric?.name}"?`,
      confirmText: 'Delete Metric',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        setSchema((prev) => ({
          ...prev,
          metrics: prev.metrics.filter((m) => m.id !== metricId),
          recoveryIndexMetricIds: prev.recoveryIndexMetricIds.filter((id) => id !== metricId),
        }));
        setConfirmDialog(null);
      },
    });
  };

  const handleUpdateMetricName = (metricId: string, name: string) => {
    setSchema((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => (m.id === metricId ? { ...m, name } : m)),
    }));
  };

  const handleMoveMetric = (metricId: string, direction: 'up' | 'down') => {
    const catMetrics = currentCategoryMetrics;
    const index = catMetrics.findIndex((m) => m.id === metricId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= catMetrics.length) return;

    const reorderedCatMetrics = [...catMetrics];
    const [moved] = reorderedCatMetrics.splice(index, 1);
    reorderedCatMetrics.splice(targetIndex, 0, moved);

    const updatedMap = new Map(reorderedCatMetrics.map((m, idx) => [m.id, idx + 1]));

    setSchema((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) =>
        updatedMap.has(m.id) ? { ...m, order: updatedMap.get(m.id)! } : m
      ),
    }));
  };

  /* ========================================================================= */
  /* TRIGGER RULE HANDLERS                                                     */
  /* ========================================================================= */

  const handleEditDependentRule = (parentMetricId: string, rule: DependentRule) => {
    setEditingRuleInfo({ parentMetricId, ruleId: rule.id });
    setRuleCondition(rule.condition);
    setRuleTargetValue(rule.targetValue ?? '');
    setRuleSubMetricName(rule.subMetric.name);
    setRuleSubMetricType(rule.subMetric.type);
    setRuleSubMetricOptions((rule.subMetric.options || []).join(', '));
    setAddingRuleParentId(parentMetricId);
  };

  const handleMoveDependentRule = (parentMetricId: string, ruleId: string, direction: 'up' | 'down') => {
    const moveRuleRecursively = (metrics: StudyMetric[]): StudyMetric[] => {
      return metrics.map((m) => {
        if (m.id === parentMetricId && m.dependentRules) {
          const rules = [...m.dependentRules];
          const idx = rules.findIndex((r) => r.id === ruleId);
          if (idx >= 0) {
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx >= 0 && targetIdx < rules.length) {
              const [moved] = rules.splice(idx, 1);
              rules.splice(targetIdx, 0, moved);
              return { ...m, dependentRules: rules };
            }
          }
        }
        if (m.dependentRules && m.dependentRules.length > 0) {
          return {
            ...m,
            dependentRules: m.dependentRules.map((r) => ({
              ...r,
              subMetric: moveRuleRecursively([r.subMetric])[0],
            })),
          };
        }
        return m;
      });
    };

    setSchema((prev) => ({
      ...prev,
      metrics: moveRuleRecursively(prev.metrics),
    }));
  };

  const handleAddDependentRule = (parentMetricId: string) => {
    if (!ruleSubMetricName.trim()) return;

    if (editingRuleInfo && editingRuleInfo.parentMetricId === parentMetricId) {
      const updateRuleRecursively = (metrics: StudyMetric[]): StudyMetric[] => {
        return metrics.map((m) => {
          if (m.id === parentMetricId) {
            return {
              ...m,
              dependentRules: (m.dependentRules || []).map((r) => {
                if (r.id === editingRuleInfo.ruleId) {
                  return {
                    ...r,
                    condition: ruleCondition,
                    targetValue: ruleTargetValue,
                    subMetric: {
                      ...r.subMetric,
                      name: ruleSubMetricName.trim(),
                      type: ruleSubMetricType,
                      options: (ruleSubMetricType === 'tags' || ruleSubMetricType === 'select_one')
                        ? ruleSubMetricOptions.split(',').map((s) => s.trim()).filter(Boolean)
                        : undefined,
                    },
                  };
                }
                return r;
              }),
            };
          }
          if (m.dependentRules && m.dependentRules.length > 0) {
            return {
              ...m,
              dependentRules: m.dependentRules.map((r) => ({
                ...r,
                subMetric: updateRuleRecursively([r.subMetric])[0],
              })),
            };
          }
          return m;
        });
      };

      setSchema((prev) => ({
        ...prev,
        metrics: updateRuleRecursively(prev.metrics),
      }));

      setEditingRuleInfo(null);
      setAddingRuleParentId(null);
      setRuleSubMetricName('');
      return;
    }

    const newRuleId = `rule-${Date.now()}`;
    const newSubMetric: StudyMetric = {
      id: `sub-metric-${Date.now()}`,
      categoryId: selectedCategoryId,
      name: ruleSubMetricName.trim(),
      type: ruleSubMetricType,
      options: (ruleSubMetricType === 'tags' || ruleSubMetricType === 'select_one') ? ruleSubMetricOptions.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      order: 1,
      active: true,
    };

    const newRule: DependentRule = {
      id: newRuleId,
      condition: ruleCondition,
      targetValue: ruleTargetValue,
      subMetric: newSubMetric,
    };

    // Recursive insertion helper into parent metric or nested sub-metric
    const insertRuleRecursively = (metrics: StudyMetric[]): StudyMetric[] => {
      return metrics.map((m) => {
        if (m.id === parentMetricId) {
          return {
            ...m,
            dependentRules: [...(m.dependentRules || []), newRule],
          };
        }
        if (m.dependentRules && m.dependentRules.length > 0) {
          return {
            ...m,
            dependentRules: m.dependentRules.map((r) => ({
              ...r,
              subMetric: insertRuleRecursively([r.subMetric])[0],
            })),
          };
        }
        return m;
      });
    };

    setSchema((prev) => ({
      ...prev,
      metrics: insertRuleRecursively(prev.metrics),
    }));

    setEditingRuleInfo(null);
    setAddingRuleParentId(null);
    setRuleSubMetricName('');
  };

  const handleDeleteDependentRule = (parentMetricId: string, ruleId: string) => {
    const deleteRuleRecursively = (metrics: StudyMetric[]): StudyMetric[] => {
      return metrics.map((m) => {
        if (m.id === parentMetricId) {
          return {
            ...m,
            dependentRules: (m.dependentRules || []).filter((r) => r.id !== ruleId),
          };
        }
        if (m.dependentRules && m.dependentRules.length > 0) {
          return {
            ...m,
            dependentRules: m.dependentRules.map((r) => ({
              ...r,
              subMetric: deleteRuleRecursively([r.subMetric])[0],
            })),
          };
        }
        return m;
      });
    };

    setSchema((prev) => ({
      ...prev,
      metrics: deleteRuleRecursively(prev.metrics),
    }));
  };

  /* ========================================================================= */
  /* RECOVERY INDEX CONFIGURATOR HANDLER                                       */
  /* ========================================================================= */

  const handleToggleRecoveryMetric = (metricId: string) => {
    setSchema((prev) => {
      const exists = prev.recoveryIndexMetricIds.includes(metricId);
      const updated = exists
        ? prev.recoveryIndexMetricIds.filter((id) => id !== metricId)
        : [...prev.recoveryIndexMetricIds, metricId];
      return { ...prev, recoveryIndexMetricIds: updated };
    });
  };

  /* ========================================================================= */
  /* SAVE HANDLER                                                              */
  /* ========================================================================= */

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await onSaveSchema(schema);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save study structure schema.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-200 ${
        isMaximized ? 'p-0' : 'p-4 overflow-y-auto'
      }`}>
        <div className={`bg-[var(--surface)] border border-[var(--border-default)] shadow-2xl flex flex-col font-sans text-[var(--text-primary)] transition-all duration-200 overflow-hidden ${
          isMaximized
            ? 'w-full h-full max-w-none max-h-none rounded-none my-0'
            : 'w-full max-w-5xl max-h-[90vh] rounded-xl my-8'
        }`}>
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-raised)]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[var(--accent)]" />
            <div>
              <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
                Customize Protocol Structure
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {study.title} — Edit categories, install metrics, and configure Recovery Index
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-md transition-colors"
              title={isMaximized ? 'Restore Window Size' : 'Maximize Fullscreen View'}
            >
              {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-md transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--border-default)] bg-[var(--surface)] px-6">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-sans font-medium border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-4 h-4" /> Categories & Metrics Editor
          </button>
          <button
            onClick={() => setActiveTab('recoveryIndex')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-sans font-medium border-b-2 transition-colors ${
              activeTab === 'recoveryIndex'
                ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Award className="w-4 h-4" /> Daily Recovery Index Configurator ({schema.recoveryIndexMetricIds.length})
          </button>
          <button
            onClick={() => setActiveTab('codeSharing')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-sans font-medium border-b-2 transition-colors ${
              activeTab === 'codeSharing'
                ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Share2 className="w-4 h-4" /> Code Sharing
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/30 rounded-md text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {activeTab === 'codeSharing' && (
            <div className="space-y-8">
              {/* Section 1: Export Current Protocol Code */}
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif font-medium text-sm text-[var(--text-primary)]">
                        Export Protocol Code
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Copy this 1-line Protocol Code to transfer your entire protocol structure & branching logic to another account or study.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 bg-[var(--surface)] border border-[var(--border-default)] rounded-md text-[var(--text-secondary)]">
                    {schema.categories.length} Categories • {schema.metrics.length} Metrics
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={encodeProtocolPreset(schema)}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--surface)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = encodeProtocolPreset(schema);
                        navigator.clipboard.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2500);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium rounded-md transition-colors shadow-sm flex-shrink-0"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" /> Copied Code!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy Protocol Code
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] pt-1">
                    <span>Prefix: <code className="font-mono text-[var(--accent)]">SLPROTO-</code> Base64 Encoded</span>
                    <button
                      type="button"
                      onClick={() => {
                        const jsonStr = JSON.stringify(schema, null, 2);
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `sleeplab-protocol-code-${study.id || 'export'}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1 hover:text-[var(--text-primary)] underline transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download JSON File
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Import Protocol Code */}
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-medium text-sm text-[var(--text-primary)]">
                      Import Protocol Code
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Paste a shared <code className="font-mono text-[var(--accent)]">SLPROTO-...</code> code or raw JSON schema to instantly replicate a protocol.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Paste SLPROTO- code or JSON schema here..."
                    value={importInput}
                    onChange={(e) => {
                      setImportInput(e.target.value);
                      setImportStatus(null);
                    }}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--surface)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />

                  {importStatus && (
                    <div
                      className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                        importStatus.type === 'success'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                          : 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/30'
                      }`}
                    >
                      {importStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{importStatus.message}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={!importInput.trim()}
                      onClick={() => {
                        try {
                          const loadedSchema = decodeProtocolPreset(importInput);
                          setSchema(loadedSchema);
                          setSelectedCategoryId(loadedSchema.categories[0]?.id || 'cat-sleep');
                          setImportStatus({
                            type: 'success',
                            message: `Successfully imported protocol structure with ${loadedSchema.categories.length} categories and ${loadedSchema.metrics.length} metrics! Click "Save Protocol Schema" below to apply.`,
                          });
                          setImportInput('');
                        } catch (err: any) {
                          setImportStatus({
                            type: 'error',
                            message: err.message || 'Failed to decode protocol code.',
                          });
                        }
                      }}
                      className="flex items-center gap-2 px-5 py-2 bg-[var(--accent)] text-white text-xs font-medium rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors shadow-sm"
                    >
                      <PackageCheck className="w-4 h-4" /> Load & Apply Protocol
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Categories List */}
              <div className="md:col-span-4 space-y-4 border-r border-[var(--border-default)] pr-0 md:pr-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Categories ({schema.categories.length})
                  </span>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {schema.categories.map((cat, index) => (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        selectedCategoryId === cat.id
                          ? 'bg-[var(--surface-raised)] border-[var(--accent)] text-[var(--text-primary)] font-medium shadow-sm'
                          : 'border-[var(--border-default)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        {cat.isSystemLocked && <Lock className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />}
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveCategory(cat.id, 'up');
                          }}
                          className="p-1 hover:text-[var(--text-primary)] disabled:opacity-30"
                        >
                          <MoveUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === schema.categories.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveCategory(cat.id, 'down');
                          }}
                          className="p-1 hover:text-[var(--text-primary)] disabled:opacity-30"
                        >
                          <MoveDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Category */}
                <div className="pt-2 border-t border-[var(--border-default)] space-y-2">
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)]">
                    Add New Category
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Category Name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-medium rounded-md hover:bg-[var(--accent-hover)] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Category Metrics Details */}
              <div className="md:col-span-8 space-y-6">
                {currentCategory ? (
                  <div className="space-y-6">
                    {/* Category Header Controls */}
                    <div className="bg-[var(--surface-raised)] p-4 rounded-lg border border-[var(--border-default)] space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] font-sans font-semibold uppercase text-[var(--text-tertiary)]">
                            Category Title
                          </label>
                          <input
                            type="text"
                            value={currentCategory.name}
                            disabled={currentCategory.isSystemLocked}
                            onChange={(e) => handleRenameCategory(currentCategory.id, e.target.value)}
                            className="text-base font-serif font-normal bg-transparent border-b border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] w-full py-0.5 disabled:border-transparent"
                          />
                        </div>

                        {!currentCategory.isSystemLocked && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(currentCategory.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-md border border-[var(--danger)]/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Category
                          </button>
                        )}
                      </div>

                      {currentCategory.isSystemLocked && (
                        <p className="text-[11px] text-[var(--accent)] flex items-center gap-1.5 font-medium">
                          <Lock className="w-3.5 h-3.5" /> System Category: Required for essential sleep timing parameters.
                        </p>
                      )}
                    </div>

                    {/* Installed Metrics List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                          Installed Metrics ({currentCategoryMetrics.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingMetric(!isAddingMetric)}
                          className="flex items-center gap-1 text-xs text-[var(--accent)] font-medium hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Metric to Category
                        </button>
                      </div>

                      {/* Add Metric Drawer */}
                      {isAddingMetric && (
                        <div className="bg-[var(--surface-raised)] p-4 rounded-lg border border-[var(--accent)]/40 space-y-4">
                          <h4 className="text-xs font-semibold text-[var(--text-primary)]">Add Metric to "{currentCategory.name}"</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Metric Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Heart Rate"
                                value={newMetricName}
                                onChange={(e) => setNewMetricName(e.target.value)}
                                className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Metric Type</label>
                              <select
                                value={newMetricType}
                                onChange={(e) => setNewMetricType(e.target.value as any)}
                                className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)]"
                              >
                                <option value="slider">Slider (1-10 Score)</option>
                                <option value="checkbox">Checkbox (Yes / No)</option>
                                <option value="tags">Tags / Multi-Select Buttons</option>
                                <option value="select_one">Multi Option (Select One)</option>
                                <option value="number">Numeric Value</option>
                                <option value="time">Time (HH:mm)</option>
                                <option value="duration">Duration</option>
                                <option value="text">Text Notes</option>
                              </select>
                            </div>

                            {(newMetricType === 'tags' || newMetricType === 'select_one') && (
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                                  Options (Comma Separated)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Option 1, Option 2, Option 3"
                                  value={newMetricOptions}
                                  onChange={(e) => setNewMetricOptions(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)]"
                                />
                              </div>
                            )}

                            {(newMetricType === 'slider' || newMetricType === 'number') && (
                              <>
                                <div>
                                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Min Value</label>
                                  <input
                                    type="number"
                                    value={newMetricMin}
                                    onChange={(e) => setNewMetricMin(Number(e.target.value))}
                                    className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Max Value</label>
                                  <input
                                    type="number"
                                    value={newMetricMax}
                                    onChange={(e) => setNewMetricMax(Number(e.target.value))}
                                    className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Unit (Optional)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. bpm, mg"
                                    value={newMetricUnit}
                                    onChange={(e) => setNewMetricUnit(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)]"
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                            <button
                              type="button"
                              onClick={() => setIsAddingMetric(false)}
                              className="px-3 py-1 text-xs border border-[var(--border-default)] rounded-md hover:bg-[var(--surface)]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAddMetric}
                              className="px-3 py-1 bg-[var(--accent)] text-white text-xs font-medium rounded-md hover:bg-[var(--accent-hover)]"
                            >
                              Add Metric
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Recursive Metric Rule Tree Renderer */}
                      <div className="space-y-3">
                        {currentCategoryMetrics.map((m, mIndex) => {
                          const renderMetricTreeItem = (metric: StudyMetric, depth: number = 0): React.ReactNode => {
                            const isAdding = addingRuleParentId === metric.id;
                            const indentStyle = depth > 0 ? { marginLeft: `${depth * 20}px` } : {};

                            return (
                              <div key={metric.id} style={indentStyle} className="space-y-2">
                                <div
                                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                                    metric.active !== false
                                      ? depth > 0 ? 'bg-[var(--surface-raised)] border-[var(--border-default)] border-l-2 border-l-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border-default)]'
                                      : 'bg-[var(--surface-raised)] border-[var(--border-default)] opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {depth > 0 && <span className="font-mono text-[var(--accent)] text-xs">└─</span>}
                                    {metric.isSystemLocked && <Lock className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />}
                                    <input
                                      type="text"
                                      value={metric.name}
                                      disabled={metric.isSystemLocked}
                                      onChange={(e) => handleUpdateMetricName(metric.id, e.target.value)}
                                      className="font-medium bg-transparent border-b border-transparent focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] disabled:border-transparent flex-1"
                                    />
                                    <span className="text-[10px] uppercase tracking-wider font-mono text-[var(--text-tertiary)] bg-[var(--surface-raised)] px-2 py-0.5 rounded border border-[var(--border-default)]">
                                      {metric.type}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddingRuleParentId(isAdding ? null : metric.id);
                                        setRuleSubMetricName('');
                                      }}
                                      className="px-2.5 py-1 rounded text-[10px] font-medium border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors flex items-center gap-1"
                                    >
                                      <Zap className="w-3 h-3" /> Add Trigger Rule
                                    </button>

                                    {!metric.isSystemLocked && depth === 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleMetricActive(metric.id)}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                                          metric.active !== false
                                            ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/30'
                                            : 'bg-[var(--surface-raised)] text-[var(--text-tertiary)] border-[var(--border-default)]'
                                        }`}
                                      >
                                        {metric.active !== false ? 'Active' : 'Disabled'}
                                      </button>
                                    )}

                                    {depth === 0 && (
                                      <>
                                        <button
                                          type="button"
                                          disabled={mIndex === 0}
                                          onClick={() => handleMoveMetric(metric.id, 'up')}
                                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                                        >
                                          <MoveUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={mIndex === currentCategoryMetrics.length - 1}
                                          onClick={() => handleMoveMetric(metric.id, 'down')}
                                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                                        >
                                          <MoveDown className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}

                                    {!metric.isSystemLocked && depth === 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMetric(metric.id)}
                                        className="p-1 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Trigger Rule Builder Form */}
                                {isAdding && (
                                  <div className="p-4 bg-[var(--surface-raised)] border border-[var(--accent)]/40 rounded-lg space-y-3 ml-4">
                                    <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                                      <GitFork className="w-3.5 h-3.5" /> {editingRuleInfo ? 'Edit Triggered Sub-Metric Rule' : 'Configure Triggered Sub-Metric Rule'}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div>
                                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">When Value Condition</label>
                                        <select
                                          value={ruleCondition}
                                          onChange={(e) => setRuleCondition(e.target.value as any)}
                                          className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)] font-sans"
                                        >
                                          <option value="equals">Equals (==)</option>
                                          <option value="greaterThan">Greater Than (&gt;)</option>
                                          <option value="lessThan">Less Than (&lt;)</option>
                                          <option value="isTrue">Is Checked / True</option>
                                          <option value="isFalse">Is Unchecked / False</option>
                                          <option value="contains">Contains Tag</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Target Value</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. 0 or True"
                                          value={ruleTargetValue}
                                          onChange={(e) => setRuleTargetValue(e.target.value)}
                                          className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)] font-sans"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Sub-Metric Name</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. Awakening Reasons"
                                          value={ruleSubMetricName}
                                          onChange={(e) => setRuleSubMetricName(e.target.value)}
                                          className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)] font-sans"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Sub-Metric Input Type</label>
                                        <select
                                          value={ruleSubMetricType}
                                          onChange={(e) => setRuleSubMetricType(e.target.value as any)}
                                          className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)] font-sans"
                                        >
                                          <option value="tags">Tags / Multi-Select Buttons</option>
                                          <option value="select_one">Multi Option (Select One)</option>
                                          <option value="text">Text Notes</option>
                                          <option value="number">Number</option>
                                          <option value="slider">Slider (1-10)</option>
                                          <option value="checkbox">Checkbox</option>
                                        </select>
                                      </div>
                                      {(ruleSubMetricType === 'tags' || ruleSubMetricType === 'select_one') && (
                                        <div>
                                          <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Options (Comma Separated)</label>
                                          <input
                                            type="text"
                                            placeholder="Pee, Dream, Noise, Unknown"
                                            value={ruleSubMetricOptions}
                                            onChange={(e) => setRuleSubMetricOptions(e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)] font-sans"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => { setAddingRuleParentId(null); setEditingRuleInfo(null); }}
                                        className="px-3 py-1 text-xs border border-[var(--border-default)] rounded hover:bg-[var(--surface)]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddDependentRule(metric.id)}
                                        className="px-3 py-1 bg-[var(--accent)] text-white text-xs font-medium rounded hover:bg-[var(--accent-hover)]"
                                      >
                                        Save Trigger Rule
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Attached Dependent Rules List */}
                                {(metric.dependentRules || []).map((rule, rIndex) => (
                                  <div key={rule.id} className="space-y-1 ml-4 border-l border-[var(--border-default)] pl-3">
                                    <div className="flex items-center justify-between text-[11px] bg-[var(--accent-soft)] p-2 rounded border border-[var(--accent)]/20 text-[var(--text-primary)]">
                                      <div className="flex items-center gap-2">
                                        <GitFork className="w-3 h-3 text-[var(--accent)]" />
                                        <span>
                                          If <strong>{metric.name}</strong> {rule.condition} &quot;{rule.targetValue}&quot; ➔ Show <strong>{rule.subMetric.name}</strong>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={rIndex === 0}
                                          onClick={() => handleMoveDependentRule(metric.id, rule.id, 'up')}
                                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                                          title="Move Rule Up"
                                        >
                                          <MoveUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={rIndex === (metric.dependentRules?.length || 0) - 1}
                                          onClick={() => handleMoveDependentRule(metric.id, rule.id, 'down')}
                                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                                          title="Move Rule Down"
                                        >
                                          <MoveDown className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleEditDependentRule(metric.id, rule)}
                                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                                          title="Edit Trigger Rule"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteDependentRule(metric.id, rule.id)}
                                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
                                          title="Delete Trigger Rule"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Render Sub-metric recursively */}
                                    {renderMetricTreeItem(rule.subMetric, depth + 1)}
                                  </div>
                                ))}
                              </div>
                            );
                          };

                          return renderMetricTreeItem(m, 0);
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">
                    Select a category from the left column to view & edit installed metrics.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'recoveryIndex' && (
            /* RECOVERY INDEX CONFIGURATOR TAB */
            <div className="space-y-6">
              <div className="bg-[var(--surface-raised)] p-5 rounded-lg border border-[var(--border-default)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                  <Award className="w-4 h-4 text-[var(--accent)]" /> Daily Recovery Index Configurator
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Select which slider metrics contribute to your Daily Recovery Index. The index will automatically calculate the daily total score and percentage (0–100%) based on your active choices below.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Available Slider Metrics ({allSliderMetrics.length})
                </span>

                {allSliderMetrics.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allSliderMetrics.map((slider) => {
                      const isSelected = schema.recoveryIndexMetricIds.includes(slider.id);
                      const parentCategory = schema.categories.find((c) => c.id === slider.categoryId);

                      return (
                        <div
                          key={slider.id}
                          onClick={() => handleToggleRecoveryMetric(slider.id)}
                          className={`p-4 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-medium shadow-sm'
                              : 'bg-[var(--surface)] border-[var(--border-default)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)]'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-sm">{slider.name}</div>
                            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                              In Category: {parentCategory?.name || 'General'}
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[var(--surface-raised)] p-6 text-center text-xs text-[var(--text-tertiary)] rounded-lg border border-[var(--border-default)]">
                    No active slider metrics found in this protocol schema. Add slider metrics to categories to enable Recovery Index calculation.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border-default)] flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-raised)]">
          <button
            type="button"
            onClick={() => {
              setConfirmDialog({
                title: 'Reset Structure to Default?',
                message: 'Are you sure you want to reset this study protocol structure back to the default built-in template? All custom categories and metrics will be restored to defaults.',
                confirmText: 'Reset to Default',
                cancelText: 'Cancel',
                variant: 'danger',
                onConfirm: () => {
                  const defaultSchema = getDefaultStudySchema();
                  setSchema(defaultSchema);
                  setSelectedCategoryId(defaultSchema.categories[0]?.id || 'cat-sleep');
                  setConfirmDialog(null);
                },
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger-soft)] rounded-md transition-colors"
            title="Reset structure to default SleepLab protocol template"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium border border-[var(--border-default)] rounded-md hover:bg-[var(--surface)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-white text-xs font-medium rounded-md hover:bg-[var(--accent-hover)] transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving Schema...' : 'Save Protocol Schema'}
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOM CONFIRM & ALERT DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-full flex-shrink-0 ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                    : confirmDialog.variant === 'warning'
                    ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                    : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-serif font-semibold text-[var(--text-primary)]">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-default)]">
              {confirmDialog.cancelText && (
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 text-xs font-medium border border-[var(--border-default)] rounded-md hover:bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors"
                >
                  {confirmDialog.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-xs font-medium text-white rounded-md transition-colors shadow-sm ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-[var(--danger)] hover:bg-[var(--danger)]/90'
                    : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
                }`}
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
