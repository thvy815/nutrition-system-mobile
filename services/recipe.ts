import { api } from './api';
import type { Meal } from '../types';

export type Recipe = {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  servings: number;
  totalNutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  totalNutritionPerServing?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  instructions: string[];
  mealSources: string[];
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecipeListResponse = {
  success: boolean;
  data: {
    recipes: Recipe[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type RecipeDetailResponse = {
  success: boolean;
  data: Recipe;
};

// Lấy danh sách recipe có phân trang
export async function searchRecipes(
  params: {
    name?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  token: string
): Promise<{ recipes: Recipe[]; pagination: RecipeListResponse['data']['pagination'] }> {
  const queryParams = new URLSearchParams();
  
  if (params.name) queryParams.append('name', params.name);
  if (params.page) queryParams.append('page', String(params.page));
  if (params.limit) queryParams.append('limit', String(params.limit));
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const { data } = await api.get<RecipeListResponse>(
    `/recipe/search?${queryParams.toString()}`,
    token
  );
  return data.data;
}

// Lấy chi tiết recipe theo ID
export async function getRecipeById(recipeId: string, token: string): Promise<Recipe> {
  const { data } = await api.get<RecipeDetailResponse>(
    `/recipe/${recipeId}`,
    token
  );
  return data.data;
}

// Tìm kiếm recipe theo tên nguyên liệu
export async function searchRecipesByIngredient(
  params: {
    keyword: string;
    token: string;
    page?: number;
    limit?: number;
  }
): Promise<{ recipes: Recipe[]; pagination: RecipeListResponse['data']['pagination'] }> {
  const { keyword, token, page, limit } = params;
  const queryParams = new URLSearchParams();
  queryParams.append('keyword', keyword);
  if (page) queryParams.append('page', String(page));
  if (limit) queryParams.append('limit', String(limit));

  const { data } = await api.get<RecipeListResponse>(
    `/recipes/search/by-ingredient?${queryParams.toString()}`,
    token
  );
  return data.data;
}

// Chuyển Recipe thành Meal format cho UI
export function transformRecipeToMeal(recipe: Recipe): Meal {
  const nutrition = recipe.totalNutritionPerServing || recipe.totalNutrition;
  
  return {
    id: recipe._id,
    name: recipe.name,
    imageUrl: recipe.imageUrl,
    calories: nutrition?.calories || 0,
    protein: nutrition?.protein || 0,
    carbs: nutrition?.carbs || 0,
    fat: nutrition?.fat || 0,
  };
}