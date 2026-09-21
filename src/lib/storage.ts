import { DailyEntry, CustomMetricDefinition, StudyConfig, StudyProtocol, StudyStatus } from '@/types/sleeplab';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'sleeplab_entries_v1';
const START_DATE_KEY = 'sleeplab_start_date_v1';
const CUSTOM_METRICS_KEY = 'sleeplab_custom_metrics_v1';
const MIGRATION_DONE_KEY = 'sleeplab_migrated_v1';
const STUDY_CONFIG_KEY = 'sleeplab_study_config_v1';
const STUDIES_LIST_KEY = 'sleeplab_studies_list_v1';
const ACTIVE_STUDY_ID_KEY = 'sleeplab_active_study_id_v1';

export function calculateEndDate(startDateStr: string, durationDays: number): string {
  try {
    const [year, month, day] = startDateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + Math.max(1, durationDays) - 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return startDateStr;
  }
}

export function getStudyStatus(startDateStr: string, durationDays: number): StudyStatus {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const endDateStr = calculateEndDate(startDateStr, durationDays);
    if (todayStr < startDateStr) return 'Upcoming';
    if (todayStr > endDateStr) return 'Completed';
    return 'Active';
  } catch {
    return 'Active';
  }
}

export function generateReportId(dateStr: string, dayNumber: number): string {
  const year = dateStr ? dateStr.split('-')[0] : new Date().getFullYear().toString();
  const paddedDay = String(dayNumber).padStart(3, '0');
  return `SL-${year}-${paddedDay}`;
}

/* ========================================================================= */
/* MULTI-STUDY PROTOCOL MANAGEMENT                                           */
/* ========================================================================= */

export function getLocalStudies(): StudyProtocol[] {
  const defaultStartDate = (typeof window !== 'undefined' ? localStorage.getItem(START_DATE_KEY) : null) || new Date().toISOString().split('T')[0];
  const fallbackStudy: StudyProtocol = {
    id: 'study-default',
    title: 'SleepLab N=1 Longitudinal Study',
    startDate: defaultStartDate,
    durationDays: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return [fallbackStudy];

  try {
    const raw = localStorage.getItem(STUDIES_LIST_KEY);
    if (raw) {
      const parsed: StudyProtocol[] = JSON.parse(raw);
      if (parsed.length > 0) return parsed;
    }

    // Try reading legacy single study config without calling getLocalStudyConfig()
    const legacyRaw = localStorage.getItem(STUDY_CONFIG_KEY);
    if (legacyRaw) {
      const legacyConfig = JSON.parse(legacyRaw);
      const migratedStudy: StudyProtocol = {
        id: legacyConfig.id || 'study-default',
        title: legacyConfig.title || 'SleepLab N=1 Longitudinal Study',
        startDate: legacyConfig.startDate || defaultStartDate,
        durationDays: legacyConfig.durationDays || 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STUDIES_LIST_KEY, JSON.stringify([migratedStudy]));
      localStorage.setItem(ACTIVE_STUDY_ID_KEY, migratedStudy.id);
      return [migratedStudy];
    }
  } catch (e) {
    console.error('Failed to parse local studies list:', e);
  }

  try {
    localStorage.setItem(STUDIES_LIST_KEY, JSON.stringify([fallbackStudy]));
    localStorage.setItem(ACTIVE_STUDY_ID_KEY, fallbackStudy.id);
  } catch (e) {}

  return [fallbackStudy];
}

export function getActiveStudyId(): string {
  if (typeof window === 'undefined') return 'study-default';
  try {
    const savedId = localStorage.getItem(ACTIVE_STUDY_ID_KEY);
    if (savedId) return savedId;
  } catch (e) {}

  const studies = getLocalStudies();
  return studies[0]?.id || 'study-default';
}

export function setActiveStudyId(studyId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_STUDY_ID_KEY, studyId);
  } catch (e) {
    console.error('Failed to set active study ID:', e);
  }
}

