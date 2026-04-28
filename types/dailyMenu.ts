export type Nutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};

export type RecipeRef =
  | string
  | {
      _id: string;
      name: string;
      imageUrl?: string;
      description?: string;
      nutrition?: Nutrition;
    };

export type RecipeItem = {
  _id: string;
  recipeId: RecipeRef;
  name: string;
  imageUrl?: string;
  scale?: number;
  servingTime: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  isChecked?: boolean;
  nutrition?: Nutrition;
};

export type DailyMenu = {
  _id: string;
  userId?: string;
  date: string;
  recipes: RecipeItem[];
  totalNutrition: Nutrition;
  totalNutritionPerServing?: Nutrition;
  targetNutrition?: Nutrition;
  status: 'manual' | 'suggested' | 'selected' | 'completed' | 'deleted' | 'expired';
  feedback?: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyMenuResponse = {
  success: boolean;
  message?: string;
  data: DailyMenu;
};

export type DailyMenuListResponse = {
  success: boolean;
  data: DailyMenu[];
};

export type AddRecipeRequest = {
  date: string;
  dailyMenuId?: string;
  recipeId: string;
  scale?: number;
  servingTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  status?: 'manual' | 'suggested' | 'selected' | 'completed' | 'deleted' | 'expired';
};

export type UpdateRecipeRequest = {
  date: string;
  dailyMenuId?: string;
  recipeItemId: string;
  newScale?: number;
  checked?: boolean;
};

export type DeleteRecipeRequest = {
  dailyMenuId?: string;
  recipeItemId: string;
};