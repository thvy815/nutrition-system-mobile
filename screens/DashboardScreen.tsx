import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import {
  Badge,
  Card,
  IconButton,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
} from '../components';
import { ACTION_META, STATUS_META } from '../components/workout';
import { BORDER_RADIUS, COLORS, METRIC_COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { workoutService } from '../services';
import { googleHealthService } from '../services/googleHealth.service';
import { getDailyMenuByDate } from '../services/dailyMenu';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../contexts/WorkoutContext';
import type { WorkoutDay } from '../types/workout';
import type { DailyMenu, RecipeItem } from '../types/dailyMenu';
import type { GoogleConnectionStatus, HealthDailyRow } from '../types/health';

const MEAL_TIMES: { key: RecipeItem['servingTime']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'breakfast', label: 'Bữa sáng', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Bữa trưa', icon: 'partly-sunny-outline' },
  { key: 'dinner', label: 'Bữa tối', icon: 'moon-outline' },
  { key: 'snack', label: 'Bữa phụ', icon: 'cafe-outline' },
];

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

function todayVN() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function greeting() {
  const h = Number(
    new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' })
  );
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

const fmt = (n: number | null | undefined) =>
  typeof n === 'number' ? Math.round(n).toLocaleString('vi-VN') : '—';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useAuth();
  const { trainingState } = useWorkout();

  const [loading, setLoading] = useState(true);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null);
  const [todayMeal, setTodayMeal] = useState<DailyMenu | null>(null);
  const [health, setHealth] = useState<{ status: GoogleConnectionStatus; today: HealthDailyRow | null } | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    const today = todayVN();
    // Mỗi khối tải độc lập: một API lỗi không làm trống cả màn hình.
    // /today có thể lỗi tạm thời ở lần gọi đầu ngày (backend đang tự điều chỉnh plan) -> thử lại 1 lần.
    const getToday = () =>
      workoutService.getTodayWorkout().catch(async () => {
        await new Promise((r) => setTimeout(r, 800));
        return workoutService.getTodayWorkout();
      });
    const [workout, meal, status, summary] = await Promise.allSettled([
      getToday(),
      getDailyMenuByDate(today, token),
      googleHealthService.getStatus(),
      googleHealthService.getSummary(1),
    ]);
    setTodayWorkout(workout.status === 'fulfilled' ? workout.value : null);
    setTodayMeal(meal.status === 'fulfilled' ? meal.value : null);
    if (status.status === 'fulfilled') {
      const row =
        summary.status === 'fulfilled'
          ? summary.value.daily?.find((d) => d.date === today) ?? null
          : null;
      setHealth({ status: status.value, today: row });
    } else {
      setHealth(null);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadDashboard();
      setLoading(false);
    })();
  }, [loadDashboard]);

  const mealGroups = useMemo(() => {
    const recipes = todayMeal?.recipes ?? [];
    return MEAL_TIMES.map((t) => ({ ...t, items: recipes.filter((r) => r.servingTime === t.key) })).filter(
      (g) => g.items.length
    );
  }, [todayMeal]);

  // Tên gọi = từ cuối của họ tên (VD: "Nguyễn Thúy Vy" -> "Vy").
  const firstName = user?.name?.trim().split(/\s+/).filter(Boolean).pop() ?? '';

  const header = (
    <ScreenHeader
      title={`${greeting()}${firstName ? `, ${firstName}` : ''}!`}
      subtitle={new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      })}
      right={
        <IconButton
          icon="person"
          onPress={() => navigation.navigate('UserProfile')}
          accessibilityLabel="Hồ sơ"
        />
      }
    />
  );

  if (loading) {
    return (
      <ScreenContainer header={header} scrollable={false}>
        <LoadingState message="Đang tải tổng quan..." />
      </ScreenContainer>
    );
  }

  const n = todayMeal?.totalNutrition;
  const target = todayMeal?.targetNutrition?.calories;
  const burn = todayWorkout?.type === 'workout' ? todayWorkout.estimatedCalories : 0;
  const status = trainingState ? STATUS_META[trainingState.status] : null;
  const adaptation =
    todayWorkout?.adaptation && todayWorkout.adaptation.action !== 'maintain'
      ? ACTION_META[todayWorkout.adaptation.action]
      : null;

  return (
    <ScreenContainer header={header} onRefresh={loadDashboard}>
      {/* ------------- Summary ------------- */}
      <Card style={styles.summary}>
        <View style={styles.summaryTop}>
          <View style={styles.flex1}>
            <Text style={styles.summaryLabel}>Năng lượng từ thực đơn</Text>
            <Text style={styles.summaryValue}>
              {fmt(n?.calories ?? 0)}
              <Text style={styles.summaryUnit}>{target ? ` / ${fmt(target)} kcal` : ' kcal'}</Text>
            </Text>
          </View>
          <View style={styles.burnBox}>
            <Ionicons name="flame" size={18} color={METRIC_COLORS.calories} />
            <Text style={styles.burnValue}>{fmt(burn)}</Text>
            <Text style={styles.burnLabel}>kcal đốt dự kiến</Text>
          </View>
        </View>
        <View style={styles.macroRow}>
          <Macro label="Đạm" value={n?.protein} color={METRIC_COLORS.protein} />
          <Macro label="Tinh bột" value={n?.carbs} color={METRIC_COLORS.carbs} />
          <Macro label="Chất béo" value={n?.fat} color={METRIC_COLORS.fat} />
        </View>
      </Card>

      {/* ------------- Google Health ------------- */}
      <SectionHeader
        title="Vận động hôm nay"
        icon="fitness-outline"
        actionLabel="Chi tiết"
        onAction={() => navigation.navigate('Health')}
      />
      <HealthCard health={health} onPress={() => navigation.navigate('Health')} />

      {/* ------------- Workout ------------- */}
      <SectionHeader
        title="Bài tập hôm nay"
        icon="barbell-outline"
        actionLabel="Xem kế hoạch"
        onAction={() => navigation.navigate('WorkoutPlan')}
      />
      <Card>
        {status && trainingState ? (
          <View style={styles.readinessRow}>
            <Badge label={`Readiness ${trainingState.readinessScore.toFixed(1)}/10`} tone={status.tone} icon={status.icon} />
            <Badge label={status.label} tone="neutral" />
            {adaptation ? <Badge label={adaptation.label} tone={adaptation.tone} icon={adaptation.icon} /> : null}
          </View>
        ) : null}

        {!todayWorkout ? (
          <Text style={styles.muted}>Chưa có kế hoạch tập cho hôm nay.</Text>
        ) : todayWorkout.type === 'rest' ? (
          <View style={styles.restRow}>
            <Ionicons name="bed-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.muted}>Hôm nay là ngày nghỉ phục hồi.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.focus} numberOfLines={1}>
              {FOCUS_LABEL[todayWorkout.focus] ?? todayWorkout.focus}
            </Text>
            <Text style={styles.muted}>
              {todayWorkout.exerciseDetails?.length ?? 0} bài · {todayWorkout.totalDuration} phút ·{' '}
              {todayWorkout.estimatedCalories} kcal
              {todayWorkout.completed ? ' · Đã hoàn thành ✓' : ''}
            </Text>
            <View style={styles.list}>
              {(todayWorkout.exerciseDetails ?? []).slice(0, 4).map((ex) => (
                <View key={ex.exerciseId} style={styles.listRow}>
                  <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.listName} numberOfLines={1}>
                    {ex.name}
                  </Text>
                  <Text style={styles.listMeta}>
                    {ex.sets}×{ex.reps}
                  </Text>
                </View>
              ))}
              {(todayWorkout.exerciseDetails?.length ?? 0) > 4 ? (
                <Text style={styles.more}>+{todayWorkout.exerciseDetails.length - 4} bài khác</Text>
              ) : null}
            </View>
          </>
        )}
      </Card>

      {/* ------------- Meals ------------- */}
      <SectionHeader
        title="Thực đơn hôm nay"
        icon="restaurant-outline"
        actionLabel="Xem menu"
        onAction={() => navigation.navigate('MealRecommendation')}
      />
      <Card>
        {mealGroups.length === 0 ? (
          <Text style={styles.muted}>Chưa có thực đơn hôm nay. Mở tab Bữa ăn để nhận gợi ý.</Text>
        ) : (
          mealGroups.map((g, gi) => (
            <View key={g.key} style={[styles.mealGroup, gi > 0 && styles.divider]}>
              <View style={styles.mealHead}>
                <Ionicons name={g.icon} size={16} color={METRIC_COLORS.carbs} />
                <Text style={styles.mealTitle}>{g.label}</Text>
              </View>
              {g.items.map((item) => (
                <View key={item._id} style={styles.listRow}>
                  <Ionicons
                    name={item.isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={item.isChecked ? COLORS.success : COLORS.textMuted}
                  />
                  <Text style={styles.listName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.listMeta}>{fmt(item.nutrition?.calories ?? 0)} kcal</Text>
                </View>
              ))}
            </View>
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}

function Macro({ label, value, color }: { label: string; value?: number; color: string }) {
  return (
    <View style={styles.macro}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{fmt(value ?? 0)}g</Text>
    </View>
  );
}

const HealthCard = memo(function HealthCard({
  health,
  onPress,
}: {
  health: { status: GoogleConnectionStatus; today: HealthDailyRow | null } | null;
  onPress: () => void;
}) {
  if (!health?.status.connected) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <Card style={styles.connectCta}>
          <View style={styles.ctaIcon}>
            <Ionicons name="logo-google" size={20} color={COLORS.primaryDark} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.ctaTitle}>Kết nối Google Health</Text>
            <Text style={styles.muted} numberOfLines={2}>
              Đồng bộ bước chân, phút vận động, giấc ngủ để kế hoạch tập tự điều chỉnh.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Card>
      </TouchableOpacity>
    );
  }

  const t = health.today;
  const sleep = t?.sleepMinutes
    ? `${Math.floor(t.sleepMinutes / 60)}g${String(Math.round(t.sleepMinutes % 60)).padStart(2, '0')}`
    : '—';
  const items = [
    { icon: 'footsteps' as const, value: fmt(t?.steps), label: 'bước', color: METRIC_COLORS.steps },
    { icon: 'pulse' as const, value: fmt(t?.activeMinutes), label: 'phút', color: METRIC_COLORS.activeMinutes },
    { icon: 'flame' as const, value: fmt(t?.caloriesBurned), label: 'kcal', color: METRIC_COLORS.calories },
    { icon: 'moon' as const, value: sleep, label: 'ngủ', color: METRIC_COLORS.sleep },
  ];

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.healthCard}>
        {items.map((it) => (
          <View key={it.label} style={styles.healthItem}>
            <Ionicons name={it.icon} size={18} color={it.color} />
            <Text style={styles.healthValue} numberOfLines={1} adjustsFontSizeToFit>
              {it.value}
            </Text>
            <Text style={styles.healthLabel}>{it.label}</Text>
          </View>
        ))}
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  muted: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },

  summary: { backgroundColor: COLORS.primary },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  summaryLabel: { ...TYPOGRAPHY.caption, color: COLORS.primarySoft },
  summaryValue: { ...TYPOGRAPHY.display, color: COLORS.textInverse, marginTop: 2 },
  summaryUnit: { ...TYPOGRAPHY.caption, color: COLORS.primarySoft },
  burnBox: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm + 4,
    minWidth: 92,
  },
  burnValue: { ...TYPOGRAPHY.h3, color: COLORS.text },
  burnLabel: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, textAlign: 'center' },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.primarySoft,
    gap: SPACING.sm,
  },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  macroLabel: { ...TYPOGRAPHY.caption, color: COLORS.primarySoft },
  macroValue: { ...TYPOGRAPHY.captionStrong, color: COLORS.textInverse },

  connectCta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 4 },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text },
  healthCard: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.xs },
  healthItem: { flex: 1, alignItems: 'center', gap: 2, minWidth: 0 },
  healthValue: { ...TYPOGRAPHY.h3, color: COLORS.text },
  healthLabel: { ...TYPOGRAPHY.small, color: COLORS.textMuted },

  readinessRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm + 4 },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  focus: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 2 },
  list: { marginTop: SPACING.sm + 4, gap: SPACING.sm },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listName: { ...TYPOGRAPHY.body, color: COLORS.text, flex: 1 },
  listMeta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  more: { ...TYPOGRAPHY.caption, color: COLORS.primaryDark },

  mealGroup: { gap: SPACING.sm, paddingVertical: SPACING.xs },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, paddingTop: SPACING.sm + 4, marginTop: SPACING.sm },
  mealHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mealTitle: { ...TYPOGRAPHY.captionStrong, color: COLORS.textSecondary },
});