export function saveLocalStudy(study: StudyProtocol): StudyProtocol[] {
  const studies = getLocalStudies();
  const existingIdx = studies.findIndex((s) => s.id === study.id);

  let updated: StudyProtocol[];
  if (existingIdx >= 0) {
    updated = [...studies];
    updated[existingIdx] = { ...study, updatedAt: new Date().toISOString() };
  } else {
    updated = [...studies, { ...study, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STUDIES_LIST_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save study locally:', e);
    }
  }
  return updated;
}

export async function fetchStudiesAsync(userId?: string | null): Promise<StudyProtocol[]> {
  const localStudies = getLocalStudies();
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return localStudies;
  }

  try {
    const { data, error } = await supabase
      .from('studies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return localStudies;

    const remoteStudies: StudyProtocol[] = data.map((row) => ({
      id: row.id,
      title: row.title,
      startDate: row.start_date,
      durationDays: row.duration_days,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STUDIES_LIST_KEY, JSON.stringify(remoteStudies));
      } catch (e) {}
    }
    return remoteStudies;
  } catch (err) {
    console.error('Failed to fetch studies from Supabase:', err);
    return localStudies;
  }
}

export async function saveStudyAsync(study: StudyProtocol, userId?: string | null): Promise<StudyProtocol> {
  saveLocalStudy(study);

  if (!isSupabaseConfigured() || !supabase || !userId) {
    return study;
  }

  try {
    const { error } = await supabase.from('studies').upsert({
      id: study.id,
      user_id: userId,
      title: study.title,
      start_date: study.startDate,
      duration_days: study.durationDays,
      description: study.description || null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return study;
  } catch (err) {
    console.error('Failed to save study to Supabase:', err);
    throw err;
  }
}

export async function deleteStudyAsync(studyId: string, userId?: string | null): Promise<void> {
  const studies = getLocalStudies();
  const filtered = studies.filter((s) => s.id !== studyId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STUDIES_LIST_KEY, JSON.stringify(filtered));
      if (getActiveStudyId() === studyId && filtered.length > 0) {
        setActiveStudyId(filtered[0].id);
      }
    } catch (e) {}
  }

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      await supabase.from('studies').delete().eq('id', studyId).eq('user_id', userId);
    } catch (e) {
      console.error('Failed to delete study from Supabase:', e);
    }
  }
}

export async function reassignEntryStudyAsync(
  entryId: string,
  targetStudyId: string,
  userId?: string | null
): Promise<DailyEntry[]> {
  const localEntries = getLocalEntries();
  const updatedLocal = localEntries.map((e) => (e.id === entryId ? { ...e, studyId: targetStudyId } : e));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocal));
    } catch (e) {}
  }

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      await supabase.from('daily_entries').update({ study_id: targetStudyId }).eq('id', entryId).eq('user_id', userId);
    } catch (e) {
      console.error('Failed to reassign entry study in Supabase:', e);
    }
  }

  return updatedLocal;
}

export async function autoAttachEntriesToStudyAsync(
  studyId: string,
  startDateStr: string,
  endDateStr: string,
  userId?: string | null
): Promise<number> {
  const localEntries = getLocalEntries();
  let count = 0;

  const updatedLocal = localEntries.map((e) => {
    if (e.date >= startDateStr && e.date <= endDateStr) {
      count++;
      return { ...e, studyId };
    }
    return e;
  });

  if (count > 0 && typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocal));
    } catch (e) {}
  }

  if (count > 0 && isSupabaseConfigured() && supabase && userId) {
    try {
      const targetEntries = updatedLocal.filter((e) => e.date >= startDateStr && e.date <= endDateStr);
      for (const entry of targetEntries) {
        await supabase.from('daily_entries').update({ study_id: studyId }).eq('id', entry.id).eq('user_id', userId);
      }
    } catch (e) {
      console.error('Failed to auto-attach entries in Supabase:', e);
    }
  }

  return count;
}

/* ========================================================================= */
/* LOCAL STORAGE SYNCHRONOUS HELPERS (Local Fallback & Seeding)              */
/* ========================================================================= */

export function getStoredStartDate(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(START_DATE_KEY);
  } catch (e) {
    return null;
  }
}

export function setStoredStartDate(dateStr: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(START_DATE_KEY, dateStr);
  } catch (e) {
    console.error('Failed to set start date:', e);
  }
}

