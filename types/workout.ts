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

export interface WorkoutDay {
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
