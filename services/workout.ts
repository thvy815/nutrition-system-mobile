/**
 * Workout Service
 * Handles all workout plan API calls and local storage
 */

import { api } from './api';
import { 
  WorkoutPlanResponse, 
  WorkoutPlan, 
  ExerciseDetail,
  WorkoutSessionResponse,
  WorkoutSessionData,
  WorkoutSessionStartRequest,
} from '../types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_WORKOUT_PLAN, USE_MOCK_DATA } from '../constants/workoutMockData';

const WORKOUT_STORAGE_KEY = 'workout_plan';
const WORKOUT_SESSIONS_KEY = 'workout_sessions';
const ACTIVE_SESSION_KEY = 'active_workout_session';

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

      const { data } = await api.get<WorkoutPlanResponse>('/workout-plan/current');
      if (data.success) {
        // Cache locally
        await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(data.data));
        return data.data;
      }
      throw new Error('Failed to fetch workout plan');
    } catch (error) {
      console.error('Error fetching workout plan:', error);
      // Fallback to cached data
      const cached = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY);
      if (cached) {
        console.warn('Using cached workout plan');
        return JSON.parse(cached);
      }

      // Final fallback: use mock data only if API fails
      console.warn('API failed and no cache available, using mock data as fallback');
      await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(MOCK_WORKOUT_PLAN));
      return MOCK_WORKOUT_PLAN;
    }
  },

  /**
   * Fetch exercise detail from API
   */
  async getExerciseDetail(exerciseId: number): Promise<ExerciseDetail> {
    try {
      const { data } = await api.get<ExerciseDetail>(`/exercises/${exerciseId}`);
      return data;
    } catch (error) {
      console.error('Error fetching exercise detail:', error);
      throw error;
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

  /**
   * Start a workout session
   */
  async startWorkoutSession(
    userId: string,
    exerciseId: number | string,
    intensity: 'light' | 'moderate' | 'intense' = 'moderate'
  ): Promise<WorkoutSessionData> {
    try {
      const payload: WorkoutSessionStartRequest = {
        userId,
        exerciseId,
        intensity,
      };
      const { data } = await api.post<WorkoutSessionResponse>(
        '/workout-session/start',
        payload
      );
      if (data.success) {
        // Save active session to local storage
        await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(data.data));
        return data.data;
      }
      throw new Error('Failed to start workout session');
    } catch (error) {
      console.error('Error starting workout session:', error);
      throw error;
    }
  },

  /**
   * Stop a workout session
   */
  async stopWorkoutSession(sessionId: string): Promise<WorkoutSessionData> {
    try {
      const { data } = await api.post<WorkoutSessionResponse>(
        '/workout-session/stop',
        { sessionId }
      );
      if (data.success) {
        // Clear active session from storage
        await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
        return data.data;
      }
      throw new Error('Failed to stop workout session');
    } catch (error) {
      console.error('Error stopping workout session:', error);
      throw error;
    }
  },

  /**
   * Get active workout session
   */
  async getActiveSession(): Promise<WorkoutSessionData | null> {
    try {
      const session = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  },

  /**
   * Save session progress locally (for pause/resume)
   */
  async saveSessionProgress(sessionId: string, progress: any): Promise<void> {
    try {
      const progressKey = `session_progress_${sessionId}`;
      await AsyncStorage.setItem(progressKey, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving session progress:', error);
    }
  },

  /**
   * Get session progress
   */
  async getSessionProgress(sessionId: string): Promise<any> {
    try {
      const progressKey = `session_progress_${sessionId}`;
      const progress = await AsyncStorage.getItem(progressKey);
      return progress ? JSON.parse(progress) : null;
    } catch (error) {
      console.error('Error getting session progress:', error);
      return null;
    }
  },

  /**
   * Clear session progress
   */
  async clearSessionProgress(sessionId: string): Promise<void> {
    try {
      const progressKey = `session_progress_${sessionId}`;
      await AsyncStorage.removeItem(progressKey);
    } catch (error) {
      console.error('Error clearing session progress:', error);
    }
  },
};