export function getEntryByDate(dateStr: string): DailyEntry | undefined {
  const entries = getLocalEntries();
  return entries.find((e) => e.date === dateStr);
}

export function calculateDayNumber(startDateStr: string, targetDateStr: string): number {
  const start = new Date(startDateStr);
  const target = new Date(targetDateStr);
  const diffTime = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function getLocalStudyConfig(): StudyConfig {
  const studies = getLocalStudies();
  const activeId = getActiveStudyId();
  const currentStudy = studies.find((s) => s.id === activeId) || studies[0];
  if (currentStudy) return currentStudy;

  const defaultStartDate = getStoredStartDate() || new Date().toISOString().split('T')[0];
  return {
    id: 'study-default',
    title: 'SleepLab N=1 Longitudinal Study',
    startDate: defaultStartDate,
    durationDays: 30,
  };
}

export function saveLocalStudyConfig(config: StudyConfig): StudyConfig {
  saveLocalStudy(config);
  setActiveStudyId(config.id);
  setStoredStartDate(config.startDate);
  return config;
}

export async function fetchStudyConfigAsync(userId?: string | null): Promise<StudyConfig> {
  const studies = await fetchStudiesAsync(userId);
  const activeId = getActiveStudyId();
  const activeStudy = studies.find((s) => s.id === activeId) || studies[0];
  if (activeStudy) {
    setActiveStudyId(activeStudy.id);
    return activeStudy;
  }
  return getLocalStudyConfig();
}

export async function saveStudyConfigAsync(config: StudyConfig, userId?: string | null): Promise<StudyConfig> {
  return saveStudyAsync(config, userId);
}

export function getLocalEntries(): DailyEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: DailyEntry[] = JSON.parse(raw);
    const defaultStudyId = getActiveStudyId();

    // Auto-backfill studyId for legacy entries
    const normalized = entries.map((e) => ({
      ...e,
      studyId: e.studyId || defaultStudyId,
    }));

    return normalized.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('Failed to parse SleepLab entries from localStorage:', err);
    return [];
  }
}

export function getLocalCustomMetricDefinitions(): CustomMetricDefinition[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_METRICS_KEY);
    if (!raw) return [];
    const metrics: CustomMetricDefinition[] = JSON.parse(raw);
    return metrics.sort((a, b) => a.order - b.order);
  } catch (err) {
    console.error('Failed to parse Custom Metric Definitions:', err);
    return [];
  }
}

export function hasUnmigratedLocalData(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isMigrated = localStorage.getItem(MIGRATION_DONE_KEY) === 'true';
    if (isMigrated) return false;
    const entries = getLocalEntries();
    return entries.length > 0;
  } catch {
    return false;
  }
}

export function markLocalDataMigrated(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MIGRATION_DONE_KEY, 'true');
  } catch (e) {
    console.error('Failed to set migration flag:', e);
  }
}

export function getEntries(): DailyEntry[] {
  return getLocalEntries();
}

export function getCustomMetricDefinitions(): CustomMetricDefinition[] {
  return getLocalCustomMetricDefinitions();
}

export function getNextDayNumber(): number {
  const entries = getEntries();
  return entries.length + 1;
}

