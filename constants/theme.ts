/**
 * Design tokens dùng chung cho toàn app.
 * Mọi màn hình nên lấy màu / cỡ chữ / khoảng cách từ đây, không hard-code.
 */
export const COLORS = {
  primary: '#10B981',
  primaryDark: '#059669',
  primarySoft: '#D1FAE5',
  secondary: '#3B82F6',
  secondarySoft: '#DBEAFE',
  accent: '#F59E0B',
  accentSoft: '#FEF3C7',
  purple: '#8B5CF6',
  purpleSoft: '#EDE9FE',

  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',

  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  border: '#E5E7EB',
  divider: '#F3F4F6',
  overlay: 'rgba(17, 24, 39, 0.45)',

  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  error: '#EF4444',
  errorSoft: '#FEE2E2',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',
} as const;

/** Màu cho từng chỉ số sức khỏe / dinh dưỡng – dùng thống nhất ở mọi màn. */
export const METRIC_COLORS = {
  calories: '#F97316',
  protein: '#3B82F6',
  carbs: '#F59E0B',
  fat: '#EF4444',
  steps: '#10B981',
  activeMinutes: '#8B5CF6',
  sleep: '#6366F1',
  fatigue: '#EF4444',
  recovery: '#10B981',
  performance: '#3B82F6',
  readiness: '#F59E0B',
} as const;

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** Thang chữ thống nhất. */
export const TYPOGRAPHY = {
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionStrong: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

/** Khoảng trống cuối nội dung để không bị tab bar che. */
export const BOTTOM_SPACER = 32;
