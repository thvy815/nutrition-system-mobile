import { api } from './api';
import type { Meal } from '../types';
export type Nutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};

export type Ingredient = {
  _id: string;
  name: string;
  quantity: {
    amount: number;
    unit: string;
    originalAmount?: number;
    originalUnit?: string;
  };
};

export type Recipe = {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  servings?: number;
  totalNutrition?: Nutrition;
  totalNutritionPerServing?: Partial<Nutrition>; // Tái sử dụng Nutrition và biến các field thành optional
  ingredients: Ingredient[];
  instructions: string[];
  mealSources?: string[];
  deleted?: boolean;
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
export type RecipeDetectedResponse = {
  success: boolean;
  detectedFoodName: string;
}
export type IngrAndInstrResponse = {
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  servings?: number;
}
export type MappedIngredient = {
  id: string;
  mongo_id: string;
  name: string;
  nutrition: Nutrition;
  score: number;
  // ... các trường khác
}
export type AIInputBatch = {
  input: string;
  results: MappedIngredient[]; // Đây là mảng kết quả cho mỗi ingredient gửi lên
};

export type MappingResponse = {
  results: AIInputBatch[];
};
export const getMappingIngredients = async (
  ingredients: { name: string }[],
  topK = 1,
  token: string
): Promise<MappedIngredient[]> => {
  try {
    // Body gửi lên Backend
    const body = {
      ingredients: ingredients.map(inObj => ({ name: inObj.name })),
      topK: topK
    };
    console.log("vo mapping")
    const res = await api.post<MappingResponse>(
      'http://192.168.31.206:8000/search_batch',
      body,
    );
    const allMappedIngredients: MappedIngredient[] = res.data.results.flatMap(
      (batch) => batch.results[0]
    );
    return allMappedIngredients;
  } catch (error: any) {
    console.error("Lỗi khi AI trích xuất nguyên liệu:", error);
    throw error;
  }
};
// Dữ liệu gửi đi (Request Body)
export interface ExtractIngredientsRequest {
  recipe: string;
  servings?: number;
}
export async function findIngredientById(
  params: {
    ingredientId: string;
  },
  token: string
): Promise<Ingredient> {
  const { data } = await api.get<Ingredient>(
    `/recipe/ingredients/${params.ingredientId}`,
  );
  return data;
}

export const findIngredientsByAi = async (
  recipeText: string,
  token: string,
  servings?: number
): Promise<Ingredient[]> => {
  try {
    // Body gửi lên Backend
    const body = {
      recipe: recipeText,
      servings: servings
    };

    const res = await api.post<{ ingredients: Ingredient[] }>(
      '/recipes/ai/extract-ingredients',
      body    );

    return res.data.ingredients;
  } catch (error: any) {
    console.error("Lỗi khi AI trích xuất nguyên liệu:", error);
    throw error;
  }
};

export const getIngredientsAndInstructionsInAi = async (
  foodName: string,
  token: string
): Promise<Recipe | null> => {
  try {
    const res = await api.get<Recipe>(
      `/recipes/ai/recommendations/${encodeURIComponent(foodName)}`,
    );
    return res.data;
  } catch (error: any) {
    // Nếu lỗi là 404 (Không tìm thấy), ta return null thay vì ném lỗi
    console.error(">>>error trong getIngredientsAndInstructionsInAi:", error)
    if (error.status === 404) {
      return null;
    }

    return null;
  }
};

export async function detectRecipe(imageAsset: any, token: string): Promise<RecipeDetectedResponse> {
  const formData = new FormData();

  const uri = imageAsset.uri;
  // Một số phiên bản cũ cần: uri.replace('file://', '') 
  // Nhưng với Expo Image Picker mới nhất, hãy giữ nguyên và đảm bảo các trường sau:

  formData.append('foodImage', {
    uri: uri,
    name: imageAsset.fileName || uri.split('/').pop() || 'photo.jpg',
    type: imageAsset.mimeType || 'image/jpeg',
  } as any);

  try {
    const res = await api.post<RecipeDetectedResponse>(
      '/recipes/ai/search-by-image',
      formData, // Lúc này api.ts đã sửa sẽ không stringify cái này
    );

    return (res as any).data;
  } catch (error) {
    throw error;
  }
}

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

// Lấy chi tiết recipe theo ID
export async function getRecipeById(recipeId: string, token: string): Promise<Recipe> {
  const { data } = await api.get<RecipeDetailResponse>(
    `/recipe/${recipeId}`,
  );
  return data.data;
}