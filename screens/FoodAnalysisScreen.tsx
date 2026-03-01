import React, { useState } from 'react';
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
import { MOCK_FOOD_ANALYSIS, MOCK_RECIPE_ANALYSIS } from '../constants/mockData';
import type { FoodAnalysisResult, RecipeAnalysisResult } from '../types';

type InputMode = 'image' | 'recipe';

export function FoodAnalysisScreen() {
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recipeText, setRecipeText] = useState('');
  const [imageResult, setImageResult] = useState<FoodAnalysisResult | null>(null);
  const [recipeResult, setRecipeResult] = useState<RecipeAnalysisResult | null>(null);

  const pickImage = async (useCamera: boolean) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setImageResult(MOCK_FOOD_ANALYSIS);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleAnalyzeRecipe = () => {
    if (recipeText.trim()) {
      setRecipeResult(MOCK_RECIPE_ANALYSIS);
    }
  };

  const handleSwitchMode = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === 'image') {
      setRecipeText('');
      setRecipeResult(null);
    } else {
      setImageUri(null);
      setImageResult(null);
    }
  };

  const hasResult = imageResult || recipeResult;

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
              style={styles.pickerButton}
              onPress={() => pickImage(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="images" size={28} color={COLORS.primary} />
              <Text style={styles.pickerButtonText}>Thư viện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => pickImage(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={28} color={COLORS.primary} />
              <Text style={styles.pickerButtonText}>Chụp ảnh</Text>
            </TouchableOpacity>
          </View>
          {imageUri && (
            <Card style={styles.previewCard}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            </Card>
          )}
        </View>
      ) : (
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
            style={[styles.analyzeButton, !recipeText.trim() && styles.analyzeButtonDisabled]}
            onPress={handleAnalyzeRecipe}
            disabled={!recipeText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="analytics" size={20} color="#FFF" />
            <Text style={styles.analyzeButtonText}>Phân tích</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Results */}
      {hasResult && (
        <View style={styles.resultsSection}>
          {imageResult && (
            <>
              <Card style={styles.resultCard}>
                <Text style={styles.resultLabel}>Món ăn phát hiện</Text>
                <Text style={styles.resultTitle}>{imageResult.foodName}</Text>
              </Card>

              <Card style={styles.resultCard}>
                <Text style={styles.resultLabel}>Nguyên liệu dự kiến</Text>
                {imageResult.ingredients.map((ing, i) => (
                  <Text key={i} style={styles.ingredientItem}>
                    • {ing}
                  </Text>
                ))}
              </Card>

              <NutritionSummaryCard
                calories={imageResult.calories}
                protein={imageResult.protein}
                carbs={imageResult.carbs}
                fat={imageResult.fat}
              />
            </>
          )}

          {recipeResult && (
            <>
              <Text style={styles.sectionTitle}>Nguyên liệu</Text>
              {recipeResult.ingredients.map((ing, i) => (
                <Card key={i} style={styles.ingredientCard}>
                  <Text style={styles.ingredientName}>{ing.name}</Text>
                  <View style={styles.ingredientMacros}>
                    <Text style={styles.macroText}>{ing.calories} calo</Text>
                    <Text style={styles.macroText}>Đạm: {ing.protein}g</Text>
                    <Text style={styles.macroText}>Tinh bột: {ing.carbs}g</Text>
                    <Text style={styles.macroText}>Béo: {ing.fat}g</Text>
                  </View>
                </Card>
              ))}

              <NutritionSummaryCard
                calories={recipeResult.totalCalories}
                protein={recipeResult.totalProtein}
                carbs={recipeResult.totalCarbs}
                fat={recipeResult.totalFat}
              />
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
          <Text style={styles.nutritionLabel}>Calo</Text>
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
  previewCard: {
    marginTop: SPACING.sm,
    padding: 0,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
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
