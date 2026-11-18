/**
 * HealthScreen – Google Health: kết nối OAuth, đồng bộ, số liệu hôm nay,
 * biểu đồ 7 ngày và so sánh mức vận động với khuyến nghị WHO.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking as RNLinking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
  ScoreBar,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
  Segmented,
  StatTile,
} from '../components';
import type { Tone } from '../components';
import { BORDER_RADIUS, COLORS, METRIC_COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { GOOGLE_NOT_CONNECTED_CODES, googleHealthService } from '../services/googleHealth.service';
import { getErrorMessage, isApiError } from '../services/api';
import type {
  ActivitySummary,
  GoogleConnectionStatus,
  GuidelineMetric,
  GuidelineStatus,
  HealthDailyRow,
  WhoComparison,
} from '../types/health';

WebBrowser.maybeCompleteAuthSession();

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmtNumber = (n: number | null | undefined) =>
  typeof n === 'number' ? Math.round(n).toLocaleString('vi-VN') : '—';

function fmtSleep(minutes: number | null | undefined) {
  if (typeof minutes !== 'number' || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}g${String(m).padStart(2, '0')}` : `${h}g`;
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return 'Chưa đồng bộ';
  const d = new Date(iso);
  const opts = { timeZone: 'Asia/Ho_Chi_Minh' } as const;
  const time = d.toLocaleTimeString('vi-VN', { ...opts, hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { ...opts, day: '2-digit', month: '2-digit' });
  return `${time}, ${date}`;
}

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function weekdayLabel(date: string) {
  // date = YYYY-MM-DD (giờ VN) -> parse như UTC để không lệch ngày.
  const d = new Date(`${date}T00:00:00Z`);
  return WEEKDAY[d.getUTCDay()];
}

function shortDate(date: string) {
  const [, m, d] = date.split('-');
  return `${weekdayLabel(date)}, ${d}/${m}`;
}

/** Danh sách N ngày gần nhất (YYYY-MM-DD, giờ VN), cũ -> mới. */
function lastNDates(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.now() - i * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
  }
  return out;
}

function todayVN() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

const STATUS_META: Record<GuidelineStatus, { label: string; tone: Tone }> = {
  below: { label: 'Dưới mức', tone: 'warning' },
  within: { label: 'Đạt', tone: 'success' },
  above: { label: 'Vượt mức', tone: 'info' },
  insufficient_data: { label: 'Thiếu dữ liệu', tone: 'neutral' },
};

type ChartMetric = 'steps' | 'activeMinutes' | 'sleepMinutes';

