/**
 * Component cho Adaptive Workout:
 *  - TrainingStateCard: Readiness + Fatigue / Recovery / Performance
 *  - AdaptPlanSheet: xem trước & áp dụng điều chỉnh kế hoạch
 *  - SubstituteSheet: chọn lý do & bài thay thế
 */
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from './Card';
import {
  Badge,
  BottomSheet,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Notice,
  ScoreBar,
  Tone,
} from './ui';
import { BORDER_RADIUS, COLORS, METRIC_COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { workoutService } from '../services/workout.service';
import { getErrorMessage } from '../services/api';
import type {
  AdaptAction,
  AdaptResult,
  AlternativeExercise,
  AlternativesResult,
  ReplaceResult,
  SubstitutionReason,
  TrainingState,
  TrainingStatus,
  WorkoutExercise,
} from '../types/workout';

type IconName = keyof typeof Ionicons.glyphMap;

/* ------------------------------------------------------------------ */
/* Meta                                                                */
/* ------------------------------------------------------------------ */

export const STATUS_META: Record<TrainingStatus, { label: string; tone: Tone; icon: IconName; color: string }> = {
  ready: { label: 'Sẵn sàng', tone: 'success', icon: 'flash', color: COLORS.success },
  normal: { label: 'Bình thường', tone: 'info', icon: 'happy-outline', color: COLORS.info },
  tired: { label: 'Hơi mệt', tone: 'warning', icon: 'cloudy-outline', color: COLORS.warning },
  overreached: { label: 'Quá tải', tone: 'error', icon: 'warning-outline', color: COLORS.error },
};

export const ACTION_META: Record<AdaptAction, { label: string; tone: Tone; icon: IconName }> = {
  increase: { label: 'Tăng cường độ', tone: 'info', icon: 'trending-up' },
  maintain: { label: 'Duy trì', tone: 'success', icon: 'remove' },
  reduce_intensity: { label: 'Giảm cường độ', tone: 'warning', icon: 'trending-down' },
  light_session: { label: 'Buổi tập nhẹ', tone: 'purple', icon: 'leaf-outline' },
  rest: { label: 'Nghỉ ngơi', tone: 'neutral', icon: 'bed-outline' },
};

const INTENSITY_LABEL: Record<string, string> = {
  vigorous: 'Mạnh',
  moderate: 'Vừa',
  light: 'Nhẹ',
};

const COMPONENT_LABEL: Record<string, string> = {
  training: 'Khối lượng tập',
  dailyActivity: 'Vận động hằng ngày',
  sleep: 'Giấc ngủ',
  timeSinceHardSession: 'Thời gian từ buổi nặng',
  restDays: 'Ngày nghỉ',
  avgPerformance: 'Hiệu suất trung bình',
  completionRate: 'Tỉ lệ hoàn thành',
  trend: 'Xu hướng',
};

export const SUB_REASONS: { value: SubstitutionReason; label: string; icon: IconName }[] = [
  { value: 'too_hard', label: 'Quá khó', icon: 'barbell-outline' },
  { value: 'no_equipment', label: 'Không có dụng cụ', icon: 'construct-outline' },
  { value: 'pain', label: 'Bị đau', icon: 'bandage-outline' },
  { value: 'dislike', label: 'Không thích', icon: 'thumbs-down-outline' },
  { value: 'other', label: 'Khác', icon: 'ellipsis-horizontal' },
];

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung bình',
  advanced: 'Nâng cao',
  expert: 'Chuyên sâu',
};

/* ------------------------------------------------------------------ */
/* TrainingStateCard                                                   */
/* ------------------------------------------------------------------ */

