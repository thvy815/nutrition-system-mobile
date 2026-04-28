/**
 * Workout Context
 * State management for workout plan
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WorkoutPlan, WorkoutDay } from '../types/workout';
import { workoutService } from '../services/workout';
import { useAuth } from './AuthContext';

interface WorkoutContextType {
  plan: WorkoutPlan | null;
  loading: boolean;
  error: string | null;
  selectedDay: WorkoutDay | null;
  selectedDayNumber: number | null;
  viewMode: 'week' | 'day'; // Toggle between week and day view
  completedSessions: any[];
  
  // Actions
  fetchPlan: () => Promise<void>;
  selectDay: (dayNumber: number) => void;
  setViewMode: (mode: 'week' | 'day') => void;
  markExerciseCompleted: (dayNumber: number, exerciseId: number) => Promise<void>;
  getDayProgress: (dayNumber: number) => Promise<number>;
  getCurrentDayOfWeek: () => number;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);

  // Fetch workout plan on mount and when token changes
  useEffect(() => {
    if (token) {
      fetchPlan();
    }
  }, [token]);

  // Load completed sessions
  useEffect(() => {
    loadCompletedSessions();
  }, []);

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workoutService.getWorkoutPlan(token || undefined);
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải kế hoạch tập luyện');
      console.error('Error fetching workout plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedSessions = async () => {
    try {
      const sessions = await workoutService.getCompletedSessions();
      setCompletedSessions(sessions);
    } catch (err) {
      console.error('Error loading completed sessions:', err);
    }
  };

  const selectDay = (dayNumber: number) => {
    if (plan) {
      const day = plan.plan.find(d => d.day === dayNumber);
      setSelectedDayNumber(dayNumber);
      if (day) {
        setViewMode('day');
      }
    }
  };

  const markExerciseCompleted = async (dayNumber: number, exerciseId: number) => {
    await workoutService.markExerciseCompleted(dayNumber, exerciseId);
    await loadCompletedSessions();
  };

  const getDayProgress = async (dayNumber: number): Promise<number> => {
    const day = plan?.plan.find(d => d.day === dayNumber);
    const totalExercises = day?.exerciseDetails?.length || 0;
    return await workoutService.getDayCompletionPercentage(dayNumber, totalExercises);
  };

  const getCurrentDayOfWeek = (): number => {
    const today = new Date();
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // We'll map to 1-7 where 1 = Monday
    let dayOfWeek = today.getDay();
    return dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday (0) to 7
  };

  const selectedDay = selectedDayNumber
    ? plan?.plan.find(d => d.day === selectedDayNumber) || null
    : null;

  const value: WorkoutContextType = {
    plan,
    loading,
    error,
    selectedDay,
    selectedDayNumber,
    viewMode,
    completedSessions,
    fetchPlan,
    selectDay,
    setViewMode,
    markExerciseCompleted,
    getDayProgress,
    getCurrentDayOfWeek,
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within WorkoutProvider');
  }
  return context;
};
