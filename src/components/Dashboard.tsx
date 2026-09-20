'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DailyEntry, StudyConfig } from '@/types/sleeplab';
import {
  fetchEntriesAsync,
  fetchStudyConfigAsync,
  fetchCustomMetricDefinitionsAsync,
  saveStudyConfigAsync,
  getLocalStudyConfig,
  hasUnmigratedLocalData,
} from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Header } from './Header';
import { DailyLogForm } from './DailyLogForm';
import { PreviousDaysList } from './PreviousDaysList';
import { DailyReport } from './DailyReport';
import { AuthModal } from './AuthModal';
import { SyncBanner } from './SyncBanner';
import { StudySettingsModal } from './StudySettingsModal';
import { ExportDialog } from './ExportDialog';
import { PlusCircle, ListFilter, FileText, FlaskConical } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [studyConfig, setStudyConfig] = useState<StudyConfig>(getLocalStudyConfig());
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'report'>('log');
  const [selectedEntryToEdit, setSelectedEntryToEdit] = useState<DailyEntry | null>(null);
  const [selectedReportEntry, setSelectedReportEntry] = useState<DailyEntry | null>(null);
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isStudySettingsOpen, setIsStudySettingsOpen] = useState<boolean>(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);
  const [showSyncBanner, setShowSyncBanner] = useState<boolean>(false);

  // Export PDF compilation state
  const [exportEntries, setExportEntries] = useState<DailyEntry[] | undefined>(undefined);
  const [exportScopeLabel, setExportScopeLabel] = useState<string>('');

  const refreshData = useCallback(
    async (uid?: string | null) => {
      try {
        const targetUid = uid !== undefined ? uid : userId;
        const loadedEntries = await fetchEntriesAsync(targetUid);
        const loadedConfig = await fetchStudyConfigAsync(targetUid);
        await fetchCustomMetricDefinitionsAsync(targetUid);

        setEntries(loadedEntries);
        setStudyConfig(loadedConfig);
        setCurrentDayNumber(loadedEntries.length + 1);

        if (targetUid && hasUnmigratedLocalData()) {
          setShowSyncBanner(true);
        } else {
          setShowSyncBanner(false);
        }
        return { loadedEntries, loadedConfig };
      } catch (err) {
        console.error('Error fetching study data:', err);
        return { loadedEntries: [], loadedConfig: getLocalStudyConfig() };
      }
    },
    [userId]
  );

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email ?? null);
          refreshData(session.user.id);
        } else {
          setUserId(null);
          setUserEmail(null);
          refreshData(null);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email ?? null);
          refreshData(session.user.id);
        } else {
          setUserId(null);
          setUserEmail(null);
          refreshData(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      refreshData(null);
    }
  }, []);

  const handleSavedEntry = async (savedEntry: DailyEntry) => {
    const { loadedEntries } = await refreshData(userId);
    setSelectedEntryToEdit(null);
    const freshInstance =
      loadedEntries.find((e) => e.id === savedEntry.id || e.date === savedEntry.date) || savedEntry;
    setSelectedReportEntry(freshInstance);
    setExportEntries(undefined);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveStudyConfig = async (newConfig: StudyConfig) => {
    await saveStudyConfigAsync(newConfig, userId);
    setStudyConfig(newConfig);
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
      setUserId(null);
      setUserEmail(null);
      refreshData(null);
    }
  };

  const handleSelectEntryForEdit = (entry: DailyEntry) => {
    setSelectedEntryToEdit(entry);
    setSelectedReportEntry(null);
    setExportEntries(undefined);
    setActiveTab('log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewReport = (entry: DailyEntry) => {
    setSelectedReportEntry(entry);
    setSelectedEntryToEdit(null);
    setExportEntries(undefined);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewLog = () => {
    setSelectedEntryToEdit(null);
    setSelectedReportEntry(null);
    setExportEntries(undefined);
    setActiveTab('log');
  };

  const handleNavigateReportEntry = (targetEntry: DailyEntry) => {
    setSelectedReportEntry(targetEntry);
    setExportEntries(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTriggerExport = (scope: 'current' | 'all' | 'range', fromDay?: number, toDay?: number) => {
    let targetList: DailyEntry[] = [];
    let label = '';

    if (scope === 'current' && selectedReportEntry) {
      targetList = [selectedReportEntry];
      label = `Day ${selectedReportEntry.dayNumber}`;
    } else if (scope === 'range' && fromDay && toDay) {
      targetList = entries.filter((e) => e.dayNumber >= fromDay && e.dayNumber <= toDay);
      label = `Days ${fromDay}–${toDay}`;
    } else {
      targetList = entries;
      label = `Days 1–${entries.length}`;
    }

    if (targetList.length > 0) {
      setExportEntries(targetList);
      setExportScopeLabel(label);
      if (!selectedReportEntry || scope !== 'current') {
        setSelectedReportEntry(targetList[0]);
      }
      setActiveTab('report');
      setTimeout(() => {
        window.print();
      }, 300);
    }
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
        studyConfig={studyConfig}
        currentDayNumber={currentDayNumber > studyConfig.durationDays ? studyConfig.durationDays : currentDayNumber}
        totalEntriesCount={entries.length}
        avgSleepFormatted={avgSleepFormatted}
        avgRecoveryScore={avgRecoveryScore}
        userEmail={userEmail}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenStudySettings={() => setIsStudySettingsOpen(true)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:px-6">
        {/* Sync Banner when local unmigrated entries exist */}
        {userId && showSyncBanner && (
          <SyncBanner
            userId={userId}
            onMigrationComplete={() => {
              setShowSyncBanner(false);
              refreshData(userId);
            }}
          />
        )}

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
                <FileText className="w-3.5 h-3.5 text-amber-700" /> Editing Day {selectedEntryToEdit.dayNumber} (
                {selectedEntryToEdit.date})
              </button>
            )}

            {activeTab === 'report' && selectedReportEntry && (
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-semibold rounded-t border-t border-l border-r transition-colors bg-white border-paper-300 text-academic-navy border-b-white -mb-px`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-academic-navy" /> Daily Report: Day{' '}
                {selectedReportEntry.dayNumber}
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
                Fill all parameters consistently (~2 minutes). Data is securely synced to Supabase when logged in.
              </p>
            </div>

            <DailyLogForm
              key={selectedEntryToEdit ? selectedEntryToEdit.id : 'new-entry'}
              initialEntry={selectedEntryToEdit}
              userId={userId}
              onSaved={handleSavedEntry}
              onCancel={selectedEntryToEdit ? () => setActiveTab('history') : undefined}
            />
          </div>
        ) : activeTab === 'report' && selectedReportEntry ? (
          <DailyReport
            entry={selectedReportEntry}
            allEntries={entries}
            studyConfig={studyConfig}
            exportEntries={exportEntries}
            exportScopeLabel={exportScopeLabel}
            onBackToHistory={() => setActiveTab('history')}
            onEditEntry={handleSelectEntryForEdit}
            onNavigateToEntry={handleNavigateReportEntry}
            onOpenExportDialog={() => setIsExportDialogOpen(true)}
          />
        ) : (
          <PreviousDaysList
            entries={entries}
            userId={userId}
            studyConfig={studyConfig}
            onSelectEntry={handleSelectEntryForEdit}
            onViewReport={handleViewReport}
            onEntriesChanged={() => refreshData(userId)}
            onNewLogClick={handleStartNewLog}
            onOpenExportDialog={() => setIsExportDialogOpen(true)}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          if (isSupabaseConfigured() && supabase) {
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                setUserId(user.id);
                setUserEmail(user.email ?? null);
                refreshData(user.id);
              }
            });
          }
        }}
      />

      {/* Study Settings Protocol Modal */}
      <StudySettingsModal
        isOpen={isStudySettingsOpen}
        config={studyConfig}
        onClose={() => setIsStudySettingsOpen(false)}
        onSave={handleSaveStudyConfig}
      />

      {/* Flexible Export PDF Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        entries={entries}
        studyConfig={studyConfig}
        selectedEntry={selectedReportEntry}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleTriggerExport}
      />

      {/* Academic Footer */}
      <footer className="border-t border-paper-200 bg-white py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-academic-muted gap-2">
          <div>SleepLab N=1 Longitudinal Study · Phase 2.6 Study Configuration</div>
          <div>{userId && userEmail ? `Synced with Supabase (@${userEmail.split('@')[0]})` : 'Offline / Local Browser Persistence'}</div>
        </div>
      </footer>
    </div>
  );
};
