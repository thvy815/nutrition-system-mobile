import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ProgressBar, ScreenContainer, GoalTag, DifficultyTag } from '../components';
import { COLORS, SPACING } from '../constants/theme';
import { MOCK_DASHBOARD } from '../constants/mockData';
import type { Meal, Workout } from '../types';

export function DashboardScreen() {
  const { dailyCalorieTarget, caloriesConsumed, caloriesBurned, weight, bmi, todayMeals, todayWorkouts } = MOCK_DASHBOARD;
  const remaining = dailyCalorieTarget - caloriesConsumed + caloriesBurned;

  return (
    <ScreenContainer>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Your health overview</Text>

      {/* Calorie Summary */}
      <Card style={styles.card}>
        <View style={styles.calorieHeader}>
          <Ionicons name="flame" size={24} color={COLORS.accent} />
          <Text style={styles.cardTitle}>Daily Calories</Text>
        </View>
        <ProgressBar
          value={caloriesConsumed}
          max={dailyCalorieTarget}
          label="Consumed"
          color={COLORS.primary}
        />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{caloriesBurned}</Text>
            <Text style={styles.statLabel}>Burned</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{remaining}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </Card>

      {/* Weight & BMI */}
      <Card style={styles.card}>
        <View style={styles.calorieHeader}>
          <Ionicons name="body" size={24} color={COLORS.secondary} />
          <Text style={styles.cardTitle}>Body Stats</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{weight} kg</Text>
            <Text style={styles.statLabel}>Weight</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{bmi}</Text>
            <Text style={styles.statLabel}>BMI</Text>
          </View>
        </View>
      </Card>

      {/* Today's Meals */}
      <Text style={styles.sectionTitle}>Today's Meals</Text>
      {todayMeals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

      {/* Today's Workouts */}
      <Text style={styles.sectionTitle}>Today's Workouts</Text>
      {todayWorkouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </ScreenContainer>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealName}>{meal.name}</Text>
        {meal.goalTag && <GoalTag goal={meal.goalTag} />}
      </View>
      <View style={styles.macros}>
        <Text style={styles.macroText}>{meal.calories} cal</Text>
        <Text style={styles.macroText}>P: {meal.protein}g</Text>
        <Text style={styles.macroText}>C: {meal.carbs}g</Text>
        <Text style={styles.macroText}>F: {meal.fat}g</Text>
      </View>
    </Card>
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
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.workoutStatText}>{workout.duration} min</Text>
        </View>
        <View style={styles.workoutStat}>
          <Ionicons name="flame-outline" size={16} color={COLORS.accent} />
          <Text style={styles.workoutStatText}>{workout.caloriesBurned} cal</Text>
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
  card: {
    marginBottom: SPACING.md,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  mealCard: {
    marginBottom: SPACING.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  macros: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  macroText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  workoutCard: {
    marginBottom: SPACING.sm,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  workoutName: {
    fontSize: 16,
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
    gap: SPACING.xs,
  },
  workoutStatText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
