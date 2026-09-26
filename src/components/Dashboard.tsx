'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DailyEntry, StudyConfig, StudyProtocol, StudySchema } from '@/types/sleeplab';
import {
  fetchEntriesAsync,
  fetchStudyConfigAsync,
  fetchCustomMetricDefinitionsAsync,
  saveStudyConfigAsync,
  saveStudyAsync,
  getLocalStudyConfig,
  hasUnmigratedLocalData,
  fetchStudiesAsync,
  getActiveStudyId,
  setActiveStudyId as setStoredActiveStudyId,
  reassignEntryStudyAsync,
} from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { ArrowLeft } from 'lucide-react';

import { Sidebar, ViewMode } from './Sidebar';
import { TopNav } from './TopNav';
import { HomeOverview } from './HomeOverview';
import { DailyLogForm } from './DailyLogForm';
import { PreviousDaysList } from './PreviousDaysList';
import { DailyReport } from './DailyReport';
import { ReportsView } from './ReportsView';
import { EditRecordsView } from './EditRecordsView';
import { ExportView } from './ExportView';
import { SingleReportPrint } from './SingleReportPrint';

import { AuthModal } from './AuthModal';
import { SyncBanner } from './SyncBanner';
import { StudySettingsModal } from './StudySettingsModal';
import { CreateStudyModal } from './CreateStudyModal';
import { ExportDialog } from './ExportDialog';
import { ProtocolSchemaEditorModal } from './ProtocolSchemaEditorModal';

