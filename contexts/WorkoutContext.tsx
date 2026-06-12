import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import {
  WorkoutPlan,
  WorkoutDay,
  WorkoutSessionData,
} from '../types/workout';

import { workoutService } from '../services/workout.service';

import { useAuth } from './AuthContext';

interface WorkoutContextType {
  plan: WorkoutPlan | null;

  loading: boolean;

  error: string | null;

  selectedDay: WorkoutDay | null;

  selectedDayNumber: number | null;

  viewMode: 'week' | 'day';

  fetchPlan: () => Promise<void>;

  selectDay: (
    dayNumber: number
  ) => void;

  setViewMode: (
    mode: 'week' | 'day'
  ) => void;
}

const WorkoutContext =
  createContext<
    WorkoutContextType | undefined
  >(undefined);

export const WorkoutProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { token } = useAuth();

  const [plan, setPlan] =
    useState<WorkoutPlan | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [
    selectedDayNumber,
    setSelectedDayNumber,
  ] = useState<number | null>(null);

  const [viewMode, setViewMode] =
    useState<'week' | 'day'>('week');

  // =========================================
  // LOAD PLAN WHEN LOGIN
  // =========================================
  useEffect(() => {
    if (token) {
      fetchPlan();
    }
  }, [token]);

  const fetchPlan = async () => {
    try {
      setLoading(true);

      setError(null);

      const data =
        await workoutService.getWorkoutPlan();

      setPlan(data);
    } catch (err) {
      console.error(
        'fetchPlan error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải workout plan'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // SELECT DAY
  // =========================================
  const selectDay = (
    dayNumber: number
  ) => {
    setSelectedDayNumber(dayNumber);

    setViewMode('day');
  };

  // =========================================
  // SELECTED DAY
  // =========================================
  const selectedDay =
    selectedDayNumber && plan
      ? plan.days.find(
          d =>
            d.day ===
            selectedDayNumber
        ) || null
      : null;

  const value: WorkoutContextType =
    {
      plan,

      loading,

      error,

      selectedDay,

      selectedDayNumber,

      viewMode,

      fetchPlan,

      selectDay,

      setViewMode,
    };

  return (
    <WorkoutContext.Provider
      value={value}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context =
    useContext(WorkoutContext);

  if (!context) {
    throw new Error(
      'useWorkout must be used within WorkoutProvider'
    );
  }

  return context;
};