export function saveEntry(entry: DailyEntry): { entry: DailyEntry; isUpdate: boolean } {
  const entries = getLocalEntries();
  const currentStudyId = entry.studyId || getActiveStudyId();
  const existingIndex = entries.findIndex((e) => e.date === entry.date || e.id === entry.id);

  if (!getStoredStartDate()) {
    setStoredStartDate(entry.date);
  }

  let updatedEntries: DailyEntry[];
  let isUpdate = false;

  if (existingIndex >= 0) {
    isUpdate = true;
    const existing = entries[existingIndex];
    const updated: DailyEntry = {
      ...entry,
      id: existing.id,
      studyId: currentStudyId,
      dayNumber: existing.dayNumber,
      reportId: existing.reportId || entry.reportId || generateReportId(existing.date, existing.dayNumber),
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    updatedEntries = [...entries];
    updatedEntries[existingIndex] = updated;
  } else {
    const newDayNum = entries.length + 1;
    const newEntry: DailyEntry = {
      ...entry,
      studyId: currentStudyId,
      dayNumber: newDayNum,
      reportId: entry.reportId || generateReportId(entry.date, newDayNum),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updatedEntries = [...entries, newEntry];
  }

  updatedEntries.sort((a, b) => a.date.localeCompare(b.date));

  if (updatedEntries.length > 0) {
    const firstDate = updatedEntries[0].date;
    setStoredStartDate(firstDate);
    updatedEntries = updatedEntries.map((e, idx) => {
      const dayNum = idx + 1;
      return {
        ...e,
        dayNumber: dayNum,
        reportId: e.reportId || generateReportId(e.date, dayNum),
      };
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (e) {
    console.error('Failed to save entries to localStorage:', e);
  }

  const finalSaved = updatedEntries.find((e) => e.date === entry.date || e.id === entry.id) || entry;
  return { entry: finalSaved, isUpdate };
}

export function deleteEntry(id: string): void {
  const entries = getLocalEntries();
  const filtered = entries.filter((e) => e.id !== id);
  const reindexed = filtered.map((e, idx) => {
    const dayNum = idx + 1;
    return {
      ...e,
      dayNumber: dayNum,
      reportId: e.reportId || generateReportId(e.date, dayNum),
    };
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reindexed));
  } catch (e) {
    console.error('Failed to delete entry from localStorage:', e);
  }
}

export function saveCustomMetricDefinition(metric: CustomMetricDefinition): CustomMetricDefinition {
  const metrics = getLocalCustomMetricDefinitions();
  const existingIndex = metrics.findIndex((m) => m.id === metric.id);

  let updatedMetrics: CustomMetricDefinition[];

  if (existingIndex >= 0) {
    const existing = metrics[existingIndex];
    const updated: CustomMetricDefinition = {
      ...existing,
      ...metric,
      updatedAt: new Date().toISOString(),
    };
    updatedMetrics = [...metrics];
    updatedMetrics[existingIndex] = updated;
  } else {
    const maxOrder = metrics.length > 0 ? Math.max(...metrics.map((m) => m.order)) : 0;
    const newMetric: CustomMetricDefinition = {
      ...metric,
      order: metric.order ?? maxOrder + 1,
      active: metric.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updatedMetrics = [...metrics, newMetric];
  }

  updatedMetrics.sort((a, b) => a.order - b.order);

  try {
    localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(updatedMetrics));
  } catch (e) {
    console.error('Failed to save custom metrics to localStorage:', e);
  }

  return metric;
}

export function archiveCustomMetric(id: string): void {
  const metrics = getLocalCustomMetricDefinitions();
  const updated = metrics.map((m) => (m.id === id ? { ...m, active: false, updatedAt: new Date().toISOString() } : m));
  try {
    localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to archive custom metric:', e);
  }
}

export function restoreCustomMetric(id: string): void {
  const metrics = getLocalCustomMetricDefinitions();
  const updated = metrics.map((m) => (m.id === id ? { ...m, active: true, updatedAt: new Date().toISOString() } : m));
  try {
    localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to restore custom metric:', e);
  }
}

export function reorderCustomMetrics(orderedIds: string[]): void {
  const metrics = getLocalCustomMetricDefinitions();
  const metricsMap = new Map(metrics.map((m) => [m.id, m]));

  const updated: CustomMetricDefinition[] = orderedIds.map((id, index) => {
    const m = metricsMap.get(id)!;
    return { ...m, order: index + 1 };
  });

  metrics.forEach((m) => {
    if (!orderedIds.includes(m.id)) {
      updated.push({ ...m, order: updated.length + 1 });
    }
  });

  try {
    localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to reorder custom metrics:', e);
  }
}

export function deleteCustomMetricDefinition(id: string): void {
  const metrics = getLocalCustomMetricDefinitions();
  const filtered = metrics.filter((m) => m.id !== id);
  try {
    localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete custom metric definition:', e);
  }

  const entries = getLocalEntries();
  let modified = false;
  const cleanedEntries = entries.map((entry) => {
    if (entry.additionalMetrics && id in entry.additionalMetrics) {
      modified = true;
      const copy = { ...entry.additionalMetrics };
      delete copy[id];
      return { ...entry, additionalMetrics: copy };
    }
    return entry;
  });

  if (modified) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedEntries));
    } catch (e) {
      console.error('Failed to cleanup deleted metric from local entries:', e);
    }
  }
}