export const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [studyConfig, setStudyConfig] = useState<StudyConfig>(getLocalStudyConfig());
  const [studies, setStudies] = useState<StudyProtocol[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string>(getActiveStudyId());

  // Layout & Hover Drawer Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewHistory, setViewHistory] = useState<ViewMode[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const currentView = viewHistory[historyIndex] || 'home';

  const [selectedEntryToEdit, setSelectedEntryToEdit] = useState<DailyEntry | null>(null);
  const [selectedReportEntry, setSelectedReportEntry] = useState<DailyEntry | null>(null);
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Theme & Mounting State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isStudySettingsOpen, setIsStudySettingsOpen] = useState<boolean>(false);
  const [isCreateStudyOpen, setIsCreateStudyOpen] = useState<boolean>(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);
  const [isSchemaEditorOpen, setIsSchemaEditorOpen] = useState<boolean>(false);
  const [showSyncBanner, setShowSyncBanner] = useState<boolean>(false);

  // PDF Export fallback state
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
    const currentTheme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    setTheme(currentTheme);

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

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('sleeplab_theme', nextTheme);
  };

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

  const filteredEntries = entries.filter((e) => !e.studyId || e.studyId === activeStudy.id);

  useEffect(() => {
    setCurrentDayNumber(filteredEntries.length + 1);
  }, [filteredEntries]);

  // Navigation history handler
  const handleNavigate = (newView: ViewMode) => {
    if (newView === 'log') {
      setSelectedEntryToEdit(null);
    }
    const newHistory = viewHistory.slice(0, historyIndex + 1);
    newHistory.push(newView);
    setViewHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoForward = () => {
    if (historyIndex < viewHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
    handleNavigate('report-detail');
  };

  const handleSaveStudyConfig = async (newConfig: StudyConfig) => {
    await saveStudyConfigAsync(newConfig, userId);
    setStudyConfig(newConfig);
    refreshData(userId);
  };

  const handleSaveSchema = async (newSchema: StudySchema) => {
    const updatedStudy: StudyProtocol = {
      ...activeStudy,
      schema: newSchema,
    };
    setStudies((prev) => prev.map((s) => (s.id === updatedStudy.id ? updatedStudy : s)));
    try {
      await saveStudyAsync(updatedStudy, userId);
    } catch (e) {
      console.warn('Supabase save failed, study updated locally:', e);
    }
    await refreshData(userId);
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sleeplab_entries_v1');
        localStorage.removeItem('sleeplab_studies_list_v1');
        localStorage.removeItem('sleeplab_study_config_v1');
        localStorage.removeItem('sleeplab_custom_metrics_v1');
        localStorage.removeItem('sleeplab_active_study_id_v1');
        localStorage.removeItem('sleeplab_migrated_v1');
      } catch (e) {}
    }
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
      setUserId(null);
      setUserEmail(null);
      refreshData(null);
    }
  };

  const handleSelectEntryForEdit = (entry: DailyEntry) => {
    setSelectedEntryToEdit(entry);
    handleNavigate('edit-form');
  };

  const handleSelectReport = (entry: DailyEntry) => {
    setSelectedReportEntry(entry);
    handleNavigate('report-detail');
  };

  const handleNavigateReportEntry = (targetEntry: DailyEntry) => {
    setSelectedReportEntry(targetEntry);
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
      if (currentView !== 'export') {
        handleNavigate('report-detail');
      }
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  // Average stats calculations
  const totalSleepMinutesSum = filteredEntries.reduce(
    (acc, e) => acc + (e.calculatedMetrics?.totalSleepMinutes || 0),
    0
  );
  const avgSleepMinutes = filteredEntries.length > 0 ? Math.round(totalSleepMinutesSum / filteredEntries.length) : 0;
  const avgSleepHours = Math.floor(avgSleepMinutes / 60);
  const avgSleepMinsRem = avgSleepMinutes % 60;
  const avgSleepFormatted = filteredEntries.length > 0 ? `${avgSleepHours}h ${avgSleepMinsRem}m` : '0h 0m';

  const recoveryScoresSum = filteredEntries.reduce(
    (acc, e) => acc + (e.calculatedMetrics?.recoveryIndexScore || 0),
    0
  );
  const avgRecoveryScore =
    filteredEntries.length > 0 ? Math.round((recoveryScoresSum / filteredEntries.length) * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-[var(--canvas)] font-sans text-[var(--text-primary)] flex flex-col transition-colors duration-200 relative overflow-x-hidden">
      {/* Hover Trigger Zone on Left Screen Edge */}
      <div
        className="fixed top-0 left-0 bottom-0 w-3 z-40"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />

      {/* Floating Hover Overlay Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onMouseEnterSidebar={() => setIsSidebarOpen(true)}
        userEmail={userEmail}
        activeStudyTitle={activeStudy.title}
        totalEntriesCount={filteredEntries.length}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenStudySettings={() => setIsStudySettingsOpen(true)}
        onOpenSchemaEditor={() => setIsSchemaEditorOpen(true)}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Full-Width Content Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header / Bar */}
        <TopNav
          currentView={currentView}
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < viewHistory.length - 1}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onNavigate={handleNavigate}
          activeStudy={activeStudy}
          allStudies={studies}
          onSelectStudy={handleSelectStudy}
          onCreateNewStudy={() => setIsCreateStudyOpen(true)}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {/* Sync Banner */}
          {userId && showSyncBanner && (
            <div className="mb-6">
              <SyncBanner
                userId={userId}
                onMigrationComplete={() => {
                  setShowSyncBanner(false);
                  refreshData(userId);
                }}
              />
            </div>
          )}

          {currentView === 'home' && (
            <HomeOverview
              activeStudy={activeStudy}
              entries={filteredEntries}
              currentDayNumber={currentDayNumber > activeStudy.durationDays ? activeStudy.durationDays : currentDayNumber}
              avgSleepFormatted={avgSleepFormatted}
              avgRecoveryScore={avgRecoveryScore}
              onNavigate={handleNavigate}
              onSelectReport={handleSelectReport}
            />
          )}

          {currentView === 'log' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 border-b border-[var(--border-default)] pb-4">
                <h1 className="text-2xl font-serif text-[var(--text-primary)]">
                  Daily Observation Log: {activeStudy.title}
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Log your sleep & recovery parameters for this active study protocol. Data is synced to your account.
                </p>
              </div>

              <DailyLogForm
                key={`new-entry-${activeStudy.id}`}
                initialEntry={null}
                studySchema={activeStudy.schema}
                userId={userId}
                onSaved={handleSavedEntry}
                onOpenSchemaEditor={() => setIsSchemaEditorOpen(true)}
              />
            </div>
          )}

          {currentView === 'edit-form' && selectedEntryToEdit && (
            <div className="max-w-4xl mx-auto space-y-6 font-sans">
              <div className="border-b border-[var(--border-default)] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20">
                      Editing Record
                    </span>
                  </div>
                  <h1 className="text-2xl font-serif text-[var(--text-primary)]">
                    Edit Record: Day {selectedEntryToEdit.dayNumber} ({selectedEntryToEdit.date})
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Update parameter values and observation notes for this recorded date in {activeStudy.title}.
                  </p>
                </div>
              </div>

              <DailyLogForm
                key={`edit-entry-${selectedEntryToEdit.id}`}
                initialEntry={selectedEntryToEdit}
                isDateLocked={true}
                studySchema={activeStudy.schema}
                userId={userId}
                onSaved={handleSavedEntry}
                onCancel={() => handleNavigate('history')}
                onOpenSchemaEditor={() => setIsSchemaEditorOpen(true)}
              />
            </div>
          )}

          {currentView === 'history' && (
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
                schema: activeStudy.schema,
              }}
              onSelectEntry={handleSelectEntryForEdit}
              onViewReport={handleSelectReport}
              onReassignEntryStudy={handleReassignEntryStudy}
              onEntriesChanged={() => refreshData(userId)}
              onNewLogClick={() => handleNavigate('log')}
              onOpenExportDialog={() => setIsExportDialogOpen(true)}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              entries={filteredEntries}
              studyConfig={{
                id: activeStudy.id,
                title: activeStudy.title,
                startDate: activeStudy.startDate,
                durationDays: activeStudy.durationDays,
                schema: activeStudy.schema,
              }}
              onSelectReport={handleSelectReport}
            />
          )}

          {currentView === 'edit' && (
            <EditRecordsView
              entries={filteredEntries}
              studyConfig={{
                id: activeStudy.id,
                title: activeStudy.title,
                startDate: activeStudy.startDate,
                durationDays: activeStudy.durationDays,
                schema: activeStudy.schema,
              }}
              onSelectEntryToEdit={handleSelectEntryForEdit}
            />
          )}

          {currentView === 'export' && (
            <ExportView
              entries={filteredEntries}
              studyConfig={{
                id: activeStudy.id,
                title: activeStudy.title,
                startDate: activeStudy.startDate,
                durationDays: activeStudy.durationDays,
                schema: activeStudy.schema,
              }}
              onTriggerExport={handleTriggerExport}
            />
          )}

          {currentView === 'report-detail' && selectedReportEntry && (
            <DailyReport
              initialMaximized={false}
              entry={selectedReportEntry}
              allEntries={filteredEntries}
              studyConfig={{
                id: activeStudy.id,
                title: activeStudy.title,
                startDate: activeStudy.startDate,
                durationDays: activeStudy.durationDays,
                schema: activeStudy.schema,
              }}
              exportEntries={exportEntries}
              exportScopeLabel={exportScopeLabel}
              onBackToHistory={() => handleNavigate('reports')}
              onEditEntry={handleSelectEntryForEdit}
              onNavigateToEntry={handleNavigateReportEntry}
              onOpenExportDialog={() => handleNavigate('export')}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border-default)] bg-[var(--canvas)] py-4 mt-auto transition-colors duration-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-tertiary)] gap-2">
            <div>SleepLab N=1 Longitudinal Study ({activeStudy.title})</div>
            <div>{userId && userEmail ? `Synced with Supabase (@${userEmail.split('@')[0]})` : 'Offline / Local Persistence'}</div>
          </div>
        </footer>
      </div>

      {/* Modals */}
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

      <CreateStudyModal
        isOpen={isCreateStudyOpen}
        userId={userId}
        onClose={() => setIsCreateStudyOpen(false)}
        onStudyCreated={handleStudyCreated}
      />

      <StudySettingsModal
        isOpen={isStudySettingsOpen}
        config={{
          id: activeStudy.id,
          title: activeStudy.title,
          startDate: activeStudy.startDate,
          durationDays: activeStudy.durationDays,
          schema: activeStudy.schema,
        }}
        onClose={() => setIsStudySettingsOpen(false)}
        onSave={handleSaveStudyConfig}
      />

      <ProtocolSchemaEditorModal
        isOpen={isSchemaEditorOpen}
        study={activeStudy}
        onClose={() => setIsSchemaEditorOpen(false)}
        onSaveSchema={handleSaveSchema}
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        entries={filteredEntries}
        studyConfig={{
          id: activeStudy.id,
          title: activeStudy.title,
          startDate: activeStudy.startDate,
          durationDays: activeStudy.durationDays,
          schema: activeStudy.schema,
        }}
        selectedEntry={selectedReportEntry}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleTriggerExport}
      />
      {/* Dedicated Scientific Print / PDF Presentation Container */}
      {isMounted &&
        createPortal(
          <div className="hidden print:block font-sans text-paper-900 space-y-4">
            {exportEntries && exportEntries.length > 0 ? (
              exportEntries.map((expEntry, index) => (
                <React.Fragment key={expEntry.id || expEntry.date}>
                  {index > 0 && <div className="print-page-break" />}
                  <SingleReportPrint
                    entry={expEntry}
                    studyConfig={{
                      id: activeStudy.id,
                      title: activeStudy.title,
                      startDate: activeStudy.startDate,
                      durationDays: activeStudy.durationDays,
                      schema: activeStudy.schema,
                    }}
                    isFirstReport={index === 0}
                    totalExportCount={exportEntries.length}
                    exportScopeLabel={exportScopeLabel}
                    viewMode="tree"
                  />
                </React.Fragment>
              ))
            ) : selectedReportEntry ? (
              <SingleReportPrint
                entry={selectedReportEntry}
                studyConfig={{
                  id: activeStudy.id,
                  title: activeStudy.title,
                  startDate: activeStudy.startDate,
                  durationDays: activeStudy.durationDays,
                  schema: activeStudy.schema,
                }}
                isFirstReport={true}
                totalExportCount={1}
                exportScopeLabel={exportScopeLabel}
                viewMode="tree"
              />
            ) : null}
          </div>,
          document.body
        )}
    </div>
  );
};
