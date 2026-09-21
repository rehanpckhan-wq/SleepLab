import React from 'react';
import { DailyEntry, CustomMetricDefinition } from '@/types/sleeplab';
import { getCustomMetricDefinitions, generateReportId } from '@/lib/storage';
import {
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ShieldAlert,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Printer,
} from 'lucide-react';

import { StudyConfig } from '@/types/sleeplab';
import { SingleReportPrint } from './SingleReportPrint';

interface DailyReportProps {
  entry: DailyEntry;
  allEntries: DailyEntry[];
  studyConfig?: StudyConfig;
  exportEntries?: DailyEntry[];
  exportScopeLabel?: string;
  onBackToHistory: () => void;
  onEditEntry: (entry: DailyEntry) => void;
  onNavigateToEntry: (entry: DailyEntry) => void;
  onOpenExportDialog?: () => void;
}

export const DailyReport: React.FC<DailyReportProps> = ({
  entry,
  allEntries,
  studyConfig,
  exportEntries,
  exportScopeLabel,
  onBackToHistory,
  onEditEntry,
  onNavigateToEntry,
  onOpenExportDialog,
}) => {
  const reportId = entry.reportId || generateReportId(entry.date, entry.dayNumber);
  const customMetricDefs = getCustomMetricDefinitions();
  const metricDefsMap = new Map<string, CustomMetricDefinition>(
    customMetricDefs.map((m) => [m.id, m])
  );

  // Sort entries chronologically to find previous and next entry
  const sortedEntries = [...allEntries].sort((a, b) => a.date.localeCompare(b.date));
  const currentIndex = sortedEntries.findIndex((e) => e.id === entry.id || e.date === entry.date);

  const prevEntry = currentIndex > 0 ? sortedEntries[currentIndex - 1] : null;
  const nextEntry =
    currentIndex >= 0 && currentIndex < sortedEntries.length - 1
      ? sortedEntries[currentIndex + 1]
      : null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formatDateTitle = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderScoreBar = (value: number, max: number = 10, label: string, subtext?: string) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div className="bg-[var(--surface-raised)] p-4 rounded-lg border border-[var(--border-default)] space-y-2 break-inside-avoid">
        <div className="flex justify-between items-baseline">
          <div>
            <div className="text-xs font-sans font-medium text-[var(--text-primary)]">{label}</div>
            {subtext && <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{subtext}</div>}
          </div>
          <div className="font-sans text-base font-semibold text-[var(--text-primary)]">
            {value} <span className="text-xs text-[var(--text-tertiary)] font-normal">/ {max}</span>
          </div>
        </div>
        <div className="w-full bg-[var(--border-default)] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[var(--accent)] h-full transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const formatCustomMetricObservation = (def: CustomMetricDefinition | undefined, val: any) => {
    if (val === undefined || val === null || val === '') return 'Not recorded';
    if (!def) return String(val);

    switch (def.type) {
      case 'checkbox':
        return val === true ? 'Yes' : 'No';
      case 'slider':
        return `${val} / ${def.config?.max || 10}${def.config?.unit ? ` ${def.config.unit}` : ''}`;
      case 'number':
        return `${val}${def.config?.unit ? ` ${def.config.unit}` : ''}`;
      case 'time':
        return String(val);
      case 'duration':
        return String(val);
      case 'text':
        return String(val);
      default:
        return String(val);
    }
  };

  const recordedAdditionalEntries = entry.additionalMetrics
    ? Object.entries(entry.additionalMetrics).filter(([metricId, val]) => {
        if (val === undefined || val === null || val === '') return false;
        const def = metricDefsMap.get(metricId);
        return def && def.active !== false;
      })
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* 1. INTERACTIVE SCREEN VIEW (Hidden during printing) */}
      <div className="space-y-6 print:hidden">
        {/* Navigation Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)] p-4 rounded-lg border border-[var(--border-default)] no-print">
          <button
            onClick={onBackToHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] text-[var(--text-primary)] border border-[var(--border-default)] text-xs font-sans font-medium rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to All Days
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {prevEntry ? (
              <button
                onClick={() => onNavigateToEntry(prevEntry)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-sans rounded-md transition-colors"
                title={`View Day ${prevEntry.dayNumber} (${prevEntry.date})`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Day {prevEntry.dayNumber}
              </button>
            ) : (
              <span className="px-3 py-1.5 text-xs font-sans text-[var(--text-tertiary)] border border-[var(--border-default)] rounded-md cursor-not-allowed">
                ← First Day
              </span>
            )}

            <span className="text-xs font-sans text-[var(--text-secondary)] px-1">
              Day {entry.dayNumber} of {sortedEntries.length}
            </span>

            {nextEntry ? (
              <button
                onClick={() => onNavigateToEntry(nextEntry)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-sans rounded-md transition-colors"
                title={`View Day ${nextEntry.dayNumber} (${nextEntry.date})`}
              >
                Day {nextEntry.dayNumber} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="px-3 py-1.5 text-xs font-sans text-[var(--text-tertiary)] border border-[var(--border-default)] rounded-md cursor-not-allowed">
                Latest Day →
              </span>
            )}

            <button
              onClick={onOpenExportDialog || handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-sans font-medium rounded-md transition-colors ml-2"
            >
              <Printer className="w-4 h-4 text-[var(--accent)]" /> Export PDF Report
            </button>

            <button
              onClick={() => onEditEntry(entry)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-sans font-medium rounded-md transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Record
            </button>
          </div>
        </div>

        {/* SCREEN INTERACTIVE ARTICLE */}
        <article className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-6 sm:p-10 space-y-8 font-sans transition-colors duration-200">
          {/* DOCUMENT HEADER */}
          <header className="border-b border-[var(--border-default)] pb-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-sans text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
                <FlaskConical className="w-4 h-4 text-[var(--accent)]" /> SLEEP LAB RESEARCH NOTEBOOK
              </span>
              <div className="flex items-center gap-3">
                <span>DAY {entry.dayNumber} / 30 REPORT</span>
                <span className="text-[var(--text-secondary)] font-mono text-[11px] bg-[var(--surface-raised)] border border-[var(--border-default)] px-2 py-0.5 rounded-full">
                  ID: {reportId}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-serif font-normal text-[var(--text-primary)] tracking-tight">
                Daily Sleep & Recovery Report
              </h1>
              <p className="text-xs font-sans text-[var(--text-secondary)] flex items-center gap-2 pt-1">
                <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                {formatDateTitle(entry.date)} ({entry.date})
              </p>
            </div>

            {/* Key Metrics Overview Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-sans tracking-wider text-[var(--text-secondary)] block">
                    Estimated Total Sleep
                  </span>
                  <span className="text-2xl font-sans font-semibold text-[var(--text-primary)]">
                    {entry.calculatedMetrics.totalSleepFormatted}
                  </span>
                </div>
                <div className="text-xs font-sans text-[var(--text-tertiary)] bg-[var(--surface)] px-2.5 py-1 rounded-full border border-[var(--border-default)]">
                  {entry.calculatedMetrics.totalSleepMinutes} mins
                </div>
              </div>

              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-sans tracking-wider text-[var(--text-secondary)] block">
                    Daily Recovery Index
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-sans font-semibold text-[var(--text-primary)]">
                      {entry.calculatedMetrics.recoveryIndexScore}
                    </span>
                    <span className="text-xs font-sans text-[var(--text-tertiary)]">/ 50</span>
                  </div>
                </div>
                <div className="text-sm font-sans font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 rounded-full">
                  {entry.calculatedMetrics.recoveryIndexPercentage}%
                </div>
              </div>
            </div>
          </header>

          {/* 01 — SLEEP PARAMETERS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
              <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <span className="font-sans text-xs text-[var(--accent)] font-medium">01 —</span> Sleep Parameters
              </h2>
              <span className="text-xs font-sans text-[var(--text-tertiary)]">Raw Sleep Logs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-raised)] border-b border-[var(--border-default)] text-[var(--text-secondary)] font-sans uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Parameter</th>
                    <th className="py-2.5 px-4 font-medium">Recorded Observation</th>
                    <th className="py-2.5 px-4 font-medium text-right">Data Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">Lights Out</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-[var(--text-primary)]">
                      {entry.sleep.lightsOut}
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--text-tertiary)]">
                      Raw Input
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">Estimated Sleep Time</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-[var(--text-primary)]">
                      {entry.sleep.estimatedSleepTime}
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--text-tertiary)]">
                      Raw Input
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">Natural / Final Wake Time</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-[var(--text-primary)]">
                      {entry.sleep.naturalWakeTime}
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--text-tertiary)]">
                      Raw Input
                    </td>
                  </tr>
                  <tr className="bg-[var(--surface-raised)]">
                    <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">
                      Estimated Total Sleep Duration
                    </td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-[var(--accent)]">
                      {entry.calculatedMetrics.totalSleepFormatted} ({entry.calculatedMetrics.totalSleepMinutes}m)
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--accent)] font-medium">
                      Calculated Metric
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">Woke Up to Alarm?</td>
                    <td className="py-2.5 px-4 font-sans font-medium">
                      {entry.sleep.alarmWake ? (
                        <span className="inline-flex items-center gap-1 text-[var(--warning)] bg-[var(--warning-soft)] px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Yes (Alarm)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--success)] bg-[var(--success-soft)] px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> No (Natural Wake)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--text-tertiary)]">
                      Raw Input
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">Number of Awakenings</td>
                    <td className="py-2.5 px-4 font-sans font-medium text-[var(--text-primary)]">
                      {entry.sleep.numberOfAwakenings}
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--text-tertiary)]">
                      Raw Input
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">Awakening Reason(s)</td>
                    <td className="py-2.5 px-4">
                      {entry.sleep.awakeningReasons.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.sleep.awakeningReasons.map((reason) => (
                            <span
                              key={reason}
                              className="px-2.5 py-0.5 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-full text-[11px] text-[var(--text-secondary)] font-sans"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)] italic font-sans">None reported</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--text-tertiary)]">
                      Raw Input
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 02 — MORNING ASSESSMENT */}
          {(!entry.mutedMetrics?.includes('morningAlertness') ||
            !entry.mutedMetrics?.includes('sleepInertia') ||
            !entry.mutedMetrics?.includes('mood') ||
            !entry.mutedMetrics?.includes('motivation')) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                  <span className="font-sans text-xs text-[var(--accent)] font-medium">02 —</span> Morning Assessment
                </h2>
                <span className="text-xs font-sans text-[var(--text-tertiary)]">~45 mins post-wake</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!entry.mutedMetrics?.includes('morningAlertness') &&
                  renderScoreBar(
                    entry.morning.morningAlertness,
                    10,
                    'Morning Alertness',
                    'Sharpness and wakefulness (Contributes to Recovery Index)'
                  )}
                {!entry.mutedMetrics?.includes('sleepInertia') &&
                  renderScoreBar(
                    entry.morning.sleepInertia,
                    10,
                    'Sleep Inertia',
                    'Heavy grogginess or difficulty waking up'
                  )}
                {!entry.mutedMetrics?.includes('mood') &&
                  renderScoreBar(
                    entry.morning.mood,
                    10,
                    'Subjective Mood',
                    'Emotional state (Contributes to Recovery Index)'
                  )}
                {!entry.mutedMetrics?.includes('motivation') &&
                  renderScoreBar(
                    entry.morning.motivation,
                    10,
                    'Daily Motivation',
                    'Drive and eagerness for daily tasks'
                  )}
              </div>
            </section>
          )}

          {/* 03 — PHYSICAL & SUBJECTIVE RECOVERY */}
          {(!entry.mutedMetrics?.includes('skinHealth') ||
            !entry.mutedMetrics?.includes('muscleFullness') ||
            !entry.mutedMetrics?.includes('workoutEnergy') ||
            !entry.mutedMetrics?.includes('bodyFreshness')) && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                  <span className="font-sans text-xs text-[var(--accent)] font-medium">03 —</span> Physical & Subjective Recovery
                </h2>
                <span className="text-xs font-sans text-[var(--text-tertiary)]">Physiological Markers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!entry.mutedMetrics?.includes('skinHealth') &&
                  renderScoreBar(
                    entry.recovery.skinHealth,
                    10,
                    'Skin Health Observation',
                    'Clarity, hydration & tone (Contributes to Recovery Index)'
                  )}
                {!entry.mutedMetrics?.includes('muscleFullness') &&
                  renderScoreBar(
                    entry.recovery.muscleFullness,
                    10,
                    'Muscle Fullness',
                    'Glycogen & physical tone (Contributes to Recovery Index)'
                  )}
                {!entry.mutedMetrics?.includes('workoutEnergy') &&
                  renderScoreBar(
                    entry.recovery.workoutEnergy,
                    10,
                    'Workout Energy',
                    'Readiness for physical training'
                  )}
                {!entry.mutedMetrics?.includes('bodyFreshness') &&
                  renderScoreBar(
                    entry.recovery.bodyFreshness,
                    10,
                    'Body Freshness',
                    'Absence of systemic muscle soreness'
                  )}
              </div>

              {/* Recovery Index Source Info Box */}
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[var(--text-primary)]">
                    <Award className="w-4 h-4 text-[var(--accent)]" /> RECOVERY INDEX BREAKDOWN
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Unweighted sum of core active markers.
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-[var(--border-default)] sm:pl-4 flex-shrink-0">
                  <div className="text-2xl font-sans font-semibold text-[var(--text-primary)]">
                    {entry.calculatedMetrics.recoveryIndexScore} / 50
                  </div>
                  <div className="text-xs font-sans text-[var(--accent)] font-medium">
                    {entry.calculatedMetrics.recoveryIndexPercentage}% Score
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 04 — AFTERNOON FUNCTIONING */}
          {(!entry.mutedMetrics?.includes('afternoonEnergy') ||
            !entry.mutedMetrics?.includes('focus') ||
            !entry.mutedMetrics?.includes('afternoonSlump')) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                  <span className="font-sans text-xs text-[var(--accent)] font-medium">04 —</span> Afternoon Functioning
                </h2>
                <span className="text-xs font-sans text-[var(--text-tertiary)]">Mid-Day Observation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!entry.mutedMetrics?.includes('afternoonEnergy') &&
                  renderScoreBar(
                    entry.afternoon.afternoonEnergy,
                    10,
                    'Afternoon Energy (14:00-16:00)',
                    'Sustained vitality (Contributes to Recovery Index)'
                  )}
                {!entry.mutedMetrics?.includes('focus') &&
                  renderScoreBar(
                    entry.afternoon.focus,
                    10,
                    'Cognitive Focus',
                    'Sustained concentration without brain fog'
                  )}
              </div>

              {!entry.mutedMetrics?.includes('afternoonSlump') && (
                <div className="bg-[var(--surface-raised)] p-3.5 rounded-lg border border-[var(--border-default)] flex items-center justify-between">
                  <span className="text-xs font-sans font-medium text-[var(--text-primary)]">Experienced Afternoon Slump?</span>
                  <span className="text-xs font-sans font-medium px-3 py-1 rounded-full">
                    {entry.afternoon.afternoonSlump ? (
                      <span className="text-[var(--danger)] bg-[var(--danger-soft)] px-2.5 py-0.5 rounded-full">Yes (Slump Observed)</span>
                    ) : (
                      <span className="text-[var(--success)] bg-[var(--success-soft)] px-2.5 py-0.5 rounded-full">No (Steady Energy)</span>
                    )}
                  </span>
                </div>
              )}
            </section>
          )}

          {/* 05 — EVENING READINESS & NOTES */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
              <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <span className="font-sans text-xs text-[var(--accent)] font-medium">05 —</span> Evening Readiness & Qualitative Notes
              </h2>
              <span className="text-xs font-sans text-[var(--text-tertiary)]">Pre-Bedtime Log</span>
            </div>

            <div className="bg-[var(--surface-raised)] p-3.5 rounded-lg border border-[var(--border-default)] flex items-center justify-between">
              <span className="text-xs font-sans font-medium text-[var(--text-primary)]">
                Naturally sleepy before bedtime?
              </span>
              <span className="text-xs font-sans font-medium px-3 py-1 bg-[var(--surface)] border border-[var(--border-default)] rounded-full text-[var(--text-primary)]">
                {entry.evening.naturallySleepyBeforeBed}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Qualitative Daily Reflections
              </span>
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg p-4 font-serif text-sm leading-relaxed text-[var(--text-primary)] min-h-[80px]">
                {entry.evening.notes && entry.evening.notes.trim().length > 0 ? (
                  <p className="whitespace-pre-wrap">{entry.evening.notes}</p>
                ) : (
                  <p className="text-[var(--text-tertiary)] italic font-sans text-xs">
                    No qualitative notes recorded for this day.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 06 — POTENTIAL CONFOUNDING FACTORS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
              <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <span className="font-sans text-xs text-[var(--accent)] font-medium">06 —</span> Potential Confounding Factors
              </h2>
              <span className="text-xs font-sans text-[var(--text-tertiary)]">Subgroup Analysis Variables</span>
            </div>

            {entry.confounders.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {entry.confounders.map((factor) => (
                  <span
                    key={factor}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-soft)] text-[var(--accent)] font-sans text-xs font-medium rounded-full border border-[var(--accent)]/30"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {factor}
                  </span>
                ))}
              </div>
            ) : (
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 text-xs font-sans text-[var(--text-tertiary)] italic">
                No potential confounding factors recorded for this observation day.
              </div>
            )}
          </section>

          {/* 07 — ADDITIONAL (USER-DEFINED CUSTOM METRICS) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
              <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <span className="font-sans text-xs text-[var(--accent)] font-medium">07 —</span> Additional (User-Defined Metrics)
              </h2>
              <span className="text-xs font-sans text-[var(--text-tertiary)]">Personal Variables</span>
            </div>

            {recordedAdditionalEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-sans text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--surface-raised)] border-b border-[var(--border-default)] text-[var(--text-secondary)] font-sans uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-4 font-medium">Custom Metric</th>
                      <th className="py-2.5 px-4 font-medium">Recorded Observation</th>
                      <th className="py-2.5 px-4 font-medium text-right">Metric Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {recordedAdditionalEntries.map(([metricId, val]) => {
                      const def = metricDefsMap.get(metricId);
                      const metricName = def ? def.name : metricId;
                      const metricType = def ? def.type : 'Custom';
                      const formattedObs = formatCustomMetricObservation(def, val);

                      return (
                        <tr key={metricId}>
                          <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">
                            {metricName}
                            {def?.description && (
                              <span className="block text-[11px] text-[var(--text-secondary)] font-normal mt-0.5">
                                {def.description}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-sans font-semibold text-[var(--accent)]">
                            {formattedObs}
                          </td>
                          <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--text-tertiary)] uppercase">
                            {metricType}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md p-4 text-xs font-sans text-[var(--text-tertiary)] italic">
                No user-defined custom metrics recorded for this day.
              </div>
            )}
          </section>

          {/* DOCUMENT FOOTER */}
          <footer className="border-t border-[var(--border-default)] pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-[var(--text-tertiary)] gap-2">
            <div>SleepLab N=1 Longitudinal Study · ID: <span className="font-medium text-[var(--text-primary)]">{reportId}</span> · Entry ID: {entry.id}</div>
            <div>Subjective Research Observations</div>
          </footer>
        </article>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between bg-[var(--surface)] p-4 rounded-lg border border-[var(--border-default)] no-print">
          <button
            onClick={onBackToHistory}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft className="w-4 h-4" /> Back to History List
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExportDialog || handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-sans font-medium rounded-md transition-colors"
            >
              <Printer className="w-4 h-4 text-[var(--accent)]" /> Export PDF Report
            </button>
            <button
              onClick={() => onEditEntry(entry)}
              className="flex items-center gap-2 px-5 py-2 bg-[var(--accent)] text-white text-xs font-sans font-medium rounded-md hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" /> Edit Day {entry.dayNumber} Record
            </button>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED SCIENTIFIC PRINT / PDF PRESENTATION */}
      <div className="hidden print:block font-sans text-paper-900 space-y-4">
        {exportEntries && exportEntries.length > 0 ? (
          exportEntries.map((expEntry, index) => (
            <React.Fragment key={expEntry.id || expEntry.date}>
              {index > 0 && <div className="print-page-break" />}
              <SingleReportPrint
                entry={expEntry}
                studyConfig={studyConfig}
                isFirstReport={index === 0}
                totalExportCount={exportEntries.length}
                exportScopeLabel={exportScopeLabel}
              />
            </React.Fragment>
          ))
        ) : (
          <SingleReportPrint
            entry={entry}
            studyConfig={studyConfig}
            isFirstReport={true}
            totalExportCount={1}
            exportScopeLabel={exportScopeLabel}
          />
        )}
      </div>
    </div>
  );
};