/* ========================================================================= */
/* SUPABASE ASYNC PERSISTENCE LAYER                                         */
/* ========================================================================= */

const CUSTOM_CONFOUNDERS_KEY = 'sleeplab_custom_confounders_v1';

export const DEFAULT_CONFOUNDERS: string[] = [
  'Heavy Leg Day',
  'Upper Body Training',
  'Zone 2 Cardio',
  'Zone 4–5 Cardio',
  'Late Caffeine',
  'Stress',
  'Late Meal',
  'Screen Exposure Before Bed',
  'Illness',
  'Travel',
  'Other',
];

export function getConfounderDefinitions(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CONFOUNDERS;
  try {
    const raw = localStorage.getItem(CUSTOM_CONFOUNDERS_KEY);
    if (!raw) {
      localStorage.setItem(CUSTOM_CONFOUNDERS_KEY, JSON.stringify(DEFAULT_CONFOUNDERS));
      return DEFAULT_CONFOUNDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CONFOUNDERS;
  } catch (e) {
    return DEFAULT_CONFOUNDERS;
  }
}

export function addConfounderDefinition(name: string): string[] {
  const current = getConfounderDefinitions();
  const trimmed = name.trim();
  if (!trimmed || current.includes(trimmed)) return current;
  const updated = [...current, trimmed];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CUSTOM_CONFOUNDERS_KEY, JSON.stringify(updated));
    } catch (e) {}
  }
  return updated;
}

export function removeConfounderDefinition(name: string): string[] {
  const current = getConfounderDefinitions();
  const updated = current.filter((c) => c !== name);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CUSTOM_CONFOUNDERS_KEY, JSON.stringify(updated));
    } catch (e) {}
  }
  return updated;
}

