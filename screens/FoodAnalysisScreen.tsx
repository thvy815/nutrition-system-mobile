/**
 * FoodAnalysisScreen
 *  - Quét ảnh: nhận diện NHIỀU món (Gemini) -> phân tích dinh dưỡng từng món
 *    (CSDL công thức trước, không có thì AI ước tính nguyên liệu + map dinh dưỡng).
 *  - Công thức: dán công thức -> AI trích nguyên liệu -> map dinh dưỡng.
 */
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  Notice,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
  Segmented,
} from '../components';
import { BORDER_RADIUS, COLORS, METRIC_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  detectFoods,
  findIngredientsByAi,
  getIngredientsAndInstructionsInAi,
  getMappingIngredients,
  Ingredient,
  MappedIngredient,
  searchRecipesByIngredient,
} from '../services/recipe';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type InputMode = 'image' | 'recipe';

type Nutri = { calories: number; protein: number; carbs: number; fat: number };

type DishResult = {
  source: 'db' | 'ai';
  recipeName?: string;
  ingredients: Ingredient[];
  nutrition: Nutri | null;
  servings?: number;
  /** true khi dinh dưỡng là của cả công thức (CSDL không có số khẩu phần). */
  wholeRecipe?: boolean;
};

type DishState = {
  name: string;
  status: 'loading' | 'done' | 'error';
  selected: boolean;
  result?: DishResult;
  error?: string;
};

const ZERO: Nutri = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/* ------------------------------------------------------------------ */
/* Nutrition helpers                                                    */
/* ------------------------------------------------------------------ */

function round(n: Nutri): Nutri {
  return {
    calories: Math.round(n.calories),
    protein: Number(n.protein.toFixed(1)),
    carbs: Number(n.carbs.toFixed(1)),
    fat: Number(n.fat.toFixed(1)),
  };
}

/** Dinh dưỡng trong DB tính trên 100g -> nhân theo lượng nguyên liệu. */
function sumMapped(mapped: (MappedIngredient | undefined)[], original: Ingredient[]): Nutri | null {
  if (!mapped.length || mapped.every((m) => !m)) return null;
  const total = mapped.reduce<Nutri>((acc, ing, i) => {
    if (!ing?.nutrition) return acc;
    const amount = original[i]?.quantity?.amount || original[i]?.quantity?.originalAmount || 100;
    const factor = amount / 100;
    acc.calories += (ing.nutrition.calories || 0) * factor;
    acc.protein += (ing.nutrition.protein || 0) * factor;
    acc.carbs += (ing.nutrition.carbs || 0) * factor;
    acc.fat += (ing.nutrition.fat || 0) * factor;
    return acc;
  }, { ...ZERO });
  return round(total);
}

async function mapNutrition(ingredients: Ingredient[], token: string): Promise<Nutri | null> {
  if (!ingredients.length) return null;
  try {
    const mapped = await getMappingIngredients(
      ingredients.map((i) => ({ name: i.name })),
      1,
      token
    );
    return sumMapped(mapped, ingredients);
  } catch {
    // search-service không chạy -> vẫn trả nguyên liệu, chỉ thiếu dinh dưỡng.
    return null;
  }
}

async function analyzeDish(name: string, token: string): Promise<DishResult> {
  const search = await searchRecipesByIngredient({ keyword: name, token, page: 1, limit: 5 }).catch(
    () => ({ recipes: [] as any[] })
  );
  const recipe = search.recipes?.[0];

  if (recipe) {
    // Ưu tiên số liệu/khẩu phần; nếu chỉ có tổng công thức thì chia cho số khẩu phần.
    const perServing = recipe.totalNutritionPerServing?.calories != null;
    const servings = !perServing && recipe.servings && recipe.servings > 1 ? recipe.servings : 1;
    const raw = perServing ? recipe.totalNutritionPerServing : recipe.totalNutrition;
    const n = raw
      ? {
          calories: (raw.calories ?? 0) / servings,
          protein: (raw.protein ?? 0) / servings,
          carbs: (raw.carbs ?? 0) / servings,
          fat: (raw.fat ?? 0) / servings,
        }
      : null;
    return {
      source: 'db',
      recipeName: recipe.name,
      ingredients: recipe.ingredients ?? [],
      servings: recipe.servings,
      wholeRecipe: !perServing && !(recipe.servings && recipe.servings > 1),
      nutrition: n
        ? round({
            calories: n.calories ?? 0,
            protein: n.protein ?? 0,
            carbs: n.carbs ?? 0,
            fat: n.fat ?? 0,
          })
        : null,
    };
  }

  const ai = await getIngredientsAndInstructionsInAi(name, token);
  const ingredients = ai?.ingredients ?? [];
  if (!ingredients.length) throw new Error('Không tìm thấy công thức cho món này');

  return {
    source: 'ai',
    recipeName: ai?.name || name,
    ingredients,
    servings: ai?.servings,
    nutrition: await mapNutrition(ingredients, token),
  };
}

