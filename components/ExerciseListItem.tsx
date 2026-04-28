/**
 * ExerciseListItem Component
 * Displays exercise in a list format with circular image
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

interface ExerciseListItemProps {
  exerciseId: number;
  exerciseName: string;
  duration: number;
  onPress?: () => void;
}

const DEFAULT_EXERCISE_IMAGE = 'https://via.placeholder.com/80?text=Exercise';

export const ExerciseListItem: React.FC<ExerciseListItemProps> = ({
  exerciseId,
  exerciseName,
  duration,
  onPress,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.container, SHADOWS.sm]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Circular Image */}
      <View style={styles.imageContainer}>
        {!imageError ? (
          <Image
            source={{ uri: DEFAULT_EXERCISE_IMAGE }}
            style={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name="dumbbell"
              size={28}
              color={COLORS.textMuted}
            />
          </View>
        )}
      </View>

      {/* Exercise Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {exerciseName}
        </Text>
        <View style={styles.durationBadge}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={12}
            color={COLORS.primary}
          />
          <Text style={styles.durationText}>{duration} phút</Text>
        </View>
      </View>

      {/* Arrow Icon */}
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={COLORS.textMuted}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
