export type HealthGoal = 'lose_weight' | 'gain_weight' | 'maintain' | 'build_muscle';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';


export interface Meal {
  id: string;
  dailyMenuId?: string;
  name: string;
  imageUrl?: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalTag?: HealthGoal;
  servingTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  scale?: number;
  isChecked?: boolean;
  recipeId?: string;
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
  WorkoutLevel,
  WorkoutDay,
  WorkoutPlan,
  WorkoutPlanResponse,
  WorkoutSession,
} from './workout';
