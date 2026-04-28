import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { workoutService } from '../services/workout';

const DEFAULT_IMAGE = 'https://via.placeholder.com/400x300?text=Exercise';

export const ExerciseDetailScreen = ({ route, navigation }: any) => {
  const exerciseId = route?.params?.exerciseId;

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await workoutService.getExerciseDetail(exerciseId);
      setExercise(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = () => {
    setIsCompleted(!isCompleted);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!exercise) {
    return (
      <ScreenContainer>
        <Text>Không có dữ liệu</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView>
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>← Quay lại</Text>
        </TouchableOpacity>

        {/* Image */}
        {!imageError ? (
          <Image
            source={{ uri: exercise.images?.[0] || DEFAULT_IMAGE }}
            style={{ height: 250 }}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name="dumbbell" size={40} />
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{exercise.name}</Text>

        {/* Calories */}
        <Text>{exercise.calories || 0} kcal</Text>

        {/* Description */}
        <Text style={styles.desc}>{exercise.description}</Text>

        {/* Tips */}
        <View style={styles.tipBox}>
          <Text>💡 Giữ form chuẩn để tránh chấn thương</Text>
        </View>

        {/* Complete */}
        <TouchableOpacity
          style={[
            styles.btn,
            { backgroundColor: isCompleted ? 'green' : COLORS.primary },
          ]}
          onPress={handleToggleComplete}
        >
          <Text style={{ color: '#fff' }}>
            {isCompleted ? 'Đã hoàn thành' : 'Hoàn thành'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', marginTop: 10 },
  desc: { marginTop: 10, color: 'gray' },
  btn: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tipBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  placeholder: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
});