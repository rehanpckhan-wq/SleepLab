'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DailyEntry, StudyConfig, StudyProtocol } from '@/types/sleeplab';
import {
  fetchEntriesAsync,
  fetchStudyConfigAsync,
  fetchCustomMetricDefinitionsAsync,
  saveStudyConfigAsync,
  getLocalStudyConfig,
  hasUnmigratedLocalData,
  fetchStudiesAsync,
  getActiveStudyId,
  setActiveStudyId as setStoredActiveStudyId,
  reassignEntryStudyAsync,
} from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Header } from './Header';
import { DailyLogForm } from './DailyLogForm';
import { PreviousDaysList } from './PreviousDaysList';
import { DailyReport } from './DailyReport';
import { AuthModal } from './AuthModal';
import { SyncBanner } from './SyncBanner';
import { StudySettingsModal } from './StudySettingsModal';
import { CreateStudyModal } from './CreateStudyModal';
import { ExportDialog } from './ExportDialog';
import { PlusCircle, ListFilter, FileText, FlaskConical } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [studyConfig, setStudyConfig] = useState<StudyConfig>(getLocalStudyConfig());
  const [studies, setStudies] = useState<StudyProtocol[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string>(getActiveStudyId());

  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'report'>('log');
  const [selectedEntryToEdit, setSelectedEntryToEdit] = useState<DailyEntry | null>(null);
  const [selectedReportEntry, setSelectedReportEntry] = useState<DailyEntry | null>(null);
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isStudySettingsOpen, setIsStudySettingsOpen] = useState<boolean>(false);
  const [isCreateStudyOpen, setIsCreateStudyOpen] = useState<boolean>(false);
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
        const loadedStudies = await fetchStudiesAsync(targetUid);
        const loadedConfig = await fetchStudyConfigAsync(targetUid);
        await fetchCustomMetricDefinitionsAsync(targetUid);

        setEntries(loadedEntries);
        setStudies(loadedStudies);
        setStudyConfig(loadedConfig);

        if (targetUid && hasUnmigratedLocalData()) {
          setShowSyncBanner(true);
        } else {
          setShowSyncBanner(false);
        }
        return { loadedEntries, loadedStudies, loadedConfig };
      } catch (err) {
        console.error('Error fetching study data:', err);
        return { loadedEntries: [], loadedStudies: [], loadedConfig: getLocalStudyConfig() };
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

  // Ensure activeStudy is derived accurately
  const activeStudy: StudyProtocol =
    studies.find((s) => s.id === activeStudyId) ||
    (studies.length > 0 ? studies[0] : {
      id: studyConfig.id || 'study-default',
      title: studyConfig.title || 'SleepLab N=1 Longitudinal Study',
      startDate: studyConfig.startDate || new Date().toISOString().split('T')[0],
      durationDays: studyConfig.durationDays || 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

  // Filter entries to active study
  const filteredEntries = entries.filter((e) => !e.studyId || e.studyId === activeStudy.id);

  useEffect(() => {
    setCurrentDayNumber(filteredEntries.length + 1);
  }, [filteredEntries]);

  const handleSelectStudy = (studyId: string) => {
    setActiveStudyId(studyId);
    setStoredActiveStudyId(studyId);
  };

  const handleStudyCreated = (newStudy: StudyProtocol) => {
    setStudies((prev) => [...prev, newStudy]);
    setActiveStudyId(newStudy.id);
    setStoredActiveStudyId(newStudy.id);
    refreshData(userId);
  };

  const handleReassignEntryStudy = async (entryId: string, targetStudyId: string) => {
    await reassignEntryStudyAsync(entryId, targetStudyId, userId);
    await refreshData(userId);
  };

  const handleSavedEntry = async (savedEntry: DailyEntry) => {
    const entryWithStudy = { ...savedEntry, studyId: activeStudy.id };
    const { loadedEntries } = await refreshData(userId);
    setSelectedEntryToEdit(null);
    const freshInstance =
      loadedEntries.find((e) => e.id === savedEntry.id || e.date === savedEntry.date) || entryWithStudy;
    setSelectedReportEntry(freshInstance);
    setExportEntries(undefined);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveStudyConfig = async (newConfig: StudyConfig) => {
    await saveStudyConfigAsync(newConfig, userId);
    setStudyConfig(newConfig);
    refreshData(userId);
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
      targetList = filteredEntries.filter((e) => e.dayNumber >= fromDay && e.dayNumber <= toDay);
      label = `Days ${fromDay}–${toDay}`;
    } else {
      targetList = filteredEntries;
      label = `Days 1–${filteredEntries.length}`;
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

  // Average stats calculations for Active Study
  const totalSleepMinutesSum = filteredEntries.reduce((acc, e) => acc + (e.calculatedMetrics?.totalSleepMinutes || 0), 0);
  const avgSleepMinutes = filteredEntries.length > 0 ? Math.round(totalSleepMinutesSum / filteredEntries.length) : 0;
  const avgSleepHours = Math.floor(avgSleepMinutes / 60);
  const avgSleepMinsRem = avgSleepMinutes % 60;
  const avgSleepFormatted = filteredEntries.length > 0 ? `${avgSleepHours}h ${avgSleepMinsRem}m` : '0h 0m';

  const recoveryScoresSum = filteredEntries.reduce((acc, e) => acc + (e.calculatedMetrics?.recoveryIndexScore || 0), 0);
  const avgRecoveryScore = filteredEntries.length > 0 ? Math.round((recoveryScoresSum / filteredEntries.length) * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-[var(--canvas)] font-sans text-[var(--text-primary)] flex flex-col transition-colors duration-200">
      <Header
        activeStudy={activeStudy}
        allStudies={studies}
        currentDayNumber={currentDayNumber > activeStudy.durationDays ? activeStudy.durationDays : currentDayNumber}
        totalEntriesCount={filteredEntries.length}
        avgSleepFormatted={avgSleepFormatted}
        avgRecoveryScore={avgRecoveryScore}
        userEmail={userEmail}
        onSelectStudy={handleSelectStudy}
        onCreateNewStudy={() => setIsCreateStudyOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenStudySettings={() => setIsStudySettingsOpen(true)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-default)] gap-4 mb-8">
          <div className="flex space-x-2 flex-wrap">
            <button
              onClick={handleStartNewLog}
              className={`flex items-center gap-2 px-4 py-2.5 font-sans text-xs rounded-t-md focus:outline-none focus:ring-0 select-none transition-colors duration-150 -mb-px ${
                activeTab === 'log' && !selectedEntryToEdit
                  ? 'bg-[var(--surface)] text-[var(--accent)] border-t border-l border-r border-[var(--border-default)] border-b-[var(--surface)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] border border-transparent font-medium'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[var(--accent)]" /> Log Today
            </button>

            {selectedEntryToEdit && (
              <button
                onClick={() => setActiveTab('log')}
                className={`flex items-center gap-2 px-4 py-2.5 font-sans text-xs font-semibold rounded-t-md focus:outline-none focus:ring-0 select-none transition-colors duration-150 bg-[var(--accent-soft)] text-[var(--accent)] border-t border-l border-r border-[var(--accent)]/30 border-b-[var(--canvas)] -mb-px`}
              >
                <FileText className="w-3.5 h-3.5 text-[var(--accent)]" /> Editing Day {selectedEntryToEdit.dayNumber} (
                {selectedEntryToEdit.date})
              </button>
            )}

            {activeTab === 'report' && selectedReportEntry && (
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-4 py-2.5 font-sans text-xs font-semibold rounded-t-md focus:outline-none focus:ring-0 select-none transition-colors duration-150 bg-[var(--surface)] text-[var(--accent)] border-t border-l border-r border-[var(--border-default)] border-b-[var(--surface)] -mb-px`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-[var(--accent)]" /> Daily Report: Day{' '}
                {selectedReportEntry.dayNumber}
              </button>
            )}

            <button
              onClick={() => {
                setSelectedEntryToEdit(null);
                setActiveTab('history');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 font-sans text-xs rounded-t-md focus:outline-none focus:ring-0 select-none transition-colors duration-150 -mb-px ${
                activeTab === 'history'
                  ? 'bg-[var(--surface)] text-[var(--accent)] border-t border-l border-r border-[var(--border-default)] border-b-[var(--surface)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] border border-transparent font-medium'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-[var(--accent)]" /> Log & Trends ({filteredEntries.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'log' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-normal text-[var(--text-primary)]">
                {selectedEntryToEdit
                  ? `Edit Record: Day ${selectedEntryToEdit.dayNumber} (${selectedEntryToEdit.date})`
                  : `Daily Observation Log: ${activeStudy.title}`}
              </h2>
              <p className="text-xs font-sans text-[var(--text-secondary)] mt-1 max-w-2xl">
                Log your sleep & recovery parameters for this active study protocol. Data is synced to your account.
              </p>
            </div>

            <DailyLogForm
              key={selectedEntryToEdit ? selectedEntryToEdit.id : `new-entry-${activeStudy.id}`}
              initialEntry={selectedEntryToEdit}
              userId={userId}
              onSaved={handleSavedEntry}
              onCancel={selectedEntryToEdit ? () => setActiveTab('history') : undefined}
            />
          </div>
        ) : activeTab === 'report' && selectedReportEntry ? (
          <DailyReport
            entry={selectedReportEntry}
            allEntries={filteredEntries}
            studyConfig={{
              id: activeStudy.id,
              title: activeStudy.title,
              startDate: activeStudy.startDate,
              durationDays: activeStudy.durationDays,
            }}
            exportEntries={exportEntries}
            exportScopeLabel={exportScopeLabel}
            onBackToHistory={() => setActiveTab('history')}
            onEditEntry={handleSelectEntryForEdit}
            onNavigateToEntry={handleNavigateReportEntry}
            onOpenExportDialog={() => setIsExportDialogOpen(true)}
          />
        ) : (
          <PreviousDaysList
            entries={filteredEntries}
            allStudies={studies}
            activeStudyId={activeStudy.id}
            userId={userId}
            studyConfig={{
              id: activeStudy.id,
              title: activeStudy.title,
              startDate: activeStudy.startDate,
              durationDays: activeStudy.durationDays,
            }}
            onSelectEntry={handleSelectEntryForEdit}
            onViewReport={handleViewReport}
            onReassignEntryStudy={handleReassignEntryStudy}
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

      {/* Create New Study Protocol Modal */}
      <CreateStudyModal
        isOpen={isCreateStudyOpen}
        userId={userId}
        onClose={() => setIsCreateStudyOpen(false)}
        onStudyCreated={handleStudyCreated}
      />

      {/* Study Settings Protocol Modal */}
      <StudySettingsModal
        isOpen={isStudySettingsOpen}
        config={{
          id: activeStudy.id,
          title: activeStudy.title,
          startDate: activeStudy.startDate,
          durationDays: activeStudy.durationDays,
        }}
        onClose={() => setIsStudySettingsOpen(false)}
        onSave={handleSaveStudyConfig}
      />

      {/* Flexible Export PDF Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        entries={filteredEntries}
        studyConfig={{
          id: activeStudy.id,
          title: activeStudy.title,
          startDate: activeStudy.startDate,
          durationDays: activeStudy.durationDays,
        }}
        selectedEntry={selectedReportEntry}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleTriggerExport}
      />

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--border-default)] bg-[var(--canvas)] py-5 mt-auto transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-[var(--text-tertiary)] gap-2">
          <div>SleepLab N=1 Longitudinal Study Protocol ({activeStudy.title})</div>
          <div>{userId && userEmail ? `Synced with Supabase (@${userEmail.split('@')[0]})` : 'Offline / Local Persistence'}</div>
        </div>
      </footer>
    </div>
  );
};

