import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
  StatTile,
} from '../components';
import { useAuth } from '../contexts/AuthContext';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { fetchCurrentUser } from '../services/auth';
import type { ApiError } from '../services/api';
import { FitnessLevel, HealthGoal, UserProfile } from '../types/user';

type IconName = keyof typeof Ionicons.glyphMap;

const GOAL_OPTIONS: { value: HealthGoal; label: string; icon: IconName }[] = [
  { value: 'lose_weight', label: 'Giảm cân', icon: 'trending-down' },
  { value: 'gain_weight', label: 'Tăng cân', icon: 'trending-up' },
  { value: 'maintain_weight', label: 'Duy trì', icon: 'remove' },
];

const FITNESS_OPTIONS: { value: FitnessLevel; label: string }[] = [
  { value: 'sedentary', label: 'Ít vận động' },
  { value: 'beginner', label: 'Mới bắt đầu' },
  { value: 'intermediate', label: 'Trung bình' },
  { value: 'advanced', label: 'Nâng cao' },
  { value: 'athlete', label: 'Vận động viên' },
];

const GENDER_OPTIONS: { value: UserProfile['gender']; label: string }[] = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

function getBmiColor(bmi: number) {
  if (bmi < 18.5) return COLORS.warning;
  if (bmi < 25) return COLORS.success;
  return COLORS.error;
}

