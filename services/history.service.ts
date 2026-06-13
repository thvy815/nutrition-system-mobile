import { api } from './api';
import type {
  GetMealHistoryParams,
  MealHistoryResponse,
  GetWorkoutHistoryParams,
  WorkoutHistoryResponse,
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

export async function getWorkoutHistory(
  params: GetWorkoutHistoryParams = {},
): Promise<WorkoutHistoryResponse> {
  const { page = 1, limit = 20 } = params;

  const { data } = await api.get<WorkoutHistoryResponse>(
    `/workout-session/history?page=${page}&limit=${limit}`,
  );

  return data;
}