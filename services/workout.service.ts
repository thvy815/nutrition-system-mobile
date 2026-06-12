/**
 * Workout Service
 * Handles all workout plan API calls and local storage
 */

import { api } from './api';
import { 
  WorkoutPlanResponse, 
  WorkoutPlan, 
  WorkoutSessionResponse,
  WorkoutSessionData,
  WorkoutDay
} from '../types/workout';

export const workoutService = {
  // ===================================================== 
  //  WORKOUT PLAN 
  // =====================================================
  
  // Get current workout plan
  async getWorkoutPlan(): Promise<WorkoutPlan> {
    try {
      const { data } = await api.get<WorkoutPlanResponse>('/workout-plan/current');
      if (!data.success) {
        throw new Error('Failed to fetch workout plan');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching workout plan:', error);
      throw error;
    }
  },

  //* Mark a workout day as completed
  async completeDay(day: number) {
    try { 
      const { data } = await api.post( '/workout-plan/complete-day', { day } ); 
      return data; 
    } catch (error) { 
      console.error('completeDay error:', error); 
      throw error; 
    }
  },

  //* Skip a workout day
  async skipDay(day: number) {
    try { 
      const { data } = await api.post( '/workout-plan/skip-day', { day } ); 
      return data; 
    } catch (error) { 
      console.error('skipDay error:', error); 
      throw error; 
    }
  },

  //* Generate next week's workout plan
  async generateNextWeek() {
    try { 
      const { data } = await api.post( '/workout-plan/generate-next-week' ); 
      return data; 
    } catch (error) { 
      console.error('generateNextWeek error:', error); 
      throw error; 
    }
  },

  async getTodayWorkout(): Promise<WorkoutDay> {
    try {
      const { data } = await api.get<{
        success: boolean;
        data: WorkoutDay;
      }>('/workout-plan/today');

      if (!data.success) {
        throw new Error('Failed to fetch today workout');
      }

      return data.data;
    } catch (error) {
      console.error('getTodayWorkout error:', error);
      throw error;
    }
  },

  // ===================================================== 
  // WORKOUT SESSION
  //  =====================================================

  // Start a workout session 
  async startWorkoutSession(payload: {
    userId: string;
    planId: string;
    day: number;
    exerciseId: number;
  }) {
    try {
      const { data } = await api.post<WorkoutSessionResponse>(
        '/workout-session/start',
        payload
      );

      return data.data;
    } catch (error) {
      console.error( 'startWorkoutSession error:', error ); 
      throw error; 
    }
  },

  // Stop a workout session 
  async stopWorkoutSession(payload: {
    sessionId: string;
    completedSets: number;
    completedReps: number;
    perceivedDifficulty: number;
  }) {
    try { 
      const { data } = await api.post<WorkoutSessionResponse>( '/workout-session/stop', payload ); 
      return data.data; 
    } catch (error) { 
      console.error( 'stopWorkoutSession error:', error ); 
      throw error; 
    }
  },
}