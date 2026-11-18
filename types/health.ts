/**
 * Types cho Google Health + so sánh khuyến nghị WHO.
 * Khớp với backend/routes/googleHealth.routes.js.
 */

export type GoogleConnectionStatus = {
  connected: boolean;
  status: 'active' | 'revoked' | null;
  scopes: string[];
  grantedMetrics: string[];
  connectedAt: string | null;
  lastSyncedAt: string | null;
};

export type MetricSyncStatus =
  | 'ok'
  | 'not_granted'
  | 'no_permission'
  | 'unauthorized'
  | 'rate_limited'
  | 'error';

export type GoogleSyncResult = {
  from: string;
  to: string;
  metrics: Partial<Record<'steps' | 'caloriesBurned' | 'activeMinutes' | 'sleep' | 'exercise', MetricSyncStatus>>;
  syncedDays: number;
  syncedDates: string[];
  clearedDates?: string[];
};

export type HealthDailyRow = {
  date: string;
  steps: number | null;
  caloriesBurned: number | null;
  activeMinutes: number | null;
  moderateMinutes: number | null;
  vigorousMinutes: number | null;
  sleepMinutes: number | null;
  source?: string;
};

type MetricAvg = { avg: number | null; daysWithData: number };

export type ActivitySummary = {
  from: string;
  to: string;
  days: number;
  metrics: {
    steps: MetricAvg;
    caloriesBurned: MetricAvg;
    activeMinutes: MetricAvg;
    moderateMinutes: MetricAvg;
    vigorousMinutes: MetricAvg;
    sleepMinutes: MetricAvg;
  };
  coverage: number;
  daily: HealthDailyRow[];
};

export type GuidelineStatus = 'below' | 'within' | 'above' | 'insufficient_data';

export type GuidelineMetric = {
  unit: string;
  actual: number | null;
  target: { min: number; max?: number | null };
  status: GuidelineStatus;
  gap: number | null;
  measure?: {
    daysWithData: number;
    windowDays: number;
    moderateMinutes: number;
    vigorousMinutes: number;
    equivalentMinutes: number;
    weeklyEquivalentMinutes: number;
    dailyMvpaAverage: number;
    estimated: boolean;
    includesLight: boolean;
  };
};

export type HealthSource = {
  key: string;
  id?: string;
  title: string;
  org?: string;
  year?: string | number;
  url?: string;
  section?: string;
  doc_id?: string;
};

export type WhoRecommendation = {
  type: string;
  priority: number;
  title: string;
  intensity?: string;
  exerciseTypes?: string[];
  sourceKeys: string[];
  exercises?: { exerciseId: number; name: string; activityType?: string; difficulty?: string }[];
};

export type WhoComparison = {
  window: { from: string; to: string; days: number };
  profile: { age: number | null; fitnessLevel?: string; group?: string };
  trainingState?: { status: string; readinessScore: number; isColdStart: boolean; googleSync?: string };
  comparison:
    | {
        supported: true;
        group: string;
        label: string;
        aerobic: GuidelineMetric;
        strength: GuidelineMetric;
        balance: GuidelineMetric | null;
        steps: { average: number | null; daysWithData: number } | null;
        notes: string[];
      }
    | { supported: false; reason: string; message: string };
  recommendations: WhoRecommendation[];
  sources: HealthSource[];
  citationsAvailable: boolean;
  disclaimer: string;
};

export type MockSyncPayload = {
  date?: string;
  steps?: number;
  caloriesBurned?: number;
  activeMinutes?: number;
  moderateMinutes?: number;
  vigorousMinutes?: number;
  sleep?: { durationMinutes: number };
};
