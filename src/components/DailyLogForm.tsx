import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  DailyEntry,
  AwakeningReason,
  SleepyBeforeBedOption,
  ConfoundingFactor,
  CustomMetricDefinition,
  StudySchema,
  StudyMetric,
  DependentRule,
} from '@/types/sleeplab';
import { SliderField } from './SliderField';
import { computeMetrics, computeDynamicMetrics } from '@/lib/calculations';
import { getDefaultStudySchema } from '@/lib/defaultSchema';
import {
  getEntryByDate,
  saveEntryAsync,
  calculateDayNumber,
  getStoredStartDate,
  fetchCustomMetricDefinitionsAsync,
  getConfounderDefinitions,
} from '@/lib/storage';
import { CustomMetricInput } from './CustomMetricInput';
import { CustomMetricBuilder } from './CustomMetricBuilder';
import { CustomMetricManager } from './CustomMetricManager';
import { ConfounderManagerModal } from './ConfounderManagerModal';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  Moon,
  Sun,
  Battery,
  ShieldAlert,
  Sparkles,
  Sliders,
  Plus,
  Settings,
  ChevronDown,
  ChevronUp,
  GitFork,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface DailyLogFormProps {
  initialMaximized?: boolean;
  initialEntry?: DailyEntry | null;
  isDateLocked?: boolean;
  studySchema?: StudySchema;
  userId?: string | null;
  onSaved: (savedEntry: DailyEntry) => void;
  onCancel?: () => void;
  onOpenSchemaEditor?: () => void;
}

const ALL_AWAKENING_REASONS: AwakeningReason[] = ['Pee', 'Dream', 'Noise', 'Unknown', 'Other'];

const ALL_CONFOUNDERS: ConfoundingFactor[] = [
  'Heavy Leg Day',
  'Upper Body Training',
  'Zone 2 Cardio',
  'Zone 4–5 Cardio',
  'Late Caffeine',
  'Stress',
  'Late Meal',
  'Screen Exposure Before Bed',
  'Illness',
  'Travel',
  'Other',
];