const CHART_META: Record<ChartMetric, { label: string; color: string; format: (v: number) => string }> = {
  steps: { label: 'Bước chân', color: METRIC_COLORS.steps, format: (v) => fmtNumber(v) },
  activeMinutes: { label: 'Phút vận động', color: METRIC_COLORS.activeMinutes, format: (v) => `${Math.round(v)}p` },
  sleepMinutes: { label: 'Giấc ngủ', color: METRIC_COLORS.sleep, format: (v) => fmtSleep(v) },
};

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export function HealthScreen() {
  const navigation = useNavigation<any>();

  const [status, setStatus] = useState<GoogleConnectionStatus | null>(null);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [who, setWho] = useState<WhoComparison | null>(null);
  const [whoLoading, setWhoLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('steps');

  // So sánh WHO chậm hơn (vài giây) -> tải riêng, không chặn phần còn lại.
  const loadWho = useCallback(async () => {
    try {
      setWhoLoading(true);
      setWho(await googleHealthService.getWhoComparison(false));
    } catch {
      setWho(null);
    } finally {
      setWhoLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    loadWho();
    const [st, sm] = await Promise.allSettled([
      googleHealthService.getStatus(),
      googleHealthService.getSummary(7),
    ]);

    if (st.status === 'rejected') {
      setError(getErrorMessage(st.reason));
      return;
    }

    setStatus(st.value);
    setNeedsReconnect(st.value.status === 'revoked');
    setSummary(sm.status === 'fulfilled' ? sm.value : null);
  }, [loadWho]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  const handleSync = useCallback(async () => {
    try {
      setSyncing(true);
      const result = await googleHealthService.sync();
      const failed = Object.entries(result.metrics || {}).filter(
        ([, v]) => v && v !== 'ok' && v !== 'not_granted'
      );
      await loadAll();
      if (failed.length) {
        Alert.alert(
          'Đồng bộ chưa đầy đủ',
          `Một số chỉ số chưa lấy được: ${failed.map(([k]) => k).join(', ')}.`
        );
      }
    } catch (err) {
      if (isApiError(err) && err.code && GOOGLE_NOT_CONNECTED_CODES.includes(err.code)) {
        setNeedsReconnect(true);
        await loadAll();
        return;
      }
      Alert.alert('Không thể đồng bộ', getErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  }, [loadAll]);

  const handleConnect = useCallback(async () => {
    try {
      setConnecting(true);
      // Deep link quay về app (exp://… trên Expo Go, nutritionsystem://… khi build).
      const returnTo = Linking.createURL('google-health');
      const url = await googleHealthService.getConnectUrl(returnTo);
      const result = await WebBrowser.openAuthSessionAsync(url, returnTo);

      if (result.type === 'success' && result.url.includes('googleHealth=error')) {
        Alert.alert('Kết nối thất bại', 'Google từ chối hoặc phiên đăng nhập đã hết hạn. Vui lòng thử lại.');
      }

      // Dù trình duyệt đóng theo cách nào, hỏi lại backend trạng thái thật.
      const st = await googleHealthService.getStatus();
      setStatus(st);
      if (st.connected) {
        setNeedsReconnect(false);
        await handleSync();
      }
    } catch (err) {
      Alert.alert('Không thể kết nối Google Health', getErrorMessage(err));
    } finally {
      setConnecting(false);
    }
  }, [handleSync]);

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      'Ngắt kết nối Google Health',
      'Ứng dụng sẽ ngừng đồng bộ. Dữ liệu đã đồng bộ vẫn được giữ lại.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ngắt kết nối',
          style: 'destructive',
          onPress: async () => {
            try {
              await googleHealthService.disconnect();
              await loadAll();
            } catch (err) {
              Alert.alert('Lỗi', getErrorMessage(err));
            }
          },
        },
      ]
    );
  }, [loadAll]);

  const handleMockSync = useCallback(async () => {
    try {
      setSyncing(true);
      await googleHealthService.mockSync();
      await loadAll();
    } catch (err) {
      Alert.alert('Lỗi', getErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  }, [loadAll]);

  /* -------- derived data -------- */

  const daily = useMemo<HealthDailyRow[]>(() => {
    if (!summary?.daily) return [];
    return [...summary.daily].sort((a, b) => a.date.localeCompare(b.date));
  }, [summary]);

  const today = useMemo(() => {
    const t = todayVN();
    return daily.find((d) => d.date === t) ?? daily[daily.length - 1] ?? null;
  }, [daily]);

  const isToday = today?.date === todayVN();
  const connected = !!status?.connected;
  const hasData = daily.some(
    (d) => d.steps != null || d.activeMinutes != null || d.sleepMinutes != null
  );

  const header = (
    <ScreenHeader
      title="Sức khỏe"
      subtitle="Dữ liệu vận động từ Google Health"
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
    />
  );

  if (loading) {
    return (
      <ScreenContainer header={header} scrollable={false} withBottomInset>
        <LoadingState message="Đang tải dữ liệu sức khỏe..." />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer header={header} scrollable={false} withBottomInset>
        <ErrorState message={error} onRetry={loadAll} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={header} onRefresh={loadAll} withBottomInset>
      {/* ---------------- Connection ---------------- */}
      <Card style={styles.connectCard}>
        <View style={styles.connectRow}>
          <View style={[styles.googleIcon, connected && styles.googleIconOn]}>
            <Ionicons name="fitness" size={22} color={connected ? COLORS.primaryDark : COLORS.textMuted} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.connectTitle}>Google Health</Text>
            <Text style={styles.connectSub} numberOfLines={2}>
              {connected ? `Đồng bộ lần cuối: ${fmtDateTime(status?.lastSyncedAt)}` : 'Chưa kết nối'}
            </Text>
          </View>
          <Badge
            label={connected ? 'Đã kết nối' : needsReconnect ? 'Mất quyền' : 'Ngắt'}
            tone={connected ? 'success' : needsReconnect ? 'error' : 'neutral'}
          />
        </View>

        {needsReconnect ? (
          <Notice
            tone="warning"
            style={styles.mt12}
            message="Quyền truy cập Google đã hết hạn hoặc bị thu hồi. Hãy kết nối lại để tiếp tục đồng bộ."
          />
        ) : null}

        {connected && status?.grantedMetrics?.length ? (
          <View style={styles.metricChips}>
            {status.grantedMetrics.map((m) => (
              <Badge key={m} label={METRIC_LABEL[m] ?? m} tone="info" />
            ))}
          </View>
        ) : null}

        <View style={styles.connectActions}>
          {connected ? (
            <>
              <Button
                title="Đồng bộ ngay"
                icon="sync"
                onPress={handleSync}
                loading={syncing}
                style={styles.flex1}
              />
              <Button
                title="Ngắt"
                icon="unlink"
                variant="outline"
                onPress={handleDisconnect}
                disabled={syncing}
              />
            </>
          ) : (
            <Button
              title={needsReconnect ? 'Kết nối lại' : 'Kết nối Google Health'}
              icon="logo-google"
              onPress={handleConnect}
              loading={connecting}
              fullWidth
              style={styles.flex1}
            />
          )}
        </View>

        {__DEV__ ? (
          <TouchableOpacity onPress={handleMockSync} style={styles.devLink} disabled={syncing}>
            <Ionicons name="flask-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.devLinkText}>Dev: tạo dữ liệu mẫu hôm nay</Text>
          </TouchableOpacity>
        ) : null}
      </Card>

      {!hasData ? (
        <EmptyState
          icon="walk-outline"
          title="Chưa có dữ liệu vận động"
          message={
            connected
              ? 'Kéo xuống để làm mới hoặc bấm "Đồng bộ ngay" để lấy dữ liệu 7 ngày gần nhất.'
              : 'Kết nối Google Health để theo dõi bước chân, calo, phút vận động và giấc ngủ.'
          }
        />
      ) : (
        <>
          {/* ---------------- Today ---------------- */}
          <SectionHeader
            title={isToday ? 'Hôm nay' : `Gần nhất · ${today ? shortDate(today.date) : ''}`}
            icon="today-outline"
          />
          <View style={styles.statGrid}>
            <StatTile
              icon="footsteps"
              label="Bước chân"
              value={fmtNumber(today?.steps)}
              color={METRIC_COLORS.steps}
            />
            <StatTile
              icon="flame"
              label="Calo tiêu hao"
              value={fmtNumber(today?.caloriesBurned)}
              unit="kcal"
              color={METRIC_COLORS.calories}
            />
          </View>
          <View style={styles.statGrid}>
            <StatTile
              icon="pulse"
              label="Phút vận động"
              value={fmtNumber(today?.activeMinutes)}
              unit="phút"
              color={METRIC_COLORS.activeMinutes}
              hint={
                today?.vigorousMinutes != null
                  ? `${today.moderateMinutes ?? 0} vừa · ${today.vigorousMinutes} mạnh`
                  : undefined
              }
            />
            <StatTile
              icon="moon"
              label="Giấc ngủ"
              value={fmtSleep(today?.sleepMinutes)}
              color={METRIC_COLORS.sleep}
            />
          </View>

          {/* ---------------- Weekly chart ---------------- */}
          <SectionHeader title="7 ngày gần nhất" icon="bar-chart-outline" />
          <Card>
            <Segmented
              value={chartMetric}
              onChange={setChartMetric}
              options={[
                { value: 'steps', label: 'Bước' },
                { value: 'activeMinutes', label: 'Vận động' },
                { value: 'sleepMinutes', label: 'Ngủ' },
              ]}
            />
            <WeeklyBars rows={daily} metric={chartMetric} />
            {summary ? (
              <Text style={styles.chartFoot}>
                Trung bình: {CHART_META[chartMetric].format(summary.metrics[chartMetric]?.avg ?? 0)} ·{' '}
                {summary.metrics[chartMetric]?.daysWithData ?? 0}/{summary.days} ngày có dữ liệu
              </Text>
            ) : null}
          </Card>
        </>
      )}

      {/* ---------------- WHO comparison ---------------- */}
      {who ? (
        <WhoSection who={who} />
      ) : whoLoading ? (
        <>
          <SectionHeader title="So với khuyến nghị WHO" icon="shield-checkmark-outline" />
          <Card>
            <LoadingState message="Đang so sánh với khuyến nghị WHO..." />
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const METRIC_LABEL: Record<string, string> = {
  steps: 'Bước chân',
  caloriesBurned: 'Calo',
  activeMinutes: 'Phút vận động',
  sleep: 'Giấc ngủ',
  exercise: 'Bài tập',
};

/* ------------------------------------------------------------------ */
/* Weekly bar chart (thuần View, không cần thư viện)                    */
/* ------------------------------------------------------------------ */

const CHART_HEIGHT = 120;

const WeeklyBars = React.memo(function WeeklyBars({
  rows,
  metric,
}: {
  rows: HealthDailyRow[];
  metric: ChartMetric;
}) {
  const meta = CHART_META[metric];
  // Luôn đủ 7 cột; ngày không có dữ liệu hiển thị cột xám.
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const last7 = lastNDates(7).map(
    (date) =>
      byDate.get(date) ?? {
        date,
        steps: null,
        caloriesBurned: null,
        activeMinutes: null,
        moderateMinutes: null,
        vigorousMinutes: null,
        sleepMinutes: null,
      }
  );
  const max = Math.max(1, ...last7.map((r) => (r[metric] as number | null) ?? 0));
  const today = todayVN();

  return (
    <View style={styles.chart}>
      {last7.map((r) => {
        const v = (r[metric] as number | null) ?? null;
        const h = v ? Math.max(4, (v / max) * CHART_HEIGHT) : 4;
        const isToday = r.date === today;
        return (
          <View key={r.date} style={styles.barCol}>
            <Text style={styles.barValue} numberOfLines={1}>
              {v ? meta.format(v) : ''}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: h,
                    backgroundColor: v ? meta.color : COLORS.border,
                    opacity: isToday ? 1 : 0.65,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
              {weekdayLabel(r.date)}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

/* ------------------------------------------------------------------ */
/* WHO comparison                                                      */
/* ------------------------------------------------------------------ */

function GuidelineRow({
  title,
  icon,
  metric,
  unitLabel,
  color,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  metric: GuidelineMetric;
  unitLabel: string;
  color: string;
}) {
  const st = STATUS_META[metric.status] ?? STATUS_META.insufficient_data;
  const target = metric.target?.min ?? 0;
  const targetText =
    metric.target?.max != null ? `${metric.target.min}–${metric.target.max}` : `≥ ${target}`;

  return (
    <View style={styles.guideRow}>
      <View style={styles.guideHead}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.guideTitle} numberOfLines={1}>
          {title}
        </Text>
        <Badge label={st.label} tone={st.tone} />
      </View>
      <ScoreBar
        label={`Mục tiêu ${targetText} ${unitLabel}`}
        value={metric.actual ?? 0}
        max={Math.max(metric.target?.max ?? target, metric.actual ?? 0, 1)}
        color={color}
        valueText={metric.actual != null ? `${Math.round(metric.actual)} ${unitLabel}` : '—'}
        hint={
          metric.status === 'below' && metric.gap
            ? `Còn thiếu ${Math.round(metric.gap)} ${unitLabel}`
            : metric.measure?.estimated
              ? 'Ước tính từ dữ liệu chưa đầy đủ'
              : undefined
        }
      />
    </View>
  );
}

const WhoSection = React.memo(function WhoSection({ who }: { who: WhoComparison }) {
  const cmp = who.comparison;
  const sourceByKey = useMemo(() => {
    const map: Record<string, number> = {};
    who.sources.forEach((s, i) => (map[s.key] = i + 1));
    return map;
  }, [who.sources]);

  return (
    <>
      <SectionHeader title="So với khuyến nghị WHO" icon="shield-checkmark-outline" />
      <Card>
        {cmp.supported ? (
          <>
            <Text style={styles.whoGroup}>{cmp.label}</Text>
            <Text style={styles.whoWindow}>
              Dữ liệu {who.window.days} ngày ({who.window.from} → {who.window.to})
            </Text>
            <GuidelineRow
              title="Vận động aerobic"
              icon="heart"
              metric={cmp.aerobic}
              unitLabel="phút/tuần"
              color={METRIC_COLORS.activeMinutes}
            />
            <GuidelineRow
              title="Tập tăng cơ"
              icon="barbell"
              metric={cmp.strength}
              unitLabel="buổi/tuần"
              color={METRIC_COLORS.protein}
            />
            {cmp.balance ? (
              <GuidelineRow
                title="Thăng bằng"
                icon="body"
                metric={cmp.balance}
                unitLabel="buổi/tuần"
                color={METRIC_COLORS.readiness}
              />
            ) : null}
          </>
        ) : (
          <Notice tone="info" message={cmp.message} />
        )}
      </Card>

      {who.recommendations?.length ? (
        <>
          <SectionHeader title="Gợi ý cho bạn" icon="bulb-outline" />
          <Card style={styles.recCard}>
            {who.recommendations.map((r, idx) => (
              <View
                key={`${r.type}-${idx}`}
                style={[styles.recRow, idx > 0 && styles.recDivider]}
              >
                <View style={styles.recIcon}>
                  <Ionicons name={REC_ICON[r.type] ?? 'sparkles'} size={16} color={COLORS.primaryDark} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.recTitle}>
                    {r.title}
                    {r.sourceKeys?.length ? (
                      <Text style={styles.recCite}>
                        {' '}
                        {r.sourceKeys
                          .map((k) => sourceByKey[k])
                          .filter(Boolean)
                          .map((n) => `[${n}]`)
                          .join('')}
                      </Text>
                    ) : null}
                  </Text>
                  {r.exercises?.length ? (
                    <Text style={styles.recExercises} numberOfLines={2}>
                      Gợi ý: {r.exercises.slice(0, 3).map((e) => e.name).join(', ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {who.sources?.length ? (
        <>
          <SectionHeader title="Nguồn tham khảo" icon="library-outline" />
          <Card>
            {who.sources.map((s, i) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.sourceRow, i > 0 && styles.recDivider]}
                disabled={!s.url}
                onPress={() => s.url && RNLinking.openURL(s.url)}
              >
                <Text style={styles.sourceIndex}>[{i + 1}]</Text>
                <View style={styles.flex1}>
                  <Text style={styles.sourceTitle} numberOfLines={2}>
                    {s.title}
                  </Text>
                  <Text style={styles.sourceMeta} numberOfLines={1}>
                    {[s.org, s.year, s.section].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {s.url ? <Ionicons name="open-outline" size={16} color={COLORS.textMuted} /> : null}
              </TouchableOpacity>
            ))}
          </Card>
        </>
      ) : null}

      {who.disclaimer ? (
        <Notice tone="neutral" icon="information-circle-outline" message={who.disclaimer} style={styles.mt12} />
      ) : null}
    </>
  );
});

const REC_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  recover: 'bed',
  connect_data: 'link',
  aerobic: 'walk',
  aerobic_maintain: 'checkmark-done',
  strength: 'barbell',
  balance: 'body',
  steps_info: 'footsteps',
};

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  mt12: { marginTop: SPACING.sm + 4 },

  connectCard: { marginTop: SPACING.xs },
  connectRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 4 },
  googleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconOn: { backgroundColor: COLORS.primarySoft },
  connectTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  connectSub: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  metricChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm + 4 },
  connectActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  devLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    marginTop: SPACING.sm + 4,
  },
  devLinkText: { ...TYPOGRAPHY.small, color: COLORS.textMuted },

  statGrid: { flexDirection: 'row', gap: SPACING.sm + 4, marginBottom: SPACING.sm + 4 },

  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: 6,
  },
  barCol: { flex: 1, alignItems: 'center', minWidth: 0 },
  barValue: { ...TYPOGRAPHY.small, fontSize: 9, color: COLORS.textSecondary, marginBottom: 4 },
  barTrack: { height: CHART_HEIGHT, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '70%', maxWidth: 28, borderRadius: 6 },
  barLabel: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: 6 },
  barLabelToday: { color: COLORS.text, fontWeight: '700' },
  chartFoot: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.sm + 4 },

  whoGroup: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text },
  whoWindow: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 2 },
  guideRow: { marginTop: SPACING.md },
  guideHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  guideTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.text, flex: 1 },

  recCard: { paddingVertical: SPACING.xs },
  recRow: { flexDirection: 'row', gap: SPACING.sm + 4, paddingVertical: SPACING.sm + 4 },
  recDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  recIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTitle: { ...TYPOGRAPHY.body, color: COLORS.text },
  recCite: { ...TYPOGRAPHY.captionStrong, color: COLORS.secondary },
  recExercises: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },

  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm + 2 },
  sourceIndex: { ...TYPOGRAPHY.captionStrong, color: COLORS.secondary, width: 26 },
  sourceTitle: { ...TYPOGRAPHY.captionStrong, color: COLORS.text },
  sourceMeta: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: 2 },
});

export default HealthScreen;
