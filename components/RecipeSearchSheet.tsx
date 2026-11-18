import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { searchRecipesByIngredient, type Recipe } from '../services';
import { EmptyState, IconButton, LoadingState, Segmented } from './ui';

type MealTypeKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: { value: MealTypeKey; label: string }[] = [
  { value: 'breakfast', label: 'Sáng' },
  { value: 'lunch', label: 'Trưa' },
  { value: 'dinner', label: 'Tối' },
  { value: 'snack', label: 'Phụ' },
];

// Định nghĩa Interface để Trang chính có thể sử dụng (Export nó ra)
export type AddRecipeParams = {
  date: string;
  dailyMenuId?: string;
  recipeId: string;
  scale: number;
  servingTime: string;
  status: string;
};

type Props = {
  visible: boolean;
  date: string;
  token: string;
  dailyMenuId?: string;
  onClose: () => void;
  onSuccess?: () => void; // Chuyển thành optional nếu trang chính đã lo việc refresh
  onAddRecipe: (params: AddRecipeParams) => Promise<void>;
};

export function RecipeSearchSheet({
  visible,
  date,
  token,
  dailyMenuId,
  onClose,
  onSuccess,
  onAddRecipe,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState<MealTypeKey>('lunch');
  const [addingId, setAddingId] = useState<string | null>(null);

  // 1. Search Logic (Debounce)
  useEffect(() => {
    if (!visible || !query.trim()) {
      setRecipes([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchRecipesByIngredient({
          keyword: query,
          token,
          page: 1,
          limit: 20,
        });
        setRecipes(result.recipes);
      } catch (err) {
        console.error('Search error:', err);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, visible, token]);

  // 2. Reset Form khi Modal đóng/mở
  useEffect(() => {
    if (visible) {
      setQuery('');
      setRecipes([]);
      setMealType('lunch');
      setAddingId(null);
    }
  }, [visible]);

  // 3. Hàm xử lý khi bấm nút "Thêm"
  const handleAdd = useCallback(
    async (recipe: Recipe) => {
      if (addingId) return; // Tránh bấm liên tục

      setAddingId(recipe._id);
      try {
        await onAddRecipe({
          date,
          dailyMenuId,
          recipeId: recipe._id,
          scale: 1,
          servingTime: mealType,
          status: 'manual',
        });

        onSuccess?.();
        onClose();
      } catch (err) {
        console.error('Add recipe error:', err);
      } finally {
        setAddingId(null);
      }
    },
    [addingId, onAddRecipe, date, dailyMenuId, mealType, onSuccess, onClose],
  );

  const renderRecipe = useCallback(
    ({ item }: { item: Recipe }) => (
      <RecipeRow
        recipe={item}
        adding={addingId === item._id}
        disabled={!!addingId}
        onAdd={handleAdd}
      />
    ),
    [addingId, handleAdd],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Thêm món ăn
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Chọn bữa rồi tìm món để thêm vào thực đơn
            </Text>
          </View>
          <IconButton
            icon="close"
            onPress={onClose}
            background={COLORS.surfaceMuted}
            accessibilityLabel="Đóng"
          />
        </View>

        {/* Bữa ăn */}
        <Segmented
          options={MEAL_TYPES}
          value={mealType}
          onChange={setMealType}
          style={styles.segmented}
        />

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên món hoặc nguyên liệu..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* List kết quả */}
        {loading ? (
          <LoadingState message="Đang tìm món ăn..." />
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item._id}
            renderItem={renderRecipe}
            extraData={addingId}
            style={styles.flex}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + SPACING.lg },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              query.trim() ? (
                <EmptyState
                  icon="search-outline"
                  title="Không tìm thấy món phù hợp"
                  message={`Không có kết quả cho "${query.trim()}"`}
                />
              ) : (
                <EmptyState
                  icon="restaurant-outline"
                  title="Tìm món ăn"
                  message="Nhập tên món ăn hoặc nguyên liệu để thêm vào thực đơn"
                />
              )
            }
          />
        )}
      </View>
    </Modal>
  );
}

const RecipeRow = memo(function RecipeRow({
  recipe,
  adding,
  disabled,
  onAdd,
}: {
  recipe: Recipe;
  adding: boolean;
  disabled: boolean;
  onAdd: (recipe: Recipe) => void;
}) {
  return (
    <View style={styles.recipeItem}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback]}>
          <Ionicons name="restaurant-outline" size={20} color={COLORS.textMuted} />
        </View>
      )}

      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={2}>
          {recipe.name}
        </Text>
        <Text style={styles.recipeSub} numberOfLines={1}>
          {recipe.category || 'Món ăn'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.addBtn, disabled && !adding && styles.addBtnDisabled]}
        onPress={() => onAdd(recipe)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Thêm ${recipe.name}`}
      >
        {adding ? (
          <ActivityIndicator size="small" color={COLORS.textInverse} />
        ) : (
          <Ionicons name="add" size={22} color={COLORS.textInverse} />
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.text },
  headerSubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.xxs },
  segmented: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm + 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm + 4,
    height: 48,
    paddingHorizontal: SPACING.sm + 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: TYPOGRAPHY.body.fontSize,
    color: COLORS.text,
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm + 4,
    ...SHADOWS.sm,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
  },
  thumbnailFallback: { alignItems: 'center', justifyContent: 'center' },
  recipeInfo: { flex: 1, minWidth: 0 },
  recipeName: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text, flexShrink: 1 },
  recipeSub: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.xxs },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.5 },
});
