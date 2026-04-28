import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { searchRecipesByIngredient, type Recipe } from '../services';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Sáng' },
  { key: 'lunch', label: 'Trưa' },
  { key: 'dinner', label: 'Tối' },
  { key: 'snack', label: 'Phụ' },
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
  visible, date, token, dailyMenuId, onClose, onSuccess, onAddRecipe,
}: Props) {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState('lunch');
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
          limit: 20
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
  const handleAdd = async (recipe: Recipe) => {
    if (addingId) return; // Tránh bấm liên tục

    setAddingId(recipe._id);
    try {
      // Gửi toàn bộ dữ liệu trang chính cần
      await onAddRecipe({
        date,
        dailyMenuId,
        recipeId: recipe._id,
        scale: 1,
        servingTime: mealType,
        status: 'manual',
      });

      // Nếu có callback thành công (như hiện thông báo hoặc refresh)
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Add recipe error:', err);
      // Bạn có thể thêm Alert ở đây nếu cần thông báo lỗi cho user
    } finally {
      setAddingId(null);
    }
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <View style={styles.recipeItem}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback]}>
          <Ionicons name="restaurant-outline" size={20} color={COLORS.textSecondary} />
        </View>
      )}

      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.recipeSub}>
          {item.category || 'Món ăn'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.addBtn, addingId === item._id && styles.addBtnDisabled]}
        onPress={() => handleAdd(item)}
        disabled={!!addingId}
      >
        {addingId === item._id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="add" size={22} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
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
          <Text style={styles.headerTitle}>Thêm món ăn</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Bữa ăn (Tabs) */}
        <View style={styles.tabs}>
          {MEAL_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, mealType === t.key && styles.tabActive]}
              onPress={() => setMealType(t.key)}
            >
              <Text style={[styles.tabText, mealType === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên món hoặc nguyên liệu..."
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* List kết quả */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" />
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={40} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>
                  {query.trim()
                    ? `Không tìm thấy "${query}"`
                    : 'Nhập tên món ăn để thêm vào thực đơn'}
                </Text>
              </View>
            }
            renderItem={renderRecipe}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: SPACING.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.lg, marginBottom: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#fff' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: SPACING.lg, marginBottom: 12,
    backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  recipeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  thumbnail: { width: 50, height: 50, borderRadius: 8 },
  thumbnailFallback: { backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  recipeInfo: { flex: 1 },
  recipeName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  recipeSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { opacity: 0.5 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 14 },
});