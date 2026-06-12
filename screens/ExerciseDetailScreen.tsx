import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, BORDER_RADIUS } from '../constants/theme';
import { exerciseService } from '../services/exercise.service';

const { width } = Dimensions.get('window');

export const ExerciseDetailScreen = ({ route, navigation }: any) => {
 
  const exerciseId = route?.params?.exerciseId;

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [tab, setTab] = useState<'video' | 'how'>('how');

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await exerciseService.getExerciseDetail(exerciseId);
      setExercise(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
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

  const images = exercise?.images ?? [];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* BACK + TITLE */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{exercise.name}</Text>

        {/* IMAGE */}
        <View style={styles.imageWrapper}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              disableIntervalMomentum
              contentContainerStyle={{ paddingHorizontal: 0 }}
              onScroll={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / width
                );
                setCurrentIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {images.map((img: string, index: number) => (
                <View key={index} style={{ width, justifyContent: 'center', alignItems: 'center' }}>
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

        {/* TAB */}
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setTab('video')}>
            <Text style={[styles.tab, tab === 'video' && styles.tabActive]}>
              Video
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setTab('how')}>
            <Text style={[styles.tab, tab === 'how' && styles.tabActive]}>
              How to do
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {tab === 'how' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.text}>
              {exercise.description?.replace(/<[^>]+>/g, '')}
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Video</Text>

            {exercise.videos?.length ? (
              <Text>Video player ở đây</Text>
            ) : (
              <View style={styles.placeholder}>
                <MaterialCommunityIcons name="video-off" size={40} />
                <Text>Không có video</Text>
              </View>
            )}
          </View>
        )}

        {/* MUSCLES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus Area</Text>
          {exercise.muscles?.map((m: any) => (
            <Text key={m.id} style={styles.tag}>
              • {m.name_en || m.name}
            </Text>
          ))}
        </View>

        {/* EQUIPMENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          {exercise.equipment?.length ? (
            exercise.equipment.map((e: any) => (
              <Text key={e.id} style={styles.tag}>
                • {e.name}
              </Text>
            ))
          ) : (
            <Text>No equipment</Text>
          )}
        </View>

      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 10,
  },
  imageWrapper: {
    width,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  image: {
    width: '92%',
    height: 260,
    resizeMode: 'contain',
  },

  emptyImage: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 20,
  },
  tab: {
    fontSize: 16,
    color: '#999',
  },
  tabActive: {
    color: COLORS.primary,
    fontWeight: '700',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  section: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    color: '#444',
    lineHeight: 20,
  },
  tag: {
    marginTop: 4,
    color: '#555',
  },
  placeholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },

  dotActive: {
    backgroundColor: COLORS.primary,
    width: 8,
    height: 8,
  },
});