export const TrainingStateCard = memo(function TrainingStateCard({
  state,
  loading,
  onAdapt,
}: {
  state: TrainingState | null;
  loading?: boolean;
  onAdapt: () => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  if (!state) {
    if (!loading) return null;
    return (
      <Card style={styles.stateCard}>
        <ActivityIndicator color={COLORS.primary} />
      </Card>
    );
  }

  const meta = STATUS_META[state.status] ?? STATUS_META.normal;
  const readinessPct = Math.max(0, Math.min(1, state.readinessScore / 10));

  return (
    <Card style={styles.stateCard}>
      <View style={styles.stateTop}>
        <View style={[styles.ring, { borderColor: `${meta.color}33` }]}>
          <View
            style={[
              styles.ringFill,
              { height: `${readinessPct * 100}%`, backgroundColor: `${meta.color}22` },
            ]}
          />
          <Text style={[styles.ringValue, { color: meta.color }]}>
            {state.readinessScore.toFixed(1)}
          </Text>
          <Text style={styles.ringLabel}>Readiness</Text>
        </View>

        <View style={styles.flex1}>
          <Text style={styles.stateTitle}>Trạng thái tập luyện</Text>
          <View style={styles.badgeRow}>
            <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
            <Badge
              label={`Cường độ: ${INTENSITY_LABEL[state.recommendedIntensity] ?? state.recommendedIntensity}`}
              tone="neutral"
            />
          </View>
          <TouchableOpacity onPress={() => setDetailOpen(true)} hitSlop={8} style={styles.detailLink}>
            <Text style={styles.detailLinkText}>Xem cách tính</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.scoreList}>
        <ScoreBar
          label="Mệt mỏi (Fatigue)"
          value={state.fatigueScore}
          color={METRIC_COLORS.fatigue}
          valueText={`${state.fatigueScore.toFixed(1)}/10`}
        />
        <ScoreBar
          label="Phục hồi (Recovery)"
          value={state.recoveryScore}
          color={METRIC_COLORS.recovery}
          valueText={`${state.recoveryScore.toFixed(1)}/10`}
        />
        <ScoreBar
          label="Hiệu suất (Performance)"
          value={state.performanceScore}
          color={METRIC_COLORS.performance}
          valueText={`${state.performanceScore.toFixed(1)}/10`}
        />
      </View>

      {state.isColdStart ? (
        <Notice
          tone="info"
          style={styles.mt12}
          message="Chưa đủ lịch sử tập (dưới vài buổi trong 28 ngày) nên điểm được giới hạn để an toàn."
        />
      ) : null}

      <Button
        title="Điều chỉnh kế hoạch"
        icon="options-outline"
        variant="secondary"
        onPress={onAdapt}
        style={styles.mt12}
        fullWidth
      />

      <BottomSheet
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Cách tính điểm"
        subtitle="Mỗi điểm 0–10, tổng hợp có trọng số từ lịch sử tập và Google Health"
      >
        {(['fatigue', 'recovery', 'performance'] as const).map((key) => {
          const b = state.breakdown?.[key];
          if (!b) return null;
          const title =
            key === 'fatigue' ? 'Mệt mỏi' : key === 'recovery' ? 'Phục hồi' : 'Hiệu suất';
          return (
            <View key={key} style={styles.breakdownBlock}>
              <Text style={styles.breakdownTitle}>
                {title}: {b.score ?? '—'}
              </Text>
              {Object.entries(b.components || {}).map(([name, v]) => (
                <ScoreBar
                  key={name}
                  label={`${COMPONENT_LABEL[name] ?? name}${
                    b.usedWeights?.[name] != null ? ` · ${Math.round(b.usedWeights[name] * 100)}%` : ''
                  }`}
                  value={typeof v === 'number' ? v : 0}
                  valueText={typeof v === 'number' ? v.toFixed(1) : 'Không có dữ liệu'}
                  color={METRIC_COLORS[key]}
                  style={styles.mt8}
                />
              ))}
            </View>
          );
        })}
        {state.dataAvailability ? (
          <Text style={styles.footnote}>
            {state.dataAvailability.trainingDays28d ?? 0} ngày tập / 28 ngày · Google Health phủ{' '}
            {Math.round((state.dataAvailability.healthCoverage7d ?? 0) * 100)}% tuần qua
          </Text>
        ) : null}
      </BottomSheet>
    </Card>
  );
});

/* ------------------------------------------------------------------ */
/* AdaptPlanSheet                                                      */
/* ------------------------------------------------------------------ */

