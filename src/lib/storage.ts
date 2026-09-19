import { DailyEntry, CustomMetricDefinition } from '@/types/sleeplab';

const STORAGE_KEY = 'sleeplab_entries_v1';
const START_DATE_KEY = 'sleeplab_start_date_v1';
const CUSTOM_METRICS_KEY = 'sleeplab_custom_metrics_v1';

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

export function getEntries(): DailyEntry[] {
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

export function getEntryByDate(dateStr: string): DailyEntry | undefined {
  const entries = getEntries();
  return entries.find((e) => e.date === dateStr);
}

export function getEntryById(id: string): DailyEntry | undefined {
  const entries = getEntries();
  return entries.find((e) => e.id === id);
}

export function saveEntry(entry: DailyEntry): { entry: DailyEntry; isUpdate: boolean } {
  const entries = getEntries();
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
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    updatedEntries = [...entries];
    updatedEntries[existingIndex] = updated;
  } else {
    const startDate = getStoredStartDate() || entry.date;
    const dayNumber = calculateDayNumber(startDate, entry.date);
    const newEntry: DailyEntry = {
      ...entry,
      dayNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updatedEntries = [...entries, newEntry];
  }

  updatedEntries.sort((a, b) => a.date.localeCompare(b.date));

  if (updatedEntries.length > 0) {
    const firstDate = updatedEntries[0].date;
    setStoredStartDate(firstDate);
    updatedEntries = updatedEntries.map((e) => ({
      ...e,
      dayNumber: calculateDayNumber(firstDate, e.date),
    }));
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (e) {
    console.error('Failed to save entries to localStorage:', e);
  }

  return { entry, isUpdate };
}

export function deleteEntry(id: string): void {
  const entries = getEntries();
  const filtered = entries.filter((e) => e.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete entry from localStorage:', e);
  }
}

export function calculateDayNumber(startDateStr: string, targetDateStr: string): number {
  const start = new Date(startDateStr);
  const target = new Date(targetDateStr);
  const diffTime = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function getNextDayNumber(): number {
  const entries = getEntries();
  if (entries.length === 0) return 1;
  const maxDay = Math.max(...entries.map((e) => e.dayNumber));
  return maxDay + 1;
}

/* ========================================================================= */
/* CUSTOM METRICS STORAGE HELPERS */
/* ========================================================================= */

export function getCustomMetricDefinitions(): CustomMetricDefinition[] {
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

export function saveCustomMetricDefinition(metric: CustomMetricDefinition): CustomMetricDefinition {
  const metrics = getCustomMetricDefinitions();
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
    console.error('Failed to save custom metrics:', e);
  }

  return metric;
}

export function archiveCustomMetric(id: string): void {
  const metrics = getCustomMetricDefinitions();
  const updated = metrics.map((m) => (m.id === id ? { ...m, active: false, updatedAt: new Date().toISOString() } : m));
  try {
    localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to archive custom metric:', e);
  }
}

export function restoreCustomMetric(id: string): void {
  const metrics = getCustomMetricDefinitions();
  const updated = metrics.map((m) => (m.id === id ? { ...m, active: true, updatedAt: new Date().toISOString() } : m));
  try {
    localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to restore custom metric:', e);
  }
}

export function reorderCustomMetrics(orderedIds: string[]): void {
  const metrics = getCustomMetricDefinitions();
  const metricsMap = new Map(metrics.map((m) => [m.id, m]));

  const updated: CustomMetricDefinition[] = orderedIds.map((id, index) => {
    const m = metricsMap.get(id)!;
    return { ...m, order: index + 1 };
  });

  // Append any metrics not in orderedIds
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
  const metrics = getCustomMetricDefinitions();
  const filtered = metrics.filter((m) => m.id !== id);
  try {
    localStorage.setItem(CUSTOM_METRICS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete custom metric definition:', e);
  }
}

export function seedSampleData(): DailyEntry[] {
  const sampleEntries: DailyEntry[] = [
    {
      id: 'sample-1',
      dayNumber: 1,
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
