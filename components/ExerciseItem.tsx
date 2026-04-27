/**
 * ExerciseItem Component
 * Displays a single exercise in the list
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Exercise } from '../types/workout';

interface ExerciseItemProps {
  exercise: Exercise;
  dayNumber?: number;
  isCompleted?: boolean;
  onPress?: () => void;
  onCompleteToggle?: () => void;
}

const DEFAULT_EXERCISE_IMAGE = 'https://via.placeholder.com/80?text=Exercise';

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  dayNumber,
  isCompleted = false,
  onPress,
  onCompleteToggle,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        SHADOWS.sm,
        isCompleted && styles.completedContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Exercise Image */}
      <View style={styles.imageContainer}>
        {!imageError ? (
          <Image
            source={{ uri: exercise.image || DEFAULT_EXERCISE_IMAGE }}
            style={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name="dumbbell"
              size={30}
              color={COLORS.textMuted}
            />
          </View>
        )}
        {isCompleted && (
          <View style={styles.completedOverlay}>
            <MaterialCommunityIcons
              name="check-circle"
              size={28}
              color={COLORS.success}
            />
          </View>
        )}
      </View>

      {/* Exercise Details */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.exerciseName, isCompleted && styles.completedText]}>
          {exercise.name}
        </Text>

        {/* Sets/Reps or Duration */}
        <View style={styles.infoRow}>
          <View style={styles.infoBadge}>
            <MaterialCommunityIcons
              name="repeat"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.infoBadgeText}>
              {exercise.sets} sets × {exercise.reps}
            </Text>
          </View>

          <View style={styles.infoBadge}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={COLORS.accent}
            />
            <Text style={styles.infoBadgeText}>
              {exercise.duration} phút
            </Text>
          </View>
        </View>

        {/* Calories */}
        <View style={styles.calorieRow}>
          <MaterialCommunityIcons
            name="fire"
            size={14}
            color={COLORS.error}
          />
          <Text style={styles.calorieText}>
            {exercise.calories} kcal
          </Text>
        </View>
      </View>

      {/* Complete Button */}
      <TouchableOpacity
        style={[styles.completeButton, isCompleted && styles.completedButton]}
        onPress={onCompleteToggle}
      >
        <MaterialCommunityIcons
          name={isCompleted ? 'check-circle' : 'circle-outline'}
          size={24}
          color={isCompleted ? COLORS.success : COLORS.textMuted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    padding: SPACING.md,
  },
  completedContainer: {
    backgroundColor: `${COLORS.success}10`,
  },
  imageContainer: {
    position: 'relative',
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  image: {
    width: 80,
    height: 80,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
  },
  completedText: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  infoBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  calorieText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
  },
  completeButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  completedButton: {
    // No special styling needed
  },
});
