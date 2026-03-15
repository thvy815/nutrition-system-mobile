import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ScreenContainer } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING } from '../constants/theme';
import { MOCK_USER_PROFILE } from '../constants/mockData';
import type { HealthGoal, ActivityLevel, UserProfile } from '../types';
import { fetchCurrentUser } from '../services/auth';
import type { ApiError } from '../services/api';

const GOAL_OPTIONS: { value: HealthGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Giảm cân' },
  { value: 'gain_weight', label: 'Tăng cân' },
  { value: 'maintain', label: 'Duy trì' },
  { value: 'build_muscle', label: 'Tăng cơ' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Ít vận động' },
  { value: 'light', label: 'Nhẹ nhàng' },
  { value: 'moderate', label: 'Trung bình' },
  { value: 'active', label: 'Năng động' },
  { value: 'very_active', label: 'Rất năng động' },
];

export function UserProfileScreen() {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [dietaryInput, setDietaryInput] = useState(
    profile.dietaryRestrictions.join(', ')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const me = await fetchCurrentUser(token);
        if (!isMounted) return;

        const mapped: UserProfile = {
          ...profile,
          age: me.age ?? profile.age,
          gender: (me.gender as UserProfile['gender']) ?? profile.gender,
          height: me.height ?? profile.height,
          weight: me.weight ?? profile.weight,
          activityLevel: profile.activityLevel,
          healthGoal: (me.goal as HealthGoal) ?? profile.healthGoal,
          dietaryRestrictions: me.allergies ?? profile.dietaryRestrictions,
        };

        setProfile(mapped);
        setDietaryInput((me.allergies ?? []).join(', '));
        setError(null);
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.status === 401) {
          setError('Không thể lấy thông tin người dùng (401 - chưa xác thực).');
        } else {
          setError(apiError.message || 'Không thể tải hồ sơ người dùng');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const updateProfile = <K extends keyof typeof profile>(
    key: K,
    value: (typeof profile)[K]
  ) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Hồ sơ</Text>
      <Text style={styles.subtitle}>Quản lý thông tin sức khỏe của bạn</Text>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      )}
      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {/* Basic Info */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Tuổi</Text>
          <TextInput
            style={styles.input}
            value={String(profile.age)}
            onChangeText={(v) => updateProfile('age', parseInt(v, 10) || 0)}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Giới tính</Text>
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
                  {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Chiều cao (cm)</Text>
          <TextInput
            style={styles.input}
            value={String(profile.height)}
            onChangeText={(v) => updateProfile('height', parseInt(v, 10) || 0)}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Cân nặng (kg)</Text>
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
        <Text style={styles.sectionTitle}>Mức độ vận động</Text>
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
        <Text style={styles.sectionTitle}>Mục tiêu sức khỏe</Text>
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
        <Text style={styles.sectionTitle}>Chế độ ăn kiêng</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="VD: không gluten, chay, dị ứng hạt"
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

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out" size={22} color={COLORS.error} />
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});
