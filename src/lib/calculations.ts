import { CalculatedMetrics, MorningData, RecoveryData, AfternoonData } from '@/types/sleeplab';

/**
 * Calculates the total sleep duration in minutes and a formatted string (e.g., "7h 45m")
 * Handles sleep times crossing midnight (e.g. 23:30 to 07:15).
 */
export function calculateSleepDuration(
  sleepTimeStr: string,
  wakeTimeStr: string
): { totalMinutes: number; formatted: string } {
  if (!sleepTimeStr || !wakeTimeStr) {
    return { totalMinutes: 0, formatted: '0h 0m' };
  }

  const [sleepH, sleepM] = sleepTimeStr.split(':').map(Number);
  const [wakeH, wakeM] = wakeTimeStr.split(':').map(Number);

  if (isNaN(sleepH) || isNaN(sleepM) || isNaN(wakeH) || isNaN(wakeM)) {
    return { totalMinutes: 0, formatted: '0h 0m' };
  }

  let sleepMinutes = sleepH * 60 + sleepM;
  let wakeMinutes = wakeH * 60 + wakeM;

  if (wakeMinutes <= sleepMinutes) {
    // Crosses midnight
    wakeMinutes += 24 * 60;
  }

  const diffMinutes = wakeMinutes - sleepMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  return {
    totalMinutes: diffMinutes,
    formatted: `${hours}h ${mins}m`,
  };
}

/**
 * Calculates the Recovery Index score out of 50 and percentage out of 100.
 * Uses 5 key parameters:
 * 1. Morning Alertness (1-10)
 * 2. Mood (1-10)
 * 3. Skin Health (1-10)
 * 4. Muscle Fullness (1-10)
 * 5. Afternoon Energy (1-10)
 */
export function calculateRecoveryIndex(
  morning: Pick<MorningData, 'morningAlertness' | 'mood'>,
  recovery: Pick<RecoveryData, 'skinHealth' | 'muscleFullness'>,
  afternoon: Pick<AfternoonData, 'afternoonEnergy'>
): { score: number; percentage: number } {
  const score =
    (morning.morningAlertness || 0) +
    (morning.mood || 0) +
    (recovery.skinHealth || 0) +
    (recovery.muscleFullness || 0) +
    (afternoon.afternoonEnergy || 0);

  const percentage = Math.round((score / 50) * 100);

  return { score, percentage };
}

/**
 * Computes all calculated metrics for a daily entry.
 */
export function computeMetrics(
  estimatedSleepTime: string,
  naturalWakeTime: string,
  morning: MorningData,
  recovery: RecoveryData,
  afternoon: AfternoonData
): CalculatedMetrics {
  const { totalMinutes, formatted } = calculateSleepDuration(estimatedSleepTime, naturalWakeTime);
  const { score, percentage } = calculateRecoveryIndex(morning, recovery, afternoon);

  return {
    totalSleepMinutes: totalMinutes,
    totalSleepFormatted: formatted,
    recoveryIndexScore: score,
    recoveryIndexPercentage: percentage,
  };
}
