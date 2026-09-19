'use client';

import React, { useState, useEffect } from 'react';
import { DailyEntry } from '@/types/sleeplab';
import { getEntries, getNextDayNumber } from '@/lib/storage';
import { Header } from './Header';
import { DailyLogForm } from './DailyLogForm';
import { PreviousDaysList } from './PreviousDaysList';
import { DailyReport } from './DailyReport';
import { PlusCircle, ListFilter, FileText, FlaskConical } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'report'>('log');
  const [selectedEntryToEdit, setSelectedEntryToEdit] = useState<DailyEntry | null>(null);
  const [selectedReportEntry, setSelectedReportEntry] = useState<DailyEntry | null>(null);
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(1);

  const refreshEntries = () => {
    try {
      const loaded = getEntries();
      setEntries(loaded);
      setCurrentDayNumber(getNextDayNumber());
      return loaded;
    } catch (err) {
      console.error('Error fetching entries:', err);
      return [];
    }
  };

  useEffect(() => {
    refreshEntries();
  }, []);

  const handleSaved = (savedEntry: DailyEntry) => {
    const updatedEntries = refreshEntries();
    setSelectedEntryToEdit(null);
    // Find the latest saved entry instance
    const freshInstance = updatedEntries.find((e) => e.id === savedEntry.id || e.date === savedEntry.date) || savedEntry;
    setSelectedReportEntry(freshInstance);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEntryForEdit = (entry: DailyEntry) => {
    setSelectedEntryToEdit(entry);
    setSelectedReportEntry(null);
    setActiveTab('log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewReport = (entry: DailyEntry) => {
    setSelectedReportEntry(entry);
    setSelectedEntryToEdit(null);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewLog = () => {
    setSelectedEntryToEdit(null);
    setSelectedReportEntry(null);
    setActiveTab('log');
  };

  const handleNavigateReportEntry = (targetEntry: DailyEntry) => {
    setSelectedReportEntry(targetEntry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Average stats calculations
  const totalSleepMinutesSum = entries.reduce((acc, e) => acc + (e.calculatedMetrics?.totalSleepMinutes || 0), 0);
  const avgSleepMinutes = entries.length > 0 ? Math.round(totalSleepMinutesSum / entries.length) : 0;
  const avgSleepHours = Math.floor(avgSleepMinutes / 60);
  const avgSleepMinsRem = avgSleepMinutes % 60;
  const avgSleepFormatted = entries.length > 0 ? `${avgSleepHours}h ${avgSleepMinsRem}m` : '0h 0m';

  const recoveryScoresSum = entries.reduce((acc, e) => acc + (e.calculatedMetrics?.recoveryIndexScore || 0), 0);
  const avgRecoveryScore = entries.length > 0 ? Math.round((recoveryScoresSum / entries.length) * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-paper-50 font-sans text-paper-900 flex flex-col">
      <Header
        currentDayNumber={currentDayNumber > 30 ? 30 : currentDayNumber}
        totalEntriesCount={entries.length}
        avgSleepFormatted={avgSleepFormatted}
        avgRecoveryScore={avgRecoveryScore}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:px-6">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-paper-200 gap-4 mb-6">
          <div className="flex space-x-1 flex-wrap">
            <button
              onClick={handleStartNewLog}
              className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-semibold rounded-t border-t border-l border-r transition-colors ${
                activeTab === 'log' && !selectedEntryToEdit
                  ? 'bg-white border-paper-300 text-academic-navy border-b-white -mb-px'
                  : 'bg-paper-100 border-transparent text-academic-muted hover:text-paper-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" /> Log Today
            </button>

            {selectedEntryToEdit && (
              <button
                onClick={() => setActiveTab('log')}
                className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-semibold rounded-t border-t border-l border-r transition-colors bg-amber-50 border-amber-300 text-amber-900 border-b-white -mb-px`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" /> Editing Day {selectedEntryToEdit.dayNumber} ({selectedEntryToEdit.date})
              </button>
            )}

            {activeTab === 'report' && selectedReportEntry && (
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-semibold rounded-t border-t border-l border-r transition-colors bg-white border-paper-300 text-academic-navy border-b-white -mb-px`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-academic-navy" /> Daily Report: Day {selectedReportEntry.dayNumber}
              </button>
            )}

            <button
              onClick={() => {
                setSelectedEntryToEdit(null);
                setActiveTab('history');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-semibold rounded-t border-t border-l border-r transition-colors ${
                activeTab === 'history'
                  ? 'bg-white border-paper-300 text-academic-navy border-b-white -mb-px'
                  : 'bg-paper-100 border-transparent text-academic-muted hover:text-paper-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Previous Days ({entries.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'log' ? (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-serif font-bold text-paper-900">
                {selectedEntryToEdit
                  ? `Edit Record: Day ${selectedEntryToEdit.dayNumber} (${selectedEntryToEdit.date})`
                  : 'Daily Observation Log'}
              </h2>
              <p className="text-xs font-sans text-academic-slate mt-1">
                Fill all parameters consistently (~2 minutes). Data will be preserved locally in raw format.
              </p>
            </div>

            <DailyLogForm
              key={selectedEntryToEdit ? selectedEntryToEdit.id : 'new-entry'}
              initialEntry={selectedEntryToEdit}
              onSaved={handleSaved}
              onCancel={selectedEntryToEdit ? () => setActiveTab('history') : undefined}
            />
          </div>
        ) : activeTab === 'report' && selectedReportEntry ? (
          <DailyReport
            entry={selectedReportEntry}
            allEntries={entries}
            onBackToHistory={() => setActiveTab('history')}
            onEditEntry={handleSelectEntryForEdit}
            onNavigateToEntry={handleNavigateReportEntry}
          />
        ) : (
          <PreviousDaysList
            entries={entries}
            onSelectEntry={handleSelectEntryForEdit}
            onViewReport={handleViewReport}
            onEntriesChanged={refreshEntries}
            onNewLogClick={handleStartNewLog}
          />
        )}
      </main>

      {/* Academic Footer */}
      <footer className="border-t border-paper-200 bg-white py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-academic-muted gap-2">
          <div>SleepLab N=1 Longitudinal Study · Phase 2 Research Reports</div>
          <div>Raw data stored locally in browser storage</div>
        </div>
      </footer>
    </div>
  );
};
