import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkout } from '../contexts/WorkoutContext';
import { ScreenContainer } from '../components/ScreenContainer';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from '../constants/theme';
import { DAY_NAMES, WorkoutDay } from '../types/workout';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438';

export const DayDetailScreen = ({ route, navigation }: any) => {
  const dayNumber = route?.params?.dayNumber;
  const { plan } = useWorkout();

  const [warmupEnabled, setWarmupEnabled] = useState(true);

  const day = plan?.plan.find(d => d.day === dayNumber) as WorkoutDay;

  if (!day) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text>Không tìm thấy ngày tập</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* HERO IMAGE */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
          <View style={styles.overlay} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.dayText}>{DAY_NAMES(dayNumber)}</Text>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.primary} />
            <Text style={styles.statText}>{day.totalDuration} min</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="fire" size={18} color={COLORS.primary} />
            <Text style={styles.statText}>{day.totalCalories} kcal</Text>
          </View>
        </View>

        {/* START BUTTON */}
        <TouchableOpacity style={styles.startBtn}>
          <Text style={styles.startText}>BẮT ĐẦU NGAY</Text>
        </TouchableOpacity>

        {/* MUSCLE GROUP */}
        <View style={styles.muscleWrapper}>
          {day.muscleGroup?.map((m) => (
            <View key={m.id} style={styles.muscleChip}>
              <Text style={styles.muscleText}>
                {m.name_en}
              </Text>
            </View>
          ))}
        </View>

        {/* WARMUP */}
        <View style={styles.warmupCard}>
          <View style={styles.warmupLeft}>
            <MaterialCommunityIcons name="fire" size={20} color="#00C897" />

            <Text style={styles.warmupTitle}>
              Khởi động
            </Text>
          </View>

          <Switch
            value={warmupEnabled}
            onValueChange={setWarmupEnabled}
            trackColor={{ false: '#ccc', true: '#A7F3D0' }}
            thumbColor={warmupEnabled ? '#00C897' : '#f4f3f4'}
          />
        </View>

        {/* EXERCISES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bài tập</Text>
        </View>
        <View style={{ padding: 16 }}>
          {day.exerciseDetails?.map((ex) => (
            <View key={ex.exerciseId} style={styles.exerciseCard}>
              <MaterialCommunityIcons name="dumbbell" size={22} />

              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.exerciseName}>
                  {ex.name}
                </Text>

                <Text style={styles.exerciseMeta}>
                  {ex.duration} phút • {ex.calories} kcal
                </Text>

                <Text style={styles.exerciseMeta}>
                  {ex.sets} set • {ex.reps}
                </Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    height: 240,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backBtn: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.md,
  },
  dayText: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.md,
    color: COLORS.surface,
    fontSize: 28,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  startBtn: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',

    ...SHADOWS.md,
  },
  startText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  muscleWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },

  muscleChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },

  muscleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  warmupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,

    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,

    ...SHADOWS.sm,
  },

  warmupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  warmupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  exerciseCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',

    borderWidth: 1,
    borderColor: COLORS.border,

    ...SHADOWS.sm,
  },
  exerciseName: {
    fontWeight: '700',
    fontSize: 15,
    color: COLORS.text,
  },

  exerciseMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});