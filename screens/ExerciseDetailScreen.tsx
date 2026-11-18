import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
  Segmented,
} from '../components';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { exerciseService } from '../services/exercise.service';

type DetailTab = 'video' | 'how';

const TAB_OPTIONS: { value: DetailTab; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'how', label: 'Hướng dẫn' },
];

/** Carousel ảnh: chiều rộng trang = chiều rộng thực của khung (không tràn padding). */
const ImageCarousel = memo(function ImageCarousel({ images }: { images: string[] }) {
  const [pageWidth, setPageWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  if (images.length === 0) {
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
          {images.map((img, index) => (
            <View key={index} style={{ width: pageWidth }}>
              <Image source={{ uri: img }} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.image} />
      )}
      {images.length > 1 ? (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
});

export const ExerciseDetailScreen = ({ route, navigation }: any) => {
  const exerciseId = route?.params?.exerciseId;

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>('how');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await exerciseService.getExerciseDetail(exerciseId);
      setExercise(data);
    } catch (e) {
      if (__DEV__) console.error(e);
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const description = useMemo(
    () => (exercise?.description ? String(exercise.description).replace(/<[^>]+>/g, '').trim() : ''),
    [exercise?.description]
  );

  if (loading) {
    return (
      <ScreenContainer header={<ScreenHeader title="Chi tiết bài tập" onBack={handleBack} />}>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (!exercise) {
    return (
      <ScreenContainer header={<ScreenHeader title="Chi tiết bài tập" onBack={handleBack} />}>
        <ErrorState message="Không có dữ liệu" onRetry={load} />
      </ScreenContainer>
    );
  }

  const images: string[] = exercise?.images ?? [];

  return (
    <ScreenContainer header={<ScreenHeader title={exercise.name} onBack={handleBack} />}>
      <ImageCarousel images={images} />

      <Segmented options={TAB_OPTIONS} value={tab} onChange={setTab} style={styles.tabs} />

      {tab === 'how' ? (
        <>
          {/* INSTRUCTION */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cách thực hiện</Text>
            <Text style={styles.text}>{description || 'Chưa có hướng dẫn'}</Text>
          </View>

          {/* MUSCLES */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nhóm cơ tác động</Text>
            {exercise.muscles?.length ? (
              <View style={styles.tagRow}>
                {exercise.muscles.map((m: any) => (
                  <Badge key={m.id} label={m.name_en || m.name} tone="success" />
                ))}
              </View>
            ) : (
              <Text style={styles.mutedText}>—</Text>
            )}
          </View>

          {/* EQUIPMENT */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dụng cụ cần thiết</Text>
            {exercise.equipment?.length ? (
              <View style={styles.tagRow}>
                {exercise.equipment.map((e: any) => (
                  <Badge key={e.id} label={e.name} tone="info" icon="barbell-outline" />
                ))}
              </View>
            ) : (
              <Text style={styles.mutedText}>Không cần dụng cụ</Text>
            )}
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Video</Text>
          {exercise.videos?.length ? (
            <Text style={styles.text}>Video player ở đây</Text>
          ) : (
            <EmptyState icon="videocam-off-outline" title="Không có video" />
          )}
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
  tabs: {
    marginTop: SPACING.md,
  },
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
  text: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  mutedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
});
