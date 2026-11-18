import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';
import type { HealthGoal, DifficultyLevel } from '../types';

interface TagProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'neutral';
}

const VARIANT_COLORS = {
  primary: { bg: COLORS.primarySoft, text: COLORS.primaryDark },
  secondary: { bg: COLORS.secondarySoft, text: COLORS.secondary },
  accent: { bg: COLORS.accentSoft, text: '#B45309' },
  success: { bg: COLORS.successSoft, text: COLORS.primaryDark },
  neutral: { bg: COLORS.surfaceMuted, text: COLORS.textSecondary },
};

export function Tag({ label, variant = 'primary' }: TagProps) {
  const colors = VARIANT_COLORS[variant];

  return (
    <View style={[styles.tag, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

export function GoalTag({ goal }: { goal: HealthGoal }) {
  const labels: Record<HealthGoal, string> = {
    lose_weight: 'Giảm cân',
    gain_weight: 'Tăng cân',
    maintain: 'Duy trì',
    build_muscle: 'Tăng cơ',
  };
  return <Tag label={labels[goal]} variant="primary" />;
}

export function DifficultyTag({ level }: { level: DifficultyLevel }) {
  const variants: Record<DifficultyLevel, 'primary' | 'secondary' | 'accent'> = {
    beginner: 'secondary',
    intermediate: 'primary',
    advanced: 'accent',
  };
  const labels: Record<DifficultyLevel, string> = {
    beginner: 'Mới bắt đầu',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao',
  };
  return <Tag label={labels[level]} variant={variants[level]} />;
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
