import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ScreenContainer } from '../components';
import { COLORS, SPACING } from '../constants/theme';
import { MOCK_RECIPE_ANALYSIS } from '../constants/mockData';

export function RecipeAnalysisScreen() {
  const [recipeText, setRecipeText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<typeof MOCK_RECIPE_ANALYSIS | null>(null);

  const handleAnalyze = () => {
    if (recipeText.trim()) {
      setAnalysisResult(MOCK_RECIPE_ANALYSIS);
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      <Text style={styles.title}>Recipe Analysis</Text>
      <Text style={styles.subtitle}>Paste your recipe to get nutrition breakdown</Text>

      <Card style={styles.inputCard}>
        <TextInput
          style={styles.input}
          placeholder="Paste your recipe here..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={6}
          value={recipeText}
          onChangeText={setRecipeText}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.analyzeButton, !recipeText.trim() && styles.analyzeButtonDisabled]}
          onPress={handleAnalyze}
          disabled={!recipeText.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="analytics" size={20} color="#FFF" />
          <Text style={styles.analyzeButtonText}>Analyze Recipe</Text>
        </TouchableOpacity>
      </Card>

      {analysisResult && (
        <>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {analysisResult.ingredients.map((ing, i) => (
            <Card key={i} style={styles.ingredientCard}>
              <Text style={styles.ingredientName}>{ing.name}</Text>
              <View style={styles.ingredientMacros}>
                <Text style={styles.macroText}>{ing.calories} cal</Text>
                <Text style={styles.macroText}>P: {ing.protein}g</Text>
                <Text style={styles.macroText}>C: {ing.carbs}g</Text>
                <Text style={styles.macroText}>F: {ing.fat}g</Text>
              </View>
            </Card>
          ))}

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Nutrition</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Ionicons name="flame" size={24} color={COLORS.accent} />
                <Text style={styles.summaryValue}>{analysisResult.totalCalories}</Text>
                <Text style={styles.summaryLabel}>Calories</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="fitness" size={24} color={COLORS.primary} />
                <Text style={styles.summaryValue}>{analysisResult.totalProtein}g</Text>
                <Text style={styles.summaryLabel}>Protein</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="nutrition" size={24} color={COLORS.secondary} />
                <Text style={styles.summaryValue}>{analysisResult.totalCarbs}g</Text>
                <Text style={styles.summaryLabel}>Carbs</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="water" size={24} color={COLORS.accent} />
                <Text style={styles.summaryValue}>{analysisResult.totalFat}g</Text>
                <Text style={styles.summaryLabel}>Fat</Text>
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
  inputCard: {
    marginBottom: SPACING.lg,
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
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
    gap: SPACING.md,
  },
  macroText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryCard: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
