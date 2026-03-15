import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ScreenContainer, DifficultyTag } from '../components';
import { COLORS, SPACING } from '../constants/theme';
import { MOCK_WORKOUT_RECOMMENDATIONS } from '../constants/mockData';
import type { Workout } from '../types';

export function WorkoutRecommendationScreen() {
  const [plan, setPlan] = useState<'daily' | 'weekly'>('daily');
  const workouts =
    plan === 'daily'
      ? MOCK_WORKOUT_RECOMMENDATIONS.daily
      : MOCK_WORKOUT_RECOMMENDATIONS.weekly;

  return (
    <ScreenContainer>
      <Text style={styles.title}>Gợi ý bài tập</Text>
      <Text style={styles.subtitle}>Phù hợp theo mục tiêu thể thao của bạn</Text>

      {/* Plan Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, plan === 'daily' && styles.toggleButtonActive]}
          onPress={() => setPlan('daily')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="today"
            size={20}
            color={plan === 'daily' ? '#FFF' : COLORS.textSecondary}
          />
          <Text style={[styles.toggleText, plan === 'daily' && styles.toggleTextActive]}>
            Kế hoạch ngày
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, plan === 'weekly' && styles.toggleButtonActive]}
          onPress={() => setPlan('weekly')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={plan === 'weekly' ? '#FFF' : COLORS.textSecondary}
          />
          <Text style={[styles.toggleText, plan === 'weekly' && styles.toggleTextActive]}>
            Kế hoạch tuần
          </Text>
        </TouchableOpacity>
      </View>

      {/* Workout Cards */}
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </ScreenContainer>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  return (
    <Card style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        <DifficultyTag level={workout.difficulty} />
      </View>
      <View style={styles.workoutStats}>
        <View style={styles.workoutStat}>
          <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.workoutStatText}>{workout.duration} phút</Text>
        </View>
        <View style={styles.workoutStat}>
          <Ionicons name="flame" size={20} color={COLORS.accent} />
          <Text style={styles.workoutStatText}>{workout.caloriesBurned} calo đốt</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: '#FFF',
  },
  workoutCard: {
    marginBottom: SPACING.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  workoutStatText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
