import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined';
}

export function Card({ children, style, onPress, variant = 'elevated' }: CardProps) {
  const cardStyle = [
    styles.card,
    variant === 'outlined' ? styles.outlined : styles.elevated,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  elevated: {
    ...SHADOWS.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
