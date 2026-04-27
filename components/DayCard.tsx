/**
 * DayCard Component
 * Displays a single day card in the workout plan list
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { WorkoutDay } from '../types/workout';
import { workoutService } from '../services/workout';

interface DayCardProps {
  day: WorkoutDay;
  dayNumber: number;
  isCurrentDay?: boolean;
  isCompleted?: boolean;
  onPress?: () => void;
  onStartPress?: () => void;
  completionPercentage?: number;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  dayNumber,
  isCurrentDay = false,
  isCompleted = false,
  onPress,
  onStartPress,
  completionPercentage = 0,
}) => {
  const [duration, setDuration] = useState(0);
  const [calories, setCalories] = useState(0);

  useEffect(() => {
    if (day.type === 'workout' && day.exercises) {
      setDuration(workoutService.calculateDayDuration(day.exercises));
      setCalories(workoutService.calculateDayCalories(day.exercises));
    }
  }, [day]);

  const isRestDay = day.type === 'rest';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCurrentDay && styles.currentDayContainer,
        SHADOWS.md,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Timeline indicator */}
      <View style={[styles.timelineIndicator, isCurrentDay && styles.currentTimeline]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header: Day + Badge */}
        <View style={styles.header}>
          <View style={styles.dayInfo}>
            <Text style={styles.dayLabel}>
              Ngày {dayNumber}
            </Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={COLORS.success}
                />
              </View>
            )}
          </View>
          {isCurrentDay && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>Hôm nay</Text>
            </View>
          )}
        </View>

        {/* Rest day or workout info */}
        {isRestDay ? (
          <View style={styles.restDayContainer}>
            <MaterialCommunityIcons
              name="bed"
              size={24}
              color={COLORS.textMuted}
            />
            <Text style={styles.restDayText}>Ngày nghỉ ngơi</Text>
          </View>
        ) : (
          <View style={styles.workoutInfo}>
            {/* Duration and Calories */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.statLabel}>{duration} phút</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="fire"
                  size={16}
                  color={COLORS.error}
                />
                <Text style={styles.statLabel}>{calories} kcal</Text>
              </View>
            </View>

            {/* Progress bar */}
            {completionPercentage > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${completionPercentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{completionPercentage}%</Text>
              </View>
            )}

            {/* Muscle group badge */}
            {day.muscleGroup && (
              <View style={styles.muscleGroupBadge}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.muscleGroupText}>
                  {getMuscleGroupLabel(day.muscleGroup)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        {isCurrentDay && !isRestDay && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={onStartPress}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="play-circle"
              size={18}
              color={COLORS.surface}
            />
            <Text style={styles.startButtonText}>Bắt đầu ngay</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getMuscleGroupLabel = (group: string): string => {
  const labels: { [key: string]: string } = {
    full_body: 'Toàn thân',
    chest: 'Ngực',
    back: 'Lưng',
    legs: 'Chân',
    shoulders: 'Vai',
    arms: 'Tay',
    core: 'Lõi',
  };
  return labels[group] || group;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  currentDayContainer: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  timelineIndicator: {
    width: 4,
    backgroundColor: COLORS.border,
  },
  currentTimeline: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  completedBadge: {
    padding: SPACING.xs,
  },
  todayBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  restDayContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  restDayText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  workoutInfo: {
    gap: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statsDivider: {
    flex: 1,
  },
  progressContainer: {
    gap: SPACING.xs,
  },
  progressBackground: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  muscleGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  muscleGroupText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
