import { api } from './api';
import type {
  DailyMenu,
  DailyMenuResponse,
  DailyMenuListResponse,
  AddRecipeRequest,
  UpdateRecipeRequest,
  DeleteRecipeRequest,
} from '../types/dailyMenu';

import type { Meal } from '../types';


// Lấy thực đơn theo ngày
export async function getDailyMenuByDate(date: string, token: string): Promise<DailyMenuResponse['data'] | null> {
  try {
    const { data } = await api.get<DailyMenuResponse>(`/daily-menu/by-date?date=${date}`);
    return data?.data || null;
  } catch (error) {
    console.error('Error fetching daily menu by date:', error);
    return null;
  }
}

// Lấy thực đơn theo khoảng ngày
export async function getDailyMenusByRange(
  startDate: string,
  endDate: string,
  token: string
): Promise<DailyMenuResponse['data'][]> {
  try {
    const { data } = await api.get<DailyMenuListResponse>(
      `/daily-menu/by-range?startDate=${startDate}&endDate=${endDate}`
    );
    return data?.data || [];
  } catch (error) {
    console.error('Error fetching daily menus by range:', error);
    return [];
  }
}

// Thêm món vào thực đơn
export async function addRecipeToMenu(request: AddRecipeRequest, token: string): Promise<DailyMenuResponse['data']> {
  const { data } = await api.post<DailyMenuResponse>('/daily-menu/add-recipe', request);
  return data.data;
}

// Cập nhật món trong thực đơn
export async function updateRecipeInMenu(request: UpdateRecipeRequest, token: string): Promise<DailyMenuResponse['data']> {
  const { data } = await api.patch<DailyMenuResponse>('/daily-menu/update-recipe', request);
  return data.data;
}

// Xóa món khỏi thực đơn
export async function deleteRecipeFromMenu(request: DeleteRecipeRequest, token: string): Promise<DailyMenuResponse['data']> {
  const { data } = await api.delete<DailyMenuResponse>('/daily-menu/delete-recipe', request);
  console.log("dât trong DELETE:", data.data);
  return data.data;
}

// Lấy gợi ý thực đơn cho ngày
export async function getDailyMenuRecommendation(
  date: string,
  token: string
): Promise<DailyMenuResponse['data'] | null> {
  try {
    const { data } = await api.post<DailyMenuResponse>(
      '/daily-menu/recommendations/day',
      { date }
    );
    return data?.data || null;
  } catch (error: any) {
    console.error(
      'Error fetching daily menu recommendation:',
      error?.response?.data || error
    );
    return null;
  }
}

// Cập nhật trạng thái thực đơn
export async function updateDailyMenuStatus(
  dailyMenuId: string,
  newStatus: 'manual' | 'suggested' | 'selected' | 'completed' | 'deleted' | 'expired',
  token: string
): Promise<DailyMenuResponse['data']> {
  const { data } = await api.post<DailyMenuResponse>(
    '/daily-menu/update-status',
    { dailyMenuId, newStatus }
  );
  return data.data;
}

// Chuyển đổi DailyMenu response thành Meal[] format cho UI
export function transformDailyMenuToMeals(menu: DailyMenuResponse['data']): Meal[] {
  return menu.recipes.map((recipe) => {
    return {
      id: recipe._id,
      dailyMenuId: menu._id,
      name: recipe?.name || recipe.name || 'Món ăn',
      imageUrl: recipe?.imageUrl || recipe.imageUrl,

      calories: recipe?.nutrition?.calories ?? 0,
      protein: recipe?.nutrition?.protein ?? 0,
      carbs: recipe?.nutrition?.carbs ?? 0,
      fat: recipe?.nutrition?.fat ?? 0,

      scale: recipe.scale,
      servingTime: recipe.servingTime,
      isChecked: recipe.isChecked ?? false,
    };
  });
}