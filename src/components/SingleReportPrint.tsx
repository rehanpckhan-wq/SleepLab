import React from 'react';
import { DailyEntry, CustomMetricDefinition, StudyConfig } from '@/types/sleeplab';
import { getCustomMetricDefinitions, generateReportId } from '@/lib/storage';

interface SingleReportPrintProps {
  entry: DailyEntry;
  studyConfig?: StudyConfig;
  isFirstReport: boolean;
  totalExportCount: number;
  exportScopeLabel?: string;
}

export const SingleReportPrint: React.FC<SingleReportPrintProps> = ({
  entry,
  studyConfig,
  isFirstReport,
  totalExportCount,
  exportScopeLabel,
}) => {
  const reportId = entry.reportId || generateReportId(entry.date, entry.dayNumber);
  const customMetricDefs = getCustomMetricDefinitions();
  const metricDefsMap = new Map<string, CustomMetricDefinition>(
    customMetricDefs.map((m) => [m.id, m])
  );

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
      case 'duration':
      case 'text':
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
    <div className="font-sans text-paper-900 space-y-4">
      {/* MULTI-REPORT PACKAGE COVER HEADER (Shown only on the first page of multi-report export) */}
      {isFirstReport && totalExportCount > 1 && (
        <div className="border-b-2 border-paper-900 pb-4 mb-4">
          <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-academic-slate uppercase">
            <span className="font-bold text-academic-navy">SLEEP LAB RESEARCH NOTEBOOK</span>
            <span>COMBINED RESEARCH REPORT</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-paper-900 mt-1">
            {studyConfig?.title || 'SleepLab N=1 Longitudinal Study'}
          </h1>
          <div className="flex items-center justify-between text-[11px] font-mono text-academic-slate border-t border-b border-paper-300 py-1.5 mt-2">
            <div>Scope: <strong className="text-paper-900">{exportScopeLabel || `Days 1–${totalExportCount}`}</strong></div>
            <div>Compiled: <strong className="text-paper-900">{totalExportCount} Daily Reports</strong></div>
            <div>Study Duration: <strong className="text-academic-navy">{studyConfig?.durationDays || 30} Days</strong></div>
          </div>
        </div>
      )}

      {/* PAGE 1: MANDATORY EXPERIMENTAL CORE SECTIONS */}
      <div className="space-y-3.5">
        {/* PRINT DOCUMENT HEADER */}
        <header className="border-b-2 border-paper-900 pb-2 space-y-0.5">
          <div className="flex justify-between items-baseline text-[9px] font-mono uppercase tracking-widest text-academic-slate">
            <span className="font-bold">SLEEP LAB · RESEARCH NOTEBOOK</span>
            <span>{studyConfig?.title || 'N=1 Longitudinal Study'}</span>
          </div>
          <div className="flex justify-between items-baseline pt-0.5">
            <h1 className="text-xl font-serif font-bold text-paper-900">
              Daily Sleep & Recovery Report
            </h1>
            <div className="text-right">
              <div className="font-mono text-xs font-bold text-academic-navy">
                Day {entry.dayNumber} / {studyConfig?.durationDays || 30}
              </div>
              <div className="font-mono text-[10px] text-academic-slate font-semibold pt-0.5">
                Report ID: {reportId}
              </div>
            </div>
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
          <span>Report ID: {reportId} · PAGE 2 / 2</span>
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
          <div>SleepLab N=1 Longitudinal Study · Report ID: {reportId} · Entry ID: {entry.id}</div>
          <div>Day {entry.dayNumber} / {studyConfig?.durationDays || 30} · Subjective Observations</div>
        </footer>
      </div>
    </div>
  );
};
