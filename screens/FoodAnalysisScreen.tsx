import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Card, ScreenContainer } from '../components';
import { COLORS, SPACING } from '../constants/theme';
import type { FoodAnalysisResult, RecipeAnalysisResult } from '../types';
import { detectRecipe, Recipe, searchRecipesByIngredient, getIngredientsAndInstructionsInAi, findIngredientsByAi, Ingredient, getMappingIngredients, MappedIngredient } from '../services/recipe';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator } from 'react-native';

type InputMode = 'image' | 'recipe';

export function FoodAnalysisScreen() {
  const { token } = useAuth();
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipeText, setRecipeText] = useState('');
  const [detectedName, setDetectedName] = useState<string | null>(null);

  const [imageResult, setImageResult] = useState<Recipe | null>(null);
  const [ingredientResult, setIngredientResult] = useState<Ingredient[] | null>(null);
  const [ingMappingResult, setIngMappingResult] = useState<MappedIngredient[] | null>(null);
  const [totalNutrition, setTotalNutrition] = useState<any>(null);

  // Hàm dọn dẹp sạch sẽ toàn bộ kết quả phân tích
  const resetAllResults = () => {
    setImageResult(null);
    setIngredientResult(null);
    setIngMappingResult(null);
    setTotalNutrition(null);
    setDetectedName(null);
  };

  const handleMapping = async (ingredients: { name: string }[]) => {
    if (!token || !ingredients || ingredients.length === 0) return null;
    setLoading(true);
    try {
      const result = await getMappingIngredients(ingredients, 1, token);
      return result;
    } catch (err) {
      console.error('Mapping error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Hàm dùng chung để tính toán tổng dinh dưỡng từ mảng đã được Mapping
  // Truyền thêm mảng nguyên liệu gốc (originalIngredients) vào hàm
  const calculateAndSetTotalNutrition = (
    mappedList: MappedIngredient[],
    originalIngredients: any[]
  ) => {
    if (mappedList && mappedList.length > 0) {
      const totalNutri = mappedList.reduce((acc, ing, index) => {
        // Lấy lượng weight/amount từ mảng nguyên liệu gốc tương ứng cùng index
        // Phòng hờ nếu không có amount thì mặc định là 1 (hoặc chia cho 100 nếu DB của bạn tính theo 100g)
        const amount = originalIngredients[index]?.quantity?.amount || 1;
        console.log(`Ingredient Mapping name: ${ing.name}, Amount: ${amount}, Ingredient name:`, originalIngredients[index]?.namer);
        // Nếu DB của bạn lưu dinh dưỡng tính trên mỗi 100g, bạn cần chia cho 100:
        // const factor = amount / 100;
        // Nếu DB lưu sẵn dinh dưỡng cho đúng 1 đơn vị định lượng (1g, 1 quả, v.v.), thì giữ nguyên factor = amount:
        const factor = amount / 100;

        acc.calories += (ing.nutrition?.calories || 0) * factor;
        acc.protein += (ing.nutrition?.protein || 0) * factor;
        acc.carbs += (ing.nutrition?.carbs || 0) * factor;
        acc.fat += (ing.nutrition?.fat || 0) * factor;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      // Làm tròn số cho đẹp mắt (ví dụ: 12.34g đạm thay vì 12.33333333g)
      setTotalNutrition({
        calories: Math.round(totalNutri.calories),
        protein: Number(totalNutri.protein.toFixed(1)),
        carbs: Number(totalNutri.carbs.toFixed(1)),
        fat: Number(totalNutri.fat.toFixed(1)),
      });
    }
  };

  const handleDetectRecipe = async (imageAsset: any) => {
    resetAllResults(); // Xóa sạch kết quả cũ trước khi nạp cái mới
    if (!token) return;
    setLoading(true);
    try {
      const detectRes = await detectRecipe(imageAsset, token);

      if (detectRes.success) {
        let foodName = detectRes.detectedFoodName;
        setDetectedName(foodName);

        try {
          const searchRes = await searchRecipesByIngredient({
            keyword: foodName,
            token,
            page: 1,
            limit: 20
          });

          if (searchRes.recipes.length === 0) {
            const aiRes = await getIngredientsAndInstructionsInAi(foodName, token);
            const ingList = aiRes?.ingredients || [];
            const nameIngList = ingList.map((ing: any) => ({ name: ing.name }));

            const tempMapping = await handleMapping(nameIngList);
            if (tempMapping) {
              calculateAndSetTotalNutrition(tempMapping, ingList);
              setIngMappingResult(tempMapping);
            }
            setImageResult(aiRes);
          } else {
            setImageResult(searchRes.recipes[0]);
          }
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        Alert.alert('Thông báo', 'Không nhận diện được món ăn trong ảnh.');
      }
    } catch (error: any) {
      console.error("API Error Detail:", error.response?.data || error.message);
      Alert.alert('Lỗi', 'Máy chủ không nhận được file ảnh hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeRecipe = async () => {
    if (!token || !recipeText.trim()) return;
    resetAllResults(); // Xóa sạch kết quả cũ
    setLoading(true);

    try {
      const resIngredients = await findIngredientsByAi(recipeText, token);
      setIngredientResult(resIngredients);

      // SỬA LỖI SỐ 3: Tiến hành mapping dinh dưỡng luôn cho chế độ nhập chữ
      if (resIngredients && resIngredients.length > 0) {
        const nameIngList = resIngredients.map((ing: any) => ({ name: ing.name }));
        const tempMapping = await handleMapping(nameIngList);
        if (tempMapping) {
          calculateAndSetTotalNutrition(tempMapping, resIngredients);
          setIngMappingResult(tempMapping);
        }
      }
    } catch (err) {
      console.error('Analyze recipe error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = (mode: InputMode) => {
    setInputMode(mode);
    resetAllResults(); // SỬA LỖI SỐ 2: Đổi chế độ là dọn sạch bách dữ liệu chế độ cũ
    if (mode === 'image') {
      setRecipeText('');
    } else {
      setImageUri(null);
    }
  };

  // ... Các hàm xin quyền và pickImage giữ nguyên ...

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        // Xin quyền camera
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status !== 'granted') {
          Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập camera để chụp ảnh.');
          return;
        }
      } else {
        // Xin quyền thư viện ảnh
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryPermission.status !== 'granted') {
          Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập thư viện để chọn ảnh.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

      if (!result.canceled) {
        const imageAsset = result.assets[0];
        setImageUri(imageAsset.uri);

        // Gọi hàm nhận diện ngay khi chọn ảnh xong
        handleDetectRecipe(imageAsset);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const hasResult = imageResult || ingredientResult;

  return (
    <ScreenContainer keyboardAvoiding>
      <Text style={styles.title}>Phân tích món ăn</Text>
      <Text style={styles.subtitle}>
        Quét ảnh hoặc nhập công thức để xem thông tin dinh dưỡng
      </Text>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'image' && styles.modeButtonActive]}
          onPress={() => handleSwitchMode('image')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="camera"
            size={22}
            color={inputMode === 'image' ? '#FFF' : COLORS.textSecondary}
          />
          <Text style={[styles.modeButtonText, inputMode === 'image' && styles.modeButtonTextActive]}>
            Quét ảnh
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'recipe' && styles.modeButtonActive]}
          onPress={() => handleSwitchMode('recipe')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="document-text"
            size={22}
            color={inputMode === 'recipe' ? '#FFF' : COLORS.textSecondary}
          />
          <Text style={[styles.modeButtonText, inputMode === 'recipe' && styles.modeButtonTextActive]}>
            Công thức
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Area */}
      {inputMode === 'image' ? (
        <View style={styles.inputSection}>
          <View style={styles.pickerRow}>
            <TouchableOpacity
              style={[styles.pickerButton, loading && { opacity: 0.5 }]}
              onPress={() => pickImage(false)}
              disabled={loading}
            >
              <Ionicons name="images" size={28} color={COLORS.primary} />
              <Text style={styles.pickerButtonText}>Thư viện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerButton, loading && { opacity: 0.5 }]}
              onPress={() => pickImage(true)}
              disabled={loading}
            >
              <Ionicons name="camera" size={28} color={COLORS.primary} />
              <Text style={styles.pickerButtonText}>Chụp ảnh</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <Card style={styles.previewCard}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Đang nhận diện món ăn...</Text>
                </View>
              )}
            </Card>
          )}

          {detectedName && !loading && imageUri && (
            <View style={styles.resultBrief}>
              <Text style={styles.detectedText}>
                Kết quả nhận diện: <Text style={{ fontWeight: 'bold' }}>{detectedName}</Text>
              </Text>
            </View>
          )}
        </View>) : (
        <Card style={styles.recipeInputCard}>
          <TextInput
            style={styles.recipeInput}
            placeholder="Dán công thức hoặc danh sách nguyên liệu vào đây..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={5}
            value={recipeText}
            onChangeText={setRecipeText}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!recipeText.trim() || loading) && styles.analyzeButtonDisabled
            ]}
            onPress={handleAnalyzeRecipe}
            disabled={!recipeText.trim() || loading}
            activeOpacity={0.8}
          >
            {loading && !hasResult ? (
              <>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.analyzeButtonText}>Đang phân tích...</Text>
              </>
            ) : (
              <>
                <Ionicons name="analytics" size={20} color="#FFF" />
                <Text style={styles.analyzeButtonText}>Phân tích</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>
      )}

      {/* Results */}
      {hasResult && (
        <View style={styles.resultsSection}>
          {ingredientResult && !loading && (
            <>
              <Text style={styles.sectionTitle}>Nguyên liệu</Text>
              {ingredientResult?.map((ing, i) => (
                <Card key={i} style={styles.ingredientCard}>
                  <Text style={styles.ingredientName}>{ing.name}</Text>
                  <View style={styles.ingredientMacros}>
                    <Text style={styles.macroText}>{ing.quantity.amount || ing.quantity.originalAmount} {ing.quantity.unit || ing.quantity.originalUnit}</Text>
                  </View>
                </Card>
              ))}

              {
                ingMappingResult && (
                  <Card style={styles.resultCard}>
                    <Text style={styles.resultLabel}>Nguyên liệu dùng để tính dinh dưỡng</Text>
                    {ingMappingResult.map((ing, i) => (
                      <Card key={i} style={styles.ingredientCard}>
                        <Text style={styles.ingredientName}>{ing.name}</Text>
                        <View style={styles.ingredientMacros}>
                          <Text style={styles.macroText}>Calo: {ing.nutrition?.calories}kCal</Text>
                          <Text style={styles.macroText}>Pro: {ing.nutrition?.protein}g</Text>
                          <Text style={styles.macroText}>Carb: {ing.nutrition?.carbs}g</Text>
                          <Text style={styles.macroText}>Fat: {ing.nutrition?.fat}g</Text>
                        </View>
                      </Card>
                    ))}
                  </Card>
                )
              }

            </>
          )}

          {imageResult && (
            <>
              <Card style={styles.resultCard}>
                <Text style={styles.resultLabel}>Nguyên liệu dự kiến</Text>
                {imageResult.ingredients.map((ing, i) => (
                  <Card key={i} style={styles.ingredientCard}>
                    {/* Thẻ Text cha bọc ngoài giúp name và amount nằm chung 1 hàng liền mạch */}
                    <Text style={styles.ingredientName}>
                      {ing.name}{' - '}
                      <Text style={styles.macroText}>
                        {ing.quantity.amount || ing.quantity.originalAmount}{' '}
                        {ing.quantity.unit || ing.quantity.originalUnit}
                      </Text>
                    </Text>
                  </Card>
                ))}
              </Card>

              {totalNutrition ? (
                <NutritionSummaryCard
                  calories={totalNutrition.calories}
                  protein={totalNutrition.protein}
                  carbs={totalNutrition.carbs}
                  fat={totalNutrition.fat}
                />
              ) : (imageResult.totalNutritionPerServing || imageResult.totalNutrition) ? (
                <NutritionSummaryCard
                  calories={imageResult.totalNutrition?.calories || imageResult.totalNutritionPerServing?.calories || 0}
                  protein={imageResult.totalNutrition?.protein || imageResult.totalNutritionPerServing?.protein || 0}
                  carbs={imageResult.totalNutrition?.carbs || imageResult.totalNutritionPerServing?.carbs || 0}
                  fat={imageResult.totalNutrition?.fat || imageResult.totalNutritionPerServing?.fat || 0}
                />
              ) : null}
              {
                ingMappingResult && (
                  <Card style={styles.resultCard}>
                    <Text style={styles.resultLabel}>Nguyên liệu dùng để tính dinh dưỡng</Text>
                    {ingMappingResult.map((ing, i) => (
                      <Card key={i} style={styles.ingredientCard}>
                        <Text style={styles.ingredientName}>{ing.name}</Text>
                        <View style={styles.ingredientMacros}>
                          <Text style={styles.macroText}>{ing.nutrition?.calories} kcal</Text>
                          <Text style={styles.macroText}>Pro: {ing.nutrition?.protein}g</Text>
                          <Text style={styles.macroText}>Carb: {ing.nutrition?.carbs}g</Text>
                          <Text style={styles.macroText}>Fat: {ing.nutrition?.fat}g</Text>
                        </View>
                      </Card>
                    ))}
                  </Card>
                )
              }

            </>
          )}



        </View>
      )}
    </ScreenContainer>
  );
}

