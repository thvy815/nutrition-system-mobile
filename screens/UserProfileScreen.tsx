import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ScreenContainer } from '../components';
import { COLORS, SPACING } from '../constants/theme';
import { MOCK_USER_PROFILE } from '../constants/mockData';
import type { HealthGoal, ActivityLevel } from '../types';

const GOAL_OPTIONS: { value: HealthGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'gain_weight', label: 'Gain Weight' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'build_muscle', label: 'Build Muscle' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

export function UserProfileScreen() {
  const [profile, setProfile] = useState(MOCK_USER_PROFILE);
  const [dietaryInput, setDietaryInput] = useState(
    profile.dietaryRestrictions.join(', ')
  );

  const updateProfile = <K extends keyof typeof profile>(
    key: K,
    value: (typeof profile)[K]
  ) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Manage your health preferences</Text>

      {/* Basic Info */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={String(profile.age)}
            onChangeText={(v) => updateProfile('age', parseInt(v, 10) || 0)}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderButton,
                  profile.gender === g && styles.genderButtonActive,
                ]}
                onPress={() => updateProfile('gender', g)}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    profile.gender === g && styles.genderButtonTextActive,
                  ]}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={String(profile.height)}
            onChangeText={(v) => updateProfile('height', parseInt(v, 10) || 0)}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={String(profile.weight)}
            onChangeText={(v) => updateProfile('weight', parseInt(v, 10) || 0)}
            keyboardType="decimal-pad"
          />
        </View>
      </Card>

      {/* Activity Level */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Activity Level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ACTIVITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                profile.activityLevel === opt.value && styles.chipActive,
              ]}
              onPress={() => updateProfile('activityLevel', opt.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  profile.activityLevel === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* Health Goal */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Health Goal</Text>
        <View style={styles.goalGrid}>
          {GOAL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.goalButton,
                profile.healthGoal === opt.value && styles.goalButtonActive,
              ]}
              onPress={() => updateProfile('healthGoal', opt.value)}
            >
              <Ionicons
                name={
                  opt.value === 'lose_weight'
                    ? 'trending-down'
                    : opt.value === 'gain_weight'
                    ? 'trending-up'
                    : opt.value === 'maintain'
                    ? 'remove'
                    : 'barbell'
                }
                size={20}
                color={
                  profile.healthGoal === opt.value ? '#FFF' : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.goalButtonText,
                  profile.healthGoal === opt.value && styles.goalButtonTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Dietary Restrictions */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. gluten-free, vegan, nut allergy"
          placeholderTextColor={COLORS.textMuted}
          value={dietaryInput}
          onChangeText={(v) => {
            setDietaryInput(v);
            updateProfile(
              'dietaryRestrictions',
              v.split(',').map((s) => s.trim()).filter(Boolean)
            );
          }}
          multiline
        />
      </Card>
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
  card: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  inputRow: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genderButtonTextActive: {
    color: '#FFF',
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  goalButtonActive: {
    backgroundColor: COLORS.primary,
  },
  goalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  goalButtonTextActive: {
    color: '#FFF',
  },
});
