import { api } from './api';
import type {
  GetMealHistoryParams,
  MealHistoryResponse,
} from '../types/history';

export async function getMealHistory(
  params: GetMealHistoryParams = {},
): Promise<MealHistoryResponse> {
  const { page = 1, limit = 20 } = params;

  const { data } = await api.get<MealHistoryResponse>(
    `/meal-logs?page=${page}&limit=${limit}`,
  );

  return data;
}