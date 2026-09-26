import React from 'react';
import { DailyEntry, CustomMetricDefinition, StudyConfig, StudyCategory, StudyMetric } from '@/types/sleeplab';
import { getDefaultStudySchema } from '@/lib/defaultSchema';
import { getCustomMetricDefinitions, generateReportId } from '@/lib/storage';

interface SingleReportPrintProps {
  entry: DailyEntry;
  studyConfig?: StudyConfig;
  isFirstReport: boolean;
  totalExportCount: number;
  exportScopeLabel?: string;
  viewMode?: 'tree' | 'table';
}

export const SingleReportPrint: React.FC<SingleReportPrintProps> = ({
  entry,
  studyConfig,
  isFirstReport,
  totalExportCount,
  exportScopeLabel,
  viewMode = 'tree',
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
    ? Object.entries(entry.additionalMetrics).filter(([metricId, val]) => {
        if (val === undefined || val === null || val === '') return false;
        const def = metricDefsMap.get(metricId);
        // Exclude deleted metrics (def is undefined) and archived metrics (def.active === false)
        return def && def.active !== false;
      })
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
        {/* PROMINENT DAY BANNER */}
        <div className="bg-[#2b2a26] text-white px-3 py-2 rounded flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#c96442] text-white px-2 py-0.5 rounded font-extrabold text-xs">
              DAY {entry.dayNumber}
            </span>
            <span>OBSERVATION REPORT</span>
          </div>
          <span className="text-[10px] text-gray-300 font-normal">{entry.date} ({formatDateTitle(entry.date)})</span>
        </div>

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
            </tbody>
          </table>
        </section>

        {/* DYNAMIC CATEGORIES FOR PRINT */}
        {(() => {
          const schema = studyConfig?.schema || getDefaultStudySchema();
          const nonSleepCategories = schema.categories
            .filter((c: StudyCategory) => c.id !== 'cat-sleep')
            .sort((a: StudyCategory, b: StudyCategory) => a.order - b.order);

          return nonSleepCategories.map((cat: StudyCategory, catIdx: number) => {
            const catMetrics = schema.metrics
              .filter((m: StudyMetric) => m.categoryId === cat.id && m.active !== false)
              .sort((a: StudyMetric, b: StudyMetric) => a.order - b.order);

            const renderPrintMetricNode = (m: StudyMetric, depth: number = 0): React.ReactNode => {
              if (entry.mutedMetrics?.includes(m.id)) return null;

              const rawVal =
                m.id === 'morningAlertness' ? entry.morning.morningAlertness :
                m.id === 'sleepInertia' ? entry.morning.sleepInertia :
                m.id === 'mood' ? entry.morning.mood :
                m.id === 'motivation' ? entry.morning.motivation :
                m.id === 'skinHealth' ? entry.recovery.skinHealth :
                m.id === 'muscleFullness' ? entry.recovery.muscleFullness :
                m.id === 'workoutEnergy' ? entry.recovery.workoutEnergy :
                m.id === 'bodyFreshness' ? entry.recovery.bodyFreshness :
                m.id === 'afternoonEnergy' ? entry.afternoon.afternoonEnergy :
                m.id === 'focus' ? entry.afternoon.focus :
                entry.metricsData?.[m.id];

              if (rawVal === undefined || rawVal === null || rawVal === '') return null;

              const activeRules = (m.dependentRules || []).filter((rule) => {
                if (rule.condition === 'isTrue') return Boolean(rawVal) === true;
                if (rule.condition === 'isFalse') return Boolean(rawVal) === false;
                if (rule.condition === 'equals') return String(rawVal) === String(rule.targetValue);
                if (rule.condition === 'greaterThan') return Number(rawVal) > Number(rule.targetValue);
                if (rule.condition === 'lessThan') return Number(rawVal) < Number(rule.targetValue);
                if (rule.condition === 'contains') return Array.isArray(rawVal) && rawVal.includes(rule.targetValue);
                return false;
              });

              const displayVal =
                m.type === 'slider' ? `${rawVal} / ${m.config?.max || 10}` :
                m.type === 'tags' && Array.isArray(rawVal) ? rawVal.join(', ') :
                m.type === 'checkbox' ? (rawVal ? 'Yes' : 'No') :
                `${rawVal}${m.config?.unit ? ` ${m.config.unit}` : ''}`;

              if (viewMode === 'table') {
                return (
                  <React.Fragment key={m.id}>
                    <tr className={depth > 0 ? 'bg-paper-100/60 text-[10px]' : ''}>
                      <td className="py-1 px-2 font-medium flex items-center gap-1">
                        {depth > 0 && <span className="font-mono text-academic-navy pl-1">↳</span>}
                        {m.name}
                      </td>
                      <td className="py-1 px-2 font-mono font-bold">{displayVal}</td>
                      <td className="py-1 px-2 text-right font-mono text-[9px] text-academic-muted">{m.type}</td>
                    </tr>
                    {activeRules.map((rule) => renderPrintMetricNode(rule.subMetric, depth + 1))}
                  </React.Fragment>
                );
              }

              // Tree view in PDF export
              const indentPadding = depth > 0 ? { marginLeft: `${depth * 14}px` } : {};
              return (
                <div key={m.id} style={indentPadding} className="space-y-1">
                  <div className={`py-1 px-2 border border-paper-300 rounded flex justify-between items-center text-[11px] ${depth > 0 ? 'bg-paper-100 border-l-2 border-l-academic-navy text-[10px]' : 'bg-white'}`}>
                    <span className="font-medium flex items-center gap-1">
                      {depth > 0 && <span className="font-mono text-academic-navy font-bold">↳</span>}
                      {m.name}
                    </span>
                    <span className="font-mono font-bold text-paper-900">{displayVal}</span>
                  </div>
                  {activeRules.length > 0 && (
                    <div className="space-y-1 pl-2 border-l border-paper-300 my-1">
                      {activeRules.map((rule) => renderPrintMetricNode(rule.subMetric, depth + 1))}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <section key={cat.id} className="space-y-1 break-inside-avoid">
                <h2 className="text-xs font-serif font-bold text-paper-900 border-b border-paper-400 pb-0.5 uppercase tracking-wide">
                  0{catIdx + 2} — {cat.name}
                </h2>
                {viewMode === 'table' ? (
                  <table className="w-full text-[11px] text-left border-collapse border border-paper-300">
                    <thead>
                      <tr className="bg-paper-100 border-b border-paper-300 font-mono text-[9px] uppercase">
                        <th className="py-1 px-2 font-semibold">Metric</th>
                        <th className="py-1 px-2 font-semibold">Value</th>
                        <th className="py-1 px-2 font-semibold text-right">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-200">
                      {catMetrics.map((m: StudyMetric) => renderPrintMetricNode(m, 0))}
                    </tbody>
                  </table>
                ) : (
                  <div className="space-y-1 text-[11px]">
                    {catMetrics.map((m: StudyMetric) => renderPrintMetricNode(m, 0))}
                  </div>
                )}
              </section>
            );
          });
        })()}

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
