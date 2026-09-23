export type AwakeningReason = 'Pee' | 'Dream' | 'Noise' | 'Unknown' | 'Other';

export type SleepyBeforeBedOption = 'Yes' | 'Somewhat' | 'No';

export type ConfoundingFactor = string;

export type CustomMetricType = 'checkbox' | 'slider' | 'number' | 'time' | 'duration' | 'text';

export interface CustomMetricConfig {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface CustomMetricDefinition {
  id: string;
  name: string;
  type: CustomMetricType;
  description?: string;
  config?: CustomMetricConfig;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SleepData {
  lightsOut: string; // HH:mm
  estimatedSleepTime: string; // HH:mm
  naturalWakeTime: string; // HH:mm
  alarmWake: boolean;
  numberOfAwakenings: number;
  awakeningReasons: AwakeningReason[];
}

export interface MorningData {
  morningAlertness: number; // 1-10
  sleepInertia: number; // 1-10
  mood: number; // 1-10
  motivation: number; // 1-10
}

export interface RecoveryData {
  skinHealth: number; // 1-10
  muscleFullness: number; // 1-10
  workoutEnergy: number; // 1-10
  bodyFreshness: number; // 1-10
}

export interface AfternoonData {
  afternoonEnergy: number; // 1-10
  focus: number; // 1-10
  afternoonSlump: boolean;
}

export interface EveningData {
  naturallySleepyBeforeBed: SleepyBeforeBedOption;
  notes: string;
}

export type MetricInputType = CustomMetricType;

export interface StudyCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  isSystemLocked?: boolean;
}

export type TriggerCondition = 'equals' | 'greaterThan' | 'lessThan' | 'isTrue' | 'isFalse' | 'contains';

export interface DependentRule {
  id: string;
  condition: TriggerCondition;
  targetValue?: any;
  subMetric: StudyMetric;
}

export interface StudyMetric {
  id: string;
  categoryId: string;
  name: string;
  type: MetricInputType | 'tags' | 'select_one';
  description?: string;
  config?: CustomMetricConfig;
  options?: string[]; // Options for multi-select / tags sub-metrics
  order: number;
  active: boolean;
  isSystemLocked?: boolean; // True for core sleep timing metrics
  dependentRules?: DependentRule[]; // Nested sub-metric trigger rules
}

export interface StudySchema {
  categories: StudyCategory[];
  metrics: StudyMetric[];
  recoveryIndexMetricIds: string[]; // List of metric IDs selected by user to calculate Recovery Index
}

export interface CalculatedMetrics {
  totalSleepMinutes: number;
  totalSleepFormatted: string;
  recoveryIndexScore: number;
  recoveryIndexMaxScore?: number;
  recoveryIndexPercentage: number; // 0-100%
}

export interface DailyEntry {
  id: string;
  studyId?: string; // Links entry to a specific StudyProtocol
  dayNumber: number; // 1 to durationDays
  reportId?: string; // e.g. SL-2026-001
  date: string; // YYYY-MM-DD
  sleep: SleepData;
  morning: MorningData;
  recovery: RecoveryData;
  afternoon: AfternoonData;
  evening: EveningData;
  confounders: ConfoundingFactor[];
  mutedMetrics?: string[]; // Keys of metrics muted/turned off for this entry
  additionalMetrics?: Record<string, any>; // User-defined custom metric values
  metricsData?: Record<string, any>; // Dynamic observation data map (metricId -> value)
  calculatedMetrics: CalculatedMetrics;
  createdAt: string;
  updatedAt: string;
}

export type StudyStatus = 'Upcoming' | 'Active' | 'Completed';

export interface StudyProtocol {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  durationDays: number;
  description?: string;
  schema?: StudySchema;
  createdAt?: string;
  updatedAt?: string;
}

export type StudyConfig = StudyProtocol;
