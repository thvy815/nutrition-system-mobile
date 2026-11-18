import React, { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useWorkout } from '../contexts/WorkoutContext';
import {
  Badge,
  Button,
  EmptyState,
  Notice,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
  StatTile,
} from '../components';
import { ACTION_META, SubstituteSheet } from '../components/workout';
import { BORDER_RADIUS, COLORS, METRIC_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { DAY_NAMES, ReplaceResult, WorkoutDay, WorkoutExercise } from '../types/workout';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=60&auto=format&fit=crop';

const INTENSITY: Record<string, { label: string; color: string }> = {
  light: { label: 'Nhẹ', color: COLORS.success },
  moderate: { label: 'Vừa', color: COLORS.warning },
  vigorous: { label: 'Mạnh', color: COLORS.error },
};

function getVNDateOnly(date: string | Date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export const DayDetailScreen = ({ route, navigation }: any) => {
  const dayNumber: number = route?.params?.dayNumber;
  const { plan, replacePlan } = useWorkout();
  const [swapTarget, setSwapTarget] = useState<WorkoutExercise | null>(null);

  const day = plan?.days.find((d) => d.day === dayNumber) as WorkoutDay | undefined;

  // Chỉ cho đổi bài ở ngày tập chưa qua, chưa hoàn thành / bỏ qua.
  const canSubstitute = useMemo(() => {
    if (!day || day.type === 'rest' || day.completed || day.skipped) return false;
    return getVNDateOnly(day.date) >= getVNDateOnly(new Date());
  }, [day]);

  const substitutedIds = useMemo(
    () => new Set((day?.substitutions ?? []).map((s) => s.toExerciseId)),
    [day]
  );

  const handleStartWorkout = useCallback(() => {
    const first = day?.exerciseDetails?.[0];
    if (!first) {
      Alert.alert('Thông báo', 'Không tìm thấy bài tập cho ngày này');
      return;
    }
    navigation.navigate('WorkoutSession', { dayNumber, exerciseId: first.exerciseId });
  }, [day, dayNumber, navigation]);

  const openExercise = useCallback(
    (exerciseId: number) => navigation.navigate('ExerciseDetail', { dayNumber, exerciseId }),
    [dayNumber, navigation]
  );

  const handleReplaced = useCallback(
    (result: ReplaceResult) => {
      replacePlan(result.plan);
      Alert.alert(
        'Đã thay bài tập',
        `${result.replaced.from.name} → ${result.replaced.to.name}`
      );
    },
    [replacePlan]
  );

  const header = (
    <ScreenHeader
      title={DAY_NAMES(dayNumber)}
      subtitle={day ? new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }) : undefined}
      onBack={() => navigation.goBack()}
    />
  );

  if (!day) {
    return (
      <ScreenContainer header={header} scrollable={false}>
        <EmptyState icon="calendar-outline" title="Không tìm thấy ngày tập" />
      </ScreenContainer>
    );
  }

  const isRest = day.type === 'rest';
  const adaptation =
    day.adaptation && day.adaptation.action !== 'maintain' ? ACTION_META[day.adaptation.action] : null;

  return (
    <ScreenContainer header={header}>
      <View style={styles.hero}>
        <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFill} />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{isRest ? 'Ngày nghỉ' : 'Buổi tập hôm nay'}</Text>
          <View style={styles.heroBadges}>
            {day.completed ? <Badge label="Đã hoàn thành" tone="success" icon="checkmark" /> : null}
            {day.skipped ? <Badge label="Đã bỏ qua" tone="error" /> : null}
            {adaptation ? <Badge label={adaptation.label} tone={adaptation.tone} icon={adaptation.icon} /> : null}
          </View>
        </View>
      </View>

      {!isRest ? (
        <View style={styles.stats}>
          <StatTile icon="time-outline" label="Thời lượng" value={day.totalDuration} unit="phút" color={COLORS.secondary} />
          <StatTile icon="flame-outline" label="Calo dự kiến" value={day.estimatedCalories} unit="kcal" color={METRIC_COLORS.calories} />
          <StatTile icon="list-outline" label="Số bài" value={day.exerciseDetails?.length ?? 0} color={COLORS.primary} />
        </View>
      ) : null}

      {adaptation && day.adaptation?.reasons?.length ? (
        <Notice tone={adaptation.tone} icon={adaptation.icon} title="Kế hoạch đã được điều chỉnh" style={styles.mt12}>
          {day.adaptation.reasons.map((r, i) => (
            <Text key={i} style={styles.noticeLine}>
              • {r}
            </Text>
          ))}
        </Notice>
      ) : null}

      {!isRest && !day.completed && !day.skipped ? (
        <Button title="Bắt đầu tập" icon="play" onPress={handleStartWorkout} fullWidth style={styles.mt16} />
      ) : null}

      {isRest ? (
        <EmptyState
          icon="bed-outline"
          title="Hôm nay là ngày nghỉ"
          message="Ngủ đủ giấc, đi bộ nhẹ và giãn cơ giúp cơ thể phục hồi tốt hơn."
        />
      ) : (
        <>
          <SectionHeader
            title="Bài tập"
            icon="barbell-outline"
          />
          {canSubstitute ? (
            <Text style={styles.hint}>Không phù hợp? Bấm “Đổi bài” để chọn bài tương tự.</Text>
          ) : null}
          {day.exerciseDetails?.map((ex, idx) => (
            <ExerciseRow
              key={`${ex.exerciseId}-${idx}`}
              index={idx + 1}
              exercise={ex}
              substituted={substitutedIds.has(ex.exerciseId)}
              canSubstitute={canSubstitute}
              onPress={openExercise}
              onSwap={setSwapTarget}
            />
          ))}
        </>
      )}

      <SubstituteSheet
        visible={!!swapTarget}
        day={dayNumber}
        exercise={swapTarget}
        onClose={() => setSwapTarget(null)}
        onReplaced={handleReplaced}
      />
    </ScreenContainer>
  );
};