export function UserProfileScreen() {
  const navigation = useNavigation<any>();
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dietaryInput, setDietaryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const openHealth = useCallback(() => navigation.navigate('Health'), [navigation]);

  const handleLogoutConfirm = useCallback(() => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  }, [logout]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const me = await fetchCurrentUser();
        if (!isMounted) return;

        const mapped: UserProfile = {
          name: me.name,
          email: me.email,
          isEmailVerified: me.isEmailVerified ?? false,

          age: me.age ?? 0,
          gender: (me.gender as UserProfile['gender']) ?? 'female',
          height: me.height ?? 0,
          weight: me.weight ?? 0,

          fitnessLevel: (me.fitnessLevel as FitnessLevel) ?? 'sedentary',
          healthGoal: (me.goal as HealthGoal) ?? 'maintain',
          dietaryRestrictions: me.allergies ?? [],
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

  const updateProfile = useCallback(
    <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
      setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  const handleDietaryChange = useCallback(
    (v: string) => {
      setDietaryInput(v);
      updateProfile(
        'dietaryRestrictions',
        v.split(',').map((s) => s.trim()).filter(Boolean)
      );
    },
    [updateProfile]
  );

  const height = profile?.height ?? 0;
  const weight = profile?.weight ?? 0;
  const bmiValue = useMemo(
    () => (height > 0 ? weight / ((height / 100) ** 2) : 0),
    [height, weight]
  );

  const header = <ScreenHeader title="Hồ sơ" subtitle="Quản lý thông tin sức khỏe của bạn" onBack={handleBack} />;

  if (!profile) {
    return (
      <ScreenContainer header={header} withBottomInset>
        {error && !loading ? <ErrorState message={error} /> : <LoadingState message="Đang tải hồ sơ..." />}
      </ScreenContainer>
    );
  }

  const bmi = bmiValue.toFixed(1); // để hiển thị

  return (
    <ScreenContainer header={header} withBottomInset keyboardAvoiding>
      {loading && <LoadingState message="Đang tải hồ sơ..." style={styles.inlineLoading} />}
      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {/* BMI */}
      <SectionHeader title="Chỉ số cơ thể" icon="body" style={styles.firstSection} />
      <View style={styles.statsRow}>
        <StatTile icon="resize-outline" label="Chiều cao" value={profile.height} unit="cm" color={COLORS.secondary} />
        <StatTile icon="barbell-outline" label="Cân nặng" value={profile.weight} unit="kg" color={COLORS.purple} />
        <StatTile icon="speedometer-outline" label="BMI" value={bmi} color={getBmiColor(bmiValue)} />
      </View>

      {/* Basic Info */}
      <SectionHeader title="Thông tin cơ bản" icon="person-outline" />
      <Card style={styles.cardGap}>
        <View style={styles.doubleRow}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Tên</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(v) => updateProfile('name', v)}
            />
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label}>Tuổi</Text>
            <TextInput
              style={styles.input}
              value={String(profile.age)}
              onChangeText={(v) => updateProfile('age', parseInt(v, 10) || 0)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View>
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((g) => (
              <Chip
                key={g.value}
                label={g.label}
                selected={profile.gender === g.value}
                onPress={() => updateProfile('gender', g.value)}
                style={styles.genderChip}
              />
            ))}
          </View>
        </View>

        <View style={styles.doubleRow}>
          <View style={styles.halfInput}>
            <Text style={styles.label} numberOfLines={1}>
              Chiều cao (cm)
            </Text>
            <TextInput
              style={styles.input}
              value={String(profile.height)}
              onChangeText={(v) => updateProfile('height', parseInt(v, 10) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label} numberOfLines={1}>
              Cân nặng (kg)
            </Text>
            <TextInput
              style={styles.input}
              value={String(profile.weight)}
              onChangeText={(v) => updateProfile('weight', parseInt(v, 10) || 0)}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </Card>

      {/* Activity Level */}
      <SectionHeader title="Mức độ vận động" icon="walk-outline" />
      <Card>
        <View style={styles.chipRow}>
          {FITNESS_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={profile.fitnessLevel === opt.value}
              onPress={() => updateProfile('fitnessLevel', opt.value)}
            />
          ))}
        </View>
      </Card>

      {/* Health Goal */}
      <SectionHeader title="Mục tiêu sức khỏe" icon="flag-outline" />
      <Card>
        <View style={styles.chipRow}>
          {GOAL_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              selected={profile.healthGoal === opt.value}
              onPress={() => updateProfile('healthGoal', opt.value)}
            />
          ))}
        </View>
      </Card>

      {/* Dietary Restrictions */}
      <SectionHeader title="Chế độ ăn kiêng" icon="nutrition-outline" />
      <Card>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="VD: không gluten, chay, dị ứng hạt"
          placeholderTextColor={COLORS.textMuted}
          value={dietaryInput}
          onChangeText={handleDietaryChange}
          multiline
        />
      </Card>

      {/* Account */}
      <SectionHeader title="Tài khoản" icon="mail-outline" />
      <Card style={styles.cardGap}>
        <View style={styles.accountRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.valueText} numberOfLines={1}>
            {profile.email}
          </Text>
        </View>

        <View style={styles.accountRow}>
          <Text style={styles.label}>Trạng thái</Text>
          <Badge
            label={profile.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
            tone={profile.isEmailVerified ? 'success' : 'warning'}
            icon={profile.isEmailVerified ? 'checkmark-circle' : 'alert-circle'}
          />
        </View>
      </Card>

      {/* Google Health */}
      <SectionHeader title="Kết nối" icon="link-outline" />
      <TouchableOpacity
        style={styles.linkCard}
        onPress={openHealth}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Google Health"
      >
        <View style={styles.linkIcon}>
          <Ionicons name="fitness" size={22} color={COLORS.primaryDark} />
        </View>
        <View style={styles.linkText}>
          <Text style={styles.linkTitle} numberOfLines={1}>
            Google Health
          </Text>
          <Text style={styles.linkSubtitle} numberOfLines={2}>
            Kết nối & đồng bộ dữ liệu vận động
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Button
        title="Đăng xuất"
        icon="log-out-outline"
        variant="danger"
        onPress={handleLogoutConfirm}
        fullWidth
        style={styles.logout}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  firstSection: {
    marginTop: SPACING.sm,
  },
  inlineLoading: {
    paddingVertical: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cardGap: {
    gap: SPACING.md,
  },
  doubleRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
  },
  halfInput: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  genderChip: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  accountRow: {
    gap: SPACING.xxs,
  },
  valueText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
    flexShrink: 1,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  linkText: {
    flex: 1,
    minWidth: 0,
  },
  linkTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  linkSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  logout: {
    marginTop: SPACING.lg,
  },
});
