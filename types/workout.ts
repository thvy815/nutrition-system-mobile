/**
 * Types for Workout Plan feature
 */

export type DayType = 'workout' | 'rest';
export type MuscleGroup = 'full_body' | 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  exerciseId: number;
  name: string;
  sets: number;
  reps: string; // e.g., "10-12"
  duration: number; // minutes
  calories: number;
  image?: string;
  description?: string;
}

export interface WorkoutDay {
  day: number; // 1-7
  type: DayType;
  muscleGroup?: MuscleGroup;
  targetCalories?: number;
  exercises?: Exercise[];
  completed?: boolean;
}

export interface WorkoutPlan {
  userId: string;
  workoutLevel: WorkoutLevel;
  targetCalories: number;
  plan: WorkoutDay[];
  generatedAt: string;
}

export interface WorkoutPlanResponse {
  success: boolean;
  data: WorkoutPlan;
}

// For local state
export interface WorkoutSession {
  dayNumber: number;
  exerciseId: number;
  completed: boolean;
  completedAt?: string;
}
