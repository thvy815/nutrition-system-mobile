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