import React, { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useWorkout } from '../contexts/WorkoutContext';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
} from '../components';
import { ACTION_META, AdaptPlanSheet, TrainingStateCard } from '../components/workout';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { AdaptResult, DAY_NAMES, WorkoutDay } from '../types/workout';

const WORKOUT_IMAGE =
  'https://plus.unsplash.com/premium_photo-1664910764486-bed06a30a71b?q=60&w=240&auto=format&fit=crop';
const REST_IMAGE =
  'https://plus.unsplash.com/premium_photo-1674675646818-01d7a7bae64c?w=240&auto=format&fit=crop&q=60';

const FOCUS_LABEL: Record<string, string> = {
  push: 'Đẩy (ngực, vai, tay sau)',
  pull: 'Kéo (lưng, tay trước)',
  legs: 'Chân',
  upper: 'Thân trên',
  lower: 'Thân dưới',
  full_body_push: 'Toàn thân – đẩy',
  full_body_pull: 'Toàn thân – kéo',
  full_body_legs: 'Toàn thân – chân',
  recovery: 'Phục hồi',
};

function getVNDateOnly(date: string | Date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

export const WorkoutPlanScreen = ({ navigation }: any) => {
  const {
    plan,
    loading,
    error,
    fetchPlan,
    trainingState,
    trainingStateLoading,
    fetchTrainingState,
    replacePlan,
  } = useWorkout();
  const [adaptOpen, setAdaptOpen] = useState(false);

  const todayVN = getVNDateOnly(new Date());
  const currentDay = useMemo(
    () => plan?.days?.find((d) => getVNDateOnly(d.date) === todayVN)?.day ?? 1,
    [plan, todayVN]
  );

  const progress = useMemo(() => {
    const workoutDays = plan?.days?.filter((d) => d.type === 'workout') ?? [];
    return {
      total: workoutDays.length,
      done: workoutDays.filter((d) => d.completed).length,
    };
  }, [plan]);

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchPlan(), fetchTrainingState(true)]);
  }, [fetchPlan, fetchTrainingState]);

  const handleDayPress = useCallback(
    (dayNumber: number) => navigation?.navigate('DayDetail', { dayNumber }),
    [navigation]
  );

  const handleApplied = useCallback(
    (result: AdaptResult) => {
      if (result.plan) replacePlan(result.plan);
      else fetchPlan();
      fetchTrainingState();
      const meta = ACTION_META[result.decision.action];
      Alert.alert(
        'Đã cập nhật kế hoạch',
        `${meta?.label ?? 'Điều chỉnh'}: ${result.changes.length} ngày được thay đổi.`
      );
    },
    [replacePlan, fetchPlan, fetchTrainingState]
  );

  const header = (
    <ScreenHeader
      title="Tập luyện"
      subtitle={
        plan
          ? `Tuần ${plan.currentWeek} · ${formatShortDate(plan.weekStartDate)} – ${formatShortDate(plan.weekEndDate)}`
          : 'Kế hoạch tuần của bạn'
      }
    />
  );

  if (loading && !plan) {
    return (
      <ScreenContainer header={header} scrollable={false}>
        <LoadingState message="Đang tải kế hoạch..." />
      </ScreenContainer>
    );
  }

  if (error && !plan) {
    return (
      <ScreenContainer header={header} scrollable={false}>
        <ErrorState message={error} onRetry={onRefresh} />
      </ScreenContainer>
    );
  }

  if (!plan || !plan.days?.length) {
    return (
      <ScreenContainer header={header} scrollable={false}>
        <EmptyState
          icon="barbell-outline"
          title="Chưa có kế hoạch tập"
          message="Hoàn thiện hồ sơ để hệ thống tạo kế hoạch tập phù hợp cho bạn."
          actionLabel="Tải lại"
          onAction={onRefresh}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={header} onRefresh={onRefresh}>
      <TrainingStateCard
        state={trainingState}
        loading={trainingStateLoading}
        onAdapt={() => setAdaptOpen(true)}
      />

      <View style={styles.summaryRow}>
        <SummaryItem icon="checkmark-done" label="Hoàn thành" value={`${progress.done}/${progress.total}`} />
        <SummaryItem icon="flame-outline" label="Mục tiêu tuần" value={`${plan.weeklyTargetCalories ?? 0} kcal`} />
      </View>

      <SectionHeader title="Lịch tuần này" icon="calendar-outline" />

      <View>
        {plan.days.map((day, index) => (
          <DayItem
            key={day.day}
            day={day}
            isLast={index === plan.days.length - 1}
            currentDay={currentDay}
            onPress={handleDayPress}
          />
        ))}
      </View>

      <AdaptPlanSheet
        visible={adaptOpen}
        onClose={() => setAdaptOpen(false)}
        onApplied={handleApplied}
      />
    </ScreenContainer>
  );
};

function SummaryItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <View style={styles.flex1}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const DayItem = memo(function DayItem({
  day,
  isLast,
  currentDay,
  onPress,
}: {
  day: WorkoutDay;
  isLast: boolean;
  currentDay: number;
  onPress: (day: number) => void;
}) {
  const isRest = day.type === 'rest';
  const isCurrent = day.day === currentDay;
  const isPast = day.day < currentDay;

  const status = day.completed
    ? { icon: 'checkmark-circle' as const, color: COLORS.success, label: 'Đã xong' }
    : day.skipped
      ? { icon: 'close-circle' as const, color: COLORS.error, label: 'Bỏ qua' }
      : isCurrent
        ? { icon: 'play-circle' as const, color: COLORS.primary, label: 'Hôm nay' }
        : isPast
          ? { icon: 'alert-circle' as const, color: COLORS.warning, label: 'Chưa tập' }
          : { icon: 'ellipse-outline' as const, color: COLORS.textMuted, label: '' };

  const adaptation =
    day.adaptation && day.adaptation.action !== 'maintain' ? ACTION_META[day.adaptation.action] : null;
  const substitutions = day.substitutions?.length ?? 0;

  return (
    <View style={styles.row}>
      <View style={styles.timeline}>
        <View
          style={[
            styles.dot,
            (isPast || isCurrent || day.completed) && { backgroundColor: status.color },
            isCurrent && styles.dotCurrent,
          ]}
        />
        {!isLast ? <View style={[styles.line, isPast && styles.linePast]} /> : null}
      </View>

      <TouchableOpacity
        style={[styles.dayCard, isCurrent && styles.dayCardCurrent]}
        onPress={() => onPress(day.day)}
        activeOpacity={0.8}
      >
        <View style={styles.dayRow}>
          <Image source={{ uri: isRest ? REST_IMAGE : WORKOUT_IMAGE }} style={styles.thumb} />
          <View style={styles.flex1}>
            <View style={styles.dayTitleRow}>
              <Text style={styles.dayTitle}>{DAY_NAMES(day.day)}</Text>
              <Text style={styles.dayDate}>{formatShortDate(day.date)}</Text>
            </View>
            {isRest ? (
              <Text style={styles.dayMeta}>Ngày nghỉ · phục hồi</Text>
            ) : (
              <>
                <Text style={styles.dayFocus} numberOfLines={1}>
                  {FOCUS_LABEL[day.focus] ?? day.focus}
                </Text>
                <Text style={styles.dayMeta} numberOfLines={1}>
                  {day.exerciseDetails?.length ?? 0} bài · {day.totalDuration} phút · {day.estimatedCalories} kcal
                </Text>
              </>
            )}
          </View>
          <Ionicons name={status.icon} size={26} color={status.color} />
        </View>

        {adaptation || substitutions ? (
          <View style={styles.badgeRow}>
            {adaptation ? <Badge label={adaptation.label} tone={adaptation.tone} icon={adaptation.icon} /> : null}
            {substitutions ? (
              <Badge label={`Đã đổi ${substitutions} bài`} tone="info" icon="swap-horizontal" />
            ) : null}
          </View>
        ) : null}

        {adaptation && day.adaptation?.reasons?.[0] ? (
          <Text style={styles.reason} numberOfLines={2}>
            {day.adaptation.reasons[0]}
          </Text>
        ) : null}

        {isCurrent && !isRest && !day.completed ? (
          <Button
            title="Bắt đầu ngay"
            icon="play"
            size="sm"
            onPress={() => onPress(day.day)}
            style={styles.startBtn}
          />
        ) : null}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },

  summaryRow: { flexDirection: 'row', gap: SPACING.sm + 4, marginTop: SPACING.sm },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 4,
    ...SHADOWS.sm,
  },
  summaryLabel: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  summaryValue: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text },

  row: { flexDirection: 'row', gap: SPACING.sm + 4 },
  timeline: { width: 14, alignItems: 'center', paddingTop: SPACING.md + 6 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.border },
  dotCurrent: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: COLORS.primarySoft },
  line: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 4 },
  linePast: { backgroundColor: COLORS.primarySoft },

  dayCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  dayCardCurrent: { borderColor: COLORS.primary },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 4 },
  thumb: { width: 52, height: 52, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceMuted },
  dayTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm },
  dayTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  dayDate: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  dayFocus: { ...TYPOGRAPHY.caption, color: COLORS.text, marginTop: 2 },
  dayMeta: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm + 2 },
  reason: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 6 },
  startBtn: { marginTop: SPACING.sm + 4 },
});