function dbToDailyEntry(row: any): DailyEntry {
  return {
    id: row.id,
    studyId: row.study_id || 'study-default',
    dayNumber: row.day_number,
    reportId: row.report_id || generateReportId(row.date, row.day_number),
    date: row.date,
    sleep: row.sleep,
    morning: row.morning,
    recovery: row.recovery,
    afternoon: row.afternoon,
    evening: row.evening,
    confounders: row.confounders || [],
    mutedMetrics: row.muted_metrics || [],
    additionalMetrics: row.additional_metrics || {},
    calculatedMetrics: row.calculated_metrics,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dailyEntryToDb(entry: DailyEntry, userId: string): any {
  return {
    id: entry.id,
    user_id: userId,
    study_id: entry.studyId || getActiveStudyId(),
    day_number: entry.dayNumber,
    report_id: entry.reportId || generateReportId(entry.date, entry.dayNumber),
    date: entry.date,
    sleep: entry.sleep,
    morning: entry.morning,
    recovery: entry.recovery,
    afternoon: entry.afternoon,
    evening: entry.evening,
    confounders: entry.confounders || [],
    muted_metrics: entry.mutedMetrics || [],
    additional_metrics: entry.additionalMetrics || {},
    calculated_metrics: entry.calculatedMetrics,
    updated_at: new Date().toISOString(),
  };
}

function dbToCustomMetricDef(row: any): CustomMetricDefinition {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description || undefined,
    config: row.config || undefined,
    active: row.active,
    order: row.order_num,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function customMetricDefToDb(def: CustomMetricDefinition, userId: string): any {
  return {
    id: def.id,
    user_id: userId,
    name: def.name,
    type: def.type,
    description: def.description || null,
    config: def.config || null,
    active: def.active,
    order_num: def.order,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchEntriesAsync(userId?: string | null): Promise<DailyEntry[]> {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return getLocalEntries();
  }

  try {
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    if (!data) return [];
    return data.map(dbToDailyEntry);
  } catch (err) {
    console.error('Supabase fetch error, falling back to local storage:', err);
    return getLocalEntries();
  }
}

export async function fetchCustomMetricDefinitionsAsync(userId?: string | null): Promise<CustomMetricDefinition[]> {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return getLocalCustomMetricDefinitions();
  }

  try {
    const { data, error } = await supabase
      .from('custom_metric_definitions')
      .select('*')
      .eq('user_id', userId)
      .order('order_num', { ascending: true });

    if (error) throw error;
    if (!data) return [];
    const remoteDefs = data.map(dbToCustomMetricDef);
    try {
      localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(remoteDefs));
    } catch (e) {
      console.error('Failed to update local custom metrics cache:', e);
    }
    return remoteDefs;
  } catch (err) {
    console.error('Supabase fetch custom metrics error:', err);
    return getLocalCustomMetricDefinitions();
  }
}

export async function saveEntryAsync(
  entry: DailyEntry,
  userId?: string | null
): Promise<{ entry: DailyEntry; isUpdate: boolean }> {
  const localRes = saveEntry(entry);

  if (!isSupabaseConfigured() || !supabase || !userId) {
    return localRes;
  }

  try {
    const currentEntries = await fetchEntriesAsync(userId);
    const existingIndex = currentEntries.findIndex((e) => e.date === entry.date || e.id === entry.id);

    let updatedEntries: DailyEntry[];
    let isUpdate = false;

    if (existingIndex >= 0) {
      isUpdate = true;
      const existing = currentEntries[existingIndex];
      const updated: DailyEntry = {
        ...entry,
        id: existing.id,
        studyId: entry.studyId || existing.studyId || getActiveStudyId(),
        dayNumber: existing.dayNumber,
        reportId: existing.reportId || entry.reportId || generateReportId(existing.date, existing.dayNumber),
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };
      updatedEntries = [...currentEntries];
      updatedEntries[existingIndex] = updated;
    } else {
      const newDayNum = currentEntries.length + 1;
      const newEntry: DailyEntry = {
        ...entry,
        studyId: entry.studyId || getActiveStudyId(),
        dayNumber: newDayNum,
        reportId: entry.reportId || generateReportId(entry.date, newDayNum),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedEntries = [...currentEntries, newEntry];
    }

    updatedEntries.sort((a, b) => a.date.localeCompare(b.date));

    const reindexedRows = updatedEntries.map((e, idx) => {
      const dayNum = idx + 1;
      const finalEntry: DailyEntry = {
        ...e,
        dayNumber: dayNum,
        reportId: e.reportId || generateReportId(e.date, dayNum),
      };
      return dailyEntryToDb(finalEntry, userId);
    });

    const { error } = await supabase.from('daily_entries').upsert(reindexedRows, { onConflict: 'user_id, date' });
    if (error) throw error;

    const saved = updatedEntries.find((e) => e.date === entry.date || e.id === entry.id) || entry;
    return { entry: saved, isUpdate };
  } catch (err) {
    console.error('Failed to save entry to Supabase:', err);
    throw err;
  }
}

export async function deleteEntryAsync(id: string, userId?: string | null): Promise<void> {
  deleteEntry(id);

  if (!isSupabaseConfigured() || !supabase || !userId) {
    return;
  }

  try {
    const { error: deleteErr } = await supabase.from('daily_entries').delete().eq('id', id).eq('user_id', userId);
    if (deleteErr) throw deleteErr;

    const remaining = await fetchEntriesAsync(userId);
    if (remaining.length > 0) {
      const reindexedRows = remaining.map((e, idx) => {
        const dayNum = idx + 1;
        const updated: DailyEntry = {
          ...e,
          dayNumber: dayNum,
          reportId: e.reportId || generateReportId(e.date, dayNum),
        };
        return dailyEntryToDb(updated, userId);
      });
      await supabase.from('daily_entries').upsert(reindexedRows, { onConflict: 'user_id, date' });
    }
  } catch (err) {
    console.error('Failed to delete entry from Supabase:', err);
    throw err;
  }
}

export async function saveCustomMetricDefinitionAsync(
  metric: CustomMetricDefinition,
  userId?: string | null
): Promise<CustomMetricDefinition> {
  saveCustomMetricDefinition(metric);

  if (!isSupabaseConfigured() || !supabase || !userId) {
    return metric;
  }

  try {
    const row = customMetricDefToDb(metric, userId);
    const { error } = await supabase.from('custom_metric_definitions').upsert([row]);
    if (error) throw error;
    return metric;
  } catch (err) {
    console.error('Failed to save custom metric to Supabase:', err);
    throw err;
  }
}

export async function archiveCustomMetricAsync(id: string, userId?: string | null): Promise<void> {
  archiveCustomMetric(id);
  if (!isSupabaseConfigured() || !supabase || !userId) return;

  try {
    const { error } = await supabase
      .from('custom_metric_definitions')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  } catch (err) {
    console.error('Failed to archive custom metric in Supabase:', err);
  }
}

export async function restoreCustomMetricAsync(id: string, userId?: string | null): Promise<void> {
  restoreCustomMetric(id);
  if (!isSupabaseConfigured() || !supabase || !userId) return;

  try {
    const { error } = await supabase
      .from('custom_metric_definitions')
      .update({ active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  } catch (err) {
    console.error('Failed to restore custom metric in Supabase:', err);
  }
}

export async function reorderCustomMetricsAsync(orderedIds: string[], userId?: string | null): Promise<void> {
  reorderCustomMetrics(orderedIds);
  if (!isSupabaseConfigured() || !supabase || !userId) return;

  try {
    const currentDefs = await fetchCustomMetricDefinitionsAsync(userId);
    const map = new Map(currentDefs.map((m) => [m.id, m]));
    const updatedDefs: CustomMetricDefinition[] = orderedIds.map((id, index) => {
      const m = map.get(id)!;
      return { ...m, order: index + 1 };
    });

    currentDefs.forEach((m) => {
      if (!orderedIds.includes(m.id)) {
        updatedDefs.push({ ...m, order: updatedDefs.length + 1 });
      }
    });

    const rows = updatedDefs.map((def) => customMetricDefToDb(def, userId));
    const { error } = await supabase.from('custom_metric_definitions').upsert(rows);
    if (error) throw error;
  } catch (err) {
    console.error('Failed to reorder custom metrics in Supabase:', err);
  }
}

export async function deleteCustomMetricDefinitionAsync(id: string, userId?: string | null): Promise<void> {
  deleteCustomMetricDefinition(id);
  if (!isSupabaseConfigured() || !supabase || !userId) return;

  try {
    const { error } = await supabase.from('custom_metric_definitions').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;

    const userEntries = await fetchEntriesAsync(userId);
    let modified = false;
    const cleanedRows = userEntries.map((entry) => {
      let updatedAddMetrics = entry.additionalMetrics;
      if (entry.additionalMetrics && id in entry.additionalMetrics) {
        modified = true;
        const copy = { ...entry.additionalMetrics };
        delete copy[id];
        updatedAddMetrics = copy;
      }
      return dailyEntryToDb({ ...entry, additionalMetrics: updatedAddMetrics }, userId);
    });

    if (modified) {
      const { error: cascadeErr } = await supabase.from('daily_entries').upsert(cleanedRows, { onConflict: 'user_id, date' });
      if (cascadeErr) console.error('Failed to cascade cleanup deleted metric in Supabase entries:', cascadeErr);
    }
  } catch (err) {
    console.error('Failed to delete custom metric in Supabase:', err);
  }
}

export async function migrateLocalStorageToSupabaseAsync(userId: string): Promise<{ entriesMigrated: number; metricsMigrated: number }> {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    throw new Error('Supabase client is not configured or user is not logged in.');
  }

  const localEntries = getLocalEntries();
  const localMetrics = getLocalCustomMetricDefinitions();
  const localStudies = getLocalStudies();

  let entriesMigrated = 0;
  let metricsMigrated = 0;

  if (localStudies.length > 0) {
    const studyRows = localStudies.map((s) => ({
      id: s.id,
      user_id: userId,
      title: s.title,
      start_date: s.startDate,
      duration_days: s.durationDays,
      description: s.description || null,
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('studies').upsert(studyRows);
  }

  if (localMetrics.length > 0) {
    const metricRows = localMetrics.map((m) => customMetricDefToDb(m, userId));
    const { error: metricErr } = await supabase.from('custom_metric_definitions').upsert(metricRows);
    if (metricErr) throw metricErr;
    metricsMigrated = localMetrics.length;
  }

  if (localEntries.length > 0) {
    const entryRows = localEntries.map((e) => dailyEntryToDb(e, userId));
    const { error: entryErr } = await supabase.from('daily_entries').upsert(entryRows, { onConflict: 'user_id, date' });
    if (entryErr) throw entryErr;
    entriesMigrated = localEntries.length;
  }

  markLocalDataMigrated();

  return { entriesMigrated, metricsMigrated };
}

export function seedSampleData(): DailyEntry[] {
  const sampleEntries: DailyEntry[] = [
    {
      id: 'sample-1',
      studyId: 'study-default',
      dayNumber: 1,
      reportId: 'SL-2026-001',
      date: '2026-09-17',
      sleep: {
        lightsOut: '22:45',
        estimatedSleepTime: '23:00',
        naturalWakeTime: '07:00',
        alarmWake: false,
        numberOfAwakenings: 1,
        awakeningReasons: ['Pee'],
      },
      morning: {
        morningAlertness: 8,
        sleepInertia: 3,
        mood: 8,
        motivation: 7,
      },
      recovery: {
        skinHealth: 7,
        muscleFullness: 8,
        workoutEnergy: 8,
        bodyFreshness: 8,
      },
      afternoon: {
        afternoonEnergy: 7,
        focus: 8,
        afternoonSlump: false,
      },
      evening: {
        naturallySleepyBeforeBed: 'Yes',
        notes: 'Felt well-rested. Good baseline day.',
      },
      confounders: ['Zone 2 Cardio'],
      additionalMetrics: {
        'sample-metric-1': '05:00',
        'sample-metric-2': 7,
        'sample-metric-3': true,
      },
      calculatedMetrics: {
        totalSleepMinutes: 480,
        totalSleepFormatted: '8h 0m',
        recoveryIndexScore: 38,
        recoveryIndexPercentage: 76,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-2',
      studyId: 'study-default',
      dayNumber: 2,
      reportId: 'SL-2026-002',
      date: '2026-09-18',
      sleep: {
        lightsOut: '23:30',
        estimatedSleepTime: '23:45',
        naturalWakeTime: '07:30',
        alarmWake: true,
        numberOfAwakenings: 2,
        awakeningReasons: ['Noise', 'Dream'],
      },
      morning: {
        morningAlertness: 6,
        sleepInertia: 7,
        mood: 6,
        motivation: 6,
      },
      recovery: {
        skinHealth: 6,
        muscleFullness: 7,
        workoutEnergy: 6,
        bodyFreshness: 6,
      },
      afternoon: {
        afternoonEnergy: 5,
        focus: 6,
        afternoonSlump: true,
      },
      evening: {
        naturallySleepyBeforeBed: 'Somewhat',
        notes: 'Had late coffee around 4 PM.',
      },
      confounders: ['Heavy Leg Day', 'Late Caffeine'],
      additionalMetrics: {
        'sample-metric-1': '03:30',
        'sample-metric-2': 5,
        'sample-metric-3': false,
      },
      calculatedMetrics: {
        totalSleepMinutes: 465,
        totalSleepFormatted: '7h 45m',
        recoveryIndexScore: 30,
        recoveryIndexPercentage: 60,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleCustomMetrics: CustomMetricDefinition[] = [
    {
      id: 'sample-metric-1',
      name: 'Cold Shower Duration',
      type: 'duration',
      description: 'Duration of cold shower in morning',
      active: true,
      order: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-metric-2',
      name: 'Perceived Stress',
      type: 'slider',
      description: 'Subjective stress level throughout the day',
      config: { min: 1, max: 10, step: 1 },
      active: true,
      order: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-metric-3',
      name: 'Creatine Supplement Taken',
      type: 'checkbox',
      description: 'Took daily 5g creatine monohydrate dose',
      active: true,
      order: 3,
      createdAt: new Date().toISOString(),
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleEntries));
    localStorage.setItem(START_DATE_KEY, '2026-09-17');
    localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(sampleCustomMetrics));
  } catch (e) {
    console.error('Failed to seed sample data:', e);
  }

  return sampleEntries;
}
