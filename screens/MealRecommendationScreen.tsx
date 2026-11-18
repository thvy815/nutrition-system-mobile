import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import {
  ScreenContainer,
  MealCard,
  RecipeSearchSheet,
  ScreenHeader,
  SectionHeader,
  Button,
  LoadingState,
  EmptyState,
} from '../components';
import {
  BORDER_RADIUS,
  COLORS,
  METRIC_COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import {
  getDailyMenuByDate,
  getDailyMenuRecommendation,
  transformDailyMenuToMeals,
  getDailyMenusByRange,
  updateRecipeInMenu,
  deleteRecipeFromMenu,
  addRecipeToMenu,
} from '../services/dailyMenu';
import type { DailyMenuResponse } from '../types/dailyMenu';
import type { Meal } from '../types';

const MEAL_LABELS = {
  breakfast: 'Bữa sáng',
  lunch: 'Bữa trưa',
  dinner: 'Bữa tối',
  snack: 'Bữa phụ',
  other: 'Khác',
};

const MEAL_ICONS = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
  other: 'ellipsis-horizontal-circle-outline',
} as const;

type WeekDay = {
  dateStr: string;
  day: number;
  label: string;
  calories: number;
  hasData: boolean;
};

function groupMealsByServingTime(meals: Meal[]) {
  const groups = {
    breakfast: [] as Meal[],
    lunch: [] as Meal[],
    dinner: [] as Meal[],
    snack: [] as Meal[],
    other: [] as Meal[],
  };

  meals.forEach((meal) => {
    const key = (meal.servingTime || 'other') as keyof typeof groups;
    (groups[key] ?? groups.other).push(meal);
  });

  return groups;
}

// ===== helpers =====
const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

// Ngày theo giờ máy (VN), tránh lệch ngày do toISOString() dùng UTC trước 7h sáng.
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function MealRecommendationScreen() {
  const { token } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(new Date()));
  const [menu, setMenu] = useState<DailyMenuResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [weekData, setWeekData] = useState<WeekDay[]>([]);

  const groupedMeals = useMemo(() => {
    const meals: Meal[] = menu ? transformDailyMenuToMeals(menu) : [];
    return groupMealsByServingTime(meals);
  }, [menu]);

  // ===== fetch week =====
  const fetchWeek = useCallback(async () => {
    if (!token) return;

    const start = getMonday(new Date(`${selectedDate}T00:00:00`));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    try {
      const data = await getDailyMenusByRange(toDateStr(start), toDateStr(end), token);

      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);

        const dateStr = toDateStr(d);

        const found = data.find((m: any) => m.date?.slice(0, 10) === dateStr);

        return {
          dateStr,
          day: d.getDate(),
          label: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i],
          calories: found?.totalNutrition?.calories || 0,
          hasData: !!found,
        };
      });

      setWeekData(days);
    } catch (e) {
      console.error(e);
    }
  }, [token, selectedDate]);

  // ===== fetch day =====
  const fetchDay = useCallback(
    async (date: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await getDailyMenuByDate(date, token);
        setMenu(data);
      } catch {
        setMenu(null);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  useEffect(() => {
    fetchDay(selectedDate);
  }, [selectedDate, fetchDay]);

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchDay(selectedDate), fetchWeek()]);
  }, [selectedDate, fetchDay, fetchWeek]);

  const handleRecommend = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getDailyMenuRecommendation(selectedDate, token);
      setMenu(data);
    } catch {
      setMenu(null);
    } finally {
      setLoading(false);
    }
  }, [token, selectedDate]);

  const handleToggleCheck = useCallback(
    async (meal: Meal) => {
      if (!token || !menu) return;

      try {
        const updated = await updateRecipeInMenu(
          {
            date: selectedDate,
            dailyMenuId: meal.dailyMenuId,
            recipeItemId: meal.id,
            checked: !meal.isChecked,
          },
          token,
        );

        setMenu(updated); // cập nhật lại UI
      } catch (err) {
        console.error('toggle check error', err);
      }
    },
    [token, menu, selectedDate],
  );

  const handleDeleteMeal = useCallback(
    async (meal: Meal) => {
      if (!token || !menu) return;
      try {
        const updated = await deleteRecipeFromMenu(
          {
            dailyMenuId: meal.dailyMenuId,
            recipeItemId: meal.id,
          },
          token,
        );

        setMenu(updated);
      } catch (err) {
        console.error('delete error', err);
      }
    },
    [token, menu],
  );

  const handleAddRecipeToMenu = useCallback(
    async (params: any) => {
      if (!token) return;

      try {
        // 1. Gọi API qua service
        await addRecipeToMenu(params, token);

        // 2. Refresh lại dữ liệu màn hình chính để thấy món mới
        await fetchDay(selectedDate);

        // 3. Đóng Modal
        setShowSearch(false);
      } catch (error) {
        console.error('Lỗi khi thêm món:', error);
      }
    },
    [token, fetchDay, selectedDate],
  );

  const openSearch = useCallback(() => setShowSearch(true), []);
  const closeSearch = useCallback(() => setShowSearch(false), []);
  const handleSearchSuccess = useCallback(() => {
    fetchDay(selectedDate);
  }, [fetchDay, selectedDate]);

  const isEmpty = Object.values(groupedMeals).every((items) => items.length === 0);

  const dateLabel = new Date(selectedDate).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  return (
    <ScreenContainer
      header={<ScreenHeader title="Thực đơn" subtitle={dateLabel} />}
      onRefresh={onRefresh}
    >
      {/* WEEK STRIP */}
      <View style={styles.weekRow}>
        {weekData.map((d) => (
          <DayPill
            key={d.dateStr}
            item={d}
            selected={d.dateStr === selectedDate}
            onPress={setSelectedDate}
          />
        ))}
      </View>

      {/* NUTRITION */}
      {menu && (
        <View style={styles.nutritionCard}>
          <View style={styles.kcalRow}>
            <View style={styles.kcalIcon}>
              <Ionicons name="flame" size={20} color={METRIC_COLORS.calories} />
            </View>
            <View style={styles.flexShrink}>
              <Text style={styles.nutritionTitle} numberOfLines={1}>
                Dinh dưỡng trong ngày
              </Text>
              <Text style={styles.kcal} numberOfLines={1}>
                {Math.round(menu.totalNutrition?.calories || 0)}
                <Text style={styles.kcalUnit}> kcal</Text>
              </Text>
            </View>
          </View>

          <View style={styles.macros}>
            <NutritionItem
              label="Đạm"
              value={menu.totalNutrition?.protein || 0}
              color={METRIC_COLORS.protein}
            />
            <NutritionItem
              label="Tinh bột"
              value={menu.totalNutrition?.carbs || 0}
              color={METRIC_COLORS.carbs}
            />
            <NutritionItem
              label="Chất béo"
              value={menu.totalNutrition?.fat || 0}
              color={METRIC_COLORS.fat}
            />
          </View>
        </View>
      )}

      {/* ── SEARCH BAR CỐ ĐỊNH ── */}
      <TouchableOpacity
        style={styles.searchBarStatic}
        onPress={openSearch}
        activeOpacity={0.7}
        accessibilityRole="search"
      >
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.searchBarPlaceholder} numberOfLines={1}>
          Tìm và thêm món ăn...
        </Text>
        <Ionicons name="add-circle" size={22} color={COLORS.primary} />
      </TouchableOpacity>

      {loading ? (
        <LoadingState message="Đang tải thực đơn..." />
      ) : isEmpty ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="restaurant-outline"
            title="Chưa có thực đơn cho ngày này"
            message="Tìm và thêm món ở ô phía trên, hoặc để hệ thống gợi ý thực đơn cho bạn."
          />
          <Button title="Lấy gợi ý thực đơn" icon="bulb-outline" onPress={handleRecommend} />
        </View>
      ) : (
        Object.entries(groupedMeals).map(([key, items]) => {
          if (items.length === 0) return null;
          const k = key as keyof typeof MEAL_LABELS;
          return (
            <View key={key}>
              <SectionHeader title={`${MEAL_LABELS[k]} (${items.length})`} icon={MEAL_ICONS[k]} />
              {items.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onToggleCheck={handleToggleCheck}
                  onDelete={handleDeleteMeal}
                />
              ))}
            </View>
          );
        })
      )}

      {/* Modal search */}
      <RecipeSearchSheet
        visible={showSearch}
        date={selectedDate}
        token={token!}
        dailyMenuId={menu?._id} // lấy từ menu hiện tại nếu đã có
        onClose={closeSearch}
        onSuccess={handleSearchSuccess}
        onAddRecipe={handleAddRecipeToMenu}
      />
    </ScreenContainer>
  );
}

