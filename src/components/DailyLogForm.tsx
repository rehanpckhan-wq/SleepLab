import React, { useState, useEffect } from 'react';
import {
  DailyEntry,
  AwakeningReason,
  SleepyBeforeBedOption,
  ConfoundingFactor,
  CustomMetricDefinition,
} from '@/types/sleeplab';
import { SliderField } from './SliderField';
import { computeMetrics } from '@/lib/calculations';
import {
  getEntryByDate,
  saveEntryAsync,
  calculateDayNumber,
  getStoredStartDate,
  fetchCustomMetricDefinitionsAsync,
} from '@/lib/storage';
import { CustomMetricInput } from './CustomMetricInput';
import { CustomMetricBuilder } from './CustomMetricBuilder';
import { CustomMetricManager } from './CustomMetricManager';
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
} from 'lucide-react';

interface DailyLogFormProps {
  initialEntry?: DailyEntry | null;
  userId?: string | null;
  onSaved: (savedEntry: DailyEntry) => void;
  onCancel?: () => void;
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
  initialEntry,
  userId,
  onSaved,
  onCancel,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

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

  // Modal states
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<CustomMetricDefinition | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Feedback banner state
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const refreshCustomMetrics = async () => {
    const loaded = await fetchCustomMetricDefinitionsAsync(userId);
    setCustomMetricDefs(loaded);
  };

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
      } else {
        setIsEditingExisting(false);
      }
    }
  }, [date, initialEntry]);

  // Active custom metrics
  const activeCustomMetrics = customMetricDefs.filter((m) => m.active !== false);

  // Compute live metrics
  const calculatedMetrics = computeMetrics(
    estimatedSleepTime,
    naturalWakeTime,
    { morningAlertness, sleepInertia, mood, motivation },
    { skinHealth, muscleFullness, workoutEnergy, bodyFreshness },
    { afternoonEnergy, focus, afternoonSlump }
  );

  const startDate = getStoredStartDate() || date;
  const dayNumber = initialEntry?.dayNumber || calculateDayNumber(startDate, date);

  const handleAwakeningReasonToggle = (reason: AwakeningReason) => {
    if (awakeningReasons.includes(reason)) {
      setAwakeningReasons(awakeningReasons.filter((r) => r !== reason));
    } else {
      setAwakeningReasons([...awakeningReasons, reason]);
    }
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
      calculatedMetrics,
      createdAt: initialEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const { isUpdate } = await saveEntryAsync(entryToSave, userId);

      setSaveSuccessMsg(
        isUpdate
          ? `Entry for ${date} (Day ${dayNumber}) updated successfully.`
          : `Entry for ${date} (Day ${dayNumber}) saved successfully.`
      );

      setTimeout(() => {
        onSaved(entryToSave);
      }, 400);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to save entry. Please check your network connection.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
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
                onChange={(e) => setDate(e.target.value)}
                className="border border-[var(--border-default)] rounded-md px-3 py-1.5 text-xs font-sans focus:outline-none focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--accent-soft)] bg-[var(--surface-raised)] text-[var(--text-primary)]"
              />
            </div>
          </div>

          {isEditingExisting && (
            <div className="flex items-center gap-2 bg-[var(--warning-soft)] text-[var(--warning)] px-3 py-2 rounded-md text-xs font-sans">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Existing record loaded for this date. Submitting will update this record.</span>
            </div>
          )}
        </div>

        {/* Live Calculated Index Header Banner */}
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
            The Recovery Index is calculated automatically as the unweighted average of 5 core subjective markers:
            <strong> Morning Alertness</strong>, <strong>Mood</strong>, <strong>Skin Health</strong>, <strong>Muscle Fullness</strong>, and <strong>Afternoon Energy</strong>.
          </p>
        </div>

        {/* SECTION 1: SLEEP DATA */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
            <Moon className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">1. Sleep Parameters</h2>
          </div>

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

          {/* Alarm & Awakenings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Woke Up to Alarm?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-[var(--text-primary)]">
                  <input
                    type="radio"
                    name="alarmWake"
                    checked={alarmWake === true}
                    onChange={() => setAlarmWake(true)}
                    className="accent-[var(--accent)]"
                  />
                  Yes (Alarm)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-[var(--text-primary)]">
                  <input
                    type="radio"
                    name="alarmWake"
                    checked={alarmWake === false}
                    onChange={() => setAlarmWake(false)}
                    className="accent-[var(--accent)]"
                  />
                  No (Natural Wake)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Number of Awakenings
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={numberOfAwakenings}
                onChange={(e) => setNumberOfAwakenings(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-32 border border-[var(--border-default)] rounded-md px-3 py-1.5 text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>
          </div>

          {/* Awakening Reasons */}
          {numberOfAwakenings > 0 && (
            <div className="pt-2 border-t border-[var(--border-default)]">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Awakening Reason(s)
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_AWAKENING_REASONS.map((reason) => {
                  const isSelected = awakeningReasons.includes(reason);
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => handleAwakeningReasonToggle(reason)}
                      className={`px-3 py-1 rounded-full text-xs font-sans transition-colors border ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white border-transparent'
                          : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: MORNING ASSESSMENT */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
            <Sun className="w-4 h-4 text-[var(--warning)]" />
            <div>
              <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">2. Morning Assessment</h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                Logged ~45 minutes post-wake, after standard morning routine.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SliderField
              label="Morning Alertness"
              sublabel="Degree of sharpness and wakefulness (Contributes to Recovery Index)"
              value={morningAlertness}
              onChange={setMorningAlertness}
              minLabel="1 (Brain fog)"
              maxLabel="10 (Fully sharp)"
            />
            <SliderField
              label="Sleep Inertia"
              sublabel="Heavy grogginess or difficulty transitioning out of sleep"
              value={sleepInertia}
              onChange={setSleepInertia}
              minLabel="1 (Clear wakefulness)"
              maxLabel="10 (Severe grogginess)"
            />
            <SliderField
              label="Mood"
              sublabel="Subjective emotional state upon starting day (Contributes to Recovery Index)"
              value={mood}
              onChange={setMood}
              minLabel="1 (Irritable/Low)"
              maxLabel="10 (Positive/Upbeat)"
            />
            <SliderField
              label="Motivation"
              sublabel="Drive and enthusiasm to undertake daily goals"
              value={motivation}
              onChange={setMotivation}
              minLabel="1 (Apathetic)"
              maxLabel="10 (Driven)"
            />
          </div>
        </section>

        {/* SECTION 3: RECOVERY */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
            <Battery className="w-4 h-4 text-[var(--success)]" />
            <div>
              <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">3. Physical & Subjective Recovery</h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                Subjective physiological observations. Not objective clinical telemetry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SliderField
              label="Skin Health"
              sublabel="Subjective clarity, hydration, and tone (Contributes to Recovery Index)"
              value={skinHealth}
              onChange={setSkinHealth}
              minLabel="1 (Dull/Inflamed)"
              maxLabel="10 (Clear/Vibrant)"
            />
            <SliderField
              label="Muscle Fullness"
              sublabel="Perceived glycogen fullness & physical tone (Contributes to Recovery Index)"
              value={muscleFullness}
              onChange={setMuscleFullness}
              minLabel="1 (Flat/Depleted)"
              maxLabel="10 (Full/Pumped)"
            />
            <SliderField
              label="Workout Energy"
              sublabel="Physical readiness for physical exertion or training"
              value={workoutEnergy}
              onChange={setWorkoutEnergy}
              minLabel="1 (Exhausted)"
              maxLabel="10 (Peak readiness)"
            />
            <SliderField
              label="Body Freshness"
              sublabel="Absence of systemic soreness or physical fatigue"
              value={bodyFreshness}
              onChange={setBodyFreshness}
              minLabel="1 (Heavy soreness)"
              maxLabel="10 (Completely fresh)"
            />
          </div>
        </section>

        {/* SECTION 4: AFTERNOON */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
            <Sun className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">4. Afternoon Functioning</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SliderField
              label="Afternoon Energy"
              sublabel="Sustained physical energy around 14:00 - 16:00 (Contributes to Recovery Index)"
              value={afternoonEnergy}
              onChange={setAfternoonEnergy}
              minLabel="1 (Drained)"
              maxLabel="10 (High vitality)"
            />
            <SliderField
              label="Cognitive Focus"
              sublabel="Ability to maintain mental concentration without brain fog"
              value={focus}
              onChange={setFocus}
              minLabel="1 (Distracted)"
              maxLabel="10 (Laser focus)"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Experienced Afternoon Slump?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-[var(--text-primary)]">
                <input
                  type="radio"
                  name="afternoonSlump"
                  checked={afternoonSlump === true}
                  onChange={() => setAfternoonSlump(true)}
                  className="accent-[var(--accent)]"
                />
                Yes (Severe drop in energy)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-[var(--text-primary)]">
                <input
                  type="radio"
                  name="afternoonSlump"
                  checked={afternoonSlump === false}
                  onChange={() => setAfternoonSlump(false)}
                  className="accent-[var(--accent)]"
                />
                No (Steady energy)
              </label>
            </div>
          </div>
        </section>

        {/* SECTION 5: EVENING & NOTES */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
            <Moon className="w-4 h-4 text-[var(--text-primary)]" />
            <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">5. Evening Readiness & Notes</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Did I naturally feel sleepy before bedtime?
            </label>
            <div className="flex flex-wrap gap-4">
              {(['Yes', 'Somewhat', 'No'] as SleepyBeforeBedOption[]).map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer text-xs font-sans text-[var(--text-primary)]"
                >
                  <input
                    type="radio"
                    name="sleepyBeforeBed"
                    checked={naturallySleepyBeforeBed === option}
                    onChange={() => setNaturallySleepyBeforeBed(option)}
                    className="accent-[var(--accent)]"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Qualitative Observations / Daily Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record anything noteworthy: subjective reflections, stress, diet variations, environment..."
              className="w-full border border-[var(--border-default)] rounded-md p-3 text-xs font-serif bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--border-strong)]"
            />
          </div>
        </section>

        {/* SECTION 6: CONFOUNDING FACTORS */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
            <ShieldAlert className="w-4 h-4 text-[var(--warning)]" />
            <div>
              <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">
                6. Potential Confounding Factors
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                Select variables that occurred today.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {ALL_CONFOUNDERS.map((item) => {
              const isChecked = confounders.includes(item);
              return (
                <label
                  key={item}
                  className={`flex items-center gap-2 p-2.5 rounded-md border text-xs font-sans cursor-pointer transition-colors ${
                    isChecked
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
        </section>

        {/* SECTION 7: ADDITIONAL (USER-DEFINED CUSTOM METRICS) */}
        <section className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">7. Custom Variables</h2>
                <p className="text-xs text-[var(--text-tertiary)]">
                  User-defined experimental variables created for custom tracking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingMetric(null);
                  setIsBuilderOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] font-sans text-xs font-medium rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent)]" /> Create Custom Metric
              </button>
              <button
                type="button"
                onClick={() => setIsManagerOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-secondary)] font-sans text-xs rounded-md transition-colors"
                title="Manage custom metric templates & ordering"
              >
                <Settings className="w-3.5 h-3.5" /> Manage
              </button>
            </div>
          </div>

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
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--accent)] text-white font-sans font-medium text-xs rounded-md hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" /> Save Daily Entry
          </button>
        </div>
      </form>

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
};
