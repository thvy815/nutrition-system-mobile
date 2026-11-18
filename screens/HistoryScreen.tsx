import React, { useRef, memo, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, RefreshControl } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  useNavigation,
  useFocusEffect,
  type CompositeNavigationProp,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ScreenContainer,
  ScreenHeader,
  IconButton,
  Segmented,
  Badge,
  LoadingState,
  EmptyState,
} from '../components';
import {
  BORDER_RADIUS,
  BOTTOM_SPACER,
  COLORS,
  METRIC_COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { getMealHistory, getWorkoutHistory } from '../services/history.service';
import type { MealHistoryLog, WorkoutHistorySession } from '../types/history';
import type { RootStackParamList, RootTabParamList } from '../navigation/AppNavigator';

type HistoryMode = 'nutrition' | 'workout';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'History'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MODE_OPTIONS: { value: HistoryMode; label: string; icon: 'nutrition' | 'barbell' }[] = [
  { value: 'nutrition', label: 'Dinh dưỡng', icon: 'nutrition' },
  { value: 'workout', label: 'Bài tập', icon: 'barbell' },
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const mealKeyExtractor = (item: MealHistoryLog) => item._id;
const workoutKeyExtractor = (item: WorkoutHistorySession) => item._id;

export function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [mode, setMode] = useState<HistoryMode>('nutrition');
  const [logs, setLogs] = useState<MealHistoryLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [workoutSessions, setWorkoutSessions] = useState<WorkoutHistorySession[]>([]);
  const [workoutPage, setWorkoutPage] = useState(1);
  const [workoutTotalPages, setWorkoutTotalPages] = useState(1);
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  const [refreshingWorkout, setRefreshingWorkout] = useState(false);
  const [loadingMoreWorkout, setLoadingMoreWorkout] = useState(false);

  const fetchMealHistory = useCallback(async (nextPage = 1, isRefresh = false) => {
    try {
      if (nextPage === 1 && !isRefresh) setLoading(true);
      if (nextPage > 1) setLoadingMore(true);

      const res = await getMealHistory({
        page: nextPage,
        limit: 20,
      });

      const newLogs = res.data.logs;
      const pagination = res.data.pagination;

      setLogs((prev) => (nextPage === 1 ? newLogs : [...prev, ...newLogs]));
      setPage(pagination.page);
      setTotalPages(pagination.totalPages);
    } catch (err) {
      console.error('[HistoryScreen] fetch history error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchMealHistory(1);
  }, [fetchMealHistory]);

  const fetchWorkoutHistory = useCallback(async (nextPage = 1, isRefresh = false) => {
    try {
      if (nextPage === 1 && !isRefresh) setLoadingWorkout(true);
      if (nextPage > 1) setLoadingMoreWorkout(true);

      const res = await getWorkoutHistory({
        page: nextPage,
        limit: 20,
      });

      const newSessions = res.data.sessions;
      const pagination = res.data.pagination;

      setWorkoutSessions((prev) => (nextPage === 1 ? newSessions : [...prev, ...newSessions]));

      setWorkoutPage(pagination.page);
      setWorkoutTotalPages(pagination.totalPages);
    } catch (err) {
      console.error('[HistoryScreen] fetch workout history error:', err);
    } finally {
      setLoadingWorkout(false);
      setRefreshingWorkout(false);
      setLoadingMoreWorkout(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (mode === 'nutrition') {
        fetchMealHistory(1, true);
      }

      if (mode === 'workout') {
        fetchWorkoutHistory(1, true);
      }
    }, [mode, fetchMealHistory, fetchWorkoutHistory]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMealHistory(1, true);
  }, [fetchMealHistory]);

  // Ref chặn gọi trùng khi onEndReached bắn liên tiếp trước khi state kịp cập nhật.
  const loadingMoreRef = useRef(false);
  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || loadingMore || page >= totalPages) return;
    loadingMoreRef.current = true;
    try {
      await fetchMealHistory(page + 1);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [loadingMore, page, totalPages, fetchMealHistory]);

  const handleRefreshWorkout = useCallback(() => {
    setRefreshingWorkout(true);
    fetchWorkoutHistory(1, true);
  }, [fetchWorkoutHistory]);

  const loadingMoreWorkoutRef = useRef(false);
  const handleLoadMoreWorkout = useCallback(async () => {
    if (loadingMoreWorkoutRef.current || loadingMoreWorkout || workoutPage >= workoutTotalPages) return;
    loadingMoreWorkoutRef.current = true;
    try {
      await fetchWorkoutHistory(workoutPage + 1);
    } finally {
      loadingMoreWorkoutRef.current = false;
    }
  }, [loadingMoreWorkout, workoutPage, workoutTotalPages, fetchWorkoutHistory]);

  const handleModeChange = useCallback(
    (next: HistoryMode) => {
      setMode(next);
      if (next === 'nutrition') {
        fetchMealHistory(1, true);
      } else {
        fetchWorkoutHistory(1, true);
      }
    },
    [fetchMealHistory, fetchWorkoutHistory],
  );

  const renderMealItem = useCallback(
    ({ item }: { item: MealHistoryLog }) => <MealHistoryRow item={item} />,
    [],
  );

  const renderWorkoutItem = useCallback(
    ({ item }: { item: WorkoutHistorySession }) => <WorkoutHistoryRow item={item} />,
    [],
  );

  const renderNutritionContent = () => {
    if (loading) {
      return <LoadingState message="Đang tải lịch sử dinh dưỡng..." style={styles.fill} />;
    }

    return (
      <FlatList
        data={logs}
        keyExtractor={mealKeyExtractor}
        renderItem={renderMealItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, logs.length === 0 && styles.emptyList]}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            icon="fast-food-outline"
            title="Chưa có lịch sử dinh dưỡng"
            message="Các món ăn đã phân tích sẽ hiển thị tại đây."
            style={styles.fill}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
      />
    );
  };

  const renderWorkoutContent = () => {
    if (loadingWorkout) {
      return <LoadingState message="Đang tải lịch sử bài tập..." style={styles.fill} />;
    }

    return (
      <FlatList
        data={workoutSessions}
        keyExtractor={workoutKeyExtractor}
        renderItem={renderWorkoutItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshingWorkout}
            onRefresh={handleRefreshWorkout}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMoreWorkout}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          workoutSessions.length === 0 && styles.emptyList,
        ]}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            icon="barbell-outline"
            title="Chưa có lịch sử bài tập"
            message="Các bài tập đã hoàn thành sẽ hiển thị tại đây."
            style={styles.fill}
          />
        }
        ListFooterComponent={
          loadingMoreWorkout ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <ScreenHeader
          title="Lịch sử"
          subtitle="Theo dõi dinh dưỡng và bài tập của bạn"
          right={
            <IconButton
              icon="person-circle-outline"
              size={24}
              color={COLORS.primary}
              onPress={() => navigation.navigate('UserProfile')}
              accessibilityLabel="Hồ sơ cá nhân"
            />
          }
        />
      }
    >
      <Segmented
        options={MODE_OPTIONS}
        value={mode}
        onChange={handleModeChange}
        style={styles.modeToggle}
      />

      <View style={styles.fill}>
        {mode === 'nutrition' ? renderNutritionContent() : renderWorkoutContent()}
      </View>
    </ScreenContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

const MealHistoryRow = memo(function MealHistoryRow({ item }: { item: MealHistoryLog }) {
  const nutrition = item.recipe?.nutrition;

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {item.recipe?.imageUrl ? (
          <Image source={{ uri: item.recipe.imageUrl }} style={styles.foodImage} />
        ) : (
          <View style={[styles.foodImage, styles.imagePlaceholder]}>
            <Ionicons name="restaurant" size={26} color={COLORS.textMuted} />
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.recipe?.name || 'Món ăn chưa có tên'}
          </Text>
          <Text style={styles.dateText} numberOfLines={1}>
            Ăn lúc: {formatDate(item.eatenAt)}
          </Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <Metric
          value={`${nutrition?.calories ?? 0}`}
          label="kcal"
          color={METRIC_COLORS.calories}
        />
        <Metric value={`${nutrition?.protein ?? 0}g`} label="Đạm" color={METRIC_COLORS.protein} />
        <Metric value={`${nutrition?.carbs ?? 0}g`} label="Tinh bột" color={METRIC_COLORS.carbs} />
        <Metric value={`${nutrition?.fat ?? 0}g`} label="Chất béo" color={METRIC_COLORS.fat} />
      </View>
    </View>
  );
});

const WorkoutHistoryRow = memo(function WorkoutHistoryRow({
  item,
}: {
  item: WorkoutHistorySession;
}) {
  const performance = item.performanceScore || 0;
  const fatigue = item.fatigueImpact || 0;

  return (
    <View style={styles.card}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutIcon}>
          <Ionicons name="barbell" size={22} color={COLORS.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.exerciseName || 'Bài tập'}
          </Text>
          <Text style={styles.dateText} numberOfLines={1}>
            Ngày {item.day} • {formatDate(item.endTime)}
          </Text>
        </View>
        <Badge label={`${item.actualCalories || 0} kcal`} tone="warning" icon="flame" />
      </View>

      <View style={styles.metricRow}>
        <Metric value={`${item.durationMinutes || 0}`} label="phút" />
        <Metric value={`${item.completedSets || 0}/${item.targetSets || 0}`} label="Hiệp" />
        <Metric
          value={`${performance}/10`}
          label="Hiệu suất"
          color={performance >= 7 ? COLORS.success : undefined}
        />
        <Metric
          value={`${fatigue}/10`}
          label="Mệt mỏi"
          color={fatigue >= 7 ? COLORS.error : undefined}
        />
      </View>
    </View>
  );
});

function Metric({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, color ? { color } : null]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  modeToggle: {
    marginBottom: SPACING.md,
  },
  listContent: {
    paddingBottom: BOTTOM_SPACER,
  },
  emptyList: {
    flexGrow: 1,
  },
  footerLoading: {
    paddingVertical: SPACING.md,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    gap: SPACING.sm + 4,
    ...SHADOWS.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  foodImage: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
    flexShrink: 1,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xxs,
  },

  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },

  metricRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm - 1,
    paddingHorizontal: SPACING.xs,
  },
  metricValue: {
    ...TYPOGRAPHY.captionStrong,
    color: COLORS.text,
  },
  metricLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xxs,
  },
});
