import { StudySchema, StudyCategory, StudyMetric } from '@/types/sleeplab';

export function getDefaultStudySchema(): StudySchema {
  const categories: StudyCategory[] = [
    {
      id: 'cat-sleep',
      name: 'Sleep Parameters',
      description: 'Raw Sleep Logs & Timings',
      order: 1,
      isSystemLocked: true,
    },
    {
      id: 'cat-morning',
      name: 'Morning Assessment',
      description: '~45 mins post-wake subjective state',
      order: 2,
    },
    {
      id: 'cat-recovery',
      name: 'Physical & Subjective Recovery',
      description: 'Physiological Markers & Energy',
      order: 3,
    },
    {
      id: 'cat-afternoon',
      name: 'Afternoon Functioning',
      description: 'Mid-Day Observation (14:00-16:00)',
      order: 4,
    },
    {
      id: 'cat-evening',
      name: 'Evening Readiness & Notes',
      description: 'Pre-Bedtime Log & Daily Reflections',
      order: 5,
    },
  ];

  const metrics: StudyMetric[] = [
    // 01 — Sleep Parameters (Locked timing metrics)
    {
      id: 'lightsOut',
      categoryId: 'cat-sleep',
      name: 'Lights Out',
      type: 'time',
      description: 'Time preparing for sleep',
      order: 1,
      active: true,
      isSystemLocked: true,
    },
    {
      id: 'estimatedSleepTime',
      categoryId: 'cat-sleep',
      name: 'Estimated Sleep Time',
      type: 'time',
      description: 'Estimated time falling asleep',
      order: 2,
      active: true,
      isSystemLocked: true,
    },
    {
      id: 'naturalWakeTime',
      categoryId: 'cat-sleep',
      name: 'Natural / Final Wake Time',
      type: 'time',
      description: 'Morning wake-up time',
      order: 3,
      active: true,
      isSystemLocked: true,
    },

    // 02 — Morning Assessment
    {
      id: 'morningAlertness',
      categoryId: 'cat-morning',
      name: 'Morning Alertness',
      type: 'slider',
      description: 'Sharpness and wakefulness',
      config: { min: 1, max: 10, step: 1 },
      order: 1,
      active: true,
    },
    {
      id: 'sleepInertia',
      categoryId: 'cat-morning',
      name: 'Sleep Inertia',
      type: 'slider',
      description: 'Heavy grogginess upon waking',
      config: { min: 1, max: 10, step: 1 },
      order: 2,
      active: true,
    },
    {
      id: 'mood',
      categoryId: 'cat-morning',
      name: 'Subjective Mood',
      type: 'slider',
      description: 'Emotional state',
      config: { min: 1, max: 10, step: 1 },
      order: 3,
      active: true,
    },
    {
      id: 'motivation',
      categoryId: 'cat-morning',
      name: 'Daily Motivation',
      type: 'slider',
      description: 'Drive and eagerness for daily tasks',
      config: { min: 1, max: 10, step: 1 },
      order: 4,
      active: true,
    },

    // 03 — Physical & Subjective Recovery
    {
      id: 'skinHealth',
      categoryId: 'cat-recovery',
      name: 'Skin Health Observation',
      type: 'slider',
      description: 'Clarity, hydration & tone',
      config: { min: 1, max: 10, step: 1 },
      order: 1,
      active: true,
    },
    {
      id: 'muscleFullness',
      categoryId: 'cat-recovery',
      name: 'Muscle Fullness',
      type: 'slider',
      description: 'Glycogen & physical tone',
      config: { min: 1, max: 10, step: 1 },
      order: 2,
      active: true,
    },
    {
      id: 'workoutEnergy',
      categoryId: 'cat-recovery',
      name: 'Workout Energy',
      type: 'slider',
      description: 'Readiness for physical training',
      config: { min: 1, max: 10, step: 1 },
      order: 3,
      active: true,
    },
    {
      id: 'bodyFreshness',
      categoryId: 'cat-recovery',
      name: 'Body Freshness',
      type: 'slider',
      description: 'Absence of systemic muscle soreness',
      config: { min: 1, max: 10, step: 1 },
      order: 4,
      active: true,
    },

    // 04 — Afternoon Functioning
    {
      id: 'afternoonEnergy',
      categoryId: 'cat-afternoon',
      name: 'Afternoon Energy (14:00-16:00)',
      type: 'slider',
      description: 'Sustained vitality',
      config: { min: 1, max: 10, step: 1 },
      order: 1,
      active: true,
    },
    {
      id: 'focus',
      categoryId: 'cat-afternoon',
      name: 'Cognitive Focus',
      type: 'slider',
      description: 'Sustained concentration without brain fog',
      config: { min: 1, max: 10, step: 1 },
      order: 2,
      active: true,
    },
    {
      id: 'afternoonSlump',
      categoryId: 'cat-afternoon',
      name: 'Experienced Afternoon Slump?',
      type: 'checkbox',
      description: 'Energy dip in mid-afternoon',
      order: 3,
      active: true,
    },

    // 05 — Evening Readiness & Notes
    {
      id: 'naturallySleepyBeforeBed',
      categoryId: 'cat-evening',
      name: 'Naturally Sleepy Before Bed',
      type: 'text',
      description: 'Pre-bedtime sleepiness (Yes / Somewhat / No)',
      order: 1,
      active: true,
    },
    {
      id: 'notes',
      categoryId: 'cat-evening',
      name: 'Qualitative Daily Reflections',
      type: 'text',
      description: 'Journal notes & comments',
      order: 2,
      active: true,
    },
  ];

  // Default contributor sliders for Recovery Index calculation
  const recoveryIndexMetricIds = ['morningAlertness', 'mood', 'skinHealth', 'muscleFullness', 'afternoonEnergy'];

  return {
    categories,
    metrics,
    recoveryIndexMetricIds,
  };
}
