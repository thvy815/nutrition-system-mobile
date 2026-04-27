/**
 * ViewModeToggle Component
 * Toggle between Week and Day view
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface ViewModeToggleProps {
  mode: 'week' | 'day';
  onToggle: (mode: 'week' | 'day') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onToggle }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, mode === 'week' && styles.activeButton]}
        onPress={() => onToggle('week')}
      >
        <Text style={[styles.buttonText, mode === 'week' && styles.activeButtonText]}>
          Tuần
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, mode === 'day' && styles.activeButton]}
        onPress={() => onToggle('day')}
      >
        <Text style={[styles.buttonText, mode === 'day' && styles.activeButtonText]}>
          Ngày
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    gap: SPACING.xs,
    marginVertical: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeButtonText: {
    color: COLORS.primary,
  },
});
