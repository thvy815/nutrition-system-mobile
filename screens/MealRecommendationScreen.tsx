import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { ScreenContainer, MealCard, RecipeSearchSheet } from '../components';
import { COLORS, SPACING } from '../constants/theme';
import {
  getDailyMenuByDate,
  getDailyMenuRecommendation,
  transformDailyMenuToMeals,
  getDailyMenusByRange,
  updateRecipeInMenu,
  deleteRecipeFromMenu,
  addRecipeToMenu
} from '../services/dailyMenu';
import type {
  DailyMenuResponse,
} from '../types/dailyMenu';
import { useNavigation } from '@react-navigation/native';
import type { Meal } from '../types';
import { RefreshableScrollView } from '../components/RefreshableScrollView';

const MEAL_LABELS = {
  breakfast: 'Bữa sáng',
  lunch: 'Bữa trưa',
  dinner: 'Bữa tối',
  snack: 'Bữa phụ',
  other: 'Khác',
};

export function MealRecommendationScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  // const [plan, setPlan] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [menu, setMenu] = useState<DailyMenuResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  function groupMealsByServingTime(meals: Meal[]) {
    const groups = {
      breakfast: [] as Meal[],
      lunch: [] as Meal[],
      dinner: [] as Meal[],
      snack: [] as Meal[],
      other: [] as Meal[],
    };

    meals.forEach((meal) => {
      const key = meal.servingTime || 'other';
      groups[key].push(meal);
    });

    return groups;
  }

  const meals: Meal[] = menu ? transformDailyMenuToMeals(menu) : [];
  console.log("meals:", meals[0])
  const groupedMeals = groupMealsByServingTime(meals);

  const [weekData, setWeekData] = useState<any[]>([]);

  // ===== helpers =====
  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  };

  const toDateStr = (d: Date) => d.toISOString().split('T')[0];

  // ===== fetch week =====
  const fetchWeek = useCallback(async () => {
    if (!token) return;

    const start = getMonday(new Date(selectedDate));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    try {
      const data = await getDailyMenusByRange(
        toDateStr(start),
        toDateStr(end),
        token
      );

      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);

        const dateStr = toDateStr(d);

        const found = data.find((m: any) =>
          m.date?.slice(0, 10) === dateStr
        );

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
  
 const fetchDay = useCallback(async (date: string) => {
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
}, [token]);

 useEffect(() => {
  fetchWeek();
}, [fetchWeek]);

useEffect(() => {
  fetchDay(selectedDate);
}, [selectedDate, fetchDay]);


  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>Chưa có thực đơn cho ngày này</Text>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>hoặc</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* AI gợi ý */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={async () => {
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
}}
      >
        <Ionicons name="bulb-outline" size={20} color="#FFF" />
        <Text style={styles.primaryText}>Lấy gợi ý thực đơn</Text>
      </TouchableOpacity>
    </View>
  );


  const onRefresh = useCallback(async () => {
  await Promise.all([fetchDay(selectedDate), fetchWeek()]);
}, [selectedDate, fetchDay, fetchWeek]);

  const handleToggleCheck = async (meal: Meal) => {
    if (!token || !menu) return;

    try {
      const updated = await updateRecipeInMenu(
        {
          date: selectedDate,
          dailyMenuId: meal.dailyMenuId,
          recipeItemId: meal.id,
          checked: !meal.isChecked,
        },
        token
      );

      setMenu(updated); // cập nhật lại UI
    } catch (err) {
      console.error('toggle check error', err);
    }
  };
  const handleDeleteMeal = async (meal: Meal) => {
    if (!token || !menu) return;
    console.log("dât trong DELETE:", meal.dailyMenuId, meal.id);
    try {
      const updated = await deleteRecipeFromMenu(
        {
          dailyMenuId: meal.dailyMenuId,
          recipeItemId: meal.id,
        },
        token
      );

      setMenu(updated);
    } catch (err) {
      console.error('delete error', err);
    }
  };
  // Trong MealRecommendationScreen.tsx

const handleAddRecipeToMenu = async (params: any) => {
  if (!token) return;

  try {
    // 1. Gọi API qua service
    await addRecipeToMenu(params, token);

    // 2. Refresh lại dữ liệu màn hình chính để thấy món mới
    await fetchDay(selectedDate);

    // 3. Đóng Modal
    setShowSearch(false);
    
    // Có thể thêm thông báo thành công ở đây (Toast)
  } catch (error) {
    console.error("Lỗi khi thêm món:", error);
    // Alert.alert("Lỗi", "Không thể thêm món ăn vào thực đơn");
  }
};
  const isEmpty = Object.values(groupedMeals).every(
    (items) => items.length === 0
  );

  return (
    <ScreenContainer>
      <Text style={styles.title}>Thực đơn hôm nay</Text>
      <Text style={styles.subtitle}>
        {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
      </Text>

      {/* WEEK STRIP */}
      <View style={styles.weekRow}>
        {weekData.map((d) => {
          const isSelected = d.dateStr === selectedDate;

          return (
            <TouchableOpacity
              key={d.dateStr}
              style={[
                styles.dayItem,
                isSelected && styles.dayItemActive,
              ]}
              onPress={() => setSelectedDate(d.dateStr)}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayTextActive]}>
                {d.label}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayTextActive]}>
                {d.day}
              </Text>

              {d.hasData && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* NUTRITION */}
      {menu && (
        <View style={styles.nutritionCard}>
          <Text style={styles.nutritionTitle}>Dinh dưỡng hôm nay</Text>

          <Text style={styles.kcal}>
            {Math.round((menu.totalNutrition?.calories || 0))} kcal
          </Text>

          <View style={styles.macros}>
            <Text>Đạm: {(menu.totalNutrition?.protein || 0).toFixed(1)}g</Text>
            <Text>Carbs: {(menu.totalNutrition?.carbs || 0).toFixed(1)}g</Text>
            <Text>Béo: {(menu.totalNutrition?.fat || 0).toFixed(1)}g</Text>
          </View>
        </View>
      )}

      {/* ── SEARCH BAR CỐ ĐỊNH ── */}
      <TouchableOpacity
        style={styles.searchBarStatic}
        onPress={() => setShowSearch(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.searchBarPlaceholder}>Tìm và thêm món ăn...</Text>
      </TouchableOpacity>


      <RefreshableScrollView
  onRefreshData={onRefresh}
  showsVerticalScrollIndicator={false}
>
        {loading ? (
  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
) : isEmpty ? (
  renderEmpty()
) : (
  Object.entries(groupedMeals).map(([key, items]) => {
    if (items.length === 0) return null;
    return (
      <View key={key} style={styles.mealSection}>
        <Text style={styles.mealSectionTitle}>
          {MEAL_LABELS[key as keyof typeof MEAL_LABELS]}
        </Text>
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
      </RefreshableScrollView>

      {/* Modal search */}
      <RecipeSearchSheet
        visible={showSearch}
        date={selectedDate}
        token={token!}
        dailyMenuId={menu?._id}         // lấy từ menu hiện tại nếu đã có
        onClose={() => setShowSearch(false)}
        onSuccess={() => fetchDay(selectedDate)}
        onAddRecipe={handleAddRecipeToMenu}
      />

    </ScreenContainer>
  );
}

function NutritionItem({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={styles.nutritionItem}>
      <View style={[styles.nutritionDot, { backgroundColor: color }]} />
      <Text style={styles.nutritionValue}>{Math.round(value)}</Text>
      <Text style={styles.nutritionUnit}>{unit}</Text>
      <Text style={styles.nutritionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBarStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    marginBottom: SPACING.md,
  },
  searchBarPlaceholder: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },

  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },

  secondaryText: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  mealSection: {
    marginBottom: SPACING.lg,
  },

  mealSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  dateSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: '#FFF',
  },
  nutritionSummary: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  nutritionUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  getRecommendationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
  },
  getRecommendationText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mealCard: {
    marginBottom: SPACING.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  servingTimeBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  servingTimeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  macros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  macroValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  portionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },

  dayItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },

  dayItemActive: {
    backgroundColor: COLORS.primary,
  },

  dayLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },

  dayTextActive: {
    color: '#fff',
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },

  nutritionCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },

  kcal: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // macros: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   marginTop: 10,
  // },
});