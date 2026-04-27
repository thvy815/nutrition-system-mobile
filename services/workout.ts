/**
 * Workout Service
 * Handles all workout plan API calls and local storage
 */

import { api } from './api';
import { WorkoutPlanResponse, WorkoutPlan } from '../types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_WORKOUT_PLAN, USE_MOCK_DATA } from '../constants/workoutMockData';

const WORKOUT_STORAGE_KEY = 'workout_plan';
const WORKOUT_SESSIONS_KEY = 'workout_sessions';

export const workoutService = {
  /**
   * Fetch workout plan from API
   */
  async getWorkoutPlan(): Promise<WorkoutPlan> {
    try {
      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        console.log('Using mock workout data');
        await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(MOCK_WORKOUT_PLAN));
        return MOCK_WORKOUT_PLAN;
      }

      const { data } = await api.get<WorkoutPlanResponse>('/api/workout/plan');
      if (data.success) {
        // Cache locally
        await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(data.data));
        return data.data;
      }
      throw new Error('Failed to fetch workout plan');
    } catch (error) {
      // Fallback to cached data
      const cached = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      // Final fallback: use mock data
      console.warn('API failed, using mock data as fallback');
      await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(MOCK_WORKOUT_PLAN));
      return MOCK_WORKOUT_PLAN;
    }
  },

  /**
   * Get cached workout plan
   */
  async getCachedPlan(): Promise<WorkoutPlan | null> {
    try {
      const cached = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Mark exercise as completed
   */
  async markExerciseCompleted(dayNumber: number, exerciseId: number): Promise<void> {
    try {
      const sessions = await workoutService.getCompletedSessions();
      const session = {
        dayNumber,
        exerciseId,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      
      // Remove if already exists
      const filtered = sessions.filter(
        s => !(s.dayNumber === dayNumber && s.exerciseId === exerciseId)
      );
      
      filtered.push(session);
      await AsyncStorage.setItem(WORKOUT_SESSIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error marking exercise completed:', error);
    }
  },

  /**
   * Get all completed sessions
   */
  async getCompletedSessions(): Promise<any[]> {
    try {
      const sessions = await AsyncStorage.getItem(WORKOUT_SESSIONS_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Check if exercise is completed
   */
  async isExerciseCompleted(dayNumber: number, exerciseId: number): Promise<boolean> {
    try {
      const sessions = await workoutService.getCompletedSessions();
      return sessions.some(s => s.dayNumber === dayNumber && s.exerciseId === exerciseId);
    } catch (error) {
      return false;
    }
  },

  /**
   * Get day completion percentage
   */
  async getDayCompletionPercentage(dayNumber: number, totalExercises: number): Promise<number> {
    try {
      const sessions = await workoutService.getCompletedSessions();
      const completed = sessions.filter(s => s.dayNumber === dayNumber).length;
      return totalExercises > 0 ? Math.round((completed / totalExercises) * 100) : 0;
    } catch (error) {
      return 0;
    }
  },

  /**
   * Calculate total duration for a day
   */
  calculateDayDuration(exercises: any[] = []): number {
    return exercises.reduce((total, exercise) => total + (exercise.duration || 0), 0);
  },

  /**
   * Calculate total calories for a day
   */
  calculateDayCalories(exercises: any[] = []): number {
    return exercises.reduce((total, exercise) => total + (exercise.calories || 0), 0);
  },
};
