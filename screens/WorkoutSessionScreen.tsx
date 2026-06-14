import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { workoutService } from '../services/workout.service';
import { WorkoutSessionData } from '../types/workout';
import { exerciseService } from '../services/exercise.service';
import { ExerciseDetail } from '../types/exercise';

const { width, height } = Dimensions.get('window');

const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>/g, '') : '';
};

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get exercise details and sets info
  const exerciseDetailsFromDay = plan?.days
    .find(d => d.day === dayNumber)
    ?.exerciseDetails?.find(e => e.exerciseId === exerciseId);

  const sets: ExerciseSet[] = exerciseDetailsFromDay?.sets
    ? Array.from({ length: exerciseDetailsFromDay.sets }, (_, i) => ({
        setNumber: i + 1,
        reps: exerciseDetailsFromDay.reps || '8-12',
        restSeconds: 60, // Default rest between sets
      }))
    : [];

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
      console.log('USER:', user);
      console.log('EXERCISE ID:', exerciseId);
      console.log('PLAN:', plan);
      console.log('PLAN ID:', plan?._id);
      
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

  const decreaseRep = () => {
    setSessionState(prev => ({
      ...prev,
      completedReps: Math.max(0, prev.completedReps - 1),
    }));
  };

  const decreaseSet = () => {
    setSessionState(prev => ({
      ...prev,
      completedSets: Math.max(0, prev.completedSets - 1),
    }));
  };

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !exercise) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Không tìm thấy bài tập'}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const hasStarted = session !== null && sessionState.isRunning;

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => {
              if (sessionState.isRunning) {
                Alert.alert(
                  'Xác nhận',
                  'Bạn đang trong buổi tập. Bấm dừng để kết thúc hoặc tiếp tục tập?',
                  [
                    { text: 'Tiếp tục tập', style: 'cancel' },
                    {
                      text: 'Dừng lại',
                      style: 'destructive',
                      onPress: stopSession,
                    },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.surface} />
          </TouchableOpacity>
          <Text style={styles.exerciseTitle}>{exercise.name}</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Exercise Image */}
        <View style={styles.imageWrapper}>
            {exercise.images && exercise.images.length > 0 ? (
                <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                disableIntervalMomentum
                onScroll={(e) => {
                    const index = Math.round(
                    e.nativeEvent.contentOffset.x / width
                    );
                    setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
                >
                {exercise.images.map((img: string, index: number) => (
                    <View
                    key={index}
                    style={{
                        width,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    >
                    <Image source={{ uri: img }} style={styles.image} />
                    </View>
                ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyImage}>
                <MaterialCommunityIcons
                    name="image-off-outline"
                    size={50}
                    color="#999"
                />
                <Text style={styles.emptyText}>Không có hình ảnh</Text>
                </View>
            )}
        </View>

        {/* Video Section */}
        {exercise.videos && exercise.videos.length > 0 && (
          <TouchableOpacity style={styles.videoSection}>
            <MaterialCommunityIcons name="play-circle" size={32} color={COLORS.primary} />
            <Text style={styles.videoText}>Xem video hướng dẫn ({exercise.videos.length})</Text>
          </TouchableOpacity>
        )}

        {/* Exercise Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="repeat" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Sets</Text>
              <Text style={styles.infoValue}>{exerciseDetailsFromDay?.sets || '3'}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="dumbbell" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Reps</Text>
              <Text style={styles.infoValue}>{exerciseDetailsFromDay?.reps || '8-12'}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Thời gian</Text>
              <Text style={styles.infoValue}>{exerciseDetailsFromDay?.duration || '-'} phút</Text>
            </View>
          </View>
        </View>

        {/* Timer Section */}
        {hasStarted && (
          <View style={styles.compactWorkoutCard}>
            <Text style={styles.compactTimer}>
              {formatTime(sessionState.elapsedSeconds)}
            </Text>

            <View style={styles.compactStatsRow}>
              <View style={styles.compactStatBox}>
                <Text style={styles.compactStatLabel}>Sets</Text>
                <Text style={styles.compactStatValue}>
                  {sessionState.completedSets}/{sets.length || 3}
                </Text>
              </View>

              <View style={styles.compactStatBox}>
                <Text style={styles.compactStatLabel}>Reps</Text>
                <Text style={styles.compactStatValue}>
                  {sessionState.completedReps}
                </Text>
              </View>

              <View style={styles.compactStatBox}>
                <Text style={styles.compactStatLabel}>Nghỉ</Text>
                <Text style={styles.compactStatValue}>
                  {sets[Math.max(sessionState.completedSets, 0)]?.restSeconds || 60}s
                </Text>
              </View>
            </View>

            <View style={styles.compactCounterRow}>
              <View style={styles.compactCounterGroup}>
                <Text style={styles.compactCounterLabel}>Sets</Text>

                <View style={styles.compactControl}>
                  <TouchableOpacity
                    style={styles.compactMinusBtn}
                    onPress={decreaseSet}
                  >
                    <MaterialCommunityIcons name="minus" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.compactPlusBtn}
                    onPress={increaseSet}
                  >
                    <MaterialCommunityIcons name="plus" size={18} color={COLORS.surface} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.compactCounterGroup}>
                <Text style={styles.compactCounterLabel}>Reps</Text>

                <View style={styles.compactControl}>
                  <TouchableOpacity
                    style={styles.compactMinusBtn}
                    onPress={decreaseRep}
                  >
                    <MaterialCommunityIcons name="minus" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.compactPlusBtn}
                    onPress={increaseRep}
                  >
                    <MaterialCommunityIcons name="plus" size={18} color={COLORS.surface} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.compactDifficulty}>
              <View style={styles.compactDifficultyHeader}>
                <Text style={styles.compactDifficultyTitle}>Độ khó</Text>
                <Text style={styles.compactDifficultyValue}>
                  {perceivedDifficulty}/10
                </Text>
              </View>

              <View style={styles.compactDifficultyRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.compactDifficultyBtn,
                      perceivedDifficulty === value && styles.compactDifficultyBtnActive,
                    ]}
                    onPress={() => setPerceivedDifficulty(value)}
                  >
                    <Text
                      style={[
                        styles.compactDifficultyText,
                        perceivedDifficulty === value && styles.compactDifficultyTextActive,
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.compactActionRow}>
              <TouchableOpacity
                style={[
                  styles.compactActionBtn,
                  sessionState.isPaused && styles.compactResumeBtn,
                ]}
                onPress={togglePause}
              >
                <MaterialCommunityIcons
                  name={sessionState.isPaused ? 'play' : 'pause'}
                  size={20}
                  color={COLORS.surface}
                />
                <Text style={styles.compactActionText}>
                  {sessionState.isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.compactActionBtn, styles.compactStopBtn]}
                onPress={stopSession}
              >
                <MaterialCommunityIcons name="stop-circle" size={20} color={COLORS.surface} />
                <Text style={styles.compactActionText}>Dừng</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!hasStarted && (
          <View style={styles.buttonSection}>
            <TouchableOpacity style={styles.startButton} onPress={startSession}>
              <MaterialCommunityIcons name="play" size={24} color={COLORS.surface} />
              <Text style={styles.startButtonText}>BẮT ĐẦU TẬP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Description */}
        {exercise.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Hướng dẫn</Text>
            <Text style={styles.description}>{stripHtml(exercise.description)}</Text>
          </View>
        )}

        {/* Equipment Info */}
        {exercise.equipment && exercise.equipment.length > 0 && (
          <View style={styles.equipmentSection}>
            <Text style={styles.equipmentTitle}>Dụng cụ cần thiết</Text>
            <View style={styles.equipmentList}>
              {exercise.equipment.map((eq) => (
                <View key={eq.id} style={styles.equipmentTag}>
                  <MaterialCommunityIcons name="wrench" size={16} color={COLORS.primary} />
                  <Text style={styles.equipmentTagText}>{eq.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Muscle Groups */}
        {(exercise.muscles && exercise.muscles.length > 0 || 
          exercise.muscles_secondary && exercise.muscles_secondary.length > 0) && (
          <View style={styles.muscleSection}>
            <Text style={styles.muscleTitle}>Nhóm cơ tác động</Text>
            
            {exercise.muscles && exercise.muscles.length > 0 && (
              <>
                <Text style={styles.muscleSubtitle}>Nhóm cơ chính</Text>
                <View style={styles.muscleList}>
                  {exercise.muscles.map((muscle) => (
                    <View key={muscle.id} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{muscle.name_en}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {exercise.muscles_secondary && exercise.muscles_secondary.length > 0 && (
              <>
                <Text style={styles.muscleSubtitle}>Nhóm cơ phụ</Text>
                <View style={styles.muscleList}>
                  {exercise.muscles_secondary.map((muscle) => (
                    <View key={muscle.id} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{muscle.name_en}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  compactWorkoutCard: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },

  compactTimer: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: 'Courier New',
    marginBottom: SPACING.sm,
  },

  compactStatsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },

  compactStatBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },

  compactStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  compactStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  compactCounterRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  compactCounterGroup: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },

  compactCounterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },

  compactControl: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },

  compactMinusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  compactPlusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  compactDifficulty: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },

  compactDifficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },

  compactDifficultyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  compactDifficultyValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },

  compactDifficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  compactDifficultyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  compactDifficultyBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  compactDifficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },

  compactDifficultyTextActive: {
    color: COLORS.surface,
  },

  compactActionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  compactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },

  compactResumeBtn: {
    backgroundColor: COLORS.success,
  },

  compactStopBtn: {
    backgroundColor: COLORS.error,
  },

  compactActionText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.surface,
  },
  counterSection: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  backButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  backButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
    textAlign: 'center',
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.background,
    position: 'relative',
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  noImageText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  imageNav: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNavLeft: {
    left: SPACING.md,
  },
  imageNavRight: {
    right: SPACING.md,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  imageIndicatorText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  videoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  videoText: {
    marginLeft: SPACING.md,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoSection: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  timerSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: 72,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Courier New',
  },
  setInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  setIndicator: {
    alignItems: 'center',
  },
  setLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  setNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  restInfo: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  restLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  restTime: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  intensitySection: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  intensityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  intensityBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  intensityBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  intensityBtnTextActive: {
    color: COLORS.surface,
  },
  buttonSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  startButtonText: {
    marginLeft: SPACING.md,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.md,
  },
  resumeButton: {
    backgroundColor: COLORS.success,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    marginLeft: SPACING.md,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  descriptionSection: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  equipmentSection: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  equipmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  equipmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  equipmentTagText: {
    marginLeft: SPACING.sm,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  muscleSection: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  muscleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  muscleSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  muscleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleTag: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  secondaryMuscle: {
    backgroundColor: COLORS.background,
  },
  muscleTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  imageWrapper: {
    width: width,
    height: 300,
    backgroundColor: COLORS.background,
    marginTop: SPACING.lg,
  },

  image: {
    width: width,
    height: 300,
    resizeMode: 'contain',
  },

  emptyImage: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    marginTop: 8,
    color: COLORS.textSecondary,
  },
});
