'use client';

import React, { useState } from 'react';
import { DailyEntry, StudyConfig } from '@/types/sleeplab';
import { Download, FileText, CheckCircle, Database } from 'lucide-react';

interface ExportViewProps {
  entries: DailyEntry[];
  studyConfig: StudyConfig;
  onTriggerExport: (scope: 'current' | 'all' | 'range', fromDay?: number, toDay?: number) => void;
}

export const ExportView: React.FC<ExportViewProps> = ({ entries, studyConfig, onTriggerExport }) => {
  const [exportScope, setExportScope] = useState<'all' | 'single' | 'range'>('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string>(entries[0]?.id || '');
  const [startDay, setStartDay] = useState<number>(1);
  const [endDay, setEndDay] = useState<number>(entries.length || 30);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const maxLoggedDay = entries.length > 0 ? Math.max(...entries.map((e) => e.dayNumber)) : 1;

  const handleExportPDF = () => {
    setSuccessMessage(null);
    if (exportScope === 'all') {
      onTriggerExport('all');
      setSuccessMessage('Compiling PDF report for all study days...');
    } else if (exportScope === 'single') {
      onTriggerExport('current');
      setSuccessMessage('Compiling PDF report for selected day...');
    } else if (exportScope === 'range') {
      onTriggerExport('range', startDay, endDay);
      setSuccessMessage(`Compiling PDF report for Days ${startDay}–${endDay}...`);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sleeplab_data_${studyConfig.id}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSuccessMessage('Raw Study Data (JSON) exported successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="border-b border-[var(--border-default)] pb-5">
        <h1 className="text-2xl font-serif text-[var(--text-primary)] flex items-center gap-2.5">
          <Download className="w-6 h-6 text-[var(--accent)]" /> Export Center
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Compile and export publication-ready PDF reports or raw JSON datasets for {studyConfig.title}.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-[var(--success-soft)] border border-[var(--success)]/30 rounded-xl text-xs text-[var(--success)] font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Export Section */}
        <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
            <FileText className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">PDF Report Generation</h2>
          </div>

          {/* Scope Selector */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-[var(--text-secondary)] block">
              Select Export Scope
            </label>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-raised)] cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="accent-[var(--accent)]"
                />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Entire Protocol ({entries.length} Entries)</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Complete study summary document</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-raised)] cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="single"
                  checked={exportScope === 'single'}
                  onChange={() => setExportScope('single')}
                  className="accent-[var(--accent)]"
                />
                <div className="w-full">
                  <p className="font-semibold text-[var(--text-primary)]">Single Daily Observation</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mb-2">Export individual day analysis</p>
                  {exportScope === 'single' && (
                    <select
                      value={selectedEntryId}
                      onChange={(e) => setSelectedEntryId(e.target.value)}
                      className="w-full p-2 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md text-xs text-[var(--text-primary)]"
                    >
                      {entries.map((e) => (
                        <option key={e.id} value={e.id}>
                          Day {e.dayNumber} ({e.date})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-raised)] cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="range"
                  checked={exportScope === 'range'}
                  onChange={() => setExportScope('range')}
                  className="accent-[var(--accent)]"
                />
                <div className="w-full">
                  <p className="font-semibold text-[var(--text-primary)]">Custom Day Range</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mb-2">Export subset of days</p>
                  {exportScope === 'range' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={maxLoggedDay}
                        value={startDay}
                        onChange={(e) => setStartDay(Number(e.target.value))}
                        className="w-20 p-2 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md text-xs text-[var(--text-primary)]"
                        placeholder="Start"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        min={startDay}
                        max={maxLoggedDay}
                        value={endDay}
                        onChange={(e) => setEndDay(Number(e.target.value))}
                        className="w-20 p-2 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-md text-xs text-[var(--text-primary)]"
                        placeholder="End"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={entries.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Generate PDF Report
          </button>
        </div>

        {/* JSON Data Backup Section */}
        <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <Database className="w-5 h-5 text-[var(--accent)]" />
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Raw Data Export (JSON)</h2>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Download your complete raw observations dataset as structured JSON. Perfect for offline backups, statistical analysis in R/Python, or importing into external tools.
            </p>

            <div className="p-3 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg text-xs space-y-1">
              <p className="font-semibold text-[var(--text-primary)]">Dataset Statistics</p>
              <p className="text-[var(--text-tertiary)]">• Active Study: {studyConfig.title}</p>
              <p className="text-[var(--text-tertiary)]">• Total Entries: {entries.length}</p>
            </div>
          </div>

          <button
            onClick={handleExportJSON}
            disabled={entries.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] text-[var(--text-primary)] border border-[var(--border-default)] text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[var(--accent)]" /> Download Raw JSON
          </button>
        </div>
      </div>
    </div>
  );
};
