import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS } from '../constants/theme';
import { getMealHistory, getWorkoutHistory } from '../services/history.service';
import type { MealHistoryLog, WorkoutHistorySession } from '../types/history';
import type { RootTabParamList } from '../navigation/AppNavigator';

type HistoryMode = 'nutrition' | 'workout';

type NavigationProp = BottomTabNavigationProp<RootTabParamList>;

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

      setLogs(prev => (nextPage === 1 ? newLogs : [...prev, ...newLogs]));
      setPage(pagination.page);
      setTotalPages(pagination.totalPages);
    } catch (err) {
      console.log('[HistoryScreen] fetch history error:', err);
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

        setWorkoutSessions(prev =>
        nextPage === 1 ? newSessions : [...prev, ...newSessions],
        );

        setWorkoutPage(pagination.page);
        setWorkoutTotalPages(pagination.totalPages);
    } catch (err) {
        console.log('[HistoryScreen] fetch workout history error:', err);
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
    }, [mode, fetchMealHistory, fetchWorkoutHistory])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMealHistory(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchMealHistory(page + 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderMealItem = ({ item }: { item: MealHistoryLog }) => {
    const nutrition = item.recipe?.nutrition;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {item.recipe?.imageUrl ? (
            <Image source={{ uri: item.recipe.imageUrl }} style={styles.foodImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="restaurant" size={28} color={COLORS.textMuted} />
            </View>
          )}

          <View style={styles.cardContent}>
            <Text style={styles.foodName} numberOfLines={1}>
              {item.recipe?.name || 'Món ăn chưa có tên'}
            </Text>

            <Text style={styles.dateText}>
              Ăn lúc: {formatDate(item.eatenAt)}
            </Text>

            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, styles.caloriesValue]}>
                  {nutrition?.calories ?? 0}
                </Text>
                <Text style={styles.nutritionLabel}>kcal</Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {nutrition?.protein ?? 0}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {nutrition?.carbs ?? 0}g
                </Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {nutrition?.fat ?? 0}g
                </Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderNutritionContent = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử dinh dưỡng...</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={logs}
        keyExtractor={item => item._id}
        renderItem={renderMealItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={logs.length === 0 && styles.emptyList}
        ListEmptyComponent={
          <View style={styles.centerBox}>
            <Ionicons name="fast-food-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có lịch sử dinh dưỡng</Text>
            <Text style={styles.emptyDesc}>
              Các món ăn đã phân tích sẽ hiển thị tại đây.
            </Text>
          </View>
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

  const renderWorkoutItem = ({ item }: { item: WorkoutHistorySession }) => {
    return (
        <View style={styles.card}>
        <View style={styles.workoutHeader}>
            <View>
            <Text style={styles.foodName} numberOfLines={1}>
                {item.exerciseName || 'Bài tập'}
            </Text>
            <Text style={styles.dateText}>
                Ngày {item.day} • {formatDate(item.endTime)}
            </Text>
            </View>

            <View style={styles.kcalBadge}>
            <Text style={styles.kcalText}>{item.actualCalories || 0} kcal</Text>
            </View>
        </View>

        <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.durationMinutes || 0}</Text>
            <Text style={styles.nutritionLabel}>phút</Text>
            </View>

            <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
                {item.completedSets || 0}/{item.targetSets || 0}
            </Text>
            <Text style={styles.nutritionLabel}>Sets</Text>
            </View>

            <View style={styles.nutritionItem}>
            <Text
              style={[
                styles.nutritionValue,
                (item.performanceScore || 0) >= 7 && styles.goodScore,
              ]}
            >
              {item.performanceScore || 0}/10
            </Text>
            <Text style={styles.nutritionLabel}>Hiệu suất</Text>
            </View>

            <View style={styles.nutritionItem}>
            <Text
              style={[
                styles.nutritionValue,
                (item.fatigueImpact || 0) >= 7 && styles.badScore,
              ]}
            >
              {item.fatigueImpact || 0}/10
            </Text>
            <Text style={styles.nutritionLabel}>Mệt mỏi</Text>
            </View>
        </View>
        </View>
    );
    };

  const renderWorkoutContent = () => {
    if (loadingWorkout) {
        return (
        <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải lịch sử bài tập...</Text>
        </View>
        );
    }

    return (
        <FlatList
        data={workoutSessions}
        keyExtractor={item => item._id}
        renderItem={renderWorkoutItem}
        refreshControl={
            <RefreshControl
            refreshing={refreshingWorkout}
            onRefresh={() => {
                setRefreshingWorkout(true);
                fetchWorkoutHistory(1, true);
            }}
            />
        }
        onEndReached={() => {
            if (!loadingMoreWorkout && workoutPage < workoutTotalPages) {
            fetchWorkoutHistory(workoutPage + 1);
            }
        }}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={workoutSessions.length === 0 && styles.emptyList}
        ListEmptyComponent={
            <View style={styles.centerBox}>
            <Ionicons name="barbell-outline" size={52} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có lịch sử bài tập</Text>
            <Text style={styles.emptyDesc}>
                Các bài tập đã hoàn thành sẽ hiển thị tại đây.
            </Text>
            </View>
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
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Lịch sử</Text>
          <Text style={styles.subtitle}>
            Theo dõi dinh dưỡng và bài tập của bạn
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('UserProfile')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-circle-outline" size={30} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'nutrition' && styles.modeButtonActive,
          ]}
          onPress={() => {
            setMode('nutrition');
            fetchMealHistory(1, true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="nutrition"
            size={22}
            color={mode === 'nutrition' ? '#FFF' : COLORS.textMuted}
          />
          <Text
            style={[
              styles.modeButtonText,
              mode === 'nutrition' && styles.modeButtonTextActive,
            ]}
          >
            Dinh dưỡng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'workout' && styles.modeButtonActive,
          ]}
          onPress={() => {
            setMode('workout');
            fetchWorkoutHistory(1, true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="barbell"
            size={22}
            color={mode === 'workout' ? '#FFF' : COLORS.textMuted}
          />
          <Text
            style={[
              styles.modeButtonText,
              mode === 'workout' && styles.modeButtonTextActive,
            ]}
          >
            Bài tập
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {mode === 'nutrition' ? renderNutritionContent() : renderWorkoutContent()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  caloriesValue: {
    color: COLORS.primary,
  },

  goodScore: {
    color: COLORS.primary, // xanh
  },

  badScore: {
    color: COLORS.error, // đỏ
  },

  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
    },

    kcalBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    },

    kcalText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    },

    workoutDesc: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textMuted,
    },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 6,
    marginBottom: 18,
  },
  modeButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  foodImage: {
    width: 74,
    height: 74,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
  imagePlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  nutritionItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  nutritionLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyDesc: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoading: {
    paddingVertical: 16,
  },
});