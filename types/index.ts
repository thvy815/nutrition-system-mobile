export type HealthGoal = 'lose_weight' | 'gain_weight' | 'maintain' | 'build_muscle';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  healthGoal: HealthGoal;
  dietaryRestrictions: string[];
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalTag?: HealthGoal;
  timeOfDay?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface Workout {
  id: string;
  name: string;
  duration: number; // minutes
  difficulty: DifficultyLevel;
  caloriesBurned: number;
  description?: string;
}

export interface FoodAnalysisResult {
  foodName: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeIngredient {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeAnalysisResult {
  ingredients: RecipeIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Workout types
export type {
  DayType,
  MuscleGroup,
  WorkoutLevel,
  Exercise,
  WorkoutDay,
  WorkoutPlan,
  WorkoutPlanResponse,
  WorkoutSession,
} from './workout';
