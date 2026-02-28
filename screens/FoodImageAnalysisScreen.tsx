import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Card, ScreenContainer } from '../components';
import { COLORS, SPACING } from '../constants/theme';
import { MOCK_FOOD_ANALYSIS } from '../constants/mockData';

export function FoodImageAnalysisScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<typeof MOCK_FOOD_ANALYSIS | null>(null);

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
        setAnalysisResult(MOCK_FOOD_ANALYSIS);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Food Image Analysis</Text>
      <Text style={styles.subtitle}>Upload or take a photo to analyze</Text>

      {/* Image Picker Buttons */}
      <View style={styles.pickerRow}>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => pickImage(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="images" size={32} color={COLORS.primary} />
          <Text style={styles.pickerButtonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => pickImage(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={32} color={COLORS.primary} />
          <Text style={styles.pickerButtonText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Preview & Results */}
      {imageUri && (
        <Card style={styles.previewCard}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
        </Card>
      )}

      {analysisResult && (
        <>
          <Card style={styles.resultCard}>
            <Text style={styles.resultTitle}>Detected Food</Text>
            <Text style={styles.foodName}>{analysisResult.foodName}</Text>
          </Card>

          <Card style={styles.resultCard}>
            <Text style={styles.resultTitle}>Estimated Ingredients</Text>
            {analysisResult.ingredients.map((ing, i) => (
              <Text key={i} style={styles.ingredient}>
                • {ing}
              </Text>
            ))}
          </Card>

          <Card style={styles.resultCard}>
            <Text style={styles.resultTitle}>Nutrition Facts</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Ionicons name="flame" size={20} color={COLORS.accent} />
                <Text style={styles.nutritionValue}>{analysisResult.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Ionicons name="fitness" size={20} color={COLORS.primary} />
                <Text style={styles.nutritionValue}>{analysisResult.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Ionicons name="nutrition" size={20} color={COLORS.secondary} />
                <Text style={styles.nutritionValue}>{analysisResult.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Ionicons name="water" size={20} color={COLORS.accent} />
                <Text style={styles.nutritionValue}>{analysisResult.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </Card>
        </>
      )}
    </ScreenContainer>
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
  pickerRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  previewCard: {
    marginBottom: SPACING.md,
    padding: 0,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  resultCard: {
    marginBottom: SPACING.md,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  foodName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  ingredient: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  nutritionItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 'auto',
  },
});