const ExerciseRow = memo(function ExerciseRow({
  index,
  exercise,
  substituted,
  canSubstitute,
  onPress,
  onSwap,
}: {
  index: number;
  exercise: WorkoutExercise;
  substituted: boolean;
  canSubstitute: boolean;
  onPress: (id: number) => void;
  onSwap: (ex: WorkoutExercise) => void;
}) {
  const intensity = INTENSITY[exercise.intensity];

  return (
    <TouchableOpacity style={styles.exCard} onPress={() => onPress(exercise.exerciseId)} activeOpacity={0.8}>
      <View style={styles.exIndex}>
        <Text style={styles.exIndexText}>{index}</Text>
      </View>
      <View style={styles.flex1}>
        <Text style={styles.exName} numberOfLines={2}>
          {exercise.name}
        </Text>
        <Text style={styles.exMeta} numberOfLines={1}>
          {exercise.sets} hiệp × {exercise.reps} lần · {exercise.duration} phút · {exercise.calories} kcal
        </Text>
        <View style={styles.exBadges}>
          {intensity ? (
            <View style={styles.intensity}>
              <View style={[styles.intensityDot, { backgroundColor: intensity.color }]} />
              <Text style={styles.intensityText}>{intensity.label}</Text>
            </View>
          ) : null}
          {substituted ? <Badge label="Đã thay" tone="info" icon="swap-horizontal" /> : null}
        </View>
      </View>
      {canSubstitute ? (
        <TouchableOpacity
          style={styles.swapBtn}
          onPress={() => onSwap(exercise)}
          hitSlop={6}
          accessibilityLabel={`Đổi bài ${exercise.name}`}
        >
          <MaterialCommunityIcons name="swap-horizontal" size={18} color={COLORS.primaryDark} />
          <Text style={styles.swapText}>Đổi bài</Text>
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  mt12: { marginTop: SPACING.sm + 4 },
  mt16: { marginTop: SPACING.md },

  hero: {
    height: 150,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'flex-end',
  },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,24,39,0.45)' },
  heroContent: { padding: SPACING.md, gap: SPACING.sm },
  heroTitle: { ...TYPOGRAPHY.h2, color: COLORS.textInverse },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  stats: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  noticeLine: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginBottom: SPACING.sm },

  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    padding: SPACING.sm + 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  exIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIndexText: { ...TYPOGRAPHY.captionStrong, color: COLORS.primaryDark },
  exName: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text },
  exMeta: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 2 },
  exBadges: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  intensity: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  intensityDot: { width: 8, height: 8, borderRadius: 4 },
  intensityText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },
  swapBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primarySoft,
    gap: 2,
  },
  swapText: { ...TYPOGRAPHY.small, color: COLORS.primaryDark, fontWeight: '600' },
});
