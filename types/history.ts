// MEAL
export interface MealNutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealHistoryRecipe {
  name: string | null;
  imageUrl: string | null;
  mealSource: string;
  nutrition: MealNutrition | null;
}

export interface MealHistoryLog {
  _id: string;
  eatenAt: string;
  createdAt: string;
  recipe: MealHistoryRecipe;
}

export interface MealHistoryPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MealHistoryData {
  logs: MealHistoryLog[];
  pagination: MealHistoryPagination;
}

export interface MealHistoryResponse {
  success: boolean;
  data: MealHistoryData;
}

export interface GetMealHistoryParams {
  page?: number;
  limit?: number;
}

// WORKOUT SESSION
export interface WorkoutHistorySession {
  _id: string;
  planId: string;
  day: number;
  focus: string;

  exerciseId: string;
  exerciseName: string;
  intensity: string;
  muscleGroups: string[];

  targetSets: number;
  targetReps: number;
  completedSets: number;
  completedReps: number;

  durationMinutes: number;
  estimatedCalories: number;
  actualCalories: number;

  perceivedDifficulty: number;
  performanceScore: number;
  fatigueImpact: number;

  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface WorkoutHistoryData {
  sessions: WorkoutHistorySession[];
  pagination: MealHistoryPagination;
}

export interface WorkoutHistoryResponse {
  success: boolean;
  data: WorkoutHistoryData;
}

export interface GetWorkoutHistoryParams {
  page?: number;
  limit?: number;
}