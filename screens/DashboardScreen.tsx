import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING } from '../constants/theme';

import { Card, ScreenContainer } from '../components';
import { workoutService } from '../services';
import { getDailyMenuByDate } from '../services/dailyMenu';
import { WorkoutDay, WorkoutExercise } from '../types/workout';
import { useAuth } from '../contexts/AuthContext';
import { DailyMenu, RecipeItem } from '../types/dailyMenu';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);

  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null);
  const [todayMeal, setTodayMeal] = useState<DailyMenu | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      if (!token) return;
      setLoading(true);

      const workout = await workoutService.getTodayWorkout();

      setTodayWorkout(workout);

      // meal theo ngày
      const today = new Date()
        .toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
        .split(' ')[0];

      const meal = await getDailyMenuByDate(today, token);

      setTodayMeal(meal);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <ScreenContainer>
        <Text>Loading...</Text>
      </ScreenContainer>
    );
  }

  const mealGroups = {
    breakfast: todayMeal?.recipes?.filter(item => item.servingTime === 'breakfast') ?? [],
    lunch: todayMeal?.recipes?.filter(item => item.servingTime === 'lunch') ?? [],
    dinner: todayMeal?.recipes?.filter(item => item.servingTime === 'dinner') ?? [],
    snack: todayMeal?.recipes?.filter(item => item.servingTime === 'snack') ?? [],
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          Dashboard
        </Text>

        <Text style={styles.subtitle}>
          Tổng quan hôm nay
        </Text>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons
              name="flame"
              size={24}
              color={COLORS.accent}
            />

            <Text style={styles.summaryTitle}>
              Hôm nay
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {todayMeal?.totalNutrition?.calories ?? 0}
              </Text>
              <Text style={styles.statLabel}>Kcal menu</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {todayMeal?.totalNutrition?.protein ?? 0}
              </Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {todayWorkout?.estimatedCalories ?? 0}
              </Text>
              <Text style={styles.statLabel}>Dự kiến đốt</Text>
            </View>
          </View>
        </Card>

        {/* Workout */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.row}>
              <Ionicons
                name="barbell"
                size={22}
                color={COLORS.primary}
              />

              <Text style={styles.sectionTitle}>
                Bài tập hôm nay
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('WorkoutPlan')
              }
            >
              <Text style={styles.link}>
                Xem thêm
              </Text>
            </TouchableOpacity>
          </View>

          {todayWorkout?.type === 'rest' ? (
            <Text style={styles.restText}>
              Hôm nay là ngày nghỉ phục hồi
            </Text>
          ) : (
            <>
              <Text style={styles.focus}>
                {todayWorkout?.focus}
              </Text>

              <View style={styles.workoutInfo}>
                <Text style={styles.infoText}>
                  ⏱ {todayWorkout?.totalDuration} phút
                </Text>

                <Text style={styles.infoText}>
                  🔥 {todayWorkout?.estimatedCalories} kcal
                </Text>
              </View>

              <View style={styles.innerList}>
                {(todayWorkout?.exerciseDetails ?? []).map(
                  (exercise: WorkoutExercise) => (
                    <View
                      key={exercise.exerciseId}
                      style={styles.exerciseItem}
                    >
                      <View style={styles.dot} />

                      <View>
                        <Text style={styles.exerciseName}>
                          {exercise.name}
                        </Text>

                        <Text style={styles.exerciseDetail}>
                          {exercise.sets} sets • {exercise.reps} reps • {exercise.calories} kcal
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            </>
          )}
        </Card>

        {/* Meal */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.row}>
              <Ionicons
                name="restaurant"
                size={22}
                color={COLORS.secondary}
              />

              <Text style={styles.sectionTitle}>
                Thực đơn hôm nay
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('MealRecommendation')
              }
            >
              <Text style={styles.link}>
                Xem menu
              </Text>
            </TouchableOpacity>
          </View>

          {!todayMeal && (
            <Text style={styles.mealHint}>
              Chưa có thực đơn hôm nay
            </Text>
          )}

          {todayMeal && (
            <View style={styles.mealSummary}>
              <Text style={styles.mealSummaryText}>
                Protein: {todayMeal.totalNutrition?.protein ?? 0}g • 
                Carbs: {todayMeal.totalNutrition?.carbs ?? 0}g • 
                Fat: {todayMeal.totalNutrition?.fat ?? 0}g
              </Text>
            </View>
          )}

          {mealGroups.breakfast.length > 0 && (
            <View style={styles.mealSection}>
              <Text style={styles.mealTimeTitle}>🌅 Bữa sáng</Text>

              <View style={styles.innerList}>
                {mealGroups.breakfast.map((item: RecipeItem) => (
                  <View key={item._id} style={styles.mealItem}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {item.nutrition?.calories ?? 0} kcal
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {mealGroups.lunch.length > 0 && (
            <View style={styles.mealSection}>
              <Text style={styles.mealTimeTitle}>☀️ Bữa trưa</Text>

              <View style={styles.innerList}>
                {mealGroups.lunch.map((item: RecipeItem) => (
                  <View key={item._id} style={styles.mealItem}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {item.nutrition?.calories ?? 0} kcal
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {mealGroups.dinner.length > 0 && (
            <View style={styles.mealSection}>
              <Text style={styles.mealTimeTitle}>🌙 Bữa tối</Text>

              <View style={styles.innerList}>
                {mealGroups.dinner.map((item: RecipeItem) => (
                  <View key={item._id} style={styles.mealItem}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {item.nutrition?.calories ?? 0} kcal
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {mealGroups.snack.length > 0 && (
            <View style={styles.mealSection}>
              <Text style={styles.mealTimeTitle}>🍎 Bữa phụ</Text>

              <View style={styles.innerList}>
                {mealGroups.snack.map((item: RecipeItem) => (
                  <View key={item._id} style={styles.mealItem}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {item.nutrition?.calories ?? 0} kcal
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  innerList: {
    marginTop: 12,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 7,
    marginRight: 10,
  },

  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  exerciseDetail: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  mealSummary: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },

  mealSummaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  mealSection: {
    marginTop: 16,
  },

  mealTimeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  mealItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,
    marginBottom: SPACING.lg,
    color: COLORS.textSecondary,
    fontSize: 15,
  },

  summaryCard: {
    marginBottom: SPACING.md,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },

  statLabel: {
    marginTop: 4,
    color: COLORS.textSecondary,
  },

  card: {
    marginBottom: SPACING.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },

  link: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  focus: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textTransform: 'capitalize',
  },

  workoutInfo: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  infoText: {
    color: COLORS.textSecondary,
  },

  mealHint: {
    color: COLORS.textSecondary,
  },

  mealBox: {
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },

  mealBoxText: {
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  restText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});