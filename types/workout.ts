/**
 * Types for Workout Plan - Workout Session feature
 */

export type WorkoutDayType = 'workout' | 'rest';

export type WorkoutLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced';

export interface WorkoutExercise {
  _id?: string;
  exerciseId: number;
  name: string;
  sets: number;
  reps: string;
  duration: number;
  calories: number;

  intensity:
    | 'light'
    | 'moderate'
    | 'vigorous';
}

export interface WorkoutDay extends AdaptiveDayFields {
  day: number;

  date: string;

  type: WorkoutDayType;

  focus:
    | 'push'
    | 'pull'
    | 'legs'
    | 'upper'
    | 'lower'
    | 'full_body_push'
    | 'full_body_pull'
    | 'full_body_legs'
    | 'recovery';

  dailyTargetCalories: number;

  estimatedCalories: number;

  totalDuration: number;

  estimatedDifficulty: number;

  completed: boolean;

  skipped: boolean;

  completedAt?: string | null;

  exerciseDetails: WorkoutExercise[];
}

export interface WorkoutPlan {
  _id: string;

  userId: string;

  workoutLevel: WorkoutLevel;

  currentWeek: number;

  weekStartDate: string;

  weekEndDate: string;

  weeklyTargetCalories: number;

  weeklyEstimatedCalories: number;

  fatigueScore: number;

  recoveryScore: number;

  avgPerformanceScore: number;

  readinessScore: number;

  performanceScore?: number;

  days: WorkoutDay[];

  generatedAt: string;

  isActive: boolean;
}

export interface WorkoutPlanResponse {
  success: boolean;
  data: WorkoutPlan;
}

export const DAY_NAMES = (day: number) => `Ngày ${day}`;

export interface WorkoutSessionData {
  _id: string;

  userId: string;

  planId: string;

  day: number;

  exerciseId: number;

  exerciseName: string;

  intensity:
    | 'light'
    | 'moderate'
    | 'vigorous';

  startTime: string;

  endTime?: string | null;

  durationMinutes: number;

  actualCalories: number;

  completed: boolean;

  skipped: boolean;
}

export interface WorkoutSessionResponse {
  success: boolean;
  data: WorkoutSessionData;
  message?: string;
}

/* ------------------------------------------------------------------ */
/* Adaptive workout                                                    */
/* ------------------------------------------------------------------ */

export type AdaptAction =
  | 'increase'
  | 'maintain'
  | 'reduce_intensity'
  | 'light_session'
  | 'rest';

export type TrainingStatus = 'ready' | 'normal' | 'tired' | 'overreached';

export interface DayAdaptation {
  action: AdaptAction;
  reasons: string[];
  appliedAt?: string;
}

export interface DaySubstitution {
  fromExerciseId: number;
  fromName: string;
  toExerciseId: number;
  toName: string;
  reason: string;
  at?: string;
}

/** Các trường adaptive gắn thêm vào mỗi ngày trong plan. */
export interface AdaptiveDayFields {
  adaptation?: DayAdaptation | null;
  substitutions?: DaySubstitution[];
}

type ScoreBreakdown = {
  score: number;
  components: Record<string, number | null>;
  usedWeights?: Record<string, number>;
  details?: Record<string, number | string | null>;
};

export interface TrainingState {
  fatigueScore: number;
  recoveryScore: number;
  performanceScore: number;
  readinessScore: number;
  status: TrainingStatus;
  recommendedIntensity: 'vigorous' | 'moderate' | 'light';
  isColdStart: boolean;
  breakdown?: {
    fatigue?: ScoreBreakdown;
    recovery?: ScoreBreakdown;
    performance?: ScoreBreakdown;
  };
  dataAvailability?: {
    completedExercises28d?: number;
    trainingDays28d?: number;
    healthCoverage7d?: number;
    googleSync?: string;
  };
}

export interface AdaptChange {
  day: number;
  date: string;
  action: AdaptAction;
  from: { type: WorkoutDayType; intensity?: string; exercises?: number };
  to: { type: WorkoutDayType; intensity?: string; exercises?: number };
}

export interface AdaptResult {
  dryRun: boolean;
  decision: { action: AdaptAction; reasons: string[]; lowAdherence?: boolean };
  state: {
    status: TrainingStatus;
    readinessScore: number;
    fatigueScore: number;
    recoveryScore: number;
    performanceScore: number;
    isColdStart: boolean;
    googleSync?: string;
  };
  activity?: {
    today: { activeMinutes: number | null; steps: number | null; sleepMinutes: number | null } | null;
    weeklyActiveMinutes: number | null;
    /** Khuyến nghị WHO (phút/tuần). Backend trả {min, max}; bản cũ có thể là number. */
    whoWeeklyMinutes: number | { min: number; max?: number | null };
    weeklyAerobic?: { daysWithData: number; moderateMinutes: number; vigorousMinutes: number; estimated?: boolean };
  };
  weekProgress?: { workoutDays: number; completedWorkoutDays: number; skippedWorkoutDays: number };
  changes: AdaptChange[];
  plan?: WorkoutPlan;
}

export type SubstitutionReason = 'too_hard' | 'no_equipment' | 'pain' | 'dislike' | 'other';

export interface AlternativeExercise {
  exerciseId: number;
  name: string;
  difficulty?: string;
  impactLevel?: string;
  equipment?: string[];
  primaryGroups?: string[];
  calories?: number;
  finalScore?: number;
  similarity?: number;
  similarityParts?: { muscle?: number; difficulty?: number; calories?: number };
}

export interface AlternativesResult {
  day: number;
  canReplace: boolean;
  blockedReason: string | null;
  reason: SubstitutionReason;
  original: {
    exerciseId: number;
    name: string;
    difficulty?: string;
    primaryGroups?: string[];
    sets?: number;
    reps?: string;
    duration?: number;
    intensity?: string;
    calories?: number;
  };
  alternatives: AlternativeExercise[];
}

export interface ReplaceResult {
  day: number;
  replaced: {
    from: { exerciseId: number; name: string; calories?: number };
    to: { exerciseId: number; name: string; calories?: number; score?: number };
    reason: SubstitutionReason;
  };
  dayTotals: { estimatedCalories: number; totalDuration: number };
  plan: WorkoutPlan;
}
