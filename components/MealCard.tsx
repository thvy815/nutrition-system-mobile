import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { COLORS, SPACING } from '../constants/theme';
import { Meal } from '../types';

interface MealCardProps {
  meal: Meal;
  onToggleCheck?: (meal: Meal) => void;
  onDelete?: (meal: Meal) => void;
}

export function MealCard({ meal, onToggleCheck, onDelete }: MealCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>

        {/* IMAGE */}
        <Image
          source={{ uri: meal.imageUrl || 'https://via.placeholder.com/80' }}
          style={styles.image}
        />

        {/* RIGHT */}
        <View style={styles.content}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2} style={styles.name}>
                {meal.name}
              </Text>

              {meal.scale && meal.scale !== 1 && (
                <Text style={styles.scale}>Phần: {meal.scale}</Text>
              )}
            </View>

            {/* ACTIONS */}
            <View style={styles.actions}>

              {/* CHECK */}
              <Ionicons
                name={meal.isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={meal.isChecked ? COLORS.success : COLORS.textSecondary}
                onPress={() => onToggleCheck?.(meal)}
              />

              {/* DELETE */}
              <Ionicons
                name="trash-outline"
                size={20}
                color="#EF4444"
                onPress={() => onDelete?.(meal)}
                style={{ marginLeft: 12 }}
              />
            </View>
          </View>

          {/* 🔥 CALORIES (nổi bật riêng) */}
          <View style={styles.caloriesRow}>
            <Ionicons name="flame" size={16} color={COLORS.accent} />
            <Text style={styles.caloriesText}>
              {meal.calories} kcal
            </Text>
          </View>

          {/* MACROS (3 cái 1 hàng) */}
          <View style={styles.macrosRow}>
            <Macro label="Đạm" value={meal.protein} />
            <Macro label="Carb" value={meal.carbs} />
            <Macro label="Béo" value={meal.fat} />
          </View>

        </View>
      </View>
    </Card>
  );
}


// ===== macro nhỏ =====
function Macro({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.macroBox}>
      <Text style={styles.macroValue}>{Math.round(value)}g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    marginBottom: SPACING.md,
  },

  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#eee',
  },

  content: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  serving: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  /* 🔥 CALORIES */
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  caloriesText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },

  /* 🧠 MACROS */
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  macroBox: {
    flex: 1,
    alignItems: 'center',
  },

  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  macroLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  scale: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  mealCard: {
    marginBottom: SPACING.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  servingTimeBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  servingTimeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
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
  // macroValue: {
  //   fontSize: 14,
  //   color: COLORS.textSecondary,
  // },
  portionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
})