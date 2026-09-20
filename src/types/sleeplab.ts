export type AwakeningReason = 'Pee' | 'Dream' | 'Noise' | 'Unknown' | 'Other';

export type SleepyBeforeBedOption = 'Yes' | 'Somewhat' | 'No';

export type ConfoundingFactor =
  | 'Heavy Leg Day'
  | 'Upper Body Training'
  | 'Zone 2 Cardio'
  | 'Zone 4–5 Cardio'
  | 'Late Caffeine'
  | 'Stress'
  | 'Late Meal'
  | 'Screen Exposure Before Bed'
  | 'Illness'
  | 'Travel'
  | 'Other';

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

export interface CalculatedMetrics {
  totalSleepMinutes: number;
  totalSleepFormatted: string;
  recoveryIndexScore: number; // Out of 50 (Alertness + Mood + Skin + Muscle + Afternoon Energy)
  recoveryIndexPercentage: number; // 0-100%
}

export interface DailyEntry {
  id: string;
  dayNumber: number; // 1 to 30 (or beyond if tracked)
  reportId?: string; // e.g. SL-2026-001
  date: string; // YYYY-MM-DD
  sleep: SleepData;
  morning: MorningData;
  recovery: RecoveryData;
  afternoon: AfternoonData;
  evening: EveningData;
  confounders: ConfoundingFactor[];
  additionalMetrics?: Record<string, any>; // User-defined custom metric values keyed by metric.id
  calculatedMetrics: CalculatedMetrics;
  createdAt: string;
  updatedAt: string;
}

export type StudyStatus = 'Upcoming' | 'Active' | 'Completed';

export interface StudyConfig {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  durationDays: number;
  updatedAt?: string;
}