function NutritionSummaryCard({
  calories,
  protein,
  carbs,
  fat,
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  return (
    <Card style={styles.nutritionCard}>
      <Text style={styles.nutritionTitle}>Tổng dinh dưỡng</Text>
      <View style={styles.nutritionGrid}>
        <View style={styles.nutritionItem}>
          <Ionicons name="flame" size={24} color={COLORS.accent} />
          <Text style={styles.nutritionValue}>{calories}</Text>
          <Text style={styles.nutritionLabel}>kcal</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Ionicons name="fitness" size={24} color={COLORS.primary} />
          <Text style={styles.nutritionValue}>{protein}g</Text>
          <Text style={styles.nutritionLabel}>Đạm</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Ionicons name="nutrition" size={24} color={COLORS.secondary} />
          <Text style={styles.nutritionValue}>{carbs}g</Text>
          <Text style={styles.nutritionLabel}>Tinh bột</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Ionicons name="water" size={24} color={COLORS.accent} />
          <Text style={styles.nutritionValue}>{fat}g</Text>
          <Text style={styles.nutritionLabel}>Chất béo</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resultBrief: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  detectedText: {
    fontSize: 16,
    color: COLORS.text,
  },
  // Đừng quên style cho previewCard nếu chưa có
  previewCard: {
    marginTop: SPACING.lg,
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  inputSection: {
    marginBottom: SPACING.lg,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  // previewCard: {
  //   marginTop: SPACING.sm,
  //   padding: 0,
  //   overflow: 'hidden',
  // },
  // previewImage: {
  //   width: '100%',
  //   height: 180,
  //   borderRadius: 12,
  // },
  recipeInputCard: {
    marginBottom: SPACING.lg,
  },
  recipeInput: {
    fontSize: 16,
    color: COLORS.text,
    minHeight: 100,
    marginBottom: SPACING.md,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  analyzeButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  resultsSection: {
    marginTop: SPACING.sm,
  },
  resultCard: {
    marginBottom: SPACING.md,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  ingredientItem: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  ingredientCard: {
    marginBottom: SPACING.sm,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  ingredientMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  macroText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  nutritionCard: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  nutritionValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
