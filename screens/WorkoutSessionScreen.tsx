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
import { Video } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { workoutService } from '../services/workout';
import { ExerciseDetail, WorkoutSessionData } from '../types/workout';

const { width, height } = Dimensions.get('window');

const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>/g, '') : '';
};

interface SessionState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  currentSet: number;
  currentRep: number;
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
  const [sessionState, setSessionState] = useState<SessionState>({
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
    currentSet: 1,
    currentRep: 1,
  });

  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionId = useRef<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get exercise details and sets info
  const exerciseDetailsFromDay = plan?.plan
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
    loadSessionProgress();
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      setLoading(true);
      const data = await workoutService.getExerciseDetail(exerciseId);
      setExercise(data);
    } catch (err) {
      setError('Không thể tải thông tin bài tập');
      console.error('Error loading exercise:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionProgress = async () => {
    try {
      const activeSession = await workoutService.getActiveSession();
      if (activeSession && activeSession._id) {
        sessionId.current = activeSession._id;
        setSession(activeSession);
        const progress = await workoutService.getSessionProgress(activeSession._id);
        if (progress) {
          setSessionState(progress);
        }
      }
    } catch (err) {
      console.error('Error loading session progress:', err);
    }
  };

  const startSession = async () => {
    try {
      if (!user?._id || !exerciseId) {
        Alert.alert('Lỗi', 'Thiếu thông tin người dùng hoặc bài tập');
        return;
      }

      const sessionData = await workoutService.startWorkoutSession(
        user._id,
        exerciseId,
        'moderate'
      );
      
      sessionId.current = sessionData._id;
      setSession(sessionData);
      
      setSessionState(prev => ({
        ...prev,
        isRunning: true,
        isPaused: false,
      }));
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể bắt đầu buổi tập');
      console.error('Error starting session:', err);
    }
  };

  const stopSession = async () => {
    try {
      if (!sessionId.current) return;

      timerInterval.current && clearInterval(timerInterval.current);
      
      const result = await workoutService.stopWorkoutSession(sessionId.current);
      
      // Clear progress
      await workoutService.clearSessionProgress(sessionId.current);
      
      Alert.alert(
        'Buổi tập kết thúc',
        `Thời gian: ${Math.round(result.durationMinutes || 0)} phút\nCalo đốt cháy: ${Math.round(result.kcalBurned || 0)} kcal`,
        [
          {
            text: 'Quay lại',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      setSessionState(prev => ({
        ...prev,
        isRunning: false,
      }));
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết thúc buổi tập');
      console.error('Error stopping session:', err);
    }
  };

  const togglePause = async () => {
    if (sessionState.isRunning) {
      if (!sessionState.isPaused) {
        // Pause
        timerInterval.current && clearInterval(timerInterval.current);
        // Save progress
        await workoutService.saveSessionProgress(sessionId.current || '', sessionState);
        setSessionState(prev => ({ ...prev, isPaused: true }));
      } else {
        // Resume
        setSessionState(prev => ({ ...prev, isPaused: false }));
        startTimer();
      }
    }
  };

  const startTimer = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);

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
      timerInterval.current && clearInterval(timerInterval.current);
    }

    return () => {
      timerInterval.current && clearInterval(timerInterval.current);
    };
  }, [sessionState.isRunning, sessionState.isPaused]);

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
          <View style={styles.timerSection}>
            <View style={styles.timerDisplay}>
              <Text style={styles.timerText}>{formatTime(sessionState.elapsedSeconds)}</Text>
            </View>

            {/* Current Set/Rep Info */}
            <View style={styles.setInfoContainer}>
              <View style={styles.setIndicator}>
                <Text style={styles.setLabel}>Bộ</Text>
                <Text style={styles.setNumber}>{sessionState.currentSet}/{sets.length || 3}</Text>
              </View>
              <View style={styles.setIndicator}>
                <Text style={styles.setLabel}>Reps</Text>
                <Text style={styles.setNumber}>{sessionState.currentRep}</Text>
              </View>
            </View>

            {/* Rest Timer (if available) */}
            {sets.length > 0 && sessionState.currentSet <= sets.length && (
              <View style={styles.restInfo}>
                <Text style={styles.restLabel}>Thời gian nghỉ</Text>
                <Text style={styles.restTime}>{sets[sessionState.currentSet - 1]?.restSeconds || 60}s</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          {!hasStarted ? (
            <TouchableOpacity style={styles.startButton} onPress={startSession}>
              <MaterialCommunityIcons name="play" size={24} color={COLORS.surface} />
              <Text style={styles.startButtonText}>BẮT ĐẦU TẬP</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, sessionState.isPaused && styles.resumeButton]}
                onPress={togglePause}
              >
                <MaterialCommunityIcons
                  name={sessionState.isPaused ? 'play' : 'pause'}
                  size={24}
                  color={COLORS.surface}
                />
                <Text style={styles.actionButtonText}>
                  {sessionState.isPaused ? 'TIẾP TỤC' : 'TẠM DỪNG'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.stopButton]}
                onPress={stopSession}
              >
                <MaterialCommunityIcons name="stop-circle" size={24} color={COLORS.surface} />
                <Text style={styles.actionButtonText}>DỪNG</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

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
            <Text style={styles.muscleTitle}>Cơ được tập</Text>
            
            {exercise.muscles && exercise.muscles.length > 0 && (
              <>
                <Text style={styles.muscleSubtitle}>Chính</Text>
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
                <Text style={styles.muscleSubtitle}>Phụ</Text>
                <View style={styles.muscleList}>
                  {exercise.muscles_secondary.map((muscle) => (
                    <View key={muscle.id} style={[styles.muscleTag, styles.secondaryMuscle]}>
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
