export type RecipeCategory =
  | 'one_dish_meal'
  | 'main_dish'
  | 'side_dish'
  | 'soup'
  | 'dessert'
  | 'beverage'
  | 'snack'
  | 'other';

export type Recipe = {
  _id: string;
  name: string;
  description: string | null;
  category: RecipeCategory;
  ingredients: RecipeIngredient[];
  imageUrl: string | null;
  matchByName?: boolean;
  matchByIngredient?: boolean;
  matchedIngredientNames?: string[];
};

export type RecipeIngredient = {
  _id?: string;
  name: string;
  amount: number;
  unit: string;
};

export type RecipeSearchResponse = {
  success: boolean;
  data: {
    recipes: Recipe[];
  };
};