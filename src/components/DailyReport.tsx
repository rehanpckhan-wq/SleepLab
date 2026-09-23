import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  GitFork,
  Table,
  Maximize2,
  Minimize2,
} from 'lucide-react';

import { StudyConfig, StudyCategory, StudyMetric, DependentRule } from '@/types/sleeplab';
import { getDefaultStudySchema } from '@/lib/defaultSchema';
import { SingleReportPrint } from './SingleReportPrint';

interface DailyReportProps {
  initialMaximized?: boolean;
  entry: DailyEntry;
  allEntries: DailyEntry[];
  studyConfig?: StudyConfig;
  exportEntries?: DailyEntry[];
  exportScopeLabel?: string;
  onBackToHistory: () => void;
  onEditEntry: (entry: DailyEntry, isMaximized?: boolean) => void;
  onNavigateToEntry: (entry: DailyEntry) => void;
  onOpenExportDialog?: () => void;
}

export const DailyReport: React.FC<DailyReportProps> = ({
  initialMaximized,
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
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [isMaximized, setIsMaximized] = useState(initialMaximized || false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { if (initialMaximized !== undefined) setIsMaximized(initialMaximized); }, [initialMaximized]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('sleeplab_report_view_mode');
      if (savedMode === 'table' || savedMode === 'tree') {
        setViewMode(savedMode);
      }
    }
  }, []);

  const handleToggleViewMode = (mode: 'tree' | 'table') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sleeplab_report_view_mode', mode);
    }
  };
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

  const reportBody = (
    <div className={
    isMaximized
      ? "fixed inset-0 z-[9999] w-screen h-screen bg-[var(--canvas)] p-4 md:p-8 overflow-y-auto font-sans text-[var(--text-primary)] transition-all duration-200"
      : "max-w-4xl mx-auto space-y-6 pb-16 font-sans text-[var(--text-primary)]"
  }>
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

            {/* View Mode Toggle: Tree vs Table */}
            <div className="flex items-center bg-[var(--surface-raised)] border border-[var(--border-default)] p-0.5 rounded-md text-xs font-sans font-medium mr-2">
              <button
                type="button"
                onClick={() => handleToggleViewMode('tree')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-[var(--surface)] text-[var(--accent)] font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Tree Branch View: Nested cards connected with branch lines"
              >
                <GitFork className="w-3.5 h-3.5" /> Tree View
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[var(--surface)] text-[var(--accent)] font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Table Hierarchy View: Compact academic table with sub-row tree indicators (↳)"
              >
                <Table className="w-3.5 h-3.5" /> Table View
              </button>
            </div>

            <button
              onClick={onOpenExportDialog || handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-sans font-medium rounded-md transition-colors"
            >
              <Printer className="w-4 h-4 text-[var(--accent)]" /> Export PDF Report
            </button>

            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-sans font-medium rounded-md transition-colors"
              title={isMaximized ? 'Restore View' : 'Maximize Fullscreen Report'}
            >
              {isMaximized ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-[var(--accent)]" /> Restore View
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[var(--accent)]" /> Maximize Report
                </>
              )}
            </button>
            <button
              onClick={() => onEditEntry(entry, isMaximized)}
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
                </tbody>
              </table>
            </div>
          </section>

          {/* DYNAMIC CATEGORIES REPORT SECTIONS */}
          {(() => {
            const schema = studyConfig?.schema || getDefaultStudySchema();
            const nonSleepCategories = schema.categories
              .filter((c: StudyCategory) => c.id !== 'cat-sleep')
              .sort((a: StudyCategory, b: StudyCategory) => a.order - b.order);

            return nonSleepCategories.map((cat: StudyCategory, catIdx: number) => {
              const catMetrics = schema.metrics
                .filter((m: StudyMetric) => m.categoryId === cat.id && m.active !== false)
                .sort((a: StudyMetric, b: StudyMetric) => a.order - b.order);

              const renderReportMetricNode = (m: StudyMetric, depth: number = 0): React.ReactNode => {
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

                // Evaluate dependent sub-rules
                const activeRules = (m.dependentRules || []).filter((rule) => {
                  if (rule.condition === 'isTrue') return Boolean(rawVal) === true;
                  if (rule.condition === 'isFalse') return Boolean(rawVal) === false;
                  if (rule.condition === 'equals') return String(rawVal) === String(rule.targetValue);
                  if (rule.condition === 'greaterThan') return Number(rawVal) > Number(rule.targetValue);
                  if (rule.condition === 'lessThan') return Number(rawVal) < Number(rule.targetValue);
                  if (rule.condition === 'contains') return Array.isArray(rawVal) && rawVal.includes(rule.targetValue);
                  return false;
                });

                if (viewMode === 'table') {
                  return (
                    <React.Fragment key={m.id}>
                      <tr className={depth > 0 ? 'bg-[var(--surface-raised)]/50 text-[11px]' : ''}>
                        <td className="py-2.5 px-4 font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                          {depth > 0 && <span className="text-[var(--accent)] font-mono">↳</span>}
                          {m.name}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-xs">
                          {m.type === 'tags' && Array.isArray(rawVal) ? (
                            <div className="flex flex-wrap gap-1">
                              {rawVal.map((tag: string) => (
                                <span key={tag} className="px-2 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : m.type === 'checkbox' ? (
                            rawVal ? 'Yes' : 'No'
                          ) : (
                            `${rawVal} ${m.config?.unit || ''}`
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-sans text-[10px] text-[var(--text-tertiary)]">
                          {m.type}
                        </td>
                      </tr>
                      {activeRules.map((rule) => renderReportMetricNode(rule.subMetric, depth + 1))}
                    </React.Fragment>
                  );
                }

                // Default Tree View rendering
                const indentClass = depth > 0 ? 'border-l-2 border-[var(--accent-soft)] pl-4 my-2' : '';
                return (
                  <div key={m.id} className={`space-y-3 ${indentClass}`}>
                    {m.type === 'slider' ? (
                      renderScoreBar(
                        Number(rawVal),
                        m.config?.max || 10,
                        m.name,
                        schema.recoveryIndexMetricIds.includes(m.id) ? `${m.description || ''} (Contributes to Recovery)` : m.description
                      )
                    ) : m.type === 'tags' && Array.isArray(rawVal) ? (
                      <div className="bg-[var(--surface-raised)] p-4 rounded-lg border border-[var(--border-default)] space-y-2">
                        <div className="text-xs font-sans font-medium text-[var(--text-primary)]">{m.name}</div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rawVal.map((tag: string) => (
                            <span key={tag} className="px-2.5 py-1 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : m.type === 'select_one' && rawVal ? (
                      <div className="bg-[var(--surface-raised)] p-4 rounded-lg border border-[var(--border-default)] flex items-center justify-between">
                        <div>
                          <div className="text-xs font-sans font-medium text-[var(--text-primary)]">{m.name}</div>
                          {m.description && <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{m.description}</div>}
                        </div>
                        <span className="px-2.5 py-1 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full text-xs font-medium border border-[var(--accent)]/30">
                          {String(rawVal)}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-[var(--surface-raised)] p-4 rounded-lg border border-[var(--border-default)] flex items-center justify-between">
                        <div>
                          <div className="text-xs font-sans font-medium text-[var(--text-primary)]">{m.name}</div>
                          {m.description && <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{m.description}</div>}
                        </div>
                        <div className="font-sans text-sm font-semibold text-[var(--accent)]">
                          {m.type === 'checkbox' ? (rawVal ? 'Yes' : 'No') : String(rawVal)} {m.config?.unit || ''}
                        </div>
                      </div>
                    )}

                    {/* Triggered Children Tree Rendering */}
                    {activeRules.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[10px] font-mono text-[var(--accent)] uppercase flex items-center gap-1">
                          <GitFork className="w-3 h-3" /> Triggered Sub-Branch:
                        </div>
                        {activeRules.map((rule) => renderReportMetricNode(rule.subMetric, depth + 1))}
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <section key={cat.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                    <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                      <span className="font-sans text-xs text-[var(--accent)] font-medium">0{catIdx + 2} —</span> {cat.name}
                    </h2>
                    {cat.description && (
                      <span className="text-xs font-sans text-[var(--text-tertiary)]">{cat.description}</span>
                    )}
                  </div>

                  {viewMode === 'table' ? (
                    <div className="border border-[var(--border-default)] rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[var(--surface-raised)] border-b border-[var(--border-default)] text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                          <tr>
                            <th className="py-2 px-4 font-semibold">Metric</th>
                            <th className="py-2 px-4 font-semibold">Value</th>
                            <th className="py-2 px-4 font-semibold text-right">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-default)]">
                          {catMetrics.map((m: StudyMetric) => renderReportMetricNode(m, 0))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catMetrics.map((m: StudyMetric) => renderReportMetricNode(m, 0))}
                    </div>
                  )}
                </section>
              );
            });
          })()}

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
              onClick={() => onEditEntry(entry, isMaximized)}
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
                viewMode={viewMode}
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
            viewMode={viewMode}
          />
        )}
      </div>
    </div>
  );

  if (isMaximized && isMounted) {
    return createPortal(reportBody, document.body);
  }

  return reportBody;
};
