/**
 * WorkoutPlanScreen
 * Main screen showing the 7-day workout plan
 * Displays week view with all days and toggle to switch views
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkout } from '../contexts/WorkoutContext';
import { DayCard } from '../components/DayCard';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface WorkoutPlanScreenProps {
  navigation?: any;
}

export const WorkoutPlanScreen: React.FC<WorkoutPlanScreenProps> = ({ navigation }) => {
  const {
    plan,
    loading,
    error,
    viewMode,
    setViewMode,
    selectDay,
    getCurrentDayOfWeek,
    completedSessions,
    getDayProgress,
    fetchPlan,
  } = useWorkout();

  const [dayProgresses, setDayProgresses] = useState<{ [key: number]: number }>({});
  const [refreshing, setRefreshing] = useState(false);

  const currentDay = getCurrentDayOfWeek();

  // Load day progress
  useEffect(() => {
    loadDayProgresses();
  }, [plan, completedSessions]);

  const loadDayProgresses = async () => {
    if (!plan) return;

    const progresses: { [key: number]: number } = {};
    for (const day of plan.plan) {
      const progress = await getDayProgress(day.day);
      progresses[day.day] = progress;
    }
    setDayProgresses(progresses);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlan();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDayPress = (dayNumber: number) => {
    selectDay(dayNumber);
    navigation?.navigate('DayDetail', { dayNumber });
  };

  const handleStartPress = (dayNumber: number) => {
    selectDay(dayNumber);
    navigation?.navigate('DayDetail', { dayNumber });
  };

  // Loading state
  if (loading && !plan) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải kế hoạch tập luyện...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!plan) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không có kế hoạch tập luyện</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Calculate total stats
  const totalDays = plan.plan.length;
  const workoutDays = plan.plan.filter(d => d.type === 'workout').length;
  const restDays = plan.plan.filter(d => d.type === 'rest').length;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Kế hoạch tập luyện</Text>
          <Text style={styles.subtitle}>Tuần tập của bạn</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="calendar-week"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.statValue}>{totalDays}</Text>
              <Text style={styles.statLabel}>Ngày</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={20}
                color={COLORS.accent}
              />
              <Text style={styles.statValue}>{workoutDays}</Text>
              <Text style={styles.statLabel}>Tập luyện</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="bed"
                size={20}
                color={COLORS.secondary}
              />
              <Text style={styles.statValue}>{restDays}</Text>
              <Text style={styles.statLabel}>Nghỉ</Text>
            </View>
          </View>
        </View>

        {/* View Mode Toggle */}
        <ViewModeToggle mode={viewMode} onToggle={setViewMode} />

        {/* Days List */}
        <View style={styles.daysContainer}>
          {plan.plan.map((day) => {
            const isCurrentDay = day.day === currentDay;
            const isCompleted =
              dayProgresses[day.day] === 100 && day.type === 'workout';

            return (
              <DayCard
                key={day.day}
                day={day}
                dayNumber={day.day}
                isCurrentDay={isCurrentDay}
                isCompleted={isCompleted}
                onPress={() => handleDayPress(day.day)}
                onStartPress={() => handleStartPress(day.day)}
                completionPercentage={dayProgresses[day.day] || 0}
              />
            );
          })}
        </View>

        {/* Footer spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  headerSection: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  daysContainer: {
    gap: SPACING.sm,
  },
});
