import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

import { TrainingState, WorkoutDay, WorkoutPlan } from '../types/workout';
import { workoutService } from '../services/workout.service';
import { getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';

interface WorkoutContextType {
  plan: WorkoutPlan | null;
  loading: boolean;
  error: string | null;

  /** Fatigue / Recovery / Performance / Readiness. null khi chưa tải hoặc lỗi. */
  trainingState: TrainingState | null;
  trainingStateLoading: boolean;

  selectedDay: WorkoutDay | null;
  selectedDayNumber: number | null;
  viewMode: 'week' | 'day';

  fetchPlan: () => Promise<void>;
  /** sync=true đồng bộ Google Health trước khi tính. */
  fetchTrainingState: (sync?: boolean) => Promise<void>;
  /** Cập nhật plan trả về từ API (adapt / replace) mà không cần gọi lại /current. */
  replacePlan: (plan: WorkoutPlan) => void;
  selectDay: (dayNumber: number) => void;
  setViewMode: (mode: 'week' | 'day') => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trainingState, setTrainingState] = useState<TrainingState | null>(null);
  const [trainingStateLoading, setTrainingStateLoading] = useState(false);

  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workoutService.getWorkoutPlan();
      setPlan(data);
    } catch (err) {
      console.error('fetchPlan error:', err);
      setError(getErrorMessage(err, 'Không thể tải kế hoạch tập luyện'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrainingState = useCallback(async (sync = false) => {
    try {
      setTrainingStateLoading(true);
      const data = await workoutService.getTrainingState(sync);
      setTrainingState(data);
    } catch (err) {
      // Không chặn màn hình: thẻ trạng thái sẽ ẩn khi lỗi.
      if (__DEV__) console.warn('fetchTrainingState error:', err);
      setTrainingState(null);
    } finally {
      setTrainingStateLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchPlan();
      fetchTrainingState();
    } else {
      setPlan(null);
      setTrainingState(null);
    }
  }, [token, fetchPlan, fetchTrainingState]);

  const replacePlan = useCallback((next: WorkoutPlan) => {
    if (next && Array.isArray(next.days)) setPlan(next);
  }, []);

  const selectDay = useCallback((dayNumber: number) => {
    setSelectedDayNumber(dayNumber);
    setViewMode('day');
  }, []);

  const selectedDay = useMemo(
    () =>
      selectedDayNumber && plan ? plan.days.find((d) => d.day === selectedDayNumber) || null : null,
    [selectedDayNumber, plan]
  );

  const value = useMemo<WorkoutContextType>(
    () => ({
      plan,
      loading,
      error,
      trainingState,
      trainingStateLoading,
      selectedDay,
      selectedDayNumber,
      viewMode,
      fetchPlan,
      fetchTrainingState,
      replacePlan,
      selectDay,
      setViewMode,
    }),
    [
      plan,
      loading,
      error,
      trainingState,
      trainingStateLoading,
      selectedDay,
      selectedDayNumber,
      viewMode,
      fetchPlan,
      fetchTrainingState,
      replacePlan,
      selectDay,
    ]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within WorkoutProvider');
  }
  return context;
};
