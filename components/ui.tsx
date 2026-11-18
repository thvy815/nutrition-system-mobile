/**
 * Bộ component UI dùng chung: header, nút, chip, ô chỉ số, thanh điểm,
 * bottom sheet và các trạng thái loading / empty / error.
 */
import React, { memo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/* ------------------------------------------------------------------ */
/* ScreenHeader                                                        */
/* ------------------------------------------------------------------ */

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ScreenHeader = memo(function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.headerText}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
});

export function IconButton({
  icon,
  onPress,
  color = COLORS.text,
  background = COLORS.surface,
  size = 20,
  accessibilityLabel,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  background?: string;
  size?: number;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.iconButton, { backgroundColor: background }]}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* SectionHeader                                                       */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  title,
  icon,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionLeft}>
        {icon ? <Ionicons name={icon} size={18} color={COLORS.primary} /> : null}
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'sm';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BUTTON_COLORS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: COLORS.primary, fg: COLORS.textInverse, border: COLORS.primary },
  secondary: { bg: COLORS.primarySoft, fg: COLORS.primaryDark, border: COLORS.primarySoft },
  outline: { bg: COLORS.surface, fg: COLORS.text, border: COLORS.border },
  ghost: { bg: 'transparent', fg: COLORS.primaryDark, border: 'transparent' },
  danger: { bg: COLORS.errorSoft, fg: COLORS.error, border: COLORS.errorSoft },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  size = 'md',
  fullWidth,
  style,
}: ButtonProps) {
  const c = BUTTON_COLORS[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      style={[
        styles.button,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: c.bg, borderColor: c.border },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={c.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={c.fg} /> : null}
          <Text
            style={[size === 'sm' ? styles.buttonTextSm : styles.buttonText, { color: c.fg }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Badge & Chip                                                        */
/* ------------------------------------------------------------------ */

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';

export const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: COLORS.successSoft, fg: COLORS.primaryDark },
  warning: { bg: COLORS.warningSoft, fg: '#B45309' },
  error: { bg: COLORS.errorSoft, fg: '#B91C1C' },
  info: { bg: COLORS.infoSoft, fg: '#1D4ED8' },
  neutral: { bg: COLORS.surfaceMuted, fg: COLORS.textSecondary },
  purple: { bg: COLORS.purpleSoft, fg: '#6D28D9' },
};

export function Badge({
  label,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  tone?: Tone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const c = TONE_COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={c.fg} /> : null}
      <Text style={[styles.badgeText, { color: c.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
      style={[styles.chip, selected && styles.chipSelected, style]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? COLORS.textInverse : COLORS.textSecondary}
        />
      ) : null}
      <Text
        style={[styles.chipText, selected && styles.chipTextSelected]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segmented, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            {opt.icon ? (
              <Ionicons
                name={opt.icon}
                size={16}
                color={active ? COLORS.primaryDark : COLORS.textSecondary}
              />
            ) : null}
            <Text
              style={[styles.segmentText, active && styles.segmentTextActive]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* StatTile                                                            */
/* ------------------------------------------------------------------ */

export const StatTile = memo(function StatTile({
  icon,
  label,
  value,
  unit,
  color = COLORS.primary,
  hint,
  style,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.stat, style]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      </View>
      {hint ? (
        <Text style={styles.statHint} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

/* ------------------------------------------------------------------ */
/* ScoreBar                                                            */
/* ------------------------------------------------------------------ */

export function ScoreBar({
  label,
  value,
  max = 10,
  color = COLORS.primary,
  valueText,
  hint,
  style,
}: {
  label: string;
  value: number | null | undefined;
  max?: number;
  color?: string;
  valueText?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const safe = typeof value === 'number' && isFinite(value) ? value : 0;
  const pct = Math.max(0, Math.min(1, max > 0 ? safe / max : 0));

  return (
    <View style={style}>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.scoreValue}>
          {valueText ?? (typeof value === 'number' ? `${value}/${max}` : '—')}
        </Text>
      </View>
      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      {hint ? <Text style={styles.scoreHint}>{hint}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* BottomSheet                                                         */
/* ------------------------------------------------------------------ */

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.md }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.flex1}>
              <Text style={styles.sheetTitle} numberOfLines={2}>
                {title}
              </Text>
              {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
            </View>
            <IconButton
              icon="close"
              onPress={onClose}
              background={COLORS.surfaceMuted}
              accessibilityLabel="Đóng"
            />
          </View>
          <ScrollView
            style={styles.sheetBody}
            contentContainerStyle={styles.sheetBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function LoadingState({ message = 'Đang tải...', style }: { message?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.state, style]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.state, style]}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={30} color={COLORS.textMuted} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {message ? <Text style={styles.stateText}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} size="sm" style={styles.stateAction} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  message = 'Có lỗi xảy ra. Vui lòng thử lại.',
  onRetry,
  style,
}: {
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.state, style]}>
      <View style={[styles.stateIcon, { backgroundColor: COLORS.errorSoft }]}>
        <Ionicons name="alert-circle-outline" size={30} color={COLORS.error} />
      </View>
      <Text style={styles.stateTitle}>Không tải được dữ liệu</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry ? (
        <Button
          title="Thử lại"
          icon="refresh"
          onPress={onRetry}
          variant="outline"
          size="sm"
          style={styles.stateAction}
        />
      ) : null}
    </View>
  );
}

/** Hộp thông báo nhỏ trong nội dung (info / warning / error / success). */
export function Notice({
  tone = 'info',
  icon,
  title,
  message,
  style,
  textStyle,
  children,
}: {
  tone?: Tone;
  icon?: IconName;
  title?: string;
  message?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}) {
  const c = TONE_COLORS[tone];
  const defaultIcon: IconName =
    tone === 'error'
      ? 'alert-circle'
      : tone === 'warning'
        ? 'warning'
        : tone === 'success'
          ? 'checkmark-circle'
          : 'information-circle';

  return (
    <View style={[styles.notice, { backgroundColor: c.bg }, style]}>
      <Ionicons name={icon ?? defaultIcon} size={18} color={c.fg} style={styles.noticeIcon} />
      <View style={styles.flex1}>
        {title ? <Text style={[styles.noticeTitle, { color: c.fg }]}>{title}</Text> : null}
        {message ? <Text style={[styles.noticeText, { color: c.fg }, textStyle]}>{message}</Text> : null}
        {children}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { ...TYPOGRAPHY.h1, color: COLORS.text },
  headerSubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },

  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2, flex: 1 },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, flexShrink: 1 },
  sectionAction: { ...TYPOGRAPHY.captionStrong, color: COLORS.primaryDark },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
    minHeight: 46,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  buttonSm: { minHeight: 36, paddingHorizontal: SPACING.sm + 4, borderRadius: BORDER_RADIUS.sm },
  buttonText: { ...TYPOGRAPHY.bodyStrong, flexShrink: 1 },
  buttonTextSm: { ...TYPOGRAPHY.captionStrong, flexShrink: 1 },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  badgeText: { ...TYPOGRAPHY.small, fontWeight: '600', flexShrink: 1 },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm - 1,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: '100%',
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { ...TYPOGRAPHY.captionStrong, color: COLORS.textSecondary, flexShrink: 1 },
  chipTextSelected: { color: COLORS.textInverse },

  segmented: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOWS.sm },
  segmentText: { ...TYPOGRAPHY.captionStrong, color: COLORS.textSecondary },
  segmentTextActive: { color: COLORS.primaryDark },

  stat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm + 4,
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 },
  statValue: { ...TYPOGRAPHY.h2, color: COLORS.text, flexShrink: 1 },
  statUnit: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  statHint: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: 2 },

  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: SPACING.sm },
  scoreLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, flex: 1 },
  scoreValue: { ...TYPOGRAPHY.captionStrong, color: COLORS.text },
  scoreTrack: {
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  scoreFill: { height: '100%', borderRadius: BORDER_RADIUS.full },
  scoreHint: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: 4 },

  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '88%',
    paddingTop: SPACING.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  sheetTitle: { ...TYPOGRAPHY.h2, color: COLORS.text },
  sheetSubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  sheetBody: { flexGrow: 0 },
  sheetBodyContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  sheetFooter: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },

  state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
    marginBottom: SPACING.xs,
  },
  stateTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, textAlign: 'center' },
  stateText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, textAlign: 'center' },
  stateAction: { marginTop: SPACING.sm },

  notice: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
  },
  noticeIcon: { marginTop: 1 },
  noticeTitle: { ...TYPOGRAPHY.captionStrong, marginBottom: 2 },
  noticeText: { ...TYPOGRAPHY.caption },
});
