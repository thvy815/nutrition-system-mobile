import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BORDER_RADIUS,
  COLORS,
  METRIC_COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { Meal } from '../types';

interface MealCardProps {
  meal: Meal;
  onToggleCheck?: (meal: Meal) => void;
  onDelete?: (meal: Meal) => void;
}

export const MealCard = memo(function MealCard({ meal, onToggleCheck, onDelete }: MealCardProps) {
  const checked = !!meal.isChecked;

  return (
    <View style={[styles.card, checked && styles.cardChecked]}>
      {meal.imageUrl ? (
        <Image source={{ uri: meal.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Ionicons name="restaurant-outline" size={26} color={COLORS.textMuted} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Text numberOfLines={2} style={[styles.name, checked && styles.nameChecked]}>
              {meal.name}
            </Text>
            {meal.scale && meal.scale !== 1 ? (
              <Text style={styles.scale} numberOfLines={1}>
                Phần: {meal.scale}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onToggleCheck?.(meal)}
              hitSlop={8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel="Đánh dấu đã ăn"
            >
              <Ionicons
                name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={checked ? COLORS.success : COLORS.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete?.(meal)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Xóa món"
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.caloriesRow}>
          <Ionicons name="flame" size={15} color={METRIC_COLORS.calories} />
          <Text style={styles.caloriesText} numberOfLines={1}>
            {Math.round(meal.calories || 0)} kcal
          </Text>
        </View>

        <View style={styles.macrosRow}>
          <Macro label="Đạm" value={meal.protein} color={METRIC_COLORS.protein} />
          <Macro label="Tinh bột" value={meal.carbs} color={METRIC_COLORS.carbs} />
          <Macro label="Béo" value={meal.fat} color={METRIC_COLORS.fat} />
        </View>
      </View>
    </View>
  );
});

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macroBox}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroValue} numberOfLines={1}>
        {Math.round(value || 0)}g
      </Text>
      <Text style={styles.macroLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    ...SHADOWS.sm,
  },
  cardChecked: {
    backgroundColor: COLORS.primarySoft,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
    flexShrink: 1,
  },
  nameChecked: {
    color: COLORS.textSecondary,
  },
  scale: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xxs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  caloriesText: {
    ...TYPOGRAPHY.captionStrong,
    color: METRIC_COLORS.calories,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  macroBox: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroValue: {
    ...TYPOGRAPHY.captionStrong,
    color: COLORS.text,
  },
  macroLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
});