export function AdaptPlanSheet({
  visible,
  onClose,
  onApplied,
}: {
  visible: boolean;
  onClose: () => void;
  onApplied: (result: AdaptResult) => void;
}) {
  const [preview, setPreview] = useState<AdaptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await workoutService.adaptPlan({ dryRun: true, sync: true });
      setPreview(res);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể phân tích kế hoạch'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) loadPreview();
    else setPreview(null);
  }, [visible, loadPreview]);

  const apply = async () => {
    try {
      setApplying(true);
      const res = await workoutService.adaptPlan({ dryRun: false });
      onApplied(res);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể áp dụng điều chỉnh'));
    } finally {
      setApplying(false);
    }
  };

  const action = preview ? ACTION_META[preview.decision.action] ?? ACTION_META.maintain : null;
  const hasChanges = !!preview?.changes?.length;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Điều chỉnh kế hoạch"
      subtitle="Dựa trên Fatigue, Recovery, Performance và dữ liệu Google Health"
      footer={
        preview && hasChanges ? (
          <View style={styles.footerRow}>
            <Button title="Để sau" variant="outline" onPress={onClose} style={styles.flex1} />
            <Button
              title="Áp dụng"
              icon="checkmark"
              onPress={apply}
              loading={applying}
              style={styles.flex1}
            />
          </View>
        ) : preview ? (
          <Button title="Đóng" variant="outline" onPress={onClose} fullWidth />
        ) : null
      }
    >
      {loading ? (
        <View style={styles.sheetLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.sheetLoadingText}>Đang phân tích thể trạng...</Text>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={loadPreview} />
      ) : preview && action ? (
        <>
          <View style={styles.decisionBox}>
            <View style={styles.decisionIcon}>
              <Ionicons name={action.icon} size={22} color={COLORS.primaryDark} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.decisionLabel}>Đề xuất</Text>
              <Text style={styles.decisionTitle}>{action.label}</Text>
            </View>
            <Badge
              label={`Readiness ${preview.state.readinessScore}`}
              tone={STATUS_META[preview.state.status]?.tone ?? 'neutral'}
            />
          </View>

          {preview.decision.reasons?.length ? (
            <View style={styles.reasonList}>
              {preview.decision.reasons.map((r, i) => (
                <View key={i} style={styles.reasonRow}>
                  <Ionicons name="ellipse" size={6} color={COLORS.textMuted} style={styles.reasonDot} />
                  <Text style={styles.reasonText}>{r}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {preview.activity?.weeklyActiveMinutes != null ? (
            <WeeklyVsWho activity={preview.activity} />
          ) : null}

          <Text style={styles.changesTitle}>
            {hasChanges ? `Thay đổi (${preview.changes.length} ngày)` : 'Không có thay đổi'}
          </Text>
          {hasChanges ? (
            preview.changes.map((c) => {
              const m = ACTION_META[c.action] ?? ACTION_META.maintain;
              return (
                <View key={c.day} style={styles.changeRow}>
                  <Text style={styles.changeDay}>Ngày {c.day}</Text>
                  <View style={styles.flex1}>
                    <Text style={styles.changeText} numberOfLines={2}>
                      {describeDay(c.from)} → {describeDay(c.to)}
                    </Text>
                  </View>
                  <Badge label={m.label} tone={m.tone} />
                </View>
              );
            })
          ) : (
            <Notice
              tone="success"
              message="Kế hoạch hiện tại đã phù hợp với thể trạng của bạn."
            />
          )}
        </>
      ) : null}
    </BottomSheet>
  );
}

function WeeklyVsWho({ activity }: { activity: NonNullable<AdaptResult['activity']> }) {
  const who = activity.whoWeeklyMinutes;
  const min = typeof who === 'number' ? who : who?.min ?? 150;
  const max = typeof who === 'number' ? null : who?.max ?? null;
  const actual = activity.weeklyActiveMinutes ?? 0;
  const estimated = activity.weeklyAerobic?.estimated;
  return (
    <ScoreBar
      label="Vận động tuần này so với WHO"
      value={actual}
      max={Math.max(max ?? min, actual, 1)}
      valueText={`${Math.round(actual)} / ${max ? `${min}–${max}` : `≥ ${min}`} phút`}
      hint={estimated ? 'Ước tính từ dữ liệu Google Health chưa đầy đủ' : undefined}
      color={METRIC_COLORS.activeMinutes}
      style={styles.mt12}
    />
  );
}

function describeDay(d: { type: string; intensity?: string; exercises?: number }) {
  if (d.type === 'rest') return 'Nghỉ';
  const parts = [d.intensity ? INTENSITY_LABEL[d.intensity] ?? d.intensity : null];
  if (typeof d.exercises === 'number') parts.push(`${d.exercises} bài`);
  return parts.filter(Boolean).join(', ') || 'Tập';
}

/* ------------------------------------------------------------------ */
/* SubstituteSheet                                                     */
/* ------------------------------------------------------------------ */

export function SubstituteSheet({
  visible,
  day,
  exercise,
  onClose,
  onReplaced,
}: {
  visible: boolean;
  day: number;
  exercise: WorkoutExercise | null;
  onClose: () => void;
  onReplaced: (result: ReplaceResult) => void;
}) {
  const [reason, setReason] = useState<SubstitutionReason>('too_hard');
  const [data, setData] = useState<AlternativesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!exercise) return;
    try {
      setLoading(true);
      setError(null);
      const res = await workoutService.getAlternatives(day, exercise.exerciseId, reason, 6);
      setData(res);
    } catch (err) {
      setData(null);
      setError(getErrorMessage(err, 'Không lấy được bài thay thế'));
    } finally {
      setLoading(false);
    }
  }, [day, exercise, reason]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  useEffect(() => {
    if (!visible) {
      setData(null);
      setError(null);
      setReason('too_hard');
    }
  }, [visible]);

  const replace = async (alt: AlternativeExercise) => {
    if (!exercise) return;
    try {
      setReplacingId(alt.exerciseId);
      const res = await workoutService.replaceExercise(day, exercise.exerciseId, alt.exerciseId, reason);
      onReplaced(res);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể thay thế bài tập'));
    } finally {
      setReplacingId(null);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Thay thế bài tập"
      subtitle={exercise ? `Đang thay: ${exercise.name}` : undefined}
    >
      <Text style={styles.label}>Vì sao bạn muốn đổi?</Text>
      <View style={styles.chipWrap}>
        {SUB_REASONS.map((r) => (
          <Chip
            key={r.value}
            label={r.label}
            icon={r.icon}
            selected={reason === r.value}
            onPress={() => setReason(r.value)}
          />
        ))}
      </View>

      {reason === 'pain' ? (
        <Notice
          tone="warning"
          style={styles.mt12}
          message="Nếu cơn đau kéo dài hoặc nặng hơn, hãy dừng tập và hỏi ý kiến bác sĩ."
        />
      ) : null}

      <Text style={[styles.label, styles.mt16]}>Bài tập gợi ý</Text>

      {loading ? (
        <View style={styles.sheetLoading}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : error ? (
        <Notice tone="error" message={error} />
      ) : data && !data.canReplace ? (
        <Notice tone="warning" message={data.blockedReason || 'Không thể thay bài tập ở ngày này.'} />
      ) : data && data.alternatives.length === 0 ? (
        <EmptyState icon="search-outline" title="Không có bài phù hợp" message="Thử chọn lý do khác." />
      ) : (
        data?.alternatives.map((alt) => (
          <AlternativeRow
            key={alt.exerciseId}
            alt={alt}
            originalCalories={data.original.calories}
            loading={replacingId === alt.exerciseId}
            disabled={replacingId !== null}
            onPick={() => replace(alt)}
          />
        ))
      )}
    </BottomSheet>
  );
}

const AlternativeRow = memo(function AlternativeRow({
  alt,
  originalCalories,
  loading,
  disabled,
  onPick,
}: {
  alt: AlternativeExercise;
  originalCalories?: number;
  loading: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const similarity = typeof alt.similarity === 'number' ? Math.round(alt.similarity * 100) : null;
  const calDiff =
    typeof alt.calories === 'number' && typeof originalCalories === 'number'
      ? alt.calories - originalCalories
      : null;

  return (
    <View style={styles.altRow}>
      <View style={styles.altIcon}>
        <Ionicons name="barbell-outline" size={18} color={COLORS.primaryDark} />
      </View>
      <View style={styles.flex1}>
        <Text style={styles.altName} numberOfLines={2}>
          {alt.name}
        </Text>
        <View style={styles.altMeta}>
          {similarity != null ? <Badge label={`Tương đồng ${similarity}%`} tone="success" /> : null}
          {alt.difficulty ? (
            <Badge label={DIFFICULTY_LABEL[alt.difficulty] ?? alt.difficulty} tone="neutral" />
          ) : null}
          {typeof alt.calories === 'number' ? (
            <Badge
              label={`${Math.round(alt.calories)} kcal${
                calDiff ? ` (${calDiff > 0 ? '+' : ''}${Math.round(calDiff)})` : ''
              }`}
              tone="warning"
            />
          ) : null}
        </View>
        {alt.equipment?.length ? (
          <Text style={styles.altEquip} numberOfLines={1}>
            Dụng cụ: {alt.equipment.join(', ')}
          </Text>
        ) : null}
      </View>
      <Button title="Chọn" size="sm" onPress={onPick} loading={loading} disabled={disabled} />
    </View>
  );
});

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  mt8: { marginTop: SPACING.sm },
  mt12: { marginTop: SPACING.sm + 4 },
  mt16: { marginTop: SPACING.md },

  stateCard: { marginBottom: SPACING.sm },
  stateTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  ring: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringFill: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  ringValue: { ...TYPOGRAPHY.h1 },
  ringLabel: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  stateTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
  detailLink: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: SPACING.sm },
  detailLinkText: { ...TYPOGRAPHY.captionStrong, color: COLORS.primaryDark },
  scoreList: { gap: SPACING.sm + 4, marginTop: SPACING.md },

  breakdownBlock: {
    marginBottom: SPACING.md,
    padding: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  breakdownTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text },
  footnote: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, textAlign: 'center' },

  sheetLoading: { paddingVertical: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  sheetLoadingText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  footerRow: { flexDirection: 'row', gap: SPACING.sm },

  decisionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    padding: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primarySoft,
  },
  decisionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionLabel: { ...TYPOGRAPHY.small, color: COLORS.primaryDark },
  decisionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  reasonList: { marginTop: SPACING.sm + 4, gap: 6 },
  reasonRow: { flexDirection: 'row', gap: SPACING.sm },
  reasonDot: { marginTop: 8 },
  reasonText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, flex: 1 },
  changesTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.sm },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  changeDay: { ...TYPOGRAPHY.captionStrong, color: COLORS.text, width: 54 },
  changeText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },

  label: { ...TYPOGRAPHY.captionStrong, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    padding: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  altIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  altName: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text },
  altMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  altEquip: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: 4 },
});
