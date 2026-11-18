import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../contexts/WorkoutContext';
import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
  StatTile,
} from '../components';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { workoutService } from '../services/workout.service';
import { WorkoutSessionData } from '../types/workout';
import { exerciseService } from '../services/exercise.service';
import { ExerciseDetail } from '../types/exercise';

const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>/g, '') : '';
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const DIFFICULTY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface SessionState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  completedSets: number;
  completedReps: number;
}

interface ExerciseSet {
  setNumber: number;
  reps: string;
  restSeconds?: number;
}

/* ------------------------------------------------------------------ */
/* Sub-components (memo để không render lại mỗi giây theo timer)       */
/* ------------------------------------------------------------------ */

const ImageCarousel = memo(function ImageCarousel({ images }: { images?: string[] }) {
  const [pageWidth, setPageWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const list = images ?? [];

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setPageWidth(e.nativeEvent.layout.width);
  }, []);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!pageWidth) return;
      setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
    },
    [pageWidth]
  );

  if (list.length === 0) {
    return (
      <View style={[styles.imageCard, styles.emptyImage]}>
        <MaterialCommunityIcons name="image-off-outline" size={44} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>Không có hình ảnh</Text>
      </View>
    );
  }

  return (
    <View style={styles.imageCard} onLayout={onLayout}>
      {pageWidth > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={onMomentumEnd}
        >
          {list.map((img, index) => (
            <View key={index} style={{ width: pageWidth }}>
              <Image source={{ uri: img }} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.image} />
      )}
      {list.length > 1 ? (
        <View style={styles.dots}>
          {list.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
});

const CounterGroup = memo(function CounterGroup({
  label,
  onDecrease,
  onIncrease,
}: {
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.counterGroup}>
      <Text style={styles.counterLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.counterControl}>
        <TouchableOpacity
          style={styles.minusBtn}
          onPress={onDecrease}
          accessibilityRole="button"
          accessibilityLabel={`Giảm ${label}`}
        >
          <MaterialCommunityIcons name="minus" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.plusBtn}
          onPress={onIncrease}
          accessibilityRole="button"
          accessibilityLabel={`Tăng ${label}`}
        >
          <MaterialCommunityIcons name="plus" size={18} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const DifficultyPicker = memo(function DifficultyPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.difficulty}>
      <View style={styles.difficultyHeader}>
        <Text style={styles.difficultyTitle}>Độ khó</Text>
        <Text style={styles.difficultyValue}>{value}/10</Text>
      </View>
      <View style={styles.difficultyRow}>
        {DIFFICULTY_VALUES.map((v) => {
          const active = value === v;
          return (
            <TouchableOpacity
              key={v}
              style={[styles.difficultyBtn, active && styles.difficultyBtnActive]}
              onPress={() => onChange(v)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.difficultyText, active && styles.difficultyTextActive]}>{v}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

/** Phần thông tin tĩnh của bài tập: hướng dẫn, dụng cụ, nhóm cơ. */
const ExerciseInfo = memo(function ExerciseInfo({ exercise }: { exercise: ExerciseDetail }) {
  const description = useMemo(() => stripHtml(exercise.description), [exercise.description]);
  const hasPrimary = !!exercise.muscles && exercise.muscles.length > 0;
  const hasSecondary = !!exercise.muscles_secondary && exercise.muscles_secondary.length > 0;

  return (
    <>
      {/* Description */}
      {exercise.description ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hướng dẫn</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      ) : null}

      {/* Equipment Info */}
      {exercise.equipment && exercise.equipment.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dụng cụ cần thiết</Text>
          <View style={styles.tagRow}>
            {exercise.equipment.map((eq) => (
              <Badge key={eq.id} label={eq.name} tone="info" icon="construct-outline" />
            ))}
          </View>
        </View>
      ) : null}

      {/* Muscle Groups */}
      {hasPrimary || hasSecondary ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nhóm cơ tác động</Text>

          {hasPrimary ? (
            <>
              <Text style={styles.subTitle}>Nhóm cơ chính</Text>
              <View style={styles.tagRow}>
                {exercise.muscles.map((muscle) => (
                  <Badge key={muscle.id} label={muscle.name_en} tone="success" />
                ))}
              </View>
            </>
          ) : null}

          {hasSecondary ? (
            <>
              <Text style={styles.subTitle}>Nhóm cơ phụ</Text>
              <View style={styles.tagRow}>
                {exercise.muscles_secondary.map((muscle) => (
                  <Badge key={muscle.id} label={muscle.name_en} tone="neutral" />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}
    </>
  );
});

/* ------------------------------------------------------------------ */

export const WorkoutSessionScreen = ({ route, navigation }: any) => {
  const { dayNumber, exerciseId } = route?.params || {};
  const { user } = useAuth();
  const { plan } = useWorkout();

  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<WorkoutSessionData | null>(null);
  const [perceivedDifficulty, setPerceivedDifficulty] = useState(6);
  const [sessionState, setSessionState] = useState<SessionState>({
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
    completedSets: 0,
    completedReps: 0,
  });

  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionId = useRef<string | null>(null);

  // Get exercise details and sets info (memo: không tính lại mỗi tick của timer)
  const exerciseDetailsFromDay = useMemo(
    () =>
      plan?.days
        .find(d => d.day === dayNumber)
        ?.exerciseDetails?.find(e => e.exerciseId === exerciseId),
    [plan, dayNumber, exerciseId]
  );

  const sets: ExerciseSet[] = useMemo(
    () =>
      exerciseDetailsFromDay?.sets
        ? Array.from({ length: exerciseDetailsFromDay.sets }, (_, i) => ({
            setNumber: i + 1,
            reps: exerciseDetailsFromDay.reps || '8-12',
            restSeconds: 60, // Default rest between sets
          }))
        : [],
    [exerciseDetailsFromDay]
  );

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      setLoading(true);
      const data = await exerciseService.getExerciseDetail(exerciseId);
      setExercise(data);
    } catch (err) {
      setError('Không thể tải thông tin bài tập');
      console.error('Error loading exercise:', err);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      
      if (!user?._id || !exerciseId || !plan?._id) {
        Alert.alert('Lỗi', 'Thiếu thông tin người dùng, bài tập hoặc kế hoạch tập');
        return;
      }

      const sessionData = await workoutService.startWorkoutSession({
        userId: user._id,
        planId: plan._id,
        day: dayNumber,
        exerciseId,
      });
      
      sessionId.current = sessionData._id;
      setSession(sessionData);
      
      setSessionState(prev => ({
        ...prev,
        isRunning: true,
        isPaused: false,
        elapsedSeconds: 0,
        completedSets: 0,
        completedReps: 0,

      }));
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể bắt đầu buổi tập');
      console.error('Error starting session:', err);
    }
  };

  const togglePause = async () => {
    if (!sessionState.isRunning) return;

    if (!sessionState.isPaused) {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }

      setSessionState(prev => ({
        ...prev,
        isPaused: true,
      }));
    } else {
      setSessionState(prev => ({
        ...prev,
        isPaused: false,
      }));

      startTimer();
    }
  };

  const startTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    timerInterval.current = setInterval(() => {
      setSessionState(prev => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
  };

  useEffect(() => {
    if (sessionState.isRunning && !sessionState.isPaused) {
      startTimer();
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [sessionState.isRunning, sessionState.isPaused]);

  const decreaseRep = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      completedReps: Math.max(0, prev.completedReps - 1),
    }));
  }, []);

  const decreaseSet = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      completedSets: Math.max(0, prev.completedSets - 1),
    }));
  }, []);

  const isOverTraining = (nextSets: number, nextReps: number) => {
    const targetSets = exerciseDetailsFromDay?.sets || 3;

    const targetRepsText = exerciseDetailsFromDay?.reps || '8-12';
    const maxTargetReps =
      Number(targetRepsText.toString().split('-').pop()) || 12;

    const targetTotalReps = targetSets * maxTargetReps;
    const targetDurationMinutes = exerciseDetailsFromDay?.duration || 8;

    const elapsedMinutes = sessionState.elapsedSeconds / 60;

    const progressByTime =
      Math.max(elapsedMinutes / targetDurationMinutes, 0.1);

    const allowedRepsByTime =
      Math.ceil(targetTotalReps * progressByTime * 1.5);

    const allowedSetsByTime =
      Math.ceil(targetSets * progressByTime * 1.5);

    return (
      nextReps > allowedRepsByTime ||
      nextSets > allowedSetsByTime ||
      nextReps > targetTotalReps * 1.3 ||
      nextSets > targetSets + 1
    );
  };

  const showOverTrainingAlert = () => {
    Alert.alert(
      'Cảnh báo dữ liệu bất thường',
      'Số set hoặc rep đang tăng nhanh hơn mức hợp lý so với thời gian tập. Vui lòng kiểm tra lại để tránh nhập nhầm hoặc tập quá sức.',
      [{ text: 'Đã hiểu' }]
    );
  };

  const increaseRep = () => {
    const nextReps = sessionState.completedReps + 1;
    const nextSets = sessionState.completedSets;

    if (isOverTraining(nextSets, nextReps)) {
      showOverTrainingAlert();
      return;
    }

    setSessionState(prev => ({
      ...prev,
      completedReps: nextReps,
    }));
  };

  const increaseSet = () => {
    const nextSets = sessionState.completedSets + 1;
    const nextReps = sessionState.completedReps;

    if (isOverTraining(nextSets, nextReps)) {
      showOverTrainingAlert();
      return;
    }

    setSessionState(prev => ({
      ...prev,
      completedSets: nextSets,
    }));
  };

  const checkOverTrainingWarning = () => {
    const targetSets = exerciseDetailsFromDay?.sets || 3;

    const targetRepsText = exerciseDetailsFromDay?.reps || '8-12';
    const maxTargetReps =
      Number(targetRepsText.toString().split('-').pop()) || 12;

    const targetTotalReps = targetSets * maxTargetReps;

    const targetDurationMinutes =
      exerciseDetailsFromDay?.duration || 8;

    const elapsedMinutes =
      sessionState.elapsedSeconds / 60;

    const completedReps = sessionState.completedReps;
    const completedSets = sessionState.completedSets;

    const progressByTime =
      Math.max(elapsedMinutes / targetDurationMinutes, 0.1);

    const allowedRepsByTime =
      Math.ceil(targetTotalReps * progressByTime * 1.5);

    const allowedSetsByTime =
      Math.ceil(targetSets * progressByTime * 1.5);

    const repsTooFast =
      completedReps > allowedRepsByTime;

    const setsTooFast =
      completedSets > allowedSetsByTime;

    const repsTooMuch =
      completedReps > targetTotalReps * 1.3;

    const setsTooMuch =
      completedSets > targetSets + 1;

    return (
      repsTooFast ||
      setsTooFast ||
      repsTooMuch ||
      setsTooMuch
    );
  };

  const stopSession = async () => {
    if (checkOverTrainingWarning()) {
      Alert.alert(
        'Cảnh báo dữ liệu bất thường',
        'Bạn đang ghi nhận số set hoặc rep cao hơn mức hợp lý so với thời gian tập. Vui lòng kiểm tra lại để tránh nhập nhầm hoặc tập quá sức.',
        [
          { text: 'Kiểm tra lại', style: 'cancel' },
          {
            text: 'Vẫn lưu',
            style: 'destructive',
            onPress: submitStopSession,
          },
        ]
      );

      return;
    }

    submitStopSession();
  };

  const submitStopSession = async () => {
    try {
      if (!sessionId.current) return;

      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      
      const result = await workoutService.stopWorkoutSession({ 
        sessionId: sessionId.current, 
        completedSets: sessionState.completedSets, 
        completedReps: sessionState.completedReps, 
        perceivedDifficulty,
      });
      
      Alert.alert(
        'Buổi tập kết thúc',
        `Thời gian: ${Math.round(result.durationMinutes || 0)} phút\n` +
        `Calo đốt cháy: ${Math.round(result.actualCalories || 0)} kcal\n` +
        `Độ khó: ${perceivedDifficulty}/10`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      setSession(null);
      sessionId.current = null;

      setSessionState({
        isRunning: false,
        isPaused: false,
        elapsedSeconds: 0,
        completedSets: 0,
        completedReps: 0,
      });
      setPerceivedDifficulty(6);
    } catch (err) {
      console.error('Error stopping session:', err);
      Alert.alert('Lỗi', 'Không thể kết thúc buổi tập');
    }
  };

  // Giữ tham chiếu tới stopSession mới nhất để handler quay lại ổn định giữa các tick.
  const stopSessionRef = useRef(stopSession);
  stopSessionRef.current = stopSession;

  const isRunning = sessionState.isRunning;
  const handleBack = useCallback(() => {
    if (isRunning) {
      Alert.alert(
        'Xác nhận',
        'Bạn đang trong buổi tập. Bấm dừng để kết thúc hoặc tiếp tục tập?',
        [
          { text: 'Tiếp tục tập', style: 'cancel' },
          {
            text: 'Dừng lại',
            style: 'destructive',
            onPress: () => stopSessionRef.current(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [isRunning, navigation]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  if (loading) {
    return (
      <ScreenContainer header={<ScreenHeader title="Buổi tập" onBack={goBack} />}>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (error || !exercise) {
    return (
      <ScreenContainer header={<ScreenHeader title="Buổi tập" onBack={goBack} />}>
        <ErrorState message={error || 'Không tìm thấy bài tập'} />
        <Button title="Quay lại" variant="outline" icon="arrow-back" onPress={goBack} />
      </ScreenContainer>
    );
  }

  const hasStarted = session !== null && sessionState.isRunning;
  const restSeconds = sets[Math.max(sessionState.completedSets, 0)]?.restSeconds || 60;

  return (
    <ScreenContainer header={<ScreenHeader title={exercise.name} onBack={handleBack} />}>
      {/* Exercise Image */}
      <ImageCarousel images={exercise.images} />

      {/* Video Section */}
      {exercise.videos && exercise.videos.length > 0 && (
        <TouchableOpacity style={styles.videoRow} activeOpacity={0.8}>
          <MaterialCommunityIcons name="play-circle" size={28} color={COLORS.primary} />
          <Text style={styles.videoText} numberOfLines={1}>
            Xem video hướng dẫn ({exercise.videos.length})
          </Text>
        </TouchableOpacity>
      )}

      {/* Exercise Info */}
      <View style={styles.infoRow}>
        <StatTile icon="repeat" label="Sets" value={exerciseDetailsFromDay?.sets || '3'} />
        <StatTile icon="barbell-outline" label="Reps" value={exerciseDetailsFromDay?.reps || '8-12'} />
        <StatTile
          icon="time-outline"
          label="Thời gian"
          value={exerciseDetailsFromDay?.duration || '-'}
          unit="phút"
        />
      </View>

      {/* Timer Section */}
      {hasStarted && (
        <View style={styles.workoutCard}>
          <Text style={styles.timer}>{formatTime(sessionState.elapsedSeconds)}</Text>
          {sessionState.isPaused ? (
            <Badge label="Đã tạm dừng" tone="warning" icon="pause" style={styles.pausedBadge} />
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Sets</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {sessionState.completedSets}/{sets.length || 3}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Reps</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {sessionState.completedReps}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Nghỉ</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {restSeconds}s
              </Text>
            </View>
          </View>

          <View style={styles.counterRow}>
            <CounterGroup label="Sets" onDecrease={decreaseSet} onIncrease={increaseSet} />
            <CounterGroup label="Reps" onDecrease={decreaseRep} onIncrease={increaseRep} />
          </View>

          <DifficultyPicker value={perceivedDifficulty} onChange={setPerceivedDifficulty} />

          <View style={styles.actionRow}>
            <Button
              title={sessionState.isPaused ? 'Tiếp tục' : 'Tạm dừng'}
              icon={sessionState.isPaused ? 'play' : 'pause'}
              variant={sessionState.isPaused ? 'primary' : 'secondary'}
              onPress={togglePause}
              style={styles.actionBtn}
            />
            <Button
              title="Dừng"
              icon="stop-circle"
              variant="danger"
              onPress={stopSession}
              style={styles.actionBtn}
            />
          </View>
        </View>
      )}

      {!hasStarted && (
        <Button
          title="BẮT ĐẦU TẬP"
          icon="play"
          onPress={startSession}
          fullWidth
          style={styles.startButton}
        />
      )}

      <ExerciseInfo exercise={exercise} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  /* Image carousel */
  imageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  emptyImage: {
    aspectRatio: 4 / 3,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* Video + info */
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primarySoft,
    borderRadius: BORDER_RADIUS.lg,
  },
  videoText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primaryDark,
    flexShrink: 1,
    minWidth: 0,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },

  /* Workout (timer) card */
  workoutCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    ...SHADOWS.md,
  },
  timer: {
    ...TYPOGRAPHY.display,
    // Đồng hồ cần cỡ lớn hơn thang chữ chuẩn; dùng chữ số đều để không "nhảy" khi đếm.
    fontSize: TYPOGRAPHY.display.fontSize + 16,
    lineHeight: TYPOGRAPHY.display.lineHeight + 18,
    fontVariant: ['tabular-nums'],
    color: COLORS.primary,
    textAlign: 'center',
  },
  pausedBadge: {
    alignSelf: 'center',
    marginTop: -SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxs,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  counterRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
  },
  counterGroup: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  counterLabel: {
    ...TYPOGRAPHY.captionStrong,
    color: COLORS.text,
    textAlign: 'center',
  },
  counterControl: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  minusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficulty: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyTitle: {
    ...TYPOGRAPHY.captionStrong,
    color: COLORS.text,
  },
  difficultyValue: {
    ...TYPOGRAPHY.captionStrong,
    color: COLORS.primary,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  difficultyBtn: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  difficultyText: {
    ...TYPOGRAPHY.captionStrong,
    color: COLORS.text,
  },
  difficultyTextActive: {
    color: COLORS.textInverse,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
  },
  actionBtn: {
    flex: 1,
  },
  startButton: {
    marginTop: SPACING.md,
  },

  /* Static info cards */
  card: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  subTitle: {
    ...TYPOGRAPHY.captionStrong,
    color: COLORS.textSecondary,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
});