const DayPill = memo(function DayPill({
  item,
  selected,
  onPress,
}: {
  item: WeekDay;
  selected: boolean;
  onPress: (dateStr: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.dayItem, selected && styles.dayItemActive]}
      onPress={() => onPress(item.dateStr)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.dayLabel, selected && styles.dayTextActive]} numberOfLines={1}>
        {item.label}
      </Text>
      <Text style={[styles.dayNumber, selected && styles.dayTextActive]} numberOfLines={1}>
        {item.day}
      </Text>
      <View
        style={[
          styles.dot,
          !item.hasData && styles.dotHidden,
          selected && styles.dotActive,
        ]}
      />
    </TouchableOpacity>
  );
});

function NutritionItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.nutritionItem}>
      <View style={[styles.nutritionDot, { backgroundColor: color }]} />
      <View style={styles.flexShrink}>
        <Text style={styles.nutritionValue} numberOfLines={1}>
          {value.toFixed(1)}g
        </Text>
        <Text style={styles.nutritionLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexShrink: { flexShrink: 1, minWidth: 0 },

  weekRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  dayItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  dayItemActive: {
    backgroundColor: COLORS.primary,
  },
  dayLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  dayNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.xxs,
  },
  dayTextActive: {
    color: COLORS.textInverse,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.xs,
  },
  dotHidden: {
    opacity: 0,
  },
  dotActive: {
    backgroundColor: COLORS.textInverse,
  },

  nutritionCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.md,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  kcalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
  },
  nutritionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  kcal: {
    ...TYPOGRAPHY.display,
    color: COLORS.text,
  },
  kcalUnit: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.textSecondary,
  },
  macros: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  nutritionItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
  },
  nutritionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nutritionValue: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  nutritionLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },

  searchBarStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  searchBarPlaceholder: {
    ...TYPOGRAPHY.body,
    flex: 1,
    minWidth: 0,
    color: COLORS.textMuted,
  },

  emptyWrap: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
});
