import React from 'react';
import { DailyEntry, CustomMetricDefinition } from '@/types/sleeplab';
import { getCustomMetricDefinitions } from '@/lib/storage';
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
  Sliders,
} from 'lucide-react';

interface DailyReportProps {
  entry: DailyEntry;
  allEntries: DailyEntry[];
  onBackToHistory: () => void;
  onEditEntry: (entry: DailyEntry) => void;
  onNavigateToEntry: (entry: DailyEntry) => void;
}

export const DailyReport: React.FC<DailyReportProps> = ({
  entry,
  allEntries,
  onBackToHistory,
  onEditEntry,
  onNavigateToEntry,
}) => {
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
      <div className="bg-paper-50 p-3.5 rounded border border-paper-200 space-y-2 break-inside-avoid">
        <div className="flex justify-between items-baseline">
          <div>
            <div className="text-xs font-semibold text-paper-900">{label}</div>
            {subtext && <div className="text-[11px] text-academic-muted">{subtext}</div>}
          </div>
          <div className="font-mono text-base font-bold text-academic-navy">
            {value} <span className="text-xs text-academic-muted font-normal">/ {max}</span>
          </div>
        </div>
        <div className="w-full bg-paper-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-academic-navy h-full transition-all duration-300 rounded-full"
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
    ? Object.entries(entry.additionalMetrics).filter(
        ([_, val]) => val !== undefined && val !== null && val !== ''
      )
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* ========================================================================= */}
      {/* 1. INTERACTIVE SCREEN VIEW (Hidden during printing) */}
      {/* ========================================================================= */}
      <div className="space-y-6 print:hidden">
        {/* Navigation Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded border border-paper-200 shadow-sm no-print">
          <button
            onClick={onBackToHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-100 hover:bg-paper-200 text-paper-900 border border-paper-300 text-xs font-mono font-medium rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to All Days
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {prevEntry ? (
              <button
                onClick={() => onNavigateToEntry(prevEntry)}
                className="flex items-center gap-1 px-3 py-1.5 bg-paper-50 hover:bg-paper-100 border border-paper-300 text-paper-900 text-xs font-mono rounded transition-colors"
                title={`View Day ${prevEntry.dayNumber} (${prevEntry.date})`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Day {prevEntry.dayNumber}
              </button>
            ) : (
              <span className="px-3 py-1.5 text-xs font-mono text-paper-300 border border-paper-100 rounded cursor-not-allowed">
                ← First Day
              </span>
            )}

            <span className="text-xs font-mono text-academic-muted px-1">
              Day {entry.dayNumber} of {sortedEntries.length}
            </span>

            {nextEntry ? (
              <button
                onClick={() => onNavigateToEntry(nextEntry)}
                className="flex items-center gap-1 px-3 py-1.5 bg-paper-50 hover:bg-paper-100 border border-paper-300 text-paper-900 text-xs font-mono rounded transition-colors"
                title={`View Day ${nextEntry.dayNumber} (${nextEntry.date})`}
              >
                Day {nextEntry.dayNumber} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="px-3 py-1.5 text-xs font-mono text-paper-300 border border-paper-100 rounded cursor-not-allowed">
                Latest Day →
              </span>
            )}

            {/* PRINT / SAVE AS PDF BUTTON */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-100 hover:bg-paper-200 border border-paper-400 text-academic-navy text-xs font-mono font-semibold rounded transition-colors ml-2 shadow-sm"
            >
              <Printer className="w-4 h-4 text-academic-accent" /> Print / Save as PDF
            </button>

            <button
              onClick={() => onEditEntry(entry)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-academic-navy hover:bg-academic-slate text-white text-xs font-mono font-medium rounded transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Record
            </button>
          </div>
        </div>

        {/* SCREEN INTERACTIVE ARTICLE */}
        <article className="bg-white border-2 border-paper-300 rounded p-6 sm:p-10 shadow-md space-y-8 font-sans">
          {/* DOCUMENT HEADER */}
          <header className="border-b-2 border-paper-900 pb-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono tracking-widest text-academic-muted uppercase">
              <span className="flex items-center gap-1.5 text-academic-navy font-bold">
                <FlaskConical className="w-4 h-4" /> SLEEP LAB RESEARCH NOTEBOOK
              </span>
              <div className="flex items-center gap-3">
                <span>DAY {entry.dayNumber} / 30 REPORT</span>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-paper-900 tracking-tight">
                Daily Sleep & Recovery Report
              </h1>
              <p className="text-sm font-mono text-academic-slate flex items-center gap-2 pt-1">
                <Calendar className="w-4 h-4 text-academic-muted" />
                {formatDateTitle(entry.date)} ({entry.date})
              </p>
            </div>

            {/* Key Metrics Overview Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="bg-paper-50 border border-paper-300 rounded p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-academic-muted block">
                    Estimated Total Sleep
                  </span>
                  <span className="text-2xl font-mono font-bold text-paper-900">
                    {entry.calculatedMetrics.totalSleepFormatted}
                  </span>
                </div>
                <div className="text-xs font-mono text-academic-muted bg-white px-2 py-1 rounded border border-paper-200">
                  {entry.calculatedMetrics.totalSleepMinutes} minutes
                </div>
              </div>

              <div className="bg-academic-navy text-white rounded p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-paper-300 block">
                    Daily Recovery Index
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-white">
                      {entry.calculatedMetrics.recoveryIndexScore}
                    </span>
                    <span className="text-xs font-mono text-paper-300">/ 50</span>
                  </div>
                </div>
                <div className="text-lg font-mono font-bold text-amber-300 bg-white/10 px-3 py-1 rounded border border-white/20">
                  {entry.calculatedMetrics.recoveryIndexPercentage}%
                </div>
              </div>
            </div>
          </header>

          {/* 01 — SLEEP PARAMETERS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight flex items-center gap-2">
                <span className="font-mono text-sm text-academic-accent">01 —</span> Sleep Parameters
              </h2>
              <span className="text-[11px] font-mono text-academic-muted">Raw Sleep Logs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans text-left border-collapse">
                <thead>
                  <tr className="bg-paper-100 border-b border-paper-300 text-academic-slate font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Parameter</th>
                    <th className="py-2.5 px-4 font-semibold">Recorded Observation</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Data Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-paper-900">Lights Out</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-academic-navy">
                      {entry.sleep.lightsOut}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[10px] text-academic-muted">
                      Raw Input
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-paper-900">Estimated Sleep Time</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-academic-navy">
                      {entry.sleep.estimatedSleepTime}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[10px] text-academic-muted">
                      Raw Input
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-paper-900">Natural / Final Wake Time</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-academic-navy">
                      {entry.sleep.naturalWakeTime}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[10px] text-academic-muted">
                      Raw Input
                    </td>
                  </tr>
                  <tr className="bg-paper-50/50">
                    <td className="py-2.5 px-4 font-medium text-paper-900">
                      Estimated Total Sleep Duration
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-academic-navy">
                      {entry.calculatedMetrics.totalSleepFormatted} ({entry.calculatedMetrics.totalSleepMinutes}m)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[10px] text-academic-accent font-semibold">
                      Calculated Metric
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-paper-900">Woke Up to Alarm?</td>
                    <td className="py-2.5 px-4 font-sans font-semibold">
                      {entry.sleep.alarmWake ? (
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <CheckCircle2 className="w-3 h-3 text-amber-600" /> Yes (Alarm)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <XCircle className="w-3 h-3 text-emerald-600" /> No (Natural Wake)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[10px] text-academic-muted">
                      Raw Input
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-paper-900">Number of Awakenings</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-academic-navy">
                      {entry.sleep.numberOfAwakenings}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[10px] text-academic-muted">
                      Raw Input
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-paper-900">Awakening Reason(s)</td>
                    <td className="py-2.5 px-4">
                      {entry.sleep.awakeningReasons.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.sleep.awakeningReasons.map((reason) => (
                            <span
                              key={reason}
                              className="px-2 py-0.5 bg-paper-100 border border-paper-300 rounded font-mono text-[11px] text-paper-900"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-academic-muted italic font-mono">None reported</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[10px] text-academic-muted">
                      Raw Input
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 02 — MORNING ASSESSMENT */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight flex items-center gap-2">
                <span className="font-mono text-sm text-academic-accent">02 —</span> Morning Assessment
              </h2>
              <span className="text-[11px] font-mono text-academic-muted">~45 mins post-wake</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderScoreBar(
                entry.morning.morningAlertness,
                10,
                'Morning Alertness',
                'Sharpness and wakefulness (Contributes to Recovery Index)'
              )}
              {renderScoreBar(
                entry.morning.sleepInertia,
                10,
                'Sleep Inertia',
                'Heavy grogginess or difficulty waking up'
              )}
              {renderScoreBar(
                entry.morning.mood,
                10,
                'Subjective Mood',
                'Emotional state (Contributes to Recovery Index)'
              )}
              {renderScoreBar(
                entry.morning.motivation,
                10,
                'Daily Motivation',
                'Drive and eagerness for daily tasks'
              )}
            </div>
          </section>

          {/* 03 — PHYSICAL & SUBJECTIVE RECOVERY */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight flex items-center gap-2">
                <span className="font-mono text-sm text-academic-accent">03 —</span> Physical & Subjective Recovery
              </h2>
              <span className="text-[11px] font-mono text-academic-muted">Physiological Markers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderScoreBar(
                entry.recovery.skinHealth,
                10,
                'Skin Health Observation',
                'Clarity, hydration & tone (Contributes to Recovery Index)'
              )}
              {renderScoreBar(
                entry.recovery.muscleFullness,
                10,
                'Muscle Fullness',
                'Glycogen & physical tone (Contributes to Recovery Index)'
              )}
              {renderScoreBar(
                entry.recovery.workoutEnergy,
                10,
                'Workout Energy',
                'Readiness for physical training'
              )}
              {renderScoreBar(
                entry.recovery.bodyFreshness,
                10,
                'Body Freshness',
                'Absence of systemic muscle soreness'
              )}
            </div>

            {/* Recovery Index Source Info Box */}
            <div className="bg-paper-50 border border-paper-300 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-academic-navy">
                  <Award className="w-4 h-4 text-amber-600" /> RECOVERY INDEX BREAKDOWN
                </div>
                <p className="text-xs text-academic-slate leading-relaxed">
                  Calculated unweighted sum of 5 metrics: Morning Alertness ({entry.morning.morningAlertness}), Mood ({entry.morning.mood}), Skin Health ({entry.recovery.skinHealth}), Muscle Fullness ({entry.recovery.muscleFullness}), Afternoon Energy ({entry.afternoon.afternoonEnergy}).
                </p>
              </div>
              <div className="text-right sm:border-l sm:border-paper-300 sm:pl-4 flex-shrink-0">
                <div className="font-mono text-2xl font-bold text-paper-900">
                  {entry.calculatedMetrics.recoveryIndexScore} / 50
                </div>
                <div className="font-mono text-xs text-academic-accent font-semibold">
                  {entry.calculatedMetrics.recoveryIndexPercentage}% Score
                </div>
              </div>
            </div>
          </section>

          {/* 04 — AFTERNOON FUNCTIONING */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight flex items-center gap-2">
                <span className="font-mono text-sm text-academic-accent">04 —</span> Afternoon Functioning
              </h2>
              <span className="text-[11px] font-mono text-academic-muted">Mid-Day Observation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderScoreBar(
                entry.afternoon.afternoonEnergy,
                10,
                'Afternoon Energy (14:00-16:00)',
                'Sustained vitality (Contributes to Recovery Index)'
              )}
              {renderScoreBar(
                entry.afternoon.focus,
                10,
                'Cognitive Focus',
                'Sustained concentration without brain fog'
              )}
            </div>

            <div className="bg-paper-50 p-3.5 rounded border border-paper-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-paper-900">Experienced Afternoon Slump?</span>
              <span className="font-mono text-xs font-bold px-3 py-1 rounded border bg-white">
                {entry.afternoon.afternoonSlump ? (
                  <span className="text-rose-700">Yes (Slump Observed)</span>
                ) : (
                  <span className="text-emerald-700">No (Steady Energy)</span>
                )}
              </span>
            </div>
          </section>

          {/* 05 — EVENING READINESS & NOTES */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight flex items-center gap-2">
                <span className="font-mono text-sm text-academic-accent">05 —</span> Evening Readiness & Qualitative Notes
              </h2>
              <span className="text-[11px] font-mono text-academic-muted">Pre-Bedtime Log</span>
            </div>

            <div className="bg-paper-50 p-3.5 rounded border border-paper-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-paper-900">
                Naturally sleepy before bedtime?
              </span>
              <span className="font-mono text-xs font-bold px-3 py-1 bg-white border border-paper-300 rounded text-academic-navy">
                {entry.evening.naturallySleepyBeforeBed}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-academic-slate">
                Qualitative Daily Notes
              </span>
              <div className="bg-paper-50 border border-paper-300 rounded p-4 font-serif text-sm leading-relaxed text-paper-900 min-h-[80px]">
                {entry.evening.notes && entry.evening.notes.trim().length > 0 ? (
                  <p className="whitespace-pre-wrap">{entry.evening.notes}</p>
                ) : (
                  <p className="text-academic-muted italic font-sans text-xs">
                    No qualitative notes recorded for this day.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 06 — POTENTIAL CONFOUNDING FACTORS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight flex items-center gap-2">
                <span className="font-mono text-sm text-academic-accent">06 —</span> Potential Confounding Factors
              </h2>
              <span className="text-[11px] font-mono text-academic-muted">Subgroup Analysis Variables</span>
            </div>

            {entry.confounders.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {entry.confounders.map((factor) => (
                  <span
                    key={factor}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-academic-navy text-white font-mono text-xs font-semibold rounded border border-academic-navy shadow-sm"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                    {factor}
                  </span>
                ))}
              </div>
            ) : (
              <div className="bg-paper-50 border border-paper-200 rounded p-4 text-xs font-mono text-academic-muted italic">
                No potential confounding factors recorded for this observation day.
              </div>
            )}
          </section>

          {/* 07 — ADDITIONAL (USER-DEFINED CUSTOM METRICS) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-paper-300 pb-2">
              <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight flex items-center gap-2">
                <span className="font-mono text-sm text-academic-accent">07 —</span> Additional (User-Defined Metrics)
              </h2>
              <span className="text-[11px] font-mono text-academic-muted">Personal Tracking Variables</span>
            </div>

            {recordedAdditionalEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-sans text-left border-collapse">
                  <thead>
                    <tr className="bg-paper-100 border-b border-paper-300 text-academic-slate font-mono uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">Custom Metric</th>
                      <th className="py-2.5 px-4 font-semibold">Recorded Observation</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Metric Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-200">
                    {recordedAdditionalEntries.map(([metricId, val]) => {
                      const def = metricDefsMap.get(metricId);
                      const metricName = def ? def.name : metricId;
                      const metricType = def ? def.type : 'Custom';
                      const formattedObs = formatCustomMetricObservation(def, val);

                      return (
                        <tr key={metricId}>
                          <td className="py-2.5 px-4 font-medium text-paper-900">
                            {metricName}
                            {def?.description && (
                              <span className="block text-[11px] text-academic-muted font-normal mt-0.5">
                                {def.description}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-academic-navy">
                            {formattedObs}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-[10px] text-academic-muted uppercase">
                            {metricType}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-paper-50 border border-paper-200 rounded p-4 text-xs font-mono text-academic-muted italic">
                No user-defined custom metrics recorded for this day.
              </div>
            )}
          </section>

          {/* DOCUMENT FOOTER SIGNATURE */}
          <footer className="border-t border-paper-300 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-academic-muted gap-2">
            <div>SleepLab N=1 Longitudinal Study · Daily Record Entry ID: {entry.id}</div>
            <div>Preserved in localStorage · Subjective Observations</div>
          </footer>
        </article>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between bg-white p-4 rounded border border-paper-200 shadow-sm no-print">
          <button
            onClick={onBackToHistory}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-academic-slate hover:text-paper-900"
          >
            <ChevronLeft className="w-4 h-4" /> Back to History List
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-paper-100 hover:bg-paper-200 border border-paper-400 text-academic-navy text-xs font-mono font-semibold rounded transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-academic-accent" /> Print / Save as PDF
            </button>
            <button
              onClick={() => onEditEntry(entry)}
              className="flex items-center gap-2 px-5 py-2 bg-academic-navy text-white text-xs font-mono font-semibold rounded hover:bg-academic-slate transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" /> Edit Day {entry.dayNumber} Record
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED SCIENTIFIC PRINT / PDF PRESENTATION (Only rendered on print) */}
      {/* PAGE 1: MANDATORY CORE SECTIONS (01 - 06)                                */}
      {/* PAGE 2: USER-DEFINED CUSTOM ADDITIONAL METRICS (07)                       */}
      {/* ========================================================================= */}
      <div className="hidden print:block font-sans text-paper-900 space-y-4">
        {/* PAGE 1: MANDATORY EXPERIMENTAL CORE SECTIONS */}
        <div className="space-y-3.5">
          {/* PRINT DOCUMENT HEADER */}
          <header className="border-b-2 border-paper-900 pb-2 space-y-0.5">
            <div className="flex justify-between items-baseline text-[9px] font-mono uppercase tracking-widest text-academic-slate">
              <span className="font-bold">SLEEP LAB · RESEARCH NOTEBOOK</span>
              <span>N=1 Longitudinal Study</span>
            </div>
            <div className="flex justify-between items-baseline pt-0.5">
              <h1 className="text-xl font-serif font-bold text-paper-900">
                Daily Sleep & Recovery Report
              </h1>
              <span className="font-mono text-xs font-bold text-academic-navy">
                Day {entry.dayNumber} / 30
              </span>
            </div>
            <div className="text-[11px] font-mono text-academic-slate">
              {formatDateTitle(entry.date)} ({entry.date})
            </div>
          </header>

          {/* EXECUTIVE SUMMARY TABLE */}
          <div className="border border-paper-400 p-2.5 rounded bg-white space-y-1.5 break-inside-avoid">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-academic-slate border-b border-paper-200 pb-0.5">
              Executive Research Summary
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px] font-sans">
              <div>
                <span className="text-academic-muted block text-[9px]">Estimated Total Sleep Duration</span>
                <span className="font-mono font-bold text-xs text-paper-900">
                  {entry.calculatedMetrics.totalSleepFormatted}
                </span>
                <span className="text-[9px] font-mono text-academic-muted ml-1.5">(Calculated Metric)</span>
              </div>
              <div>
                <span className="text-academic-muted block text-[9px]">Daily Recovery Index</span>
                <span className="font-mono font-bold text-xs text-paper-900">
                  {entry.calculatedMetrics.recoveryIndexScore} / 50 ({entry.calculatedMetrics.recoveryIndexPercentage}%)
                </span>
                <span className="text-[9px] font-mono text-academic-muted ml-1.5">(Calculated Metric)</span>
              </div>
            </div>
          </div>

          {/* 01 — SLEEP PARAMETERS */}
          <section className="space-y-1 break-inside-avoid">
            <h2 className="text-xs font-serif font-bold text-paper-900 border-b border-paper-400 pb-0.5 uppercase tracking-wide">
              01 — Sleep Parameters (Mandatory Core)
            </h2>
            <table className="w-full text-[11px] text-left border-collapse border border-paper-300">
              <thead>
                <tr className="bg-paper-100 border-b border-paper-300 font-mono text-[9px] uppercase">
                  <th className="py-1 px-2 font-semibold">Parameter</th>
                  <th className="py-1 px-2 font-semibold">Recorded Observation</th>
                  <th className="py-1 px-2 font-semibold text-right">Data Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                <tr>
                  <td className="py-1 px-2 font-medium">Lights Out</td>
                  <td className="py-1 px-2 font-mono">{entry.sleep.lightsOut}</td>
                  <td className="py-1 px-2 text-right font-mono text-[9px] text-academic-muted">Raw Input</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-medium">Estimated Sleep Time</td>
                  <td className="py-1 px-2 font-mono">{entry.sleep.estimatedSleepTime}</td>
                  <td className="py-1 px-2 text-right font-mono text-[9px] text-academic-muted">Raw Input</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-medium">Natural / Final Wake Time</td>
                  <td className="py-1 px-2 font-mono">{entry.sleep.naturalWakeTime}</td>
                  <td className="py-1 px-2 text-right font-mono text-[9px] text-academic-muted">Raw Input</td>
                </tr>
                <tr className="bg-paper-50 font-semibold">
                  <td className="py-1 px-2">Estimated Total Sleep Duration</td>
                  <td className="py-1 px-2 font-mono">{entry.calculatedMetrics.totalSleepFormatted} ({entry.calculatedMetrics.totalSleepMinutes}m)</td>
                  <td className="py-1 px-2 text-right font-mono text-[9px] text-academic-accent">Calculated Metric</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-medium">Woke Up to Alarm?</td>
                  <td className="py-1 px-2">{entry.sleep.alarmWake ? 'Yes (Alarm)' : 'No (Natural Wake)'}</td>
                  <td className="py-1 px-2 text-right font-mono text-[9px] text-academic-muted">Raw Input</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-medium">Number of Awakenings</td>
                  <td className="py-1 px-2 font-mono">{entry.sleep.numberOfAwakenings}</td>
                  <td className="py-1 px-2 text-right font-mono text-[9px] text-academic-muted">Raw Input</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-medium">Awakening Reason(s)</td>
                  <td className="py-1 px-2 font-mono">
                    {entry.sleep.awakeningReasons.length > 0
                      ? entry.sleep.awakeningReasons.join(', ')
                      : 'None reported'}
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-[9px] text-academic-muted">Raw Input</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 02 — MORNING ASSESSMENT */}
          <section className="space-y-1 break-inside-avoid">
            <h2 className="text-xs font-serif font-bold text-paper-900 border-b border-paper-400 pb-0.5 uppercase tracking-wide">
              02 — Morning Assessment (~45m post-wake)
            </h2>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Morning Alertness</span>
                <span className="font-mono font-bold">{entry.morning.morningAlertness} / 10</span>
              </div>
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Sleep Inertia</span>
                <span className="font-mono font-bold">{entry.morning.sleepInertia} / 10</span>
              </div>
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Subjective Mood</span>
                <span className="font-mono font-bold">{entry.morning.mood} / 10</span>
              </div>
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Daily Motivation</span>
                <span className="font-mono font-bold">{entry.morning.motivation} / 10</span>
              </div>
            </div>
          </section>

          {/* 03 — PHYSICAL & SUBJECTIVE RECOVERY */}
          <section className="space-y-1 break-inside-avoid">
            <h2 className="text-xs font-serif font-bold text-paper-900 border-b border-paper-400 pb-0.5 uppercase tracking-wide">
              03 — Physical & Subjective Recovery
            </h2>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Skin Health Observation</span>
                <span className="font-mono font-bold">{entry.recovery.skinHealth} / 10</span>
              </div>
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Muscle Fullness</span>
                <span className="font-mono font-bold">{entry.recovery.muscleFullness} / 10</span>
              </div>
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Workout Energy</span>
                <span className="font-mono font-bold">{entry.recovery.workoutEnergy} / 10</span>
              </div>
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Body Freshness</span>
                <span className="font-mono font-bold">{entry.recovery.bodyFreshness} / 10</span>
              </div>
            </div>
            <div className="py-1 px-2 border border-paper-300 bg-paper-50 text-[10px] font-mono text-academic-slate rounded">
              <strong>Recovery Index Source:</strong> Alertness ({entry.morning.morningAlertness}) + Mood ({entry.morning.mood}) + Skin ({entry.recovery.skinHealth}) + Muscle ({entry.recovery.muscleFullness}) + Afternoon ({entry.afternoon.afternoonEnergy}) = <strong>{entry.calculatedMetrics.recoveryIndexScore} / 50 ({entry.calculatedMetrics.recoveryIndexPercentage}%)</strong>.
            </div>
          </section>

          {/* 04 — AFTERNOON FUNCTIONING */}
          <section className="space-y-1 break-inside-avoid">
            <h2 className="text-xs font-serif font-bold text-paper-900 border-b border-paper-400 pb-0.5 uppercase tracking-wide">
              04 — Afternoon Functioning (14:00 - 16:00)
            </h2>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Afternoon Energy</span>
                <span className="font-mono font-bold">{entry.afternoon.afternoonEnergy} / 10</span>
              </div>
              <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center">
                <span>Cognitive Focus</span>
                <span className="font-mono font-bold">{entry.afternoon.focus} / 10</span>
              </div>
            </div>
            <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center text-[11px]">
              <span>Experienced Afternoon Slump?</span>
              <span className="font-mono font-bold">
                {entry.afternoon.afternoonSlump ? 'Yes (Slump Observed)' : 'No (Steady Energy)'}
              </span>
            </div>
          </section>

          {/* 05 — EVENING READINESS & QUALITATIVE NOTES */}
          <section className="space-y-1 break-inside-avoid">
            <h2 className="text-xs font-serif font-bold text-paper-900 border-b border-paper-400 pb-0.5 uppercase tracking-wide">
              05 — Evening Readiness & Qualitative Notes
            </h2>
            <div className="py-1 px-2 border border-paper-200 rounded flex justify-between items-center text-[11px]">
              <span>Naturally sleepy before bedtime?</span>
              <span className="font-mono font-bold">{entry.evening.naturallySleepyBeforeBed}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-academic-slate font-bold">
                Qualitative Daily Notes:
              </span>
              <div className="py-1.5 px-2.5 border border-paper-300 rounded bg-white text-[11px] font-serif leading-snug text-paper-900">
                {entry.evening.notes && entry.evening.notes.trim().length > 0 ? (
                  <p className="whitespace-pre-wrap">{entry.evening.notes}</p>
                ) : (
                  <p className="text-academic-muted italic font-sans text-[10px]">
                    No qualitative notes recorded for this observation day.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 06 — POTENTIAL CONFOUNDING FACTORS */}
          <section className="space-y-1 break-inside-avoid">
            <h2 className="text-xs font-serif font-bold text-paper-900 border-b border-paper-400 pb-0.5 uppercase tracking-wide">
              06 — Potential Confounding Factors
            </h2>
            {entry.confounders.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {entry.confounders.map((factor) => (
                  <span
                    key={factor}
                    className="px-2 py-0.5 border border-paper-400 bg-paper-100 font-mono text-[10px] font-semibold text-paper-900 rounded"
                  >
                    [✓] {factor}
                  </span>
                ))}
              </div>
            ) : (
              <div className="py-1 px-2 border border-paper-200 text-[10px] font-mono text-academic-muted italic rounded">
                No potential confounding factors recorded for this observation day.
              </div>
            )}
          </section>
        </div>

        {/* INTENTIONAL PAGE BREAK BEFORE USER-DEFINED CUSTOM METRICS */}
        <div className="print-page-break" />

        {/* PAGE 2: USER-DEFINED CUSTOM ADDITIONAL METRICS (07) & DOCUMENT FOOTER */}
        <div className="space-y-5 pt-2">
          {/* PAGE 2 HEADER BADGE */}
          <div className="flex justify-between items-center border-b border-paper-400 pb-1 text-[9px] font-mono text-academic-slate uppercase">
            <span>SLEEP LAB · RESEARCH REPORT — DAY {entry.dayNumber} ({entry.date})</span>
            <span>PAGE 2 / 2 — USER-DEFINED ADDITIONAL TRACKING</span>
          </div>

          {/* 07 — ADDITIONAL (USER-DEFINED CUSTOM METRICS) */}
          <section className="space-y-3 break-inside-avoid">
            <div className="space-y-1 border-b border-paper-400 pb-1">
              <h2 className="text-sm font-serif font-bold text-paper-900 uppercase tracking-wide">
                07 — Additional (User-Defined Custom Variables)
              </h2>
              <p className="text-[10px] font-mono text-academic-slate">
                Custom variables created by the user for personalized longitudinal tracking.
              </p>
            </div>

            {recordedAdditionalEntries.length > 0 ? (
              <table className="w-full text-xs text-left border-collapse border border-paper-300">
                <thead>
                  <tr className="bg-paper-100 border-b border-paper-300 font-mono text-[10px] uppercase">
                    <th className="p-2 font-semibold">Custom Metric Name</th>
                    <th className="p-2 font-semibold">Recorded Observation</th>
                    <th className="p-2 font-semibold text-right">Data Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200">
                  {recordedAdditionalEntries.map(([metricId, val]) => {
                    const def = metricDefsMap.get(metricId);
                    const metricName = def ? def.name : metricId;
                    const metricType = def ? def.type : 'Custom';
                    const formattedObs = formatCustomMetricObservation(def, val);

                    return (
                      <tr key={metricId}>
                        <td className="p-2 font-medium text-paper-900">
                          {metricName}
                          {def?.description && (
                            <span className="block text-[10px] text-academic-muted font-normal mt-0.5">
                              {def.description}
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-mono font-semibold text-academic-navy">{formattedObs}</td>
                        <td className="p-2 text-right font-mono text-[10px] text-academic-muted uppercase">
                          {metricType}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-4 border border-paper-200 text-xs font-mono text-academic-muted italic rounded bg-paper-50">
                No user-defined custom metrics recorded for this observation day.
              </div>
            )}
          </section>

          {/* PRINT DOCUMENT FOOTER SIGNATURE */}
          <footer className="border-t-2 border-paper-900 pt-3 flex justify-between items-center text-[10px] font-mono text-academic-slate">
            <div>SleepLab N=1 Longitudinal Study · Entry ID: {entry.id}</div>
            <div>Subjective Observations preserved in local database · Day {entry.dayNumber} / 30</div>
          </footer>
        </div>
      </div>
    </div>
  );
};
