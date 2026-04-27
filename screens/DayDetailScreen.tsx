/**
 * DayDetailScreen
 * Shows detailed view of a single day with all exercises
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkout } from '../contexts/WorkoutContext';
import { ExerciseItem } from '../components/ExerciseItem';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { workoutService } from '../services/workout';

interface DayDetailScreenProps {
  route?: any;
  navigation?: any;
}

const DEFAULT_BANNER = 'https://via.placeholder.com/400x200?text=Workout+Day';

export const DayDetailScreen: React.FC<DayDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const dayNumber = route?.params?.dayNumber;
  const { plan, completedSessions, markExerciseCompleted } = useWorkout();
  const [warmupEnabled, setWarmupEnabled] = useState(true);
  const [dayDuration, setDayDuration] = useState(0);
  const [dayCalories, setDayCalories] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [imageError, setImageError] = useState(false);

  const day = plan?.plan.find(d => d.day === dayNumber);

  // Calculate stats
  useEffect(() => {
    if (day && day.type === 'workout' && day.exercises) {
      const duration = workoutService.calculateDayDuration(day.exercises);
      const calories = workoutService.calculateDayCalories(day.exercises);
      setDayDuration(duration);
      setDayCalories(calories);
    }
  }, [day]);

  // Update completion percentage
  useEffect(() => {
    updateCompletionPercentage();
  }, [completedSessions, day]);

  const updateCompletionPercentage = async () => {
    if (!day || !day.exercises) return;
    const progress = await workoutService.getDayCompletionPercentage(
      dayNumber,
      day.exercises.length
    );
    setCompletionPercentage(progress);
  };

  const handleExerciseCompleteToggle = async (exerciseId: number) => {
    await markExerciseCompleted(dayNumber, exerciseId);
    await updateCompletionPercentage();
  };

  const isExerciseCompleted = (exerciseId: number): boolean => {
    return completedSessions.some(
      s => s.dayNumber === dayNumber && s.exerciseId === exerciseId && s.completed
    );
  };

  if (!day) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không tìm thấy ngày này</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Rest day view
  if (day.type === 'rest') {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="bed"
            size={64}
            color={COLORS.primary}
          />
          <Text style={styles.title}>Ngày {dayNumber} - Ngày nghỉ ngơi</Text>
          <Text style={styles.subtitle}>
            Hãy tận hưởng ngày nghỉ của bạn. Phục hồi và chuẩn bị cho những ngày tiếp theo!
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={COLORS.surface}
            />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation?.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        {/* Banner Image */}
        <View style={styles.bannerContainer}>
          {!imageError ? (
            <Image
              source={{ uri: day.exercises?.[0]?.image || DEFAULT_BANNER }}
              style={styles.banner}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={48}
                color={COLORS.textMuted}
              />
            </View>
          )}
        </View>

        {/* Day Info Header */}
        <View style={styles.headerSection}>
          <Text style={styles.dayTitle}>Ngày {dayNumber}</Text>

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, SHADOWS.sm]}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.statBoxValue}>{dayDuration}</Text>
              <Text style={styles.statBoxLabel}>phút</Text>
            </View>

            <View style={[styles.statBox, SHADOWS.sm]}>
              <MaterialCommunityIcons
                name="fire"
                size={20}
                color={COLORS.error}
              />
              <Text style={styles.statBoxValue}>{dayCalories}</Text>
              <Text style={styles.statBoxLabel}>kcal</Text>
            </View>

            <View style={[styles.statBox, SHADOWS.sm]}>
              <MaterialCommunityIcons
                name="percent"
                size={20}
                color={COLORS.accent}
              />
              <Text style={styles.statBoxValue}>{completionPercentage}%</Text>
              <Text style={styles.statBoxLabel}>hoàn thành</Text>
            </View>
          </View>

          {/* Muscle Group Badge */}
          {day.muscleGroup && (
            <View style={styles.muscleGroupContainer}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.muscleGroupLabel}>
                {getMuscleGroupLabel(day.muscleGroup)}
              </Text>
            </View>
          )}

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Warm-up Toggle */}
        <View style={[styles.warmupSection, SHADOWS.sm]}>
          <View style={styles.warmupHeader}>
            <MaterialCommunityIcons
              name="fire-circle"
              size={20}
              color={COLORS.warning}
            />
            <Text style={styles.warmupTitle}>Khởi động</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleSwitch, warmupEnabled && styles.toggleActive]}
            onPress={() => setWarmupEnabled(!warmupEnabled)}
          >
            <View
              style={[
                styles.toggleThumb,
                warmupEnabled && styles.toggleThumbActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Warm-up info when enabled */}
        {warmupEnabled && (
          <View style={styles.warmupInfoBox}>
            <Text style={styles.warmupInfoText}>
              🔥 Dành 5-10 phút để khởi động cơ thể trước khi bắt đầu{'\n'}
              • Chạy bộ nhẹ{'\n'}
              • Kéo căng cơ{'\n'}
              • Tập động tác chuẩn bị
            </Text>
          </View>
        )}

        {/* Exercises List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>
            Bài tập ({day.exercises?.length || 0})
          </Text>

          {day.exercises && day.exercises.length > 0 ? (
            day.exercises.map((exercise) => (
              <ExerciseItem
                key={exercise.exerciseId}
                exercise={exercise}
                dayNumber={dayNumber}
                isCompleted={isExerciseCompleted(exercise.exerciseId)}
                onPress={() =>
                  navigation?.navigate('ExerciseDetail', {
                    dayNumber,
                    exerciseId: exercise.exerciseId,
                  })
                }
                onCompleteToggle={() =>
                  handleExerciseCompleteToggle(exercise.exerciseId)
                }
              />
            ))
          ) : (
            <Text style={styles.noExercisesText}>Không có bài tập nào</Text>
          )}
        </View>

        {/* Cool Down Section */}
        <View style={[styles.cooldownSection, SHADOWS.sm]}>
          <MaterialCommunityIcons
            name="water"
            size={20}
            color={COLORS.secondary}
          />
          <View style={styles.cooldownContent}>
            <Text style={styles.cooldownTitle}>Giảm độ căng</Text>
            <Text style={styles.cooldownText}>
              Kéo căng từng cơ nhóm cơ trong 20-30 giây
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </ScreenContainer>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  bannerContainer: {
    marginHorizontal: -SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  banner: {
    width: '100%',
    height: 200,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  headerSection: {
    marginBottom: SPACING.lg,
  },
  dayTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statBox: {
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
  statBoxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statBoxLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  muscleGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  muscleGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressContainer: {
    gap: SPACING.xs,
  },
  progressBackground: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  warmupSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  warmupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  warmupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.border,
    padding: SPACING.xs,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  warmupInfoBox: {
    backgroundColor: `${COLORS.warning}15`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  warmupInfoText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  exercisesSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  noExercisesText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  cooldownSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  cooldownContent: {
    flex: 1,
  },
  cooldownTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cooldownText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    },
    subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 20,
    },
});