/** Chạy tối đa `limit` tác vụ song song. */
async function runPool<T>(items: T[], limit: number, worker: (item: T, idx: number) => Promise<void>) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export function FoodAnalysisScreen() {
  const { token } = useAuth();
  const [mode, setMode] = useState<InputMode>('image');

  // Image mode
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [dishes, setDishes] = useState<DishState[] | null>(null);
  const runId = useRef(0);

  // Recipe mode
  const [recipeText, setRecipeText] = useState('');
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeResult, setRecipeResult] = useState<{ ingredients: Ingredient[]; nutrition: Nutri | null } | null>(null);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  const updateDish = useCallback((id: number, idx: number, patch: Partial<DishState>) => {
    if (id !== runId.current) return; // bỏ kết quả của ảnh cũ
    setDishes((prev) => (prev ? prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)) : prev));
  }, []);

  const analyzeAll = useCallback(
    async (names: string[], id: number) => {
      if (!token) return;
      await runPool(names, 2, async (name, idx) => {
        try {
          const result = await analyzeDish(name, token);
          updateDish(id, idx, { status: 'done', result });
        } catch (err: any) {
          updateDish(id, idx, { status: 'error', error: err?.message || getErrorMessage(err) });
        }
      });
    },
    [token, updateDish]
  );

  const retryDish = useCallback(
    async (idx: number) => {
      if (!token || !dishes) return;
      const id = runId.current;
      updateDish(id, idx, { status: 'loading', error: undefined });
      try {
        const result = await analyzeDish(dishes[idx].name, token);
        updateDish(id, idx, { status: 'done', result });
      } catch (err: any) {
        updateDish(id, idx, { status: 'error', error: err?.message || getErrorMessage(err) });
      }
    },
    [token, dishes, updateDish]
  );

  const toggleDish = useCallback((idx: number) => {
    setDishes((prev) => (prev ? prev.map((d, i) => (i === idx ? { ...d, selected: !d.selected } : d)) : prev));
  }, []);

  const handleDetect = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      const id = ++runId.current;
      setDishes(null);
      setDetectError(null);
      setDetecting(true);
      try {
        const names = await detectFoods(asset);
        if (id !== runId.current) return;
        if (!names.length) {
          setDishes([]);
          return;
        }
        setDishes(names.map((name) => ({ name, status: 'loading', selected: true })));
        setDetecting(false);
        analyzeAll(names, id);
      } catch (err) {
        if (id !== runId.current) return;
        setDetectError(getErrorMessage(err, 'Không nhận diện được món ăn trong ảnh.'));
      } finally {
        if (id === runId.current) setDetecting(false);
      }
    },
    [analyzeAll]
  );

  const pickImage = useCallback(
    async (useCamera: boolean) => {
      try {
        const perm = useCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert(
            'Cần cấp quyền',
            useCamera
              ? 'Bạn cần cấp quyền camera để chụp ảnh món ăn.'
              : 'Bạn cần cấp quyền thư viện để chọn ảnh.'
          );
          return;
        }
        const options: ImagePicker.ImagePickerOptions = {
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        };
        const result = useCamera
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

        if (!result.canceled && result.assets[0]) {
          setImageUri(result.assets[0].uri);
          handleDetect(result.assets[0]);
        }
      } catch {
        Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
      }
    },
    [handleDetect]
  );

  const handleAnalyzeRecipe = useCallback(async () => {
    if (!token || !recipeText.trim()) return;
    setRecipeLoading(true);
    setRecipeError(null);
    setRecipeResult(null);
    try {
      const ingredients = (await findIngredientsByAi(recipeText, token)) ?? [];
      if (!ingredients.length) {
        setRecipeError('Không tìm thấy nguyên liệu trong nội dung bạn nhập.');
        return;
      }
      const nutrition = await mapNutrition(ingredients, token);
      setRecipeResult({ ingredients, nutrition });
    } catch (err) {
      setRecipeError(getErrorMessage(err, 'Không phân tích được công thức.'));
    } finally {
      setRecipeLoading(false);
    }
  }, [recipeText, token]);

  const switchMode = useCallback((m: InputMode) => {
    setMode(m);
    runId.current++;
    setDishes(null);
    setDetectError(null);
    setDetecting(false);
    setImageUri(null);
    setRecipeResult(null);
    setRecipeError(null);
  }, []);

  /* ------- derived ------- */

  const total = useMemo(() => {
    if (!dishes) return null;
    const chosen = dishes.filter((d) => d.selected && d.status === 'done' && d.result?.nutrition);
    if (!chosen.length) return null;
    return {
      count: chosen.length,
      nutri: round(
        chosen.reduce<Nutri>((acc, d) => {
          const n = d.result!.nutrition!;
          return {
            calories: acc.calories + n.calories,
            protein: acc.protein + n.protein,
            carbs: acc.carbs + n.carbs,
            fat: acc.fat + n.fat,
          };
        }, { ...ZERO })
      ),
    };
  }, [dishes]);

  const pending = dishes?.filter((d) => d.status === 'loading').length ?? 0;

  return (
    <ScreenContainer
      keyboardAvoiding
      header={<ScreenHeader title="Phân tích món ăn" subtitle="Chụp ảnh bữa ăn hoặc dán công thức để xem dinh dưỡng" />}
    >
      <Segmented
        value={mode}
        onChange={switchMode}
        options={[
          { value: 'image', label: 'Quét ảnh', icon: 'camera' },
          { value: 'recipe', label: 'Công thức', icon: 'document-text' },
        ]}
      />

      {mode === 'image' ? (
        <>
          {imageUri ? (
            <View style={styles.preview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              {detecting ? (
                <View style={styles.previewOverlay}>
                  <ActivityIndicator size="large" color={COLORS.textInverse} />
                  <Text style={styles.previewOverlayText}>Đang nhận diện các món ăn...</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.dropzone}>
              <View style={styles.dropIcon}>
                <Ionicons name="restaurant" size={30} color={COLORS.primary} />
              </View>
              <Text style={styles.dropTitle}>Chụp cả mâm cơm cũng được</Text>
              <Text style={styles.dropText}>
                AI sẽ nhận diện từng món trong ảnh và ước tính dinh dưỡng cho mỗi món.
              </Text>
            </View>
          )}

          <View style={styles.pickRow}>
            <Button
              title="Thư viện"
              icon="images"
              variant="outline"
              onPress={() => pickImage(false)}
              disabled={detecting}
              style={styles.flex1}
            />
            <Button
              title={imageUri ? 'Chụp lại' : 'Chụp ảnh'}
              icon="camera"
              onPress={() => pickImage(true)}
              disabled={detecting}
              style={styles.flex1}
            />
          </View>

          {detectError ? <Notice tone="error" message={detectError} style={styles.mt16} /> : null}

          {dishes && dishes.length === 0 ? (
            <EmptyState
              icon="sad-outline"
              title="Không nhận diện được món nào"
              message="Hãy chụp gần hơn, đủ sáng và để món ăn chiếm phần lớn khung hình."
            />
          ) : null}

          {dishes && dishes.length > 0 ? (
            <>
              <SectionHeader
                title={`Nhận diện được ${dishes.length} món`}
                icon="sparkles-outline"
              />
              <View style={styles.chipRow}>
                {dishes.map((d, i) => (
                  <Badge key={`${d.name}-${i}`} label={d.name} tone={d.selected ? 'success' : 'neutral'} />
                ))}
              </View>

              <TotalCard total={total} pending={pending} dishCount={dishes.length} />

              {dishes.map((d, i) => (
                <DishCard key={`${d.name}-${i}`} index={i} dish={d} onToggle={toggleDish} onRetry={retryDish} />
              ))}

              <Text style={styles.footnote}>
                Giá trị dinh dưỡng là ước tính cho 1 khẩu phần, có thể khác với thực tế.
              </Text>
            </>
          ) : null}
        </>
      ) : (
        <>
          <Card style={styles.mt16}>
            <TextInput
              style={styles.recipeInput}
              placeholder={'Ví dụ:\n200g ức gà\n1 chén cơm trắng\n100g bông cải xanh, 1 muỗng dầu ô liu'}
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={recipeText}
              onChangeText={setRecipeText}
              textAlignVertical="top"
              maxLength={3000}
            />
            <Button
              title={recipeLoading ? 'Đang phân tích...' : 'Phân tích'}
              icon="analytics"
              onPress={handleAnalyzeRecipe}
              loading={recipeLoading}
              disabled={!recipeText.trim()}
              fullWidth
              style={styles.mt12}
            />
          </Card>

          {recipeError ? <Notice tone="error" message={recipeError} style={styles.mt16} /> : null}

          {recipeResult ? (
            <>
              {recipeResult.nutrition ? (
                <>
                  <SectionHeader title="Tổng dinh dưỡng" icon="pie-chart-outline" />
                  <NutritionGrid n={recipeResult.nutrition} />
                </>
              ) : (
                <Notice
                  tone="warning"
                  style={styles.mt16}
                  message="Chưa tính được dinh dưỡng (dịch vụ tra cứu nguyên liệu không phản hồi)."
                />
              )}
              <SectionHeader title={`Nguyên liệu (${recipeResult.ingredients.length})`} icon="list-outline" />
              <Card>
                <IngredientList items={recipeResult.ingredients} />
              </Card>
            </>
          ) : null}
        </>
      )}
    </ScreenContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Sub components                                                      */
/* ------------------------------------------------------------------ */

const NutritionGrid = memo(function NutritionGrid({ n, compact }: { n: Nutri; compact?: boolean }) {
  const items = [
    { label: 'Calo', value: `${n.calories}`, unit: 'kcal', color: METRIC_COLORS.calories, icon: 'flame' as const },
    { label: 'Đạm', value: `${n.protein}`, unit: 'g', color: METRIC_COLORS.protein, icon: 'fitness' as const },
    { label: 'Tinh bột', value: `${n.carbs}`, unit: 'g', color: METRIC_COLORS.carbs, icon: 'leaf' as const },
    { label: 'Chất béo', value: `${n.fat}`, unit: 'g', color: METRIC_COLORS.fat, icon: 'water' as const },
  ];
  return (
    <View style={[styles.nutriGrid, compact && styles.nutriGridCompact]}>
      {items.map((it) => (
        <View key={it.label} style={[styles.nutriItem, compact && styles.nutriItemCompact]}>
          {!compact ? <Ionicons name={it.icon} size={18} color={it.color} /> : null}
          <Text style={[compact ? styles.nutriValueSm : styles.nutriValue, { color: it.color }]} numberOfLines={1}>
            {it.value}
            <Text style={styles.nutriUnit}> {it.unit}</Text>
          </Text>
          <Text style={styles.nutriLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
});

function TotalCard({
  total,
  pending,
  dishCount,
}: {
  total: { count: number; nutri: Nutri } | null;
  pending: number;
  dishCount: number;
}) {
  return (
    <Card style={styles.totalCard}>
      <View style={styles.totalHead}>
        <Text style={styles.totalTitle}>Tổng bữa ăn</Text>
        {pending ? (
          <View style={styles.pendingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.pendingText}>
              Đang phân tích {dishCount - pending}/{dishCount}
            </Text>
          </View>
        ) : total ? (
          <Badge label={`${total.count} món`} tone="success" />
        ) : null}
      </View>
      {total ? (
        <NutritionGrid n={total.nutri} />
      ) : (
        <Text style={styles.pendingText}>
          {pending ? 'Kết quả sẽ hiện dần khi từng món được phân tích.' : 'Chưa có món nào có dữ liệu dinh dưỡng.'}
        </Text>
      )}
    </Card>
  );
}

const DishCard = memo(function DishCard({
  index,
  dish,
  onToggle,
  onRetry,
}: {
  index: number;
  dish: DishState;
  onToggle: (idx: number) => void;
  onRetry: (idx: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const r = dish.result;

  return (
    <View style={[styles.dishCard, !dish.selected && styles.dishCardOff]}>
      <View style={styles.dishHead}>
        <TouchableOpacity
          onPress={() => onToggle(index)}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: dish.selected }}
          accessibilityLabel={`Tính ${dish.name} vào tổng`}
        >
          <Ionicons
            name={dish.selected ? 'checkbox' : 'square-outline'}
            size={22}
            color={dish.selected ? COLORS.primary : COLORS.textMuted}
          />
        </TouchableOpacity>
        <View style={styles.flex1}>
          <Text style={styles.dishName} numberOfLines={2}>
            {dish.name}
          </Text>
          {r?.recipeName && r.recipeName.toLowerCase() !== dish.name.toLowerCase() ? (
            <Text style={styles.dishSub} numberOfLines={1}>
              Khớp: {r.recipeName}
            </Text>
          ) : null}
        </View>
        {dish.status === 'loading' ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : dish.status === 'done' && r ? (
          <Badge
            label={r.source === 'db' ? 'CSDL' : 'AI ước tính'}
            tone={r.source === 'db' ? 'info' : 'purple'}
          />
        ) : (
          <Badge label="Lỗi" tone="error" />
        )}
      </View>

      {dish.status === 'error' ? (
        <View style={styles.dishErrorRow}>
          <Text style={styles.dishError} numberOfLines={2}>
            {dish.error}
          </Text>
          <Button title="Thử lại" size="sm" variant="outline" icon="refresh" onPress={() => onRetry(index)} />
        </View>
      ) : null}

      {dish.status === 'done' && r ? (
        <>
          {r.nutrition ? (
            <>
              <NutritionGrid n={r.nutrition} compact />
              {r.wholeRecipe ? (
                <Text style={styles.dishSub}>Theo cả công thức (CSDL chưa có số khẩu phần)</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.dishSub}>Chưa tính được dinh dưỡng cho món này.</Text>
          )}
          {r.ingredients.length ? (
            <TouchableOpacity style={styles.expand} onPress={() => setOpen((v) => !v)} hitSlop={6}>
              <Text style={styles.expandText}>
                {open ? 'Ẩn nguyên liệu' : `Xem ${r.ingredients.length} nguyên liệu`}
              </Text>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.primaryDark} />
            </TouchableOpacity>
          ) : null}
          {open ? <IngredientList items={r.ingredients} /> : null}
        </>
      ) : null}
    </View>
  );
});

const IngredientList = memo(function IngredientList({ items }: { items: Ingredient[] }) {
  return (
    <View>
      {items.map((ing, i) => {
        const amount = ing.quantity?.amount || ing.quantity?.originalAmount;
        const unit = ing.quantity?.unit || ing.quantity?.originalUnit || '';
        return (
          <View key={`${ing.name}-${i}`} style={[styles.ingRow, i > 0 && styles.ingDivider]}>
            <Text style={styles.ingName} numberOfLines={2}>
              {ing.name}
            </Text>
            {amount ? (
              <Text style={styles.ingAmount}>
                {amount} {unit}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
});

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  mt12: { marginTop: SPACING.sm + 4 },
  mt16: { marginTop: SPACING.md },

  dropzone: {
    marginTop: SPACING.md,
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  dropIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm + 4,
  },
  dropTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, textAlign: 'center' },
  dropText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },

  preview: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.surfaceMuted,
  },
  previewImage: { width: '100%', height: '100%' },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  previewOverlayText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textInverse },

  pickRow: { flexDirection: 'row', gap: SPACING.sm + 4, marginTop: SPACING.sm + 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm + 4 },

  totalCard: { marginBottom: SPACING.sm + 4, borderWidth: 1, borderColor: COLORS.primarySoft },
  totalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 4,
    gap: SPACING.sm,
  },
  totalTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendingText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },

  nutriGrid: { flexDirection: 'row', gap: SPACING.sm },
  nutriGridCompact: { marginTop: SPACING.sm + 4 },
  nutriItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    gap: 2,
  },
  nutriItemCompact: { paddingVertical: SPACING.sm },
  nutriValue: { ...TYPOGRAPHY.h3 },
  nutriValueSm: { ...TYPOGRAPHY.bodyStrong },
  nutriUnit: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  nutriLabel: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },

  dishCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    ...SHADOWS.sm,
  },
  dishCardOff: { opacity: 0.6 },
  dishHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 4 },
  dishName: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text },
  dishSub: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: 2 },
  dishErrorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  dishError: { ...TYPOGRAPHY.caption, color: COLORS.error, flex: 1 },
  expand: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm + 4 },
  expandText: { ...TYPOGRAPHY.captionStrong, color: COLORS.primaryDark },

  ingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm, paddingVertical: SPACING.sm },
  ingDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  ingName: { ...TYPOGRAPHY.caption, color: COLORS.text, flex: 1 },
  ingAmount: { ...TYPOGRAPHY.captionStrong, color: COLORS.textSecondary },

  recipeInput: {
    minHeight: 140,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 4,
    backgroundColor: COLORS.background,
  },
  footnote: { ...TYPOGRAPHY.small, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xs },
});