export const DailyLogForm: React.FC<DailyLogFormProps> = ({
  initialMaximized,
  initialEntry,
  isDateLocked,
  studySchema,
  userId,
  onSaved,
  onCancel,
  onOpenSchemaEditor,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const effectiveSchema = studySchema || getDefaultStudySchema();

  const [date, setDate] = useState<string>(initialEntry?.date || todayStr);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(!!initialEntry);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Sleep state
  const [lightsOut, setLightsOut] = useState<string>(initialEntry?.sleep.lightsOut || '23:00');
  const [estimatedSleepTime, setEstimatedSleepTime] = useState<string>(
    initialEntry?.sleep.estimatedSleepTime || '23:15'
  );
  const [naturalWakeTime, setNaturalWakeTime] = useState<string>(
    initialEntry?.sleep.naturalWakeTime || '07:30'
  );
  const [alarmWake, setAlarmWake] = useState<boolean>(initialEntry?.sleep.alarmWake ?? false);
  const [numberOfAwakenings, setNumberOfAwakenings] = useState<number>(
    initialEntry?.sleep.numberOfAwakenings ?? 0
  );
  const [awakeningReasons, setAwakeningReasons] = useState<AwakeningReason[]>(
    initialEntry?.sleep.awakeningReasons || []
  );

  // Morning state
  const [morningAlertness, setMorningAlertness] = useState<number>(
    initialEntry?.morning.morningAlertness ?? 5
  );
  const [sleepInertia, setSleepInertia] = useState<number>(initialEntry?.morning.sleepInertia ?? 5);
  const [mood, setMood] = useState<number>(initialEntry?.morning.mood ?? 5);
  const [motivation, setMotivation] = useState<number>(initialEntry?.morning.motivation ?? 5);

  // Recovery state
  const [skinHealth, setSkinHealth] = useState<number>(initialEntry?.recovery.skinHealth ?? 5);
  const [muscleFullness, setMuscleFullness] = useState<number>(
    initialEntry?.recovery.muscleFullness ?? 5
  );
  const [workoutEnergy, setWorkoutEnergy] = useState<number>(
    initialEntry?.recovery.workoutEnergy ?? 5
  );
  const [bodyFreshness, setBodyFreshness] = useState<number>(
    initialEntry?.recovery.bodyFreshness ?? 5
  );

  // Afternoon state
  const [afternoonEnergy, setAfternoonEnergy] = useState<number>(
    initialEntry?.afternoon.afternoonEnergy ?? 5
  );
  const [focus, setFocus] = useState<number>(initialEntry?.afternoon.focus ?? 5);
  const [afternoonSlump, setAfternoonSlump] = useState<boolean>(
    initialEntry?.afternoon.afternoonSlump ?? false
  );

  // Evening state
  const [naturallySleepyBeforeBed, setNaturallySleepyBeforeBed] = useState<SleepyBeforeBedOption>(
    initialEntry?.evening.naturallySleepyBeforeBed || 'Yes'
  );
  const [notes, setNotes] = useState<string>(initialEntry?.evening.notes || '');

  // Confounders state
  const [confounders, setConfounders] = useState<ConfoundingFactor[]>(
    initialEntry?.confounders || []
  );

  // Custom metrics state
  const [customMetricDefs, setCustomMetricDefs] = useState<CustomMetricDefinition[]>([]);
  const [additionalMetrics, setAdditionalMetrics] = useState<Record<string, any>>(
    initialEntry?.additionalMetrics || {}
  );
  const [metricsData, setMetricsData] = useState<Record<string, any>>(
    initialEntry?.metricsData || {}
  );

  // Modal states
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<CustomMetricDefinition | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isConfounderManagerOpen, setIsConfounderManagerOpen] = useState(false);

  // Confounders definitions state
  const [confounderOptions, setConfounderOptions] = useState<string[]>([]);

  // Collapsed sections state with localStorage persistence
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sleeplab_form_collapsed_sections');
        if (saved) return JSON.parse(saved);
      } catch (e) { }
    }
    return {};
  });

  // Muted metrics state
  const [mutedMetrics, setMutedMetrics] = useState<string[]>(initialEntry?.mutedMetrics || []);

  const toggleSectionCollapse = (sectionKey: string) => {
    setCollapsedSections((prev) => {
      const updated = { ...prev, [sectionKey]: !prev[sectionKey] };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sleeplab_form_collapsed_sections', JSON.stringify(updated));
        } catch (e) { }
      }
      return updated;
    });
  };

  const handleToggleMute = (metricId: string) => {
    setMutedMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((m) => m !== metricId) : [...prev, metricId]
    );
  };

  // Feedback banner state
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  const [maximizedCategoryId, setMaximizedCategoryId] = useState<string | null>(null);
  const [isFormMaximized, setIsFormMaximized] = useState(initialMaximized || false);
  useEffect(() => { if (initialMaximized !== undefined) setIsFormMaximized(initialMaximized); }, [initialMaximized]);

  const refreshCustomMetrics = async () => {
    const loaded = await fetchCustomMetricDefinitionsAsync(userId);
    setCustomMetricDefs(loaded);
  };

  useEffect(() => {
    setConfounderOptions(getConfounderDefinitions());
  }, []);

  useEffect(() => {
    refreshCustomMetrics();
  }, [userId]);

  // Check if changing date loads existing entry
  useEffect(() => {
    if (!initialEntry) {
      const existing = getEntryByDate(date);
      if (existing) {
        setIsEditingExisting(true);
        setLightsOut(existing.sleep.lightsOut);
        setEstimatedSleepTime(existing.sleep.estimatedSleepTime);
        setNaturalWakeTime(existing.sleep.naturalWakeTime);
        setAlarmWake(existing.sleep.alarmWake);
        setNumberOfAwakenings(existing.sleep.numberOfAwakenings);
        setAwakeningReasons(existing.sleep.awakeningReasons);

        setMorningAlertness(existing.morning.morningAlertness);
        setSleepInertia(existing.morning.sleepInertia);
        setMood(existing.morning.mood);
        setMotivation(existing.morning.motivation);

        setSkinHealth(existing.recovery.skinHealth);
        setMuscleFullness(existing.recovery.muscleFullness);
        setWorkoutEnergy(existing.recovery.workoutEnergy);
        setBodyFreshness(existing.recovery.bodyFreshness);

        setAfternoonEnergy(existing.afternoon.afternoonEnergy);
        setFocus(existing.afternoon.focus);
        setAfternoonSlump(existing.afternoon.afternoonSlump);

        setNaturallySleepyBeforeBed(existing.evening.naturallySleepyBeforeBed);
        setNotes(existing.evening.notes);
        setConfounders(existing.confounders);
        setAdditionalMetrics(existing.additionalMetrics || {});
        setMetricsData(existing.metricsData || {});
        setMutedMetrics(existing.mutedMetrics || []);
      } else {
        setIsEditingExisting(false);
      }
    }
  }, [date, initialEntry]);

  // Active custom metrics
  const activeCustomMetrics = customMetricDefs.filter((m) => m.active !== false);

  // Combine state for dynamic metrics computation
  const currentMergedMetrics = {
    morningAlertness,
    sleepInertia,
    mood,
    motivation,
    skinHealth,
    muscleFullness,
    workoutEnergy,
    bodyFreshness,
    afternoonEnergy,
    focus,
    afternoonSlump,
    ...metricsData,
  };

  // Compute live metrics
  const calculatedMetrics = computeDynamicMetrics(
    estimatedSleepTime,
    naturalWakeTime,
    currentMergedMetrics,
    effectiveSchema.recoveryIndexMetricIds,
    { morningAlertness, sleepInertia, mood, motivation },
    { skinHealth, muscleFullness, workoutEnergy, bodyFreshness },
    { afternoonEnergy, focus, afternoonSlump }
  );


  // All ordered category IDs for Focus Mode navigation
  const allCategoryIds = [
    'sleep',
    ...effectiveSchema.categories
      .filter((cat) => cat.id !== 'cat-sleep')
      .sort((a, b) => a.order - b.order)
      .map((c) => c.id),
    'confounders',
  ];

  const currentFocusIndex = maximizedCategoryId ? allCategoryIds.indexOf(maximizedCategoryId) : -1;
  const canNavigatePrevCategory = currentFocusIndex > 0;
  const canNavigateNextCategory = currentFocusIndex >= 0 && currentFocusIndex < allCategoryIds.length - 1;

  const handleNavigatePrevCategory = () => {
    if (canNavigatePrevCategory) {
      setMaximizedCategoryId(allCategoryIds[currentFocusIndex - 1]);
    }
  };

  const handleNavigateNextCategory = () => {
    if (canNavigateNextCategory) {
      setMaximizedCategoryId(allCategoryIds[currentFocusIndex + 1]);
    }
  };

  const getFocusedCategoryTitle = (catId: string) => {
    if (catId === 'sleep') return '1. Sleep Parameters';
    if (catId === 'confounders') return 'Potential Confounding Factors';
    const found = effectiveSchema.categories.find((c) => c.id === catId);
    return found ? found.name : 'Category';
  };

  const startDate = getStoredStartDate() || date;
  const dayNumber = initialEntry?.dayNumber || calculateDayNumber(startDate, date);

  const handleAwakeningReasonToggle = (reason: AwakeningReason) => {
    if (awakeningReasons.includes(reason)) {
      setAwakeningReasons(awakeningReasons.filter((r) => r !== reason));
    } else {
      setAwakeningReasons([...awakeningReasons, reason]);
    }
  };

  const renderMetricItem = (m: StudyMetric, depth: number = 0): React.ReactNode => {
    const val =
      m.id === 'morningAlertness' ? morningAlertness :
        m.id === 'sleepInertia' ? sleepInertia :
          m.id === 'mood' ? mood :
            m.id === 'motivation' ? motivation :
              m.id === 'skinHealth' ? skinHealth :
                m.id === 'muscleFullness' ? muscleFullness :
                  m.id === 'workoutEnergy' ? workoutEnergy :
                    m.id === 'bodyFreshness' ? bodyFreshness :
                      m.id === 'afternoonEnergy' ? afternoonEnergy :
                        m.id === 'focus' ? focus :
                          metricsData[m.id];

    const isMuted = mutedMetrics.includes(m.id);

    const handleValChange = (newVal: any) => {
      if (m.id === 'morningAlertness') setMorningAlertness(newVal);
      else if (m.id === 'sleepInertia') setSleepInertia(newVal);
      else if (m.id === 'mood') setMood(newVal);
      else if (m.id === 'motivation') setMotivation(newVal);
      else if (m.id === 'skinHealth') setSkinHealth(newVal);
      else if (m.id === 'muscleFullness') setMuscleFullness(newVal);
      else if (m.id === 'workoutEnergy') setWorkoutEnergy(newVal);
      else if (m.id === 'bodyFreshness') setBodyFreshness(newVal);
      else if (m.id === 'afternoonEnergy') setAfternoonEnergy(newVal);
      else if (m.id === 'focus') setFocus(newVal);
      else {
        setMetricsData((prev) => ({ ...prev, [m.id]: newVal }));
      }
    };

    // Active rules evaluation for nested children
    const activeChildRules = (m.dependentRules || []).filter((rule) => {
      if (rule.condition === 'isTrue') return Boolean(val) === true;
      if (rule.condition === 'isFalse') return Boolean(val) === false;
      if (rule.condition === 'equals') return String(val) === String(rule.targetValue);
      if (rule.condition === 'greaterThan') return Number(val) > Number(rule.targetValue);
      if (rule.condition === 'lessThan') return Number(val) < Number(rule.targetValue);
      if (rule.condition === 'contains') return (Array.isArray(val) && val.includes(rule.targetValue)) || String(val) === String(rule.targetValue);
      return false;
    });

    const depthIndentClass = depth > 0 ? 'border-l-2 border-[var(--accent-soft)] pl-4 my-2 space-y-3' : 'space-y-2';

    return (
      <div key={m.id} className={depthIndentClass}>
        {m.type === 'slider' && (
          <SliderField
            label={m.name}
            sublabel={m.description}
            value={val ?? Math.round(((m.config?.min ?? 1) + (m.config?.max ?? 10)) / 2)}
            onChange={handleValChange}
            min={m.config?.min ?? 1}
            max={m.config?.max ?? 10}
            minLabel={`${m.config?.min ?? 1}`}
            maxLabel={`${m.config?.max ?? 10}${m.config?.unit ? ` (${m.config.unit})` : ''}`}
            isMuted={isMuted}
            onToggleMute={() => handleToggleMute(m.id)}
          />
        )}

        {m.type === 'number' && (
          <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 space-y-1">
            <label className="block text-xs font-medium text-[var(--text-primary)]">
              {m.name} {m.config?.unit && <span className="text-[var(--text-tertiary)]">({m.config.unit})</span>}
            </label>
            {m.description && <p className="text-[11px] text-[var(--text-secondary)]">{m.description}</p>}
            <input
              type="number"
              min={m.config?.min}
              max={m.config?.max}
              value={val ?? ''}
              onChange={(e) => handleValChange(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border border-[var(--border-default)] rounded-md px-3 py-1.5 text-xs font-sans bg-[var(--surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>
        )}

        {m.type === 'checkbox' && (
          <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 flex items-center justify-between">
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)]">{m.name}</label>
              {m.description && <p className="text-[11px] text-[var(--text-secondary)]">{m.description}</p>}
            </div>
            <input
              type="checkbox"
              checked={!!val}
              onChange={(e) => handleValChange(e.target.checked)}
              className="rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 w-4 h-4 cursor-pointer"
            />
          </div>
        )}

        {m.type === 'text' && (
          <div className={`bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 space-y-1 ${depth === 0 ? 'md:col-span-2' : ''}`}>
            <label className="block text-xs font-medium text-[var(--text-primary)]">{m.name}</label>
            {m.description && <p className="text-[11px] text-[var(--text-secondary)]">{m.description}</p>}
            <textarea
              rows={2}
              value={val ?? ''}
              onChange={(e) => handleValChange(e.target.value)}
              className="w-full border border-[var(--border-default)] rounded-md p-2.5 text-xs font-sans bg-[var(--surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>
        )}

        {/* Tags / Multi-select Sub-Metric */}
        {m.type === 'tags' && (
          <div className={`bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 space-y-2 ${depth === 0 ? 'md:col-span-2' : ''}`}>
            <label className="block text-xs font-medium text-[var(--text-primary)]">{m.name}</label>
            {m.description && <p className="text-[11px] text-[var(--text-secondary)]">{m.description}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {(m.options || []).map((opt) => {
                const selectedList: string[] = Array.isArray(val) ? val : [];
                const isSelected = selectedList.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? selectedList.filter((item) => item !== opt)
                        : [...selectedList, opt];
                      handleValChange(next);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-sans transition-colors border ${isSelected
                      ? 'bg-[var(--accent)] text-white border-transparent'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Multi Option / Select One Sub-Metric */}
        {m.type === 'select_one' && (
          <div className={`bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 space-y-2 ${depth === 0 ? 'md:col-span-2' : ''}`}>
            <label className="block text-xs font-medium text-[var(--text-primary)]">{m.name}</label>
            {m.description && <p className="text-[11px] text-[var(--text-secondary)]">{m.description}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {(m.options || []).map((opt) => {
                const isSelected = val === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleValChange(isSelected ? '' : opt)}
                    className={`px-3 py-1 rounded-full text-xs font-sans transition-all border flex items-center gap-1.5 ${isSelected
                      ? 'bg-[var(--accent)] text-white border-transparent shadow-xs font-medium'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full border ${isSelected ? 'bg-white border-white' : 'border-[var(--text-tertiary)]'}`} />
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Render Triggered Child Sub-Metrics (N-Level Branching) */}
        {activeChildRules.length > 0 && (
          <div className={`space-y-3 pt-2 ${depth === 0 ? 'md:col-span-2' : ''}`}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] flex items-center gap-1">
              <GitFork className="w-3 h-3" /> Conditional Trigger Active:
            </div>
            {activeChildRules.map((rule) => renderMetricItem(rule.subMetric, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleConfounderToggle = (item: ConfoundingFactor) => {
    if (confounders.includes(item)) {
      setConfounders(confounders.filter((c) => c !== item));
    } else {
      setConfounders([...confounders, item]);
    }
  };

  const handleCustomMetricChange = (metricId: string, val: any) => {
    setAdditionalMetrics((prev) => {
      const updated = { ...prev };
      if (val === undefined || val === '') {
        delete updated[metricId];
      } else {
        updated[metricId] = val;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    const entryToSave: DailyEntry = {
      id: initialEntry?.id || `entry-${date}`,
      studyId: initialEntry?.studyId,
      reportId: initialEntry?.reportId,
      dayNumber,
      date,
      sleep: {
        lightsOut,
        estimatedSleepTime,
        naturalWakeTime,
        alarmWake,
        numberOfAwakenings,
        awakeningReasons,
      },
      morning: {
        morningAlertness,
        sleepInertia,
        mood,
        motivation,
      },
      recovery: {
        skinHealth,
        muscleFullness,
        workoutEnergy,
        bodyFreshness,
      },
      afternoon: {
        afternoonEnergy,
        focus,
        afternoonSlump,
      },
      evening: {
        naturallySleepyBeforeBed,
        notes,
      },
      confounders,
      additionalMetrics,
      metricsData: currentMergedMetrics,
      mutedMetrics,
      calculatedMetrics,
      createdAt: initialEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const { entry: savedEntry, isUpdate } = await saveEntryAsync(entryToSave, userId);

      setSaveSuccessMsg(
        isUpdate
          ? `Entry for ${date} (Day ${dayNumber}) updated successfully.`
          : `Entry for ${date} (Day ${dayNumber}) saved successfully.`
      );

      setTimeout(() => {
        onSaved(savedEntry || entryToSave);
      }, 400);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to save entry. Please check your network connection.');
    }
  };

  const mainFormBody = (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        {/* Save Error Banner */}
        {saveErrorMsg && (
          <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] p-4 rounded-lg flex items-center gap-3 font-medium text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
        )}

        {/* Save Success Banner */}
        {saveSuccessMsg && (
          <div className="bg-[var(--success-soft)] border border-[var(--success)]/30 text-[var(--success)] p-4 rounded-lg flex items-center gap-3 font-medium text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Date & Existing Entry Notice */}
        <div className="bg-[var(--surface)] p-5 rounded-lg border border-[var(--border-default)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Observation Date
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                required
                value={date}
                disabled={isDateLocked}
                onChange={(e) => setDate(e.target.value)}
                className={`border border-[var(--border-default)] rounded-md px-3 py-1.5 text-xs font-sans focus:outline-none focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--accent-soft)] bg-[var(--surface-raised)] text-[var(--text-primary)] ${isDateLocked ? 'opacity-70 cursor-not-allowed bg-[var(--border-default)]/20' : ''
                  }`}
              />
              {isDateLocked && (
                <span className="text-[10px] font-semibold text-[var(--warning)] bg-[var(--warning-soft)] px-2 py-1 rounded-md border border-[var(--warning)]/30">
                  Fixed Date (Locked)
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsFormMaximized((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium rounded-md transition-colors shadow-xs"
                title={isFormMaximized ? 'Restore Normal Page View' : 'Maximize Fullscreen Form'}
              >
                {isFormMaximized ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-[var(--accent)]" /> Restore View
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-[var(--accent)]" /> Maximize Form
                  </>
                )}
              </button>
            </div>
          </div>

          {isEditingExisting && (
            <div className="flex items-center gap-2 bg-[var(--warning-soft)] text-[var(--warning)] px-3 py-2 rounded-md text-xs font-sans">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Submitting will update existing record for this date</span>
            </div>
          )}
        </div>
        <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
            <div>
              <span className="text-[10px] font-sans tracking-widest uppercase text-[var(--text-tertiary)]">
                Live Calculated Metric
              </span>
              <h3 className="text-xl font-serif font-normal text-[var(--text-primary)] flex items-center gap-2 mt-0.5">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" /> Daily Recovery Index
              </h3>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-right">
                <span className="text-3xl font-sans font-semibold text-[var(--text-primary)]">
                  {calculatedMetrics.recoveryIndexScore}
                </span>
                <span className="text-xs font-sans text-[var(--text-tertiary)]"> / 50</span>
              </div>
              <div className="text-sm font-sans font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full">
                {calculatedMetrics.recoveryIndexPercentage}%
              </div>
            </div>
          </div>

          <p className="text-xs font-sans text-[var(--text-secondary)] leading-relaxed">
            The Recovery Index accounts for the metrics selected in your active protocol schema:
            {(() => {
              const activeRecoveryMetrics = effectiveSchema.metrics.filter(
                (m) => m.type === 'slider' && m.active !== false && effectiveSchema.recoveryIndexMetricIds.includes(m.id)
              );
              if (activeRecoveryMetrics.length === 0) {
                return <span className="italic text-[var(--text-tertiary)]"> (No slider metrics currently selected in protocol editor)</span>;
              }
              return (
                <span>
                  {' '}
                  {activeRecoveryMetrics.map((m, idx) => (
                    <React.Fragment key={m.id}>
                      <strong>{m.name}</strong>
                      {idx < activeRecoveryMetrics.length - 2 ? ', ' : idx === activeRecoveryMetrics.length - 2 ? ', and ' : '.'}
                    </React.Fragment>
                  ))}
                </span>
              );
            })()}
          </p>
        </div>

        {/* SECTION 1: SLEEP DATA */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 transition-all">
          <div
            onClick={() => toggleSectionCollapse('sleep')}
            className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-base font-sans font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                1. Sleep Parameters
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMaximizedCategoryId(maximizedCategoryId === 'sleep' ? null : 'sleep');
                }}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--surface-raised)] rounded transition-colors"
                title={maximizedCategoryId === 'sleep' ? 'Restore Page View' : 'Focus / Expand Category'}
              >
                {maximizedCategoryId === 'sleep' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button type="button" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded">
                {collapsedSections['sleep'] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!collapsedSections['sleep'] && (
            <div className="space-y-5 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Lights Out Time
                  </label>
                  <input
                    type="time"
                    required
                    value={lightsOut}
                    onChange={(e) => setLightsOut(e.target.value)}
                    className="w-full border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--border-strong)]"
                  />
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">When you got into bed & turned lights off.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Estimated Sleep Time
                  </label>
                  <input
                    type="time"
                    required
                    value={estimatedSleepTime}
                    onChange={(e) => setEstimatedSleepTime(e.target.value)}
                    className="w-full border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--border-strong)]"
                  />
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Estimated time you fell asleep.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Natural / Final Wake Time
                  </label>
                  <input
                    type="time"
                    required
                    value={naturalWakeTime}
                    onChange={(e) => setNaturalWakeTime(e.target.value)}
                    className="w-full border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--border-strong)]"
                  />
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">When you woke up to start your day.</p>
                </div>
              </div>

              {/* Calculated Sleep Duration Readout */}
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Estimated Total Sleep Duration:
                  </span>
                </div>
                <div className="text-sm font-sans font-semibold text-[var(--text-primary)]">
                  {calculatedMetrics.totalSleepFormatted}
                  <span className="text-xs font-normal text-[var(--text-tertiary)] ml-2">
                    ({calculatedMetrics.totalSleepMinutes} minutes)
                  </span>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* DYNAMIC CATEGORIES RENDER (Categories from Study Schema) */}
        {effectiveSchema.categories
          .filter((cat) => cat.id !== 'cat-sleep')
          .sort((a, b) => a.order - b.order)
          .map((cat, catIdx) => {
            const catMetrics = effectiveSchema.metrics
              .filter((m) => m.categoryId === cat.id && m.active !== false)
              .sort((a, b) => a.order - b.order);

            return (
              <section
                key={cat.id}
                className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 transition-all"
              >
                <div
                  onClick={() => toggleSectionCollapse(cat.id)}
                  className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[var(--accent)]" />
                    <div>
                      <h2 className="text-base font-sans font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        {catIdx + 2}. {cat.name}
                      </h2>
                      {cat.description && (
                        <p className="text-xs text-[var(--text-tertiary)]">{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMaximizedCategoryId(maximizedCategoryId === cat.id ? null : cat.id);
                      }}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--surface-raised)] rounded transition-colors"
                      title={maximizedCategoryId === cat.id ? 'Restore Page View' : 'Focus / Expand Category'}
                    >
                      {maximizedCategoryId === cat.id ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button type="button" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded">
                      {collapsedSections[cat.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {!collapsedSections[cat.id] && (
                  <div className="pt-5 space-y-4">
                    {catMetrics.length === 0 ? (
                      <p className="text-xs text-[var(--text-tertiary)] italic">
                        No active metrics in this category. Click &quot;Customize Protocol Structure&quot; to add metrics.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {catMetrics.map((m) => renderMetricItem(m, 0))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}

        {/* SECTION 6: CONFOUNDING FACTORS */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 transition-all">
          <div
            onClick={() => toggleSectionCollapse('confounders')}
            className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--warning)]" />
              <div>
                <h2 className="text-base font-sans font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  6. Potential Confounding Factors
                </h2>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Select variables that occurred today.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfounderManagerOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-secondary)] font-sans text-xs rounded-md transition-colors"
                title="Manage custom confounding factors"
              >
                <Settings className="w-3.5 h-3.5" /> Manage Factors
              </button>
              <button type="button" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded">
                {collapsedSections['confounders'] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!collapsedSections['confounders'] && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-5">
              {confounderOptions.map((item) => {
                const isChecked = confounders.includes(item);
                return (
                  <label
                    key={item}
                    className={`flex items-center gap-2 p-2.5 rounded-md border text-xs font-sans cursor-pointer transition-colors ${isChecked
                      ? 'bg-[var(--accent)] text-white border-transparent font-medium'
                      : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleConfounderToggle(item)}
                      className="rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0"
                    />
                    <span className="select-none">{item}</span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 7: ADDITIONAL (USER-DEFINED CUSTOM METRICS) */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 transition-all">
          <div
            onClick={() => toggleSectionCollapse('custom')}
            className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <h2 className="text-base font-sans font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  7. Custom Variables
                </h2>
                <p className="text-xs text-[var(--text-tertiary)]">
                  User-defined experimental variables created for custom tracking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingMetric(null);
                  setIsBuilderOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] font-sans text-xs font-medium rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent)]" /> Create Custom Metric
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsManagerOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-secondary)] font-sans text-xs rounded-md transition-colors"
                title="Manage custom metric templates & ordering"
              >
                <Settings className="w-3.5 h-3.5" /> Manage
              </button>
              <button type="button" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded">
                {collapsedSections['custom'] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!collapsedSections['custom'] && (
            <div className="pt-5">
              {activeCustomMetrics.length === 0 ? (
                <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-6 text-center space-y-3">
                  <p className="text-xs font-sans text-[var(--text-tertiary)] italic">
                    No additional custom metrics created yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMetric(null);
                      setIsBuilderOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] text-white font-sans text-xs font-medium rounded-md hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Custom Metric
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeCustomMetrics.map((def) => (
                    <CustomMetricInput
                      key={def.id}
                      definition={def}
                      value={additionalMetrics[def.id]}
                      onChange={(newVal) => handleCustomMetricChange(def.id, newVal)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* FORM ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans font-medium text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--accent)] text-white font-sans font-medium text-xs rounded-md hover:bg-[var(--accent-hover)] transition-colors shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" /> {isDateLocked || isEditingExisting ? 'Save Changes' : 'Save Daily Entry'}
          </button>
        </div>
        {/* CATEGORY FOCUS / MAXIMIZE OVERLAY */}
        {maximizedCategoryId && isMounted && createPortal(
          <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[var(--canvas)] p-4 md:p-8 overflow-y-auto font-sans text-[var(--text-primary)] transition-all duration-200">
            <div className="w-full space-y-6">
              {/* Focus Bar */}
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold block">
                      Focused Category Workspace
                    </span>
                    <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                      {getFocusedCategoryTitle(maximizedCategoryId)}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={!canNavigatePrevCategory}
                    onClick={handleNavigatePrevCategory}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium rounded-md disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Category
                  </button>
                  <button
                    type="button"
                    disabled={!canNavigateNextCategory}
                    onClick={handleNavigateNextCategory}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium rounded-md disabled:opacity-30 transition-colors"
                  >
                    Next Category <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaximizedCategoryId(null)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium rounded-md transition-colors shadow-xs"
                  >
                    <Minimize2 className="w-4 h-4" /> Exit Focus Mode
                  </button>
                </div>
              </div>

              {/* Focused Content Container */}
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-xl p-6 shadow-sm space-y-4">
                <div className="text-xs text-[var(--text-secondary)] border-b border-[var(--border-default)] pb-3 font-medium">
                  Showing all observations and branching logic for category: <strong className="text-[var(--text-primary)]">&quot;{getFocusedCategoryTitle(maximizedCategoryId)}&quot;</strong>
                </div>

                {/* Render Focused Content */}
                {maximizedCategoryId === 'sleep' && (
                  <div className="space-y-5 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                          Lights Out Time
                        </label>
                        <input
                          type="time"
                          required
                          value={lightsOut}
                          onChange={(e) => setLightsOut(e.target.value)}
                          className="w-full border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-sans bg-[var(--surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--border-strong)]"
                        />
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">When you got into bed & turned lights off.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                          Estimated Sleep Time
                        </label>
                        <input
                          type="time"
                          required
                          value={estimatedSleepTime}
                          onChange={(e) => setEstimatedSleepTime(e.target.value)}
                          className="w-full border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-sans bg-[var(--surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--border-strong)]"
                        />
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Estimated time you fell asleep.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                          Natural / Final Wake Time
                        </label>
                        <input
                          type="time"
                          required
                          value={naturalWakeTime}
                          onChange={(e) => setNaturalWakeTime(e.target.value)}
                          className="w-full border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-sans bg-[var(--surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--border-strong)]"
                        />
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">When you woke up to start your day.</p>
                      </div>
                    </div>

                    <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-md p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                          Estimated Total Sleep Duration:
                        </span>
                      </div>
                      <div className="text-sm font-sans font-semibold text-[var(--text-primary)]">
                        {calculatedMetrics.totalSleepFormatted}
                        <span className="text-xs font-normal text-[var(--text-tertiary)] ml-2">
                          ({calculatedMetrics.totalSleepMinutes} minutes)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {maximizedCategoryId === 'confounders' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
                      <span className="text-xs font-medium text-[var(--text-secondary)]">Select Confounding Factors</span>
                      <button
                        type="button"
                        onClick={() => setIsConfounderManagerOpen(true)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[var(--surface)] hover:bg-[var(--border-default)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-[var(--accent)]" /> Customize Confounders List
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {confounderOptions.map((conf) => {
                        const isSelected = confounders.includes(conf);
                        return (
                          <button
                            key={conf}
                            type="button"
                            onClick={() => {
                              setConfounders((prev) =>
                                prev.includes(conf) ? prev.filter((c) => c !== conf) : [...prev, conf]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-sans transition-colors border ${isSelected
                              ? 'bg-[var(--accent)] text-white border-transparent shadow-xs font-medium'
                              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
                              }`}
                          >
                            {conf}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {maximizedCategoryId !== 'sleep' && maximizedCategoryId !== 'confounders' && (
                  <div className="pt-2 space-y-4">
                    {(() => {
                      const catMetrics = effectiveSchema.metrics
                        .filter((m) => m.categoryId === maximizedCategoryId && m.active !== false)
                        .sort((a, b) => a.order - b.order);

                      if (catMetrics.length === 0) {
                        return (
                          <p className="text-xs text-[var(--text-tertiary)] italic">
                            No active metrics in this category.
                          </p>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {catMetrics.map((m) => renderMetricItem(m, 0))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </form>

      {/* CONFOUNDER MANAGER MODAL */}
      <ConfounderManagerModal
        isOpen={isConfounderManagerOpen}
        onClose={() => setIsConfounderManagerOpen(false)}
        onConfoundersChanged={(updatedList) => setConfounderOptions(updatedList)}
      />

      {/* CUSTOM METRIC BUILDER MODAL */}
      {isBuilderOpen && (
        <CustomMetricBuilder
          initialMetric={editingMetric}
          userId={userId}
          onSave={() => {
            setIsBuilderOpen(false);
            setEditingMetric(null);
            refreshCustomMetrics();
          }}
          onCancel={() => {
            setIsBuilderOpen(false);
            setEditingMetric(null);
          }}
        />
      )}

      {/* CUSTOM METRIC MANAGER MODAL */}
      {isManagerOpen && (
        <CustomMetricManager
          userId={userId}
          onClose={() => setIsManagerOpen(false)}
          onEditMetric={(metric) => {
            setIsManagerOpen(false);
            setEditingMetric(metric);
            setIsBuilderOpen(true);
          }}
          onCreateNewMetric={() => {
            setIsManagerOpen(false);
            setEditingMetric(null);
            setIsBuilderOpen(true);
          }}
          onMetricsUpdated={refreshCustomMetrics}
        />
      )}
    </>
  );

  if (isFormMaximized && isMounted) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[var(--canvas)] p-4 md:p-8 overflow-y-auto font-sans text-[var(--text-primary)] transition-all duration-200">
        <div className="max-w-4xl mx-auto space-y-6">
          {mainFormBody}
        </div>
      </div>,
      document.body
    );
  }

  return mainFormBody;
};
