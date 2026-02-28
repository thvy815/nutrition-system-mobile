import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showLabel?: boolean;
  color?: string;
  height?: number;
}

export function ProgressBar({
  value,
  max,
  label,
  showLabel = true,
  color = COLORS.primary,
  height = 12,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <View style={styles.container}>
      {(label || showLabel) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showLabel && (
            <Text style={styles.value}>
              {value} / {max}
            </Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BORDER_RADIUS.full,
  },
});
