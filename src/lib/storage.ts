import { DailyEntry, CustomMetricDefinition, StudyConfig, StudyStatus } from '@/types/sleeplab';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'sleeplab_entries_v1';
const START_DATE_KEY = 'sleeplab_start_date_v1';
const CUSTOM_METRICS_KEY = 'sleeplab_custom_metrics_v1';
const MIGRATION_DONE_KEY = 'sleeplab_migrated_v1';
const STUDY_CONFIG_KEY = 'sleeplab_study_config_v1';

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
  const defaultStartDate = getStoredStartDate() || new Date().toISOString().split('T')[0];
  const defaultConfig: StudyConfig = {
    id: 'default-study',
    title: 'SleepLab N=1 Longitudinal Study',
    startDate: defaultStartDate,
    durationDays: 30,
  };

  if (typeof window === 'undefined') return defaultConfig;
  try {
    const raw = localStorage.getItem(STUDY_CONFIG_KEY);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw);
    return {
      ...defaultConfig,
      ...parsed,
    };
  } catch {
    return defaultConfig;
  }
}

export function saveLocalStudyConfig(config: StudyConfig): StudyConfig {
  if (typeof window === 'undefined') return config;
  try {
    localStorage.setItem(STUDY_CONFIG_KEY, JSON.stringify(config));
    setStoredStartDate(config.startDate);
  } catch (e) {
    console.error('Failed to save study config locally:', e);
  }
  return config;
}

export async function fetchStudyConfigAsync(userId?: string | null): Promise<StudyConfig> {
  const localConfig = getLocalStudyConfig();
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return localConfig;
  }

  try {
    const { data, error } = await supabase
      .from('study_config')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return localConfig;

    const remoteConfig: StudyConfig = {
      id: 'supabase-study',
      title: data.title || localConfig.title,
      startDate: data.start_date || localConfig.startDate,
      durationDays: data.duration_days || localConfig.durationDays,
      updatedAt: data.updated_at,
    };

    saveLocalStudyConfig(remoteConfig);
    return remoteConfig;
  } catch (err) {
    console.error('Failed to fetch study config from Supabase:', err);
    return localConfig;
  }
}

export async function saveStudyConfigAsync(config: StudyConfig, userId?: string | null): Promise<StudyConfig> {
  saveLocalStudyConfig(config);
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return config;
  }

  try {
    const { error } = await supabase.from('study_config').upsert({
      user_id: userId,
      title: config.title,
      start_date: config.startDate,
      duration_days: config.durationDays,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return config;
  } catch (err) {
    console.error('Failed to save study config to Supabase:', err);
    throw err;
  }
}

export function getLocalEntries(): DailyEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: DailyEntry[] = JSON.parse(raw);
    return entries.sort((a, b) => a.date.localeCompare(b.date));
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

/* Synchronous local wrappers for backwards compatibility */
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
}

/* ========================================================================= */
/* SUPABASE ASYNC PERSISTENCE LAYER                                         */
/* ========================================================================= */

/* Conversion Mappers */
function dbToDailyEntry(row: any): DailyEntry {
  return {
    id: row.id,
    dayNumber: row.day_number,
    reportId: row.report_id || generateReportId(row.date, row.day_number),
    date: row.date,
    sleep: row.sleep,
    morning: row.morning,
    recovery: row.recovery,
    afternoon: row.afternoon,
    evening: row.evening,
    confounders: row.confounders || [],
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
    day_number: entry.dayNumber,
    report_id: entry.reportId || generateReportId(entry.date, entry.dayNumber),
    date: entry.date,
    sleep: entry.sleep,
    morning: entry.morning,
    recovery: entry.recovery,
    afternoon: entry.afternoon,
    evening: entry.evening,
    confounders: entry.confounders || [],
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

/* Async Fetch Entries */
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

/* Async Fetch Custom Metrics */
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
    return data.map(dbToCustomMetricDef);
  } catch (err) {
    console.error('Supabase fetch custom metrics error:', err);
    return getLocalCustomMetricDefinitions();
  }
}

/* Async Save Entry */
export async function saveEntryAsync(
  entry: DailyEntry,
  userId?: string | null
): Promise<{ entry: DailyEntry; isUpdate: boolean }> {
  // Always mirror write to local storage first for offline resiliency
  const localRes = saveEntry(entry);

  if (!isSupabaseConfigured() || !supabase || !userId) {
    return localRes;
  }

  try {
    // Fetch all current entries from DB to accurately update day numbering
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
        dayNumber: newDayNum,
        reportId: entry.reportId || generateReportId(entry.date, newDayNum),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedEntries = [...currentEntries, newEntry];
    }

    updatedEntries.sort((a, b) => a.date.localeCompare(b.date));

    // Re-index day numbers sequentially
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

/* Async Delete Entry */
export async function deleteEntryAsync(id: string, userId?: string | null): Promise<void> {
  deleteEntry(id);

  if (!isSupabaseConfigured() || !supabase || !userId) {
    return;
  }

  try {
    const { error: deleteErr } = await supabase.from('daily_entries').delete().eq('id', id).eq('user_id', userId);
    if (deleteErr) throw deleteErr;

    // Re-index remaining DB entries
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

/* Async Save Custom Metric Definition */
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

/* Async Archive Custom Metric */
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

/* Async Restore Custom Metric */
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

/* Async Reorder Custom Metrics */
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

/* Async Delete Custom Metric Definition */
export async function deleteCustomMetricDefinitionAsync(id: string, userId?: string | null): Promise<void> {
  deleteCustomMetricDefinition(id);
  if (!isSupabaseConfigured() || !supabase || !userId) return;

  try {
    const { error } = await supabase.from('custom_metric_definitions').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  } catch (err) {
    console.error('Failed to delete custom metric in Supabase:', err);
  }
}

/* ========================================================================= */
/* LOCAL STORAGE TO SUPABASE MIGRATION UTILITY                              */
/* ========================================================================= */

export async function migrateLocalStorageToSupabaseAsync(userId: string): Promise<{ entriesMigrated: number; metricsMigrated: number }> {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    throw new Error('Supabase client is not configured or user is not logged in.');
  }

  const localEntries = getLocalEntries();
  const localMetrics = getLocalCustomMetricDefinitions();

  let entriesMigrated = 0;
  let metricsMigrated = 0;

  // 1. Upload Custom Metrics first
  if (localMetrics.length > 0) {
    const metricRows = localMetrics.map((m) => customMetricDefToDb(m, userId));
    const { error: metricErr } = await supabase.from('custom_metric_definitions').upsert(metricRows);
    if (metricErr) throw metricErr;
    metricsMigrated = localMetrics.length;
  }

  // 2. Upload Daily Entries
  if (localEntries.length > 0) {
    const entryRows = localEntries.map((e) => dailyEntryToDb(e, userId));
    const { error: entryErr } = await supabase.from('daily_entries').upsert(entryRows, { onConflict: 'user_id, date' });
    if (entryErr) throw entryErr;
    entriesMigrated = localEntries.length;
  }

  // Mark local migration done without destroying local data
  markLocalDataMigrated();

  return { entriesMigrated, metricsMigrated };
}

export function seedSampleData(): DailyEntry[] {
  const sampleEntries: DailyEntry[] = [
    {
      id: 'sample-1',
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
