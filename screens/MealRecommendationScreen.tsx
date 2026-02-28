import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ScreenContainer, GoalTag } from '../components';
import { COLORS, SPACING } from '../constants/theme';
import { MOCK_MEAL_RECOMMENDATIONS } from '../constants/mockData';
import type { Meal } from '../types';

export function MealRecommendationScreen() {
  const [plan, setPlan] = useState<'daily' | 'weekly'>('daily');
  const meals = plan === 'daily' ? MOCK_MEAL_RECOMMENDATIONS.daily : MOCK_MEAL_RECOMMENDATIONS.weekly;

  return (
    <ScreenContainer>
      <Text style={styles.title}>Meal Recommendations</Text>
      <Text style={styles.subtitle}>Personalized based on your goals</Text>

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
            Daily Plan
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
            Weekly Plan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meal Cards */}
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
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
        <View style={styles.macroItem}>
          <Ionicons name="flame" size={16} color={COLORS.accent} />
          <Text style={styles.macroValue}>{meal.calories} cal</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>P: {meal.protein}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>C: {meal.carbs}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>F: {meal.fat}g</Text>
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
  mealCard: {
    marginBottom: SPACING.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  macros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  macroValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
