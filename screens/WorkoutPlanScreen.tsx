import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useWorkout } from '../contexts/WorkoutContext';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { DAY_NAMES, WorkoutDay } from '../types/workout';

const WORKOUT_IMAGE =
  'https://plus.unsplash.com/premium_photo-1664910764486-bed06a30a71b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const REST_IMAGE =
  'https://plus.unsplash.com/premium_photo-1674675646818-01d7a7bae64c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dGhpJUUxJUJCJTgxbnxlbnwwfHwwfHx8MA%3D%3D';

export const WorkoutPlanScreen = ({ navigation }: any) => {
  const { plan, loading, error, getCurrentDayOfWeek, fetchPlan } = useWorkout();
  const [refreshing, setRefreshing] = useState(false);

  const currentDay = plan?.currentDay ?? plan?.plan?.find(d => !d.completed)?.day ?? 1;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlan();
    setRefreshing(false);
  };

  const handleDayPress = (dayNumber: number) => {
    navigation?.navigate('DayDetail', { dayNumber });
  };

  const handleStartPress = (dayNumber: number) => {
    navigation?.navigate('DayDetail', { dayNumber });
  };

  // Loading
  if (loading && !plan) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>Đang tải kế hoạch...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error
   if (error) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Empty
  if (!plan || !plan.plan) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.text}>Không có kế hoạch</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View>
          <Text style={styles.title}>Kế hoạch tập luyện</Text>
          <Text style={styles.subtitle}>Tuần của bạn</Text>
        </View>

        {/* List */}
        <View style={styles.list}>
          {plan.plan.map((day: WorkoutDay, index: number) => (
            <DayItem
              key={day.day}
              day={day}
              index={index}
              planLength={plan.plan.length}
              currentDay={currentDay}
              isCurrentDay={day.day === currentDay}
              onPress={() => handleDayPress(day.day)}
              onStart={() => handleStartPress(day.day)}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const DayItem = ({
  day,
  index,
  planLength,
  isCurrentDay,
  onPress,
  onStart,
  currentDay,
}: any) => {
  const isRest = day.type === 'rest';
  const isPast = day.day < currentDay;

  return (
    <View style={styles.row}>
      {/* Timeline */}
      <View style={styles.timeline}>
        <View
          style={[
            styles.dot,
            (isPast || isCurrentDay) && { backgroundColor: COLORS.primary },
          ]}
        />

        {index !== planLength && (
          <View
            style={[
              styles.line,
              (isPast || isCurrentDay) && {
                backgroundColor: COLORS.primary,
              },
            ]}
          />
        )}
      </View>

      {/* Card */}
      <TouchableOpacity style={styles.dayCard} onPress={onPress}>
        <Image
          source={{ uri: isRest ? REST_IMAGE : WORKOUT_IMAGE }}
          style={styles.banner}
        />

        <View style={styles.cardContent}>
          <Text style={styles.dayTitle}>{DAY_NAMES(day.day)}</Text>

          {isRest ? (
            <Text style={styles.restText}>Ngày nghỉ</Text>
          ) : (
            <Text style={styles.meta}>
              {day.totalDuration} phút | {day.totalCalories} kcal
            </Text>
          )}

          {isCurrentDay && !isRest && (
            <TouchableOpacity style={styles.startBtnBig} onPress={onStart}>
              <Text style={styles.startTextBig}>BẮT ĐẦU NGAY</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { marginTop: 10, color: COLORS.textSecondary },
  errorText: { color: COLORS.error, marginTop: 10 },
  retryBtn: {
    marginTop: 16,
    padding: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: { color: '#fff' },

  header: { marginBottom: 20 },
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

  content: { padding: 10 },
  dayName: { fontWeight: '600' },
  restText: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },

  startBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  startText: { color: '#fff', fontSize: 12 },

  list: {
    marginTop: 10,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  /* Timeline */
  timeline: {
    width: 30,
    alignItems: 'center',
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },

  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 2,
  },

  /* Card */
  dayCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },

  banner: {
    width: '100%',
    height: 140,
  },

  doneBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 6,
  },

  cardContent: {
    padding: 16,
  },

  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  meta: {
    color: COLORS.textMuted,
  },

  startBtnBig: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },

  startTextBig: {
    color: '#fff',
    fontWeight: '700',
  },
});