/**
 * Types for Workout Plan feature
 */

export type DayType = 'workout' | 'rest';
export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExercisePreview {
  exerciseId: number;
  name: string;
  duration: number; // minutes
}

export interface ExerciseMuscle {
  id: number;
  name: string;
  name_en: string;
  _id?: string;
}

export interface ExerciseDetail {
  _id: string;
  exerciseId: number;
  name: string;
  description: string;
  category: string;
  categoryId: number;
  equipment: Array<{
    id: number;
    name: string;
    _id?: string;
  }>;
  images: string[];
  muscles: ExerciseMuscle[];
  muscles_secondary: ExerciseMuscle[];
  videos: string[];
  activityType: string;
  defaultIntensity: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutDay {
  day: number;
  type: 'workout' | 'rest';
  totalDuration: number;
  totalCalories: number;
  completed: boolean;
  completedAt: string | null;

  muscleGroup?: {
    id: number;
    name: string;
    name_en: string;
    _id?: string;
  }[];

  exerciseDetails?: {
    exerciseId: number;
    name: string;
    duration: number;
    calories: number;
    sets?: number;
    reps?: string;
    _id?: string;
  }[];
}

export interface WorkoutPlan {
  _id: string;
  userId: string;
  workoutLevel: WorkoutLevel;
  targetCalories: number;
  currentDay?: number;
  plan: WorkoutDay[];
  generatedAt: string;
}

export interface WorkoutPlanResponse {
  success: boolean;
  data: WorkoutPlan;
}

export interface ExerciseDetailResponse {
  success?: boolean;
  data?: ExerciseDetail;
}

// For local state
export interface WorkoutSession {
  dayNumber: number;
  exerciseId: number;
  completed: boolean;
  completedAt?: string;
}

export const DAY_NAMES = (day: number) => `Ngày ${day}`;
