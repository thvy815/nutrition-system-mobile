/**
 * ExerciseDetailScreen
 * Shows detailed view of a single exercise
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkout } from '../contexts/WorkoutContext';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface ExerciseDetailScreenProps {
  route?: any;
  navigation?: any;
}

const DEFAULT_EXERCISE_IMAGE = 'https://via.placeholder.com/400x300?text=Exercise';
const EXERCISE_DESCRIPTIONS: { [key: string]: string } = {
  'LYING DUMBBELL ROW SS SEATED SHRUG':
    'Bài tập kết hợp giữa dumbbell row nằm và shrug. Giúp cơ lưng trên, vai và bắp tay phát triển.',
  'Deficit Deadlift':
    'Deadlift tại vị trí cao hơn bình thường. Tăng phạm vi chuyển động, giúp cơ cột sống chặt hơn.',
  'Dumbbell Lunges Walking':
    'Động tác lunge với tạ tay, tập luyện cơ chân, mông và cân bằng.',
  'Reverse EZ Bar Cable Curls':
    'Bài tập tập trung vào phía trước cánh tay (brachialis). Sử dụng cáp để giữ căng suốt bài tập.',
  'Decline Bench Press Barbell':
    'Bench press tại góc nghiêng. Tập trung vào phần dưới ngực, cơ tam đầu.',
  'Diagonal Shoulder Press':
    'Shoulder press theo hướng đường chéo. Hoạt động cơ vai từ nhiều góc độ.',
  'Crunches': 'Bài tập cơ bụng cơ bản. Giúp tăng sức mạnh và định nghĩa cơ bụng.',
  'Dumbbell Goblet Squat':
    'Squat với dumbbell nắm như chiếc cốc. Tập luyện toàn bộ cơ chân.',
  'Cross-Bench Dumbbell Pullovers':
    'Pullover ngang ghế với dumbbell. Tập luyện ngực, lưng trên và cơ mở rộng.',
  'Deadlifts': 'Bài tập nâng khối lượng cơ bản. Tập luyện toàn bộ cơ thể.',
  'Decline Bench Press Dumbbell':
    'Bench press tại góc nghiêng với dumbbell. Tập trung vào phần dưới ngực.',
  'Fly With Dumbbells':
    'Bài tập fly với dumbbell. Cô lập cơ ngực, kéo dài cơ thẳng trước.',
};

export const ExerciseDetailScreen: React.FC<ExerciseDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const dayNumber = route?.params?.dayNumber;
  const exerciseId = route?.params?.exerciseId;
  const { plan, completedSessions, markExerciseCompleted } = useWorkout();
  const [imageError, setImageError] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));

  const day = plan?.plan.find(d => d.day === dayNumber);
  const exercise = day?.exercises?.find(e => e.exerciseId === exerciseId);

  const isCompleted = completedSessions.some(
    s => s.dayNumber === dayNumber && s.exerciseId === exerciseId && s.completed
  );

  const handleToggleComplete = async () => {
    // Trigger animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    await markExerciseCompleted(dayNumber, exerciseId);
  };

  if (!exercise) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không tìm thấy bài tập</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={COLORS.surface}
            />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const description = EXERCISE_DESCRIPTIONS[exercise.name] || 'Thực hiện bài tập theo chuẩn kỹ thuật.';

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation?.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        {/* Exercise Image */}
        <View style={styles.imageContainer}>
          {!imageError ? (
            <Image
              source={{ uri: exercise.image || DEFAULT_EXERCISE_IMAGE }}
              style={styles.image}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={64}
                color={COLORS.textMuted}
              />
            </View>
          )}

          {/* Completed Badge */}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <MaterialCommunityIcons
                name="check-circle"
                size={36}
                color={COLORS.success}
              />
            </View>
          )}
        </View>

        {/* Exercise Title */}
        <Text style={[styles.title, isCompleted && styles.completedTitle]}>
          {exercise.name}
        </Text>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={[styles.quickStatBox, SHADOWS.sm]}>
            <MaterialCommunityIcons
              name="repeat"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.quickStatValue}>{exercise.sets}</Text>
            <Text style={styles.quickStatLabel}>Sets</Text>
          </View>

          <View style={[styles.quickStatBox, SHADOWS.sm]}>
            <MaterialCommunityIcons
              name="target"
              size={24}
              color={COLORS.accent}
            />
            <Text style={styles.quickStatValue}>{exercise.reps}</Text>
            <Text style={styles.quickStatLabel}>Reps</Text>
          </View>

          <View style={[styles.quickStatBox, SHADOWS.sm]}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={COLORS.secondary}
            />
            <Text style={styles.quickStatValue}>{exercise.duration}</Text>
            <Text style={styles.quickStatLabel}>Phút</Text>
          </View>

          <View style={[styles.quickStatBox, SHADOWS.sm]}>
            <MaterialCommunityIcons
              name="fire"
              size={24}
              color={COLORS.error}
            />
            <Text style={styles.quickStatValue}>{exercise.calories}</Text>
            <Text style={styles.quickStatLabel}>Kcal</Text>
          </View>
        </View>

        {/* Detailed Info */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>

          <View style={[styles.infoCard, SHADOWS.sm]}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons
                  name="repeat"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số set</Text>
                <Text style={styles.infoValue}>{exercise.sets} set</Text>
              </View>
            </View>
          </View>

          <View style={[styles.infoCard, SHADOWS.sm]}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons
                  name="target"
                  size={20}
                  color={COLORS.accent}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số lần lặp lại</Text>
                <Text style={styles.infoValue}>{exercise.reps} lần</Text>
              </View>
            </View>
          </View>

          <View style={[styles.infoCard, SHADOWS.sm]}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Thời lượng</Text>
                <Text style={styles.infoValue}>{exercise.duration} phút</Text>
              </View>
            </View>
          </View>

          <View style={[styles.infoCard, SHADOWS.sm]}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons
                  name="fire"
                  size={20}
                  color={COLORS.error}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Calo tiêu thụ</Text>
                <Text style={styles.infoValue}>{exercise.calories} kcal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Hướng dẫn</Text>
          <View style={[styles.descriptionBox, SHADOWS.sm]}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Mẹo</Text>
          <View style={[styles.tipBox, SHADOWS.sm]}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={20}
              color={COLORS.warning}
            />
            <Text style={styles.tipText}>
              Hãy chắc chắn rằng bạn sử dụng trọng lượng phù hợp và duy trì hình thức tốt.
            </Text>
          </View>
          <View style={[styles.tipBox, SHADOWS.sm]}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={20}
              color={COLORS.warning}
            />
            <Text style={styles.tipText}>
              Hít thở sâu và kiểm soát từng lần nâng. Tốc độ chậm = kết quả tốt hơn.
            </Text>
          </View>
          <View style={[styles.tipBox, SHADOWS.sm]}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={20}
              color={COLORS.warning}
            />
            <Text style={styles.tipText}>
              Nếu cảm thấy đau, hãy giảm trọng lượng hoặc dừng bài tập.
            </Text>
          </View>
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={[styles.completeButton, isCompleted && styles.completedButton]}
          onPress={handleToggleComplete}
        >
          <MaterialCommunityIcons
            name={isCompleted ? 'check-circle' : 'play-circle'}
            size={24}
            color={COLORS.surface}
          />
          <Text style={styles.completeButtonText}>
            {isCompleted ? 'Đã hoàn thành' : 'Hoàn thành bài tập'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.error,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  imageContainer: {
    marginHorizontal: -SPACING.md,
    marginBottom: SPACING.lg,
    position: 'relative',
    backgroundColor: COLORS.background,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  completedBadge: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: `${COLORS.success}20`,
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    lineHeight: 32,
  },
  completedTitle: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickStatBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  quickStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
  detailsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoLeft: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  descriptionSection: {
    marginBottom: SPACING.lg,
  },
  descriptionBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  tipsSection: {
    marginBottom: SPACING.lg,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: `${COLORS.warning}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
  },
  completedButton: {
    backgroundColor: COLORS.success,
    opacity: 0.7,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
